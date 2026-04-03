import { removeFile, removeFolder } from "../infra/fs/workspace.js";
import { JobContext } from "../job/jobContext.js";
import { registerCleanupUtil } from "../utils/gracefulShutdown.js";
import { logger } from "./logger/logger.service.js";

export const registerCleanup = (ctx: JobContext) => {
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      logger.info("Workspace removed: " + workspace);
    } catch (e) {
      logger.warn("Failed to remove workspace: " + e);
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
    } catch (e) {
      logger.error("Error occured while cleaning up zip file");
    }
  });
};
