# 🚀 Full-Stack Cloud Deployment Guide

This guide provides step-by-step instructions to host the **Organ Transport System** in production using:
1. **MongoDB Atlas** (Cloud Database)
2. **Render / Railway** (Backend API Server)
3. **Vercel / Netlify** (React Frontend)

---

## 🍃 1. MongoDB Atlas Setup (Cloud DB)

1. **Sign Up / Login to MongoDB Atlas:**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Create a Cluster:**
   - Click **Build a Database** -> Choose **M0 Free Tier** -> Select region (e.g. `ap-south-1` Mumbai or `singapore`).
3. **Database User Credentials:**
   - Go to **Database Access** -> **Add New Database User**.
   - Auth Method: **Password**.
   - Set Username (e.g., `admin_organ`) and Generate a Secure Password.
   - User Privileges: **Read and write to any database**.
4. **Network Access (IP Whitelist):**
   - Go to **Network Access** -> **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so Render/Vercel can connect.
5. **Get Connection String:**
   - Go to **Database** -> Click **Connect** -> Choose **Drivers (Node.js)**.
   - Copy connection string:
     ```text
     mongodb+srv://admin_organ:<password>@cluster0.abcde.mongodb.net/organ_transport_system?retryWrites=true&w=majority
     ```

---

## ⚙️ 2. Backend Deployment (Render / Railway)

### Option A: Deploy on Render (Recommended)

1. **Push Repository to GitHub:**
   Ensure your code is pushed to your GitHub repository.
2. **Connect to Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com/) -> Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
3. **Configure Build & Deployment Settings:**
   - **Name:** `organ-transport-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
4. **Set Environment Variables in Render:**
   Under **Environment**, add the following keys:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://admin_organ:<password>@cluster0.abcde.mongodb.net/organ_transport_system?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `your_super_secret_jwt_key_here` |
   | `JWT_EXPIRES_IN` | `1d` |
   | `BLOCKCHAIN_ADAPTER` | `mini` |
   | `CORS_ORIGIN` | `https://organ-transport-system.vercel.app` (Your Vercel URL) |
5. **Deploy Service:**
   - Click **Create Web Service**.
   - Copy your deployed backend URL: `https://organ-transport-backend.onrender.com`.

---

## 🌐 3. Frontend Deployment (Vercel / Netlify)

### Deploy on Vercel (Recommended)

1. **Login to Vercel:**
   - Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. **Import Project:**
   - Click **Add New...** -> **Project**.
   - Import `Organ-Transport-System`.
3. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit -> Select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Set Environment Variable in Vercel:**
   - Key: `VITE_API_BASE_URL`
   - Value: `https://organ-transport-backend.onrender.com/api/v1` (Your Render Backend URL)
5. **Deploy:**
   - Click **Deploy**. Vercel will build and assign your production domain.

---

## 🧪 4. Post-Deployment Verification

1. **Verify Backend Health:**
   Visit `https://organ-transport-backend.onrender.com/api/v1/health` in browser.
   Expected response:
   ```json
   {
     "status": "healthy",
     "mongo": "connected",
     "timestamp": "2026-07-22T12:30:00.000Z"
   }
   ```
2. **Seed Initial Database (Cloud DB):**
   You can run the seed script locally pointing to your Atlas URI:
   ```bash
   MONGODB_URI="mongodb+srv://admin_organ:<password>@cluster0.abcde.mongodb.net/organ_transport_system" node backend/src/scripts/seed.js
   ```
3. **Test Frontend:**
   Open your Vercel URL -> Login as `admin@platform.com` / `admin123admin` -> Verify Dashboard metrics, Live Map, and Blockchain Audit Ledger!
