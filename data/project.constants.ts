export const ProjectRequestType = {
  NEW: "new",
  UPDATE: "update",
} as const;

export const ProjectUrl = (chatId: string, envUrl: string) =>
  `${chatId}-${envUrl}`;

export const ProjectPathConstants = (snapshotId: string) => {
  return {
    baseTemplate: "base-template.zip",
    tmpZipPath: `/tmp/template_${snapshotId}.zip`,
    snapShotPath: `projects/${snapshotId}.zip`,
  };
};
export type ProjectRequestType =
  (typeof ProjectRequestType)[keyof typeof ProjectRequestType];
