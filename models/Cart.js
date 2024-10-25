const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required:true
    },
    varientId: {
        type: String,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    }

}, { timestamps: true })


module.exports = mongoose.model("cart", cartSchema)