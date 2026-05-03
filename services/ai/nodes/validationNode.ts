import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../../job/jobContext.js";
import { parseValidationErrors } from "../../../utils/parseErrors.js";
import { buildDeploy } from "../../buildProject.service.js";
import { getQwintlyCore } from "../../core/qwintlyCore.service.js";
import { DeployerNode } from "../graph/graph.js";

export const validationNode: DeployerNode = async (state) => {
  const core = await getQwintlyCore();
  const ctx = getJobContext();
  const attempt = (state.iteration ?? 0) + 1;
  await core.streamLog(
    `Validating build & deploy (attempt ${attempt})…`,
    EVENT_TYPES.STEP_STARTED,
  );
  const result = await buildDeploy(ctx);

  if (result.ok) {
    await core.streamLog("Build & deploy succeeded", EVENT_TYPES.STEP_FINISHED);
    console.info("Build & deploy succeeded");
    return {
      lastBuildOk: true,
      lastBuildLogs: undefined,
      unrecoverableError: undefined,
      validationErrors: [],
    };
  }

  if (!result.logs) {
    const msg = "Failed to fetch logs from failed build";
    await core.streamLog(`Build failed: ${msg}`, EVENT_TYPES.STEP_ERROR);
    console.error(msg);
    return {
      lastBuildOk: false,
      lastBuildLogs: undefined,
      unrecoverableError: msg,
      validationErrors: [],
    };
  }

  const errors = parseValidationErrors(result.logs);

  if (!errors || errors.length === 0) {
    const msg = "Build failed, but no ESLint/TS/Next errors detected";
    await core.streamLog(`Build failed: ${msg}`, EVENT_TYPES.STEP_ERROR);
    console.error(msg, { attempt });
    return {
      lastBuildOk: false,
      lastBuildLogs: result.logs,
      unrecoverableError: msg,
      validationErrors: [],
    };
  }

  await core.streamLog(
    `Build failed with ${errors.length} issue(s)`,
    EVENT_TYPES.STEP_ERROR,
  );
  console.warn("Build failed with validation errors", {
    count: errors.length,
    attempt,
  });

  console.group(`Validation errors (${errors.length})`);
  console.table(
    errors.map((e, i) => ({
      "#": i + 1,
      type: e.type,
      filePath: e.filePath ?? "",
      summary: e.message.split("\n")[0] ?? "",
    })),
  );
  for (const [i, e] of errors.entries()) {
    console.group(`${i + 1}. [${e.type}] ${e.filePath ?? "unknown"}`);
    console.log(e.message);
    console.groupEnd();
  }
  console.groupEnd();
  return {
    lastBuildOk: false,
    lastBuildLogs: result.logs,
    unrecoverableError: undefined,
    validationErrors: errors,
  };
};
