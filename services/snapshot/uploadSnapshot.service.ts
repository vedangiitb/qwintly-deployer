import { uploadFileToGCS } from "../../infra/gcs/upload.js";
import { JobContext } from "../../job/jobContext.js";

export async function uploadProjectSnapshot(ctx: JobContext) {
  const zipPath = ctx.zipPath;
  const bucketName = ctx.snapshotBucket;
  const projectId = ctx.targetProjectId;
  const destination = ctx.snapShotPath;
  console.info(
    `Uploading project snapshot "${zipPath}" to bucket "${bucketName}" at "${destination}" (projectId="${projectId}")`,
  );
  if (!projectId || !bucketName) throw new Error("Missing required env vars");

  try {
    await uploadFileToGCS(projectId, zipPath, bucketName, destination);
  } catch (e) {
    throw new Error(`Failed to upload project to GCS: ${e}`);
  }
}
