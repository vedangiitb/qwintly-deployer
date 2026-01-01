export type PreflightErrorList = PreflightError[];

export type PreflightError = {
  type: "eslint" | "typescript";
  filePath: string | null;
  message: string;
};
