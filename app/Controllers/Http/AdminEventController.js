'use strict'

// const Database = use('Database')
const Event = use('App/Models/Event')
const User = use('App/Models/User')

class AdminEventController {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    try {
      const { user, date, time, room } = request.all()

      const event = await Event
        .query()
        .where({
          date, time, room
        })
        .fetch()

      const eventJSON = event.toJSON()[0]

      if (!eventJSON) {
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
      return response.status(200).send(
        { message: 'Horário salvo!', event: newEvent }
      )
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
          .fetch()
      } else {
        event = await Event.query()
          .select('id', 'user_id', 'room', 'date', 'time', 'status_payment')
          .where({
            user_id: user
          })
          .fetch()
      }

      if (event.rows.length === 0) {
        return response
          .status(404)
          .send({ message: 'Nenhum horário marcado.' })
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
        'time',
        'status_payment'
      ])

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

      const formattedTime = `${data.time.split(':')[0]}:00:00`

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

      await Event.query()
        .where(
          {
            id: eventID
          }
        )
        .delete()

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
