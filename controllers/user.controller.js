const asyncHandler = require("express-async-handler")
const { checkEmpty } = require("../utils/checkEmpty")
const Order = require("../models/Order")
const UserAddress = require("../models/UserAddress")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const User = require("../models/User")
const upload = require("../utils/upload")
const cloudinary = require("../utils/uploadCloud.config")
const Liked = require("../models/Liked")
const Categories = require("../models/Categories")
const Contact = require("../models/Contact")
require("dotenv").config({path:""})
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const sendEmail = require("../utils/email")
const PDFDocument = require('pdfkit-table');
// require('pdfkit-table');
const fs = require('fs');
const https = require('https');
// const crypto= require('crypto');
const path = require('path');
const mongoose= require("mongoose")
const CompanyAddress = require("../models/CompanyAddress")
const Tax = require("../models/Tax")
const Review = require("../models/Review")
const PaymentMethod = require("../models/PaymentMethod")
const History = require("../models/History")
const axios = require('axios');
// const { payment } = require("..")
// const Liked = require("../models/Liked")

// const Ordre = require("../models/Ordre")

exports.getOrders = asyncHandler(async(req, res)=> {
const {userId}=req.params
    const result = await Order.find({userId}).populate("orderItems.productId")
    // console.log(result, userId);
    
    res.json({message:"All Orders Fetch Success", result})
}) 

exports.createOrder = asyncHandler(async (req, res) => {

        const { deliveryAddressId, paymentMethod, orderItems, userId } = req.body;


        const {isError, error}= checkEmpty( { deliveryAddressId, paymentMethod, orderItems, userId })
       if (isError) {
            return res.status(400).json({ message: 'All fields Required.',error });
        }

        const productDetails = await getProductDetails(orderItems);
        console.log("product details ",productDetails);
        console.log("req.body",req.body);
        console.log("orderItems",orderItems);
        
        if (!productDetails || productDetails.length === 0) {
            return res.status(404).json({ message: 'Products not found.' });
        }

        const userData = await User.findById(userId);
        const deliveryAddressData = await UserAddress.findById(deliveryAddressId);
        const companyAddressData = await CompanyAddress.findOne();
        const taxes = await Tax.find();

        if (!userData || !deliveryAddressData || !companyAddressData) {
            return res.status(404).json({ message: 'User or address data not found.' });
        }

        const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
        const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
        const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;

        let subtotal = 0;
        let totalDiscountAmount = 0;
        let totalSalesTaxAmount = 0;
        let totalMakingChargesAmount = 0;

        const discountedProducts = productDetails.map(item => {
            const selectedVarient = item.product.varient.find(vari => vari._id == item.varientId )

            // console.log("selectedVarient", selectedVarient);
            // console.log("varientId",item.varientId);
            
            const originalPrice = selectedVarient.price;
            const discountAmount = (discount / 100) * originalPrice;
            const discountedPrice = originalPrice - discountAmount;

            const makingChargesAmount = (makingCharges / 100) * discountedPrice;
            const salesTaxAmount = (salesTax / 100) * discountedPrice;

            const totalPrice = discountedPrice * item.quantity;

            subtotal += totalPrice;
            totalDiscountAmount += discountAmount * item.quantity;
            totalSalesTaxAmount += salesTaxAmount * item.quantity;
            totalMakingChargesAmount += makingChargesAmount * item.quantity;

            return {
                ...item,
                varient:selectedVarient,
                discountedPrice,
                makingChargesAmount,
                salesTaxAmount,
                totalPrice
            };
        });

        const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100);

        const orderItemsFormatted = orderItems.map(item => ({
            productId: item._id,
            quantity: item.quantity || 1,
            varientId: item.varientId
        }));

        const newOrder = await Order.create({
            userId,
            deliveryAddressId,
            paymentMethod,
            orderItems: orderItemsFormatted,
            total,
            razorpay_payment_id: req.body.razorpay_payment_id,
            razorpay_order_id: req.body.razorpay_order_id
        });

        for (const item of discountedProducts) {
            const product = await Product.findById(item.product._id);
            const variant = product.varient.id(item.varient._id); 
        
            if (variant) {
                variant.quantity -= item.quantity; 
                if (variant.quantity < 0) {
                    variant.quantity = 0; 
                }
        
                await product.save(); 
            }
        }
        
        const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
        const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${uuid()}.pdf`);
        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(fs.createWriteStream(pdfPath));
        doc.registerFont('NotoSans', notoSansFontPath);

        doc.font('NotoSans');
        doc.fontSize(20).text('Order Invoice', { align: 'center' });
        doc.moveDown(1.5);

        const startY = doc.y;
        const columnWidth = 180;
        const gap = 20;

        const companyAddressX = 50;
        doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y);
        doc.text(`${companyAddressData.city}`, companyAddressX, doc.y);
        doc.text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y);
        doc.text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y);

        const deliveryAddressX = companyAddressX + columnWidth + gap;
        doc.fontSize(12).text('Shipping Address:', deliveryAddressX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`${userData.name}`, deliveryAddressX, doc.y);
        doc.text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y);
        doc.text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y);
        doc.text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y);

        const orderInfoX = deliveryAddressX + columnWidth + gap;
        doc.fontSize(12).text('Order Information:', orderInfoX, startY, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Order Tracking ID: ${newOrder.razorpay_order_id}`, orderInfoX, doc.y);
        doc.text(`Payment ID: ${newOrder.razorpay_payment_id}`, orderInfoX, doc.y);
        doc.text(`Payment Method: ${newOrder.paymentMethod}`, orderInfoX, doc.y);
        doc.text(`Order Date: ${newOrder.createdAt.toDateString()}`, orderInfoX, doc.y);

        doc.moveDown(2);
        doc.text('', 50, doc.y);

        doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
        doc.moveDown(0.5);

        const tableData = {
            headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
            rows: discountedProducts.map(item => [
                item.product.name,
                item.varient.desc,
                item.product.material,
                `${item.varient.height} x ${item.varient.width}`,
                item.product.productWeight,
                item.product.purity,
                item.quantity,
                item.varient.price,
                item.discountedPrice,
                item.totalPrice
            ])
        };

        doc.table(tableData, {
            prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
            prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
        });

        doc.moveDown(1.5);

        doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${(subtotal ).toFixed(2)}`, { align: 'right' });
        // doc.text(`Discount (${discount}%): -₹${totalDiscountAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Making Charges (${makingCharges}%): ₹${totalMakingChargesAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Sales Tax (${salesTax}%): ₹${totalSalesTaxAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`Total Items: ${orderItems.length}`, { align: 'right' });
        doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
        doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });

        doc.end();

        // Send email with PDF attachment
        doc.on('end', async () => {
            try {
                const emailSent = await sendEmail({
                    to: userData.email,
                    subject: 'Your Order Receipt',
                    message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
                    attachments: [
                        {
                            filename: path.basename(pdfPath),
                            path: pdfPath
                        }
                    ]
                });

                if (emailSent) {
                    console.log('Email sent successfully.');
                } else {
                    console.log('Failed to send email.');
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });

        res.json({ message: "Order created successfully, payment verified, and receipt sent to email." });
   
});


exports.addAddress = asyncHandler(async (req, res) => {
    const {
        email,
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        userId,
        houseNo
    } = req.body;

    const { isError, error } = checkEmpty({
        pincode,
        city,
        state,
        country,
        addressType,
        mobile,
        userId,
        houseNo
    });

    if (isError) {
        return res.status(400).json({ message: "All Fields Required" , error});
    }

    let user = await User.findById(userId);
// console.log(user);

    if (!user) {
        return res.status(505).json({message:"user not found"})
    }

if(!user.email){
   const updated= await User.findByIdAndUpdate(userId, {email})
   console.log("updated", updated);
   
}
    await UserAddress.create({
        city,
        state,
        pincode,
        country,
        addressType,
        mobile,
        houseNo,
        userId: user._id
    });

    res.json({ message: "Address Created Successfully" });
});


