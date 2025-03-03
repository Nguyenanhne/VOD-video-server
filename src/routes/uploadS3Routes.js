const express = require("express");
const {DeleteObjectsCommand, ListObjectsV2Command,  ListMultipartUploadsCommand, AbortMultipartUploadCommand} = require("@aws-sdk/client-s3");
const r2 = require("../config/r2");
const router = express.Router();
const UploadController = require("../controllers/uploadController");

// router.post("/upload-video-hls", async (req, res) => {
//   try {
//     const { id } = req.body; // Lấy id từ request body

//     if (!id) {
//       return res.status(400).send("Thiếu ID trong request.");
//     }

//     // Kiểm tra thư mục có tồn tại không
//     if (!fs.existsSync(SEGMENT_VIDEO_DIR)) {
//       return res.status(400).send("Thư mục HLS không tồn tại.");
//     }

//     const hasFiles = await containsFiles(SEGMENT_VIDEO_DIR);
//     if (!hasFiles) {
//       return res.status(400).send("Không có file nào để tải lên.");
//     }

//     // Đọc cấu trúc thư mục HLS và tải lên Cloudflare R2
//     await uploadHlsFolder(SEGMENT_VIDEO_DIR, `video/${id}`); // Upload thư mục HLS với ID
    
//     await emptyDirectory(SEGMENT_VIDEO_DIR); // Làm rỗng thư mục sau khi upload xong

//     res.status(200).send({ message: "Tất cả tệp đã được tải lên thành công!", id });
//   } catch (err) {
//     console.error("Error during upload:", err);
//     res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
//   }
// });
router.post("/upload-video-hls", UploadController.uploadVideoHLS);
router.post("/upload-trailer-hls", UploadController.uploadTrailerHLS);

// router.post("/upload-trailer-hls", async (req, res) => {
//   try {
//     const { id } = req.body; // Lấy id từ request body

//     if (!id) {
//       return res.status(400).send("Thiếu ID trong request.");
//     }
//     // Kiểm tra thư mục có tồn tại không
//     if (!fs.existsSync(SEGMENT_TRAILER_DIR)) {
//       return res.status(400).send("Thư mục HLS không tồn tại.");
//     }

//     const hasFiles = await containsFiles(SEGMENT_TRAILER_DIR);
//     if (!hasFiles) {
//       return res.status(400).send("Không có file nào để tải lên.");
//     }

//     // Đọc cấu trúc thư mục HLS và tải lên Cloudflare R2
//     await uploadHlsFolder(SEGMENT_TRAILER_DIR, `trailer/${id}`); // Upload thư mục HLS
//     await emptyDirectory(SEGMENT_TRAILER_DIR); // Làm rỗng thư mục sau khi upload xong

//     res.status(200).send({ message: "Tất cả tệp đã được tải lên thành công!" });
//   } catch (err) {
//     console.error("Error during upload:", err);
//     res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
//   }
// });

// router.post("/check-video-hls", async (req, res) => {
//   try {
//     const { id } = req.body; // Lấy id từ request body

//     if (!id) {
//       return res.status(400).send("Thiếu ID trong request.");
//     }
//     // Kiểm tra thư mục có tồn tại không
//     if (!fs.existsSync(SEGMENT_VIDEO_DIR)) {
//       return res.status(400).send("Thư mục HLS không tồn tại.");
//     }

//     const hasFiles = await containsFiles(SEGMENT_VIDEO_DIR);
//     if (!hasFiles) {
//       return res.status(400).send("Không có file nào để tải lên.");
//     }

//     res.status(200).send({ message: "Sẵn sàng tải lên" });
//   } catch (err) {
//     console.error("Error during upload:", err);
//     res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
//   }
// });
router.post("/check-video-hls", UploadController.checkVideoHLS);
router.post("/check-trailer-hls", UploadController.checkTrailerHLS);

// router.post("/check-trailer-hls", async (req, res) => {
//   try {
//     const { id } = req.body; // Lấy id từ request body

