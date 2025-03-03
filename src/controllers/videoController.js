const VideoService = require("../services/videoService");

const cutVideoHLS = async (req, res) => {
  try {
    const { fileName, resolutions } = req.body;
    const result = await VideoService.cutVideoHLS(fileName, resolutions);
    res.json(result);
  } catch (error) {
    console.error("❌ Lỗi khi cắt video:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const cutTrailerHLS = async (req, res) => {
  try {
    const { fileName } = req.body;
    const result = await VideoService.cutTrailerHLS(fileName);
    res.json(result);
  } catch (error) {
    console.error("❌ Lỗi khi cắt trailer:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { cutVideoHLS, cutTrailerHLS };
