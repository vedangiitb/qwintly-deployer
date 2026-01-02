import { Logging } from "@google-cloud/logging";
import { JobContext } from "../job/jobContext.js";

export async function fetchBuildLogs(
  buildId: string,
  ctx: JobContext
): Promise<string> {
  const projectId = ctx.genProjectId;
  const logging = new Logging({ projectId });

  const filter = `
    resource.type="build"
    resource.labels.build_id="${buildId}"
  `;

  const [entries] = await logging.getEntries({
    filter,
    orderBy: "timestamp asc",
  });

  return entries
    .map((e) => {
      if (typeof e.data === "string") return e.data;
      if (typeof e.data === "object") return JSON.stringify(e.data);
      return undefined;
    })
    .filter(Boolean)
    .join("\n");
}
