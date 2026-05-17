import { CollectedContext } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../job/jobContext.js";
import { ContextRepository } from "../repository/context.repository.js";

export const fetchProjectContext = async (): Promise<CollectedContext> => {
  const ctx = getJobContext();
  const contextrepo = new ContextRepository();
  const context = await contextrepo.fetchCollectedContext(ctx.chatId);
  return context;
};
