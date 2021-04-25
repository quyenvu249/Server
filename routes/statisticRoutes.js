var express = require('express');
var router = express.Router();

let middle = require('../middleware/middle');
let statisticController = require('../controller/statisticController');

router.get('/',middle.checkAdminLogin, statisticController.getStatistic)

// router.post('/action',middle.checkAdminLogin, statisticController.action)

module.exports = router