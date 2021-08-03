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
  isSameDay,
  subHours
} = require('date-fns')

const Plan = use('App/Models/Plan')
class DateController {
  async verifyEndOfPlan (userId) {
    const currentDate = subHours(new Date(), 3)
    const futureDate = addDays(currentDate, 30)
    try {
      const plan = await Plan.findBy('user_id', userId)
      if (plan.plan !== '1') {
        if (
          isSameDay(futureDate, parseISO(plan.updated_at)) ||
        isAfter(futureDate, parseISO(plan.updated_at))
        ) {
          plan.merge({ plan: '1' })
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

  async show ({ request, response, auth }) {
    try {
      const userID = request.input('user', auth.user.id)
      await this.verifyEndOfPlan(userID)

      const plan = await Plan.findBy('user_id', userID)

      const currentDate = new Date(Date.now())
      const minDate = format(currentDate, 'yyyy-MM-dd')

      let maxDate = ''
      let saturday = null
      if (Number(plan.plan) !== 1) {
        maxDate = addDays(new Date(plan.updated_at), 30)
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
