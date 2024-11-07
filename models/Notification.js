const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    fcm_token: {
        type: mongoose.Types.ObjectId,
        ref: "product",
        required: true
    },
   
}, { timestamps: true })


module.exports = mongoose.model("notifications", notificationSchema)