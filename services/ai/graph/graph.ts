import { END, START, StateGraph } from "@langchain/langgraph";
import { DeployerAgentState, DeployerAgentStateAnnotation } from "./state.js";

export type DeployerNode = (
  state: DeployerAgentState,
) => Promise<Partial<DeployerAgentState>> | Partial<DeployerAgentState>;

export type DeployerNodes = {
  validate: DeployerNode;
  validationPlan: DeployerNode;
  iterateAndCode: DeployerNode;
};

export function createDeployerRepairGraph(nodes: DeployerNodes) {
  const routeAfterValidate = (state: DeployerAgentState) => {
    if (state.lastBuildOk) return "end";
    if (state.unrecoverableError) return "end";

    const errors = state.validationErrors ?? [];
    if (errors.length === 0) return "end";
    if ((state.iteration ?? 0) < 3) return "repair";

    return "end";
  };

  return new StateGraph(DeployerAgentStateAnnotation)
    .addNode("validate", nodes.validate)
    .addNode("validationPlan", nodes.validationPlan)
    .addNode("iterateAndCode", nodes.iterateAndCode)
    .addEdge(START, "validate")
    .addConditionalEdges("validate", routeAfterValidate, {
      repair: "validationPlan",
      end: END,
    })
    .addEdge("validationPlan", "iterateAndCode")
    .addEdge("iterateAndCode", "validate")
    .compile();
}

