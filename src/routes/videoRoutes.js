// module.exports = router;
const express = require("express");
const VideoController = require("../controllers/videoController");

const router = express.Router();

router.post("/cut-video-hls", VideoController.cutVideoHLS);
router.post("/cut-trailer-hls", VideoController.cutTrailerHLS);

module.exports = router;