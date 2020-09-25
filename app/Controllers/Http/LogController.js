'use strict'

const Log = use('App/Models/Log')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with logs
 */
class LogController {
  /**
   * Show a list of all logs.
   * GET logs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, auth }) {
    try {
      const page = request.input('page', 1)
      const userID = auth.user.id
      const logs = await Log
        .query()
        .where('user_id', userID)
        .orderBy('id', 'desc')
        .paginate(page)

      return logs
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar registros.' })
    }
  }
}

module.exports = LogController
