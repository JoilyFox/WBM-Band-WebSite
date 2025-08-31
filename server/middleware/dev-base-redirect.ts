import { defineEventHandler, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  // In development, redirect any request starting with the production base
  // path (/WBM-Band-WebSite) to the same path without the prefix.
  if (process.dev) {
    const url = event.node.req.url || '/'
    const prefix = '/WBM-Band-WebSite'
    if (url.startsWith(prefix)) {
      const target = url.slice(prefix.length) || '/'
      return sendRedirect(event, target, 307)
    }
  }
})
