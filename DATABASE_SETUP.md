# 🗄️ Database Setup Guide

## 📋 Overview
This guide explains how to set up the database for the cross-chain exchange application using Prisma with PostgreSQL.

## 🛠️ Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (Vercel Postgres recommended for production)

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Environment Variables
Create or update your `.env` file:
```env
# Database URL (for Vercel Postgres)
DATABASE_URL="postgresql://username:password@host:port/database"

# For local development, you can use:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/webapp"
```

### 3. Generate Prisma Client
```bash
pnpm db:generate
```

### 4. Push Database Schema
```bash
pnpm db:push
```

## 🏗️ Database Schema

### Order Model
```prisma
model Order {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Order status
  status OrderStatus @default(PENDING)
  
  // Exchange details
  fromChainId Int
  toChainId   Int
  fromToken   String
  toToken     String
  fromAmount  String
  toAmount    String
  
  // User details
  userAddress String
  
  // Order details
  orderHash   String?
  secret      String?
  
  // Transaction hashes
  orderFillTxHash      String?
  dstEscrowDeployTxHash String?
  dstWithdrawTxHash     String?
  srcWithdrawTxHash     String?
  
  // Transaction links
  orderFillTxLink      String?
  dstEscrowDeployTxLink String?
  dstWithdrawTxLink     String?
  srcWithdrawTxLink     String?
  
  // Timestamps
  completedAt DateTime?
  failedAt    DateTime?
  
  // Messages and errors
  message String?
  error   String?
  
  // Additional metadata
  metadata Json?

  @@index([userAddress])
  @@index([status])
  @@index([createdAt])
  @@index([fromChainId, toChainId])
}

enum OrderStatus {
  PENDING
  COMPLETED
  FAILED
}
```

## 🔧 Database Commands

### Generate Prisma Client
```bash
pnpm db:generate
```

### Push Schema Changes
```bash
pnpm db:push
```

### Create Migration
```bash
pnpm db:migrate
```

### Open Prisma Studio
```bash
pnpm db:studio
```

## 🌐 API Endpoints

### Create Order
- **POST** `/api/order`
- Creates a new order in the database
- Returns order ID and transaction details

### Update Order (Secret Reveal)
- **POST** `/api/order/secret-reveal`
- Updates order status to COMPLETED
- Requires `orderId` in request body

### Get All Orders
- **GET** `/api/orders`
- Supports filtering and pagination

#### Query Parameters:
- `status` - Filter by order status (PENDING, COMPLETED, FAILED)
- `userAddress` - Filter by user address
- `fromChainId` - Filter by source chain ID
- `toChainId` - Filter by destination chain ID
- `startDate` - Filter orders created after this date
- `endDate` - Filter orders created before this date
- `limit` - Number of orders to return (default: 50)
- `offset` - Number of orders to skip (default: 0)

#### Example Requests:
```bash
# Get all orders
GET /api/orders

# Get pending orders for a specific user
GET /api/orders?status=PENDING&userAddress=0x123...

# Get orders from last 7 days
GET /api/orders?startDate=2024-01-01&endDate=2024-01-08

# Get orders with pagination
GET /api/orders?limit=10&offset=20
```

## 🚀 Vercel Deployment

### 1. Set Up Vercel Postgres
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database
3. Choose PostgreSQL
4. Copy the connection string

### 2. Add Environment Variables
Add the following to your Vercel project:
```
DATABASE_URL=your_vercel_postgres_connection_string
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Push Database Schema
After deployment, push the schema to Vercel Postgres:
```bash
pnpm db:push
```

## 🔍 Database Features

### Indexes
- `userAddress` - Fast user-specific queries
- `status` - Fast status filtering
- `createdAt` - Fast date range queries
- `fromChainId, toChainId` - Fast chain-specific queries

### Data Types
- **String IDs** - Using CUID for better distribution
- **JSON Metadata** - Flexible additional data storage
- **Nullable Fields** - Optional transaction hashes and links
- **Timestamps** - Automatic creation and update tracking

### Transaction Tracking
- Order fill transaction
- Destination escrow deployment
- Destination withdrawal
- Source withdrawal

## 🧪 Testing

### Local Development
1. Set up local PostgreSQL
2. Update `.env` with local database URL
3. Run `pnpm db:push`
4. Start development server: `pnpm dev`

### Production Testing
1. Deploy to Vercel
2. Push schema to production database
3. Test API endpoints with real data

## 📊 Monitoring

### Prisma Studio
View and manage your database:
```bash
pnpm db:studio
```

### Database Logs
Monitor database performance in Vercel dashboard.

## 🔒 Security

### Environment Variables
- Never commit `.env` files
- Use Vercel environment variables for production
- Rotate database credentials regularly

### Data Validation
- All inputs are validated by Prisma
- SQL injection protection through Prisma ORM
- Proper error handling in API endpoints

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check DATABASE_URL format
   - Verify database credentials
   - Ensure database is running

2. **Schema Push Failures**
   - Check for syntax errors in schema.prisma
   - Verify database permissions
   - Try `pnpm db:generate` first

3. **API Errors**
   - Check Prisma client generation
   - Verify environment variables
   - Check database connectivity

### Debug Commands
```bash
# Check Prisma client
pnpm db:generate

# Validate schema
npx prisma validate

# Reset database (⚠️ destructive)
npx prisma db push --force-reset
```

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) 