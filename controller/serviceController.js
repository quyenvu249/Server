let Service = require('../model/Service')

module.exports.getAllService = async (req, res) => {
    await Service.find({}).then((data) => {
        res.render('service/services', {layout: 'temp/index', title: "Dịch vụ", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}
module.exports.action = async (req, res) => {
    let perform = req.query.perform;
    if (perform === 'add') {
        let service = new Service({name: req.body.name});
        service.save().then(() => {
            res.redirect('/services')
        }, (err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        }).catch((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })
    } else if (perform === 'update') {
        await Service.findById(req.query.id).then(async (service) => {
            await Service.findOneAndUpdate({_id: service._id}, {
                $set: {
                    name: req.body.name,
                    status: req.body.status
                }
            }, {new: true}).then(() => {
                res.redirect('/services')
            }, (err) => {
                res.render('error/404', {
                    layout: 'temp/index',
                    title: "Có lỗi xảy ra !",
                    err: true,
                    message: `Chỉnh sửa thất bại ${err}`
                })
            }).catch((err) => {
                res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
            })
        }, (err) => {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: `Không tìm thấy dịch vụ ${err}`
            })
        }).catch((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })
    } else if (perform === 'delete') {
        await Service.findById(req.query.id).then(async (service) => {
            await Service.findOneAndDelete({_id: service._id}).then(() => {
                res.redirect('/services')
            }, (err) => {
                res.render('error/404', {
                    layout: 'temp/index',
                    title: "Có lỗi xảy ra !",
                    err: true,
                    message: `Xóa dịch vụ thất bại ${err}`
                })
            }).catch((err) => {
                res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
            })
        }, (err) => {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: `Không tìm thấy dịch vụ ${err}`
            })
        }).catch((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })

    }

}

