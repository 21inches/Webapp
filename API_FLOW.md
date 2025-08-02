# 🔄 API Flow Documentation

## 📋 Overview
This document describes the complete API flow for the cross-chain exchange order lifecycle, from order creation to completion.

## 🎯 Order Lifecycle States

### **1. 🆕 CREATED**
- **Description**: Order is created and signed on the frontend
- **Trigger**: User initiates exchange and signs the order
- **Database State**: `CREATED`
- **Secret Status**: Not revealed yet (`null`)

### **2. 🟡 PENDING_SECRET**
- **Description**: Escrow contracts deployed on both chains, waiting for secret revelation
- **Trigger**: Backend processes order and deploys escrows
- **Database State**: `PENDING_SECRET`
- **Secret Status**: Still not revealed

### **3. 🟠 PENDING_WITHDRAW**
- **Description**: Secret has been revealed, withdrawal process started
- **Trigger**: Frontend reveals the secret
- **Database State**: `PENDING_WITHDRAW`
- **Secret Status**: Secret is now stored in database

### **4. ✅ COMPLETED**
- **Description**: Exchange completed successfully, assets transferred
- **Trigger**: Backend completes withdrawal on both chains
- **Database State**: `COMPLETED`
- **Secret Status**: Secret used for withdrawal

### **5. ❌ FAILED**
- **Description**: Exchange failed at any stage
- **Trigger**: Error during any step of the process
- **Database State**: `FAILED`
- **Secret Status**: May or may not be revealed

## 🔄 Complete API Flow

```mermaid
graph TD
    A[Frontend: User Input] --> B[Create Order & Sign]
    B --> C[POST /api/order]
    C --> D[Database: CREATED]
    C --> E[Backend: Deploy Source Escrow]
    E --> F[Backend: Deploy Destination Escrow]
    F --> G[Database: PENDING_SECRET]
    G --> H[Frontend: Wait for Secret Revelation]
    H --> I[POST /api/order/secret-reveal]
    I --> J[Database: PENDING_WITHDRAW]
    I --> K[Backend: Withdraw from Destination]
    K --> L[Backend: Withdraw from Source]
    L --> M[Database: COMPLETED]
    
    C --> N[Error Handling]
    N --> O[Database: FAILED]
    I --> P[Error Handling]
    P --> O
```

## 📡 API Endpoints

### **POST `/api/order`**
**Purpose**: Create a new order and deploy escrow contracts

#### **Request Body:**
```json
{
  "order": {
    "inner": {
      "inner": {
        "makingAmount": "1000000000000000000"
      }
    }
  },
  "swapState": {
    "fromChain": 11155111,
    "toChain": 84532,
    "fromToken": {
      "address": "0x0bf8e91b08b242cd7380bc92385c90c8270b37f0",
      "symbol": "USDC"
    },
    "toToken": {
      "address": "0xbb7f72d58f5f7147cba030ba4c46a94a07e4c2ca",
      "symbol": "USDC"
    },
    "fromAmount": "1000000000000000000",
    "toAmount": "1000000000000000000",
    "userAddress": "0x123..."
  },
  "signature": "0x...",
  "immutables": { /* order immutables */ },
  "hashLock": "0x...",
  "orderHash": "0x...",
  "orderBuild": { /* order build data */ },
  "takerTraits": { /* taker traits */ },
  "srcSafetyDeposit": "1000000000000000"
}
```

#### **Response:**
```json
{
  "orderId": "clx1234567890abcdef",
  "srcEscrowEvent": [
    { /* source escrow event data */ },
    { /* destination escrow event data */ }
  ],
  "dstDeployedAt": "1754030612",
  "dstImmutablesData": { /* destination immutables */ },
  "dstImmutablesHash": "0x...",
  "srcImmutablesHash": "0x...",
  "srcImmutablesData": { /* source immutables */ },
  "transactions": {
    "orderFill": {
      "txHash": "0x6fe6befcc4d3cb587450c5ad6f25508165567a6bb77345ca5257ae4cd5d36472",
      "txLink": "https://sepolia.etherscan.io/tx/0x6fe6befcc4d3cb587450c5ad6f25508165567a6bb77345ca5257ae4cd5d36472",
      "blockHash": "0x...",
      "blockLink": "https://sepolia.etherscan.io/block/0x...",
      "chainId": 11155111,
      "description": "Order fill transaction"
    },
    "dstEscrowDeploy": {
      "txHash": "0x0ac4d269e838f1ea41969f04a29683695d8b755c8983885de1208d313ecb8b7c",
      "txLink": "https://sepolia.basescan.org/tx/0x0ac4d269e838f1ea41969f04a29683695d8b755c8983885de1208d313ecb8b7c",
      "chainId": 84532,
      "description": "Destination escrow deployment"
    }
  },
  "status": "escrow_deployed",
  "message": "Escrow contracts deployed on both chains. Waiting for secret revelation."
}
```

