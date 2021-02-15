'use strict'

const { HOURS_ADMIN_BUSINESS_DAYS } = require('../../Helpers/constants')

const Database = use('Database')

class BusinessController {
  async countRoomsByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.all()

      if (!startDate || !endDate) {
        return response
          .status(400)
          .send({ message: 'Datas não informadas.' })
      }

      const event = await Database
        .query()
        .select('events.date', 'events.room')
        .from('events')
        .whereBetween('events.date', [startDate, endDate])

      const totalRooms = event.length
      const roomCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }

      event.forEach(element => {
        const roomNumber = Number(element.room)
        roomCount[`${roomNumber}`]++
      })

      return response
        .status(200)
        .send({ total: totalRooms, salas: roomCount })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar informações.' })
    }
  }

  async countHoursByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.all()

      if (!startDate || !endDate) {
        return response
          .status(400)
          .send({ message: 'Datas não informadas.' })
      }

      const events = await Database
        .query()
        .select('events.date', 'events.time')
        .from('events')
        .whereBetween('events.date', [startDate, endDate])

      const totalHours = events.length

      const hoursCount = {}

      HOURS_ADMIN_BUSINESS_DAYS.forEach(hour => {
        hoursCount[`${hour}:00:00`] = 0
      })

      events.forEach(event => {
        const time = event.time
        hoursCount[`${time}`]++
      })

      return response
        .status(200)
        .send({ total: totalHours, hours: hoursCount })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar informações de hora.' })
    }
  }
}

module.exports = BusinessController
