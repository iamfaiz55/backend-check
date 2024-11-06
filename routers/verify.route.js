const router = require("express").Router()
const asyncHandler = require("express-async-handler")

router.post("/mobile-verify",asyncHandler(async(req, res)=> {
    const {email, isVerify}= req.body
    
}) )