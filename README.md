# 🚗 XeroParts - Genuine Auto Parts E-Commerce & Management Platform

**XeroParts** is a high-performance, modern automotive spare parts e-commerce web platform tailored specifically for the Indian automotive market (Maruti Suzuki, Tata Motors, Hyundai, Mahindra, Toyota, Kia, Honda, etc.).

---

## 🌟 Key Features

1. **Smart Indian Vehicle Number Plate (RC) Lookup**:
   - Customer enters their vehicle number (e.g. `MH 12 DE 4567` or `DL 01 AB 1234`).
   - The platform decodes the vehicle brand, model, fuel type, and year, and automatically filters 100% guaranteed compatible parts!
2. **Flipkart / Amazon-Style Experience**:
   - Browse by top Indian brands or categories (Engine, Brakes, Suspension, Electrical, Filters & Oil, AC).
   - Fast instant search across Part Name, OEM Part Number, or Car Model.
   - Price range, in-stock availability, and OEM Genuine badges.
3. **Safe & Easy Multi-Option Payment System**:
   - **Dynamic UPI QR Code**: Real-time QR generation (`upi://pay?pa=xeroparts@upi&...`) for instant scan & pay with GPay, PhonePe, Paytm, BHIM, Cred.
   - Credit / Debit Cards with 256-bit SSL simulated security.
   - Cash on Delivery (COD).
4. **Automated WhatsApp Order Dispatch**:
   - Whenever an order is confirmed, full customer & order details (Order ID, Parts, Car Model, Address, Payment Status) are instantly dispatched to the Owner & Team WhatsApp!
5. **Integrated Owner Studio & Profit Analytics**:
   - **Stock & Inventory Management**: Live stock count, low stock warnings (< 5 units), add new parts, edit quantities, and delete items.
   - **Profit & Fee Analyzer**: Configure payment gateway charges (e.g. 2%), packaging fees, and calculate net profit per part as well as total store margin %.
   - **1-Click JSON Export**: Export updated inventory to sync with your GitHub codebase.

---

## 🚀 How to Run Locally

### Option 1: Double-click `start.bat`
Simply double-click the `start.bat` file in this folder. It will launch the local server at:
👉 **`http://localhost:5500/`** and open your browser automatically!

### Option 2: PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

---

## 🌐 Connect to GitHub & Go Live Automatically

Every change you make right here can be deployed live to your website using GitHub Pages!

### Step 1: Create a GitHub Repository
1. Log into your account on [GitHub.com](https://github.com/new).
2. Create a new repository named `xeroparts` (Keep it **Public**).
3. Do NOT initialize with README/license (we already have everything set up).

### Step 2: Link & Push from Here
Open your terminal inside this project directory (`C:\Users\Govind\.gemini\antigravity\scratch\xeroparts`) and run:
```powershell
# 1. Login to GitHub (if not already logged in)
gh auth login

# 2. Add your GitHub repository URL:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/xeroparts.git

# 3. Push to main:
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages (Instant Free Hosting)
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions** (our included `.github/workflows/deploy.yml` will automatically build and publish your site).
3. Your live link will be:
   👉 `https://<YOUR_GITHUB_USERNAME>.github.io/xeroparts/`

---

## 🔄 Making Future Updates (1-Click Live Sync)

Whenever you edit files, add parts in `js/data.js`, or update styling:
Simply run:
```powershell
.\deploy.ps1 "Added new parts to XeroParts catalog"
```
Or use:
```powershell
git add .
git commit -m "Updated store"
git push
```
Within **30 to 60 seconds**, your live website will update automatically!
