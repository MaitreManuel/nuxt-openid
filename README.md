# Nuxt OpenID

> This is a fork from [nuxt-openid-connect](https://www.npmjs.com/package/nuxt-openid-connect) developed by [aborn](https://github.com/aborn).

OpenID-Connect (OIDC) integration module for [Nuxt](https://github.com/nuxt/nuxt)

## 📋 Features

- A [**Nuxt 3**](https://v3.nuxtjs.org) module (Note: Nuxt 2 is not supported).
- OIDC integration (implemetation based on [openid-client](https://github.com/panva/node-openid-client)).
- [State Management](https://v3.nuxtjs.org/guide/features/state-management/), shared login user info.
- OIDC provider config.
- Encrypt userInfo cookie.
- Support browser localStorage store userInfo, which keep user auth info after page refresh. Similar like [this](https://stackoverflow.com/questions/68174642/how-to-keep-user-authenticated-after-refreshing-the-page-in-nuxtjs).

## ⚙️ Configuration

Add to project
```bash
npx nuxi module add nuxt-openid
```

Or manually
```bash
pnpm add nuxt-openid
# Or
npm install --save nuxt-openid
```

Edit `nuxt.config.ts`
```ts
export default defineNuxtConfig({
  // [...]
  modules: [
    // [...]
    'nuxt-openid',
  ],
  // [...]
  openidConnect: {
    op: {
      issuer: '',
      clientId: '',
      clientSecret: '',
      callbackUrl: '',
      callbackLogoutUrl: '',
      scope: [],
    },
    config: {
      debug: false,
      response_type: 'code',
      secret: 'oidc._sessionid',
      isCookieUserInfo: false,
      cookie: { loginName: '' },
      cookiePrefix: 'oidc._',
      cookieEncrypt: true,
      cookieEncryptKey: 'bfnuxt9c2470cb477d907b1e0917oidc',
      cookieEncryptIV: 'ab83667c72eec9e4',
      cookieEncryptALGO: 'aes-256-cbc',
      cookieMaxAge: 24 * 60 * 60,
      cookieFlags: {
        access_token: {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
        refresh_token: {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
        },
      },
    }
  }
  // [...]
});
```

## 👩‍💻 Usage

```ts
const oidc = useOidc();

// Invoke login page then redirect to "/profile", default is "/"
oidc.login('/profile');

// End session and redirect to "/homepage", default is "/"
oidc.logout('/homepage');

// Refresh user informations
oidc.fetchUser();

// Return user information
oidc.user

// Return boolean of session status
oidc.isLoggedIn
```

## 📚 Documentation

| Name                |    type    | Default                              | Description                                                                                                  |
|---------------------|:----------:|:-------------------------------------|:-------------------------------------------------------------------------------------------------------------|
| **Op**              |            |                                      |                                                                                                              |
| `issuer`            |  `string`  | `''`                                 | Domain base URL including realm name                                                                         |
| `clientId`          |  `string`  | `''`                                 | Client identifier registered with the identity provider, might be different from realm name                  |
| `clientSecret`      |  `string`  | `''`                                 | Client secret                                                                                                |
| `callbackUrl`       |  `string`  | `''`                                 | Optional, for custom callback after login                                                                    |
| `callbackLogoutUrl` |  `string`  | `''`                                 | Optional, for custom callback after logout, same as login by default                                         |
| `scope`             | `string[]` | `[]`                                 | Used during authentication to authorize access to a user's details                                           |
| **Config**          |            |                                      |                                                                                                              |
| `debug`             | `boolean`  | `false`                              | Display verbose log on console                                                                               |
| `secret`            |  `string`  | `'oidc._sessionid'`                  | Cookie's name for sessionid                                                                                  |
| `isCookieUserInfo`  | `boolean`  | `false`                              | For saving user info into cookie                                                                             |
| `cookie`            |  `object`  | `{}`                                 | Add custom info in user info cookie                                                                          |
| `cookiePrefix`      |  `string`  | `'oidc._'`                           | Cookies and LocalStorage prefix                                                                              |
| `cookieEncrypt`     | `boolean`  | `true`                               | Enable cookie encryption for user info cookie                                                                |
| `cookieEncryptKey`  |  `string`  | `'bfnuxt9c2470cb477d907b1e0917oidc'` | 32-bits                                                                                                      |
| `cookieEncryptIV`   |  `string`  | `'ab83667c72eec9e4'`                 | 16-bits                                                                                                      |
| `cookieEncryptALGO` |  `string`  | `'aes-256-cbc'`                      | Algorithm encryption                                                                                         |
| `cookieMaxAge`      |  `number`  | `24 * 60 * 60`                       | By default, set to one day                                                                                   |
| `response_type`     |  `string`  | `'id_token'`                         | Response mode settings, more info [here](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html) |
| `cookieFlags`       |  `object`  | `{}`                                 | Settings attributes for `access_token` and `refresh_token`, example below 👇                                 |


## 🍪 Cookie Flags

```ts
cookieFlags: {
  access_token: {
    httpOnly: true | false,
    secure: true | false,
    sameSite: 'None' | 'Lax' | 'Strict',
  },
  refresh_token: {
    httpOnly: true | false,
    secure: true | false,
    sameSite: 'None' | 'Lax' | 'Strict',
  },
},
```

🔗 [`httpOnly`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#httponly)
🔗 [`secure`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#secure)
🔗 [`sameSite`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)

## 💾 `.env` vars

It's preferable to use environment variables for runtime config with Nuxt because it overrides `nuxt.config.ts`.
For production, nuxt is generally already built with Nuxt config, and it's not possible to change value.
Using runtime config with `.env` vars allow this

```
NUXT_OPENID_CONNECT_OP_ISSUER=https://openid.example.com/realms/master
NUXT_OPENID_CONNECT_OP_CLIENT_ID=admin
NUXT_OPENID_CONNECT_OP_CLIENT_SECRET=1dOuDoUdIdAdAdA2
NUXT_OPENID_CONNECT_OP_CALLBACK_URL=https://nuxt.example.com/oidc/callback
NUXT_OPENID_CONNECT_OP_CALLBACK_LOGOUT_URL=https://nuxt.example.com/oidc/callback
NUXT_OPENID_CONNECT_CONFIG_DEBUG=true
```

🔗 [Nuxt runtime-config](https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables)

## 💻 Development

- Clone repository
- Install dependencies using `npm install`
- Run `npm run dev:prepare` to generate type stubs.
- Use `npm run dev` to start [playground](./playground) in development mode.

## ©️ License

[MIT](./LICENSE) - Made with 💚
