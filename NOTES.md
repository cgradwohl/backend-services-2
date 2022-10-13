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

### Breaking Convention

- after following NX's migration sugestions I realized that splitting Configuration files to go in the root of your application, and application code goes into the src/app folder was problematic and required changing webpack config, tsconfig, and serverless webpack plugin. It is not clear why this is necessary, but it is NX's suggestion.

- for now i will shove everything into the src folder so that all the relative paths are the same. (get it to work mode)
- decided to completely abandon nx file structure