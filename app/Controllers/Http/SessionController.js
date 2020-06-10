/* eslint-disable camelcase */
'use strict'

const User = use('App/Models/User')

class SessionController {
  async authenticate ({ request, auth }) {
    const { email, password } = request.all()
    const { name, is_admin, active } = await User.findBy('email', email)
    const { token } = await auth.attempt(email, password)
    return { token, name, is_admin, active }
  }
}

module.exports = SessionController
