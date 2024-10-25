const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
      name:{ type:String,required:true},
      varient:[
                { 
                  price:{
                        type:Number
                  },
                  desc:{
                        type:String
                  },
                  mrp:{
                        type:Number
                  },
                  height:{
                        type:String
                  },
                  width:{
                        type:String
                  },
                  prductWeight :{
                        type:String
                  },
                  quantity:{
                        type:Number
                  },
                  prevPrice:{
                        type:Number
                  }
         }
      ],
      images: { type: [String], required: true },
      // discount:{type:String,required:true},
      material:{type:String,enum:["gold", "diamond", "bronz", "white-gold", "rose-gold", "platinum"],required:true},
      productType:{
         type:String,
         enum:["rings", "earings", "necklace", "mangalsutra", "chain", "pendent", "nose-pin", "bangles","forehead-ornament","anklet","coins" ],
         required:true
      },
      mainDesc:{type:String,},
      purity:{type:String},
      rating:{type:Number, default:5},
      isDelete:{
            type:Boolean,
            default: false
      },
       productDetails: {
            type:String
      }, 
      specification: {
            type:String
      }, 
      freeShippingpolicy: {
            type:String
      }, 
      ratingReviews: {
            type:String
      }, 
}, {timestamps:true})

module.exports = mongoose.model("product", productSchema)