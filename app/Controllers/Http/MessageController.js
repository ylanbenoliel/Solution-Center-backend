'use strict'

const Message = use('App/Models/Message')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with messages
 */
class MessageController {
  /**
   * Show a list of all messages.
   * GET messages
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ response, auth }) {
    try {
      const userID = auth.user.id
      const messages = await Message
        .query()
        .where('user_id', userID)
        .fetch()
      return response.status(200).send({ messages })
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
      const messageString = Object.values(messageData)[0]

      const dataToStore = userArray.map(user => {
        return { user_id: Object.values(user)[0], message: messageString }
      })

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
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = MessageController
