# 🧠 AI Job Application Agent – Backend

This is the backend for the AI-powered Job Application Agent built with Node.js, Express, MongoDB, and Playwright. It supports automated job scraping, resume customization (coming soon), role-based access control, and organization-user hierarchy.

---

## 🚀 Features

### 🔐 Authentication
- JWT-based login & registration
- Password hashing with bcrypt
- Role-based access (`admin`, `org`, `user`)
- Token renewal & protected routes

### 📦 Job API
- `GET /api/jobs` – Filtered & paginated job search
- `GET /api/jobs/my` – Authenticated user's jobs
- `POST /api/jobs` – Add manual job entry
- `PATCH /api/jobs/:id` – Update job status (e.g., applied)
- `DELETE /api/jobs/:id` – Delete job

### 🤖 Job Scraper
- Scrapes job listings from:
  - LinkedIn (via Playwright session)
  - Dice (via Playwright)
  - Indeed (via RapidAPI)
- API: `GET /api/scrape?title=Java&location=Remote`
- Supports org tagging, user tracking, and timestamping
- Skips invalid jobs, logs issues to `ErrorLog`

### 🧰 Utilities
- MongoDB integration via Mongoose
- Centralized `.env` config with fallback defaults
- Error logging model: `ErrorLog`
- Session manager for LinkedIn login persistence

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── services/
│   │   └── scrapers/
│   └── auth/
├── cron/ (optional)
├── config/
│   └── envConfig.js
├── .env
├── app.js
└── package.json
```

---

## 📦 Installation

```bash
git clone https://github.com/your-org/job-application-agent.git
cd job-application-agent
npm install
```

Create a `.env` file:
```bash
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
RAPIDAPI_KEY=<your-rapidapi-key>
LINKEDIN_USERNAME=...
LINKEDIN_PASSWORD=...
```

---

## 🧪 Running Locally

```bash
# Start backend
npm run dev

# Run scraper manually
node src/services/scrapers/jobScraperService.js "Software Engineer" "Remote"
```

Or hit the API:
```bash
GET /api/scrape?title=Software%20Engineer&location=Remote
Authorization: Bearer <your_token>
```

---

## 🗃️ MongoDB Models
- `User`: Auth, roles, orgs
- `Job`: Scraped and manual jobs
- `ErrorLog`: Debugging tool

---

## 📌 Notes
- Playwright may require Chromium download: `npx playwright install`
- Ensure `src/services/loginLinkedIn.js` is run once to store a valid session
- You can also schedule scraping via `node-cron`

---

## 📫 Contact
**Maintainer:** GranularTek LLC  
