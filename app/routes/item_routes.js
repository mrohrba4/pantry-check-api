// require express
const express = require('express')

// require passport
const passport = require('passport')

// Require Item Model
const Item = require('../models/item')

// Custom Errors
const customErrors = require('../../lib/custom_errors')

// sends a 404 when a non-existent document is requested.
const handle404 = customErrors.handle404

// sends 401 when a user tries to modify another user's item
const requireOwnership = customErrors.requireOwnership

// middleware that removes blank fields in req.body
const removeBlanks = require('../../lib/remove_blank_fields')

// token must be passed for the route to be available, sets req.user, use it as the second argument
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router
const router = express.Router()

// CRUD BELOW
// ############

// INDEX(GET /items)
router.get('/items', requireToken, (req, res, next) => {
  // find items by user/owner
  Item.find({ owner: req.user.id })
    // mongoose toObject
    .then(items => items.map(item => item.toObject()))
    // respond with 200 with items to client.
    .then(items => res.json({ items: items }))
    // if error, run next middleware.
    .catch(next)
})

// SHOW(GET /items/:id)
router.get('/items/:id', requireToken, (req, res, next) => {
  // get id of item from params
  const id = req.params.id
  // finding item(by owner)
  Item.findOne({ _id: id, owner: req.user._id })
    // send 404 if no item found.
    .then(handle404)
    // JSON response
    .then(item => res.status(200).json({ item: item }))
    // error catching.
    .catch(next)
})

// CREATE(POST /items)
router.post('/items', requireToken, (req, res, next) => {
  // setting owner of the item to be the current user.
  req.body.item.owner = req.user.id

  // creating the item.
  Item.create(req.body.item)
  // response if successful, 201 and JSON.
    .then(item => {
      res.status(201).json({ item: item.toObject() })
    })
    .catch(next)
})

// UPDATE(PATCH /items/:id)

// DESTROY(DELETE /items/id)
router.delete('/items/:id', requireToken, (req, res, next) => {
  const id = req.params.id
  Item.findOne({ _id: id, owner: req.user._id })
    .then(handle404)
    .then(item => item.deleteOne())
    // send back 204 and no content if succeeded.
    .then(() => res.sendStatus(204))
    .catch(next)
})

// Exporting

module.exports = router
