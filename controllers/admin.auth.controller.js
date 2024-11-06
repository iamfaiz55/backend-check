const asyncHandler = require("express-async-handler")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const crypto= require("crypto")

const { checkEmpty } = require("../utils/checkEmpty")
const Admin = require("../models/Admin")
const sendEmail = require("../utils/email")
const AdminSocketId = require("../models/AdminSocketId")







exports.registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password , mobile} = req.body
    const { isError, error } = checkEmpty({ name, email, password, mobile })
    if (isError) {
        return res.status(400).json({ message: "All Feilds Required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email" })
    }
    const isFound = await Admin.findOne({ email })
    if (isFound) {
        return res.status(400).json({ message: "email already registered with us" })
    }
    const hash = await bcrypt.hash(password, 10)
    await Admin.create({ name, email, password: hash , mobile})

    res.json({ message: "Register Success" })
})

exports.loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { isError, error } = checkEmpty({ email, password });
    if (isError) {
        return res.status(401).json({ message: "All Fields required", error });
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Email" });
    }
    const result = await Admin.findOne({ email });

    if (!result) {
        return res.status(401).json({ message: "Invalid Email" });
    }
    const isVerify = await bcrypt.compare(password, result.password);

    if (!isVerify) {
        return res.status(401).json({ message: "Invalid Password" });
    }

    // Generate a 4-digit OTP
    const otp = crypto.randomInt(1000, 10000); 

    await Admin.findByIdAndUpdate(result._id, { otp });

    await sendEmail({
        to: email,
        subject: `Login OTP`,
        message: `
            <h1>Do Not Share Your Account OTP</h1>
            <p>Your login OTP is ${otp}</p>
        `
    });
    // Optionally send to mobile (you can add your SMS sending logic here)

    res.json({
        message: "Credentials Verify Success. OTP sent to your registered email.",
        result: {
            email
        }
    });
});


exports.verifyOTP = asyncHandler(async (req, res) => {
    const { otp, email } = req.body
    // console.log(otp, email);
    const { isError, error } = checkEmpty({ email, otp })
    if (isError) {
        return res.status(401).json({ message: "All Fields required", error })
    }
    if (!validator.isEmail(email)) {
        return res.status(401).json({ message: "Invalid Email" })
    }


    const result = await Admin.findOne({ email })
// console.log(result);

    if (!result) {
        return res.status(401).json({ message: "Invalid Credentials" })
    }

    if (otp != result.otp) {
        return res.status(401).json({ message: "Invalid OTP" })
    }
    const token = jwt.sign(
        { userId: result._id }, 
        process.env.JWT_KEY,
         { expiresIn: "1d" }
        )

    res.cookie("admin", token, {
        maxAge: 86400000,
        // maxAge: 60000,
        httpOnly: true,
        // sameSite: 'Lax', 
        secure: false,   

    });
 
    res.json({
        message: "OTP Verify Success.", result: {
            _id: result._id,
            name: result.name,
            email: result.email
        }
    })
})



exports.logoutAdmin = asyncHandler(async (req, res) => {
    res.clearCookie("admin")
    res.json({ message: "Admin Logout Success" })
})



exports.loginSocket = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
  
    const { isError, error } = checkEmpty({ email, password });
    if (isError) {
      return res.status(408).json({ message: "All fields are required", error });
    }
  
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid Email" });
    }
  
    // Verify password
    const isVerify = await bcrypt.compare(password, admin.password);
    if (!isVerify) {
      return res.status(401).json({ message: "Invalid Password" });
    }
  
    const adminSocketId = await AdminSocketId.find() 
if(adminSocketId){
    console.log("adminSocket Id from controller : ", adminSocketId );
}


    if (adminSocketId) {
      req.io.emit("mobileLoginConfirmation", { email });
      return res.json({
        message: "Waiting for mobile confirmation",
        result: { email },
      });
    }
  
    return res.status(401).json({ message: "Admin is not connected on mobile" });
  });
