'use strict'

const crypto = require('crypto')
const seedrandom = require('seedrandom')
const { isAfter, addMinutes } = require('date-fns')

const Mail = use('Mail')
const Env = use('Env')
const Database = use('Database')
const User = use('App/Models/User')
const Plan = use('App/Models/Plan')

const { writeLog } = require('../../Helpers/functions.js')
class UserController {
  async createPlan (id) {
    await Plan.create({ user_id: id, plan: 1 })
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
      writeLog(id, 'se cadastrou.')

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

  async forgot ({ request, response }) {
    try {
      const { email } = request.only(['email'])
      const user = await User.findByOrFail('email', email)

      const rng = seedrandom(crypto.randomBytes(64).toString('base64'))
      const code = (rng()).toString().substring(3, 9)

      user.passwd_token = code
      user.passwd_token_cr_at = new Date()
      await user.save()

      Mail.send('emails.recover', { user, code }, (message) => {
        message
          .from(Env.get('MAIL_USERNAME'))
          .subject('Recuperação de senha.')
          .to(email)
      })

      return response.ok('Token de recuperação enviado.')
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Email não encontrado.' })
    }
  }

  async verifyPasswordToken ({ request, response }) {
    try {
      const { code: tokenProvided, email } = request.only(['code', 'email'])
      const user = await User.findByOrFail('email', email)

      if (tokenProvided !== user.passwd_token) {
        return response
          .status(401)
          .send({ message: 'Token inválido ou já utilizado.' })
      }

      const currentTime = new Date()
      const tokenExpired = isAfter(currentTime, addMinutes(user.passwd_token_cr_at, 30))
      if (tokenExpired) {
        return response
          .status(403)
          .send({ message: 'Token expirado.' })
      }

      return response
        .status(200)
        .send({ message: 'Token válido.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Email não encontrado.' })
    }
  }
}

module.exports = UserController
