const mongoose = require("mongoose")

const cronScheduleSchema = new mongoose.Schema({
    pId:{
        type:  mongoose.Types.ObjectId,
        ref: "product",
    },
    startTimeAndDate:{
        type:String
    },
    endTimeAndDate: {
        type:String
    },
     isActive:{
        type: Boolean,
        default:true
     }
}, { timestamps: true })


module.exports = mongoose.model("schedules", cronScheduleSchema)