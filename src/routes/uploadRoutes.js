const express = require("express");
const {db} = require('../config/firebase');
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

router.post("/upload-trailer-to-server",upload.single("file"), uploadController.uploadTrailerServer);
router.delete("/clear-upload-trailer", uploadController.clearUploadTrailer);
router.post("/upload-video-to-server",upload.single("file"), uploadController.uploadVideoServer);
router.delete("/clear-upload-video", uploadController.clearUploadVideo);

router.post("/start-upload", async (req, res) => {
  
  // Cập nhật tiến trình upload
  await db.ref(`video_processing/video`).set({
      upload_progress: 0,
      status: "uploading",
  });

  // Mô phỏng upload (0 → 100%)
  let progress = 0;
  const interval = setInterval(async () => {
      progress += 10;
      await db.ref(`video_processing/video`).update({ upload_progress: progress });

      if (progress >= 100) {
          clearInterval(interval);
      }
  }, 2000);

  res.json({ message: "Upload started" });
});

// function processVideo() {
//   const resolutions = ["240p", "360p", "480p"];

//   resolutions.forEach(async (res, index) => {
//     // Cập nhật trạng thái resolution thành `in_progress`
//     await db.ref(`video_processing/video/resolutions/${res}`).set("waiting");
// });

//   resolutions.forEach(async (res, index) => {
//       // Cập nhật trạng thái resolution thành `in_progress`
//       await db.ref(`video_processing/video/resolutions/${res}`).set("in_progress");

//       setTimeout(async () => {
//           // Giả lập quá trình xử lý (FFmpeg thực tế mất vài giây đến vài phút)
//           console.log(`Processing ${res} for user ...`);

//           // Cập nhật Firebase khi hoàn tất resolution
//           await db.ref(`video_processing/video/resolutions/${res}`).set("completed");

//           // Nếu tất cả resolution đã xong, cập nhật status thành `completed`
//           if (res === "480p") {
//               await db.ref(`video_processing/video`).update({ status: "completed" });
//           }
//       }, (index + 1) * 10000); // Mô phỏng xử lý trong 5 giây mỗi resolution
//   });
// }

module.exports = router;
