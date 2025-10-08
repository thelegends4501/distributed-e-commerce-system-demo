# Distributed E-Commerce System

A production-ready distributed e-commerce platform demonstrating advanced distributed systems concepts including microservices architecture, load balancing, fault tolerance, and priority-based order processing.

## 🎯 Project Overview

This project showcases a modern e-commerce platform built with distributed systems principles at its core. It features a real-time admin dashboard for monitoring microservices, processing orders with priority queuing (VIP vs normal), and maintaining system reliability through fault tolerance mechanisms.

**Live Demo Features:**
- 🛍️ Customer-facing shop with product catalog and shopping cart
- 📊 Real-time admin dashboard with service health monitoring
- 🎫 VIP and normal order priority queuing
- 📦 Inventory management with consistency controls
- 🔧 System controls for fault injection and load balancing configuration

## 🚀 User Journey: From Landing Page to Order Completion

### Step 1: Landing Page & Authentication
**User Action**: User arrives at the homepage (`/`)

**Distributed Systems Flow**:
```
1. Browser requests homepage
2. API Gateway receives request
3. Auth Service validates session token (if present)
   ├─ Token valid → Return user session
   └─ No token → Return guest session
4. Load Balancer distributes session validation across Auth Service instances
5. Homepage renders with personalized content
```

**Key Concepts Applied**:
- **Load Balancing**: Session validation requests distributed across multiple Auth Service instances
- **Caching**: Frequently accessed user sessions cached for faster retrieval
- **Fault Tolerance**: If one Auth instance fails, request automatically routed to healthy instance

---

### Step 2: User Registration/Login
**User Action**: User clicks "Register" or "Login" button

**Distributed Systems Flow**:
```
Registration Flow:
1. User submits registration form (/register)
2. API Gateway routes to Auth Service
3. Auth Service validates email uniqueness
   ├─ Check distributed cache first (fast path)
   └─ Query database if cache miss (slow path)
4. Password hashed using bcrypt
5. User record created with strong consistency
6. Session token generated and stored
7. Bearer token returned to client

Login Flow:
1. User submits credentials (/login)
2. Load Balancer selects healthy Auth Service instance
3. Password verification performed
4. Session created with expiration time
5. Session replicated across Auth Service instances
6. Token returned and stored in localStorage
```

**Key Concepts Applied**:
- **Strong Consistency**: User creation is ACID-compliant to prevent duplicate accounts
- **Session Replication**: Session data replicated across Auth instances for fault tolerance
- **Load Balancing**: Login requests distributed evenly to prevent Auth Service overload

---

### Step 3: Browsing Product Catalog
**User Action**: User navigates to Shop page (`/shop`)

**Distributed Systems Flow**:
```
1. Browser requests product list
2. API Gateway routes to Inventory Service
3. Load Balancer selects instance using Round-Robin algorithm
   ├─ Instance 1: 33% of traffic
   ├─ Instance 2: 33% of traffic
   └─ Instance 3: 34% of traffic
4. Inventory Service queries database
   ├─ Check read replica first (eventual consistency)
   └─ If critical data needed, query master (strong consistency)
5. Product data cached with TTL (Time To Live)
6. Response returned through API Gateway
7. Frontend renders product cards
```

**Key Concepts Applied**:
- **Eventual Consistency**: Product catalog can tolerate slight delays in updates for better performance
- **Read Replicas**: Database queries distributed across replicas to reduce master load
- **Caching**: Product data cached with 5-minute TTL to reduce database queries
- **Load Balancing**: Traffic distributed across multiple Inventory Service instances

**Performance Optimization**:
- **Cache Hit**: Response time ~50ms
- **Cache Miss**: Response time ~200ms (includes database query)

---

### Step 4: Adding Items to Cart
**User Action**: User clicks "Add to Cart" on product card

