import { step } from "../job/step.js";
import { deployWithRepair } from "../services/buildProject.service.js";
import { cloneSnapshot } from "../services/cloneSnapshot.service.js";
import { getProjectDetails } from "../services/getProjectDetails.service.js";
import { buildCodeIndex } from "../services/indexer/buildCodeIndex.service.js";
import { makeServicePublic } from "../services/makePublic.service.js";
import { logger } from "../services/logger/logger.service.js";

export async function deployerFlow() {
  await step("Cloning Project Snapshot", () => cloneSnapshot(), {
    retries: 0,
  });

  let codeIndex = await step(
    "Loading Updated Code Index",
    () => buildCodeIndex(),
    {
      retries: 2,
    },
  );

  await step("Building Project", () => deployWithRepair(codeIndex), {
    retries: 0,
  });

  await step("Updating Access Poilicies", () => makeServicePublic(), {
    retries: 1,
  });

  await step("Updating project deployment Details", () => getProjectDetails(), {
    retries: 1,
  });

  logger.status("SUCCESS");
}
