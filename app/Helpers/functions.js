const Log = use('App/Models/Log')
const User = use('App/Models/User')
const Notification = use('App/Models/Notification')

async function writeLog (userID, message) {
  try {
    const user = await User
      .query()
      .select('name')
      .where({
        id: userID
      })
      .fetch()

    let userName = user.toJSON()[0]
    userName = userName.name.split(' ')[0]
    const data = `${userName} ${message}`

    await Log.create({ log: data })
  } catch (error) {
    throw new Error('Erro ao salvar registros.')
  }
}

/**
 * @param {string} time
 * @returns {string} formattedTime
 */
function timeToSaveInDatabase (time) {
  const formattedTime = `${time.split(':')[0]}:00:00`
  return formattedTime
}

/**
 * @param {string} date
 * @returns {string} dateWithSlash
 */
function parseDateFromHyphenToSlash (date) {
  const parsedDate = date.split('-').reverse().join('/')
  return parsedDate
}

async function prepareNotifications (message, userArray, title = 'Solution Center') {
  const body = { body: message, title }
  const notification = await Notification
    .query()
    .select('token')
    .whereIn('user_id', userArray)
    .fetch()

  const tokens = []
  notification.rows.forEach(e => {
    tokens.push(e.token)
  })

  const sendNotifications = { to: tokens, sound: 'default', ...body }
  if (!sendNotifications.to.length) return null
  return sendNotifications
}

/**
 * @param {Date} currentDate
 * @param {Date} eventDate
 * @returns {boolean} boolean
 */
const eventDateInPast = function (currentDate, eventDate) {
  if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
    return true
  }
  return false
}

/**
 * @param {Date} currentDate
 * @param {Date} eventDate
 * @returns {boolean} boolean
 */
const eventDateInFuture = function (currentDate, eventDate) {
  if (currentDate.setHours(0, 0, 0, 0) < eventDate.setHours(0, 0, 0, 0)) {
    return true
  }
  return false
}

module.exports = {
  writeLog,
  timeToSaveInDatabase,
  parseDateFromHyphenToSlash,
  prepareNotifications,
  eventDateInPast,
  eventDateInFuture
}
