import { DBRepository } from "./repository.js";

export class GenSessionRepo extends DBRepository {
  async finishDeploymentSession(
    genId: string,
    success: boolean,
  ): Promise<void> {
    const { error } = await this.client.rpc("finish_deployment", {
      p_gen_id: genId,
      p_success: success,
    });

    if (error) {
      throw new Error(`Failed to finish generation session: ${error.message}`);
    }
  }
}
