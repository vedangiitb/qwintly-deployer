import { CloudBuildClient } from "@google-cloud/cloudbuild";
import { JobContext } from "../job/jobContext.js";

const cloudBuild = new CloudBuildClient();

export async function buildProject(ctx: JobContext) {
  const serviceName = `site-${ctx.sessionId}`;

  const bucketName = ctx.snapshotBucket;
  const objectName = `projects/${ctx.sessionId}.zip`;

  const [operation] = await cloudBuild.createBuild({
    projectId: ctx.targetProjectId,
    build: {
      source: {
        storageSource: {
          bucket: bucketName,
          object: objectName,
        },
      },

      substitutions: {
        _SERVICE_NAME: serviceName,
        _REGION: "asia-south1",
      },
    },
  });

  console.log("Cloud Build triggered:", operation.name);
}
