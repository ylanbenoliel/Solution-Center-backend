/* eslint-disable camelcase */
'use strict'
const {
  parseISO,
  isSaturday,
  format
} = require('date-fns')

const {
  HOURS_ADMIN_SATURDAY,
  HOURS_ADMIN_BUSINESS_DAYS,
  ROOM_DATA,
  ROOM_IDS
} = require('../../Helpers/constants')

const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')
const { writeLog, timeToSaveInDatabase } = require('../../Helpers/functions.js')

class AdminEventController {
  roomName (roomId) {
    const ROOM_NAME = ROOM_DATA.find((room) => {
      if (room.id === Number(roomId)) {
        return room.name
      } return false
    })
    return ROOM_NAME.name.split(' ')[0]
  }

  dateWithBars (date) {
    if (typeof date === 'object') {
      const dateWithTimeZone = format(date, 'dd/MM/yyyy')
      return dateWithTimeZone
    }
    const dateBars = date.split('-').reverse().join('/')
    return dateBars
  }

  parseISODate (date) {
    const parseDate = parseISO(date)
    return parseDate
  }

  firstNameAndLastName (fullName) {
    const nameSplited = fullName.split(' ')
    const firstNameAndLastName = `${nameSplited[0]} ${nameSplited[nameSplited.length - 1]}`
    return firstNameAndLastName
  }

  /**
 * @param {number} userId
 * @returns {Number} admin
 */
  async userIsAdmin (userId) {
    try {
      const { is_admin: isAdmin } = await User.findOrFail(userId)
      return isAdmin
    } catch (error) {
      throw new Error('Não foi possível carregar usuário.')
    }
  }

  /**
 * @param {number} userId
 * @returns {string} userName
 */
  async getUserName (userId) {
    try {
      const userDB = await User
        .query()
        .select('name')
        .where('id', userId)
        .fetch()
      let userName = userDB.toJSON()[0]
      userName = userName.name
      return userName
    } catch (error) {
      throw new Error('Erro ao recuperar nome do usuário.')
    }
  }

