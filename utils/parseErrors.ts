import { PreflightError } from "../types/preflightError.js";

export function parseValidationErrors(logs: string): PreflightError[] {
  const errors: PreflightError[] = [];
  const lines = logs.split("\n");

  let buffer: string[] = [];
  let currentType: "typescript" | "eslint" | "nextjs" | null = null;
  let pendingEslintFile: string | null = null;

  const nextJsError = parseNextJsPrerenderError(logs);
  if (nextJsError) {
    errors.push(nextJsError);
  }

  const flush = () => {
    if (!currentType || buffer.length === 0) return;

    const message = buffer.join("\n").trim();

    const fileMatch =
      // TypeScript
      message.match(/([^\s:()]+?\.(?:ts|tsx|js|jsx))\(\d+,\d+\)/) ||
      // ESLint
      message.match(/^([^\s]+?\.(?:ts|tsx|js|jsx))/m);

    if (currentType !== "nextjs") {
      errors.push({
        type: currentType,
        filePath: fileMatch?.[1]
          ? normalizeFilePath(fileMatch[1])
          : "Pls refer from error message",
        message,
      });
    }

    buffer = [];
    currentType = null;
  };

  for (const rawLine of lines) {
    const line = stripCloudBuildPrefix(rawLine);

    // -----------------------
    // ESLint file path line
    // -----------------------
    const eslintFileMatch = line.match(/^\s*(\/?.+?\.(?:ts|tsx|js|jsx))\s*$/);
    if (eslintFileMatch) {
      pendingEslintFile = eslintFileMatch[1];
      continue;
    }

    // -----------------------
    // TypeScript error start
    // -----------------------
    if (/error TS\d+:/i.test(line)) {
      flush();
      currentType = "typescript";
      buffer.push(line);
      continue;
    }

    // -----------------------
    // Next.js prerender error
    // -----------------------
    if (/Error occurred prerendering page/i.test(line)) {
      flush();
      currentType = "nextjs";
      buffer.push(line);
      continue;
    }

    // -----------------------
    // ESLint error start
    // -----------------------
    if (pendingEslintFile && /^\s*\d+:\d+\s+error\s+/i.test(line)) {
      flush();
      currentType = "eslint";
      buffer.push(pendingEslintFile);
      buffer.push(line);
      pendingEslintFile = null;
      continue;
    }

    // -----------------------
    // Continuation
    // -----------------------
    if (currentType) {
      buffer.push(line);
    }
  }

  flush();
  return errors;
}

function stripCloudBuildPrefix(line: string): string {
  return line.replace(/^Step #\d+:\s*/, "");
}

function parseNextJsPrerenderError(logs: string): PreflightError | null {
  const blockMatch = logs.match(
    /Error occurred prerendering page[\s\S]*?(?:Next\.js build worker exited with code:\s*\d+|Export encountered an error[^\n]*)/i
  );

  if (!blockMatch) return null;

  const message = blockMatch[0].trim();
  const routeMatch =
    message.match(/prerendering page\s+"([^"]+)"/i) ||
    message.match(/\/page:\s*([^\s,]+)/i);

  const route = routeMatch?.[1] ?? null;

  return {
    type: "nextjs",
    filePath: route ? `route:${route}` : null,
    message,
  };
}

function normalizeFilePath(filePath: string): string {
  let p = filePath.replace(/\\/g, "/");
  p = p.replace(/^\/+/, "");
  if (p.startsWith("app/app/")) {
    p = p.replace(/^app\//, "");
  }
  return p;
}
