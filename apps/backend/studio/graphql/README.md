# Courier GraphQL: Studio

## Authorization

Both objects and fields can be decorated with an authorizer to control access.

```
// object level
export default gql`
  type Tenant implements Node @authorize(role: OWNER) {
    id: ID!
    name: String!
  }
}

// field level
export default gql`
  type Tenant implements Node {
    id: ID!
    name: String! @authorize(role: OWNER)
  }
}
```

## Add a new node in the graph

- Add a new folder in `schema/` (eg: `schema/templates`)
- Create a new data source (eg: `schema/templates/data-source.ts`)
  - Add to `studio/graphql/data-sources.ts`
- Create resolvers (eg: `schema/templates/resolvers.ts`)
  - Add to `studio/graphql/schema/resolvers.ts`
- Create type definitions (eg: `schema/templates/type-defs`)
  - Add to `studio/graphql/schema/type-defs.ts`

### Update Node Resolver

For global object identification, the `node resolver` (studio/graphql/schema/node/resolvers.ts).

## Playground

A playground for testing out GraphQL queries can be found at: `https://${AWS_HOST}/dev/studio/q`.

### Authentication

A valid `Authorization` header token is required to access the GraphQL playground. A token can be obtained one of two ways:

- By logging in to [Courier Studio](http://localhost:3000) and extracting the token from the `Network` inspector
- By extracting it from your Insomnia plugin

## Recommended Reading

### General

- [GraphQL Documentation](https://graphql.org/learn/)
- [Apollo Documentation](https://www.apollographql.com/docs/)

### Schema Design

- [Global Object identification](https://graphql.org/learn/global-object-identification/)
- [Creating Schema Directives](https://www.apollographql.com/docs/apollo-server/schema/creating-directives/)
- [Best Practices/Design Patterns](https://www.moesif.com/blog/api-guide/graphql-best-practices-resources-and-design-patterns/)

### Connections/Pagination

- [Relay-Style Pagination](https://www.apollographql.com/docs/react/data/pagination/#relay-style-cursor-pagination)
- [Connection Spec](https://relay.dev/graphql/connections.htm)
- [Explaining Connections](https://www.apollographql.com/blog/explaining-graphql-connections-c48b7c3d6976/)
- [Request Waterfall](https://www.apollographql.com/blog/optimizing-your-graphql-request-waterfalls-7c3f3360b051/)
