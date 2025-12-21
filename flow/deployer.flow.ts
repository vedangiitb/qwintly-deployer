import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { buildDeploy } from "../services/buildProject.service.js";
import { getProjectDetails } from "../services/getProjectDetails.service.js";
import { makeServicePublic } from "../services/makePublic.service.js";
import { sendLog } from "../utils/logger.js";

export async function deployerFlow(ctx: JobContext) {
  await step(ctx, "Building Project", () => buildDeploy(ctx), {
    retries: 0,
  });

  await step(ctx, "Updating Access Poilicies", () => makeServicePublic(ctx), {
    retries: 0,
  });

  await step(ctx, "Sending Details to UI", () => getProjectDetails(ctx), {
    retries: 0,
  });

  sendLog("SUCCESS");
}
