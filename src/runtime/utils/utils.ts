import { setCookie } from 'h3';

import { encrypt } from './encrypt';

export const setCookieTokenAndRefreshToken = (event: any, config: any, tokenSet: any) => {
  // token setting
  if (tokenSet && tokenSet.expires_at) {
    const expireDate = new Date(tokenSet.expires_at * 1000); // second to ms

    setCookie(event, config.cookiePrefix + 'access_token', tokenSet.access_token, {
      expires: expireDate,
      ...config.cookieFlags['access_token' as keyof typeof config.cookieFlags],
    });
  } else {
    setCookie(event, config.cookiePrefix + 'access_token', tokenSet.access_token, {
      maxAge: config.cookieMaxAge,
      ...config.cookieFlags['access_token' as keyof typeof config.cookieFlags],
    });
  }

  // refresh token setting
  if (tokenSet && tokenSet.refresh_expires_in && tokenSet.refresh_token) {
    setCookie(event, config.cookiePrefix + 'refresh_token', tokenSet.refresh_token, {
      maxAge: tokenSet.refresh_expires_in,
      ...config.cookieFlags['refresh_token' as keyof typeof config.cookieFlags],
    });
  }
}

export const setCookieInfo = async (event: any, config: any, userinfo: any) => {
  const { cookie, isCookieUserInfo } = config;

  if (isCookieUserInfo) {
    for (const [key, value] of Object.entries(userinfo)) {
      if (cookie && Object.prototype.hasOwnProperty.call(cookie, key)) {
        setCookie(event, config.cookiePrefix + key, JSON.stringify(value), {
          maxAge: config.cookieMaxAge,
          ...config.cookieFlags[key as keyof typeof config.cookieFlags],
        });
      }
    }
    try {
      const encryptedText = await encrypt(JSON.stringify(userinfo), config);

      setCookie(event, config.cookiePrefix + 'user_info', encryptedText, { ...config.cookieFlags['user_info' as keyof typeof config.cookieFlags] });
    } catch (err) {
      console.error(`encrypted userinfo error. ${err}`);
    }
  }
}

export const isUnset = (o: unknown): boolean => typeof o === 'undefined' || o === null;

export const isSet = (o: unknown): boolean => !isUnset(o);

export const getRedirectUrl = (path: string | null | undefined, defaultUri: string = '/'): string => {
  if (!path) {
    return defaultUri;
  }

  const idx = path.indexOf('?');
  const searchParams = new URLSearchParams(idx >= 0 ? path.substring(idx) : path);

  return searchParams.get('redirect') || defaultUri;
}

export function getCallbackUrl(callbackUrl: string, redirectUrl: string, headers: string | undefined): string {
  return callbackUrl && callbackUrl.length > 0
    ? `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}redirect=${redirectUrl}`
    : getDefaultBackUrl(redirectUrl, headers);
}

export function getDefaultBackUrl(redirectUrl: string, { host, 'x-forwarded-proto': protocol = 'https' }: string | undefined): string {
  return `${protocol}://${host}/oidc/cbt?redirect=${redirectUrl}`;
}

/**
   * Response Mode
   *   The Response Mode determines how the Authorization Server returns result parameters from the Authorization Endpoint.
   *   Non-default modes are specified using the response_mode request parameter. If response_mode is not present in a request, the default Response Mode mechanism specified by the Response Type is used.
   *
   * REF:
   *   https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html (English)
   *   https://linianhui.github.io/authentication-and-authorization/05-openid-connect-extension/  (Chinese)
   *
   * response_mode
   * 1. query
   *    In this mode, Authorization Response parameters are encoded in the query string added to the redirect_uri when redirecting back to the Client.
   *    callback http.method: 'GET'
   *    example: https://client.lnh.dev/oauth2-callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz
   * 2. fragment
   *    In this mode, Authorization Response parameters are encoded in the fragment added to the redirect_uri when redirecting back to the Client.
   *    callback http.method: 'GET'
   *    example: http://client.lnh.dev/oauth2-callback#access_token=2YotnFZFEjr1zCsicMWpAA&state=xyz&expires_in=3600
   * 3. form_post (Callback method 'POST') (REF: https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html)
   *
   * Hints:
   * i)   For purposes of this specification, the default Response Mode for the OAuth 2.0 code Response Type is the query encoding.
   * ii)  For purposes of this specification, the default Response Mode for the OAuth 2.0 token Response Type is the fragment encoding.
   * iii) Response_mode 'query' not allowed for implicit or hybrid flow
   */

export function getResponseMode(config: any): string {
  return config.response_mode || getDefaultResponseMode(config.response_type);
}

function getDefaultResponseMode(responseType: string): string {
  const resTypeArray = responseType.match(/[^ ]+/g);

  if (resTypeArray?.findIndex(i => i === 'code') >= 0) {
    return 'query';
  } else if (resTypeArray?.findIndex(i => i === 'token')) {
    return 'fragment';
  }

  return 'query';
}
