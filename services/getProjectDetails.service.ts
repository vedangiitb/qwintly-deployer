import { ServicesClient } from "@google-cloud/run";
import { JobContext } from "../job/jobContext.js";
import { saveUrl } from "./saveUrl.service.js";

const runClient = new ServicesClient();

export async function getProjectDetails(ctx: JobContext) {
  // const serviceName = `site-${ctx.sessionId}`;
  // const region = "asia-south1";

  // const servicePath = runClient.servicePath(
  //   ctx.targetProjectId,
  //   region,
  //   serviceName
  // );

  // const [service] = await runClient.getService({
  //   name: servicePath,
  // });

  // console.log(service);

  // const url = service.urls?.[0];

  try {
    await fetch("https://httpbin.org/get");
  } catch (err){
    console.log("Failed")
    console.log(err)
  }

  const url = "https://httpbin.org/get"

  // if (!url) {
  //   throw new Error("Cloud Run service URL not found");
  // }

  await saveUrl(url, ctx.sessionId);
}
