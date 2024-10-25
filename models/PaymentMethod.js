const mongoose = require("mongoose")

const paymentMethodSchema = new mongoose.Schema({
    method: {
        type:String,

    },
    salesTax: {
        type:String,

    },
    makingCharges: {
        type:String,

    },
    discount: {
        type:String,

    },
    active: {
        type:Boolean,
        default:true
    },


}, { timestamps: true })


module.exports = mongoose.model("paymentMethod", paymentMethodSchema)