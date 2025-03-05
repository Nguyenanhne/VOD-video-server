const fs = require("fs");
const path = require("path");
const {db} = require('../config/firebase');

const UploadService = require("../services/uploadService")
const R2Service = require("../services/r2Service")

const UPLOAD_VIDEO_DIR = path.join(__dirname, "..", "videos");
const SEGMENT_VIDEO_DIR = path.join(__dirname, "..", "videos_hls");
const UPLOAD_TRAILER_DIR = path.join(__dirname, "..", "trailers");
const SEGMENT_TRAILER_DIR = path.join(__dirname, "..", "trailers_hls");

const uploadTrailerServer = async (req, res) => {
  try {
    const { chunkIndex, fileName, totalChunks } = req.body;

    const chunkNumber = parseInt(chunkIndex) + 1;

    // Cập nhật tiến trình lên Firebase
    await db.ref(`video_processing/video`).set({
      upload_progress: Math.round((chunkNumber / totalChunks) * 100),
      status: "Đang upload video, vui lòng không tắt trình duyệt",
    });

    if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
      await db.ref(`video_processing/video`).update({ status: "merging" });

      console.log("🔗 Đang merge các chunk...");
      await UploadService.mergeChunks(fileName, totalChunks, UPLOAD_TRAILER_DIR);
      await db.ref(`video_processing/video`).update({ status: "Đã upload video xong" });
    }

    res.status(200).json({ message: `Chunk ${chunkIndex} !` });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý chunk:", error);
    await db.ref(`video_processing/video`).update({ status: "Lỗi khi merge file, thử lại!" });
    res.status(500).json({ error: "Lỗi khi xử lý chunk" });
  }
};
const uploadVideoServer = async (req, res) => {
  try {
    const { chunkIndex, fileName, totalChunks } = req.body;

    // Cập nhật tiến trình lên Firebase
    await db.ref(`video_processing/video`).set({
      upload_progress: Math.round((chunkNumber / totalChunks) * 100),
      status: "Đang upload video, vui lòng không tắt trình duyệt",
    });

    if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
      await db.ref(`video_processing/video`).update({ status: "merging" });
      console.log("🔗 Đang merge các chunk...");
      await UploadService.mergeChunks(fileName, totalChunks, UPLOAD_VIDEO_DIR);
      await db.ref(`video_processing/video`).update({ status: "Đã upload video xong" });
    }
    res.status(200).json({ message: `Chunk ${chunkIndex} uploaded!` });

  } catch (error) {
    console.error("❌ Lỗi khi xử lý chunk:", error);
    await db.ref(`video_processing/video`).update({ status: "Lỗi khi merge file, thử lại!" });
    res.status(500).json({ error: "Lỗi khi xử lý chunk" });  }
}; 
const uploadVideoHLS =   async (req, res) => {
    try {
        const { id } = req.body; // Lấy id từ request body

        if (!id) {
        return res.status(400).send("Thiếu ID trong request.");
        }

        // Kiểm tra thư mục có tồn tại không
        if (!fs.existsSync(SEGMENT_VIDEO_DIR)) {
        return res.status(400).send("Thư mục HLS không tồn tại.");
        }

        const hasFiles = await UploadService.containsFiles(SEGMENT_VIDEO_DIR);
        if (!hasFiles) {
        return res.status(400).send("Không có file nào để tải lên.");
        }

        // Đọc cấu trúc thư mục HLS và tải lên Cloudflare R2
        await UploadService.uploadHlsFolder(SEGMENT_VIDEO_DIR, `video/${id}`); // Upload thư mục HLS với ID
        
        await UploadService.emptyDirectory(SEGMENT_VIDEO_DIR); // Làm rỗng thư mục sau khi upload xong

        res.status(200).send({ message: "Tất cả tệp đã được tải lên thành công!", id });
    } catch (err) {
        console.error("Error during upload:", err);
        res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
    }
}
// const uploadTrailerHLS =  async (req, res) => {
//     try {
//       const { id } = req.body; // Lấy id từ request body
  
//       if (!id) {
//         return res.status(400).send("Thiếu ID trong request.");
//       }
//       // Kiểm tra thư mục có tồn tại không
//       if (!fs.existsSync(SEGMENT_TRAILER_DIR)) {
//         return res.status(400).send("Thư mục HLS không tồn tại.");
//       }
  
//       const hasFiles = await UploadService.containsFiles(SEGMENT_TRAILER_DIR);
//       if (!hasFiles) {
//         return res.status(400).send("Không có file nào để tải lên.");
//       }
  
//       // Đọc cấu trúc thư mục HLS và tải lên Cloudflare R2
//       await UploadService.uploadHlsFolder(SEGMENT_TRAILER_DIR, `trailer/${id}`); // Upload thư mục HLS
//       await UploadService.emptyDirectory(SEGMENT_TRAILER_DIR); // Làm rỗng thư mục sau khi upload xong
  
