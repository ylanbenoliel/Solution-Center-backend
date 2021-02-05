'use strict'
const price = require('../../../resources/price.json')

class PriceController {
  index ({ response }) {
    response.send(price)
  }
}

module.exports = PriceController
