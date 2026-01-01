import { createFolder, removeFolder } from "../infra/fs/workspace.js";
import { extractZip } from "../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../infra/gcs/download.js";
import { JobContext } from "../job/jobContext.js";

export async function cloneSnapshot(ctx: JobContext) {
  const workspacePath = ctx.workspace;
  const sessionId = ctx.sessionId;
  // const snapshotZipPath = `projects/${sessionId}.zip`;
  const snapshotBucket = ctx.snapshotBucket;
  const snapshotZipPath = "template-v1.zip";
  console.log(`Fetching template from GCS into ${workspacePath}`);

  await createFolder(workspacePath);

  const tmpZipPath = `/tmp/snapshot_${sessionId}.zip`;

  try {
    await downloadToDestinationGCS(tmpZipPath, snapshotZipPath, snapshotBucket);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  console.log(`Template ready at ${workspacePath}`);
}
