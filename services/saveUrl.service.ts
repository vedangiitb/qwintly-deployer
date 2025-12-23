import { insertDataSupabase } from "../infra/supabase/insertData.js";
export async function saveUrl(url: string, sessionId: string) {
  try {
    await insertDataSupabase("projects.project_site", { id: sessionId, url: url });
  } catch (err: any) {
    throw new Error(err.message);
  }
}
