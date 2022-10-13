#!/bin/bash

export SENTRY_ENV="${SENTRY_ENV:-development}"
export SENTRY_ORG="${SENTRY_ORG:-courier}"
export SENTRY_PROJECT=backend
export SENTRY_VERSION="${GITHUB_SHA:-$(yarn --silent sentry-cli releases propose-version)}"

yarn sentry-cli releases new $SENTRY_VERSION
yarn sentry-cli releases set-commits $SENTRY_VERSION --auto
# .sentryignore file is used to prune files for upload
# currently, dependencies and node_modules are excluded to decrease upload
# and processing time (which can be ~10 minutes with everything included)
yarn sentry-cli releases files $SENTRY_VERSION upload-sourcemaps .webpack \
  --ignore-file .sentryignore \
  --rewrite \
  --strip-common-prefix \
  --url-prefix='/var/task' \
  --wait
yarn sentry-cli releases deploys $SENTRY_VERSION new -e $SENTRY_ENV
