import { projectConfigs } from "../../../data/configs.constants.js";
import { ValidatorIndex } from "../../../types/index/index.types.js";
import { buildFolderTree } from "./buildFolderTree.js";

export const buildValidatorIndex = async (
  rootDir?: string,
): Promise<ValidatorIndex> => {
  const folderTree = await buildFolderTree(rootDir);

  return {
    folderTree,
    projectConfigs: {
      frameworkConfig: projectConfigs.frameworkConfig,
      runtimeConfig: projectConfigs.runtimeConfig,
      toolingConfig: projectConfigs.toolingConfig,
    },
  };
};
