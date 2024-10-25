const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.userProtected = async (req, res, next) => {
    const { user } = req.cookies;
    if (!user) {
        return res.status(409).json({ message: "Session Expired Re Login Please" });
    }

    jwt.verify(user, process.env.JWT_KEY, async (err, decode) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ message: "JWT Error", error: err.message });
        }


            const loggedInUser = await User.findById(decode.userId);

            if (!loggedInUser) {
                return res.status(405).json({ message: "User not found" });
            }

            if (loggedInUser.isBlock) {
                return res.status(406).json({ message: "You are blocked From Admin" });
            }

            req.loggedInUser = loggedInUser._id;
            next();
  
    });
};