#### **Database Updates:**
- Creates new order with status `CREATED`
- Updates to `PENDING_SECRET` after escrow deployment
- Records `orderFill` and `dstEscrowDeploy` transactions

---

### **POST `/api/order/secret-reveal`**
**Purpose**: Reveal the secret and complete the withdrawal process

#### **Request Body:**
```json
{
  "swapState": {
    "fromChain": 11155111,
    "toChain": 84532,
    "userAddress": "0x123..."
  },
  "secret": "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
  "dstImmutablesData": { /* destination immutables data */ },
  "srcImmutablesHash": "0x...",
  "dstImmutablesHash": "0x...",
  "srcImmutablesData": { /* source immutables data */ },
  "orderId": "clx1234567890abcdef"
}
```

#### **Response:**
```json
{
  "srcEscrowAddress": "0x...",
  "dstEscrowAddress": "0x...",
  "transactions": {
    "dstWithdraw": {
      "txHash": "0x1234567890abcdef...",
      "txLink": "https://sepolia.basescan.org/tx/0x1234567890abcdef...",
      "chainId": 84532,
      "description": "Destination escrow withdrawal"
    },
    "srcWithdraw": {
      "txHash": "0xabcdef1234567890...",
      "txLink": "https://sepolia.etherscan.io/tx/0xabcdef1234567890...",
      "chainId": 11155111,
      "description": "Source escrow withdrawal"
    }
  },
  "status": "completed",
  "message": "Cross-chain exchange completed successfully! Assets have been transferred."
}
```

#### **Database Updates:**
- Updates status to `PENDING_WITHDRAW` when secret is revealed
- Stores the secret in the database
- Updates status to `COMPLETED` after withdrawal
- Records `dstWithdraw` and `srcWithdraw` transactions

---

### **GET `/api/orders`**
**Purpose**: Retrieve all orders with filtering and pagination

#### **Query Parameters:**
- `status` - Filter by order status (`CREATED`, `PENDING_SECRET`, `PENDING_WITHDRAW`, `COMPLETED`, `FAILED`)
- `userAddress` - Filter by user address
- `fromChainId` - Filter by source chain ID
- `toChainId` - Filter by destination chain ID
- `startDate` - Filter orders created after this date (ISO format)
- `endDate` - Filter orders created before this date (ISO format)
- `limit` - Number of orders to return (default: 50)
- `offset` - Number of orders to skip (default: 0)

#### **Example Requests:**
```bash
# Get all orders
GET /api/orders

# Get pending orders for a specific user
GET /api/orders?status=PENDING_SECRET&userAddress=0x123...

# Get orders from last 7 days
GET /api/orders?startDate=2024-01-01&endDate=2024-01-08

# Get orders with pagination
GET /api/orders?limit=10&offset=20

# Get completed orders for specific chains
GET /api/orders?status=COMPLETED&fromChainId=11155111&toChainId=84532
```

#### **Response:**
```json
{
  "orders": [
    {
      "id": "clx1234567890abcdef",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:05:00.000Z",
      "status": "COMPLETED",
      "fromChainId": 11155111,
      "toChainId": 84532,
      "fromToken": "0x0bf8e91b08b242cd7380bc92385c90c8270b37f0",
      "toToken": "0xbb7f72d58f5f7147cba030ba4c46a94a07e4c2ca",
      "fromAmount": "1000000000000000000",
      "toAmount": "1000000000000000000",
      "userAddress": "0x123...",
      "orderHash": "0x...",
      "secret": "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563",
      "orderFillTxHash": "0x...",
      "dstEscrowDeployTxHash": "0x...",
      "dstWithdrawTxHash": "0x...",
      "srcWithdrawTxHash": "0x...",
      "orderFillTxLink": "https://sepolia.etherscan.io/tx/0x...",
      "dstEscrowDeployTxLink": "https://sepolia.basescan.org/tx/0x...",
      "dstWithdrawTxLink": "https://sepolia.basescan.org/tx/0x...",
      "srcWithdrawTxLink": "https://sepolia.etherscan.io/tx/0x...",
      "completedAt": "2024-01-01T00:05:00.000Z",
      "failedAt": null,
      "message": "Cross-chain exchange completed successfully! Assets have been transferred.",
      "error": null,
      "metadata": null,
      "transactions": {
        "orderFill": {
          "txHash": "0x...",
          "txLink": "https://sepolia.etherscan.io/tx/0x...",
          "description": "Order fill transaction"
        },
        "dstEscrowDeploy": {
          "txHash": "0x...",
          "txLink": "https://sepolia.basescan.org/tx/0x...",
          "description": "Destination escrow deployment"
        },
        "dstWithdraw": {
          "txHash": "0x...",
          "txLink": "https://sepolia.basescan.org/tx/0x...",
          "description": "Destination escrow withdrawal"
        },
        "srcWithdraw": {
          "txHash": "0x...",
          "txLink": "https://sepolia.etherscan.io/tx/0x...",
          "description": "Source escrow withdrawal"
        }
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "status": "COMPLETED",
    "userAddress": "0x123...",
    "fromChainId": 11155111,
    "toChainId": 84532,
    "startDate": "2024-01-01",
    "endDate": "2024-01-08"
  }
}
```

