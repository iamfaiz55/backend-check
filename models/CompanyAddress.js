const mongoose = require("mongoose")

const companyAddressSchema = new mongoose.Schema({
    pincode:{
        type:String,
        required:true
    },
    buildingNo:{
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
    gst:{
        type:String,
    },
    logo:{
        type:String,
    },

    

},{timestamps:true})


module.exports = mongoose.model("companyAddress", companyAddressSchema)