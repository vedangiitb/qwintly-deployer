// Session/workspace/env context
import {
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  REQUEST_TYPE,
  CHAT_ID,
  SNAPSHOT_BUCKET,
} from "../config/env.js";

export function createJobContext() {
  if (!CHAT_ID) {
    throw new Error("Missing required env vars");
  }

  return {
    chatId: CHAT_ID,
    requestType: REQUEST_TYPE,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${CHAT_ID}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET || "gen-project-snapshots",
    projectId: GCP_PROJECT_ID_QWINTLY,
    targetProjectId: GEN_SITES_PROJECT_ID!,
  };
}

export type JobContext = ReturnType<typeof createJobContext>;
