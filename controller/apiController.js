let md5 = require('md5')
let jwt = require('jsonwebtoken')
let cron = require('cron')
let uniqid = require('uniqid')
let fs = require('fs')
let admin = require("firebase-admin")

let User = require('../model/User')
let New = require('../model/New')
let Schedule = require('../model/Schedule')
let Vehicle = require('../model/Vehicle')
let Service = require('../model/Service')
let Notify = require('../model/Notify')
let Statistic = require('../model/Statistic')
let serviceAccount = require("../datn-iwash-firebase-adminsdk-a30tb-8e2250e463.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let cronJob = (id, hour, min, day, month) => {
    let minDel = parseInt(min) + 15
    let job = new cron.CronJob(`* ${minDel} ${hour} ${day} ${month} *`, async () => {
        let book = await Schedule.findOne({idUser: id, status: "Pending"})
        if (book) {
            await Schedule.findOneAndDelete({_id: book._id}).then(() => {
                console.log(`Đã hủy đơn ${book._id}`)
            })
        }
        job.destroy()
    }, null, true, 'Asia/Ho_Chi_Minh')
}

let notify = (title, message, token) => {
    admin.messaging().sendToDevice(token, {
        data: {
            title,
            message
        }
    }).then((response) => {
        console.log(response)
    }, (err) => {
        console.log("Loi: " + err)
    }).catch((err) => {
        console.log("Catch: " + err)
    })
}

let addNotify = async (title, user, schedule) => {
    let add = new Notify({title, user, schedule, time: new Date()});
    add.save().then(() => {
        console.log(`Thêm thành công`)
    }).catch((err) => {
        console.log(`Lỗi: ${err}`)
    })
}

module.exports = {notify, addNotify};

module.exports.login = async (req, res) => {
    let phoneNumber = req.body.phoneNumber
    let user = await User.findOne({phoneNumber})
    if (!user) {
        res.json({success: false, message: `Tài khoản không tồn tại`})
        return
    }
    let passWord = md5(req.body.passWord)
    if (passWord != user.passWord) {
        res.json({success: false, message: `Mật khẩu không chính xác`})
        return
    }
    let tokenDevice = req.body.tokenDevice
    if (tokenDevice != user.tokenDevice) {
        await User.findOneAndUpdate({_id: user._id}, {
            $set: {
                tokenDevice
            }
        }, {new: true})
    }
    let token = jwt.sign({id: user._id, tokenDevice}, 'duan', {algorithm: 'HS256', expiresIn: 30 * 24 * 60 * 60})
    res.json({success: true, token: token, message: `Đăng nhập thành công`, user})
}

module.exports.register = async (req, res) => {
    let phoneNumber = req.body.phoneNumber
    let user = await User.findOne({phoneNumber})
    if (user) {
        res.json({success: false, message: `Số điện thoại đã đăng kí`})
        return
    }
    let passWord = md5(req.body.passWord)
    let fullName = req.body.fullName
    let address = req.body.address
    let add = new User({phoneNumber, passWord, fullName, address})
    add.save().then((resolve, reject) => {
        if (resolve) {
            res.status(200).json({success: true, message: `Đăng kí thành công`})
        } else if (reject) {
            res.status(300).json({success: false, message: `Đăng kí thất bại`})
        }
    })
}

module.exports.getNews = async (req, res) => {
    await New.find({status: true}).then((news) => {
        res.json({success: true, news, message: 'OK'})
    }, (err) => {
        res.json({success: false, message: `Lỗi hệ thống! ${err}`})
    }).catch((err) => {
        res.json({success: false, message: `Lỗi hệ thống! ${err}`})
    })
}

