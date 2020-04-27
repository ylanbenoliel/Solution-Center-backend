'use strict'

const Database = use('Database')
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
   * Show a list of all notifications.
   * GET notifications
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ response }) {
    try {
      const users = Database
        .select('users.id', 'users.name', 'notifications.token')
        .from('users')
        .innerJoin('notifications', 'notifications.user_id', 'users.id')
        .whereNotNull('token')
      return users
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível buscar os usuários.' })
    }
  }

  /**
   * Create/save a new notification.
   * POST notifications
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    try {
      const { email, token } = request.all()
      const user = await User.findByOrFail('email', email)
      const notification = await Notification.create({ user_id: user.id, token })
      return notification
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível o código de notificação!' })
    }
  }

  /**
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ request, response, auth }) {
    try {
      const userID = auth.user.id
      const { token } = request.all()
      const notification = await Notification.findByOrFail('user_id', userID)
      notification.merge({ token })
      await notification.save()
      return notification
    } catch (error) {
      return response
        .status(error.status)
        .send(
          { message: 'Acesso inválido' }
        )
    }
  }
}

module.exports = NotificationController
