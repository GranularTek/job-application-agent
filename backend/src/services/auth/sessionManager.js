const fs = require('fs');
const crypto = require('crypto');
const { SECRET_KEY } = require('../config/envConfig');

const key = Buffer.from(SECRET_KEY, 'base64');
const IV = Buffer.alloc(16, 0); // 16-byte IV

// 🔹 Encrypt session cookies
function encryptData(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, IV);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// 🔹 Decrypt session cookies
function decryptData(encryptedData) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// 🔹 Save session cookies
function saveSessionCookies(cookies) {
    fs.writeFileSync('linkedin_cookies.enc', encryptData(cookies));
}

// 🔹 Load session cookies
function loadSessionCookies() {
    if (fs.existsSync('linkedin_cookies.enc')) {
        return decryptData(fs.readFileSync('linkedin_cookies.enc', 'utf8'));
    }
    return null;
}

// 🔹 Check if LinkedIn session is still valid
async function isSessionValid(page) {
    await page.goto("https://www.linkedin.com/feed", { waitUntil: 'networkidle' });

    // ✅ If username field exists, session is expired
    const loginCheck = await page.$('input#username');
    return !loginCheck;
}

module.exports = {
    saveSessionCookies,
    loadSessionCookies,
    isSessionValid
};
