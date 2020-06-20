'use strict'

const Env = use('Env')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Image extends Model {
  static get computed () {
    return ['url']
  }

  getUrl ({ path }) {
    return `${Env.get('GLOBAL_URL')}/images/${path}`
  }

  user () {
    return this.belongsTo('App/Models/User')
  }
}

module.exports = Image
