let mongosee = require('mongoose')
let statisticSchema = new mongosee.Schema({
    time: {
        type: Date,
        required: true
    },
    field: {
        type: String,
        default: true
    }
})
module.exports = mongosee.model('Statistic', statisticSchema, 'statistic');