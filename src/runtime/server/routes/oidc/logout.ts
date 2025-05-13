import { deleteCookie, defineEventHandler, getCookie } from 'h3';
import { getCallbackUrl, getDefaultBackUrl, getRedirectUrl } from '../../../utils/utils';
import { initClient } from '../../../utils/issueclient';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const { config, op } = useRuntimeConfig().openidConnect;
  const req = event.node.req;
  const res = event.node.res;

  if (config.debug) {
    console.log('[LOGOUT]: oidc/logout calling');
  }

  const redirectUrl = getRedirectUrl(req.url);
  const refreshToken = getCookie(event, config.cookiePrefix + 'refresh_token');

  const callbackUrl = getCallbackUrl(op.callbackLogoutUrl, redirectUrl, req.headers.host);

  deleteCookie(event, config.secret);
  deleteCookie(event, config.cookiePrefix + 'access_token');
  deleteCookie(event, config.cookiePrefix + 'refresh_token');
  deleteCookie(event, config.cookiePrefix + 'user_info');

  const issueClient = await initClient(op, req, [callbackUrl]);
  const tokenSet = await issueClient.refresh(refreshToken);

  const parameters = {
    id_token_hint: tokenSet.id_token,
    post_logout_redirect_uri: callbackUrl,
  };
  const logoutUrl = issueClient.endSessionUrl(parameters);

  if (config.debug) {
    console.log(`[Logout]: Logout Url: ${logoutUrl}`);
  }

  // delete part of cookie userinfo (depends on user's setting.).
  const cookie = config.cookie;

  if (cookie) {
    for (const [key, value] of Object.entries(cookie)) {
      deleteCookie(event, config.cookiePrefix + key);
    }
  }

  res.writeHead(302, { Location: logoutUrl });
  res.end();
})
