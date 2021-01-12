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
      const plans = await Plan
        .query()
        .select('plan')
        .where({ user_id: userID })
        .fetch()

      return plans.toJSON()[0]
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
      const { plan: requestPlan } = request.all()

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

  /**
   * Delete a plan with id.
   * DELETE plans/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = PlanController
