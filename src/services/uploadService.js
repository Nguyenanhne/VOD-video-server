const fs = require("fs");
const path = require("path");
const pLimit = require("p-limit").default
const R2Service = require("../services/r2Service")
const limit = pLimit(5);
const {db} = require('../config/firebase');

const emptyDirectory = async (directoryPath) => {
  try {
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.isFile()) await fs.promises.unlink(filePath);
      else if (stats.isDirectory()) {
        await emptyDirectory(filePath);
        await fs.promises.rmdir(filePath);
      }
    }
  } catch (err) {
    console.error(`Lỗi khi làm rỗng thư mục ${directoryPath}:`, err);
  }
};

const uploadFileToR2 = async (localFilePath, r2FilePath) => {
  try {
    const fileUrl = await R2Service.uploadFileToR2(localFilePath, r2FilePath);
    // console.log(`📤 Video đã được tải lên R2: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    // console.error("❌ Lỗi khi tải video lên R2:", error);
    throw error;
  }
};

const uploadHlsFolder = async (localFolderPath, r2FolderPath, progressCallback) => {
  try {
    console.log(`📂 Đọc thư mục: ${localFolderPath}`);
    const files = await fs.promises.readdir(localFolderPath);

    for (const file of files) {
      const localFilePath = path.join(localFolderPath, file);
      const r2FilePath = path.posix.join(r2FolderPath, file);
      const stats = await fs.promises.stat(localFilePath);

      if (stats.isDirectory()) {
        await uploadHlsFolder(localFilePath, r2FilePath, progressCallback);
      } else {
        console.log(`📤 Tải lên file: ${localFilePath} -> ${r2FilePath}`);
        await uploadFileToR2(localFilePath, r2FilePath);
        if (progressCallback) progressCallback(file);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi upload thư mục:", err);
  }
};

const containsFiles = async (directory) => {
  try {
      const items = await fs.promises.readdir(directory);
      
      for (const item of items) {
      const itemPath = path.join(directory, item);
      const stats = await fs.promises.stat(itemPath);

      if (stats.isFile()) {
          return true; // Có ít nhất một file
      }

      if (stats.isDirectory()) {
          // Nếu là thư mục, kiểm tra đệ quy xem có file nào không
          const subDirHasFiles = await containsFiles(itemPath);
          if (subDirHasFiles) {
          return true;
          }
      }
      }

      return false; // Không tìm thấy file nào
  } catch (err) {
      console.error("Error checking directory contents:", err);
      return false; // Lỗi khi đọc thư mục cũng coi như không có file
  }
}

const mergeChunks = (fileName, totalChunks, dir) => {
  const finalPath = path.join(dir, "video.mp4");
  const writeStream = fs.createWriteStream(finalPath);

  let chunkIndex = 0;

  function appendChunk() {
    if (chunkIndex >= totalChunks) {
      writeStream.end(); // Đóng stream sau khi ghi xong
      console.log(`✅ File ${fileName} đã ghép hoàn chỉnh!`);
      return;
    }

    const chunkPath = path.join(dir, `${fileName}.part${chunkIndex}`);
    
    if (!fs.existsSync(chunkPath)) {
      console.error(`❌ Lỗi: Chunk ${chunkIndex} không tồn tại!`);
      return;
    }

    const readStream = fs.createReadStream(chunkPath);

    readStream.pipe(writeStream, { end: false });

    readStream.on("end", () => {
      fs.unlinkSync(chunkPath); // Xóa chunk sau khi ghép
      chunkIndex++;
      appendChunk(); // Tiếp tục ghép chunk tiếp theo
    });

    readStream.on("error", (err) => {
      console.error(`❌ Lỗi đọc chunk ${chunkIndex}:`, err);
    });
  }

  appendChunk();
}

const countFiles = async (dir) => {
  let totalFiles = 0;
  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      totalFiles += await countFiles(filePath);
    } else {
      totalFiles++;
    }
  }
  return totalFiles;
};
module.exports = { uploadHlsFolder, containsFiles, emptyDirectory, mergeChunks, countFiles};
