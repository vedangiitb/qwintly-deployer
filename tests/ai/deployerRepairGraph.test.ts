import test from "node:test";
import assert from "node:assert/strict";
import { createDeployerRepairGraph } from "../../services/ai/graph/graph.js";
import { DeployerAgentState } from "../../services/ai/graph/state.js";

test("deployer repair graph: repairs once then ends when build passes", async () => {
  let validateCalls = 0;
  let planCalls = 0;
  let codeCalls = 0;

  const graph = createDeployerRepairGraph({
    validate: async () => {
      validateCalls += 1;
      if (validateCalls === 1) {
        return {
          lastBuildOk: false,
          unrecoverableError: undefined,
          validationErrors: [
            { type: "typescript", filePath: "app/page.tsx", message: "bad" },
          ],
        };
      }
      return { lastBuildOk: true, validationErrors: [] };
    },
    validationPlan: async () => {
      planCalls += 1;
      return { plannerTasks: [{ description: "fix it", targets: ["a.ts"] }] };
    },
    iterateAndCode: async (state) => {
      codeCalls += 1;
      return { iteration: state.iteration + 1 };
    },
  });

  const initial: DeployerAgentState = {
    iteration: 0,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    lastBuildOk: false,
    lastBuildLogs: undefined,
    unrecoverableError: undefined,
  };

  const result = await graph.invoke(initial);
  assert.equal(result.lastBuildOk, true);
  assert.equal(result.iteration, 1);
  assert.equal(validateCalls, 2);
  assert.equal(planCalls, 1);
  assert.equal(codeCalls, 1);
});

test("deployer repair graph: stops after 3 repair passes even if bugs remain", async () => {
  let validateCalls = 0;

  const graph = createDeployerRepairGraph({
    validate: async () => {
      validateCalls += 1;
      return {
        lastBuildOk: false,
        unrecoverableError: undefined,
        validationErrors: [
          { type: "eslint", filePath: "app/layout.tsx", message: "still bad" },
        ],
      };
    },
    validationPlan: async () => ({
      plannerTasks: [{ description: "fix", targets: ["a.ts"] }],
    }),
    iterateAndCode: async (state) => ({ iteration: state.iteration + 1 }),
  });

  const initial: DeployerAgentState = {
    iteration: 0,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    lastBuildOk: false,
    lastBuildLogs: undefined,
    unrecoverableError: undefined,
  };

  const result = await graph.invoke(initial);
  assert.equal(result.iteration, 3);
  assert.ok((result.validationErrors ?? []).length > 0);
  assert.equal(validateCalls, 4);
});

test("deployer repair graph: ends immediately on unrecoverable error", async () => {
  let planCalls = 0;
  let codeCalls = 0;

  const graph = createDeployerRepairGraph({
    validate: async () => ({
      lastBuildOk: false,
      unrecoverableError: "no logs",
      validationErrors: [],
    }),
    validationPlan: async () => {
      planCalls += 1;
      return { plannerTasks: [] };
    },
    iterateAndCode: async () => {
      codeCalls += 1;
      return { iteration: 123 };
    },
  });

  const initial: DeployerAgentState = {
    iteration: 0,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    lastBuildOk: false,
    lastBuildLogs: undefined,
    unrecoverableError: undefined,
  };

  const result = await graph.invoke(initial);
  assert.equal(result.unrecoverableError, "no logs");
  assert.equal(planCalls, 0);
  assert.equal(codeCalls, 0);
});

