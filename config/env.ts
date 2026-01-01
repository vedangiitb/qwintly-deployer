import "dotenv/config";

export const SESSION_ID = process.env.SESSION_ID!;
export const SNAPSHOT_BUCKET_NAME =
  process.env.SNAPSHOT_BUCKET_NAME || "gen-project-snapshots";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const GEN_PROJECT_ID = process.env.GEN_PROJECT_ID || "generated-sites";
export const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;