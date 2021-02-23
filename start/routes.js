'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => 'Working...')

Route.get('/validate-session', 'SessionController.show').middleware('auth')

Route.get('/price', 'PriceController.index')

Route.get('/privacy', ({ view }) => {
  return view.render('privacy')
})

Route.post('/users', 'UserController.store')

Route.group(() => {
  Route.get('/forgot-password/:email', 'ForgotPasswordController.store')
  Route.post('/verify-reset-code', 'ForgotPasswordController.show')
  Route.patch('/password', 'ForgotPasswordController.update')
})

Route.group(() => {
  Route.get('/user/details', 'UserController.show')
  Route.get('/users/debt', 'UserController.debt')
}).middleware('auth')

Route.resource('users', 'UserController')
  .apiOnly().except(['store']).middleware('auth')

Route.post('/authenticate', 'SessionController.authenticate')

Route.post('/users/:id/avatar', 'ImageController.store')
Route.get('images/:path', 'ImageController.show')
Route.put('images', 'ImageController.update').middleware('auth')

Route.group(() => {
  Route.post('/events/new', 'EventController.store')
  Route.post('/events/list', 'EventController.schedule')
  Route.get('/events/list/user', 'EventController.show')
  Route.delete('/events/:id', 'EventController.destroy')
  Route.patch('/events/update', 'EventController.update')
}).middleware('auth')

Route.post('/notification/register', 'NotificationController.storeOrUpdate')
  .middleware('auth')

Route.group(() => {
  Route.get('/dates', 'DateController.show')
}).middleware('auth')

Route.group(() => {
  Route.post('admin/events/new', 'AdminEventController.store')
  Route.post('admin/events/close-day', 'AdminEventController.closeDay')
  Route.post('admin/events/agenda', 'AdminEventController.agenda')
  Route.post('admin/events/list/user', 'AdminEventController.show')
  Route.post('admin/events/list/debts', 'AdminEventController.eventsWithDebt')
  Route.delete('admin/events/:id', 'AdminEventController.destroy')
  Route.patch('admin/events/update', 'AdminEventController.update')
  Route.patch('admin/events/payment', 'AdminEventController.payment')
}).middleware('auth')

Route.group(() => {
  Route.get('/messages', 'MessageController.index')
  Route.post('/messages', 'MessageController.store')
  Route.delete('/messages/:id', 'MessageController.delete')
}).middleware('auth')

Route.group(() => {
  Route.get('/plans/:user', 'PlanController.show')
  Route.post('/plans/:user', 'PlanController.update')
}).middleware('auth')

Route.get('/logs', 'LogController.index')
  .middleware('auth')

Route.group(() => {
  Route.post('/business/rooms', 'BusinessController.countRoomsByDateRange')
  Route.post('/business/hours', 'BusinessController.countHoursByDateRange')
}).middleware('auth')

Route.group(() => {
  Route.post('/jobs', 'JobController.store')
  Route.get('/jobs/populate', 'JobController.populate')
})
