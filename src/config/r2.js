const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config(); // Đọc biến môi trường từ .env

const r2 = new S3Client({
  region: "auto", // Cloudflare R2 không cần region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT, // URL của R2 (vd: https://<account-id>.r2.cloudflarestorage.com)
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY, // Key từ Cloudflare R2
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY, // Secret từ Cloudflare R2
  },
});

module.exports = r2;
