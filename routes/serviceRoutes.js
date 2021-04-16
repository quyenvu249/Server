let express = require('express')
let router = express.Router()

let middle = require('../middleware/middle')
let serviceController = require('../controller/serviceController')

router.get('/',middle.checkAdminLogin, serviceController.getAllService)

router.post('/action',middle.checkAdminLogin, serviceController.action)

module.exports = router
