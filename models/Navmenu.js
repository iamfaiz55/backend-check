    const mongoose = require("mongoose");

    const navmenuSchema = new mongoose.Schema({
        menuitem: {
            type: String,
            required: true
        },
        menuImage: {
            type: String,
            // required: true
        },
        children: [
            {
                menuitem: {
                    type: String,
                },
                subtitle: {
                    type: String,
                },
                image: {
                    type: String,
                },
                link: {
                    type: String,
                },
                button: {
                    type: Boolean,
                    default: false 
                }
            }
        ]
    }, { timestamps: true }); 

    module.exports = mongoose.model("navMenu", navmenuSchema);
