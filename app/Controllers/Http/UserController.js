'use strict'

const Database = use('Database')
const User = use('App/Models/User')
const Plan = use('App/Models/Plan')
const Log = use('App/Models/Log')
class UserController {
  async createPlan (id) {
    await Plan.create({ user_id: id, plan: 1 })
  }

  async welcomeUser (name) {
    try {
      const admin = await User
        .query()
        .select('id')
        .where('is_admin', 1)
        .fetch()

      const adminArray = admin.toJSON().flat(1)
      const messageString = `Usuário ${name} se cadastrou.`

      const dataToStore = adminArray.map(adm => {
        return { user_id: Object.values(adm), log: messageString }
      })

      await Log.createMany(dataToStore)
    } catch (error) {
      const errorData = new Date()
      throw new Error(`Erro ao enviar registro de novo usuário. ${errorData}`)
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
      const { id } = await User.create(data)
      this.createPlan(id)
      this.welcomeUser(data.name)

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
      const data = request.all()
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

  async show ({ auth, response }) {
    try {
      const userID = auth.user.id
      const user = await User
        .query()
        .select('id', 'name', 'email', 'address', 'phone', 'cpf', 'rg')
        .where('id', '=', userID)
        .with('avatar')
        .fetch()
      return user
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar usuário.' })
    }
  }

  async debt ({ response }) {
    try {
      const query = await Database
        .select('users.id')
        .distinct('users.id')
        .from('users')
        .innerJoin('events', 'users.id', 'events.user_id')
        .where({ 'events.status_payment': false })

      const idsArray = query.map((id) => {
        return Object.values(id)
      }).flat(1)
      return { ids: idsArray }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar pendências.' })
    }
  }
}

module.exports = UserController
