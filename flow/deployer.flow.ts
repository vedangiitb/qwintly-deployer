import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { deployWithRepair } from "../services/buildProject.service.js";
import { cloneSnapshot } from "../services/cloneSnapshot.service.js";
import { fetchCodeIndex } from "../services/fetchCodeIndex.service.js";
import { getProjectDetails } from "../services/getProjectDetails.service.js";
import { updateCodeIndex } from "../services/indexer/updateCodeIndex.service.js";
import { makeServicePublic } from "../services/makePublic.service.js";
import { sendLog } from "../utils/logger.js";

export async function deployerFlow(ctx: JobContext) {
  await step(ctx, "Cloning Project Snapshot", () => cloneSnapshot(ctx), {
    retries: 0,
  });

  let codeIndex = await step(
    ctx,
    "Loading Updated Code Index",
    () => fetchCodeIndex(ctx),
    {
      retries: 2,
    }
  );

  await step(ctx, "Building Project", () => deployWithRepair(ctx, codeIndex), {
    retries: 0,
  });

  codeIndex = await step(
    ctx,
    "Loading Updated Code Index",
    () => fetchCodeIndex(ctx),
    {
      retries: 2,
    }
  );

  await step(
    ctx,
    "Updating code index",
    () => updateCodeIndex(ctx, codeIndex),
    {
      retries: 1,
    }
  );

  await step(ctx, "Updating Access Poilicies", () => makeServicePublic(ctx), {
    retries: 1,
  });

  await step(ctx, "Sending Details to UI", () => getProjectDetails(ctx), {
    retries: 1,
  });

  sendLog("SUCCESS");
}