  async eventsWithDebt ({ request, response, auth }) {
    try {
      const { user } = request.post()
      const page = request.input('page', 1)
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      let event = {}
      const currentDate = new Date()
      event = await Event.query()
        .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
        .where({
          user_id: user,
          status_payment: 0
        })
        .where('date', '<', currentDate)
        .orderBy('date', 'desc')
        .paginate(page)

      return event
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar horários.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async agenda ({ request, response }) {
    try {
      const { date } = request.post()

      let query = {}
      let hoursInterval = []

      const ISODate = this.parseISODate(date)

      if (isSaturday(ISODate)) {
        hoursInterval = HOURS_ADMIN_SATURDAY
      } else {
        hoursInterval = HOURS_ADMIN_BUSINESS_DAYS
      }

      query = await Database
        .select('events.id',
          'users.name',
          'events.room',
          'events.date',
          'events.time',
          'events.status_payment')
        .from('events')
        .innerJoin('users', 'users.id', 'events.user_id')
        .where({ date })

      const noEvent = {
        index: 0,
        name: '',
        date: date,
        time: '',
        room: ''
      }
      const rawEvents = []

      let index = 0

      for (let i = 0; i < hoursInterval.length; i++) {
        const hour = hoursInterval[i]
        for (let j = 0; j < ROOM_IDS.length; j++) {
          const room = ROOM_IDS[j]

          const hasEvent = query
            .find(event => Number(event.room) === room && event.time.includes(hour))
          if (!hasEvent) {
            const hasNoEvent = {
              ...noEvent,
              index,
              room,
              time: `${hour}:00:00`
            }
            rawEvents.push(hasNoEvent)
          } else {
            const nameSplited = hasEvent.name.split(' ')
            const listName = `${nameSplited[0]} ${nameSplited[nameSplited.length - 1]}.`
            const lastNameLetter = nameSplited[nameSplited.length - 1].charAt(0)
            const firstNameAndLastNameWithDot = `${nameSplited[0]} ${lastNameLetter}.`

            const userHasEvent = {
              index,
              ...hasEvent,
              date: date,
              room: room,
              name: firstNameAndLastNameWithDot,
              listname: listName
            }
            rawEvents.push(userHasEvent)
          }
          index++
        }
      }

      return response.status(200).send({
        hoursInterval,
        events: rawEvents
      })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao retornar os horários.' })
    }
  }

  async closeDay ({ request, response, auth }) {
    try {
      const { date } = request.post()
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const ISODate = this.parseISODate(date)

      const hasEvent = await Event.findBy('date', ISODate)

      if (hasEvent) {
        return response
          .status(406)
          .send({ message: 'Verifique se existe uma reserva nesse dia.' })
      }

      let hoursInterval = []

      if (isSaturday(ISODate)) {
        hoursInterval = HOURS_ADMIN_SATURDAY
      } else {
        hoursInterval = HOURS_ADMIN_BUSINESS_DAYS
      }

      const allData = []
      for (let i = 0; i < ROOM_IDS.length; i++) {
        const room = String(ROOM_IDS[i])
        for (let j = 0; j < hoursInterval.length; j++) {
          const hour = hoursInterval[j]
          const formattedTime = timeToSaveInDatabase(hour)
          allData.push({
            user_id: adminID,
            room,
            date: ISODate,
            time: formattedTime,
            status_payment: 1
          })
        }
      }

      allData.forEach(eventInfo => {
        Promise.resolve(Event.create(eventInfo))
      })

      return response
        .status(200)
        .send({ message: 'Dia fechado.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao salvar os horários.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {
    try {
      const { user, date, time, room } = request.post()
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const formattedTime = timeToSaveInDatabase(time)

      const event = await Event
        .query()
        .where({
          date, time: formattedTime, room
        })
        .fetch()

      const eventJSON = event.toJSON()[0]

      if (eventJSON) {
        return response.status(406)
          .send({ message: 'Já existe reserva nesse horário.' })
      }

      const data = {
        user_id: user,
        room,
        date,
        time: formattedTime
      }

      const newEvent = await Event.create(data)
      const name = await this.getUserName(Number(user))

      writeLog(adminID,
        `criou reserva para ${name}, Sala ${this.roomName(room)},` +
        ` Dia ${this.dateWithBars(date)}, Hora ${formattedTime}`)

      return response.status(200).send({
        message: 'Horário salvo!',
        event: newEvent
      })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Ocorreu um erro ao salvar o horário.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ request, response, auth }) {
    try {
      const { user } = request.post()
      const page = request.input('page', 1)
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const event = await Event.query()
        .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
        .where({
          user_id: user
        })
        .orderBy('date', 'desc')
        .paginate(page)

      return event
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar horários.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ response, request, auth }) {
    try {
      const adminID = auth.user.id
      const data = request.only([
        'id',
        'room',
        'date',
        'time'
      ])

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const formattedTime = timeToSaveInDatabase(data.time)

      const hasEvent = await Event
        .query()
        .where({
          date: data.date, time: formattedTime, room: data.room
        })
        .fetch()

      if (hasEvent.rows.length !== 0) {
        return response.status(406)
          .send({ message: 'Já existe reserva nesse horário.' })
      }

      const event = await Event.findOrFail(data.id)
      const toSave = { ...data, time: formattedTime }
      event.merge(toSave)
      await event.save()

      const { date, time, room, user_id: userId } = event

      const formattedDate = this.dateWithBars(date)
      const localRoom = this.roomName(room)
      const userName = await this.getUserName(userId)

      const messageLog = `alterou reserva de ${userName} para Sala ${localRoom}, Dia ${formattedDate}, Hora ${time}`

      writeLog(adminID, messageLog)

      return response
        .status(200)
        .send({ message: 'Reserva atualizada!', event })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao atualizar reserva.' })
    }
  }

  async payment ({ request, response, auth }) {
    try {
      const { id, status_payment } = request.post()
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const event = await Event.findOrFail(id)
      await event.merge({ status_payment: status_payment })
      await event.save()
      const { user_id, room, time, date } = event

      const user = await User.find(user_id)

      if (event.status_payment === 1) {
        const messageString =
           'confirmou pagamento de ' +
           `${this.firstNameAndLastName(user.name)}, ` +
           `Sala ${this.roomName(room)}, ` +
           `Dia ${this.dateWithBars(date)}, Hora ${time}`

        writeLog(adminID, messageString)
        return response
          .status(200)
          .send({ message: 'Pagamento efetuado.', event })
      }
      if (event.status_payment === 0) {
        const messageString =
           'removeu pagamento de ' +
           `${this.firstNameAndLastName(user.name)}, ` +
           `Sala ${this.roomName(room)}, ` +
           `Dia ${this.dateWithBars(date)}, Hora ${time}`

        writeLog(adminID, messageString)

        return response
          .status(200)
          .send({ message: 'Pagamento não efetuado.', event })
      }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível alterar pagamento.' })
    }
  }

  /**
   * Delete a event with id.
   * DELETE events/:id
   *
   * @param {object} ctx
   * @param {Params} ctx.params
   * @param {Response} ctx.response
   */
  async destroy ({ params, response, auth }) {
    try {
      const id = Number(params.id)
      const adminID = auth.user.id

      const isAdmin = await this.userIsAdmin(adminID)
      if (!isAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const event = await Event.find(id)

      const hasEvent = !!event
      if (!hasEvent) {
        return response.status(404).send({ message: 'Evento não encontrado.' })
      }

      const { room, date, time, user_id } = event

      const eventToDelete = await Event.findOrFail(id)
      await eventToDelete.delete()

      const formattedDate = this.dateWithBars(date)
      const userName = await this.getUserName(user_id)
      const userFirstAndLastName = this.firstNameAndLastName(userName)
      const roomName = this.roomName(room)

      writeLog(adminID, `apagou reserva de ${userFirstAndLastName}, Sala ${roomName}, ` +
      `Data ${formattedDate}, Hora ${time}`)

      return response
        .status(200)
        .send({ message: 'Horário desmarcado.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível verificar horários.' })
    }
  }
}

module.exports = AdminEventController
