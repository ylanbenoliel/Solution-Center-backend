'use strict'

const Helpers = use('Helpers')
const User = use('App/Models/User')

class ImageController {
  async store ({ params, request, response }) {
    try {
      const user = await User.findOrFail(params.id)
      const avatarPic = request.file('avatar',
        {
          types: ['image'],
          size: '2mb'
        }
      )

      await avatarPic.moveAll(Helpers.tmpPath('uploads'), (file) => ({
        name: `${Date.now()}-${file.clientName}`
      }))

      if (!avatarPic.movedAll()) {
        return response.status(400).send({ message: 'Erro ao salvar foto' })
      }
      await Promise.all(
        avatarPic
          .movedList()
          .map(img => user.avatar().create({ path: img.fileName }))
      ).then(
        response.status(200).send({ message: 'Foto enviada' })
      )
    } catch (error) {
      response.status(error.status).send({ message: 'Erro ao enviar foto' })
    }
  }

  async show ({ params, response }) {
    return response.download(Helpers.tmpPath(`uploads/${params.path}`))
  }
}

module.exports = ImageController