//     if (!id) {
//       return res.status(400).send("Thiếu ID trong request.");
//     }
//     // Kiểm tra thư mục có tồn tại không
//     if (!fs.existsSync(SEGMENT_TRAILER_DIR)) {
//       return res.status(400).send("Thư mục HLS không tồn tại.");
//     }

//     const hasFiles = await containsFiles(SEGMENT_TRAILER_DIR);
//     if (!hasFiles) {
//       return res.status(400).send("Không có file nào để tải lên.");
//     }

//     res.status(200).send({ message: "Sẵn sàng tải lên" });
//   } catch (err) {
//     console.error("Error during upload:", err);
//     res.status(500).send("Đã có lỗi xảy ra trong quá trình tải lên.");
//   }
// });

// API xóa toàn bộ thư mục trên R2
// router.delete("/delete-folder", async (req, res) => {
//   try {
//     const { folderPath } = req.body;
//     if (!folderPath) {
//       return res.status(400).json({ message: "Thiếu folderPath trong request" });
//     }

//     // Đảm bảo đường dẫn có dấu `/` ở cuối
//     const prefix = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

//     // Bước 1: Liệt kê tất cả các file trong thư mục
//     const listParams = {
//       Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
//       Prefix: prefix,
//     };

//     const listedObjects = await r2.send(new ListObjectsV2Command(listParams));

//     if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
//       return res.status(404).json({ message: "Thư mục rỗng hoặc không tồn tại" });
//     }

//     // Bước 2: Xóa tất cả các file đã tìm thấy
//     const deleteParams = {
//       Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
//       Delete: {
//         Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
//       },
//     };

//     await r2.send(new DeleteObjectsCommand(deleteParams));

//     res.json({ message: `Đã xóa toàn bộ thư mục ${folderPath} thành công!` });
//   } catch (error) {
//     console.error("❌ Lỗi khi xóa thư mục:", error);
//     res.status(500).json({ message: "Lỗi server khi xóa thư mục" });
//   }
// });
router.delete("/delete-folder", UploadController.deleteFolderFromR2);

// Hàm để đệ quy tải lên các tệp trong thư mục HLS

// async function uploadHlsFolder(localFolderPath, r2FolderPath) {
//   try {
//     const files = await fs.promises.readdir(localFolderPath);

//     for (const file of files) {
//       const localFilePath = path.join(localFolderPath, file);
//       const r2FilePath = path.posix.join(r2FolderPath, file); // Sử dụng path.posix.join để luôn sử dụng dấu "/"

//       const stats = await fs.promises.stat(localFilePath);

//       if (stats.isDirectory()) {
//         // Nếu là thư mục, gọi đệ quy để upload
//         await uploadHlsFolder(localFilePath, r2FilePath);
//       } else {
//         // Nếu là tệp, upload tệp lên Cloudflare R2
//         await uploadFileToR2(localFilePath, r2FilePath);
//       }
//     }
//     // const uploadPromises = files.map((file) =>
//     //   limit(async () => {
//     //     const localFilePath = path.join(localFolderPath, file);
//     //     const r2FilePath = path.posix.join(r2FolderPath, file);
//     //     const stats = await fs.promises.stat(localFilePath);
//     //     if (stats.isDirectory()) {
//     //       return uploadHlsFolder(localFilePath, r2FilePath);
//     //     } else {
//     //       return uploadFileToR2(localFilePath, r2FilePath);
//     //     }
//     //   })
//     // );
//     // await Promise.all(uploadPromises);
//     console.log(`✔ Thư mục ${localFolderPath} đã upload xong.`);
//   } catch (err) {
//     console.error("❌ Lỗi khi upload thư mục:", err);
//     throw new Error("Lỗi khi upload thư mục");
//   }
// }

// async function uploadFileToR2(localFilePath, r2FilePath) {
//   try {
//     const stats = await fs.promises.stat(localFilePath);
//     console.log(`📂 Bắt đầu tải lên: ${localFilePath}, Kích thước: ${stats.size} bytes`);

