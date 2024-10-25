const mongoose = require("mongoose")

const likedSchema = new mongoose.Schema({
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
    varientId: {
        type: String,
        // ref: "product",
        // required: true
    },

}, { timestamps: true })


module.exports = mongoose.model("liked", likedSchema)