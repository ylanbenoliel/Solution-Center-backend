'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EventSchema extends Schema {
  up () {
    this.create('events', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE')
        .onDelete('SET NULL')
      table.enu('room', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'])
      table.datetime('date').notNullable()
      table.time('time').notNullable()
      table.boolean('status_payment').defaultsTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('events')
  }
}

module.exports = EventSchema
