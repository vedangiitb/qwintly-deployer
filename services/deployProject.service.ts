import { ServicesClient } from "@google-cloud/run";
import { JobContext } from "../job/jobContext.js";
import { sendLog } from "../utils/logger.js";

const runClient = new ServicesClient();

export async function deployProject(ctx: JobContext) {
  const serviceName = `site-${ctx.sessionId}`;
  const region = "asia-south1";

  const servicePath = runClient.servicePath(
    ctx.targetProjectId,
    region,
    serviceName
  );

  const [service] = await runClient.getService({
    name: servicePath,
  });

  console.log(service);

  const url = service.urls?.[0];

  if (!url) {
    throw new Error("Cloud Run service URL not found");
  }

  sendLog(`DEPLOYED_URL=${url}`);
}
