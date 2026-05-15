import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";
import { createDeployerRepairGraph } from "./graph/graph.js";
import { DeployerAgentState } from "./graph/state.js";
import { makeIterateAndCodeNode } from "./nodes/iterateAndCodeNode.js";
import { validationNode } from "./nodes/validationNode.js";
import { makeValidatorPlanNode } from "./nodes/validatorPlanNode.js";
import { fetchProjectContext } from "../fetchProjectContext.js";

export async function runDeployerRepairFlow() {
  const core = await getQwintlyCore();
  const validatorIndex = await core.buildValidatorIdx();
  const collectedContext = await fetchProjectContext();

  const graph = createDeployerRepairGraph({
    validate: validationNode,
    validationPlan: makeValidatorPlanNode(validatorIndex),
    iterateAndCode: makeIterateAndCodeNode(),
  });

  const initialState: DeployerAgentState = {
    iteration: 0,
    plannerTasks: [],
    collectedContext,
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
    await core.streamLog(
      "AI: Build & deploy OK",
      EVENT_TYPES.STEP_FINISHED,
      true,
    );
  } else if (result.unrecoverableError) {
    await core.streamLog(
      `AI: Stopped (unrecoverable): ${result.unrecoverableError}`,
      EVENT_TYPES.STEP_ERROR,
      true,
    );
  } else {
    const remaining = (result.validationErrors ?? []).length;
    await core.streamLog(
      `AI: Stopped with ${remaining} remaining issue(s)`,
      EVENT_TYPES.STEP_ERROR,
      true,
    );
  }
  return result;
}
