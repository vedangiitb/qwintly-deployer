import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../logger/logger.service.js";
import { buildDeploy } from "../../buildProject.service.js";
import { parseValidationErrors } from "../../../utils/parseErrors.js";
import { DeployerNode } from "../graph/graph.js";

export const validationNode: DeployerNode = async () => {
  const ctx = getJobContext();
  const result = await buildDeploy(ctx);

  if (result.ok) {
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
    logger.error(msg);
    return {
      lastBuildOk: false,
      lastBuildLogs: result.logs,
      unrecoverableError: msg,
      validationErrors: [],
    };
  }

  logger.info(`Build failed with ${errors.length} validation errors`);
  return {
    lastBuildOk: false,
    lastBuildLogs: result.logs,
    unrecoverableError: undefined,
    validationErrors: errors,
  };
};

