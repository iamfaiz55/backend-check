const mongoose = require("mongoose")

const adminSocketId = new mongoose.Schema({

    id: {
        type: String,
    },

}, { timestamps: true })


module.exports = mongoose.model("adminSocketId", adminSocketId)