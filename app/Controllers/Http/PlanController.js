'use strict'

const Plan = use('App/Models/Plan')
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with plans
 */
class PlanController {
  /**
   *
   * @param {object} ctx
   * @param {Response} ctx.response
   */
  async show ({ params, response }) {
    try {
      const userID = params.user
      let updatedAt = null

      const plan = await Plan
        .query()
        .select('plan', 'updated_at')
        .where({ user_id: userID })
        .fetch()

      const planJSON = plan.toJSON()[0]
      if (planJSON.plan !== '1') {
        updatedAt = planJSON.updated_at
      }

      const planNumber = planJSON.plan
      const dataToResponse = { plan: planNumber, updated: updatedAt }

      return dataToResponse
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar planos do usuário.' })
    }
  }

  /**
   * Update plan details.
   * PUT or PATCH plans/:user
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    try {
      const userID = Number(params.user)
      const { plan: requestPlan } = request.post()

      const plan = await Plan.findByOrFail('user_id', userID)
      plan.merge({ plan: requestPlan })
      await plan.save()

      return { message: 'Plano Editado.' }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao editar planos do usuário.' })
    }
  }
}

module.exports = PlanController
