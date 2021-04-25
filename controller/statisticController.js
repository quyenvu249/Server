let Schedule = require('../model/Schedule')

module.exports.getStatistic = async (req, res) => {
    let today = new Date()
    let timeStart = req.query.timeStart == undefined ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0) : new Date(new Date(req.query.timeStart).getFullYear(), new Date(req.query.timeStart).getMonth(),new Date(req.query.timeStart).getDate(), 0,0,0)
    let timeEnd = req.query.timeEnd == undefined ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 0) : new Date(new Date(req.query.timeEnd).getFullYear(), new Date(req.query.timeEnd).getMonth(),new Date(req.query.timeEnd).getDate(), 23,59,0)
    console.log(timeStart.getHours())
    console.log(timeEnd)
    let countCar =0;
    let countMoto =0;
    if (timeEnd < timeStart) {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: 'Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu'})
    }
    await Schedule.find({status:'Completed'}).populate('vehicle').then((schedule) => {
        for (let i =0; i<schedule.length; i++) {
            if (schedule[i].timeConfirm >= timeStart && schedule[i].timeConfirm <= timeEnd ) {
                if (schedule[i].vehicle.type == 'Car' ) {
                    countCar++
                } else if (schedule[i].vehicle.type == 'Motorcycle') {
                    countMoto++
                }
            }
        }
        res.render('statistic/statistics', {layout: 'temp/index', title: "Thống kê", err: false, countCar, countMoto})
    }).catch((err)=> {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}