const HOURS_ADMIN_SATURDAY = ['08', '09', '10', '11', '12', '13']
const HOURS_ADMIN_BUSINESS_DAYS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']

const HOURS_USER_SATURDAY = HOURS_ADMIN_SATURDAY.slice(0, -2)
const HOURS_USER_BUSINESS_DAYS = HOURS_ADMIN_BUSINESS_DAYS.slice(0, -2)

const ROOM_DATA = [
  { id: 1, name: 'Clarice Lispector' },
  { id: 2, name: 'Carlos Drummond de Andrade' },
  { id: 3, name: 'Cecília Meireles' },
  { id: 4, name: 'Rui Barbosa' },
  { id: 5, name: 'Machado de Assis' },
  { id: 6, name: 'Monteiro Lobato' },
  { id: 7, name: 'Luís Fernando Veríssimo' },
  { id: 8, name: 'Cora Coralina' },
  { id: 9, name: 'Carolina de Jesus' }
]

const ROOM_IDS = ROOM_DATA.map(data => data.id)

module.exports = {
  HOURS_ADMIN_BUSINESS_DAYS,
  HOURS_ADMIN_SATURDAY,
  HOURS_USER_BUSINESS_DAYS,
  HOURS_USER_SATURDAY,
  ROOM_DATA,
  ROOM_IDS
}
