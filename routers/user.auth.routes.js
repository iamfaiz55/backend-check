const router = require("express").Router()
const userAuthController = require("./../controllers/user.auth.controller")

router
    // .post("/register-user", userAuthController.registerUser)
    .post("/login-user", userAuthController.loginUser)
    .post("/verify-otp-user", userAuthController.verifyOTPUser)
    .post("/logout-user/:id", userAuthController.logoutUser)


module.exports = router