//     const upload = new Upload({
//       client: r2,
//       params: {
//         Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
//         Key: r2FilePath,
//         Body: fs.createReadStream(localFilePath),
//         ContentType: getContentType(localFilePath),
//       },
//     });
//     await upload.done();
//     console.log(`Tệp ${localFilePath} đã được tải lên thành công.`);
//   } catch (err) {
//     console.error(`Lỗi khi tải lên tệp ${localFilePath}:`, err);
//     throw new Error(`Lỗi khi tải lên tệp ${localFilePath}`);
//   }
// }

//---------------------------------------//
// async function uploadHlsFolder(localFolderPath, r2FolderPath) {
//   try {
//     console.log(`📂 Đọc thư mục: ${localFolderPath}`);
//     const files = await fs.promises.readdir(localFolderPath);

//     const uploadPromises = files.map(async (file) =>
//       limit(async () => {
//         const localFilePath = path.join(localFolderPath, file);
//         console.log(`📄 Kiểm tra file: ${localFilePath}`);
//         const stats = await fs.promises.stat(localFilePath);
        
//         if (stats.isDirectory()) {
//           console.log(`📂 Thư mục con: ${localFilePath} -> Gọi đệ quy`);
//           await uploadHlsFolder(localFilePath, path.posix.join(r2FolderPath, file));
//         } else {
//           console.log(`📤 Upload file: ${localFilePath} -> ${r2FolderPath}/${file}`);
//           await uploadFileToR2(localFilePath, path.posix.join(r2FolderPath, file));
//         }
//       })
//     );

//     await Promise.all(uploadPromises);
//     console.log(`✔ Thư mục ${localFolderPath} đã upload xong.`);
//   } catch (err) {
//     console.error("❌ Lỗi khi upload thư mục:", err);
//   }
// }




// // Hàm upload tệp lên Cloudflare R2
// async function uploadFileToR2(localFilePath, r2FilePath) {
//   try {
//     // Sửa r2FilePath để đảm bảo không trùng lặp với tên thư mục gốc
//     const uploadParams = {
//       Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME, // Tên bucket
//       Key: r2FilePath, // Đường dẫn trong bucket (giữ nguyên cấu trúc thư mục)
//       Body: fs.createReadStream(localFilePath), // Nội dung tệp
//       ContentType: getContentType(localFilePath), // Loại tệp
//     };

//     const command = new PutObjectCommand(uploadParams);
//     await r2.send(command);
//   } catch (err) {
//     console.error(`Error uploading file ${localFilePath}:`, err);
//     throw new Error(`Error uploading file ${localFilePath}`);
//   }
// }

// Hàm để xác định Content-Type dựa trên đuôi tệp

router.post("/upload-test", async (req, res) => {
  const { localFolderPath, r2FolderPath } = req.body;

  if (!localFolderPath || !r2FolderPath) {
    return res.status(400).json({ error: "Missing parameters: localFolderPath or r2FolderPath" });
  }

  try {
    const result = await uploadHlsFolder(localFolderPath, r2FolderPath);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

router.delete("/multipart-uploads", async (req, res) => {
  try {
    // 1️⃣ Liệt kê tất cả Multipart Upload chưa hoàn thành
    const listCommand = new ListMultipartUploadsCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    });

    const response = await r2.send(listCommand);
    const uploads = response.Uploads || [];

    if (uploads.length === 0) {
      return res.json({ message: "✅ Không có multipart upload nào cần hủy." });
    }

    // 2️⃣ Hủy tất cả Multipart Upload chưa hoàn thành
    for (const upload of uploads) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: upload.Key,
        UploadId: upload.UploadId,
      });

      await r2.send(abortCommand);
      console.log(`🛑 Đã hủy multipart upload: ${upload.Key} (UploadId: ${upload.UploadId})`);
    }

    res.json({ message: "✔ Tất cả multipart upload chưa hoàn thành đã bị hủy." });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý multipart upload:", error);
    res.status(500).json({ error: "Lỗi khi xử lý multipart upload." });
  }
});

module.exports = router;
