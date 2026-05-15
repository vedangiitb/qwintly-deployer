import {
  codegenPrompt,
  codegenTools,
  createWorkspaceToolImpls,
  EVENT_TYPES,
} from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../../job/jobContext.js";
import { formatDurationMs } from "../../../utils/formatDuration.js";
import { withStatusHeartbeat } from "../../../utils/withStatusHeartbeat.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { uploadProjectSnapshot } from "../../snapshot/uploadSnapshot.service.js";
import { zipProject } from "../../zipProject.service.js";
import { DeployerNode } from "../graph/graph.js";
import { createWorkspaceDeps } from "../helpers/aiCoreDeps.js";

export function makeIterateAndCodeNode(): DeployerNode {
  return async (state) => {
    const core = await getQwintlyCore();
    const ctx = getJobContext();
    const iteration = (state.iteration ?? 0) + 1;
    const history = [...(state.validationFixHistory ?? [])];

    const deps = createWorkspaceDeps();
    const {
      readFileImpl,
      createNewRouteImpl,
      insertElementImpl,
      deleteElementImpl,
      updatePropsImpl,
      updateClassNameImpl,
    } = createWorkspaceToolImpls(deps);

    const isNewProject = false;

    const tasks = state.plannerTasks ?? [];
    const totalTasks = tasks.length;

    if (totalTasks > 0) {
      await core.streamLog(
        `AI: Starting fixes (${totalTasks} tasks)`,
        EVENT_TYPES.STEP_STARTED,
      );
    }

    let taskIndex = 0;
    for (const task of tasks) {
      taskIndex += 1;
      await core.streamLog(
        `AI: Implementing fix ${taskIndex}/${totalTasks} — “${task.description}”`,
        EVENT_TYPES.STEP_STARTED,
      );
      const taskStartedAt = Date.now();
      const codegenIndex = await core.buildCodegenIdx();
      if (!codegenIndex) throw new Error("Could not build codegen index");

      const prompt = codegenPrompt({
        task,
        codegenIndex,
        collectedContext: state.collectedContext,
        isNewProject,
      });

      await withStatusHeartbeat(
        () =>
          core.runAiFlow(
            [{ role: "user", parts: [{ text: prompt }] }],
            codegenTools(),
            {
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
              create_new_route: async (args) => {
                const parentRoute = String(args.parent_route ?? "");
                const routeName = String(args.route_name ?? "");
                const result = await createNewRouteImpl(parentRoute, routeName);
                return { result };
              },
              insert_element: async (args) => {
                const route = String(args.route ?? "");
                const parent_id = String(args.parent_id ?? "");
                const element: any = args.element;
                const result = await insertElementImpl(
                  route,
                  parent_id,
                  element,
                );
                return { result };
              },
              delete_element: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const result = await deleteElementImpl(route, element_id);
                return { result };
              },
              update_props: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const props: any = args.props;
                const result = await updatePropsImpl({
                  route,
                  element_id,
                  ...props,
                });
                return { result };
              },
              update_class_name: async (args) => {
                const route = String(args.route ?? "");
                const element_id = String(args.element_id ?? "");
                const class_name = String(args.class_name ?? "");
                const result = await updateClassNameImpl(
                  route,
                  element_id,
                  class_name,
                );
                return { result };
              },
              submit_codegen_done: async (args) => {
                return {
                  success: true,
                  summary: String(args.summary ?? "").trim(),
                };
              },
            },
            30,
            ["submit_codegen_done"],
          ),
        {
          intervalMs: 30_000,
          eventType: EVENT_TYPES.STEP_STARTED,
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
      await core.streamLog(
        `AI: Done fix ${taskIndex}/${totalTasks} (${formatDurationMs(taskElapsedMs)})`,
        EVENT_TYPES.STEP_FINISHED,
        true,
      );
      await core.streamLog("Completed planner task", EVENT_TYPES.STEP_FINISHED);
    }

    const zipStartedAt = Date.now();
    await core.streamLog("Zipping project snapshot…", EVENT_TYPES.STEP_STARTED);
    await withStatusHeartbeat(() => zipProject(ctx), {
      intervalMs: 30_000,
      eventType: EVENT_TYPES.STEP_STARTED,
      message: (elapsedMs) =>
        `Zipping project snapshot… (${formatDurationMs(elapsedMs)} elapsed)`,
    });
    await core.streamLog(
      `Done zipping (${formatDurationMs(Date.now() - zipStartedAt)})`,
      EVENT_TYPES.STEP_FINISHED,
    );

    const uploadStartedAt = Date.now();
    await core.streamLog("Uploading snapshot…", EVENT_TYPES.STEP_STARTED);
    await withStatusHeartbeat(() => uploadProjectSnapshot(ctx), {
      intervalMs: 30_000,
      eventType: EVENT_TYPES.STEP_STARTED,
      message: (elapsedMs) =>
        `Uploading snapshot… (${formatDurationMs(elapsedMs)} elapsed)`,
    });
    await core.streamLog(
      `Done uploading (${formatDurationMs(Date.now() - uploadStartedAt)})`,
      EVENT_TYPES.STEP_FINISHED,
    );

    return { iteration, validationFixHistory: history };
  };
}
