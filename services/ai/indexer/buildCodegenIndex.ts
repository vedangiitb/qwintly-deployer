import { CodegenIndex } from "../../../types/index/index.types.js";
import { buildFolderTree } from "./buildFolderTree.js";
import {
  projectConfigs,
  projectConventions,
} from "./data/configs.constants.js";
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
      importsConventions: projectConventions.importsConventions,
      uiArchitecture: projectConventions.uiArchitecture,
    },
  };
};