## 🔄 State Transitions

### **Frontend → Backend Flow:**

1. **Order Creation** (`CREATED`)
   ```javascript
   // Frontend creates and signs order
   const order = await createOrder(swapState);
   const signature = await signTypedDataAsync(order.order.getTypedData(swapState.fromChain));
   
   // Send to backend
   const response = await fetch('/api/order', {
     method: 'POST',
     body: JSON.stringify({
       order: order.order,
       swapState: swapState,
       signature: signature,
       // ... other order data
     })
   });
   ```

2. **Secret Revelation** (`PENDING_SECRET` → `PENDING_WITHDRAW` → `COMPLETED`)
   ```javascript
   // Frontend reveals secret
   const secretRevealResponse = await fetch('/api/order/secret-reveal', {
     method: 'POST',
     body: JSON.stringify({
       swapState: swapState,
       secret: secret,
       orderId: response.orderId,
       // ... other data from initial response
     })
   });
   ```

### **Backend Processing:**

1. **Order Processing** (`CREATED` → `PENDING_SECRET`)
   - Validate order and signature
   - Deploy source escrow contract
   - Deploy destination escrow contract
   - Update database status

2. **Secret Processing** (`PENDING_SECRET` → `PENDING_WITHDRAW` → `COMPLETED`)
   - Validate secret revelation
   - Withdraw from destination escrow
   - Withdraw from source escrow
   - Update database status

## 🛡️ Error Handling

### **Database Error States:**
```json
{
  "status": "FAILED",
  "failedAt": "2024-01-01T00:03:00.000Z",
  "error": "Transaction failed: insufficient funds",
  "message": "Exchange failed due to insufficient funds"
}
```

### **Common Error Scenarios:**
- **Order Creation Failures**: Invalid signature, insufficient funds, network issues
- **Escrow Deployment Failures**: Gas estimation errors, contract deployment failures
- **Secret Revelation Failures**: Invalid secret, withdrawal failures
- **Network Failures**: RPC timeouts, chain synchronization issues

## 📊 Monitoring & Logging

### **Console Logs:**
```javascript
// Order creation
console.log("🚀 Starting cross-chain exchange process...");
console.log("💾 Order created in database with ID:", dbOrder.id);
console.log("✅ Order filled successfully:", orderFillHash);
console.log("🔄 Order status updated to PENDING_SECRET");

// Secret revelation
console.log("🔍 Calculating escrow addresses...");
console.log("🔄 Order status updated to PENDING_WITHDRAW");
console.log("✅ Order status updated to COMPLETED");
```

### **Transaction Tracking:**
- All transactions are logged with hashes and links
- Block explorer links provided for verification
- Complete audit trail maintained in database

## 🔒 Security Considerations

### **Secret Management:**
- Secret is only stored after revelation
- Secret is used immediately for withdrawal
- No long-term storage of sensitive data

### **Transaction Validation:**
- All signatures are validated
- Order integrity is verified
- Escrow addresses are calculated securely

### **Error Recovery:**
- Failed orders are marked appropriately
- Error details are preserved for debugging
- No partial state corruption

## 🚀 Production Deployment

### **Environment Variables:**
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### **Database Setup:**
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio (optional)
pnpm db:studio
```

### **API Testing:**
```bash
# Test order creation
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"swapState": {...}}'

# Test order retrieval
curl http://localhost:3000/api/orders?status=COMPLETED
```

---

**This API flow ensures a secure, reliable, and traceable cross-chain exchange process with complete audit trails and error handling.** 