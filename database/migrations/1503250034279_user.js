'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('name', 150).notNullable()
      table.string('email', 150).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('address', 254).notNullable()
      table.string('cpf', 11).notNullable()
      table.string('rg', 8).notNullable()
      table.string('phone', 11).notNullable()
      table.boolean('active').defaultsTo(false)
      table.boolean('is_admin').defaultsTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema
