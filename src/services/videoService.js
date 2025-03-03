const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const UPLOAD_VIDEO_DIR = path.join(__dirname, "..", "videos");
const SEGMENT_VIDEO_DIR = path.join(__dirname, "..", "videos_hls");
const UPLOAD_TRAILER_DIR = path.join(__dirname, "..", "trailers");
const SEGMENT_TRAILER_DIR = path.join(__dirname, "..", "trailers_hls");


// Hàm chạy lệnh FFmpeg
const runFFMPEGCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(`Lỗi: ${stderr}`);
      else resolve(stdout);
    });
  });
};

// Hàm làm rỗng thư mục
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

// Xử lý cắt video
const cutVideoHLS = async (fileName, resolutions) => {
  await emptyDirectory(SEGMENT_VIDEO_DIR);
  
  const videoPath = path.join(UPLOAD_VIDEO_DIR, fileName);
  if (!fs.existsSync(videoPath)) {
    throw new Error("Video không tồn tại");
  }

  const baseFileName = path.basename(fileName, path.extname(fileName));
  const outputFiles = [];
  const segmentFiles = [];

  for (const resolution of resolutions) {
    console.log(`Đang tiến hành xử lý: ${resolution}p `)
    const outputDir = path.join(SEGMENT_VIDEO_DIR, `${baseFileName}_${resolution}p`);
    const { playlistFile, segmentFiles: segments } = await processHLS(videoPath, baseFileName, resolution, outputDir);
    outputFiles.push(playlistFile);
    segmentFiles.push(...segments);
  }
  generateMasterPlaylist(baseFileName, resolutions, SEGMENT_VIDEO_DIR);
  fs.unlinkSync(videoPath); // Xóa video gốc
  console.log(`Video cắt thành công thành HLS `)
  return {
    message: "Video cắt thành công thành HLS",
    files: outputFiles.map(file => `/videos_hls/${path.basename(file)}`),
    segmentFiles,
  };
};

// Xử lý cắt trailer
const cutTrailerHLS = async (fileName) => {
  await emptyDirectory(SEGMENT_TRAILER_DIR);
  
  const videoPath = path.join(UPLOAD_TRAILER_DIR, fileName);
  if (!fs.existsSync(videoPath)) {
    throw new Error("Trailer không tồn tại");
  }

  const baseFileName = path.basename(fileName, path.extname(fileName));
  const resolutions = [360, 480, 720];
  const outputFiles = [];
  const segmentFiles = [];

  for (const resolution of resolutions) {
    console.log(`Đang tiến hành xử lý: ${resolution}p `)
    const outputDir = path.join(SEGMENT_TRAILER_DIR, `${baseFileName}_${resolution}p`);
    const { playlistFile, segmentFiles: segments } = await processHLS(videoPath, baseFileName, resolution, outputDir);
    outputFiles.push(playlistFile);
    segmentFiles.push(...segments);
  }
  generateMasterPlaylist(baseFileName, resolutions, SEGMENT_TRAILER_DIR);
  fs.unlinkSync(videoPath); // Xóa trailer gốc
  console.log(`Trailer cắt thành công thành HLS `)
  return {
    message: "Trailer cắt thành công thành HLS",
    files: outputFiles.map(file => `/trailers_hls/${path.basename(file)}`),
    segmentFiles,
  };
};

// Hàm xử lý FFmpeg và tạo HLS
async function processHLS(videoPath, baseFileName, resolution, outputDir) {
  const playlistFile = path.join(outputDir, "playlist.m3u8");
  const segmentDir = path.join(outputDir, "segments");
  fs.mkdirSync(segmentDir, { recursive: true });

  // Chọn bitrate phù hợp
  const bitrate = resolution === 144 ? "200k" :
                  resolution === 240 ? "400k" :
                  resolution === 360 ? "800k" :
                  resolution === 480 ? "1000k" :
                  resolution === 720 ? "1500k" : "3000k";

  // Lệnh ffmpeg để tạo HLS
  const command = `ffmpeg -i ${videoPath} -vf "scale=trunc(oh*a/2)*2:${resolution}" -r 30 -b:v ${bitrate} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename "${segmentDir}/%03d.ts" ${playlistFile}`;
  await runFFMPEGCommand(command);

  // Sửa đường dẫn trong file playlist
  const playlistContent = fs.readFileSync(playlistFile, "utf8");
  const updatedPlaylist = playlistContent.replace(/(\d{3}\.ts)/g, (match) => `segments/${match}`);
  fs.writeFileSync(playlistFile, updatedPlaylist);

  // Lấy danh sách segment
  const segmentFiles = fs.readdirSync(segmentDir).map(file => path.join(`${baseFileName}_${resolution}p/segments`, file));

  return { playlistFile, segmentFiles };
}
// const processHLS = async (videoPath, baseFileName, resolution, outputDir) => {
//   const playlistFile = path.join(outputDir, "playlist.m3u8");
//   const segmentDir = path.join(outputDir, "segments");
//   fs.mkdirSync(segmentDir, { recursive: true });

//   const bitrate = resolution === 360 ? "800k" :
//                   resolution === 480 ? "1000k" :
//                   resolution === 720 ? "1500k" : "3000k";

//   const command = `ffmpeg -i ${videoPath} -vf "scale=trunc(oh*a/2)*2:${resolution}" -r 30 -b:v ${bitrate} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename "${segmentDir}/%03d.ts" ${playlistFile}`;
//   await runFFMPEGCommand(command);

//   const segmentFiles = fs.readdirSync(segmentDir).map(file => path.join(`${baseFileName}_${resolution}p/segments`, file));

//   return { playlistFile, segmentFiles };
// };

// Tạo file master m3u8
function generateMasterPlaylist(baseFileName, resolutions, outputDir) {
    const masterPlaylistPath = path.join(outputDir, `${baseFileName}_master.m3u8`);
    const masterPlaylist = [];
  
    // Khởi tạo file M3U8
    masterPlaylist.push("#EXTM3U");
    masterPlaylist.push("#EXT-X-VERSION:3");
  
    resolutions.forEach(resolution => {
        const playlistFile = path.posix.join(`${baseFileName}_${resolution}p`, "playlist.m3u8");
  
        // Chọn băng thông và kích thước theo độ phân giải
        let bandwidth, resolutionStr;

        switch (resolution) {
            case 144:
                bandwidth = 150000; 
                resolutionStr = "256x144";
                break;
            case 240:
                bandwidth = 400000; 
                resolutionStr = "426x240";
                break;
            case 360:
                bandwidth = 800000; 
                resolutionStr = "640x360";
                break;
            case 480:
                bandwidth = 1000000; 
                resolutionStr = "854x480";
                break;
            case 720:
                bandwidth = 1500000; 
                resolutionStr = "1280x720";
                break;
            case 1080:
                bandwidth = 3000000; 
                resolutionStr = "1920x1080";
                break;
            default:
                console.warn(`⚠️ Độ phân giải ${resolution}p không xác định, bỏ qua.`);
                return;
        }
  
        // Thêm thông tin của từng độ phân giải vào master playlist
        masterPlaylist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolutionStr},CODECS="avc1.42E01E,mp4a.40.2"`);
        masterPlaylist.push(playlistFile);
    });
  
    // Ghi file master M3U8
    fs.writeFileSync(masterPlaylistPath, masterPlaylist.join("\n"));
    console.log(`✅ Master playlist created at: ${masterPlaylistPath}`);
}

module.exports = { cutVideoHLS, cutTrailerHLS, emptyDirectory};
