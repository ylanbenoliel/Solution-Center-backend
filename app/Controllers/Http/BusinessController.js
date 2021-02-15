'use strict'

const Database = use('Database')

class BusinessController {
  async countRoomsByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.all()

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
}

module.exports = BusinessController
