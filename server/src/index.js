const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { PrismaClient } = require("@prisma/client");
const { execute, subscribe } = require("graphql");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Subscription = require("./resolvers/Subscription");
const User = require("./resolvers/User");
const Link = require("./resolvers/Link");
const Vote = require("./resolvers/Vote");
const fs = require("fs");
const path = require("path");
const { getUserId } = require("./utils");

const pubsub = new PubSub();

const prisma = new PrismaClient({
  errorFormat: "minimal",
});

const resolvers = {
  Query,
  Mutation,
  Subscription,
  User,
  Link,
  Vote,
};

const schema = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  resolvers,
});

(async () => {
  const app = express();

  app.use(cors());

  const httpServer = createServer(app);

  const server = new ApolloServer({
    subscriptions: {},
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    context: ({ req }) => {
      return {
        ...req,
        prisma,
        pubsub,
        userId: req && req.headers.authorization ? getUserId(req) : null,
      };
    },
  });

  const subscriptionServer = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: "/subscriptions" }
  );

  await server.start();
  server.applyMiddleware({ app });

  httpServer.listen(4000, () =>
    console.log(`Server is now running on http://localhost:${4000}/graphql`)
  );
})();
