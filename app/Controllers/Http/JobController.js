'use strict'

const Database = use('Database')
const Job = use('App/Models/Job')
const User = use('App/Models/User')

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
   * @param {Response} ctx.response
   */
  async index ({ response }) {
    try {
      const jobs = await Job
        .query()
        .select('id as job', 'title')
        .fetch()

      return jobs
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar profissões salvas.' })
    }
  }

  async show ({ params, response }) {
    try {
      const user = Number(params.id)
      const [job] = await Database
        .query()
        .select('jobs.id as job', 'jobs.title')
        .from('jobs')
        .innerJoin('users', 'users.job_id', 'jobs.id')
        .where('users.id', '=', user)

      if (!job) {
        return response
          .status(400)
          .send({ message: 'Usuário sem profissão.' })
      }

      return job
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar profissão.' })
    }
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
      const { title } = request.post()

      if (!title) {
        return response
          .status(400)
          .send({ message: 'Insira uma profissão.' })
      }
      await Job.create({ title: title })

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
   * Update job details.
   * PUT or PATCH jobs/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    try {
      const currentJob = Number(params.id)
      const { title: futureJob } = request.post()

      if (!futureJob) {
        return response
          .status(400)
          .send({ message: 'Insira uma profissão.' })
      }

      const job = await Job.findOrFail(currentJob)

      job.merge({ title: futureJob })
      await job.save()

      return response
        .status(200)
        .send({ message: 'Profissão atualizada.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível atualizar a profissão.' })
    }
  }

  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async updateUserJob ({ request, response }) {
    try {
      const { user: userId, job: jobId } = request.post()

      if (!userId || !jobId) {
        return response
          .status(400)
          .send({ message: 'Parâmetros inválidos.' })
      }

      const user = await User.findOrFail(userId)
      user.merge({ job_id: jobId })
      await user.save()

      return response
        .status(200)
        .send({ message: 'Profissão do usuário atualizada.' })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Não foi possível atualizar a profissão.' })
    }
  }

  async populate ({ response }) {
    try {
      const { id } = await Job.first()

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
