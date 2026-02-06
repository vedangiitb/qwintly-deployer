export type PreflightErrorList = PreflightError[];

export type PreflightError = {
  type: "eslint" | "typescript" | "nextjs";
  filePath: string | null;
  message: string;
};
