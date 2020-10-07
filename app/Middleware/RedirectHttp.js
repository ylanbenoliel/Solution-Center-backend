'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class RedirectHttp {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Function} next
   */
  async handle ({ request, response }, next) {
    const headers = request.headers()
    if ((headers['x-forwarded-proto'] || '').endsWith('http')) {
      response.redirect(`https://${request.hostname()}${request.originalUrl()}`)
    } else {
      await next()
    }
  }
}

module.exports = RedirectHttp
