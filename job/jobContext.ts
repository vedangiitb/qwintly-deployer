// Session/workspace/env context
import jwt from "jsonwebtoken";
import {
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  JOB_TOKEN,
  SNAPSHOT_BUCKET,
} from "../config/env.js";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return true;
};

export function createJobContext() {
  if (!JOB_TOKEN) {
    throw new Error("Missing required env vars");
  }

  let tokenPayload: {
    chatId: string;
    planId: string;
    userId: string;
    model: string;
    provider: string;
    sessionId: string;
    snapshotId: string;
    byokEnabled: boolean;
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
  const planId = normalizeString(tokenPayload.planId);
  const userId = normalizeString(tokenPayload.userId);
  const model = normalizeString(tokenPayload.model);
  const provider = normalizeString(tokenPayload.provider);
  const sessionId = normalizeString(tokenPayload.sessionId);
  const snapshotId = normalizeString(tokenPayload.snapshotId);
  const byokEnabled = normalizeBoolean(tokenPayload.byokEnabled);

  return {
    chatId: chatId,
    sessionId: sessionId,
    planId: planId,
    snapshotId: snapshotId,
    byokEnabled: byokEnabled,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${sessionId}.zip`,
    baseTemplate: "base-template.zip",
    tmpZipPath: `/tmp/template_${snapshotId}.zip`,
    snapShotPath: `projects/${chatId}/${snapshotId}.zip`,
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
