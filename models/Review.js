const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({

    pId: {
        type:mongoose.Types.ObjectId,
        ref:"product",
        required:true
    },
    uId: {
        type:mongoose.Types.ObjectId,
        ref:"user",
        required:true
    },

    review: {
        type:String,
    },
    rating: {
        type:Number,
    },


}, { timestamps: true })


module.exports = mongoose.model("reviews", reviewSchema)