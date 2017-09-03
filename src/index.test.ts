import test from 'ava'
import { GraphQLSchema, graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { transformSchema } from './'

test('empty rules yield identity', async t => {
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

  const transformedSchema = transformSchema(schema, {})

  const queryFields = transformedSchema.getQueryType().getFields()
  t.not(queryFields['hello'], undefined)
  const mutationFields = transformedSchema.getMutationType()!.getFields()
  t.not(mutationFields['alexaHello'], undefined)

  const queryResult = await graphql(transformedSchema, `{ hello }`)
  t.ifError(queryResult.errors)
  t.is(queryResult.data!.hello, 'Hello world')
})

test('exclude a query field', t => {
  const typeDefs = `
    type Query {
      hello: String!
      world: String!
    }
  `
  const resolvers = {
    Query: {
      hello: () => 'Hello',
      world: () => 'world',
    },
  }
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const rules = {
    hello: false,
  }

  const transformedSchema = transformSchema(schema, rules)

  const queryFields = transformedSchema.getQueryType().getFields()
  t.is(queryFields['hello'], undefined)
  t.not(queryFields['world'], undefined)
})

test('exclude everything shouldn\'t work', t => {
  const typeDefs = `
    type Query {
      hello: String!
      world: String!
    }

    type Mutation {
      alexaHello(name: String!): String!
    }
  `
  const resolvers = {
    Query: {
      hello: () => 'Hello',
      world: () => 'world',
    },
    Mutation: {
      alexaHello: (_, { name }) => `Alexa: Hello world, ${name}`,
    },
  }
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const rules = {
    '*': false,
  }

  t.throws(() => {
    transformSchema(schema, rules)
  })
})


test('exclude everything expect one query', t => {
  const typeDefs = `
    type Query {
      hello: String!
      world: String!
    }

    type Mutation {
      alexaHello(name: String!): String!
    }
  `
  const resolvers = {
    Query: {
      hello: () => 'Hello',
      world: () => 'world',
    },
    Mutation: {
      alexaHello: (_, { name }) => `Alexa: Hello world, ${name}`,
    },
  }
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const rules = {
    '*': false,
    'hello': true,
  }

  const transformedSchema = transformSchema(schema, rules)

  const queryFields = transformedSchema.getQueryType().getFields()
  t.not(queryFields['hello'], undefined)
  t.is(queryFields['world'], undefined)
  t.is(queryFields['alexaHello'], undefined)
})

test('overwrite args', async t => {
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

  const queryResult = await graphql(transformedSchema, `mutation { alexaHello(name: "Bob") }`)
  t.ifError(queryResult.errors)
  t.is(queryResult.data!.alexaHello, 'Alexa: Hello world, John')
})

test('overwrite data', async t => {
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

  const queryResult = await graphql(transformedSchema, `mutation { alexaHello(name: "Bob") }`)
  t.ifError(queryResult.errors)
  t.is(queryResult.data!.alexaHello, 'Alexa: Hello world, Alice')
})