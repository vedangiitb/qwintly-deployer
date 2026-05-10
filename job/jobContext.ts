// Session/workspace/env context
import {
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  JOB_TOKEN,
  SNAPSHOT_BUCKET,
} from "../config/env.js";
import jwt from "jsonwebtoken";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createJobContext() {
  if (!JOB_TOKEN) {
    throw new Error("Missing required env vars");
  }

  let tokenPayload: {
    chatId: string;
    planId: string;
    requestType: string;
    provider: string;
    model: string;
    userId: string;
    sessionId: string;
    snapshotId: string;
  };
  try {
    tokenPayload = jwt.verify(
      JOB_TOKEN,
      process.env.PUBLISH_SECRET!,
    ) as typeof tokenPayload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }

  const chatId = normalizeString(tokenPayload.chatId);
  const requestType = normalizeString(tokenPayload.requestType);
  const provider = normalizeString(tokenPayload.provider);
  const userId = normalizeString(tokenPayload.userId);
  const planId = normalizeString(tokenPayload.planId);
  const model = normalizeString(tokenPayload.model);
  const sessionId = normalizeString(tokenPayload.sessionId);
  const snapshotId = normalizeString(tokenPayload.snapshotId);

  return {
    chatId: chatId,
    sessionId: sessionId,
    requestType: requestType,
    planId: planId,
    snapshotId: snapshotId,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${chatId}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET || "gen-project-snapshots",
    projectId: GCP_PROJECT_ID_QWINTLY,
    targetProjectId: GEN_SITES_PROJECT_ID!,
    userId: userId,
    provider: provider,
    model: model,
  };
}

let cachedJobContext: JobContext | null = null;

export function getJobContext(): JobContext {
  if (!cachedJobContext) {
    cachedJobContext = createJobContext();
  }

  return cachedJobContext;
}

export type JobContext = ReturnType<typeof createJobContext>;

export function setJobContext(ctx: JobContext) {
  cachedJobContext = ctx;
}
