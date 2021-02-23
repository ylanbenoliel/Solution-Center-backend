'use strict'

const Database = use('Database')
const Job = use('App/Models/Job')

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with jobs
 */
class JobController {
  /**
   * Show a list of all jobs.
   * GET jobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, view }) {
  }

  /**
   * Create/save a new job.
   * POST jobs
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    try {
      const { job } = request.post()

      if (!job) {
        return response
          .status(400)
          .send({ message: 'Insira uma profissão.' })
      }
      await Job.create({ title: job })

      return response
        .status(201)
        .send({ message: 'Profissão criada.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao salvar profissão.' })
    }
  }

  /**
   * Display a single job.
   * GET jobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response, view }) {
  }

  /**
   * Update job details.
   * PUT or PATCH jobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a job with id.
   * DELETE jobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }

  async populate ({ response }) {
    try {
      const { id } = await Job.findBy('title', 'Outros')

      await Database
        .table('users')
        .where({ job_id: null })
        .update('job_id', id)

      return response
        .status(200)
        .send({ message: 'Profissão dos usuários definida como padrão.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível atualizar a profissão dos usuários.' })
    }
  }
}

module.exports = JobController
