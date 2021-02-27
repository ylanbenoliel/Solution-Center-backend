/* eslint-disable eqeqeq */
'use strict'
const {
  parseISO,
  isSaturday,
  format,
  formatDistance,
  isSameDay,
  isFuture,
  isPast,
  subHours,
  isWeekend
} = require('date-fns')
const { timeToSaveInDatabase, parseDateFromHyphenToSlash } = require('../../Helpers/functions')

const {
  HOURS_USER_BUSINESS_DAYS,
  HOURS_USER_SATURDAY,
  ROOM_DATA
} = require('../../Helpers/constants')

const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')
const Message = use('App/Models/Message')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with events
 */
class EventController {
  roomName (roomId) {
    const ROOM_NAME = ROOM_DATA.find((room) => {
      if (room.id === Number(roomId)) {
        return room.name
      } return false
    })
    return ROOM_NAME.name.split(' ')[0]
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async schedule ({ request, response, auth }) {
    try {
      const { date, room } = request.post()
      const userID = auth.user.id

      const today = new Date()

      if (isWeekend(today)) {
        return response.status(400).send({ message: 'Selecione um dia.' })
      }

      const { active } = await User.find(userID)
      if (!active) {
        return response.status(200).send({ active })
      }

      let hoursInterval = []
      const ISODate = parseISO(date)

      if (isSaturday(ISODate)) {
        hoursInterval = HOURS_USER_SATURDAY
      } else {
        hoursInterval = HOURS_USER_BUSINESS_DAYS
      }

      const query = await Database
        .select('events.id as event',
          'users.id as user',
          'users.name',
          'events.room',
          'events.date',
          'events.time')
        .from('events')
        .innerJoin('users', 'users.id', 'events.user_id')
        .where({ date, room })

      const currentDate = subHours(new Date(), 3)
      const validEvents = []
      for (let i = 0; i < hoursInterval.length; i++) {
      // 1 - horário vago,
      // 2 - horário do usuário,
      // 3 - horário do usuário que não pode ser desmarcado,
      // 4 - horário indisponivel,

        const hour = hoursInterval[i]
        const hasEvent = query.find(event => event.time.includes(hour))

        const hasNoEvent = {
          event: Math.random(),
          user: '',
          room: room,
          date: date,
          time: `${hour}:00:00`
        }

        if (!hasEvent) {
          let noEvent = { ...hasNoEvent }
          const dateTimeString = `${date} ${hour}`
          const ISONoEventDate = subHours(parseISO(dateTimeString), 3)

          if (isPast(ISONoEventDate)) {
            const code = '4'
            noEvent = { ...noEvent, code }
          }
          if (isSameDay(ISONoEventDate, currentDate)) {
            if ((ISONoEventDate.getHours() > currentDate.getHours())) {
              const code = '1'
              noEvent = { ...noEvent, code }
            } else {
              const code = '4'
              noEvent = { ...noEvent, code }
            }
          }
          if (isFuture(ISONoEventDate)) {
            const code = '1'
            noEvent = { ...noEvent, code }
          }

          validEvents.push(noEvent)
        } else {
          if (Number(userID) !== Number(hasEvent.user)) {
            const code = '4'
            validEvents.push({ ...hasEvent, code })
            continue
          }

          const dateString = format(hasEvent.date, 'yyyy-MM-dd')
          const dateTimeString = `${dateString} ${hasEvent.time}`
          const parsedDate = subHours(parseISO(dateTimeString), 3)
          const dateTimeDistance = formatDistance(currentDate, parsedDate)
          const distArray = dateTimeDistance.split(' ')
          const timeDistArray = distArray.length === 2 ? distArray[0] : distArray[1]

          const dateTimeDistanceIsHourAndBelowSix =
          dateTimeDistance.includes('hour') && timeDistArray < 6

          if (isPast(parsedDate)) {
            const code = '3'
            validEvents.push({ ...hasEvent, code })
            continue
          }
          if (isSameDay(parsedDate, currentDate)) {
            let localCode = ''
            if (dateTimeDistance.includes('min') || dateTimeDistanceIsHourAndBelowSix) {
              localCode = '3'
            } else {
              localCode = '2'
            }
            validEvents.push({ ...hasEvent, code: localCode })
            continue
          }
          if (isFuture(parsedDate)) {
            let localCode = ''
            if (dateTimeDistanceIsHourAndBelowSix) {
              localCode = '3'
            } else {
              localCode = '2'
            }
            validEvents.push({ ...hasEvent, code: localCode })
            continue
          }
        }
      }

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
      const { room, date, time } = request.post()
      const userID = auth.user.id

      const formattedTime = timeToSaveInDatabase(time)

      const userEventInSameDateTime = await Event
        .query()
        .where({
          user_id: userID,
          date: date,
          time: formattedTime
        })
        .fetch()
      if (userEventInSameDateTime.rows.length !== 0) {
        const eventJson = userEventInSameDateTime.toJSON()[0]
        const localRoom = this.roomName(eventJson.room)
        return response
          .status(406)
          .send({ message: `Você tem o mesmo horário na sala ${localRoom}.` })
      }

      const data = {
        user_id: userID,
        room,
        date,
        time: formattedTime
      }
      const newEvent = await Event.create(data)

      const messageToSave =
      `Você reservou a Sala ${this.roomName(room)},` +
      ` Data ${parseDateFromHyphenToSlash(date)}, Hora ${formattedTime}.`
      await Message.create({ user_id: userID, message: messageToSave })

      return response
        .status(200)
        .send({ message: 'Horário salvo!', event: newEvent })
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
  async show ({ request, response, auth }) {
    try {
      const userID = auth.user.id
      const page = request.input('page', 1)
      const event = await Event.query()
        .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
        .where({
          user_id: userID
        })
        .orderBy('date', 'desc')
        .paginate(page)

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

      const event = await Event.findByOrFail('id', data.id)
      const jsonEvent = event.toJSON()

      if (!jsonEvent || jsonEvent.user_id != userID) {
        return response.status(401)
          .send({ message: 'Não está autorizado a deletar esse horário' })
      }

      event.merge(data)
      await event.save()

      return response
        .status(200)
        .send({ message: 'Horário atualizado!' })
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

      const event = await Event.findOrFail(eventID)

      if (event.user_id !== Number(userID)) {
        return response
          .status(401)
          .send({ message: 'Não está autorizado a deletar esse horário!' })
      }

      const { room, date, time } = event

      const formattedDate = format(date, 'dd/MM/yyyy')
      const messageToSave =
      `Você apagou a reserva da Sala ${this.roomName(room)},` +
      ` Data ${formattedDate}, Hora ${time}.`

      await Message.create({ user_id: userID, message: messageToSave })

      await Event
        .query()
        .where({
          id: eventID
        }).delete()

      return response
        .status(200)
        .send({ message: 'Horário desmarcado.' })
    } catch (error) {
      if (Number(error.status) === 404) {
        return response
          .status(error.status)
          .send({ message: 'Reserva não encontrada.' })
      }
      return response
        .status(error.status)
        .send({ message: 'Não foi possível verificar horários.' })
    }
  }
}

module.exports = EventController
