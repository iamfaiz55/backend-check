const mongoose = require("mongoose")

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    type:{
        type:String,
        // enum:["logout ", "logout", "brouse", "cart", "checkout"],

    },
    productId:{
        type: mongoose.Types.ObjectId,
        ref:"product"
    },
    cartId:{
        type: mongoose.Types.ObjectId,
        ref:"cart"
    },
    device:{
        type:String,
        required: true
    },
    ordersId:[{
        type: mongoose.Types.ObjectId,
        ref:"Order"

    }],
}, { timestamps: true })


module.exports = mongoose.model("history", historySchema)