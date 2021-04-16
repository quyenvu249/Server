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
let serviceAccount = require("../datn-iwash-firebase-adminsdk-a30tb-8e2250e463.json")
// let token = "eHVvIIOvR8awgrcq42gm82:APA91bGbc17ZooynHKaYb0s2cOFpX7gj1kJfyewT00RX_wYw5AjMaaoUNflV-3J0xr6TaTC30IGQvfUtuFmqEc03EcHGs_w5dOfOKtx2aSDgSa4fnARuhJ5aWRLLt0158tILGGaQ2ubO"

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

let cronJob = (id, hour, min, day, month) => {
    let minDel = parseInt(min) + 1
    let job = new cron.CronJob(`* ${minDel} ${hour} ${day} ${month} *`, async () => {

        let book = await Schedule.findOne({idUser: id, status: "Pending"})
        if (book) {
            await Schedule.findOneAndDelete({_id: book._id}).then(() => {
                console.log(`Đã hủy đơn ${book._id}`)
            })
        }
        job.stop()
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
module.exports = {notify};
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
    await Schedule.find({idUser: req.user.id}).populate('services').populate({path: 'vehicle', populate: {path:'idUser'}}).then((schedules) => {
        res.json({success: true, message: `OK`, schedules})
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
    await Schedule.find({}).populate('idUser').populate('vehicle').then((schedules) => {
        res.json({success: true, message: `OK`, schedules})
    }, (err) => {
        res.json({success: false, message: err})
    }).catch((err) => {
        res.json({success: false, message: err})
    })
}

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
    let schedule = await Schedule.findOne({idUser, status:"Pending"})
    if (schedule) {
        res.json({success: false, message: 'Bạn đang spam đặt lịch'})
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
    let slSchedule = await Schedule.find({timeBook})
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
            notify('Thành công','Lịch của bạn đã được đặt. Vui lòng mang xe tới đúng giờ', req.user.tokenDevice)
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
    await Schedule.findOneAndUpdate({_id: schedule._id}, {$set: {status: 'Cancelled', note}}, {new: true}).then((schedule) => {
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
    if (user.role = 'Customer') {
        res.json({success: false, message: 'Bạn không có quyền'})
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
    }, {new: true}).then(() => {
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
    }, {new: true}).then(() => {
        res.json({success: true, message: `Đã hoàn thành`})
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
    let {fullName, address} = req.body
    let avatar = user.avatar
    if (req.files) {
        if (user.avatar != 'images/img.png') {
            fs.unlinkSync(`./uploads/${user.avatar}`)
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


