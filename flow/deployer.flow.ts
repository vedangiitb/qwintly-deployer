import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { buildProject } from "../services/buildProject.service.js";
import { cloneSnapshot } from "../services/cloneSnapshot.service.js";
import { deployProject } from "../services/deployProject.service.js";
import { sendLog } from "../utils/logger.js";

export async function deployerFlow(ctx: JobContext) {
  await step(ctx, "Deployer Cloning Snapshot", () => cloneSnapshot(ctx), {
    retries: 1,
  });

  await step(ctx, "Building Project", () => buildProject(ctx), {
    retries: 1,
  });

  await step(ctx, "Deploying Project", () => deployProject(ctx), {
    retries: 1,
  });

  sendLog("SUCCESS");
}
