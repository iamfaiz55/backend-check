const asyncHandler = require("express-async-handler")
const jwt = require("jsonwebtoken")
const { checkEmpty } = require("../utils/checkEmpty")
const User = require("../models/User");
const History = require("../models/History");
const mongoose  = require("mongoose");

exports.loginUser = asyncHandler(async (req, res) => {
    const { mobile } = req.body;

    const { isError, error } = checkEmpty({ mobile});
    if (isError) {
        return res.status(400).json({ message: "All Fields required", error });
    }
    let user = await User.findOne({ mobile });
    const otp = Math.floor(10000 + Math.random() * 900000)
    if (!user) {    
      
        //    send otp to userr

         await User.create({mobile, otp})
          return res.json({ message: "OTP sent for User registration", result:  mobile  });
    } else {
        //    send otp to userr
         await User.findByIdAndUpdate(user._id, {otp})

        return res.status(200).json({message: "OTP sent Success Fir Login" ,result:mobile });
    }
});

exports.verifyOTPUser = asyncHandler(async (req, res) => {
    const { otp, mobile } = req.body

    const { isError, error } = checkEmpty({ mobile, otp })
    if (isError) {
        return res.status(401).json({ message: "All Fields required", error })
    }
    const result = await User.findOne({mobile })
    if (!result) {
        return res.status(401).json({ message: "User Not Found" })
    }

    if (otp != result.otp) {
        return res.status(401).json({ message: "Invalid OTP" })
    }
    const token = jwt.sign({ userId: result._id }, process.env.JWT_KEY, { expiresIn: "1d" })

    res.cookie("user", token, {
        maxAge: 86400000,
        // maxAge: 60000,
        httpOnly: true,
    });
 
    // const currentDate = new Date().toLocaleDateString()  
    // const currentTime = new Date().toLocaleTimeString()  

    // let userHistory = await History.findOne({ userId: result._id });

    // if (!userHistory) {
    //     await History.create({
    //         userId: result._id,
    //         login: [{ date: currentDate, time: currentTime }]
    //     });
    // } else {
    //     await History.findByIdAndUpdate(
    //         userHistory._id,
    //         { $push: { login: { date: currentDate, time: currentTime } } },
    //     );
    // }

    res.json({ message: "OTP Verify Success.", result:{
        mobile:result.mobile,
        _id:result._id,
        name:result && result.name && result.name ,
        email:result && result.email && result.email ,
        image:result && result.image && result.image,

    }})
})





exports.logoutUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
    }

    res.clearCookie("user");

    // const date = new Date().toLocaleDateString();
    // const time = new Date().toLocaleTimeString();

    // let userHistory = await History.findOne({ userId: new mongoose.Types.ObjectId(id) });

    // if (userHistory && userHistory._id) {
    //     const newResult = await History.findByIdAndUpdate(userHistory._id, {
    //         $push: { logout: { date: date, time: time } }
    //     });

    //     console.log("new", newResult);
        res.json({ message: "User Logout Success" });
    // }
});
