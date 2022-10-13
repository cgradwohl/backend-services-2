import { IResolver } from "../types";

const installVercelIntegration: IResolver = async (_, args, context) => {
  await context.dataSources.vercelIntegration.install({
    configurationId: args.configurationId,
    code: args.code,
    teamId: args.teamId,
  });

  return { success: true };
};

const configureVercelIntegration: IResolver = async (_, args, context) => {
  await context.dataSources.vercelIntegration.configure({
    configurationId: args.configurationId,
    projectsToEnable: args.projectsToEnable,
    projectsToDisable: args.projectsToDisable,
  });

  return { success: true };
};

const vercelProjects: IResolver = async (_, args, context) => {
  const { projects, pagination } =
    await context.dataSources.vercelIntegration.getProjects({
      configurationId: args.configurationId,
      limit: args.first,
      from: args.after,
    });

  return {
    nodes: projects,
    edges: projects.map((project) => ({ node: project })),
    pageInfo: {
      endCursor: pagination.prev,
      hasNextPage: !!pagination.next,
      hasPreviousPage: !!pagination.prev,
      startCursor: pagination.next,
    },
  };
};

export default {
  Mutation: {
    installVercelIntegration,
    configureVercelIntegration,
  },
  Query: {
    vercelProjects,
  },
};
