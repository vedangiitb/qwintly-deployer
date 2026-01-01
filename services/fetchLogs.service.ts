import { Logging } from "@google-cloud/logging";

const logging = new Logging();

export async function fetchBuildLogs(buildId: string, projectId: string) {
  const filter = `
    resource.type="build"
    resource.labels.build_id="${buildId}"
  `;

  const [entries] = await logging.getEntries({
    filter,
    orderBy: "timestamp asc",
  });

  return entries
    .map(e => e.data?.textPayload)
    .filter(Boolean)
    .join("\n");
}
