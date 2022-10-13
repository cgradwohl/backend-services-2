# Audience

Audience is the collection users who match the audience rule criteria. This collection will be modifed by the audience rule. As soon as a rule that governs the audience is modified, the audience collection will be updated to reflect the new audiences. This is useful for end users who want to send a message to a specific audience. Say for example Courier wants to reach out to all the workspace admins, who are located in United States.

# Audience API

Audience API is a RESTful API for managing the a target audience of your application. You can create a rule using the API to define the target audience that you want to reach out to. Once you define the audience, Courier will scan the users you have created using [Profiles API](https://www.courier.com/docs/reference/profiles/) and create a target audiences that matches the rules you have defined.

## Audience Rules

Audience rules is a set of conditions that defines the target audience met the conditions defined in the rule. You can define more than one rules to define the target audience that you want to reach out to. Rules will scoped to the profile information that you have created using the [Profiles API](https://www.courier.com/docs/reference/profiles/).

## key segments

- a => audience
- a_m => audience_member

## Types

```ts
interface IDDBAudienceKeys {
  gsi1pk: string;
  pk: string;
}

interface IDDBAudience extends IDDBAudienceKeys {
  audience_id: string;
  created_at: string;
  last_send_at: string;
  member_count: number;
  updated_at: string;
  version: number; //3
  workspace_id: string;
}

interface IDDBAudienceMember extends IDDBAudienceKeys {
  added_at: string;
  audience_id: string;
  audience_version: number; // 3
  member_id: string;
  reason: string;
  workspace_id: string;
}
```

## Access patterns

- ### Get audience by audience_id

```ts
{
  pk: `a/${workspace_id}/${audience_id}`;
}
```

- ### List audiences by workspace_id

```ts
{
  gsi1pk: `a/${workspace_id}/${shard_id}`;
}
```

- ### Get single audience member by audience_id and member_id

```ts
{
  pk: `a_m/${workspace_id}/${audience_id}/${version}/${member_id}`;
}
```

- ### List audience members by audience_id (while sending)

```ts
{
  gsi1pk: `a_m/${workspace_id}/${audience_id}/${version}/${shard_id}`;
}
```

- ### List audiences by user_id

```ts
{
  gsi2pk: `a_u/${workspace_id}/${user_id}/${shard_id}`;
}
```

- ### Get audience calculation status

```ts
{
  pk: `a_cal_status/${workspace_id}/${audience_id}/${version}`;
}
```

e.g. If you have a user profile with the following information:

```
{
  "name": "John Doe",
  "email": "john@courier.com",
  "locale": "en-US",
  "title": "software engineer",
}
```

And say you have to reach out to all of your users who are in the US, you can define the following
rule.

```
{
  "if": "$.locale == 'en-US'",
}
```

You can combine multiple rules to define the target audience. This follows LISP style.

```
{
  "and": [
    {
      "if": "$.locale == 'en-US'"
    },
    {
      "if": "$.title == 'software engineer'"
    }
  ],
}

```

You can also add a rule that will be applied to a property that is a of type array.

```
{
  "includes": ["$.favorite_color", "purple"],
}
```

To create an audience, you need to provide the following information:

## POST /audiences

```
{
  "name": "My favorite software engineers",
  "rules": [
    {
      "and": [
        {
          "if": "$.locale === 'en-US'"
        },
        {
          "if": "$.title === 'software engineer'"
        },
        {
          "if": "$.company === 'Courier'"
        }
      ]
    }
  ]
}
```

Response will return the following information:

```
{
  "audience_id": "u7TLblDkrewVHXDpibbD8",
  "status": "success",
}
```

## GET /audiences/{audience_id}

Retrieve an audience by its id.

```
{
  "audience_id": "u7TLblDkrewVHXDpibbD8",
  "audience_count": 1,
  "created_at": "2020-04-08T14:51:31.000Z",
  "last_updated_at": "2020-04-08T14:51:31.000Z",
  "name": "My favorite software engineers",
  "rules": [
    {
      "and": [
        {
          "if": "$.locale === 'en-US'"
        },
        {
          "if": "$.title === 'software engineer'"
        },
        {
          "if": "$.company === 'Courier'"
        }
      ]
    }
  ],
}
```

## PUT /audiences/{audience_id}

Update an existing audience by its id.

```
{
  "name": "My favorite product support engineers",
  "rules": [
    {
      "and": [
        {
          "if": "$.locale === 'en-US'"
        },
        {
          "if": "$.title === 'Proud Support Engineer'"
        },
        {
          "if": "$.company === 'TryCourier'"
        }
      ]
    }
  ],
}
```

## Dependencies on parent (backend) stack

| Resource                 | Reason for import                                                                                                           |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `actionStream`           | Needed in Audiences stack so that we can stream audience member send                                                        |
| `authorizers`            | Needed in Audiences stack so that we can have authenticated APIs                                                            |
| `audiencesStream`        | Needed in Audiences stack so that we can stream action that would go fetch audience members and invoke send action for them |
| `elasticSearch`          | Needed in Audiences stack so that we put audiences in ES to ubse used in UI                                                 |
| `cognitoUserPoolArn`     | Needed in Audiences stack so that we can create authenticated Studio endpoints (GraphQL + REST)                             |
| `courierEventBusName`    | Needed in Audiences stack to fire off webhook events)                                                                       |
| `sessionManagementTable` | Needed in Audiences stack so that `verifyJwtMiddleware` middleware can authenticate JWT tokens by session                   |
| `profilesTableStreamArn` | Needed in Audiences stack so that we can perform Just In Time audiences membership calculation                              |