exports.getAddresses = asyncHandler(async(req, res)=> {
    const {id} = req.params
    const result = await UserAddress.find({userId:id})
    // if(!result){
    //     return res.json({message : "No Address"})
    // }
    // console.log(result, id);
    
    res.json({message:"All Addresses Fetch Success", result})
})

exports.deleteAddress = asyncHandler(async(req, res)=> {
    const {addressId}=req.params
    await UserAddress.findByIdAndDelete(addressId)
    res.json({message:"Address Delete Success"})
})
exports.getDetails = asyncHandler(async(req, res)=>{
    const {pId}= req.params
    const result = await Product.findOne({_id:pId})
    res.json({message:"Details Fetch Success", result})
})




exports.addCart = asyncHandler(async (req, res) => {
    const { pId, uId, varientId } = req.body;
// console.log(req.body);

    let result = await Cart.findOne({ userId: uId, productId: pId, varientId });

    if (result) {
       await Cart.findByIdAndUpdate(
            result._id,
            { $inc: { quantity: 1 } }
        );
    } else {
       await Cart.create({userId:uId, productId:pId, quantity:1, varientId})
    }

    res.json({ message: 'Cart Add successfully' });
});
exports.like = asyncHandler(async (req, res) => {
    const { pId, uId , varientId} = req.body;
// console.log(req.body);

    let result = await Liked.findOne({ userId: uId, productId: pId });

    if (result) {
     return res.status(400).json({message:" This Product is AlReady In Liked "})
    } else {
       await Liked.create({userId:uId, productId:pId, varientId})
    }

    res.json({ message: 'Liked successfully' });
});
exports.deleteLiked = asyncHandler(async (req, res) => {
    const {id} = req.params;
// console.log(req.body);

  await Liked.findByIdAndDelete(id)

    res.json({ message: 'product Deleted From Liked  ' });
});
exports.getAllLiked = asyncHandler(async (req, res) => {
    const { uid } = req.params;
    console.log(uid);
    
    const result = await Liked.find({ userId: uid }).populate("productId")
    // console.log();
    
    res.json({ message: 'Liked Items Get Success', result });
});





exports.getAllCartItems = asyncHandler(async (req, res) => {
    const { uid } = req.params;
    const result = await Cart.find({ userId: uid }).populate("productId")
    
    res.json({ message: 'Cart Items Get Success', result });
});


 
exports.deleteItemFromCart = asyncHandler(async(req, res)=> {
    const {id}=req.params
    await Cart.findByIdAndDelete(id)
    res.json({message:"Cart Iterm Delete Success"})
})


exports.deleteAllCart = asyncHandler(async(req, res)=> {
    const {userId}= req.body
     await Cart.deleteMany({ userId} );


    res.status(200).json({ message: "All cart items deleted successfully" });
})
exports.getAllProduct = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;  
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;  

    // Assuming you are receiving filter type as a query parameter
    const filterType = req.query.type; // Adjust as per your frontend filter parameters

    let query = {};
    if (filterType) {
        query.type = filterType; // Adjust your query filter conditions
    }

    const result = await Product.find(query).skip(skip).limit(limit);

    const totalProducts = await Product.countDocuments(query); // Use the same filter for counting
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
        message: "All Products Fetch Success",
        result,
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
        }
    });
});

exports.cancelOrder = asyncHandler(async(req, res)=> {
    const {id}= req.params
    await Order.findByIdAndUpdate(id, {status:"cancelled"})
    res.json({message:"Order Cancel Success"})
})

exports.getFilteredProducts = asyncHandler(async (req, res) => {
    const { productType } = req.query;

 
console.log("product type",productType);

const result = await Categories.find()
//    console.log(result);
const types = result.map(item => {
    return item.category
})
console.log("types",types);

    //   console.log(types);
        if (!types.includes(productType)) {
        return res.status(400).json({ message: "Invalid product type" });
    }
   
        const products = await Product.find({ productType });

        res.status(200).json({message:"filter Success", result:products});
 
});



