import { DBRepository } from "./repository.js";

export class SitesRepository extends DBRepository {
  /*
   * Table: project_sites
   * Use: Update Project Site (READ)
   */
  async updateSite(
    chatId: string,
    url: string,
    cloudrun_url: string,
  ): Promise<string> {
    const supabase = this.client;
    try {
      const { data, error } = await supabase.rpc("update_project_site", {
        p_conv_id: chatId,
        p_url: url,
        p_cloudrun_url: cloudrun_url,
      });
      if (error) throw error;
      if (data === null || data === undefined) {
        throw new Error("Project site not found for this conversation.");
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  }
}
