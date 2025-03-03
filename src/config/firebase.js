const { getAuth } = require("firebase-admin/auth");
const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://finalmobilecrossplatform-default-rtdb.firebaseio.com"
});

const db = admin.firestore(); // Kết nối Firestore
const auth = getAuth(admin.app()); // Khởi tạo Auth instance

module.exports = { auth, db };