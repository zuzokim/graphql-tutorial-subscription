import React from "react";
import ReactDOM from "react-dom";
import "./styles/index.css";
import App from "./components/App";
import { BrowserRouter } from "react-router-dom";
import { ApolloLink, Observable } from "@apollo/client/core";
import { print } from "graphql";
import { createClient } from "graphql-ws";
import { split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import {
  ApolloProvider,
  ApolloClient,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { AUTH_TOKEN } from "./constants";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});

//https://github.com/howtographql/howtographql/issues/1217
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

class WebSocketLink extends ApolloLink {
  constructor(options) {
    super();
    this.client = createClient(options);
  }

  request(operation) {
    return new Observable((sink) => {
      return this.client.subscribe(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: (err) => {
            if (Array.isArray(err))
              // GraphQLError[]
              return sink.error(
                new Error(err.map(({ message }) => message).join(", "))
              );

            if (err instanceof CloseEvent)
              return sink.error(
                new Error(
                  `Socket closed with event ${err.code} ${err.reason || ""}` // reason will be available on clean closes only
                )
              );

            return sink.error(err);
          },
        }
      );
    });
  }
}

const wslink = new WebSocketLink({
  url: "ws://localhost:4000/graphql",
  connectionParams: () => {
    const token = localStorage.getItem(AUTH_TOKEN);

    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  },
});
const splitLink = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wslink,
  authLink.concat(httpLink)
);

// 3  instantiate ApolloClient
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
