import { deleteCookie, defineEventHandler, getCookie, getRequestProtocol, getRequestHost } from 'h3';
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

  // const redirectUrl = getRedirectUrl(req.url, op.redirectLogoutUrl);
  // const callbackUrl = getCallbackUrl(op.callbackLogoutUrl, redirectUrl, req.headers);
  // const defCallBackUrl = getDefaultBackUrl(redirectUrl, req.headers);
  const redirectURI = `${getRequestProtocol(event)}://${getRequestHost(event)}/`;

  const refreshToken = getCookie(event, config.cookiePrefix + 'refresh_token');

  if (config.debug) {
    console.log(`[LOGOUT]: req.url: ${req.url}`);
    // console.log(`[LOGOUT]: op.redirectLogoutUrl: ${op.redirectLogoutUrl}, redirectUrl: ${redirectUrl}`);
    // console.log(`[LOGOUT]: op.callbackLogoutUrl: ${op.callbackLogoutUrl}, callbackUrl: ${callbackUrl}`);
    // console.log(`[LOGOUT]: defCallBackUrl: ${defCallBackUrl}`);
    console.log(`[LOGOUT]: redirectURI: ${redirectURI}`);
    console.log(`[LOGOUT]: protocol: ${req.headers['x-forwarded-proto']}, host: ${req.headers.host}`);
  }

  deleteCookie(event, config.secret);
  deleteCookie(event, config.cookiePrefix + 'access_token');
  deleteCookie(event, config.cookiePrefix + 'refresh_token');
  deleteCookie(event, config.cookiePrefix + 'user_info');

  const issueClient = await initClient(op, req, [redirectURI]);
  const tokenSet = await issueClient.refresh(refreshToken);

  const parameters = {
    id_token_hint: tokenSet.id_token,
    post_logout_redirect_uri: redirectURI,
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
