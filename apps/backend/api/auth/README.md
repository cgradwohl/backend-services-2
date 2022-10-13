# Courier Auth API

Intended to allow fine grained access control to the Courier API.

# POST /auth/issue-token

Returns an access token that can be used to authenticate a request to the Courier API.

The request body is the payload courier will sign and return as a token

```ts
interface RequestBody {
  /**
   * Space separated list of permissions granted to the token.
   * Resources affecting a user should include the user(s) as a scope
   * with the format user_id:<user_id>
   */
   */
  scope: string;

  /** Arbitrary additional claims can be attached to the token */
  [key: string]: any;
}
```

Returned Token Body:

```ts
interface AccessTokenJwtPayload {
  /** Space separated list of permissions granted to the token */
  scope: string;

  tenant_scope: TenantScope;

  tenant_id: string;

  /** Arbitrary additional claims can be attached to the token */
  [key: string]: any;
}
```
