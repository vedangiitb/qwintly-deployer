import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function insertDataSupabase(tableName: string, insertData: any) {
  const { data, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error("Supabase insert failed", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  return data;
}
