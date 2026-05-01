import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { step } from "../job/step.js";
import { deployWithRepair } from "../services/buildProject.service.js";
import { cloneSnapshot } from "../services/cloneSnapshot.service.js";
import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { getProjectDetails } from "../services/getProjectDetails.service.js";
import { makeServicePublic } from "../services/makePublic.service.js";

export async function deployerFlow() {
  const core = getQwintlyCore();

  await step("Cloning Project Snapshot", () => cloneSnapshot(), {
    retries: 0,
  });

  await step("Building Project", () => deployWithRepair(), {
    retries: 0,
  });

  await step("Updating Access Poilicies", () => makeServicePublic(), {
    retries: 1,
  });

  await step("Updating project deployment Details", () => getProjectDetails(), {
    retries: 1,
  });

  await core.streamLog("SUCCESS", EVENT_TYPES.GENERATION_COMPLETED);
}
