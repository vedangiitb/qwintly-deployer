import { ProjectPathConstants } from "../data/project.constants.js";
import { createFolder, removeFolder } from "../infra/fs/workspace.js";
import { extractZip } from "../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../infra/gcs/download.js";
import { getJobContext } from "../job/jobContext.js";
import { logger } from "./logger/logger.service.js";

export async function cloneSnapshot() {
  const ctx = getJobContext();
  const workspacePath = ctx.workspace;
  const chatId = ctx.chatId;

  const bucketName = ctx.snapshotBucket!;
  const zipPath = ProjectPathConstants(chatId).snapShotPath;
  const tmpZipPath = ProjectPathConstants(chatId).tmpZipPath;

  logger.info(
    `Cloning template "${zipPath}" from bucket "${bucketName}" into "${workspacePath}")`,
  );

  await createFolder(workspacePath);

  try {
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  logger.info(`Template ready at "${workspacePath}"`);
}
