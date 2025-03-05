require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const uploadRoutes = require("./src/routes/uploadRoutes");
const videoRoutes = require("./src/routes/videoRoutes");
const uploadS3Routes = require("./src/routes/uploadS3Routes")


app.use("/api/upload", uploadRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/upload", uploadS3Routes)

app.use((req, res, next) => {
  console.log(`👉 Nhận request: ${req.method} ${req.url}`);
  next();
});
app.get('/ping', (req, res) => {
  res.send('Server đang hoạt động');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
