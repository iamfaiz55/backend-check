const mongoose = require("mongoose")

const offerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: "product",
        required: true
    },
    status: {
        type: String,
        enum: ["delevered", "pending", "shipped", "cancel"],
        default: "pending"
    }

}, { timestamps: true })


module.exports = mongoose.model("offers", offerSchema)