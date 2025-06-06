import { deleteCookie, defineEventHandler, getCookie, getRequestProtocol, getRequestHost } from 'h3';
import { getRedirectUrl } from '../../../utils/utils';
import { initClient } from '../../../utils/issueclient';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const { config, op } = useRuntimeConfig().openidConnect;
  const req = event.node.req;
  const res = event.node.res;

  if (config.debug) {
    console.log('[LOGOUT]: oidc/logout calling');
  }

  const redirectLogoutUrl = (absolute: boolean = false) => {
    const redirectLogoutUrl: string = getRedirectUrl(event.path, op.redirectLogoutUrl);

    return !absolute || redirectLogoutUrl.startsWith('http')
      ? redirectLogoutUrl
      : `${getRequestProtocol(event)}://${getRequestHost(event)}${redirectLogoutUrl}`;
  };

  const refreshToken = getCookie(event, config.cookiePrefix + 'refresh_token');

  if (config.debug) {
    console.log(`[LOGOUT]: event.path: ${event.path}`);
    console.log(`[LOGOUT]: op.redirectLogoutUrl: ${op.redirectLogoutUrl}, redirectLogoutUrl: ${redirectLogoutUrl()}`);
    console.log(`[LOGOUT]: protocol: ${getRequestProtocol(event)}, host: ${getRequestHost(event)}`);
  }

  deleteCookie(event, config.secret);
  deleteCookie(event, config.cookiePrefix + 'access_token');
  deleteCookie(event, config.cookiePrefix + 'refresh_token');
  deleteCookie(event, config.cookiePrefix + 'user_info');

  const issueClient = await initClient(op, req, [redirectLogoutUrl()]);
  const tokenSet = await issueClient.refresh(refreshToken);

  const parameters = {
    id_token_hint: tokenSet.id_token,
    post_logout_redirect_uri: redirectLogoutUrl(true),
  };
  const logoutUrl = issueClient.endSessionUrl(parameters);

  if (config.debug) {
    console.log(`[LOGOUT]: Logout Url: ${logoutUrl}`);
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
