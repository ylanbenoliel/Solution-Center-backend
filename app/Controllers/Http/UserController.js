'use strict'

const User = use('App/Models/User')
class UserController {
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
      const user = await User.create(data)
      return user
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
        .send({ message: 'Usuário atualizado' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao atualizar usuário' })
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
        .send({ message: 'Erro ao buscar usuário' })
    }
  }
}

module.exports = UserController
