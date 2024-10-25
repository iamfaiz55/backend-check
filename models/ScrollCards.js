const mongoose = require("mongoose")

const scrollCardSchema = new mongoose.Schema({
    title: {
        type:String
    },
    image: {
        type: String
    },
    link: {
        type: String
    },

}, { timestamps: true })


module.exports = mongoose.model("scrollCards", scrollCardSchema)