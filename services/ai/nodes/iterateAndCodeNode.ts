import {
  codegenTools,
  createWorkspaceToolImpls,
  runToolLoop,
} from "qwintly-ai-core";
import { aiResponse } from "../../../infra/ai/gemini.client.js";
import { getJobContext } from "../../../job/jobContext.js";
import { uploadProjectSnapshot } from "../../snapshot/uploadSnapshot.service.js";
import { zipProject } from "../../zipProject.service.js";
import { DeployerNode } from "../graph/graph.js";
import { createAiCoreWorkspaceDeps } from "../helpers/aiCoreDeps.js";
import { buildCodegenIndex } from "../indexer/buildCodegenIndex.js";
import { codegenNodePrompt } from "../prompts/codegenNodePrompt.js";
import { formatDurationMs } from "../../../utils/formatDuration.js";
import { withStatusHeartbeat } from "../../../utils/withStatusHeartbeat.js";

export function makeIterateAndCodeNode(requestType: string): DeployerNode {
  return async (state) => {
    const ctx = getJobContext();

    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];

    const deps = createAiCoreWorkspaceDeps();
    const { readFileImpl, writeFileImpl, applyPatchImpl } =
      createWorkspaceToolImpls(deps);

    const isNewProject = String(requestType ?? "").toUpperCase() === "NEW";

    const tasks = state.plannerTasks ?? [];
    const totalTasks = tasks.length;

    if (totalTasks > 0) {
      deps.logger.status(`AI: Starting fixes (${totalTasks} tasks)`, {
        phase: "ai_codegen",
        iteration,
        progress: { current: 0, total: totalTasks, unit: "tasks" },
      });
    }

    let taskIndex = 0;
    for (const task of tasks) {
      taskIndex += 1;
      deps.logger.status(
        `AI: Implementing fix ${taskIndex}/${totalTasks} — “${task.description}”`,
        {
          phase: "ai_codegen",
          iteration,
          progress: { current: taskIndex, total: totalTasks, unit: "tasks" },
        },
      );
      const taskStartedAt = Date.now();
      const codegenIndex = await buildCodegenIndex();
      if (!codegenIndex) throw new Error("Could not build codegen index");

      const targetSnapshots: Array<{ path: string; content: string }> = [];
      for (const target of task.targets ?? []) {
        try {
          const content = await readFileImpl(target, 1, 200);
          targetSnapshots.push({ path: target, content });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          targetSnapshots.push({
            path: target,
            content: `read_file failed: ${message}`,
          });
        }
      }

      const snapshotBlock =
        targetSnapshots.length > 0
          ? `\n\nTARGET FILE SNAPSHOTS (first 200 lines):\n${targetSnapshots
              .map(
                (s) =>
                  `--- ${s.path} ---\n${s.content}\n--- end ${s.path} ---\n`,
              )
              .join("\n")}`
          : "";

      const prompt = codegenNodePrompt({
        task,
        codegenIndex,
        collectedContext: {},
        isNewProject,
      }).concat(snapshotBlock);

      await withStatusHeartbeat(
        () =>
          runToolLoop({
            initialContents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: codegenTools(),
            aiCall: aiResponse as any,
            logger: deps.logger,
            handlers: {
              read_file: async (args) => {
                const path = String(args.path ?? "");
                const startLine =
                  args.start_line === undefined
                    ? undefined
                    : Number(args.start_line);
                const endLine =
                  args.end_line === undefined
                    ? undefined
                    : Number(args.end_line);

                const content = await readFileImpl(path, startLine, endLine);
                return { path, content };
              },
              write_file: async (args) => {
                const path = String(args.path ?? "");
                const content = String(args.content ?? "");
                return await writeFileImpl(path, content);
              },
              apply_patch: async (args) => {
                const patchString = String(args.patch_string ?? "");
                const result = await applyPatchImpl(patchString);

                if ((result as any)?.success !== false) return result;

                const error = String((result as any)?.error ?? "");
                const filePathMatches = Array.from(
                  error.matchAll(
                    /(?:Update|Add|Delete) File failed for \"([^\"]+)\"/g,
                  ),
                ).map((m) => m[1]);

                const uniquePaths = Array.from(new Set(filePathMatches)).slice(
                  0,
                  3,
                );
                const debugFiles: Array<{ path: string; head: string }> = [];

                for (const filePath of uniquePaths) {
                  try {
                    const head = await readFileImpl(filePath, 1, 200);
                    debugFiles.push({ path: filePath, head });
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : String(err);
                    debugFiles.push({
                      path: filePath,
                      head: `read_file failed: ${message}`,
                    });
                  }
                }

                return {
                  ...result,
                  debug: {
                    files: debugFiles,
                    hint:
                      "apply_patch failed because the expected context didn't match the current file. " +
                      "Regenerate the patch from the snapshots above; for large rewrites, use Delete+Add instead of Update.",
                  },
                };
              },
              submit_codegen_done: async (args) => {
                return {
                  success: true,
                  summary: String(args.summary ?? "").trim(),
                };
              },
            },
            maxSteps: 25,
            terminalToolNames: ["submit_codegen_done"],
            applyPatchAutoRetryMax: 2,
          }),
        {
          intervalMs: 30_000,
          meta: {
            phase: "ai_codegen",
            iteration,
            progress: { current: taskIndex, total: totalTasks, unit: "tasks" },
          },
          message: (elapsedMs) =>
            `AI: Implementing fix ${taskIndex}/${totalTasks} — “${task.description}” (${formatDurationMs(
              elapsedMs,
            )} elapsed)`,
        },
      );

      for (const target of task.targets ?? []) {
        history.push({ file: target, fix: task.description });
      }

      const taskElapsedMs = Date.now() - taskStartedAt;
      deps.logger.status(
        `AI: Done fix ${taskIndex}/${totalTasks} (${formatDurationMs(taskElapsedMs)})`,
        {
          phase: "ai_codegen",
          iteration,
          elapsedMs: taskElapsedMs,
          progress: { current: taskIndex, total: totalTasks, unit: "tasks" },
        },
      );
      deps.logger.info("Completed planner task", {
        iteration,
        taskIndex,
        totalTasks,
        description: task.description,
        elapsedMs: taskElapsedMs,
      });
    }

    const zipStartedAt = Date.now();
    deps.logger.status("Zipping project snapshot…", { phase: "zip", iteration });
    await withStatusHeartbeat(
      () => zipProject(ctx),
      {
        intervalMs: 30_000,
        meta: { phase: "zip", iteration },
        message: (elapsedMs) =>
          `Zipping project snapshot… (${formatDurationMs(elapsedMs)} elapsed)`,
      },
    );
    deps.logger.status(
      `Done zipping (${formatDurationMs(Date.now() - zipStartedAt)})`,
      { phase: "zip", iteration },
    );

    const uploadStartedAt = Date.now();
    deps.logger.status("Uploading snapshot…", { phase: "upload", iteration });
    await withStatusHeartbeat(
      () => uploadProjectSnapshot(ctx),
      {
        intervalMs: 30_000,
        meta: { phase: "upload", iteration },
        message: (elapsedMs) =>
          `Uploading snapshot… (${formatDurationMs(elapsedMs)} elapsed)`,
      },
    );
    deps.logger.status(
      `Done uploading (${formatDurationMs(Date.now() - uploadStartedAt)})`,
      { phase: "upload", iteration },
    );

    return { iteration, validationFixHistory: history };
  };
}
