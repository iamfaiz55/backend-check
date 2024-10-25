const multer = require("multer");
const path = require("path");

const postStorage = multer.diskStorage({
    filename: (req, file, cb) => {
        const fn = Date.now() + path.extname(file.originalname);
        cb(null, fn);
    },
});

const upload2 = multer({ storage: postStorage }).fields([
    { name: 'menuImage', maxCount: 1 }, 
    { name: 'children[0].image', maxCount: 1 },
    { name: 'children[1].image', maxCount: 1 },
    { name: 'children[2].image', maxCount: 1 },
]);

module.exports = upload2;
