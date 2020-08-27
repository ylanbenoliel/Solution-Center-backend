/* eslint-disable camelcase */
'use strict'

const User = use('App/Models/User')

class SessionController {
  async authenticate ({ request, auth, response }) {
    try {
      const { email, password } = request.all()
      const { name, is_admin } = await User.findBy('email', email)
      const { token } = await auth.attempt(email, password)
      return { token, user: { name, email }, is_admin }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Usuário ou senha incorretos.' })
    }
  }
}

module.exports = SessionController
