# Preferences

Preferences service handles user preferences. It is responsible for:

- storing user preferences
- storing preferences by a group (preference group)
- storing section preferences
  - section can have multiple preference groups
  - preference group can have notificaton templates or events attached to it which a user can either subscribe to or unsubscribe from, snooze or dismiss event for specific time, or have preference based on what channel they are interested in (e.g. email, push, sms).
- storing channel preferences for a user (receipt of notification)

## Access patterns

- ### Get all sections for a workspace

```ts
{
  pk: `s/${workspace_id}`;
}
```

- ### Get single section by section_id

```ts
{
  pk: `s/${workspace_id}/${section_id}`;
}
```

- ### Get preference groups in a section

```ts
{
  gsi2pk: `s_pg/${workspace_id}/${section_id}`;
}
```

## Access patterns for published preferences

All the PKs are prefixed with `hp` -> `hp` stands for `h`osted `p`references. I am down to change the prefix to something else if you have a better idea.

### Get a published preference by workspace_id

```ts
{
  pk: `hp/<workspace_id>`;
}
```

This document above :point_up: stores all the meta information about published asset.

```ts
{
  draftPreviewUrl: string;
  id: string;
  pageId: string;
  publishedAt: string;
  publishedBy: string;
  publishedVersion?: string;
}
```

### Get all the sections for a workspace, by a specific published version

```ts
{
  gsi2pk: `hp/${workspaceId}/s/${page.publishedVersion}`;
}
```

### Get all subscription topics for a workspace, by a specific published version

```ts
{
  gsi2pk: `hp/${workspaceId}/s/${topic.sectionId}/st/${page.publishedVersion}`;
}
```

### Get all notification templates associated with subscription topic for a workspace, by a specific published version

```ts
{
  gsi2pk: `hp/${workspaceId}/s/${sectionId}/st/${topicId}/n_t/${page.publishedVersion}`;
}
```
