## Send Data Service

The purpose of the send data service is to interact with an application relationship model for the `/send` api service.
The application data model is documented here: https://www.notion.so/trycourier/V2-Request-Data-Model-and-Access-Patterns-c648ff7199134e7a9b681ffa14fab280

## Goals

The legacy data services are currently used across the application outside of the `/send` scope.
For now this is fine. The goal is within the `/send` application to migrate to this new data model.

## Legacy Services

- `send/service/actions.ts`
- `send/service/requests.ts` (used in Studio: `studio/messages.ts` and used in Bulk:`bulk-processing/services/bulk-processing.ts`.)
- `send/service/messages.ts`
