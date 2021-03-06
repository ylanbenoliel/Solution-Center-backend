'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class JobSchema extends Schema {
  up () {
    this.create('jobs', (table) => {
      table.increments()
      table.string('title', 40)
      table.timestamps()
    })
  }

  down () {
    this.drop('jobs')
  }
}

module.exports = JobSchema
