const mongoose = require("mongoose")

const taxScehma = new mongoose.Schema({

    taxName: {
        type:String,
    },
    percent: {
        type:Number,
    },

    active: {
        type:Boolean,
        default:true
    },


}, { timestamps: true })


module.exports = mongoose.model("tax", taxScehma)