const asyncHandler = require("express-async-handler");
const cron = require("node-cron");
const Product = require("../../models/Product");
const CronSchedule = require("../../models/CronSchedule");


exports.addSchedule = asyncHandler(async (req, res) => {
    const { startDate, endDate, discounts, pId } = req.body;
 
    const cronData = await CronSchedule.create({pId, startTimeAndDate:startDate, endTimeAndDate:endDate})

// console.log("cron cretae success",cronData);

    const convertDateToCron = (date) => {
        const d = new Date(date);
        const minute = d.getMinutes();
        const hour = d.getHours();
        const dayOfmonth = d.getDate();
        const month = d.getMonth() + 1;

        return `${minute} ${hour} ${dayOfmonth} ${month} *`;
    };

    const cronStart = convertDateToCron(startDate)
    const cronend = convertDateToCron(endDate)

    const product = await Product.findById(pId);
    if (!product) {
        return res.status(405).json({ message: "Product not found" });
    }

    cron.schedule(cronStart, async () => {
        
        discounts.forEach(({ vId, discount }) => {
            const variant = product.varient.find(v => v._id == vId);
            if (variant) {
                variant.prevPrice = variant.price 
                variant.price = variant.price * (1 - discount / 100); 
            }
        });

        await product.save();
        console.log("Discounts applied success");
    });

    cron.schedule(cronend, async () => {
        product.varient.forEach(variant => {
            if (variant.prevPrice !== null) {
                variant.price = variant.prevPrice; 
                variant.prevPrice = null; 
            }
        });

        await product.save(); 
        const x = await CronSchedule.findOne({pId:product._id}) 

       if(x){
        console.log(x);
        
          await CronSchedule.findByIdAndDelete(x._id)
       }
        console.log("Og Price Set Successfuly", );
    });


     res.json({ message: "Schedule added success" });
});


exports.getSchedules= asyncHandler(async(req, res)=> {
    const result = await CronSchedule.find().populate("pId")
    res.json({message:"schedules fetch success", result})
})