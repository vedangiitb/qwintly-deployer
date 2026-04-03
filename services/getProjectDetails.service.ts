import { ServicesClient } from "@google-cloud/run";
import { getJobContext } from "../job/jobContext.js";
import { saveUrl } from "./saveUrl.service.js";

const runClient = new ServicesClient();

export async function getProjectDetails() {
  const ctx = getJobContext();
  const serviceName = `site-${ctx.chatId}`;
  const region = "asia-south1";

  const servicePath = runClient.servicePath(
    ctx.targetProjectId,
    region,
    serviceName,
  );

  const [service] = await runClient.getService({
    name: servicePath,
  });

  const url = service.urls?.[0];

  if (!url) {
    throw new Error("Cloud Run service URL not found");
  }

  await saveUrl(url, ctx.chatId);
}
