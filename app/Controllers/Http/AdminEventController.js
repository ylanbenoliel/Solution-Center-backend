/* eslint-disable camelcase */
'use strict'
const {
  parseISO,
  isSaturday,
  format
} = require('date-fns')

const HOURS_SATURDAY = ['08', '09', '10', '11', '12', '13']
const HOURS_BUSINESS_DAYS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']

const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')
const Log = use('App/Models/Log')

class AdminEventController {
  async writeLog (adminID, message) {
    try {
      const admin = await User
        .query()
        .select('name')
        .where({
          id: adminID
        })
        .fetch()

      let adminName = admin.toJSON()[0]
      adminName = adminName.name.split(' ')[0]
      const messageString = `${adminName} ${message}`

      const allAdmins = await User
        .query()
        .select('id')
        .where('is_admin', 1)
        .fetch()

      const adminArray = allAdmins.toJSON().flat(1)
      const dataToStore = adminArray.map(adm => {
        return { user_id: Object.values(adm), log: messageString }
      })

      await Log.createMany(dataToStore)
    } catch (error) {
      const errorData = new Date()
      throw new Error(`Erro ao salvar registros. ${errorData}`)
    }
  }

  roomName (roomId) {
    const roomData = [
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
    const ROOM_NAME = roomData.map((room) => {
      if (room.id === roomId) {
        return room.name.split(' ')[0]
      } return false
    }).filter((room) => room)
    return ROOM_NAME[0]
  }

  /**
 * @param {string} date
 * @returns {string} dateBars
 */
  async dateWithBars (date) {
    if (date.includes('T')) {
      let dateWithTimeZone = await date.split('T')[0]
      dateWithTimeZone = dateWithTimeZone.split('-').reverse().join('/')
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

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async agenda ({ request, response }) {
    try {
      const { date } = request.all()

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

      return response.status(200).send({
        hoursInterval,
        events: query
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

      this.writeLog(adminID,
        `criou reserva para ${this.getUserName(user)}, Sala ${this.roomName(room)},` +
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
      const { date, user } = request.all()
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
            user_id: user
          })
          .orderBy('updated_at', 'desc')
          .fetch()
      } else {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            user_id: user
          })
          .orderBy('updated_at', 'desc')
          .fetch()
      }

      const eventJson = event.toJSON()[0]
      if (!eventJson) {
        return response
          .status(204)
          .send({ message: 'Não possui reservas.' })
      }

      return response
        .status(200)
        .send({ events: event })
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
      const dateString = format(new Date(), 'yyyy-MM-dd')

      const event = await Event.findOrFail(id)
      const { user_id, time, room } = event.toJSON()
      await event.merge({ status_payment: status_payment })
      await event.save()
      const name = await this.getUserName(Number(user_id))
      const roomName = await this.roomName(Number(room))

      if (status_payment === 1) {
        const messageString =
           'confirmou pagamento de ' +
           `${name}, ` +
           `Sala ${roomName}, ` +
           `Dia ${this.dateWithBars(dateString)}, Hora ${time}`

        this.writeLog(adminID, messageString)

        return response
          .status(200)
          .send({ message: 'Pagamento efetuado.', event })
      }
      if (status_payment === 0) {
        const messageString =
           'removeu pagamento de ' +
           `${name}, ` +
           `Sala ${roomName}, ` +
           `Dia ${this.dateWithBars(dateString)}, Hora ${time}`

        this.writeLog(adminID, messageString)

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
      const { user_id, time, room } = event.toJSON()
      const name = await this.getUserName(Number(user_id))
      const roomName = await this.roomName(Number(room))

      await Event.query()
        .where({ id: eventID })
        .delete()

      const messageString =
        'apagou reserva de ' +
        `${name}, ` +
        `Sala ${roomName}, ` +
        // `Dia ${this.dateWithBars(date)}, `+
        `Hora ${time}`

      this.writeLog(adminID, messageString)

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
