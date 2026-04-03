// Session/workspace/env context
import {
  CHAT_ID,
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  REQUEST_TYPE,
  SESSION_ID,
  SNAPSHOT_BUCKET,
} from "../config/env.js";

export function createJobContext() {
  if (!CHAT_ID || !SESSION_ID || !REQUEST_TYPE) {
    throw new Error("Missing required env vars");
  }

  return {
    chatId: CHAT_ID,
    sessionId: SESSION_ID,
    requestType: REQUEST_TYPE,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${CHAT_ID}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET || "gen-project-snapshots",
    projectId: GCP_PROJECT_ID_QWINTLY,
    targetProjectId: GEN_SITES_PROJECT_ID!,
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
