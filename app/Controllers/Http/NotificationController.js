'use strict'

const User = use('App/Models/User')
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
  async storeOrUpdate ({ request, response }) {
    try {
      const { email, token } = request.all()

      const user = await User.findBy('email', email)
      const hasToken = await Notification.findBy('user_id', user.id)

      if (!hasToken) {
        await Notification
          .create({ user_id: user.id, token })
        return response.status(204).send()
      }
      hasToken.merge({ token: token })
      await hasToken.save()

      return response.status(204).send()
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao salvar token.' })
    }
  }
}

module.exports = NotificationController
