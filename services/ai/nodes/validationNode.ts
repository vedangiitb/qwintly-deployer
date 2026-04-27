import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../logger/logger.service.js";
import { buildDeploy } from "../../buildProject.service.js";
import { parseValidationErrors } from "../../../utils/parseErrors.js";
import { DeployerNode } from "../graph/graph.js";

export const validationNode: DeployerNode = async (state) => {
  const ctx = getJobContext();
  const attempt = (state.iteration ?? 0) + 1;
  logger.status(`Validating build & deploy (attempt ${attempt})…`, {
    phase: "validate",
    iteration: state.iteration ?? 0,
  });
  const result = await buildDeploy(ctx);

  if (result.ok) {
    logger.status("Build & deploy succeeded", { phase: "validate" });
    logger.info("Build & deploy succeeded");
    return {
      lastBuildOk: true,
      lastBuildLogs: undefined,
      unrecoverableError: undefined,
      validationErrors: [],
    };
  }

  if (!result.logs) {
    const msg = "Failed to fetch logs from failed build";
    logger.status(`Build failed: ${msg}`, { phase: "failed" });
    logger.error(msg);
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
    logger.status(`Build failed: ${msg}`, { phase: "failed" });
    logger.error(msg, { attempt });
    return {
      lastBuildOk: false,
      lastBuildLogs: result.logs,
      unrecoverableError: msg,
      validationErrors: [],
    };
  }

  logger.status(`Build failed with ${errors.length} issue(s)`, {
    phase: "validate",
    progress: { current: errors.length, total: errors.length, unit: "issues" },
    iteration: state.iteration ?? 0,
  });
  logger.warn("Build failed with validation errors", {
    count: errors.length,
    attempt,
  });
  return {
    lastBuildOk: false,
    lastBuildLogs: result.logs,
    unrecoverableError: undefined,
    validationErrors: errors,
  };
};
