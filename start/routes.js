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

Route.post('/users', 'UserController.store')

Route.group(() => {
  Route.get('/user/details', 'UserController.show')
}).middleware('auth')

Route.resource('users', 'UserController')
  .apiOnly().except(['store', 'destroy']).middleware('auth')

Route.post('/authenticate', 'SessionController.authenticate')

Route.post('/users/:id/avatar', 'ImageController.store')
Route.get('images/:path', 'ImageController.show')

Route.group(() => {
  Route.post('/events/new', 'EventController.store')
  Route.post('/events/list', 'EventController.index')
  Route.get('/events/list/user', 'EventController.show')
  Route.delete('/events/:id', 'EventController.destroy')
  Route.patch('/events/update', 'EventController.update')
}).middleware('auth')

Route.post('/notification/register', 'NotificationController.store')

Route.group(() => {
  Route.get('/notification/list', 'NotificationController.index')
  Route.put('/notification/update', 'NotificationController.update')
}).middleware('auth')

Route.group(() => {
  Route.get('/dates', 'DateController.index')
}).middleware('auth')

Route.group(() => {
  Route.post('admin/events/new', 'AdminEventController.store')
  Route.post('admin/events/agenda', 'AdminEventController.agenda')
  Route.post('admin/events/list/user', 'AdminEventController.show')
  Route.delete('admin/events/:id', 'AdminEventController.destroy')
  Route.patch('admin/events/update', 'AdminEventController.update')
}).middleware('auth')

Route.resource('messages', 'MessageController')
  .apiOnly().except(['show', 'update']).middleware('auth')

Route.group(() => {
  Route.get('/plans', 'PlanController.index')
  Route.get('/plans/:user', 'PlanController.show')
  Route.post('/plans/:user', 'PlanController.store')
}).middleware('auth')
