import { getJobContext } from "../../job/jobContext.js";
import { createDeployerRepairGraph } from "./graph/graph.js";
import { DeployerAgentState } from "./graph/state.js";
import { buildValidatorIndex } from "./indexer/buildValidatorIndex.js";
import { makeIterateAndCodeNode } from "./nodes/iterateAndCodeNode.js";
import { validationNode } from "./nodes/validationNode.js";
import { makeValidatorPlanNode } from "./nodes/validatorPlanNode.js";
import { logger } from "../logger/logger.service.js";

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

  logger.status("AI: Starting deploy repair flow", { phase: "ai_plan" });
  const result = await graph.invoke(initialState);
  if (result.lastBuildOk) {
    logger.status("AI: Build & deploy OK", { phase: "done" });
  } else if (result.unrecoverableError) {
    logger.status(`AI: Stopped (unrecoverable): ${result.unrecoverableError}`, {
      phase: "failed",
    });
  } else {
    const remaining = (result.validationErrors ?? []).length;
    logger.status(`AI: Stopped with ${remaining} remaining issue(s)`, {
      phase: remaining === 0 ? "done" : "failed",
      progress: { current: remaining, total: remaining, unit: "issues" },
    });
  }
  return result;
}
