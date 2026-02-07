# 🚀 Railway 部署指引

## 📋 準備工作

你需要：
- Railway 帳號（免費）：https://railway.app
- GitHub 帳號（已連接）
- 呢個 repo：https://github.com/marcozku/nurse-handover

---

## 🎯 部署步驟

### 1️⃣ 登入 Railway

去 https://railway.app 用 GitHub 登入

### 2️⃣ 創建新項目

1. 點擊 **"New Project"**
2. 選擇 **"Deploy from GitHub repo"**
3. 搵到 `marcozku/nurse-handover`
4. 點擊 **"Deploy Now"**

### 3️⃣ 添加 PostgreSQL 數據庫

1. 喺你嘅 project 入面，點擊 **"+ New"**
2. 選擇 **"Database"**
3. 選擇 **"Add PostgreSQL"**
4. Railway 會自動創建數據庫同埋設定環境變數

### 4️⃣ 連接數據庫到 App

1. 點擊你嘅 **nurse-handover service**
2. 去 **"Variables"** tab
3. Railway 應該已經自動加咗呢啲變數：
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

如果冇，手動加入（從 PostgreSQL service 嘅 "Connect" tab 複製）

### 5️⃣ 運行數據庫遷移

Railway 會自動運行 `npm run build`，入面包含咗 `prisma generate`

但你需要手動運行一次 migration 去創建數據庫表：

1. 喺 Railway dashboard，點擊你嘅 **nurse-handover service**
2. 去 **"Settings"** tab
3. 搵到 **"Deploy"** section
4. 加入 **Custom Start Command**：
   ```bash
   npx prisma migrate deploy && npm run start
   ```

或者，喺本地運行（需要 Railway CLI）：

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# Link 去你嘅 project
railway link

# 運行 migration
railway run npx prisma migrate dev --name init
```

### 6️⃣ 設定域名（可選）

1. 喺 **nurse-handover service** 入面
2. 去 **"Settings"** tab
3. 搵到 **"Networking"** section
4. 點擊 **"Generate Domain"**
5. Railway 會俾你一個 `.railway.app` 域名

---

## 🔧 環境變數

Railway 會自動設定呢啲變數（從 PostgreSQL service）：

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/database?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database
NODE_ENV=production
```

---

## 📊 Prisma Migration

### 本地開發

```bash
# 創建新 migration
npx prisma migrate dev --name your_migration_name

# 查看數據庫狀態
npx prisma migrate status

# 重置數據庫（小心！會刪除所有數據）
npx prisma migrate reset
```

### 生產環境（Railway）

```bash
# 部署 migration（唔會刪除數據）
railway run npx prisma migrate deploy

# 查看數據庫
railway run npx prisma studio
```

---

## 🎨 Prisma Studio（數據庫管理界面）

本地運行：

```bash
npx prisma studio
```

會喺 http://localhost:5555 打開一個 GUI 界面，可以：
- 查看所有數據
- 添加/編輯/刪除記錄
- 測試數據庫關係

---

## 🚨 常見問題

### 1. Build 失敗

**問題：** `prisma generate` 失敗

**解決：**
- 確保 `package.json` 有 `postinstall` script
- 確保 `DATABASE_URL` 環境變數已設定

### 2. Migration 失敗

**問題：** `prisma migrate deploy` 失敗

**解決：**
```bash
# 檢查 migration 狀態
railway run npx prisma migrate status

# 如果有 pending migrations，手動運行
railway run npx prisma migrate deploy
```

### 3. 連接數據庫失敗

**問題：** App 無法連接 PostgreSQL

**解決：**
- 確保 PostgreSQL service 已經啟動
- 確保環境變數正確設定
- 檢查 `prisma/schema.prisma` 入面嘅 `datasource db`

---

## 📱 測試部署

部署完成後，訪問你嘅 Railway 域名：

```
https://your-app-name.railway.app
```

你應該會見到護士交更 app 嘅界面！

---

## 🔄 自動部署

每次你 push 去 GitHub `main` branch，Railway 會自動：
1. Pull 最新代碼
2. 運行 `npm install`
3. 運行 `npm run build`（包含 `prisma generate`）
4. 運行 `npm run start`

---

## 💡 下一步

1. **添加數據庫 seed**：創建初始數據
2. **設定 CORS**：如果需要從其他域名訪問
3. **添加認證**：保護你嘅 app
4. **監控**：設定 Railway 嘅 logging 同 metrics

---

需要幫手？問 Nova！✨
