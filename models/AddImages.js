const mongoose = require("mongoose")

const adImagesSchema = new mongoose.Schema({
    image:{
        type:String,
        required:true
    },
   
},{timestamps:true})


module.exports = mongoose.model("addsImage", adImagesSchema)