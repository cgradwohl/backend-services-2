## Manual Migration Guide

- https://nx.dev/recipes/adopting-nx/manual

## Github Actions Guide

- https://nx.dev/recipe/monorepo-ci-github-actions

## Nx Plugins Guide

- https://nx.dev/packages

## Global Configuration

- nx provides application config files that extend the global config files
- `nx.json` contains metadata about your workspace and its applications

## Application Configuration

- the `/apps` folder contains each microservice or deployable unit
- `project.json` defines an individual application in your workspace and the _tasks_ available to it
- each app should have a `build`, `serve`, `lint`, `deploy` and `test` task defined for it

## Typescript Config

- `typescript.base.json` `path` and `basePath` properties cannot be extended but rather is replaced by the local services `tsconfig.json`

## Migration Notes

- copy package.json dependencies from `backend/package.json` to `backend-services-2/package.json`
- `yarn`
- copy `backend` serverless application to `backend-services-2/apps/backend` as is no file structure changes.
- updated `backend-services-2/apps/backend/tsconfig.json` to extend ``backend-services-2/tsconfig.base.json`
- remove `backend-services-2/apps/backend/.git`
- 🟢 running `yarn nx typecheck backend` works (see #Breaking Folder Convention and Migration Suggestion below for details)
- 🟢 running `yarn nx serverless:package backend` works (see #Breaking Folder Convention and Migration Suggestion below for details)
- 🟢 running `yarn nx test:dev backend` works and tests pass locally (see #Breaking Folder Convention and Migration Suggestion below for details)
- 🟢 running `yarn nx serverless:deploy backend` works and deploys the stack based on dev-config.yml (see #Breaking Folder Convention and Migration Suggestion below for details)

### Breaking Folder Convention and Migration Suggestion

- after following NX's migration sugestions I realized that splitting Configuration files to go in the root of your application, and application code goes into the src/app folder was problematic and required changing webpack config, tsconfig, and serverless webpack plugin. It is not clear why this is necessary, but it is NX's suggestion.

- for now i will shove everything into the src folder so that all the relative paths are the same. (get it to work mode)
- decided to completely abandon nx file structure

- this seems to get backend working, but I do not know the consequences this will have later down the road, when we attempt to do more sophisticated tasks with NX. I am hoping that this is isolated to this service.

### Compilation Build Nuance

- during the compilation phase, serverless-webpack is not building correctly since it is not including
  the required source maps required by the serverless framework to deploy to CloudFormation.
- since an NX workspace contains a global `node_modules` which each service has access to, we need to resolve to tell webpack to resolve these dependencies by providing a specific path to them: https://webpack.js.org/configuration/resolve/#resolvemodules
- after updating `apps/backend/webpack.config.js` file to the following:

```
modules: [
  path.resolve(__dirname, '../../node_modules'),
]
```

This seems to resolve correctly to the global `node_modules`, and all module warning have been removed.

However there is still an issue with `better-ajv-errors` and `@aws-sdk` dependencies:

```
ERROR in /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/validation-errors/base.mjs 25:11-27
Can't import the named export 'codeFrameColumns' from non EcmaScript module (only default export is available)
 @ /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/validation-errors/additional-prop.mjs
 @ /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/validation-errors/index.mjs
 @ /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/helpers.mjs
 @ /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/index.mjs
 @ ./lib/ajv.ts
 @ ./lib/lambda-response.ts
 @ ./api/send/index.ts

ERROR in /Users/chef/me/projects/backend-services-2/node_modules/better-ajv-errors/lib/esm/index.mjs 7:18-23
Can't import the named export 'parse' from non EcmaScript module (only default export is available)
 @ ./lib/ajv.ts
 @ ./lib/lambda-response.ts
 @ ./api/send/index.ts

ERROR in /Users/chef/me/projects/backend-services-2/node_modules/@aws-sdk/service-error-classification/dist-es/index.js 4:60
Module parse failed: Unexpected token (4:60)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| export const isRetryableByTrait = (error) => error.$retryable !== undefined;
| export const isClockSkewError = (error) => CLOCK_SKEW_ERROR_CODES.includes(error.name);
> export const isThrottlingError = (error) => error.$metadata?.httpStatusCode === 429 ||
|     THROTTLING_ERROR_CODES.includes(error.name) ||
|     error.$retryable?.throttling == true;
 @ /Users/chef/me/projects/backend-services-2/node_modules/aws-xray-sdk-core/dist/lib/patchers/aws3_p.js 7:39-87
 @ /Users/chef/me/projects/backend-services-2/node_modules/aws-xray-sdk-core/dist/lib/aws-xray.js
 @ /Users/chef/me/projects/backend-services-2/node_modules/aws-xray-sdk-core/dist/lib/index.js
 @ ./lib/aws-sdk.ts
 @ ./lib/s3.ts
 @ ./api/send/index.ts
```

- additionally when comparing the compiled webpack output from `trycourier/backend/.webpack` I see that there are incorrect imports from `node_modules`. For example we can see imports in `backend-services-2/apps/backend/.webpack/ApiSend/api/send/index.js` that are not present in the corresponding `trycourier/backend/.webpack`:

```
/***/ "../../node_modules/@babel/helper-validator-identifier/lib/identifier.js":
/*!********************************************************************************************************************!*\
  !*** /Users/chef/me/projects/backend-services-2/node_modules/@babel/helper-validator-identifier/lib/identifier.js ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {
```
