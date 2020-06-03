'use strict'
const {
  endOfWeek,
  isFriday,
  isSaturday,
  subDays,
  addDays,
  format
} = require('date-fns')

class DateController {
  async index ({ response }) {
    const currentDate = new Date()
    const minDate = format(currentDate, 'yyyy-MM-dd')
    let maxDate = {}
    let saturday = {}

    if (isFriday(currentDate) || isSaturday(currentDate)) {
      const nextWeek = addDays(currentDate, 4)
      saturday = endOfWeek(nextWeek)
    } else {
      saturday = endOfWeek(currentDate)
    }
    maxDate = subDays(saturday, 0)
    maxDate = format(maxDate, 'yyyy-MM-dd')
    response.status(200).send({ minDate, maxDate })
  }
}

module.exports = DateController
