'use strict'

const { Expo } = require('expo-server-sdk')

const Message = use('App/Models/Message')
const Notification = use('App/Models/Notification')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with messages
 */
class MessageController {
  async prepareNotifications (message, userArray) {
    const body = { body: message }
    const notificationTokens = []
    for (let i = 0; i < userArray.length; i++) {
      const userID = userArray[i].user
      const pushToken = await Notification
        .query()
        .select('token')
        .where({ user_id: userID })
        .fetch()
      if (pushToken.rows.length === 0) {
        continue
      }
      notificationTokens.push(pushToken.toJSON()[0].token)
    }
    const sendNotifications = { to: notificationTokens, sound: 'default', ...body }
    if (!sendNotifications.to.length) return null
    return sendNotifications
  }

  /**
   * Show a list of all messages.
   * GET messages
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async index ({ request, response, auth }) {
    try {
      const user = request.input('user', auth.user.id)
      const page = request.input('page', 1)

      const messages = await Message
        .query()
        .where('user_id', user)
        .orderBy('id', 'desc')
        .paginate(page)

      return messages
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar mensagens.' })
    }
  }

  /**
   * Create/save a new message.
   * POST messages
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    try {
      const userArray = request.collect(['user'])
      const messageData = request.only('message')
      const messageString = messageData.message

      const dataToStore = userArray.map(user => {
        return { user_id: user.user, message: messageString }
      })
      const sendPushNotifications = await this.prepareNotifications(messageString, userArray)
      const sendWithExpo = []
      if (sendPushNotifications) {
        const expo = new Expo()
        sendWithExpo.push(sendPushNotifications)
        await expo.sendPushNotificationsAsync(sendWithExpo)
      }
      await Message.createMany(dataToStore)
      return response.status(200).send({ message: 'Mensagens salvas.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao salvar mensagens.' })
    }
  }

  /**
   * Delete a message with id.
   * DELETE messages/:id
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async destroy ({ params, response, auth }) {
    try {
      const messageID = params.id
      const userID = auth.user.id

      const message = await Message.findOrFail(messageID)

      const messageJson = message.toJSON()

      if (messageJson && messageJson.user_id !== userID) {
        return response
          .status(401)
          .send({ message: 'Usuário sem permissão.' })
      }

      await Message
        .query()
        .where({
          id: messageID
        }).delete()

      return response
        .status(200)
        .send({ message: 'Mensagem apagada.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao excluir mensagem.' })
    }
  }
}

module.exports = MessageController