exports.updateProfile = asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading file' });
        }
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
            if (user.image) {
                const existing = user.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(existing);
            }  
        const {secure_url} = await cloudinary.uploader.upload(req.files[0].path);
        // console.log(req.body.userId);
        const updated = await User.findByIdAndUpdate(req.body.userId, {image:secure_url})
        const x = await User.findById(updated._id)
        
    //    console.log(updated);
       
        res.json({ message: "Profile image upload successfully", result:x });
    });
});

exports.updateProfileData = asyncHandler(async (req, res) => {
    const {id}=req.params
    const result = await User.findByIdAndUpdate(id, req.body)
    const x = await User.findById(id)
    res.json({messaege:"User Update Success", result:x})
});
exports.getProfile = asyncHandler(async(req, res)=> {
   const {id}=req.params
   const result = await User.findById(id)
   res.json({message:"User Get Success", result})
})
exports.getAllCategory = asyncHandler(async(req, res)=> {
    //   const {cId}= req.params  
      const result = await Categories.find()
      res.json({message:"Categories Get Success", result })
    })



exports.contact = asyncHandler(async(req, res)=> {
    const {name, email, subject, message} = req.body
    const {isError, error}= checkEmpty({name, email, subject, message})
    
    if(isError){
        return res.status(400).json({message :"All Fields Required"})
    }
    await Contact.create({name, email, message, subject})

    res.json({message:"Message Sent Success"})
})

exports.getContacts = asyncHandler(async(req, res)=> {
    // const {name, email, subject, message} = req.body
  
    const result = await Contact.find()

    res.json({message:"Messages Get Success", result})
})

const razorpay = new Razorpay({
    key_id:"rzp_test_8g7frJOzzN5wml",
    key_secret:"TmMcFsowpC7bQCKy5wedym1W"
})
exports.razorpay = asyncHandler(async (req, res) => {

       if(!req.body){
           return res.status(400).json({message:"body me nhi aaya"})
        }
    const options = {amount:req.body.subtotal *100, receipt:req.body.receipt, currency:req.body.currency}
    // console.log(req.body.subtotal);
    
    const order = await razorpay.orders.create(options)
    res.json({message:"initiate ", result:order})
});


const getProductDetails = async (orderItems) => {
   
    
    const productDetails = await Promise.all(orderItems.map(async (item) => {
      try {
        const product = await Product.findById(new mongoose.Types.ObjectId(item._id));
        if (!product) {
          console.error(`Product not found for productId: ${item._id}`);
          return null;
        }
        return {
          ...item,
          product
        };
      } catch (error) {
        console.error(`Error fetching product for productId: ${item._id}`, error);
        return null;
      }
    }));
  
    return productDetails.filter(detail => detail !== null); 
  };



exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, deliveryAddressId, paymentMethod, orderItems, userId } = req.body;
// console.log("orderItems", orderItems);

    const productDetails = await getProductDetails(orderItems);
    const userData = await User.findById(userId);
    const deliveryAddressData = await UserAddress.findById(deliveryAddressId);
    const companyAddressData = await CompanyAddress.findOne();
    const taxes = await Tax.find();

    const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
    const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
    const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;

    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalSalesTaxAmount = 0;
    let totalMakingChargesAmount = 0;

        // console.log("product details",productDetails);
    
    const discountedProducts = productDetails.map(item => {
        const selectedVarient = item.product.varient.find(vari => vari._id == item.varientId )
        // console.log("selected varient ",selectedVarient);
        // console.log("varientId ",item.varientId);
        
        const originalPrice = selectedVarient.price;
        const discountAmount = (discount / 100) * originalPrice;
        const discountedPrice = originalPrice - discountAmount;

        const makingChargesAmount = (makingCharges / 100) * discountedPrice;
        const salesTaxAmount = (salesTax / 100) * discountedPrice;

        subtotal += discountedPrice * item.quantity;
        totalDiscountAmount += discountAmount * item.quantity;
        totalSalesTaxAmount += salesTaxAmount * item.quantity;
        totalMakingChargesAmount += makingChargesAmount * item.quantity;


        return {
            ...item,
            varient: selectedVarient,
            discountedPrice,
            makingChargesAmount,
            salesTaxAmount,
        };
    });
    // console.log("discounted product",discountedProducts);
    

    const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100); 
