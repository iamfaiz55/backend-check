const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Types.ObjectId,
        ref: "product",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    varientId: {
        type: String,
        // required: true
    }
});


const cardSchema = new mongoose.Schema({
    cardHolder: {type:String},
    cardNumber: {type: Number},
    expiryMonth: {type: Number },
    securityCode:{type:String}
});



const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    orderItems: [orderItemSchema],
    total: {
        type: Number,
        required: true
    },
    deliveryAddressId:{
          type:mongoose.Types.ObjectId,
          ref:"addresses",
          required:true
    },
    cardDetails:{cardSchema},
    paymentMethod:{
          type:String,
          required:true
    },
    status: {
        type: String,
        enum: ["delivered", "pending", "shipped", "cancelled", "dispatched"],
        default: "pending"
    },
    razorpay_payment_id:{
        type:String
    },
    razorpay_order_id:{
        type:String
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
