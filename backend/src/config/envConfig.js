const dotenv = require('dotenv');

// ✅ Load environment variables
dotenv.config();

if (!process.env.MONGO_URI || !process.env.RAPIDAPI_KEY || !process.env.LINKEDIN_EMAIL || !process.env.SECRET_KEY) {
    console.error("❌ Missing required environment variables. Check your .env file.");
    process.exit(1);
}

// ✅ Export environment variables for reuse across services
module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    LINKEDIN_EMAIL: process.env.LINKEDIN_EMAIL,
    LINKEDIN_PASSWORD: process.env.LINKEDIN_PASSWORD,
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
    SECRET_KEY: process.env.SECRET_KEY // Encryption key for session cookies
};
