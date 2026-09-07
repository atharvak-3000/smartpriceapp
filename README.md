# ⚡ SmartPrice — Smart Retail & Electrical Shop Management Platform

A high-performance, modern full-stack web and mobile application engineered for electrical and retail product stores. Built with **React Native / Expo (Web + iOS + Android)** and **Node.js / Express / MongoDB**, SmartPrice delivers rapid price lookups, multi-tier pricing, quotation generation with WhatsApp sharing, fast stock counter release (+/-), brand distribution infographics, and a crisp dual Light/Dark theme.

---

## 🌟 Key Highlights & Features

- **⚡ Quick Price Changes**: Update MRP, Wholesale, and Sale Price directly via a 1-tap modal without editing cumbersome full-page forms.
- **📄 Quotation & Bill Maker**:
  - Add multiple products to a quote with custom quantities.
  - Automatically calculates Subtotal, Discount %, Subtotal after Discount, SGST (9%), CGST (9%), and Grand Total.
  - 1-Tap **WhatsApp Share**: Formats a professional invoice text ready to send to customers.
  - **1-Tap Inventory Deduction**: Automatically deducts all quoted items from live stock.
- **📦 Stock Management & Counter Sales (+ / -)**:
  - Both **Admin** and **Salesperson / Staff** can instantly add or release stock.
  - Quick action chips (`-1`, `-2`, `-3`, `-5`, `-10`, `+1`, `+5`, `+10`) plus direct quantity entry for fast customer counter sales.
- **📊 Brand Stock Infographics**:
  - Visual distribution cards showing stock quantity and item counts per brand (e.g. Philips, Havells, Legrand, Anchor, Polycab).
  - Visual percentage progress bars with instant 1-tap brand filtering.
- **🔐 3-Tier Role-Based Security**:
  - **MRP Price**, **Wholesale Price**, and **Sale Price**.
  - **Admin / Owner**: Can view and edit all 3 price tiers, manage inventory, and access the admin dashboard.
  - **Salesperson / Staff**: Can only see the **Sale Price**. The Wholesale Price is masked at both backend and frontend layers for maximum confidentiality.
- **🎨 Modern Dual Theme**:
  - **Dark Mode**: Sleek deep midnight theme (`#030712`, `#0B1220`).
  - **Light Mode**: High-contrast, clean slate & pure white theme (`#F8FAFC`, `#FFFFFF`).
  - Instant 1-tap theme toggle pill saved to device storage.
- **🏪 Store Logo & Custom Branding**:
  - Upload custom shop logo, configure Store Name, Phone Number, Shop Address, and GSTIN.
  - Automatically reflected across the app and in generated Quotation headers.
- **📱 Universal Deployment**:
  - **Web**: Instant deployment on Vercel, Netlify, or Render Static Site (`npx expo export -p web`).
  - **Mobile**: Native Android APK / AAB and iOS builds via Expo EAS.
  - **Backend**: Containerized Docker image, Render Blueprint, Railway, or standalone Node.js.

---

## 📂 Repository Structure

```text
smartprice/
├── .gitignore                  # Comprehensive production gitignore rules
├── docker-compose.yml          # 1-command full-stack container orchestration
├── render.yaml                 # Render.com Blueprint deployment specification
├── README.md                   # Complete documentation & deployment guide
├── backend/
│   ├── Dockerfile              # Multi-stage production container image
│   ├── .env.example            # Environment variable template
│   ├── package.json            # Scripts & backend dependencies
│   ├── tsconfig.json           # Backend TypeScript configuration
│   ├── uploads/                # Directory for user-uploaded product images
│   │   └── products/.gitkeep
│   └── src/
│       ├── app.ts              # Express application, CORS, health endpoints
│       ├── server.ts           # HTTP server entry point & MongoDB connection
│       ├── config/
│       │   └── db.ts           # MongoDB Atlas connection handler
│       ├── controllers/
│       │   ├── authController.ts
│       │   └── productController.ts
│       ├── middleware/
│       │   └── authMiddleware.ts # Role authorization & optional token protection
│       ├── models/
│       │   ├── Product.ts      # Product schema (MRP, Wholesale, Sale price, Stock)
│       │   └── User.ts         # User schema (Owner, Admin, Staff, Salesperson)
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   └── productRoutes.ts
│       ├── scripts/
│       │   ├── seed.ts         # Sample data seeder (Philips, Legrand, etc.)
│       │   ├── seed1000.ts     # 1,000 item stress-test catalog seeder
│       │   ├── generateSampleExcel.ts
│       │   ├── importExcel.ts  # Bulk Excel catalog importer
│       │   └── test-api.js     # API integration verification test runner
│       └── types/
│           └── index.ts        # Shared TypeScript interfaces
└── frontend/
    ├── app.json                # Expo application configuration
    ├── vercel.json             # Vercel SPA routing & static export settings
    ├── .env.example            # Frontend environment variable template
    ├── package.json            # Scripts & frontend dependencies
    ├── tsconfig.json           # Frontend TypeScript configuration
    ├── app/
    │   ├── _layout.tsx         # Root layout with dynamic theme provider
    │   ├── index.tsx           # Home catalog search, infographics & quick actions
    │   ├── (admin)/
    │   │   └── dashboard.tsx   # Management dashboard & store branding
    │   └── (auth)/
    │       ├── login.tsx       # Owner / Admin login
    │       └── staff-login.tsx # Staff / Salesperson login
    └── src/
        ├── components/
        │   ├── AddEditProductModal.tsx   # Comprehensive product drawer
        │   ├── BrandStockInfographic.tsx # Brand stock charts & filter pills
        │   ├── LogoUploadModal.tsx       # Store branding & logo upload
        │   ├── ProductCard.tsx           # Multi-price item card with quote actions
        │   ├── ProductDetailSheet.tsx    # Detailed item bottom sheet
        │   ├── QuickPriceModal.tsx       # Fast 3-tier price update modal
        │   ├── QuotationMakerModal.tsx   # Quotation builder & WhatsApp exporter
        │   └── StockUpdateModal.tsx      # Quick +/- counter stock release modal
        ├── services/
        │   └── api.ts                    # Dynamic backend API client
        ├── store/
        │   ├── useAuthStore.ts           # Authentication & token store
        │   ├── useBrandingStore.ts       # Store name, logo & GSTIN store
        │   ├── useProductStore.ts        # Inventory, quotation & brand stats store
        │   └── useThemeStore.ts          # Dark / Light theme preference store
        └── theme/
            └── colors.ts                 # Dark & Light design system tokens
```