**Distributed Systems Flow**:
```
1. Frontend sends POST request to /api/cart
2. API Gateway validates bearer token
3. Load Balancer routes to available Cart Service instance
4. Cart Service performs inventory check:
   ├─ Query Inventory Service for stock availability
   ├─ If stock > 0: Reserve item temporarily (soft lock)
   └─ If stock = 0: Return out-of-stock error
5. Cart item saved with eventual consistency
6. Cart state replicated to session storage for offline access
7. Real-time UI update with optimistic rendering
```

**Key Concepts Applied**:
- **Optimistic UI**: Frontend immediately shows item in cart, rollback if request fails
- **Soft Locking**: Temporary inventory reservation (15-minute TTL) to prevent overselling
- **Eventual Consistency**: Cart updates don't require immediate global consistency
- **Service Communication**: Cart Service communicates with Inventory Service via REST API

**Error Handling**:
- **Service Timeout**: If Inventory Service doesn't respond in 3 seconds, return cached stock data
- **Network Failure**: Cart saved locally, synced when connection restored

---

### Step 5: Viewing Cart and Checkout
**User Action**: User clicks cart icon and proceeds to checkout

**Distributed Systems Flow**:
```
1. Browser requests /cart page
2. Cart Service aggregates cart items from:
   ├─ Database (persistent storage)
   └─ Session storage (temporary storage)
3. For each cart item, query Inventory Service for real-time stock
4. Load Balancer distributes inventory checks across instances
5. Calculate total price with pricing rules
6. Display cart summary with availability status
```

**Key Concepts Applied**:
- **Data Aggregation**: Cart data aggregated from multiple sources (DB + session)
- **Real-Time Validation**: Stock checked in real-time to prevent overselling at checkout
- **Distributed Queries**: Multiple inventory checks parallelized for faster response

---

### Step 6: Order Placement
**User Action**: User clicks "Place Order" button

**Distributed Systems Flow** (Critical Path):
```
1. Frontend sends POST /api/e-commerce/orders with order details
2. API Gateway validates authentication and authorization
3. Load Balancer routes to Order Service based on:
   ├─ User tier (VIP or Normal)
   ├─ Current instance load
   └─ Geographic proximity
4. Order Service initiates distributed transaction:

   Step 4.1 - Inventory Deduction (Strong Consistency):
   ├─ Lock inventory records in database
   ├─ Check stock availability
   ├─ Deduct stock quantity atomically
   └─ If insufficient stock: ROLLBACK and return error

   Step 4.2 - Payment Processing:
   ├─ Call Payment Service with transaction details
   ├─ Payment Service validates card/payment method
   ├─ Process payment with external provider (Stripe)
   ├─ If payment fails: ROLLBACK inventory deduction

   Step 4.3 - Order Creation:
   ├─ Create order record with PENDING status
   ├─ Assign to priority queue:
   │  ├─ VIP Orders → High-priority queue
   │  └─ Normal Orders → Standard-priority queue
   ├─ Generate order confirmation ID
   └─ Commit transaction

5. Saga Pattern for Distributed Transaction:
   ├─ Success: All services commit changes
   └─ Failure: Compensating transactions rollback changes
   
6. Order Processing Queue:
   ├─ VIP Queue (Priority 1): Processed first
   │  └─ Dedicated worker threads
   └─ Normal Queue (Priority 2): Processed after VIP
      └─ Shared worker threads

7. Asynchronous notifications:
   ├─ Send order confirmation email
   ├─ Update admin dashboard in real-time
   └─ Log transaction to centralized logging system
```

**Key Concepts Applied**:
- **Two-Phase Commit (2PC)**: Ensures atomicity across Inventory, Payment, and Order services
- **Saga Pattern**: Coordinates distributed transaction with compensating actions on failure
- **Strong Consistency**: Inventory deduction uses database locks to prevent race conditions
- **Priority Queuing**: VIP orders processed with higher priority (demonstrated in admin dashboard)
- **Idempotency**: Duplicate order submissions detected using idempotency keys

**Failure Scenarios**:
- **Inventory Lock Timeout**: If lock can't be acquired in 5 seconds, return "High traffic, try again"
- **Payment Service Down**: Circuit breaker opens after 3 failures, show maintenance message
- **Partial Commit**: Saga coordinator rolls back completed steps automatically

