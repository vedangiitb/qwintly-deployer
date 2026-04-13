import { CloudBuildClient } from "@google-cloud/cloudbuild";
import { getJobContext, JobContext } from "../job/jobContext.js";
import { CodeIndex } from "../types/index/codeIndex.js";
import { fetchBuildLogs } from "./fetchLogs.service.js";
import { logger } from "./logger/logger.service.js";
import { runDeployerRepairFlow } from "./ai/runDeployerRepairFlow.js";

export async function deployWithRepair(codeIndex: CodeIndex | undefined) {
  if (!codeIndex) throw new Error("Failed to load codeindex.");

  const result = await runDeployerRepairFlow();

  if (result.lastBuildOk) {
    logger.info("Build & deploy succeeded");
    return;
  }

  if (result.unrecoverableError) {
    throw new Error(result.unrecoverableError);
  }

  const remaining = result.validationErrors ?? [];
  const top = remaining
    .slice(0, 5)
    .map((e) => `${e.type} ${e.filePath ?? ""}: ${e.message}`)
    .join("\n\n");

  throw new Error(
    `Exceeded max repair attempts. Remaining errors (${remaining.length}):\n${top}`,
  );
}

const cloudBuild = new CloudBuildClient();

export async function buildDeploy(ctx: JobContext) {
  const bucketName = ctx.snapshotBucket;
  const objectName = `projects/${ctx.chatId}.zip`;

  // const objectName = "template-v1.zip";

  // const image = `gcr.io/${ctx.targetProjectId}/site-${ctx.chatId}`;
  const image = `asia-south1-docker.pkg.dev/${ctx.targetProjectId}/generated-sites/site-${ctx.chatId}`;
  const serviceName = `site-${ctx.chatId}`;

  if (
    !process.env.GEN_SITES_BUILD_SA ||
    !process.env.GEN_SITES_RUNTIME_SA ||
    !process.env.GEN_SITES_PROJECT_ID
  ) {
    throw new Error("Missing required env vars for Gen sites project");
  }

  const buildSA = `projects/${process.env.GEN_SITES_PROJECT_ID}/serviceAccounts/${process.env.GEN_SITES_BUILD_SA}`;
  const runSA = process.env.GEN_SITES_RUNTIME_SA;

  const [operation] = await cloudBuild.createBuild({
    projectId: ctx.targetProjectId,
    build: {
      source: {
        storageSource: {
          bucket: bucketName,
          object: objectName,
        },
      },
      serviceAccount: buildSA,
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
            "--service-account",
            runSA,
          ],
        },
      ],
      options: {
        logging: "CLOUD_LOGGING_ONLY",
      },
      images: [image],
    },
  });

  const buildId = (operation.metadata as any)?.build?.id;

  if (!buildId) {
    throw new Error("Failed to extract buildId from operation metadata");
  }

  try {
    const [buildResult] = await operation.promise();
    console.log(buildResult);

    if (buildResult.status === 3) {
      return { ok: true };
    }

    const logs = await fetchBuildLogs(buildId, ctx);

    return { ok: false, logs };
  } catch (err: any) {
    logger.error(`Cloud Build threw: ${err.message}`);
  }
  const logs = await fetchBuildLogs(buildId, ctx);

  return { ok: false, logs };
}
