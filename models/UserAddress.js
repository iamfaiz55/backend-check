const mongoose = require("mongoose")

const userAddressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"user",
        required:true
    },
    pincode:{
        type:String,
        required:true
    },
    houseNo:{
        type:String,
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    addressType:{
        type:String,
        enum:["home", "office"],
        required:true,
        default:"home"
    },
    mobile:{
        type:Number,
    },
    isDelete:{
        type:Boolean,
        default: false
    }
    

},{timestamps:true})


module.exports = mongoose.model("addresses", userAddressSchema)