module.exports.addVehicle = async (req, res) => {
    await User.findById(req.user.id).then((user) => {
        let {name, type, license, color, brand} = req.body
        let add = new Vehicle({idUser: user._id, name, type, license, color, brand})
        add.save().then((vehicle) => {
            res.json({success: true, message: `Thêm xe thành công`})
        }, (err) => {
            res.json({success: false, message: err})
        }).catch((err) => {
            res.json({success: false, message: err})
        })
    }, (err) => {
        res.json({success: false, message: "Không xác định được người dùng. Vui lòng đăng nhập lại"})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.updateVehicle = async (req, res) => {
    let vehicle = await Vehicle.findById(req.params.id)
    if (!vehicle) {
        res.json({success: false, message: 'Không tìm thấy xe'})
        return
    }
    if (vehicle.idUser != req.user.id) {
        res.json({success: false, message: 'Bạn chỉ có thể chỉnh sửa thông tin xe của bạn'})
        return
    }
    let {name, type, license, color, brand} = req.body
    await Vehicle.findOneAndUpdate({_id: vehicle._id}, {
        $set: {
            name,
            type,
            license,
            color,
            brand
        }
    }, {new: true}).then(() => {
        res.json({success: true, message: "Lưu thông tin xe thành công"})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.deleteVehicle = async (req, res) => {
    let vehicle = await Vehicle.findById(req.params.id)
    if (!vehicle) {
        res.json({success: false, message: 'Không tìm thấy xe'})
        return
    }
    if (vehicle.idUser != req.user.id) {
        res.json({success: false, message: 'Bạn chỉ có thể xóa xe của bạn'})
        return
    }
    await Vehicle.findOneAndDelete({_id: vehicle._id}).then(() => {
        res.json({success: true, message: `Xóa xe thành công`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.getScheduleUser = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    await Schedule.find({idUser: req.user.id}).populate('services').populate({
        path: 'vehicle',
        populate: {path: 'idUser'}
    }).populate('idUser').then((schedules) => {
        res.json({success: true, message: `OK`, schedules: schedules.reverse()})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.getAllSchedule = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    if (user.role == 'Customer') {
        res.json({success: false, message: 'Bạn không có quyền xem'})
        return
    }
    await Schedule.find({}).populate('services').populate({
        path: 'vehicle',
        populate: {path: 'idUser'}
    }).populate('idUser').then((schedules) => {
        res.json({success: true, message: `OK`, schedules: schedules.reverse()})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

// module.exports.getStatistics = async (req, res) => {
//     let motoCount = 0, carCount = 0;
//     let user = await User.findById(req.user.id)
//     if (!user) {
//         res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
//         return
//     }
//     if (user.role == 'Customer') {
//         res.json({success: false, message: 'Bạn không có quyền xem'})
//         return
//     }
//     await Schedule.find({}).populate('services').populate({
//         path: 'vehicle',
//         populate: {path: 'idUser'}
//     }).populate('idUser').then((schedules) => {
//         res.json({success: true, message: `OK`, schedules: schedules.reverse()})
//     }, (err) => {
//         res.json({success: false, message: err})
//     }).catch((err) => {
//         res.json({success: false, message: err})
//     })
// }

module.exports.getAllVehicleUser = async (req, res) => {
    await Vehicle.find({idUser: req.user.id}).populate('idUser').then((vehicles) => {
        res.json({success: true, message: `OK`, vehicles})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.getAllService = async (req, res) => {
    await Service.find({}).then((services) => {
        res.json({success: true, message: `OK`, services})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.schedule = async (req, res) => {
    console.log(req.user.tokenDevice)
    let idUser = req.user.id
    let schedule = await Schedule.findOne({idUser, status: "Pending"})
    if (schedule) {
        notify('Thất bại', 'Bạn phải chờ lịch của bạn hoàn thành để đặt tiếp', req.user.tokenDevice)
        res.json({success: false, message: 'Bạn phải chờ lịch của bạn hoàn thành để đặt tiếp'})
        return
    }
    let staff = await User.find({role: 'Staff'})
    if (!staff) {
        res.json({success: false, message: 'Không tìm thấy nhân viên'})
        return
    }
    let timeBook = req.body.timeBook
    let vehicle = req.body.vehicle
    let services = req.body.service
    let slSchedule = await Schedule.find({timeBook, status: "Pending"})
    if (slSchedule.length >= staff.length) {
        res.json({success: false, message: 'Khung giờ này đã đầy'})
        return
    }
    let hour = timeBook.split('@')[0].split(':')[0].trim()
    let min = timeBook.split('@')[0].split(':')[1].trim()
    let day = timeBook.split('@')[1].split('/')[0].trim()
    let month = timeBook.split('@')[1].split('/')[1].trim() - 1
    let add = new Schedule({idUser, timeBook, vehicle, services})
    add.save().then((resolve, reject) => {
        if (resolve) {
            cronJob(idUser, hour, min, day, month)
            notify('Thành công', 'Lịch của bạn đã được đặt. Vui lòng mang xe tới đúng giờ', req.user.tokenDevice)
            addNotify(`Lịch của bạn đã được đặt thành công`, idUser, resolve._id);
            res.json({success: true, message: `Đặt lịch thành công`})
        } else if (reject) {
            res.json({success: false, message: `Đặt lịch thất bại`})
        }
    })
}

module.exports.cancelSchedule = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    let note = req.body.note
    let schedule = await Schedule.findById(req.params.id)
    if (!schedule) {
        res.json({success: false, message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'})
        return
    }
    if (user.role == 'Customer' && req.user.id != schedule.idUser) {
        res.json({success: false, message: 'Bạn chỉ được hủy lịch của mình'})
        return
    }
    await Schedule.findOneAndUpdate({_id: schedule._id}, {
        $set:
            {status: 'Cancelled', note, idStaffConfirm: user._id, timeConfirm: new Date()}
    }, {new: true}).then((schedule) => {
        notify('Xin lỗi', 'Lịch của bạn đã bị hủy', req.user.tokenDevice)
        addNotify(`Lịch của bạn đã bị hủy`, schedule.idUser, schedule._id)
        res.json({success: true, message: `Hủy lịch thành công`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.confirmSchedule = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    let schedule = await Schedule.findById(req.params.id)
    if (!schedule) {
        res.json({success: false, message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'})
        return
    }
    if (schedule.status != 'Pending') {
        res.json({success: false, message: 'Lịch này đã được xác nhận hoặc đã hoàn thành'})
        return
    }
    let timeConfirm = new Date()
    await Schedule.findOneAndUpdate({_id: schedule._id}, {
        $set: {
            status: 'Confirmed',
            timeConfirm,
            idStaffConfirm: req.user.id
        }
    }, {new: true}).then((schedu) => {
        addNotify(`Lịch của bạn đang được thực hiện`, schedu.idUser, schedu._id)
        res.json({success: true, message: `Đã xác nhận thành công`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.completeSchedule = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    let schedule = await Schedule.findById(req.params.id)
    if (!schedule) {
        res.json({success: false, message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'})
        return
    }
    if (schedule.vehicleStatus === false) {
        res.json({success: false, message: 'Người dùng chưa lấy xe, bạn không thể xác nhận lịch đã hoàn thành!'})
        return
    }
    if (req.user.id != schedule.idStaffConfirm) {
        res.json({success: false, message: 'Bạn không phải người xác nhận'})
        return
    }
    if (schedule.status != 'Confirmed') {
        res.json({success: false, message: 'Lịch này chưa được xác nhận hoặc đã hoàn thành'})
        return
    }
    await Schedule.findOneAndUpdate({_id: schedule._id}, {
        $set: {
            status: 'Completed'
        }
    }, {new: true}).then((schedu) => {
        notify('Xong rồi!', 'Dịch vụ của bạn đã hoàn thành', req.user.tokenDevice)
        addNotify(`Dịch vụ của bạn đã hoàn thành`, user._id, schedu._id)
        res.json({success: true, message: `Đã hoàn thành`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.confirmVehicleStatus = async (req, res) => {
    let schedule = await Schedule.findById(req.params.id)
    if (!schedule) {
        res.json({success: false, message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'})
        return
    }
    if (req.user.id != schedule.idUser) {
        res.json({success: false, message: 'Bạn không phải người đặt lịch'})
        return
    }
    if (schedule.status != 'Confirmed') {
        res.json({success: false, message: 'Lịch này chưa được xác nhận hoặc đã hoàn thành'})
        return
    }
    await Schedule.findOneAndUpdate({_id: schedule._id}, {
        $set: {
            vehicleStatus: true
        }
    }, {new: true}).then((schedu) => {
        notify('Xong rồi!', 'Bạn xác nhận đã lấy xe thành công', req.user.tokenDevice)
        addNotify(`Bạn đã lấy xe thành công`, schedu.idUser, schedu._id)
        res.json({success: true, message: 'Đã lấy xe'})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.getInfoUser = async (req, res) => {
    await User.findById(req.user.id).then((user) => {
        res.json({success: true, message: `OK`, user})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.updateInfoUser = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    let fullName = req.body.fullName.substring(1, req.body.fullName.substring.length - 1)
    let address = req.body.address.substring(1, req.body.address.substring.length - 1)
    let avatar = user.avatar
    if (req.files) {
        try {
            if (user.avatar != 'images/img.png') {
                fs.unlinkSync(`./uploads/${user.avatar}`)
            }
        } catch (e) {
            console.log(e)
        }
        avatar = req.files.avatar
        let filename = "user/" + uniqid() + "-" + avatar.name
        avatar.mv(`./uploads/${filename}`)
        avatar = filename

    }
    await User.findOneAndUpdate({_id: req.user.id}, {
        $set: {
            fullName, address, avatar
        }
    }, {new: true}).then(() => {
        res.json({success: true, message: `Thay đổi thông tin thành công`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.changePass = async (req, res) => {
    let user = await User.findById(req.user.id)
    if (!user) {
        res.json({success: false, message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'})
        return
    }
    let currentPass = md5(req.body.currentPass)
    if (currentPass != user.passWord) {
        res.json({success: false, message: 'Mật khẩu hiện tại không chính xác'})
        return
    }
    let passWord = md5(req.body.newPass)
    await User.findOneAndUpdate({_id: req.user.id}, {
        $set: {
            passWord
        }
    }, {new: true}).then(() => {
        res.json({success: true, message: `Đổi mật khẩu thành công`})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

module.exports.getNotifyUser = async (req, res) => {
    await Notify.find({user: req.user.id}).then((notify) => {
        res.json({success: true, message: `OK`, notify: notify.reverse()})
    }).catch((err) => {
        res.json({success: false, message: `Lỗi ${err}`})
    })
}

module.exports.getNumberOfSchedule = async (req, res) => {
    // (-_-)
    let staff = await User.find({role: 'Staff'})
    if (!staff) {
        res.json({success: false, message: 'Không tìm thấy nhân viên'})
        return
    }
    await Schedule.find({status: "Pending"}).populate('idUser').populate({
        path: 'vehicle',
        populate: {path: 'idUser'}
    }).populate('services').then((schedules) => {
        res.json({success: true, message: `OK`, schedules, users: staff})
    }).catch((err) => {
        res.json({success: false, message: `Lỗi ${err}`})
    })
}
