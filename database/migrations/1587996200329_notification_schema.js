'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NotificationSchema extends Schema {
  up () {
    this.create('notifications', (table) => {
      table.increments()
      table.integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.string('token', 41).notNullable().unique()
      table.timestamps()
    })
  }

  down () {
    this.drop('notifications')
  }
}

module.exports = NotificationSchema
