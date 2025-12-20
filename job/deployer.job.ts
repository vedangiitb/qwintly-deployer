import { deployerFlow } from "../flow/deployer.flow.js";
import { registerCleanup } from "../services/cleanup.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { createJobContext } from "./jobContext.js";

export async function deployer() {
  const ctx = createJobContext();

  registerCleanup(ctx);

  try {
    await deployerFlow(ctx);
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