---

### Step 7: Order Confirmation & Tracking
**User Action**: User receives order confirmation and navigates to `/orders`

**Distributed Systems Flow**:
```
1. Order Service publishes "ORDER_CREATED" event to message queue
2. Notification Service subscribes to event and sends email
3. Inventory Service subscribes to event and triggers reorder if stock low
4. Admin Dashboard subscribes to event and updates real-time monitor

User views order history:
1. GET /api/orders with user authentication
2. Load Balancer routes to Order Service instance
3. Query order database with user_id filter
4. Aggregate order data with:
   ├─ Product details from Inventory Service
   ├─ Payment status from Payment Service
   └─ Shipping status from external shipping API
5. Return paginated order list
```

**Key Concepts Applied**:
- **Event-Driven Architecture**: Services communicate via publish-subscribe pattern
- **Eventual Consistency**: Order status updates propagated asynchronously
- **Data Aggregation**: Order details combined from multiple microservices
- **Pagination**: Large result sets split into pages to reduce load

---

## 🔗 Backend-to-Dashboard Integration: Real-Time Monitoring Architecture

The administrative dashboard (`/admin`) provides real-time visibility into the distributed system's operation. Here's how backend components connect to the dashboard:

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Dashboard (Frontend)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Service   │  │   Order    │  │ Inventory  │  │  System   │ │
│  │  Monitor   │  │ Interface  │  │  Control   │  │ Controls  │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         │ Polling       │ REST API      │ REST API      │ REST API
         │ (1s interval) │ Calls         │ Calls         │ Calls
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Route: /api/services/health | /api/services/config      │   │
│  │  Route: /api/e-commerce/orders                           │   │
│  │  Route: /api/inventory                                   │   │
│  │  Route: /api/logs                                        │   │
│  └────────┬─────────────────┬───────────────┬───────────────┘   │
└───────────┼─────────────────┼───────────────┼───────────────────┘
            │                 │               │
            ▼                 ▼               ▼
┌────────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  Service Registry  │  │ Order Processor │  │ Inventory Manager│
│  - Health checks   │  │ - VIP queue     │  │ - Stock levels   │
│  - Load balancer   │  │ - Normal queue  │  │ - Sync control   │
│  - Instance state  │  │ - Processing    │  │ - Consistency    │
└────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database Layer (Turso)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ service_logs │  │    orders    │  │      products        │  │
│  │ - timestamp  │  │ - status     │  │      inventory       │  │
│  │ - service    │  │ - priority   │  │      (stock count)   │  │
│  │ - message    │  │ - user_id    │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component 1: Service Monitor (Real-Time Health Tracking)

**Purpose**: Displays live status of all microservices with instance-level granularity

**Integration Flow**:
```typescript
// Frontend Component (ServiceMonitor.tsx)
useEffect(() => {
  const fetchHealth = async () => {
    const response = await fetch('/api/services/health');
    const data = await response.json();
    setServiceHealth(data);
  };
  
  // Poll every 1 second for real-time updates
  const interval = setInterval(fetchHealth, 1000);
  return () => clearInterval(interval);
}, []);

// Backend API (/api/services/health/route.ts)
export async function GET() {
  const services = ['auth', 'inventory', 'order', 'payment'];
  const healthData = await Promise.all(
    services.map(async (service) => {
      const instances = await getServiceInstances(service);
      return {
        name: service,
        instances: instances.map(instance => ({
          id: instance.id,
          status: instance.healthy ? 'healthy' : 'unhealthy',
          load: instance.requestCount,
          lastHeartbeat: instance.lastChecked
        }))
      };
    })
  );
  return Response.json(healthData);
}
```

**Distributed Systems Concepts**:
- **Health Checks**: Each service instance sends heartbeat every 500ms
- **Failure Detection**: Instance marked unhealthy if no heartbeat for 2 seconds
- **Load Visibility**: Request count per instance shows load distribution
- **Service Discovery**: Dashboard automatically detects new instances joining cluster

