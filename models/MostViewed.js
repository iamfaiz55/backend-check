const mongoose = require("mongoose")

const mostViewedSchema = new mongoose.Schema({
    type:{
        type:String,
        required: true
    },
    views:{
        type:Number,
        default:1
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },

}, { timestamps: true })


module.exports = mongoose.model("mostViewed", mostViewedSchema)