'use strict'

/*
|--------------------------------------------------------------------------
| Factory
|--------------------------------------------------------------------------
|
| Factories are used to define blueprints for database tables or Lucid
| models. Later you can use these blueprints to seed your database
| with dummy data.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

const minCPF = 11111111111
const maxCPF = 99999999999
const minPhone = minCPF
const maxPhone = maxCPF

Factory.blueprint('App/Models/User', (faker) => {
  return {
    name: faker.username(),
    email: faker.email(),
    password: faker.password(),
    address: faker.address(),
    cpf: faker.integer({ min: minCPF, max: maxCPF }),
    phone: faker.integer({ min: minPhone, max: maxPhone }),
    rg: faker.integer({ min: 11111111, max: 99999999 })
  }
})
