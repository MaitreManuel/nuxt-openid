import * as http from 'http';

import { defineEventHandler, getCookie, deleteCookie } from 'h3';
import { getRedirectUrl, getCallbackUrl, getDefaultBackUrl, getResponseMode, setCookieInfo, setCookieTokenAndRefreshToken } from '../../../utils/utils';
import { initClient } from '../../../utils/issueclient';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const { op, config } = useRuntimeConfig().openidConnect;
  const req = event.node.req;
  const res = event.node.res;

  if (config.debug) {
    console.log(`[CALLBACK]: oidc/callback calling, method: ${req.method}`);
  }

  let request = req;

  if (req.method === 'POST') {
    const body = await readBody(event);

    request = {
      method: req.method,
      url: req.url,
      body,
    } as unknown as http.IncomingMessage;
  }

  const responseMode = getResponseMode(config);
  const sessionid = getCookie(event, config.secret);

  deleteCookie(event, config.secret);

  const redirectUrl = getRedirectUrl(req.url, sessionid ? op.redirectUrl : op.redirectLogoutUrl);

  const callbackUrl = getCallbackUrl(op.callbackUrl, redirectUrl, req.headers);
  const defCallBackUrl = getDefaultBackUrl(redirectUrl, req.headers);

  const issueClient = await initClient(op, req, [defCallBackUrl, callbackUrl]);
  const params = issueClient.callbackParams(request);

  if (params.access_token) {
    // Implicit ID Token Flow: access_token
    if (config.debug) {
      console.log(`[CALLBACK]: has access_token in params, accessToken: ${params.access_token}`);
    }

    await processUserInfo(params.access_token, null, event);
    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } else if (params.code) {
    // Authorization Code Flow: code -> access_token
    if (config.debug) {
      console.log(`[CALLBACK]: has code in params, code: ${params.code}, sessionid=${sessionid}`);
    }

    const tokenSet = await issueClient.callback(callbackUrl, params, { nonce: sessionid });

    if (tokenSet.access_token) {
      await processUserInfo(tokenSet.access_token, tokenSet, event);
    }

    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } else {
    if (!Object.entries(params).length) {
      if (config.debug) {
        console.log('[CALLBACK]: callback redirect');
      }

      res.writeHead(302, { Location: redirectUrl });
    } else if (params.error) {
      // redirct to auth failed error page.
      console.error(`[CALLBACK]: error callback ${params.error}, error_description: ${params.error_description}`);

      res.writeHead(302, { Location: '/oidc/error' });
    } else if (responseMode === 'fragment') {
      console.warn(`[CALLBACK]: callback redirect /oidc/cbt?redirect=${redirectUrl}`);

      res.writeHead(302, { Location: '/oidc/cbt?redirect=' + redirectUrl });
    } else {
      console.error(`[CALLBACK]: error callback ${redirectUrl}`);

      res.writeHead(302, { Location: redirectUrl });
    }

    res.end();
  }

  async function processUserInfo(accessToken: string, tokenSet: any, event: any) {
    try {
      const { config } = useRuntimeConfig().openidConnect;
      const userinfo = await issueClient.userinfo(accessToken);

      // token and refresh token setting
      if (tokenSet) {
        setCookieTokenAndRefreshToken(event, config, tokenSet);
      }

      // userinfo setting
      await setCookieInfo(event, config, userinfo);
    } catch (err) {
      console.error(`[CALLBACK]: ${err}`);
    }
  }
})
