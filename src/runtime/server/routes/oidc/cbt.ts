import { defineEventHandler, setCookie, getCookie } from 'h3'
import { CBT_PAGE_TEMPATE } from '../../../utils/template'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  console.log('[CBT]: oidc/cbt calling')
  const { config } = useRuntimeConfig().openidConnect
  const res = event.node.res
  const html = CBT_PAGE_TEMPATE

  const sessionkey = config.secret
  const sessionid = getCookie(event, sessionkey)
  // logger.debug('[CBT]:' + sessionid)
  /* setCookie(event, sessionkey, sessionid, {
    maxAge: 24 * 60 * 60 // oneday
  }) */

  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    Expires: new Date().toUTCString()
  })
  res.end(html)
})
