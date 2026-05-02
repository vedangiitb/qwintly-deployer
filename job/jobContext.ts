// Session/workspace/env context
import {
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  JOB_TOKEN,
  SESSION_ID,
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
    userId: string;
    provider: string;
    chatId: string;
    planId: string;
    requestType: string;
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

  return {
    chatId: chatId,
    sessionId: SESSION_ID!,
    requestType: requestType,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${chatId}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET || "gen-project-snapshots",
    projectId: GCP_PROJECT_ID_QWINTLY,
    targetProjectId: GEN_SITES_PROJECT_ID!,
    userId: userId,
    provider: provider,
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
