import { ProjectInfo } from "@vedangiitb/qwintly-core";
import { DBRepository } from "./repository.js";

export class ContextRepository extends DBRepository {
  /*
   * Table: project_context
   * Use: Update project info (WRITE)
   */
  async updateProjectInfo(id: string, projectInfo: ProjectInfo) {
    const supabase = this.client;
    const { error } = await supabase
      .from("project_context")
      .update({ project_info: projectInfo })
      .eq("id", id);

    if (error) throw error;
  }
}