**Data Flow**:
1. Service instances register with Service Registry on startup
2. Health check endpoint queries Service Registry every second
3. Load Balancer reports request distribution per instance
4. Dashboard aggregates data and renders visual indicators (green/red/yellow)

---

### Component 2: Order Interface (Priority Queue Management)

**Purpose**: Allows admins to place test orders and visualize VIP vs normal queue processing

**Integration Flow**:
```typescript
// Frontend Component (OrderInterface.tsx)
const placeOrder = async (priority: 'vip' | 'normal') => {
  const response = await fetch('/api/e-commerce/orders', {
    method: 'POST',
    body: JSON.stringify({
      userId: currentUser.id,
      priority: priority,
      items: selectedProducts,
      idempotencyKey: generateKey()
    })
  });
  
  // Optimistically update UI
  setQueueCount(prev => ({
    ...prev,
    [priority]: prev[priority] + 1
  }));
};

// Backend API (/api/e-commerce/orders/route.ts)
export async function POST(request: Request) {
  const { userId, priority, items, idempotencyKey } = await request.json();
  
  // Check idempotency to prevent duplicate orders
  const existing = await checkIdempotencyKey(idempotencyKey);
  if (existing) return Response.json(existing);
  
  // Enqueue order with priority
  const order = await orderQueue.enqueue({
    userId,
    items,
    priority: priority === 'vip' ? 1 : 2,
    timestamp: Date.now()
  });
  
  // Log to centralized logging system
  await logEvent('ORDER_CREATED', {
    orderId: order.id,
    priority,
    userId
  });
  
  return Response.json({ orderId: order.id, queuePosition: order.position });
}
```

**Distributed Systems Concepts**:
- **Priority Queuing**: VIP orders processed first using heap data structure
- **Idempotency**: Duplicate order detection using unique keys prevents double-charging
- **Queue Visibility**: Dashboard shows queue depth for each priority level
- **Async Processing**: Orders processed by background workers, not blocking API response

**Processing Logic**:
```typescript
// Order Processor Worker
class OrderProcessor {
  async processQueue() {
    while (true) {
      // Process VIP queue first
      const vipOrder = await orderQueue.dequeue('vip');
      if (vipOrder) {
        await this.processOrder(vipOrder);
        await this.updateDashboard(vipOrder);
        continue;
      }
      
      // Process normal queue only if VIP queue empty
      const normalOrder = await orderQueue.dequeue('normal');
      if (normalOrder) {
        await this.processOrder(normalOrder);
        await this.updateDashboard(normalOrder);
      }
      
      await sleep(100); // Prevent busy-waiting
    }
  }
  
  async updateDashboard(order) {
    // Emit event to dashboard via long-polling or WebSocket
    await fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify({
        service: 'order',
        level: 'info',
        message: `Processed ${order.priority} order ${order.id}`
      })
    });
  }
}
```

**Dashboard View**:
- **Queue Depth**: Shows count of pending VIP and normal orders
- **Processing Rate**: Orders per second for each priority level
- **Average Wait Time**: Time from order placement to processing start

---

### Component 3: Inventory Control (Stock Synchronization)

**Purpose**: Manages product inventory with real-time updates across all service instances

**Integration Flow**:
```typescript
// Frontend Component (InventoryControl.tsx)
const updateStock = async (productId: number, quantity: number) => {
  // Optimistic UI update
  setInventory(prev => 
    prev.map(item => 
      item.id === productId 
        ? { ...item, stock: quantity }
        : item
    )
  );
  
  const response = await fetch('/api/inventory', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity })
  });
  
  if (!response.ok) {
    // Rollback optimistic update on failure
    await fetchInventory(); // Re-fetch from source of truth
  }
};

// Backend API (/api/inventory/route.ts)
export async function PUT(request: Request) {
  const { productId, quantity } = await request.json();
  
  // Use database transaction for strong consistency
  const result = await db.transaction(async (tx) => {
    // Lock row to prevent concurrent updates
    const product = await tx
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .for('update'); // PostgreSQL row lock
    
    // Update stock quantity
    await tx
      .update(products)
      .set({ stock: quantity, updatedAt: new Date() })
      .where(eq(products.id, productId));
    
    return product;
  });
  
  // Invalidate caches across all Inventory Service instances
  await broadcastCacheInvalidation('inventory', productId);
  
  // Notify Order Service of stock changes
  await publishEvent('INVENTORY_UPDATED', {
    productId,
    newQuantity: quantity,
    timestamp: Date.now()
  });
  
  return Response.json({ success: true });
}
```

