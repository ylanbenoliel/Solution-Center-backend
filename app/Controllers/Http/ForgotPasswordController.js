'use strict'

const crypto = require('crypto')
const seedrandom = require('seedrandom')
const { isAfter, addMinutes } = require('date-fns')

const Mail = use('Mail')
const Env = use('Env')

const User = use('App/Models/User')

class ForgotPasswordController {
  async store ({ params, response }) {
    try {
      const email = params.email
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

      return response
        .status(200)
        .send({ message: 'Token de recuperação enviado.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Email não encontrado.' })
    }
  }

  async show ({ request, response }) {
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

  async update ({ request, response }) {
    try {
      const { email, password } = request.only(['email', 'password'])

      const user = await User.findByOrFail('email', email)

      if (!password || password.length < 8) {
        return response
          .status(400)
          .send({ message: 'Senha menor que 8 caracteres.' })
      }

      user.passwd_token_cr_at = null
      user.passwd_token = null
      user.password = password
      await user.save()

      return response
        .status(200)
        .send({ message: 'Senha atualizada.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível atualizar a senha.' })
    }
  }
}

module.exports = ForgotPasswordController
