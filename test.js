exports.usePhonePe = asyncHandler(async (req, res) => {

    const { name, number, amount, transactionId, MUID } = req.body;
    const merchantTransactionId = transactionId;
// console.log("req.body",req.body );

    const data = {
        "merchantId":process.env.PHONEPE_MERCHANT_ID, 
        "merchantTransactionId": merchantTransactionId,
        "merchantUserId": MUID,
        "amount": amount * 100,  
        "redirectUrl": `http://localhost:5000/api/user/status/${merchantTransactionId}`,
        "redirectMode": "POST",
        "mobileNumber": number, 
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    };

 
    const payload = Buffer.from(JSON.stringify(data)).toString('base64');

    const saltKey = process.env.PHONEPE_SALT_KEY;  
    const saltIndex = 1;  

    const apiEndpoint = "/pg/v1/pay";  
    const stringToHash = payload + apiEndpoint + saltKey;

    // console.log("String to hash for checksum:", stringToHash);

    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');

    const checkSum = sha256Hash + '###' + saltIndex;

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
        data:{
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

    const apiEndpoint = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}`;  
    const stringToHash =  apiEndpoint + saltKey;

    // console.log("String to hash for checksum:", stringToHash);

    const sha256Hash = crypto.createHash('sha256').update(stringToHash).digest('hex');  
    const checkSum = sha256Hash + '###' + saltIndex;

    console.log("Generated Checksum:", checkSum);

    console.log("Base64 Payload:", payload);

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

    // const { razorpay_order_id, razorpay_payment_id, deliveryAddressId, paymentMethod, orderItems, userId } = req.body;
    // console.log("orderItems", orderItems);
    
        // const productDetails = await getProductDetails(orderItems);
        // const userData = await User.findById(userId);
        // const deliveryAddressData = await UserAddress.findById(deliveryAddressId);
        // const companyAddressData = await CompanyAddress.findOne();
        // const taxes = await Tax.find();
    
        // const salesTax = taxes.find(tax => tax.taxName === "Sales Tax")?.percent || 0;
        // const makingCharges = taxes.find(tax => tax.taxName === "Making Charges")?.percent || 0;
        // const discount = taxes.find(tax => tax.taxName === "Discount")?.percent || 0;
    
        // let subtotal = 0;
        // let totalDiscountAmount = 0;
        // let totalSalesTaxAmount = 0;
        // let totalMakingChargesAmount = 0;
    
            // console.log("product details",productDetails);
        
        // const discountedProducts = productDetails.map(item => {
        //     const selectedVarient = item.product.varient.find(vari => vari._id == item.varientId )
        //     // console.log("selected varient ",selectedVarient);
        //     // console.log("varientId ",item.varientId);
            
        //     const originalPrice = selectedVarient.price;
        //     const discountAmount = (discount / 100) * originalPrice;
        //     const discountedPrice = originalPrice - discountAmount;
    
        //     const makingChargesAmount = (makingCharges / 100) * discountedPrice;
        //     const salesTaxAmount = (salesTax / 100) * discountedPrice;
    
        //     subtotal += discountedPrice * item.quantity;
        //     totalDiscountAmount += discountAmount * item.quantity;
        //     totalSalesTaxAmount += salesTaxAmount * item.quantity;
        //     totalMakingChargesAmount += makingChargesAmount * item.quantity;
    
    
        //     return {
        //         ...item,
        //         varient: selectedVarient,
        //         discountedPrice,
        //         makingChargesAmount,
        //         salesTaxAmount,
        //     };
        // });
        // console.log("discounted product",discountedProducts);
        
    
        // const total = Math.round((subtotal + totalMakingChargesAmount + totalSalesTaxAmount) * 100); 
    // console.log(total);
    
    //    const OrderItems2 = orderItems.map(item => ({
    //         productId: item._id,
    //         quantity: item.quantity || 1,
    //         varientId: item.varientId
    //     })); 
    // console.log(orderItems);
    
        // const newOrder = await Order.create({
        //     userId,
        //     deliveryAddressId,
        //     paymentMethod,
        //     orderItems: OrderItems2,
        //     total,
        //     razorpay_payment_id,
        //     razorpay_order_id,
        // });
    

        // for decrease quantity

        // for (const item of discountedProducts) {
        //     const product = await Product.findById(item.product._id);
        //     const variant = product.varient.id(item.varient._id); 
        
        //     if (variant) {
        //         variant.quantity -= item.quantity; 
        //         if (variant.quantity < 0) {
        //             variant.quantity = 0; 
        //         }
        
        //         await product.save(); 
        //     }
        // }
        


        // const notoSansFontPath = path.join(__dirname, '..', 'font', 'font.ttf');
        // const pdfPath = path.join(__dirname, '../pdfs', `OrderDetails-${uuid()}.pdf`);
        // const doc = new PDFDocument({ margin: 50 });
    
        // doc.pipe(fs.createWriteStream(pdfPath));
        // doc.registerFont('NotoSans', notoSansFontPath);
    
        // doc.font('NotoSans');
        // doc.fontSize(20).text('Order Invoice', { align: 'center' });
        // doc.moveDown(1.5);
    
        // const startY = doc.y;
        // const columnWidth = 180;
        // const gap = 20;
    
        // const companyAddressX = 50;
        // doc.fontSize(12).text('Billing Address:', companyAddressX, startY, { underline: true });
        // doc.moveDown(0.5);
        // doc.fontSize(10).text(`${companyAddressData.buildingNo}`, companyAddressX, doc.y);
        // doc.text(`${companyAddressData.city}`, companyAddressX, doc.y);
        // doc.text(`${companyAddressData.state}, ${companyAddressData.country}, ${companyAddressData.pincode}`, companyAddressX, doc.y);
        // doc.text(`GST No: ${companyAddressData.gst}`, companyAddressX, doc.y);
    
        // const deliveryAddressX = companyAddressX + columnWidth + gap;
        // doc.fontSize(12).text('Shipping Address:', deliveryAddressX, startY, { underline: true });
        // doc.moveDown(0.5);
        // doc.fontSize(10).text(`${userData.name}`, deliveryAddressX, doc.y);
        // doc.text(`${deliveryAddressData.addressType}, ${deliveryAddressData.city}`, deliveryAddressX, doc.y);
        // doc.text(`${deliveryAddressData.state}, ${deliveryAddressData.country}, ${deliveryAddressData.pincode}`, deliveryAddressX, doc.y);
        // doc.text(`Mobile: ${deliveryAddressData.mobile}`, deliveryAddressX, doc.y);
    
        // const orderInfoX = deliveryAddressX + columnWidth + gap;
        // doc.fontSize(12).text('Order Information:', orderInfoX, startY, { underline: true });
        // doc.moveDown(0.5);
        // doc.fontSize(10).text(`Order Tracking ID: ${newOrder.razorpay_order_id}`, orderInfoX, doc.y);
        // doc.text(`Payment ID: ${newOrder.razorpay_payment_id}`, orderInfoX, doc.y);
        // doc.text(`Payment Method: ${newOrder.paymentMethod}`, orderInfoX, doc.y);
        // doc.text(`Order Date: ${newOrder.createdAt.toDateString()}`, orderInfoX, doc.y);
    
        // doc.moveDown(2);
        // doc.text('', 50, doc.y);
    
        // doc.fontSize(14).text('Product Details:', { align: 'left', underline: true });
        // doc.moveDown(0.5);
    
        // const tableData = {
        //     headers: ['Name', 'Title', 'Material', 'Size', 'Weight', 'Purity', 'Qty', 'Price', 'Discounted Price', 'Total'],
        //     rows: discountedProducts.map(item => {
        //         return [
        //             item.product.name,
        //             item.varient.desc,
        //             item.product.material,
        //             `${item.varient.height} x ${item.varient.width}`,
        //             item.varient.prductWeight,
        //             item.product.purity,
        //             item.quantity,
        //             item.varient.price,
        //             item.discountedPrice,
        //             item.discountedPrice * item.quantity,
        //         ];
        //     }),
        // };
    
        // doc.table(tableData, {
        //     prepareHeader: () => doc.fontSize(10).font('Helvetica-Bold').fillColor('black'),
        //     prepareRow: (row, i) => doc.fontSize(10).font('Helvetica').fillColor(i % 2 === 0 ? 'black' : 'gray'),
        // });
    
        // doc.moveDown(1.5);
    
        // doc.fontSize(12).font('NotoSans').text(`Subtotal: ₹${(subtotal ).toFixed(2)}`, { align: 'right' });
        // // doc.text(`Discount (${discount}%): -₹${(totalDiscountAmount ).toFixed(2)}`, { align: 'right' });
        // doc.text(`Making Charges (${makingCharges}%): ₹${(totalMakingChargesAmount).toFixed(2)}`, { align: 'right' });
        // doc.text(`Sales Tax (${salesTax}%): ₹${(totalSalesTaxAmount ).toFixed(2)}`, { align: 'right' });
        // doc.text(`Total Items: ${orderItems.length}`, { align: 'right' });
        // doc.text(`Total Price: ₹${(total / 100).toFixed(2)}`, { align: 'right' });
        // doc.moveDown(2);
    
        // doc.fontSize(16).text('Thank you for shopping with us!', { align: 'center' });
        // doc.fontSize(14).text('We hope to see you again soon!', { align: 'center' });
    
        // doc.end();
    
        // doc.on('end', async () => {
        //     const emailSent = await sendEmail({
        //         to: userData.email,
        //         subject: 'Your Order Receipt',
        //         message: '<p>Thank you for your order. Please find the attached receipt for your records.</p>',
        //         attachments: [
        //             {
        //                 filename: path.basename(pdfPath),
        //                 path: pdfPath,
        //             },
        //         ],
        //     });
    
        //     if (emailSent) {
        //         console.log('Email sent successfully.');
        //     } else {
        //         console.log('Failed to send email.');
        //     }
        // });
    
        
        const result = await axios.request(options)
        if(result.data.success  == true){
            return  res.json({ message: "Payment verified, order successful, and receipt sent on email." });
        }else{
            return res.status(505).json({message:"payment Failed"})
        }
        
       
    })
