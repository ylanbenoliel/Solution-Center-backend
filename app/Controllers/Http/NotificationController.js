'use strict'

const Notification = use('App/Models/Notification')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with notifications
 */
class NotificationController {
  /**
   * Create/save a new notification.
   * POST notifications
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async storeOrUpdate ({ request, auth, response }) {
    try {
      const USER_ID = auth.user.id
      const { token } = request.post()

      const hasToken = await Notification.findBy('user_id', USER_ID)
      if (!hasToken) {
        // TODO verify if push token already exists
        await Notification.create({ user_id: USER_ID, token: token })
        return response.status(200).send({ message: 'Token criado.' })
      }

      hasToken.merge({ token: token })
      await hasToken.save()

      return response.status(200).send({ message: 'Token atualizado.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao salvar token.' })
    }
  }
}

module.exports = NotificationController
