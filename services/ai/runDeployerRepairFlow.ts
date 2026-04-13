import { getJobContext } from "../../job/jobContext.js";
import { createDeployerRepairGraph } from "./graph/graph.js";
import { DeployerAgentState } from "./graph/state.js";
import { buildValidatorIndex } from "./indexer/buildValidatorIndex.js";
import { makeIterateAndCodeNode } from "./nodes/iterateAndCodeNode.js";
import { validationNode } from "./nodes/validationNode.js";
import { makeValidatorPlanNode } from "./nodes/validatorPlanNode.js";

export async function runDeployerRepairFlow() {
  const ctx = getJobContext();
  const validatorIndex = await buildValidatorIndex();

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

  return await graph.invoke(initialState);
}

