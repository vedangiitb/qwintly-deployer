import { ProjectPathConstants } from "../data/project.constants.js";
import { createFolder, removeFolder } from "../infra/fs/workspace.js";
import { extractZip } from "../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../infra/gcs/download.js";
import { JobContext } from "../job/jobContext.js";
import { logger } from "../utils/logger.js";

export async function cloneSnapshot(ctx: JobContext) {
  const workspacePath = ctx.workspace;
  const sessionId = ctx.sessionId;

  const bucketName = ctx.snapshotBucket!;
  const zipPath = ProjectPathConstants(sessionId).snapShotPath;
  const tmpZipPath = ProjectPathConstants(sessionId).tmpZipPath;

  logger.info("Fetching template", {
    zipPath,
    bucketName,
    workspacePath,
  });

  await createFolder(workspacePath);

  try {
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    logger.error("Failed to load template from GCS", {
      zipPath,
      bucketName,
      workspacePath,
      err,
    });
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  logger.info("Template ready", { workspacePath });
}
