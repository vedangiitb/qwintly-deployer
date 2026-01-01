// Session/workspace/env context
import {
  GEN_PROJECT_ID,
  SESSION_ID,
  SNAPSHOT_BUCKET_NAME,
} from "../config/env.js";

export function createJobContext() {
  if (!SESSION_ID) {
    throw new Error("Missing required env vars");
  }

  return {
    sessionId: SESSION_ID,
    workspace: `/tmp/workspace/${SESSION_ID}`,
    zipPath: `/tmp/${SESSION_ID}.zip`,
    targetProjectId: process.env.TARGET_PROJECT_ID || "generated-sites",
    snapshotBucket: SNAPSHOT_BUCKET_NAME || "gen-project-snapshots",
    codeIndexBucket: "qwintly-code-indexes",
    genProjectId: GEN_PROJECT_ID,
    projectId: "qwintly",
  };
}

export type JobContext = ReturnType<typeof createJobContext>;
