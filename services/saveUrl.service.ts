import { insertDataSupabase } from "../infra/supabase/insertData.js";
export async function saveUrl(url: string, sessionId: string) {
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/project_site`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          id: "test-id",
          url: "https://example.com",
        }),
      }
    );

    const text = await res.text();

    console.log("RAW REST:", {
      status: res.status,
      body: text,
    });

    // await insertDataSupabase("projects.project_site", { id: sessionId, url: url });
  } catch (err: any) {
    throw new Error(err.message);
  }
}