**Distributed Systems Concepts**:
- **Strong Consistency**: Database transactions with row-level locking prevent race conditions
- **Cache Invalidation**: All service instances notified to refresh cached inventory data
- **Event-Driven Sync**: Order Service subscribes to inventory updates to prevent overselling
- **Optimistic Locking**: Version numbers detect conflicting concurrent updates

**Synchronization Mechanism**:
```typescript
// Cache Invalidation Broadcast
async function broadcastCacheInvalidation(cacheKey: string, id: number) {
  const instances = await getServiceInstances('inventory');
  
  await Promise.all(
    instances.map(instance =>
      fetch(`http://${instance.host}/internal/cache/invalidate`, {
        method: 'POST',
        body: JSON.stringify({ key: cacheKey, id })
      })
    )
  );
}
```

**Dashboard View**:
- **Current Stock**: Real-time stock levels for all products
- **Pending Updates**: Shows in-flight inventory synchronizations
- **Consistency Mode**: Toggle between strong and eventual consistency for testing

---

### Component 4: System Controls (Fault Injection & Configuration)

**Purpose**: Allows admins to test system resilience by injecting failures and changing configurations

**Integration Flow**:
```typescript
// Frontend Component (SystemControls.tsx)
const toggleService = async (service: string, instanceId: string, enabled: boolean) => {
  await fetch('/api/services/config', {
    method: 'POST',
    body: JSON.stringify({
      action: enabled ? 'enable' : 'disable',
      service,
      instanceId
    })
  });
  
  // Dashboard automatically updates via polling
};

// Backend API (/api/services/config/route.ts)
export async function POST(request: Request) {
  const { action, service, instanceId } = await request.json();
  
  if (action === 'disable') {
    // Mark instance as unhealthy
    await serviceRegistry.markUnhealthy(service, instanceId);
    
    // Load Balancer automatically removes from rotation
    await loadBalancer.removeInstance(service, instanceId);
    
    // Log fault injection event
    await logEvent('FAULT_INJECTION', {
      service,
      instanceId,
      action: 'disabled'
    });
  } else {
    // Re-enable instance
    await serviceRegistry.markHealthy(service, instanceId);
    await loadBalancer.addInstance(service, instanceId);
  }
  
  return Response.json({ success: true });
}
```

**Distributed Systems Concepts Demonstrated**:
- **Fault Injection**: Admins can simulate service failures to test resilience
- **Automatic Failover**: Load Balancer redirects traffic from failed instances
- **Circuit Breaker**: After 3 consecutive failures, service marked down automatically
- **Health Recovery**: Instances automatically rejoin pool after health checks pass

**Configuration Options**:
1. **Enable/Disable Service Instances**: Test fault tolerance
2. **Adjust Load Balancing Algorithm**: Switch between Round-Robin, Least-Connections, etc.
3. **Set Consistency Mode**: Toggle strong vs eventual consistency
4. **Configure Priority Weights**: Adjust VIP vs normal order processing ratios

---

### Component 5: Server Logs (Centralized Logging)

**Purpose**: Aggregates logs from all microservices for debugging and auditing

**Integration Flow**:
```typescript
// Frontend Component (ServerLogs.tsx)
useEffect(() => {
  const fetchLogs = async () => {
    const response = await fetch('/api/logs?limit=100');
    const logs = await response.json();
    setLogs(logs);
  };
  
  // Poll every 2 seconds
  const interval = setInterval(fetchLogs, 2000);
  return () => clearInterval(interval);
}, []);

