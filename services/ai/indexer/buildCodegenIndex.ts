import { projectConfigs } from "../../../data/configs.constants.js";
import { buildFolderTree } from "./buildFolderTree.js";

export type CodegenIndex = {
  folderTree: string;
  projectConfigs: Pick<typeof projectConfigs, "frameworkConfig" | "runtimeConfig">;
  projectConventions: {
    importsConventions: typeof projectConfigs.importConventions;
    stylingConventions: typeof projectConfigs.stylingConventions;
  };
};

export const buildCodegenIndex = async (
  rootDir?: string,
): Promise<CodegenIndex> => {
  const folderTree = await buildFolderTree(rootDir);

  return {
    folderTree,
    projectConfigs: {
      frameworkConfig: projectConfigs.frameworkConfig,
      runtimeConfig: projectConfigs.runtimeConfig,
    },
    projectConventions: {
      importsConventions: projectConfigs.importConventions,
      stylingConventions: projectConfigs.stylingConventions,
    },
  };
};
