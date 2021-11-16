// import React from "react";
// import ReactDOM from "react-dom";
// import "./styles/index.css";
// import App from "./components/App";
// import { BrowserRouter } from "react-router-dom";

// import { split } from "@apollo/client";
// import { WebSocketLink } from "@apollo/client/link/ws";
// //import { createClient } from "graphql-ws";
// import { getMainDefinition } from "@apollo/client/utilities";

// // 1
// import {
//   ApolloProvider,
//   ApolloClient,
//   createHttpLink,
//   InMemoryCache,
// } from "@apollo/client";
// import { setContext } from "@apollo/client/link/context";
// import { AUTH_TOKEN } from "./constants";

// const httpLink = createHttpLink({
//   uri: "http://localhost:4000/graphql",
// });

// //https://github.com/howtographql/howtographql/issues/1217
// const authLink = setContext((_, { headers }) => {
//   const token = localStorage.getItem(AUTH_TOKEN);
//   return {
//     headers: {
//       ...headers,
//       authorization: token ? `Bearer ${token}` : "",
//     },
//   };
// });

// const wsLink = new WebSocketLink({
//   uri: `ws://localhost:4000/subscriptions`,
//   options: {
//     reconnect: true,
//     timeout: 30000,
//     connectionParams: {
//       authToken: localStorage.getItem(AUTH_TOKEN),
//     },
//   },
// });

// const splitLink = split(
//   ({ query }) => {
//     const { kind, operation } = getMainDefinition(query);
//     return kind === "OperationDefinition" && operation === "subscription";
//   },
//   wsLink,
//   authLink.concat(httpLink)
// );

// // 3  instantiate ApolloClient
// const client = new ApolloClient({
//   link: splitLink,
//   cache: new InMemoryCache(),
// });

// ReactDOM.render(
//   <BrowserRouter>
//     <ApolloProvider client={client}>
//       <App />
//     </ApolloProvider>
//   </BrowserRouter>,
//   document.getElementById("root")
// );