//       res.status(200).send({ message: "Tất cả tệp đã được tải lên thành công!" });
//     } catch (err) {
//       console.error("Error during upload:", err);
//       res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
//     }
// }
const uploadTrailerHLS = async (req, res) => {
  try {
    const { id, name } = req.body; // Lấy id từ request body
    if (!id) {
      return res.status(400).send("Thiếu ID trong request.");
    }

    if (!fs.existsSync(SEGMENT_TRAILER_DIR)) {
      return res.status(400).send("Thư mục HLS không tồn tại.");
    }

    const hasFiles = await UploadService.containsFiles(SEGMENT_TRAILER_DIR);
    if (!hasFiles) {
      return res.status(400).send("Không có file nào để tải lên.");
    }

    // Đếm tổng số file cần upload
    const totalFiles = await UploadService.countFiles(SEGMENT_TRAILER_DIR);
    let uploadedFiles = 0;

    // Cập nhật trạng thái bắt đầu
    await db.ref(`video_upload_R2/video`).set({
      name: name,
      status: "Đang tải lên",
      progress: 0,
    });

    // Upload toàn bộ thư mục HLS lên Cloudflare R2 và cập nhật tiến trình
    await UploadService.uploadHlsFolder(SEGMENT_TRAILER_DIR, `trailer/${id}`, (file) => {
      uploadedFiles++;
      const progress = Math.round((uploadedFiles / totalFiles) * 100);
      console.log(`📊 Tiến trình upload: ${progress}%`);
      db.ref(`video_upload_R2/video`).update({ progress });
    });

    // Xóa thư mục sau khi upload xong
    await UploadService.emptyDirectory(SEGMENT_TRAILER_DIR);

    // Cập nhật trạng thái hoàn thành
    await db.ref(`video_upload_R2/video`).update({ status: "Tải lên thành công", progress: 100 });

    res.status(200).send({ message: "Tất cả tệp đã được tải lên thành công!" });

  } catch (err) {
    console.error("Error during upload:", err);
    await db.ref(`video_upload_R2/video`).update({ status: "Lỗi upload, thử lại!" });
    res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
  }
};

const checkVideoHLS = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Thiếu ID trong request." });
    }

    if (!fs.existsSync(SEGMENT_VIDEO_DIR)) {
      return res.status(400).json({ error: "Thư mục HLS không tồn tại." });
    }

    const hasFiles = await UploadService.containsFiles(SEGMENT_VIDEO_DIR);
    if (!hasFiles) {
      return res.status(400).json({ error: "Không có file nào để tải lên." });
    }

    res.status(200).json({ message: "Sẵn sàng tải lên" });
  } catch (err) {
    console.error("❌ Lỗi kiểm tra video HLS:", err);
    res.status(500).json({ error: "Đã có lỗi xảy ra trong quá trình kiểm tra." });
  }
};
const checkTrailerHLS = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Thiếu ID trong request." });
    }

    if (!fs.existsSync(SEGMENT_TRAILER_DIR)) {
      return res.status(400).json({ error: "Thư mục HLS không tồn tại." });
    }

    const hasFiles = await UploadService.containsFiles(SEGMENT_TRAILER_DIR);
    if (!hasFiles) {
      return res.status(400).json({ error: "Không có file nào để tải lên." });
    }

    res.status(200).json({ message: "Sẵn sàng tải lên" });
  } catch (err) {
    console.error("❌ Lỗi kiểm tra trailer HLS:", err);
    res.status(500).json({ error: "Đã có lỗi xảy ra trong quá trình kiểm tra." });
  }
};
const clearUploadTrailer = async (req, res) => {
  try {
    console.log("Xóa thư mục chứa trailer...");
    UploadService.emptyDirectory(UPLOAD_TRAILER_DIR);
    res.status(200).json({ message: "Thư mục upload trailer đã được xóa thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa thư mục:", error);
    res.status(500).json({ error: "Lỗi khi xóa thư mục upload trailer" });
  }
};
const clearUploadVideo = async (req, res) => {
  try {
    console.log("Xóa thư mục chứa video...");
    UploadService.emptyDirectory(UPLOAD_VIDEO_DIR);
    res.status(200).json({ message: "Thư mục upload video đã được xóa thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa thư mục:", error);
    res.status(500).json({ error: "Lỗi khi xóa thư mục upload video" });
  }
};
const deleteFolderFromR2 = async (req, res) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ message: "Thiếu folderPath trong request" });
    }

    const result = await R2Service.deleteFolderFromR2(folderPath);
    if (!result.success) {
      console.log("Xóa thành cong");
      return res.status(404).json({ message: result.message });
    }

    res.json({ message: result.message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server khi xóa thư mục" });
  }
};
module.exports = {
  uploadVideoHLS, uploadTrailerHLS, uploadTrailerServer, uploadVideoServer,
  clearUploadTrailer, clearUploadVideo, checkVideoHLS, checkTrailerHLS, deleteFolderFromR2
};
