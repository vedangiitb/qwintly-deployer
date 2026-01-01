import { PreflightError } from "../types/preflightError.js";

export function parseValidationErrors(logs: string): PreflightError[] {
  console.log("Parsing errors...");
  console.log(logs);
  const errors: PreflightError[] = [];

  // Split logs into lines for scanning
  const lines = logs.split("\n");

  let buffer: string[] = [];
  let currentType: "eslint" | "typescript" | null = null;

  const flush = () => {
    if (!currentType || buffer.length === 0) return;

    const message = buffer.join("\n").trim();

    // Try to extract file path
    const fileMatch = message.match(/([^\s:()]+?\.(ts|tsx|js|jsx))/);

    errors.push({
      type: currentType,
      filePath: fileMatch ? fileMatch[1] : null,
      message,
    });

    buffer = [];
    currentType = null;
  };

  for (const line of lines) {
    // ---- TypeScript error start ----
    if (/error TS\d+:/i.test(line)) {
      flush();
      currentType = "typescript";
      buffer.push(line);
      continue;
    }

    // ---- ESLint error start ----
    if (
      /\berror\b/i.test(line) &&
      /eslint|@typescript-eslint|no-unused-vars|no-undef/.test(line)
    ) {
      flush();
      currentType = "eslint";
      buffer.push(line);
      continue;
    }

    // ---- Continuation line ----
    if (currentType) {
      buffer.push(line);
    }
  }

  flush();

  console.log(errors);
  return errors;
}
