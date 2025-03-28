// models/ErrorLog.js
const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  source: String, // e.g., LinkedIn, Dice, Scraper
  message: String, // Error message
  details: Object, // Stack trace or extra info
  timestamp: { type: Date, default: Date.now },
  context: String, // Optional: scraper name, job ID, etc.
});

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);
