const router = require("express").Router()
const authController = require("./../controllers/admin.auth.controller")

router
    .post("/register-admin", authController.registerAdmin)
    .post("/login-admin", authController.loginAdmin)
    .post("/verify-otp-admin", authController.verifyOTP)
    .post("/logout-admin", authController.logoutAdmin)
   .post("/mobile-login-response", authController.mobileLoginResponse)

    .post("/login-socket", authController.loginSocket)
    .post("/create-token", authController.createTokenForNotification)

module.exports = router