let mongosee = require('mongoose');
let scheduleSchema = new mongosee.Schema({
    idUser:{
        type:String,
        required:true,
        ref:'User'
    },
    timeBook: {
        type:String,
        required:true
    },
    services: [{
        type:String,
        ref:'Service'
    }]
    ,
    status: {
        type:String,
        required:true,
        default:"Pending"
    },
    vehicle: {
        type: String,
        required:true,
        ref: 'Vehicle'
    },
    idStaffConfirm: {
        type: String,
        ref: 'User',
        default:''
    },
    timeConfirm: {
        type: Date,
        default:''
    },
    note: String
})
module.exports = mongosee.model('Book', scheduleSchema,'book');