// Backend API (/api/logs/route.ts)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  
  // Query logs with pagination
  const logs = await db
    .select()
    .from(serviceLogs)
    .orderBy(desc(serviceLogs.timestamp))
    .limit(limit);
  
  return Response.json(logs);
}

export async function POST(request: Request) {
  const { service, level, message } = await request.json();
  
  // Insert log entry
  await db.insert(serviceLogs).values({
    service,
    level,
    message,
    timestamp: new Date()
  });
  
  return Response.json({ success: true });
}
```

**Distributed Systems Concepts**:
- **Centralized Logging**: All services write to single log aggregation point
- **Structured Logging**: Logs include service name, timestamp, level, and message
- **Log Correlation**: Trace requests across services using correlation IDs
- **Real-Time Streaming**: Dashboard polls logs for near-real-time visibility

**Log Schema**:
```sql
CREATE TABLE service_logs (
  id INTEGER PRIMARY KEY,
  service TEXT NOT NULL,      -- Which service generated this log
  level TEXT NOT NULL,         -- info, warn, error
  message TEXT NOT NULL,       -- Human-readable message
  metadata JSON,               -- Additional structured data
  correlation_id TEXT,         -- Trace requests across services
  timestamp DATETIME NOT NULL
);
```

**Dashboard View**:
- **Live Log Stream**: Auto-scrolling log output
- **Filtering**: Filter by service, level, or keyword
- **Correlation**: Click correlation ID to see all related logs across services

---

## 🎯 Distributed Systems in Action: Complete Request Flow

Let's trace a VIP order from placement to completion, showing how all components interact:

```
1. User places VIP order on /shop
   ├─ Frontend: POST /api/e-commerce/orders
   └─ Dashboard: Order appears in VIP queue (OrderInterface component)

2. API Gateway receives request
   ├─ Validates bearer token with Auth Service
   ├─ Load Balancer selects Order Service instance #2 (least loaded)
   └─ Dashboard: Instance #2 request count increases (ServiceMonitor component)

3. Order Service processes order
   ├─ Deduct inventory (calls Inventory Service)
   │  ├─ Inventory Service uses database lock (strong consistency)
   │  ├─ Stock updated: 100 → 99
   │  └─ Dashboard: Stock count updates (InventoryControl component)
   ├─ Process payment (calls Payment Service)
   │  ├─ Payment Service calls Stripe API
   │  └─ Log: "Payment processed for order #123"
   ├─ Create order record in database
   └─ Enqueue order in VIP priority queue

4. Order Processor Worker (background)
   ├─ Dequeues VIP order #123 (priority: 1)
   ├─ Processes order ahead of 5 pending normal orders
   ├─ Updates order status: PENDING → PROCESSING → COMPLETED
   └─ Log: "VIP order #123 completed in 2.3 seconds"

5. Dashboard updates in real-time
   ├─ ServiceMonitor: Shows healthy services and load distribution
   ├─ OrderInterface: VIP queue depth decreases from 3 to 2
   ├─ InventoryControl: Stock count reflects new inventory
   ├─ ServerLogs: Shows complete audit trail of order processing
   └─ System Controls: Displays no active faults

6. User receives confirmation
   ├─ Order status visible on /orders page
   └─ Email notification sent via Notification Service
