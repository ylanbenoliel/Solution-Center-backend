'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

class User extends Model {
  static boot () {
    super.boot()

    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }

  static get computed () {
    return ['listname']
  }

  getListname ({ name }) {
    const nameSplit = name.split(' ')
    return `${nameSplit[0]} ${nameSplit[nameSplit.length - 1]}`
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  avatar () {
    return this.hasOne('App/Models/Image')
  }

  events () {
    return this.hasMany('App/Models/Event')
  }

  notification () {
    return this.hasOne('App/Models/Notification')
  }

  plans () {
    return this.hasMany('App/Model/Plan')
  }

  messages () {
    return this.hasMany('App/Model/Message')
  }

  job () {
    return this.hasOne('App/Models/Job')
  }
}

module.exports = User
