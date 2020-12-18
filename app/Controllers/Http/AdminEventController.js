/* eslint-disable camelcase */
'use strict'
const {
  parseISO,
  isSaturday,
  format
} = require('date-fns')

const HOURS_SATURDAY = ['08', '09', '10', '11', '12', '13']
const HOURS_BUSINESS_DAYS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']
const ROOM_DATA = [
  { id: 1, name: 'Clarice Lispector' },
  { id: 2, name: 'Carlos Drummond de Andrade' },
  { id: 3, name: 'Cecília Meireles' },
  { id: 4, name: 'Rui Barbosa' },
  { id: 5, name: 'Machado de Assis' },
  { id: 6, name: 'Monteiro Lobato' },
  { id: 7, name: 'Luís Fernando Veríssimo' },
  { id: 8, name: 'Cora Coralina' },
  { id: 9, name: 'Carolina de Jesus' }
]

const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')
const { writeLog } = require('../../Helpers/functions.js')

class AdminEventController {
  roomName (roomId) {
    const ROOM_NAME = ROOM_DATA.find((room) => {
      if (room.id === roomId) {
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
      const { date, user } = request.all()
      const page = request.input('page', 1)
      const adminID = auth.user.id

      const admin = await User
        .query()
        .select('name')
        .where({
          id: adminID,
          is_admin: 1
        })
        .fetch()

      const JSONAdmin = admin.toJSON()[0]
      if (!JSONAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      let event = {}

      if (date) {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            date,
            user_id: user,
            status_payment: 0
          })
          .orderBy('date', 'desc')
          .paginate(page)
      } else {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            user_id: user,
            status_payment: 0
          })
          .orderBy('date', 'desc')
          .paginate(page)
      }

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
      const { date } = request.all()
      const ROOM_IDS = ROOM_DATA.map((data) => data.room)

      let query = {}
      let hoursInterval = []
      const ISODate = parseISO(date)

      if (isSaturday(ISODate)) {
        hoursInterval = HOURS_SATURDAY
      } else {
        hoursInterval = HOURS_BUSINESS_DAYS
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
          const room = j + 1

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
            const lastNameLetter = nameSplited[nameSplited.length - 1].charAt(0)
            const firstNameAndLastNameWithDot = `${nameSplited[0]} ${lastNameLetter}.`

            const userHasEvent = {
              index,
              ...hasEvent,
              date: date,
              room: room,
              name: firstNameAndLastNameWithDot
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

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, auth }) {
    try {
      const { user, date, time, room } = request.all()
      const adminID = auth.user.id

      const event = await Event
        .query()
        .where({
          date, time, room
        })
        .fetch()

      const eventJSON = event.toJSON()[0]

      if (eventJSON) {
        return response.status(406)
          .send({ message: 'Já existe reserva nesse horário.' })
      }

      const formattedTime = `${time.split(':')[0]}:00:00`

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
      const { user } = request.all()
      const page = request.input('page', 1)
      const adminID = auth.user.id

      const admin = await User
        .query()
        .select('name')
        .where({
          id: adminID,
          is_admin: 1
        })
        .fetch()

      const JSONAdmin = admin.toJSON()[0]
      if (!JSONAdmin) {
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

      const formattedTime = `${data.time.split(':')[0]}:00:00`

      const admin = await User
        .query()
        .select('name')
        .where({
          id: adminID,
          is_admin: 1
        })
        .fetch()

      const JSONAdmin = admin.toJSON()[0]
      if (!JSONAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }

      const evt = await Event
        .query()
        .where({
          date: data.date, time: formattedTime, room: data.room
        })
        .fetch()

      const eventJSON = evt.toJSON()[0]

      if (eventJSON) {
        return response.status(406)
          .send({ message: 'Já existe reserva nesse horário.' })
      }

      const event = await Event.findOrFail(data.id)
      const toSave = { ...data, time: formattedTime }
      event.merge(toSave)
      await event.save()

      return response
        .status(200)
        .send({ message: 'Horário atualizado!', event })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao atualizar horário.' })
    }
  }

  async payment ({ request, response, auth }) {
    try {
      const { id, status_payment } = request.all()
      const adminID = auth.user.id
      // const dateString = format(new Date(), 'yyyy-MM-dd')

      const event = await Event.findOrFail(id)
      const { user_id, time, room } = event.toJSON()
      await event.merge({ status_payment: status_payment })
      await event.save()
      const name = await this.getUserName(Number(user_id))

      if (status_payment === 1) {
        const messageString =
           'confirmou pagamento de ' +
           `${name}, ` +
           `Sala ${this.roomName(room)} ` +
         `Dia ${this.dateWithBars(event.date)}, Hora ${time}`

        writeLog(adminID, messageString)

        return response
          .status(200)
          .send({ message: 'Pagamento efetuado.', event })
      }
      if (status_payment === 0) {
        const messageString =
           'removeu pagamento de ' +
           `${name}, ` +
           `Sala ${this.roomName(room)}, ` +
           `Dia ${this.dateWithBars(event.date)}, Hora ${time}`

        writeLog(adminID, messageString)

        return response
          .status(200)
          .send({ message: 'Pagamento não efetuado', event })
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
      const eventID = params.id
      const adminID = auth.user.id

      const admin = await User
        .query()
        .select('id')
        .where({
          id: adminID,
          is_admin: 1
        })
        .fetch()

      const JSONAdmin = admin.toJSON()[0]
      if (!JSONAdmin) {
        return response.status(401).send({ message: 'Não autorizado.' })
      }
      const event = await Event.findOrFail(eventID)
      const { user_id, time, room, date } = event.toJSON()
      const name = await this.getUserName(Number(user_id))

      await Event.query()
        .where({ id: eventID })
        .delete()

      const messageString =
        'apagou reserva de ' +
        `${name}, ` +
        `Sala ${this.roomName(room)}, ` +
        `Dia ${this.dateWithBars(date)}, ` +
        `Hora ${time}`

      writeLog(adminID, messageString)

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
