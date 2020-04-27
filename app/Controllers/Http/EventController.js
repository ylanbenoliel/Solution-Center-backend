'use strict'
const Event = use('App/Models/Event')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with events
 */
class EventController {
  /**
   * Show a list of all events.
   * GET events
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response }) {
    try {
      const { date } = request.all()
      const events = await Event.query()
        .select('id', 'user_id', 'room', 'date', 'time')
        .where({ date })
        .fetch()

      return events
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao retornar os horários' })
    }
  }

  /**
   * Create/save a new event.
   * POST events
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {
    try {
      const { room, date, time } = request.all()
      const userID = auth.user.id
      const formattedTime = `${time.split(':')[0]}:00:00`

      const data = {
        user_id: userID,
        room,
        date,
        time: formattedTime
      }

      const newEvent = await Event.create(data)
      return newEvent
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao salvar o horário' })
    }
  }

  /**
   * Display a single event.
   * GET events/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ auth, request, response }) {
    try {
      const { date } = request.all()
      const userID = auth.user.id

      const event = await Event.query()
        .select('id', 'user_id', 'room', 'date', 'time')
        .where({
          user_id: userID,
          date
        })
        .fetch()

      if (event.rows.length === 0) {
        return response
          .status(404)
          .send({ message: 'Nenhum horário marcado' })
      }

      return event
    } catch (error) {
      if (error.name === 'ModelNotFoundException') {
        return response
          .status(error.status)
          .send({ message: 'Nenhum horário marcado' })
      }
      return response.status(error.status)
    }
  }

  /**
   * Delete a event with id.
   * DELETE events/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, response, auth }) {
    try {
      const eventID = params.id
      const userID = auth.user.id

      const event =
       await Event.query()
         .where(
           {
             id: eventID,
             user_id: userID
           }
         )
         .fetch()

      const jsonEvent = event.toJSON()[0]
      // eslint-disable-next-line eqeqeq
      if (jsonEvent.user_id != userID) {
        return response.status(401)
          .send({ message: 'Não está autorizado a deletar esse horário' })
      }

      await Event.query()
        .where({
          id: eventID,
          user_id: userID
        }).delete()
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível verificar horários' })
    }
  }
}

module.exports = EventController
