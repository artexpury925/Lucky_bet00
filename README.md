# Lucky Bet - Aviator Crash & Sports Arena

Free-to-play crash gaming and sports betting simulator featuring realistic Aviator flight physics, dual bet panels, provably fair mechanics, live football accumulator multi-bets, and virtual M-PESA cashier demo.

---

## 🚀 Deploying on Render

This project is fully configured and ready for 1-click deployment on [Render](https://render.com).

### Method 1: Render Blueprint (Recommended - Zero Configuration)

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your repository. Render will automatically detect `render.yaml`.
5. Click **Apply**. Render will automatically build the client and start the production web service.

---

### Method 2: Manual Web Service Setup (Node.js)

1. On the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `lucky-bet`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (or `node server.js`)
   - **Plan**: `Free`
4. In **Advanced**:
   - **Health Check Path**: `/health`
5. Click **Create Web Service**.

---

### Method 3: Static Site Setup

If you prefer hosting strictly as a static website on Render without a Node backend:

1. Click **New +** > **Static Site**.
2. Connect your Git repository.
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**:
   - Add a rewrite: `/*` -> `/index.html` (Status: `Rewrite`)
5. Click **Create Static Site**.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server locally
npm start
```

---

## 🔑 Admin Portal

Access the simulated admin panel within the app or via `#admin-login`:
- **Username**: `KENYA@254`
- **Password**: `KENYA@254`
