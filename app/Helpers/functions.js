const Log = use('App/Models/Log')
const User = use('App/Models/User')

async function writeLog (userID, message) {
  try {
    const admin = await User
      .query()
      .select('name')
      .where({
        id: userID
      })
      .fetch()

    let userName = admin.toJSON()[0]
    userName = userName.name.split(' ')[0]
    const data = `${userName} ${message}`

    await Log.create({ log: data })
  } catch (error) {
    throw new Error('Erro ao salvar registros.')
  }
}

module.exports = { writeLog }
