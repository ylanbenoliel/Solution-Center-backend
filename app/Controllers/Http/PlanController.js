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
   * Show a list of all plans.
   * GET plans
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ response, auth }) {
    try {
      const userID = auth.user.id
      const plans = await Plan.findByOrFail(
        { user_id: userID }
      )
      return plans
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar planos.' })
    }
  }

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
        .where({ user_id: userID })
        .fetch()

      const plansJSON = plans.toJSON()[0]
      if (!plansJSON) {
        const newPlan = await Plan.findOrCreate(
          { user_id: userID },
          { user_id: userID, plan: 1 }
        )
        return  newPlan
      }

      return  plans 
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
  async store ({ params, request, response }) {
    try {
      const userID = Number(params.user)
      const requestPlans = request.collect(['plan'])

      const mapUserPlans = requestPlans.map(plan => {
        return { plan: Object.values(plan)[0] }
      })

      for (const data of mapUserPlans) {
        await Plan.findOrCreate(
          { user_id: userID, plan: data.plan },
          { user_id: userID, plan: data.plan }
        )
      }

      return { message: 'Planos adicionados' }
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao adicionar planos do usuário.' })
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
