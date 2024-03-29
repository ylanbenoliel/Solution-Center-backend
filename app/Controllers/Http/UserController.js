'use strict'

const Database = use('Database')
const User = use('App/Models/User')
const Plan = use('App/Models/Plan')
const Job = use('App/Models/Job')

const { expoInstance } = require('../../Helpers/expo')

const { writeLog, prepareNotifications } = require('../../Helpers/functions.js')

class UserController {
  async createPlan (id) {
    await Plan.create({ user_id: id, plan: 1 })
  }

  async insertDefaultJob (userId) {
    try {
      const { id: jobId } = await Job.first()

      const user = await User.find(userId)
      user.merge({ job_id: jobId })
      await user.save()
    } catch (err) {
      console.log('erro ao salvar job')
    }
  }

  async store ({ request, response }) {
    try {
      const data = request.only([
        'name', 'email', 'rg', 'cpf', 'phone', 'password', 'address'
      ])
      const userExists = await User.findBy('email', data.email)

      if (userExists) {
        return response
          .status(400)
          .send({ message: 'Usuário já registrado!' })
      }

      const { id, name } = await User.create(data)

      this.createPlan(id)
      this.insertDefaultJob(id)
      writeLog(id, 'se cadastrou.')

      const admin = await User
        .query()
        .select('id', 'name')
        .where('is_admin', '=', '1')
        .fetch()

      const messageString = `${name} se cadastrou.`
      const adminIds = admin.rows.map(user => user.id)

      const sendPushNotifications = await prepareNotifications(messageString, adminIds)
      const sendWithExpo = []
      if (sendPushNotifications) {
        const expo = expoInstance
        sendWithExpo.push(sendPushNotifications)
        await expo.sendPushNotificationsAsync(sendWithExpo)
      }

      return { message: 'Usuário cadastrado.', id }
    } catch (error) {
      return response
        .status(400)
        .send({ message: 'Erro ao cadastrar, por favor tente novamente.' })
    }
  }

  async index ({ response }) {
    try {
      const totalUsers = await User
        .query()
        .select('id', 'name', 'email', 'address', 'phone', 'cpf', 'rg', 'active', 'is_admin')
        .orderBy('name')
        .with('avatar')
        .fetch()
      return totalUsers
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar os usuários.' })
    }
  }

  async update ({ params, request, response }) {
    try {
      const user = await User.findOrFail(params.id)
      const data = request.post()
      if (!data.password) {
        delete data.password
      }
      user.merge(data)
      await user.save()
      return response
        .status(200)
        .send({ message: 'Usuário atualizado.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao atualizar usuário.' })
    }
  }

  async show ({ auth, request, response }) {
    try {
      const userID = request.input('user', auth.user.id)
      const user = await User
        .query()
        .select('id', 'name', 'email', 'address', 'phone', 'cpf', 'rg')
        .where('id', '=', userID)
        .with('avatar')
        .fetch()

      if (user.rows.length === 0) {
        return response
          .status(404)
          .send({ message: 'Usuário não encontrado.' })
      }

      return user
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar usuário.' })
    }
  }

  async debt ({ response }) {
    const currentDate = new Date()
    try {
      const query = await Database
        .select('users.id')
        .distinct('users.id')
        .from('users')
        .innerJoin('events', 'users.id', 'events.user_id')
        .where({ 'events.status_payment': false })
        .andWhere('events.date', '<', currentDate)
        .orderBy('users.id')

      const idsArray = []

      if (!query.length) {
        return { ids: idsArray }
      }
      for (let i = 0; i < query.length; i++) {
        const { id } = query[i]
        idsArray.push(id)
      }
      return { ids: idsArray }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar pendências.' })
    }
  }

  async destroy ({ request, response }) {
    try {
      const { id } = request.params

      const userExists = await User.find(id)
      if (!userExists) {
        return response
          .status(404)
          .send({ message: 'Usuário não encontrado.' })
      }

      await User
        .query()
        .where('id', '=', id)
        .delete()

      return response
        .status(200)
        .send({ message: 'Usuário excluído.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao excluir usuário.' })
    }
  }
}

module.exports = UserController