// console.log(total);

    const OrderItems2 = orderItems.map(item => ({
        productId: item._id,
        quantity: item.quantity || 1,
        varientId: item.varientId
    }));
// console.log(orderItems);

    const newOrder = await Order.create({
        userId,
        deliveryAddressId,
        paymentMethod,
        orderItems: OrderItems2,
        total,
        razorpay_payment_id,
        razorpay_order_id,
    });

    await razorpay.orders.create({
        amount: total,
        currency: "INR",
        receipt: uuid(),
    });
// console.log("OrderItems2",OrderItems2);
// console.log("product Details ",productDetails);
// console.log("Discounted POroduct",discountedProducts);

 
   for (const item of discountedProducts) {
    const product = await Product.findById(item.product._id);
    const variant = product.varient.id(item.varient._id); 

    if (variant) {
        variant.quantity -= item.quantity; 
        if (variant.quantity < 0) {
            variant.quantity = 0; 
        }

        await product.save(); 
    }
}

    // const updateProductQuantity = await Product

    const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
    const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${uuid()}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(pdfPath));
    doc.registerFont('NotoSans', notoSansFontPath);

    doc.font('NotoSans');
    doc.fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown(1.5);

    const startY = doc.y;
    const columnWidth = 180;
    const gap = 20;

    const companyAddressX = 50;
    doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y);
    doc.text(`${companyAddressData.city}`, companyAddressX, doc.y);
    doc.text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y);
    doc.text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y);

    const deliveryAddressX = companyAddressX + columnWidth + gap;
    doc.fontSize(12).text('Shipping Address:', deliveryAddressX, startY, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`${userData.name}`, deliveryAddressX, doc.y);
    doc.text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y);
    doc.text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y);
    doc.text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y);

    const orderInfoX = deliveryAddressX + columnWidth + gap;
    doc.fontSize(12).text('Order Information:', orderInfoX, startY, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Order Tracking ID: ${newOrder.razorpay_order_id}`, orderInfoX, doc.y);
    doc.text(`Payment ID: ${newOrder.razorpay_payment_id}`, orderInfoX, doc.y);
    doc.text(`Payment Method: ${newOrder.paymentMethod}`, orderInfoX, doc.y);
    doc.text(`Order Date: ${newOrder.createdAt.toDateString()}`, orderInfoX, doc.y);

    doc.moveDown(2);
    doc.text('', 50, doc.y);

    doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
    doc.moveDown(0.5);

    const tableData = {
        headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
        rows: discountedProducts.map(item => {
            return [
                item.product.name,
                item.varient.desc,
                item.product.material,
                `${item.varient.height} x ${item.varient.width}`,
                item.varient.prductWeight,
                item.product.purity,
                item.quantity,
                item.varient.price,
                item.discountedPrice,
                item.discountedPrice * item.quantity,
            ];
        }),
    };

    doc.table(tableData, {
        prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
        prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
    });

    doc.moveDown(1.5);

    doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${(subtotal ).toFixed(2)}`, { align: 'right' });
    // doc.text(`Discount (${discount}%): -₹${(totalDiscountAmount ).toFixed(2)}`, { align: 'right' });
    doc.text(`Making Charges (${makingCharges}%): ₹${(totalMakingChargesAmount).toFixed(2)}`, { align: 'right' });
    doc.text(`Sales Tax (${salesTax}%): ₹${(totalSalesTaxAmount ).toFixed(2)}`, { align: 'right' });
    doc.text(`Total Items: ${orderItems.length}`, { align: 'right' });
    doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
    doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });

    doc.end();

    doc.on('end', async () => {
        const emailSent = await sendEmail({
            to: userData.email,
            subject: 'Your Order Receipt',
            message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
            attachments: [
                {
                    filename: path.basename(pdfPath),
                    path: pdfPath,
                },
            ],
        });

        if (emailSent) {
            console.log('Email sent successfully.');
        } else {
            console.log('Failed to send email.');
        }
    });

    res.json({ message: "Payment verified, order successful, and receipt sent on email." });
});

