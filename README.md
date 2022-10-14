## NX + trycourier/backend POC

1. `clone repo`
2. `yarn install`
3. `yarn nx typecheck backend`
4. `yarn nx serverless:package backend`
5. `yarn nx test:dev backend`
6. `yarn nx serverless:deploy backend`

## POC Tasks

1. 🟢migrate application and dependencies into nx workspace
2. 🟢configure project scripts
3. 🟢resolve files and ts linter passes
4. 🟢build Cloudformation template with `serverless package`
5. 🟢tests pass locally
6. 🟢deploy locally
7. 🟡update existing GHA locally
8. 🔴update production GHA and deploy production via CI/CD
9. 🔴discover unknowns and risks
10. 🔴create a “smart” GHA using nx affected

## Why NX?

When organizing a microservice project, a mono repo offers many benefits.

- one set of dependencies across the application
- helpers, libs, types and utils can easily be shared across services
- easier to discover behavior across services
- a clear convention and methodology can be applied to all services

Yet, there are also a few downsides to organizing a microservice project in a mono repo.

- difficult to coordinate and manage releases
- deployment process can be more complicated
- increased risk of shared code negatively impacting other services
- difficult to support multiple languages

The current form of the backend repo is already a monorepo. Yet we have no clear convention or methodology to move forward with our desired microservice architecture. Adding a new service are slow, complicated and cumbersome. Deploying services atomically (ideally based on commit history) is a large effort and would require additional maintenance for each new service we add. Updating our core serverless framework build dependencies is risky, effects the entire stack and would require significant developer time.

NX is an monorepo framework and build system, that provides a solutions to these challenges.

1. Microservice Convention
   NX provides an opinionated folder structure, which it uses to provide powerful functionality. Each folder in the `apps` directory is a service, and implements its own unique `build`, `test`, `deploy` process. This

   serverles framework couples the build and deploy steps

2. Adding Services

- we can use any CF framework to build our stacks and CF Resources (SAM, CDK, Serverless Framework)
- requires us to write scripts to enforce our own conventions

3. Atomic Deployments
   `nx affected`
   Since each service has its own `build` and `deploy` process

- deployemnts are free, but we need to write our own GHA
- deployments are atomic
