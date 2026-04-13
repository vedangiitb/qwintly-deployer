import { projectConfigs } from "../../../data/configs.constants.js";
import { buildFolderTree } from "./buildFolderTree.js";

export type ValidatorIndex = {
  folderTree: string;
  projectConfigs: Pick<
    typeof projectConfigs,
    "frameworkConfig" | "runtimeConfig" | "toolingConfig"
  >;
};

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

