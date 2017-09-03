# graphql-transform-schema [![Build Status](https://travis-ci.org/graphcool/graphql-transform-schema.svg?branch=master)](https://travis-ci.org/graphcool/graphql-transform-schema) [![npm version](https://badge.fury.io/js/graphql-transform-schema.svg)](https://badge.fury.io/js/graphql-transform-schema)
Transform, filter & alias resolvers of a GraphQL schema

## Install

```sh
yarn add graphql-transform-schema
```

## Usage

By default `transformSchema` passes through all queries/mutations. ([Open Demo](https://example-rakllksfme.now.sh/graphiql))

```ts
import { transformSchema } from 'graphql-transform-schema'

// needed for remote schemas
import { createApolloFetch } from 'apollo-fetch'
import { makeRemoteExecutableSchema } from 'graphql-tools'

const schema = await makeRemoteExecutableSchema(createApolloFetch({
  uri: 'https://api.graph.cool/simple/v1/swapi',
}))

// hide every query/mutation except the `Starship` and `allStarships` query
const transformedSchema = transformSchema(schema, {
  '*': false,
  Starship: true,
  allStarships: true,
})
```

### API

```ts
interface Rules {
  [fieldName: string]: boolean | Function
}

function transformSchema(schema: GraphQLSchema, rules: Rules): GraphQLSchema
```

### Examples

#### Remove all `createX` and `deleteX` mutations

```ts
const transformedSchema = transformSchema(schema, {
  'create*': false,
  'delete*': false,
})
```

#### Overwrite resolved data

```ts
const typeDefs = `
  type Query {
    hello: String!
  }

  type Mutation {
    alexaHello(name: String!): String!
  }
`
const resolvers = {
  Query: {
    hello: () => 'Hello world',
  },
  Mutation: {
    alexaHello: (_, { name }) => `Alexa: Hello world, ${name}`,
  },
}
const schema = makeExecutableSchema({ typeDefs, resolvers })

const transformedSchema = transformSchema(schema, {
  alexaHello: ({ args, resolve }) => resolve(args).replace('Bob', 'Alice'),
})
```

#### Overwrite arguments

```ts
const typeDefs = `
  type Query {
    hello: String!
  }

  type Mutation {
    alexaHello(name: String!): String!
  }
`
const resolvers = {
  Query: {
    hello: () => 'Hello world',
  },
  Mutation: {
    alexaHello: (_, { name }) => `Alexa: Hello world, ${name}`,
  },
}
const schema = makeExecutableSchema({ typeDefs, resolvers })

const transformedSchema = transformSchema(schema, {
  alexaHello: ({ args, resolve }) => resolve({ name: 'John' }),
})
```

## Next steps

- [ ] Alias/rename types and fields
- [ ] Transform field arguments
- [ ] Compose new queries/mutations out of existing queries/mutations

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
