# 🚨 Railway 部署 Troubleshooting

## 當前狀態
- **URL:** https://ndhnursehandover.up.railway.app
- **錯誤:** 404 Application not found
- **最後更新:** 2026-02-08

## 可能原因

### 1. Build 失敗
Railway build 過程中出錯，app 無法啟動。

**檢查方法：**
1. 去 Railway Dashboard: https://railway.app
2. 點擊 `nurse-handover` project
3. 去 **Deployments** tab
4. 睇最新 deployment 嘅 status 同 logs

**常見 build 錯誤：**
- `prisma migrate deploy` 失敗（DATABASE_URL 未設定）
- `npm install` 失敗（dependency 問題）
- `next build` 失敗（TypeScript 錯誤）

### 2. 環境變數未設定
PostgreSQL DATABASE_URL 未連接到 app。

**檢查方法：**
1. 去 Railway project
2. 確保有 **PostgreSQL service**
3. 點擊 nurse-handover service → **Variables** tab
4. 確保有呢啲變數：
   - `DATABASE_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

**修復方法：**
如果冇呢啲變數：
1. 點擊 PostgreSQL service
2. 去 **Connect** tab
3. 複製 connection string
4. 去 nurse-handover service → Variables
5. 加入 `DATABASE_URL=<connection-string>`

### 3. Port 設定問題
Next.js 預設用 port 3000，但 Railway 可能需要 `PORT` 環境變數。

**修復方法：**
去 nurse-handover service → Variables，加入：
```
PORT=3000
```

### 4. Start Command 錯誤
Railway 可能用錯 start command。

**檢查方法：**
1. 去 Settings → Deploy
2. 睇 **Start Command**

**應該係：**
```bash
npm run start
```

或者（如果需要 migration）：
```bash
npx prisma migrate deploy && npm run start
```

### 5. Domain 未 Ready
Railway 生成 domain 需要時間。

**檢查方法：**
1. 去 Settings → Networking
2. 睇 **Public Networking** 係咪 enabled
3. 確保有 domain 顯示

## 快速修復步驟

### Step 1: 檢查 Build Logs
```bash
# 去 Railway Dashboard
# Deployments → 最新 deployment → View Logs
# 搵 error 訊息
```

### Step 2: 確保 PostgreSQL 連接
```bash
# 去 Railway project
# 確保有 PostgreSQL service
# 去 nurse-handover Variables
# 確保有 DATABASE_URL
```

### Step 3: 手動觸發重新部署
```bash
# 去 Deployments
# 點擊 "Redeploy"
```

### Step 4: 如果仍然失敗，檢查 package.json
確保 `package.json` 有正確嘅 scripts：
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

## 成功指標

當部署成功，你應該見到：
1. ✅ Build logs 顯示 "Build successful"
2. ✅ Deployment status 係 "Active"
3. ✅ 訪問 URL 見到 Next.js app（唔係 404）

## 如果所有方法都失敗

### 本地測試
```bash
cd /Users/myclawbot/.openclaw/workspace/nurse-handover

# 設定本地 DATABASE_URL（用 Railway 嘅）
export DATABASE_URL="postgresql://..."

# 運行 migration
npx prisma migrate deploy

# Build
npm run build

# Start
npm run start
```

如果本地都失敗，問題係 code。如果本地成功，問題係 Railway 設定。

## 聯絡 Nova

如果你搞唔掂，話俾我知：
1. Railway build logs 嘅錯誤訊息
2. Environment variables 係咪設定咗
3. PostgreSQL service 係咪 running

我會幫你逐步解決！✨
