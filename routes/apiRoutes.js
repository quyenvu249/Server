var express = require('express');
var router = express.Router();

let middle = require('../middleware/middle');
let apiController = require('../controller/apiController');


router.post('/login', apiController.login);
router.post('/register', apiController.register);

router.get('/news', apiController.getNews);
router.get('/services', apiController.getAllService);

router.get('/user', middle.checkLogin, apiController.getInfoUser);
router.get('/user/schedule', middle.checkLogin, apiController.getScheduleUser);
router.get('/user/notify', middle.checkLogin, apiController.getNotifyUser);
router.post('/user/update', middle.checkLogin, apiController.updateInfoUser);
router.post('/user/updatePass', middle.checkLogin, apiController.changePass);

router.get('/vehicles', middle.checkLogin, apiController.getAllVehicleUser);
router.post('/add-vehicle', middle.checkLogin, apiController.addVehicle);
router.post('/vehicle/update/:id', middle.checkLogin, apiController.updateVehicle);
router.get('/vehicle/delete/:id', middle.checkLogin, apiController.deleteVehicle);

router.post('/book', middle.checkLogin, apiController.schedule);
router.get('/schedules', middle.checkLogin, apiController.getAllSchedule);
router.get('/schedules/pending', middle.checkLogin, apiController.getNumberOfSchedule);
router.post('/schedule/:id/cancel', middle.checkLogin, apiController.cancelSchedule);
router.post('/schedule/:id/confirm', middle.checkLogin, apiController.confirmSchedule);
router.post('/schedule/:id/complete', middle.checkLogin, apiController.completeSchedule);
router.post('/schedule/:id/confirmVehicle', middle.checkLogin, apiController.confirmVehicleStatus);

// router.get('/statistics', apiController.getS);

module.exports = router;
