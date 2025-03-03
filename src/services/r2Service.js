const r2 = require("../config/r2");
const fs = require("fs");
const { Upload } = require ("@aws-sdk/lib-storage");
const {DeleteObjectsCommand, ListObjectsV2Command,  ListMultipartUploadsCommand, AbortMultipartUploadCommand} = require("@aws-sdk/client-s3");
const path = require("path");

const uploadFileToR2 = async (localFilePath, r2FilePath) => {
  try {
      const stats = await fs.promises.stat(localFilePath);
      console.log(`📂 Bắt đầu tải lên: ${localFilePath}, Kích thước: ${stats.size} bytes`);

      const upload = new Upload({
      client: r2,
      params: {
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: r2FilePath,
          Body: fs.createReadStream(localFilePath),
          ContentType: getContentType(localFilePath),
      },
      });

      upload.on("httpUploadProgress", (progress) => {
      console.log(`🔄 Đang tải lên ${r2FilePath}: ${progress.loaded} / ${progress.total}`);
      });

      await upload.done().catch((err) => {
      console.error(`❌ Lỗi upload.done() của ${localFilePath}:`, err);
      });

      console.log(`✔ Tệp ${localFilePath} đã được tải lên thành công.`);
  } catch (err) {
      console.error(`❌ Lỗi khi tải lên tệp ${localFilePath}:`, err);
  }
}
const getContentType = (filePath) => {
  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
      ".m3u8": "application/vnd.apple.mpegurl",
      ".ts": "video/mp2t",
      // Thêm các loại tệp khác nếu cần
  };
  return mimeTypes[extname] || "application/octet-stream"; // Mặc định là kiểu tệp nhị phân
}
const deleteFolderFromR2 = async (folderPath) =>{
  try {
    if (!folderPath) throw new Error("Thiếu folderPath");

    const prefix = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

    // Bước 1: Liệt kê tất cả các file trong thư mục
    const listParams = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Prefix: prefix,
    };
    const listedObjects = await r2.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return { success: false, message: "Thư mục rỗng hoặc không tồn tại" };
    }

    // Bước 2: Xóa tất cả các file đã tìm thấy
    const deleteParams = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map((obj) => ({ Key: obj.Key })),
      },
    };
    await r2.send(new DeleteObjectsCommand(deleteParams));

    return { success: true, message: `Đã xóa toàn bộ thư mục ${folderPath} thành công!` };
  } catch (error) {
    console.error("❌ Lỗi khi xóa thư mục R2:", error);
    throw new Error("Lỗi server khi xóa thư mục");
  }
}
module.exports = {uploadFileToR2, deleteFolderFromR2};
