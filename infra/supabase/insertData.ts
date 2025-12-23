import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../../config/env.js";

export async function insertDataSupabase(tableName: string, insertData: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("Inserting into:", tableName, insertData);

  const { data, error } = await supabase
    .from(tableName)
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error("Supabase full error:", JSON.stringify(error, null, 2));
    throw error;
  }

  console.log("Inserted row:", data);
  return data;
}
