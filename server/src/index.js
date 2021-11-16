const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const { PubSub } = require("graphql-subscriptions");
//const { SubscriptionServer } = require("subscriptions-transport-ws");
const { PrismaClient } = require("@prisma/client");
//onst { execute, subscribe } = require("graphql");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Subscription = require("./resolvers/Subscription");
const User = require("./resolvers/User");
const Link = require("./resolvers/Link");
const Vote = require("./resolvers/Vote");
const fs = require("fs");
const path = require("path");
const { getUserId } = require("./utils");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

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

  const formatError = (err) => {
    console.error("--- GraphQL Error ---");
    console.error("Path:", err.path);
    console.error("Message:", err.message);
    console.error("Code:", err.extensions.code);
    console.error("Original Error", err.originalError);
    return err;
  };

  const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req }) => {
      return {
        ...req,
        prisma,
        pubsub,
        userId: req && req.headers.authorization ? getUserId(req) : null,
      };
    },

    formatError,
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

  // create and use the websocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema,
      context: ({ req }) => {
        return {
          ...req,
          prisma,
          pubsub,
          userId: req && req.headers.authorization ? getUserId(req) : null,
        };
      },
    },
    wsServer
  );
})();
