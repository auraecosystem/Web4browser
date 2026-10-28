npx prisma db push
# 1. Update project node_modules engine definitions
npm install

# 2. Push schema adjustments directly to SQLite local database
npx prisma db push

# 3. Fire up the high-velocity hot-reloading development system
npm run dev
