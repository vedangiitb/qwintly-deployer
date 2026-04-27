import { deployerFlow } from "../flow/deployer.flow.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { logger } from "../services/logger/logger.service.js";

export async function deployer() {
  try {
    await deployerFlow();
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    logger.error("Deployer job failed", err);
    await safeExit(1, err?.message || "Unknown error");
  }
}
