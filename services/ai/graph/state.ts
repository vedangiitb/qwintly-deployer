import { Annotation } from "@langchain/langgraph";
import { PlannerTask } from "../../../types/ai/plannerTasks.types.js";
import { PreflightErrorList } from "../../../types/preflightError.js";
import { ValidatorAgentHistory } from "../../../types/validatorAgentHistory.js";

export type DeployerAgentState = {
  iteration: number;
  validationErrors: PreflightErrorList;
  validationFixHistory: ValidatorAgentHistory;
  plannerTasks: PlannerTask[];
  lastBuildOk: boolean;
  lastBuildLogs?: string;
  unrecoverableError?: string;
};

export const DeployerAgentStateAnnotation = Annotation.Root({
  iteration: Annotation<number>(),
  validationErrors: Annotation<PreflightErrorList>(),
  validationFixHistory: Annotation<ValidatorAgentHistory>(),
  plannerTasks: Annotation<PlannerTask[]>(),
  lastBuildOk: Annotation<boolean>(),
  lastBuildLogs: Annotation<string | undefined>(),
  unrecoverableError: Annotation<string | undefined>(),
});

