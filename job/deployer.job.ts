import { deployerFlow } from "../flow/deployer.flow.js";
import { safeExit } from "../utils/gracefulShutdown.js";

export async function deployer() {
  try {
    await deployerFlow();
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
