'use strict'

const { HOURS_ADMIN_BUSINESS_DAYS, ROOM_IDS } = require('../../Helpers/constants')

const Database = use('Database')

class BusinessController {
  async countRoomsByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.post()

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
      const roomCount = {}

      ROOM_IDS.forEach(id => { roomCount[id] = 0 })

      event.forEach(element => {
        const roomNumber = Number(element.room)
        roomCount[`${roomNumber}`]++
      })

      return response
        .status(200)
        .send({ total: totalRooms, rooms: roomCount })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar informações.' })
    }
  }

  async countHoursByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.post()

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

  async countJobsByDateRange ({ request, response }) {
    try {
      const { start: startDate, end: endDate } = request.post()

      if (!startDate || !endDate) {
        return response
          .status(400)
          .send({ message: 'Datas não informadas.' })
      }

      const [data] = await Database
        .raw(`
select 
  j.title, 
  count(*) count 
from jobs as j 
  inner join users as u 
  inner join events e on 
    u.job_id = j.id and 
    e.user_id = u.id
where
  (e.date between ? and ?)
group by 
  j.title 
having 
  count(*)>0;
`, [startDate, endDate])

      let roomCount = 0
      data.forEach(info => {
        roomCount += info.count
      })

      return response
        .status(200)
        .send({ total: roomCount, jobs: data })
    } catch (error) {
      return response
        .status(error.status)
        .send({ message: 'Erro ao buscar informações.' })
    }
  }
}
module.exports = BusinessController
