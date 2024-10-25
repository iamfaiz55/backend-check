const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
    image: String,  // Define as a single string
    mainHeading: String,
    paragraph: String
}, {
    timestamps: true
});

const Carousel = mongoose.model('Carousel', carouselSchema);

module.exports = Carousel;