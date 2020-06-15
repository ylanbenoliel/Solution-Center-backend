'use strict'
const {
  parseISO,
  isSaturday,
  format,
  formatDistance,
  isSameDay,
  isAfter,
  isBefore
} = require('date-fns')

const HOURS_SATURDAY = ['08', '09', '10', '11', '12', '13']
const HOURS_BUSINESS_DAYS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']

const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with events
 */
class EventController {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, auth }) {
    try {
      const { date, room } = request.all()
      const userID = auth.user.id
      let query = {}
      let hoursInterval = []
      const ISODate = parseISO(date)

      if (isSaturday(ISODate)) {
        hoursInterval = HOURS_SATURDAY
      } else {
        hoursInterval = HOURS_BUSINESS_DAYS
      }

      if (room) {
        query = await Database
          .select('events.id as event',
            'users.id as user',
            'users.name',
            'events.room',
            'events.date',
            'events.time')
          .from('events')
          .innerJoin('users', 'users.id', 'events.user_id')
          .where({ date, room })
      } else {
        query = await Database
          .select('events.id as event',
            'users.id as user',
            'users.name',
            'events.room',
            'events.date',
            'events.time')
          .from('events')
          .innerJoin('users', 'users.id', 'events.user_id')
          .where({ date })
      }

      const currentDate = new Date(Date.now())
      let code = ''

      const validEvents = query.flatMap((event) => {
        const dateString = format(event.date, 'yyyy-MM-dd')
        const dateTimeString = `${dateString} ${event.time}`
        const parsedDate = parseISO(dateTimeString)
        if (isSameDay(parsedDate, currentDate) || isAfter(parsedDate, currentDate)) {
          const dateTimeDistance = formatDistance(currentDate, parsedDate)
          const distArray = dateTimeDistance.split(' ')
          const timeDistArray = distArray.length === 2 ? distArray[0] : distArray[1]

          // eslint-disable-next-line eqeqeq
          if (userID != event.user) {
            code = '4'
            return {
              ...event,
              code
            }
          }

          if (isBefore(parsedDate, currentDate) || (dateTimeDistance.includes('min') || (dateTimeDistance.includes('hour') && timeDistArray < 6))) {
            code = '3'
            return {
              ...event,
              code
            }
          }

          if (dateTimeDistance.includes('day') || (dateTimeDistance.includes('hour') && timeDistArray >= 6)) {
            code = '2'
            return {
              ...event,
              code
            }
          }
        }

        return event
      })

      return response.status(200).send({
        hoursInterval,
        validEvents
      })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao retornar os horários.' })
    }
  }

  /**
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
      return response.status(200).send(
        { message: 'Horário salvo!', event: newEvent }
      )
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao salvar o horário' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ auth, request, response }) {
    try {
      const { date } = request.all()
      const userID = auth.user.id
      let event = {}

      if (date) {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            user_id: userID,
            date
          })
          .fetch()
      } else {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            user_id: userID
          })
          .fetch()
      }

      if (event.rows.length === 0) {
        return response
          .status(404)
          .send({ message: 'Nenhum horário marcado.' })
      }
      return event
    } catch (error) {
      return response.status(error.status).send({ message: 'Erro ao buscar horários.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ response, request, auth }) {
    try {
      const userID = auth.user.id
      const data = request.only([
        'id',
        'room',
        'date',
        'time'
      ])

      const user = await User.findOrFail(userID)
      const jsonUser = user.toJSON()[0]

      if (!jsonUser) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const event = await Event.findOrFail(data.id)
      event.merge(data)
      await event.save()
      return response.status(200).send({ message: 'Horário atualizado!' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao atualizar horário.' })
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

      return response.status(200).send({ message: 'Horário desmarcado' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível verificar horários' })
    }
  }
}

module.exports = EventController
