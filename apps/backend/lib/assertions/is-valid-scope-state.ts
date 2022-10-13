import {
  additionalScopes,
  defaultScopes,
} from "~/lib/tenant-service/token-scopes";
import { TenantScope } from "~/types.internal";

export default function assertStateIsValid(
  state: string
): asserts state is "published" | "draft" | "submitted" {
  if (state !== "published" && state !== "draft" && state !== "submitted") {
    throw new Error(`Invalid state: ${state}`);
  }
}

export function assertValidScope(scope: string): asserts scope is TenantScope {
  const allScopes = new Map([...defaultScopes, ...additionalScopes]);
  if (!allScopes.has(scope)) {
    throw new Error(`Invalid scope: ${scope}`);
  }
}