```

**Key Takeaways**:
- **Distributed Coordination**: Multiple services coordinated via API calls and event publishing
- **Real-Time Visibility**: Admin dashboard provides complete system observability
- **Fault Tolerance**: If Payment Service fails, Saga pattern rolls back inventory deduction
- **Priority Processing**: VIP order processed before normal orders in queue
- **Strong Consistency**: Inventory updates use database transactions to prevent overselling
- **Load Balancing**: Request distributed across healthy service instances automatically

## 🏗️ Distributed Systems Concepts

### 1. **Microservices Architecture**

The platform is decomposed into independent, loosely-coupled services:

- **API Gateway**: Entry point for all client requests, routes traffic to appropriate services
- **Auth Service**: Handles user authentication and authorization with session management
- **Inventory Service**: Manages product stock levels and availability checks
- **Order Service**: Processes customer orders and manages order lifecycle
- **Payment Service**: Handles payment processing and transaction verification

**Benefits for E-Commerce**:
- **Scalability**: Each service can scale independently based on demand (e.g., scale Order Service during Black Friday)
- **Fault Isolation**: If Payment Service fails, customers can still browse products and add to cart
- **Technology Flexibility**: Each service can use optimal technology (e.g., use caching for Inventory, queues for Orders)
- **Team Autonomy**: Different teams can develop and deploy services independently

### 2. **Load Balancing**

Intelligent traffic distribution across multiple service instances:

- **Round-Robin Algorithm**: Distributes requests evenly across healthy service instances
- **Health-Based Routing**: Automatically removes unhealthy instances from rotation
- **Dynamic Instance Management**: Add/remove service instances based on load

**Benefits for E-Commerce**:
- **High Availability**: No single point of failure - if one instance crashes, others handle traffic
- **Performance**: Distributes load to prevent any single instance from being overwhelmed
- **Cost Efficiency**: Scale instances up during peak hours, down during off-peak

### 3. **Fault Tolerance & Recovery**

Built-in mechanisms to handle failures gracefully:

- **Health Checks**: Continuous monitoring of service availability
- **Automatic Failover**: Redirect traffic from failed instances to healthy ones
- **Circuit Breaker Pattern**: Prevent cascading failures by temporarily blocking requests to failing services
- **Graceful Degradation**: System continues operating with reduced functionality during partial failures

**Benefits for E-Commerce**:
- **Business Continuity**: Platform stays operational even during component failures
- **Customer Trust**: Minimal downtime maintains customer confidence
- **Revenue Protection**: Orders continue processing during infrastructure issues

### 4. **Priority-Based Processing**

Two-tier order processing system:

- **VIP Orders**: High-priority queue with faster processing and dedicated resources
- **Normal Orders**: Standard priority queue for regular customers
- **Dynamic Resource Allocation**: VIP orders get preferential service instance assignment

**Benefits for E-Commerce**:
- **Customer Segmentation**: Premium customers get enhanced service quality
- **Revenue Optimization**: Incentivizes customers to upgrade to VIP status
- **SLA Management**: Different service level agreements for different customer tiers

### 5. **Data Consistency**

Multiple consistency models for different use cases:

- **Strong Consistency**: Ensures all replicas have the same data (critical for inventory)
- **Eventual Consistency**: Allows temporary inconsistencies for better performance (suitable for product reviews)
- **Inventory Synchronization**: Real-time stock level updates across all services

**Benefits for E-Commerce**:
- **Prevent Overselling**: Strong consistency ensures accurate inventory counts
- **Better Performance**: Eventual consistency for non-critical data improves response times
- **Flexible Trade-offs**: Choose appropriate consistency level based on business requirements

### 6. **Real-Time Monitoring & Observability**

Comprehensive system visibility:

- **Service Health Dashboard**: Real-time status of all microservices
- **Load Distribution Metrics**: View traffic distribution across instances
- **Order Queue Visualization**: Monitor pending orders and processing rates
- **System Logs**: Centralized logging for debugging and auditing

**Benefits for E-Commerce**:
- **Proactive Issue Detection**: Identify problems before customers are affected
- **Performance Optimization**: Data-driven decisions for resource allocation
- **Business Intelligence**: Insights into order patterns and system bottlenecks

## 🛠️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Components**: Shadcn/UI with Tailwind CSS
- **State Management**: React hooks with real-time WebSocket updates
- **Authentication**: Better-auth with session management

### Backend
- **Database**: Turso (LibSQL) with Drizzle ORM
- **API Layer**: Next.js API Routes
- **Session Storage**: Database-backed sessions with bearer tokens
- **Image Storage**: Supabase Storage

### Microservices Simulation
- **Service Registry**: Dynamic service discovery and health tracking
- **Load Balancer**: Round-robin algorithm with health-aware routing
- **Order Processor**: Priority queue implementation with VIP/normal segregation
- **Inventory Manager**: Real-time stock synchronization with consistency controls

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Turso database account (for production) or local SQLite (for development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd distributed-ecommerce
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up environment variables**
```bash
# Copy .env.example to .env and configure:
DATABASE_URL=<your-turso-database-url>
DATABASE_AUTH_TOKEN=<your-turso-auth-token>
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
BETTER_AUTH_URL=http://localhost:3000
```

4. **Run database migrations**
```bash
npm run db:push
```

5. **Seed the database** (optional)
```bash
npm run db:seed
```

6. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/              # Admin dashboard for system monitoring
│   ├── shop/               # Customer-facing product catalog
│   ├── cart/               # Shopping cart management
│   ├── orders/             # Order history and tracking
│   ├── login/              # Authentication pages
│   └── api/                # API routes for all services
│       ├── services/       # Microservices management APIs
│       ├── inventory/      # Inventory management APIs
│       ├── e-commerce/     # Order processing APIs
│       └── products/       # Product catalog APIs
├── components/
│   ├── ServiceMonitor.tsx  # Real-time service health display
│   ├── OrderInterface.tsx  # Order placement with priority selection
│   ├── InventoryControl.tsx # Inventory management interface
│   ├── SystemControls.tsx  # Fault injection & load balancing controls
│   └── ServerLogs.tsx      # Centralized log viewer
├── db/
│   ├── schema.ts           # Database schema definitions
│   └── seeds/              # Database seeder files
└── lib/
    └── services/           # Service layer logic and utilities
```

