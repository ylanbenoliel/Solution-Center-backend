'use strict'
const {
  endOfWeek,
  isFriday,
  isThursday,
  addDays,
  format
} = require('date-fns')

const Plan = use('App/Models/Plan')
class DateController {
  whichSaturday (day, func) {
    let dayReturn = {}
    if (func(day)) {
      const nextWeek = addDays(day, 4)
      dayReturn = endOfWeek(nextWeek)
    } else {
      dayReturn = endOfWeek(day)
    }
    return dayReturn
  }

  async show ({ response, auth }) {
    try {
      const currentDate = new Date()
      const minDate = format(currentDate, 'yyyy-MM-dd')
      let maxDate = ''
      let saturday = null

      const userID = auth.user.id
      const plan = await Plan.findBy('user_id', userID)
      const planJSON = plan.toJSON()

      if (planJSON.plan != 1) {
        maxDate = addDays(new Date(planJSON.updated_at), 30)
        saturday = this.whichSaturday(maxDate, isThursday)
      } else {
        saturday = this.whichSaturday(currentDate, isFriday)
      }
      maxDate = saturday
      const maxDateFormatted = format(maxDate, 'yyyy-MM-dd')
      response.status(200).send({ minDate, maxDate: maxDateFormatted })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar Datas.' })
    }
  }
}

module.exports = DateController
