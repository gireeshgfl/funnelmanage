import { ApolloClient, InMemoryCache } from '@apollo/client';
import { API_ROUTES } from '@/config';

const client = new ApolloClient({
  uri: API_ROUTES.GRAPHQL.ENDPOINT,
  cache: new InMemoryCache(),
});

export default client;