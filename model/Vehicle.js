let mongosee = require('mongoose');
let vehicleSchema = new mongosee.Schema({
    idUser:{
        type:String,
        required:true,
        ref:'User'
    },
    name: {
        type:String,
        required:true
    },
    type: {
        type:String,
        required:true
    },
    brand: {
        type:String,
        required:true
    },
    license: {
        type:String,
        required:true
    },
    color: {
        type: String,
        required: true
    }
})
module.exports = mongosee.model('Vehicle', vehicleSchema,'vehicle');
