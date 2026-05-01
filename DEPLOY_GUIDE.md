# 🌐 AgriPredict: Deployment Guide

Follow these steps to take your project from `localhost` to the live web.

---

## 1. 📂 Backend Deployment (Render / Railway)
The backend manages the `db.json` and API endpoints.

**Steps for Render.com:**
1. Create a New **Web Service**.
2. Connect your GitHub repository.
3. **Environment Variables**:
   - `PORT`: `3000`
   - `JWT_SECRET`: (Your secret string)
   - `SESSION_SECRET`: (Your secret string)
   - `SMTP_USER` / `SMTP_PASS`: (For order emails)
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`

> [!NOTE]
> Render's free tier spins down after inactivity. On first load, wait ~30s for the server to "wake up."

---

## 2. 🎨 Frontend Deployment (Vercel / Netlify)
Vercel is the best choice for this project.

**Steps for Vercel:**
1. Import your repository.
2. **Project Settings**:
   - **Build Command**: (Leave empty or `npm install`)
   - **Output Directory**: `.` (Root)
3. **Environment Variables**:
   - You MUST update `API` in `script.js`, `dashboard.js`, and `voice.js` to point to your live Render URL (e.g., `https://agripredict-backend.onrender.com`).

---

## 3. 🔄 Connecting the Two
Once both are deployed:
1. Copy the **Backend URL** (e.g., `https://agripredict-api.onrender.com`).
2. Update the `const API = "..."` line at the top of your JS files.
3. Push changes to GitHub. Vercel will auto-redeploy.

---

## 4. 🛡️ Persistence Note
Since we use `db.json` as a mock database, Render's file system is **ephemeral**. This means:
- If the server restarts, your "Learning Logs" and "History" might reset.
- **Pro Fix**: To keep your learning progress, connect to a real database (MongoDB) or use Render's "Disk" feature (Paid). For a demo/portfolio, the ephemeral mode is usually fine!

---

## 🏁 Final Checklist
- [ ] Check if "Live Demo" link works in README.
- [ ] Ensure PDF Report export works on the live site.
- [ ] Test the Voice Assistant on a mobile browser.
