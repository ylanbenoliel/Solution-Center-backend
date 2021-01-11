'use strict'

const Helpers = use('Helpers')
const Drive = use('Drive')
const Database = use('Database')
const User = use('App/Models/User')
const Image = use('App/Models/Image')

class ImageController {
  async store ({ params, request, response }) {
    try {
      const user = await User.findOrFail(params.id)
      const avatarPic = request.file('avatar',
        {
          types: ['image'],
          size: '5mb'
        }
      )

      const avatarPicName = `${new Date().getTime()}.${avatarPic.subtype}`
      await avatarPic.move(Helpers.tmpPath('uploads'), {
        name: avatarPicName
      })

      if (!avatarPic.moved()) {
        return response.status(400).send({ message: 'Erro ao salvar foto' })
      }

      const image = avatarPic.fileName

      await user.avatar().create({ path: image })
      response.status(200).send({ message: 'Foto enviada' })
    } catch (error) {
      response.status(error.status).send({ message: 'Erro ao enviar foto' })
    }
  }

  async show ({ params, response }) {
    return response.download(Helpers.tmpPath(`uploads/${params.path}`))
  }

  async update ({ request, response, auth }) {
    try {
      const avatarPic = request.file('avatar',
        {
          types: ['image'],
          size: '5mb'
        }
      )
      const dbPic = await Database
        .query()
        .select('path')
        .from('images')
        .where('user_id', auth.user.id)

      const avatarPicName = `${new Date().getTime()}.${avatarPic.subtype}`
      await avatarPic.move(Helpers.tmpPath('uploads'), {
        name: avatarPicName
      })

      if (!avatarPic.moved()) {
        return response.status(400).send({ message: 'Erro ao salvar foto' })
      }

      const img = avatarPic.fileName

      if (dbPic.length === 0) {
        await Image.create({ user_id: auth.user.id, path: img })
      } else {
        const image = await Image.findBy('user_id', auth.user.id)
        image.merge({ path: img })
        await image.save()

        const stringImgPath = Object.values(dbPic[0])[0]
        await Drive.delete(Helpers.tmpPath(`uploads/${stringImgPath}`))
      }

      return response.status(200).send({ message: 'Foto atualizada.' })
    } catch (error) {
      return response.status(error.status).send({ message: 'Erro ao enviar foto.' })
    }
  }
}

module.exports = ImageController
