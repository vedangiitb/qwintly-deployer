import { ProjectUrl } from "../data/project.constants.js";
import { SitesRepository } from "../repository/sites.repository.js";

export async function saveUrl(url: string, chatId: string) {
  try {
    const envUrl = process.env.ENV_SITE_URL!;
    if (!envUrl) throw new Error("ENV_SITE_URL not found");
    const siteUrl = ProjectUrl(chatId, envUrl);
    const sitesRepo = new SitesRepository();
    await sitesRepo.updateSite(chatId, siteUrl, url);
  } catch (err: any) {
    throw new Error(err.message);
  }
}
