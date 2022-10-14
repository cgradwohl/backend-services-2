## NX + trycourier/backend POC

1. `clone repo`
2. `yarn install`
3. `yarn nx typecheck backend`
4. `yarn nx serverless:package backend`
5. `yarn nx test:dev backend`

## POC Tasks

1. 🟢migrate application and dependencies into nx workspace
2. 🟢configure project scripts
3. 🟢resolve files and ts linter passes
4. 🟢build Cloudformation template with `serverless package`
5. 🟢tests pass locally
6. 🟢deploy locally
7. 🔴update exiting GHA
8. 🔴deploy production
9. 🔴discover unknowns
10. 🔴create a “smart” GHA with nx affected
