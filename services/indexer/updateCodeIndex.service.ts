import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { ProjectStructure } from "../../types/index/projectStructure/projectStructure.js";
import { getProjectStructure } from "./helpers/getProjectStructure.js";
import { uploadIndex } from "./uploadIndex.service.js";

export const updateCodeIndex = async (
  ctx: JobContext,
  // pmMessage: pmMessage,
  codeIndex: CodeIndex | undefined
) => {
  if (!codeIndex) throw new Error("Failed to load codeindex.");
  // const projectDetails: ProjectDetails = updateProjectDetails(pmMessage);

  const projectStructure: ProjectStructure = await getProjectStructure(ctx);

  const newCodeIndex = {
    projectConfig: codeIndex.projectConfig,
    projectConventions: codeIndex.projectConventions,
    projectStructure: projectStructure,
  };

  try {
    await uploadIndex(
      newCodeIndex,
      ctx
      //  "codeIndex"
    );
  } catch (err) {
    throw new Error(`Failed to update code index: ${err}`);
  }

  // TODO: Update PM Index with new structure
};
