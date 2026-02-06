import { CloudBuildClient } from "@google-cloud/cloudbuild";
import { JobContext } from "../job/jobContext.js";
import { CodeIndex } from "../types/index/codeIndex.js";
import { ValidatorAgentHistory } from "../types/validatorAgentHistory.js";
import { parseValidationErrors } from "../utils/parseErrors.js";
import { fetchCodeIndex } from "./fetchCodeIndex.service.js";
import { fetchBuildLogs } from "./fetchLogs.service.js";
import { uploadProjectSnapshot } from "./snapshot/uploadSnapshot.service.js";
import { validatorAgent } from "./validator/validatorAgent.service.js";
import { zipProject } from "./zipProject.service.js";

const MAX_RETRIES = 3;

export async function deployWithRepair(
  ctx: JobContext,
  codeIndex: CodeIndex | undefined
) {
  if (!codeIndex) throw new Error("Failed to load codeindex.");
  const globalHistory: ValidatorAgentHistory = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await buildDeploy(ctx);

    if (result.ok) {
      console.log("Build & deploy succeeded");
      return;
    }

    console.log(`Build failed (attempt ${attempt})`);

    if (!result.logs) {
      const msg = "Failed to fetch logs from failed build";
      if (attempt >= MAX_RETRIES) throw new Error(msg);
      console.warn(`${msg}; retrying...`);
      continue;
    }

    const errors = parseValidationErrors(result.logs);

    console.log(errors);

    if (!errors || errors.length === 0) {
      const msg = "Build failed, but no ESLint/TS errors detected";
      if (attempt >= MAX_RETRIES) throw new Error(msg);
      console.warn(`${msg}; retrying without repair...`);
      continue;
    }

    const newHistory = await validatorAgent(
      ctx,
      errors,
      globalHistory,
      codeIndex
    );

    globalHistory.push(...newHistory);

    await zipProject(ctx);

    await uploadProjectSnapshot(ctx);

    codeIndex = await fetchCodeIndex(ctx);
  }

  throw new Error("Exceeded max repair attempts");
}

const cloudBuild = new CloudBuildClient();

export async function buildDeploy(ctx: JobContext) {
  const bucketName = ctx.snapshotBucket;
  const objectName = `projects/${ctx.sessionId}.zip`;

  // const objectName = "template-v1.zip";

  const image = `gcr.io/${ctx.targetProjectId}/site-${ctx.sessionId}`;
  const serviceName = `site-${ctx.sessionId}`;

  const domain = `project-${ctx.sessionId}.projects.qwintly.com`;

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
    console.error("Cloud Build threw:", err);
  }
  const logs = await fetchBuildLogs(buildId, ctx);

  return { ok: false, logs };
}
