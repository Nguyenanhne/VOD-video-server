const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const uploadController = require("../controllers/uploadController");

const UPLOAD_VIDEO_DIR = path.join(__dirname, "..", "videos");
const UPLOAD_TRAILER_DIR = path.join(__dirname, "..", "trailers");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    if (req.path.includes("upload-trailer")) {
      uploadPath = UPLOAD_TRAILER_DIR;
    } else {
      uploadPath = UPLOAD_VIDEO_DIR;
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

// Route upload Trailer
router.post("/upload-trailer-to-server",upload.single("file"), uploadController.uploadTrailerServer);
router.delete("/clear-upload-trailer", uploadController.clearUploadTrailer);
router.post("/upload-video-to-server",upload.single("file"), uploadController.uploadVideoServer);
router.delete("/clear-upload-video", uploadController.clearUploadVideo);
// Route upload Video
// router.post("/upload-video-to-server", (req, res, next) => {
//   const { chunkIndex } = req.body;
//   console.log(chunkIndex);
//   if (parseInt(chunkIndex) === 0) {
//     console.log("tiến hành xóa file cũ")
//     clearDirectory(UPLOAD_VIDEO_DIR)
//   }
//   next();
// }, upload.single("file"), (req, res) => {
//   const { fileName, chunkIndex, totalChunks } = req.body;

  // Nếu đây là chunk cuối, ghép lại file
//   if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
//     mergeChunks(fileName, totalChunks, UPLOAD_VIDEO_DIR);
//   }

//   res.status(200).json({ message: `Chunk ${chunkIndex} uploaded!` });
// });


module.exports = router;
