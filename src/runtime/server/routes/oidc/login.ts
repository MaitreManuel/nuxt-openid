import { defineEventHandler, setCookie, getCookie } from 'h3';
import { generators } from 'openid-client';

import { getRedirectUrl, getCallbackUrl, getDefaultBackUrl, getResponseMode } from '../../../utils/utils';
import { initClient } from '../../../utils/issueclient';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const { op, config } = useRuntimeConfig().openidConnect;

  if (config.debug) {
    console.log('[LOGIN]: oidc/login calling');
  }

  const req = event.node.req;
  const res = event.node.res;

  const redirectUrl = getRedirectUrl(req.url, op.redirectUrl);
  const callbackUrl = getCallbackUrl(op.callbackUrl, redirectUrl, req.headers);
  const defCallBackUrl = getDefaultBackUrl(redirectUrl, req.headers);

  const issueClient = await initClient(op, req, [callbackUrl, defCallBackUrl]);
  const sessionkey = config.secret;
  let sessionid = getCookie(event, config.secret);

  if (!sessionid) {
    sessionid = generators.nonce();

    if (config.debug) {
      console.log(`[LOGIN]: regenerate sessionid=${sessionid}`);
    }
  } else {
    if (config.debug) {
      console.log(`[LOGIN]: cookie sessionid=${sessionid}`);
    }
  }

  const responseMode = getResponseMode(config);
  const scopes = op.scope.includes('openid') ? op.scope : [...op.scope, 'openid'];

  if (config.debug) {
    console.log(`[LOGIN]: req.url: ${req.url}`);
    console.log(`[LOGIN]: op.redirectLogoutUrl: ${op.redirectUrl}, redirectUrl: ${redirectUrl}`);
    console.log(`[LOGIN]: op.callbackLogoutUrl: ${op.callbackUrl}, callbackUrl: ${callbackUrl}`);
    console.log(`[LOGIN]: defCallBackUrl: ${defCallBackUrl}`);
    console.log(`[LOGIN]: response_mode: ${responseMode}, response_type: ${config.response_type}, scopes: ${scopes.join(' ')}`);
    console.log(`[LOGIN]: protocol: ${req.headers['x-forwarded-proto']}, host: ${req.headers.host}`);
  }

  const parameters = {
    redirect_uri: callbackUrl,
    response_type: config.response_type,
    response_mode: responseMode,
    nonce: sessionid,
    scope: scopes.join(' '),
  };
  const authUrl = issueClient.authorizationUrl(parameters);

  if (config.debug) {
    console.log(`[LOGIN]: Auth Url: ${authUrl}, #sessionid: ${sessionid}`);
  }

  if (sessionid) {
    setCookie(event, sessionkey, sessionid, {
      maxAge: config.cookieMaxAge,
      ...config.cookieFlags[sessionkey as keyof typeof config.cookieFlags],
    });
  }

  res.writeHead(302, { Location: authUrl });
  res.end();
})
