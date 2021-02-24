/* eslint-disable camelcase */
'use strict'

const User = use('App/Models/User')

class SessionController {
  async authenticate ({ request, auth, response }) {
    try {
      const { email, password } = request.post()
      const { name, is_admin } = await User.findByOrFail('email', email)
      const { token } = await auth.attempt(email, password)
      return { token, user: { name, email }, is_admin }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Usuário ou senha incorretos.' })
    }
  }

  async show ({ auth, response }) {
    try {
      const USER_ID = auth.user.id
      const user = await User.find(USER_ID)
      const { token } = await auth.generate(user)

      return { admin: user.is_admin, token: token }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Usuário não encontrado.' })
    }
  }

  async verifyDB ({ response }) {
    try {
      const user = await User.first()
      if (!user) {
        return response
          .status(400)
          .send({ message: 'Banco de dados desligado.' })
      }

      return response.ok('Working...')
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro de conexão.' })
    }
  }
}

module.exports = SessionController
