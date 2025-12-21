import { CloudBuildClient } from "@google-cloud/cloudbuild";
import { JobContext } from "../job/jobContext.js";

const cloudBuild = new CloudBuildClient();

export async function buildDeploy(ctx: JobContext) {
  const bucketName = ctx.snapshotBucket;
  const objectName = `projects/${ctx.sessionId}.zip`;

  const image = `gcr.io/${ctx.targetProjectId}/site-${ctx.sessionId}`;
  const serviceName = `site-${ctx.sessionId}`;

  const [operation] = await cloudBuild.createBuild({
    projectId: ctx.targetProjectId,
    build: {
      source: {
        storageSource: {
          bucket: bucketName,
          object: objectName,
        },
      },
      steps: [
        {
          name: "gcr.io/cloud-builders/docker",
          args: ["build", "-t", image, "."],
        },

        {
          name: "gcr.io/cloud-builders/docker",
          args: ["push", image],
        },
        {
          name: "gcr.io/cloud-builders/gcloud",
          args: [
            "run",
            "deploy",
            serviceName,
            "--region",
            "asia-south1",
            "--image",
            image,
            "--platform",
            "managed",
            "--allow-unauthenticated",
          ],
        },
      ],
      images: [image],
    },
  });

  const [buildResult] = await operation.promise();

  if (buildResult.status !== 3) {
    throw new Error(`Build failed with status: ${buildResult.status}`);
  }

  console.log("Cloud Build triggered:", operation.name);
}
