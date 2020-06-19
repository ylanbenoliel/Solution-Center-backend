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
            user_id: 47
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

      const event = await Event.findOrFail(data.id)
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
