# Courier / Backend

Testing main branch deploy.

## Installation

1. Install `homebrew`

[https://brew.sh/](https://brew.sh/)

2. Install `nvm`

[https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

3. Setup new login account with AWS.

4. Turn on MFA for the new account. Then, logout & log back in before proceeding. **NOTE**: Once you begin the process of setting up MFA, **FINISH IT THROUGH** or else an error will occur requiring admin to reset the process.

5. Work with another engineer to get an AWS Dev Account (12 digit code) and Role (e.g. `TonyDevAccountAccessRole`)

   - Be sure to set your region to `us-east-1` (N. Virginia)

   - Switch to the dev account by clicking on your acount and selecting the `Switch Roles` menu item:

   <img width="347" alt="Screen Shot 2021-09-23 at 10 24 53 AM" src="https://user-images.githubusercontent.com/7987513/134556437-46a763e0-571c-4908-ba03-f59beb7ee63b.png">

   - On the next page, hit the `Switch Roles` button:

   <img width="1152" alt="Screen Shot 2021-09-23 at 10 25 13 AM" src="https://user-images.githubusercontent.com/7987513/134556552-2bbb3651-4a11-4a60-81d3-42da10ed5ca3.png">

   - Enter the new AWS Dev Account info (Note: It's a good idea to mark your dev account with the green color):

   <img width="377" alt="Screen Shot 2021-09-23 at 10 26 53 AM" src="https://user-images.githubusercontent.com/7987513/134556620-35f56665-ce95-484b-9c39-d0120557d29b.png">

   - The dev account is now the active account:

   <img width="261" alt="Screen Shot 2021-09-23 at 10 27 42 AM" src="https://user-images.githubusercontent.com/7987513/134556948-4a497890-2669-4ae9-b6d9-fecf167275a8.png">

   - Note: The steps above are not tied directly to your main account and must be repeated if you enter incognito mode or clear your browser cache.

   - Now, create a new IAM user, give it `AdministratorAccess` policy, and capture the Access and Secret keys.

6. Install & Configure AWS

```bash
brew install python # for aws
brew install awscli
aws configure
```

Use the Access and Secret keys from the new IAM account created in Step 5.
Use `us-east-1` region.

7. Install Other Things

```bash
nvm install 14
nvm alias default 14
brew install yarn # 1.16+

yarn install
```

## Deploy

1. Create a `.dev-config.yml` with following details

```yml
COURIER_AUTH_TOKEN: QTFE2W95A2M3RWHH7QS4TXM95W57 # This token points to `riley@trycourier.com` workspace in staging. We use that to send notifications in development.
LAUNCHDARKLY_SDK_KEY: <ask_developer_in_your_team>
```

2. Run

```bash
yarn serverless:deploy
```

3. Run elastic search lambdas. Go to AWS console and run the lamdas that begin with `SetElasticSearch` [Note: test events can be any random JSON]

4. Assuming you have setup the frontend locally, create a workspace, make a note of `workspace | tenantId`, you can find the newly created `tenantId` in dynamodb table named `dev_backend-tenants` from dynamodb aws console. Add the `tenantId` in your `.dev-config.yml`

```yml
COURIER_AUTH_TOKEN: QTFE2W95A2M3RWHH7QS4TXM95W57 # This token points to `riley@trycourier.com` workspace in staging. We use that to send notifications in development.
LAUNCHDARKLY_SDK_KEY: <ask_developer_in_your_team>
COURIER_TENANT_ID: <your_newly_created_tenant_in_your_aws_account>
```

5. Update your `.dev-config.yml` with above noted url.

```yml
COURIER_AUTH_TOKEN: QTFE2W95A2M3RWHH7QS4TXM95W57 # This token points to `riley@trycourier.com` workspace in staging. We use that to send notifications in development.
LAUNCHDARKLY_SDK_KEY: <ask_developer_in_your_team>
COURIER_TENANT_ID: <your_newly_created_tenant_in_your_aws_account>
COURIER_EMAIL_CONFIG_ID: <your_unique_config_id>
```

6. Run `yarn serverless:deploy` one final time.

### Deploy In App (Optional)

1. Clone [courier-push-provider](https://github.com/trycourier/courier-push-provider)

```sh
cd my-projects-directory # Be sure to use your *actual* projects directory
git clone <path to courier-push-provider>
cd courier-push-provider
yarn install
yarn deploy
```

2. navigate to `API Gateway` in aws console, switch to your dev account and make a note of following
   <img width="1078" alt="Screen Shot 2021-08-07 at 7 21 23 PM" src="https://user-images.githubusercontent.com/606167/128618649-aff832a2-a1c4-40a4-84ca-a955221f9292.png">

3. Update `.dev-config.yml` your in app API url (found in API Gateway above)

```yml
COURIER_AUTH_TOKEN: QTFE2W95A2M3RWHH7QS4TXM95W57 # This token points to `riley@trycourier.com` workspace in staging. We use that to send notifications in development.
LAUNCHDARKLY_SDK_KEY: <ask_developer_in_your_team>
COURIER_TENANT_ID: <your_newly_created_tenant_in_your_aws_account>
IN_APP_API_URL: https://<your_id>.execute-api.us-east-1.amazonaws.com/dev
```

4. `yarn serverless:deploy`.

### Deploy Email Previews (Optional)

1. Ask for sendgrid keys from your team. Install the integration from your local courier web-application. After installing the integration, spy on network tab and get hold of configuration id that sendgrid provides.

<img width="1351" alt="Screen Shot 2021-08-07 at 2 17 08 PM" src="https://user-images.githubusercontent.com/606167/128618559-42eb232b-16c0-461a-94c3-dec0f8a85951.png">

2. Update `.dev-config.yml` with the sendgrid configuration id from above.

```yml
COURIER_AUTH_TOKEN: QTFE2W95A2M3RWHH7QS4TXM95W57 # This token points to `riley@trycourier.com` workspace in staging. We use that to send notifications in development.
LAUNCHDARKLY_SDK_KEY: <ask_developer_in_your_team>
COURIER_TENANT_ID: <your_newly_created_tenant_in_your_aws_account>
IN_APP_API_URL: https://<your_id>.execute-api.us-east-1.amazonaws.com/dev
COURIER_EMAIL_CONFIG_ID: <your_unique_config_id>
```

3. `yarn serverless:deploy`.

## Test Locally

```bash
yarn serverless:invoke-local <FUNCTION_NAME> <FILE_NAME>
```

### `debug.<TODO>.json`

```json
{
  "headers": {
    "Authorization": "Bearer <TODO>"
  },
  "body": {}
}
```

```json
{
  "headers": {},
  "requestContext": {
    "identity": {
      "cognitoIdentityId": "<TODO>"
    }
  },
  "body": {}
}
```

## Click-through Tracking

For production, click-through tracking (CTT) requires a domain name to use when creating tenant subdomains so the following environment values (or .dev-config.yml values for dev environments):

- `CLICK_THROUGH_TRACKING_DOMAIN_NAME` (for example `ct0.app`)
- `CLICK_THROUGH_TRACKING_HOSTED_ZONE` (the Route53 hosted zone of the domain. For example: `XYZ1234ETCECT1`)

If you are adding these for the first time, the `ClickThroughTrackingCert` will be created and require you to manually create the Route53 validation CNAME record. You should be able to do this by going to `https://console.aws.amazon.com/acm`, finding the `*.your.domain` cert that is pending, expanding the domain, and clicking "Create record in Route53."

## Reindex Elasticsearch

**Warning: Should only be run in Dev. DO NOT PERFORM THE FOLLOWING ACTION IN PRODUCTION**

If the logs from the data tab are not populating, run the SetElasticSearchMessagesIndex function. To do so, find the `SetElasticSearchMessagesIndex` function in lambda. Then navigate to the test tab and execute a test event with an empty payload (`{}`). Once the test finishes the data logs tab should start populating as you make send requests.

## Stripe

Stripe integration is optional and will require the following environment variables that can be obtained from the Stripe administrator:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Recommended .zshenv additions

```bash
export STRIPE_SECRET_KEY=#####
export STRIPE_WEBHOOK_SECRET=whsec_#####
if [ -z "$STRIPE_SECRET_KEY" ]
then
  export STRIPE_ENABLED=false
else
  export STRIPE_ENABLED=true
fi
```

### Stripe Event Listener

You can register your environment to the test stripe instance by running `yarn serverless:invoke-local -f BinStripeUpdateListener`

## Release Process

### Standard Release

A standard release is any release that follows the normal flow of code to production. That takes the following path to production:

- A pull request is opened, reviewed, and approved
- The pull request is merged into `main` which triggers a deployment to staging
- Verification is done in the staging environment
- A release is cut which triggers a deployment to the production environment

#### Versioning

Standard releases should increment the `minor` segment of the product version.

### Hot-fix Release

A hot-fix release is any release that is deployed directly to production to remediate a critical production issue and is deployed from a branch other than `main/master`. Hot-fix releases should adhere to the following procedure:

1. A pull request is opened, reviewed, and approved.
2. The pull request is merged into `main`
3. A new branch is created that is checked out from the current production tag/version.
4. The change should be "cherry-picked" into a release branch named `hotfix-v0.XXX.YY` (this branch should not be deleted). `XXX` should be the current `minor` version. `YY` should be the incremented `patch` version (eg: `hotfix-v0.249.1`)

   `git cherry-pick <commit-hash>`

5. A release is cut pointing to the release branch triggering a production deployment.

   [Note: Ensure the branch we release from is the one we created in step (c) above, however the tag would be the version itself (eg: `v0.249.1`) so GH prod pipeline action gets triggered]

#### Approval

All hot-fix releases should be approved.

#### Versioning

Hot-fix releases should increment the `patch` segment of the product version.

##### Note

In order to release main to production we rely on automated process that picks up new tags. If the tag is of the format `v0.*` it will trigger a deployment.

For "scheduling" a deployment, use the GitHub console, create a new tag, generate release notes and save as draft.

After messaging the #engineering channel and getting sign off from the engineers that are tagged in the release notes you can release by publishing the new tag.

## License

Copyright © 2020 courier.com, Inc. All Rights Reserved.

Unauthorized copying of the files within this repository, via any medium, is strictly prohibited. These files are proprietary and confidential.
