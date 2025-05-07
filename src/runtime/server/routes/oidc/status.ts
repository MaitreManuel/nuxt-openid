import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
  const req = event.node.req;

  return {
    api: 'nuxt-openid api works'
  };
})
