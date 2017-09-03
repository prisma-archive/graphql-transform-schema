import * as express from 'express'
import * as bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { makeRemoteExecutableSchema } from 'graphql-tools'
import { createApolloFetch } from 'apollo-fetch'
import { transformSchema } from 'graphql-transform-schema'

async function run() {
  const schema = await makeRemoteExecutableSchema(createApolloFetch({
    uri: 'https://api.graph.cool/simple/v1/swapi',
  }))

  const transformedSchema = transformSchema(schema, {
    '*': false,
    Starship: true,
    allPersons: true,
  })

  const app = express()

  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema: transformedSchema }))

  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      query: `\
{
  Starship(name: "Millennium Falcon") {
    name
    hyperdriveRating
    pilots(orderBy: height_DESC) {
      name
      height
      homeworld {
        name
      }
    }
  }
}`,
    })
  )

  app.listen(3001)
  console.log('Server running. Open http://localhost:3001/graphiql to run queries.')
}

try {
  run()
} catch (e) {
  console.log(e, e.message, e.stack)
}
