'use strict'
const {
  endOfWeek,
  isSaturday,
  isFriday,
  isThursday,
  addDays,
  format,
  isAfter,
  parseISO,
  isToday,
  subHours
} = require('date-fns')

const Plan = use('App/Models/Plan')
class DateController {
  async verifyEndOfPlan (userId) {
    const currentDate = subHours(new Date(), 3)
    const futureDate = addDays(currentDate, 30)
    try {
      const plan = await Plan.findBy('user_id', userId)
      if (Number(plan.plan) !== 1) {
        if (isToday(futureDate, parseISO(plan.updated_at)) ||
        isAfter(futureDate, parseISO(plan.updated_at))) {
          plan.merge({ plan: 1 })
          await plan.save()
        }
      }
    } catch (error) {
      throw new Error('Erro ao modificar usuário ' + userId + ' para hora avulsa')
    }
  }

  whichSaturday (day, func) {
    let dayReturn = {}
    if (func(day) || isSaturday(day)) {
      const nextWeek = addDays(day, 4)
      dayReturn = endOfWeek(nextWeek)
    } else {
      dayReturn = endOfWeek(day)
    }
    return dayReturn
  }

  async show ({ response, auth }) {
    try {
      const userID = auth.user.id
      await this.verifyEndOfPlan(userID)

      const currentDate = new Date()
      const minDate = format(currentDate, 'yyyy-MM-dd')
      let maxDate = ''
      let saturday = null

      const plan = await Plan.findBy('user_id', userID)
      const planJSON = plan.toJSON()

      if (Number(planJSON.plan) !== 1) {
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
        .send({ message: 'Erro ao buscar datas.' })
    }
  }
}

module.exports = DateController
