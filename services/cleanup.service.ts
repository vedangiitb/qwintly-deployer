import { removeFile, removeFolder } from "@vedangiitb/qwintly-core";
import { JobContext } from "../job/jobContext.js";
import { registerCleanupUtil } from "../utils/gracefulShutdown.js";

export const registerCleanup = (ctx: JobContext) => {
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      console.info("Workspace removed: " + workspace);
    } catch (e) {
      console.warn("Failed to remove workspace: " + e);
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
    } catch (e) {
      console.error("Error occured while cleaning up zip file");
    }
  });
};
