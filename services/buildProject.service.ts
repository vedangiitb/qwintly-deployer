import { execSync } from "child_process";
import { JobContext } from "../job/jobContext.js";

export async function buildProject(ctx: JobContext) {
  const serviceName = `site-${ctx.sessionId}`;

  const cmd = `
    gcloud builds submit ${ctx.workspace} \
      --project ${ctx.targetProjectId} \
      --substitutions=_SERVICE_NAME=${serviceName},_REGION=asia-south1
  `;

  execSync(cmd, { stdio: "inherit" });
}
