import { defineEventHandler, setCookie, getCookie } from 'h3';

import { CBT_PAGE_TEMPATE } from '../../../utils/template';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler((event) => {
  const { config } = useRuntimeConfig().openidConnect;

  if (config.debug) {
    console.log('[CBT]: oidc/cbt calling');
  }

  const res = event.node.res;
  const html = CBT_PAGE_TEMPATE;

  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    Expires: new Date().toUTCString(),
  });
  res.end(html);
})
