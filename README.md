# graphql-transform-schema
Transform, filter & alias resolvers of a GraphQL schema

## Install

```sh
yarn add graphql-transform-schema
```

## Usage

By default `transformSchema` passes through all queries/mutations.

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
  alexaHello: ({ args, resolve }) => resolve(args).replace('Bob', 'Alice'),
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
  alexaHello: ({ args, resolve }) => resolve({ name: 'John' }),
})
```

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

![](http://i.imgur.com/5RHR6Ku.png)
