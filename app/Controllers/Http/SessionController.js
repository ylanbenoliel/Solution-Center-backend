'use strict'

const User = use('App/Models/User')

class SessionController {
  async authenticate ({ request, auth }) {
    const { email, password } = request.all()
    const { name } = await User.findBy('email', email)
    const { token } = await auth.attempt(email, password)
    return { token, name }
  }
}

module.exports = SessionController
