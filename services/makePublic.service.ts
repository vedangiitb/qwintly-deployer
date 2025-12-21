import { ServicesClient } from "@google-cloud/run";
import { JobContext } from "../job/jobContext.js";

const runClient = new ServicesClient();

export async function makeServicePublic(ctx: JobContext) {
  const projectId = ctx.targetProjectId;
  const region = "asia-south1";
  const serviceName = `site-${ctx.sessionId}`;

  const servicePath = runClient.servicePath(projectId, region, serviceName);

  // Get current IAM policy
  const [policy] = await runClient.getIamPolicy({
    resource: servicePath,
  });

  // Check if already public
  const alreadyPublic = policy.bindings?.some(
    (b) => b.role === "roles/run.invoker" && b.members?.includes("allUsers")
  );

  if (alreadyPublic) {
    return; // idempotent
  }

  // Add allUsers invoker
  policy.bindings = [
    ...(policy.bindings || []),
    {
      role: "roles/run.invoker",
      members: ["allUsers"],
    },
  ];

  // Set policy
  await runClient.setIamPolicy({
    resource: servicePath,
    policy,
  });
}
