const router = require("express").Router()
const authController = require("./../controllers/admin.auth.controller")

router
    .post("/register-admin", authController.registerAdmin)
    .post("/login-admin", authController.loginAdmin)
    .post("/verify-otp-admin", authController.verifyOTP)
    .post("/logout-admin", authController.logoutAdmin)
    
    .post("/login-socket", authController.loginSocket)

module.exports = router