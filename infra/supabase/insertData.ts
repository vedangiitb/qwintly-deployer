import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function insertDataSupabase(tableName: string, insertData: any) {
  const { data, error } = await supabase.from(tableName).insert(insertData);

  if (error) {
    console.error("Supabase insert failed", error);
    throw error;
  }

  console.log("Inserted:", data);
}