## 🎮 Key Features

### Customer Features
- **Product Catalog**: Browse products with categories and search
- **Shopping Cart**: Add/remove items with real-time stock validation
- **Order Placement**: Place orders with automatic priority assignment
- **Order Tracking**: View order history and current status

### Admin Features
- **Service Monitor**: Real-time health status of all microservices
- **Load Balancing Visualization**: See traffic distribution across instances
- **Order Management**: Process VIP and normal orders with queue visibility
- **Inventory Control**: Adjust stock levels and sync across services
- **System Controls**: 
  - Enable/disable services for fault injection testing
  - Configure load balancing strategies
  - Toggle consistency modes (strong vs eventual)
  - View centralized system logs

### Distributed Systems Demonstrations
- **Fault Tolerance**: Disable services and watch automatic failover
- **Load Distribution**: See how requests are balanced across instances
- **Priority Processing**: Submit VIP and normal orders to see queue behavior
- **Consistency Models**: Test strong vs eventual consistency with inventory updates

## 🧪 Testing Distributed Systems Concepts

### Test Fault Tolerance
1. Navigate to `/admin`
2. Disable an Order Service instance
3. Place an order - it will automatically route to healthy instances
4. Re-enable the instance and watch it rejoin the pool

### Test Load Balancing
1. Monitor the Service Status panel
2. Place multiple orders rapidly
3. Observe request count distribution across instances

### Test Priority Queuing
1. Create VIP orders and normal orders
2. Watch the order queues in the dashboard
3. Note how VIP orders are processed faster

### Test Consistency
1. Toggle consistency mode in System Controls
2. Update inventory in one service
3. Observe synchronization behavior across services

## 📚 Learn More

This project demonstrates practical implementations of concepts from:
- Distributed Systems Design Patterns
- Microservices Architecture
- Cloud-Native Application Development
- E-Commerce Platform Engineering

For more on Next.js:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## 🚢 Deployment

Deploy on [Vercel](https://vercel.com):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Ensure environment variables are configured in your Vercel project settings.

## 📝 License

MIT License - feel free to use this project for learning and commercial purposes.

---

Built with ❤️ to demonstrate distributed systems in action