exports.postReview = asyncHandler(async(req, res)=>{
    const {rating, review, pId, uId} = req.body
    await Review.create({rating, review, pId, uId})
    res.json({message:"Review Create Success"})
})

exports.getReviews = asyncHandler(async(req, res)=>{
    const {id} = req.params
    const result = await Review.find({pId:id}).populate("uId")
    res.json({message:"All Reviews Fetch Success", result})
})

exports.getPaymentMethodsUser = asyncHandler(async(req, res)=> {
    const result = await PaymentMethod.find()
    res.json({message:"all Payment Methods Get Success ", result})
})
exports.getCompanyDetails = asyncHandler(async(req, res)=> {
    const result = await CompanyAddress.findOne()
    res.json({message:"Company Details Fetch Success", result})

})

exports.addHistory = asyncHandler(async(req, res)=> {
    const {userId, type, productId, cartId, ordersId}=req.body
    const {isError, error}= checkEmpty({userId, type})
    if(isError){
        return res.status(410).json({message:"all fields required", error})
    }
    const device = req.useragent.isMobile || req.useragent.isTablet ? "mobile" : "computer";
    console.log(device);
    
  await History.create({...req.body,  device})
  res.json({message:"history create successs"})
})





exports.usePhonePe = asyncHandler(async (req, res) => {

    const { name, number, amount, transactionId, MUID } = req.body;
    const merchantTransactionId = transactionId;
// console.log("req.body",req.body );

    const data = {
        "merchantId":process.env.PHONEPE_MERCHANT_ID, 
        "merchantTransactionId": merchantTransactionId,
        "merchantUserId": MUID,
        "amount": amount * 100,  
        // "redirectUrl": `http://localhost:5000/api/user/status/${merchantTransactionId}`,
        "redirectMode": "POST",
        "mobileNumber": number, 
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    };

 
    const payload = Buffer.from(JSON.stringify(data)).toString('base64');

    const saltKey = process.env.PHONEPE_SALT_KEY;  
    const saltIndex = 1;  

    const string = payload +  "/pg/v1/pay" + saltKey;

    // console.log("String to hash for checksum:", string);

    const sha256Hash = crypto.createHash('sha256').update(string).digest('hex');

    const checkSum = sha256Hash + '###' + saltIndex;
// 	SHA256(base64 encoded payload + “/pg/v1/pay” +salt key) + ### + salt index
    console.log("Generated Checksum:", checkSum);

    console.log("Base64 Payload:", payload);

    const options = {
        method: 'post',
        url: 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checkSum 
        },
        data: { 
            request: payload 
        }

    };


    const response = await axios.request(options);

    try {
        console.log("Payment Response:", response.data);

        res.json({ message: "done", result: response.data.data.instrumentResponse.redirectInfo.url });
    } catch (error) {
        console.log("Payment error:", error.message);
        res.status(500).json({ message: "Error processing payment", error: error.message });
    }
})


exports.initiatePhonePe = asyncHandler(async(req, res)=> {
    const {id}= req.params
     console.log("initiate status id", id);
      const merchantTransactionId =id

    const saltKey = process.env.PHONEPE_SALT_KEY;  
    const saltIndex = 1;  

    const string =  `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}` + saltKey;


    const sha256Hash = crypto.createHash('sha256').update(string).digest('hex');  
    const checkSum = sha256Hash + '###' + saltIndex;

    console.log("checksum:", checkSum);

    console.log("payload:", payload);

    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',  
            'Content-Type': 'application/json',
            'X-VERIFY': checkSum ,
            'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID ,
        } 
    };

    


    const result = await axios.request(options)
     if(result.data.success  == true){
        return res.json({message:"paument Success"})
     }else{
        return res.status(505).json({message:"payment Failed"})
     }
     
})
