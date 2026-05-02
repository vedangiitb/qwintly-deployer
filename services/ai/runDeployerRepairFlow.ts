import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../job/jobContext.js";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";
import { createDeployerRepairGraph } from "./graph/graph.js";
import { DeployerAgentState } from "./graph/state.js";
import { makeIterateAndCodeNode } from "./nodes/iterateAndCodeNode.js";
import { validationNode } from "./nodes/validationNode.js";
import { makeValidatorPlanNode } from "./nodes/validatorPlanNode.js";

export async function runDeployerRepairFlow() {
  const ctx = getJobContext();
  const core = await getQwintlyCore();
  const validatorIndex = await core.buildValidatorIdx();

  const graph = createDeployerRepairGraph({
    validate: validationNode,
    validationPlan: makeValidatorPlanNode(validatorIndex),
    iterateAndCode: makeIterateAndCodeNode(ctx.requestType),
  });

  const initialState: DeployerAgentState = {
    iteration: 0,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    lastBuildOk: false,
    lastBuildLogs: undefined,
    unrecoverableError: undefined,
  };

  await core.streamLog(
    "AI: Starting deploy repair flow",
    EVENT_TYPES.STEP_STARTED,
  );
  const result = await graph.invoke(initialState);
  if (result.lastBuildOk) {
    await core.streamLog("AI: Build & deploy OK", EVENT_TYPES.STEP_FINISHED);
  } else if (result.unrecoverableError) {
    await core.streamLog(
      `AI: Stopped (unrecoverable): ${result.unrecoverableError}`,
      EVENT_TYPES.STEP_ERROR,
    );
  } else {
    const remaining = (result.validationErrors ?? []).length;
    await core.streamLog(
      `AI: Stopped with ${remaining} remaining issue(s)`,
      EVENT_TYPES.STEP_ERROR,
    );
  }
  return result;
}
