import { execSync } from "child_process";
import { JobContext } from "../job/jobContext.js";
import { sendLog } from "../utils/logger.js";

export async function deployProject(ctx: JobContext) {
  const serviceName = `site-${ctx.sessionId}`;

  const url = execSync(
    `gcloud run services describe ${serviceName} \
      --project ${ctx.targetProjectId} \
      --region asia-south1 \
      --format="value(status.url)"`,
    { encoding: "utf-8" }
  ).trim();

  sendLog(`DEPLOYED_URL=${url}`);
}