---

## 🔑 Default Seed Credentials

After running `npm run seed` in the backend:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `owner@smartprice.com` | `Password123` | Full access: View & edit MRP, Wholesale, and Sale price; Add/Delete products; Adjust stock. |
| **Staff / Salesperson** | `sales@smartprice.com` | `Password123` | View Sale Price only (Wholesale Price is masked); Adjust stock (+/- counter sales); Create quotations. |

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB connection string & JWT Secret
npm install
npm run build
npm run seed      # Seeds default users and sample electrical products
npm run dev       # Starts server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://localhost:5000 (or your computer LAN IP for physical phones)
npm install
npm run web       # Launch web app in browser
# OR
npm run android   # Launch on Android emulator / device
```

---

## 🐳 1-Command Docker Deployment

You can spin up MongoDB and the SmartPrice Backend with one command:

```bash
docker compose up -d --build
```

- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **MongoDB**: `localhost:27017`

---

## ☁️ Cloud Hosting & Deployment Guide

### Option 1: Backend on Render.com (Recommended & Free Tier Available)
1. Push this repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New > Blueprint**.
3. Select your repository. Render will automatically detect [`render.yaml`](file:///e:/smartprice/render.yaml).
4. Supply your `MONGO_URI` (from MongoDB Atlas) in the environment settings.
5. Click **Apply**. Render will build and deploy the backend. Your API URL will be:
   `https://smartprice-backend-xxxx.onrender.com`
6. Verify deployment by visiting `https://your-backend-url.onrender.com/health`.

### Option 2: Backend on Railway / Fly.io / VPS
- **Railway**: Simply link your repo; Railway detects [`backend/Dockerfile`](file:///e:/smartprice/backend/Dockerfile) and provisions the service automatically.
- **VPS (Ubuntu/Debian)**: Clone repo, configure `.env`, and run `docker compose up -d`.

---

### Frontend Web Hosting (Vercel, Netlify, Render Static)

The frontend is configured with [`frontend/vercel.json`](file:///e:/smartprice/frontend/vercel.json) for instantaneous deployment.

#### Deploy on Vercel:
1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. Configure the Project:
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npx expo export -p web` (or `npm run build`)
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   ```env
   EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com
   ```
5. Click **Deploy**. Your web app is live with full routing support!

---

## 📱 Mobile APK / Production App Build (Expo EAS)

To build a standalone Android `.apk` file for your team:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log into Expo**:
   ```bash
   eas login
   ```
3. **Build Android APK**:
   ```bash
   cd frontend
   eas build --platform android --profile preview
   ```
4. EAS builds the APK in the cloud and provides a direct download link. Install on any Android device without Google Play Store restrictions.

---

## 📡 REST API Reference

### Public Endpoints
- `GET /` — Service status
- `GET /health` — Health check & uptime
- `POST /auth/login` — Authenticate user (Owner, Admin, or Salesperson)

### Products Endpoints
- `GET /products` — Fetch catalog (Wholesale price masked if accessed by staff)
- `GET /products/search?q=...` — Search catalog by product name, category, code, or brand
- `GET /products/:id` — Get product details
- `POST /products` — Create product *(Owner / Admin only)*
- `PUT /products/:id` — Update complete product *(Owner / Admin only)*
- `PATCH /products/:id/quick-price` — Fast price update for MRP, Wholesale, Sale price *(Owner / Admin only)*
- `PATCH /products/:id/stock` — Add or release stock quantity *(Owner, Admin, and Salesperson)*
- `DELETE /products/:id` — Delete product *(Owner / Admin only)*
- `POST /products/bulk` — Bulk import products array *(Owner / Admin only)*
- `POST /products/upload-image` — Upload product image multipart form *(Owner / Admin only)*

---

## 🛡️ Cleanliness & Production Verification Checklist

- [x] Unused barcode and camera libraries removed from UI and configuration.
- [x] Comprehensive root `.gitignore` preventing secrets, caches, and build outputs from being tracked.
- [x] Backend TypeScript compilation: 0 errors (`npm run build`).
- [x] Frontend TypeScript validation: 0 errors (`npx tsc --noEmit`).
- [x] Web production export verified: 0 errors (`npx expo export -p web`).
- [x] `.env.example` templates created for both backend and frontend.
- [x] Multi-stage `Dockerfile` and `docker-compose.yml` included.
- [x] `render.yaml` and `vercel.json` configurations tested and ready.
