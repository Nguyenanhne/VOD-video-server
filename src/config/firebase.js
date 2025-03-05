const admin = require("firebase-admin");
const firebaseAdminConfigBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!firebaseAdminConfigBase64) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT in environment variables.");
}

// Giải mã Base64 thành chuỗi JSON
const firebaseAdminConfigJson = Buffer.from(firebaseAdminConfigBase64, "base64").toString("utf-8");

const firebaseAdminConfig = JSON.parse(firebaseAdminConfigJson);

console.log(firebaseAdminConfig);

admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig),
    databaseURL: "https://finalmobilecrossplatform-default-rtdb.firebaseio.com"
});

const db = admin.database();

module.exports = {db, admin };