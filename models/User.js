const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    mobile:{
        type:Number,
        required: true
    },
    otp:{
        type:String,
    },
    email:{
        type:String,
    },
    image:{
        type:String,
        default:"https://static.vecteezy.com/system/resources/previews/027/990/875/non_2x/royal-frame-logo-generative-ai-free-png.png"
    },
    isBlock:{
        type:Boolean,
        default:false
    }

},{timestamps:true})


module.exports = mongoose.model("user", userSchema)