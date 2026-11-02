import { createRequestHandler } from 'expo-server/adapter/workerd';

export default {
  fetch: createRequestHandler({ build: './server' }),
};
