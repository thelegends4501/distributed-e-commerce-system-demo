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

## 🏗️ Distributed Systems Concepts

### 1. **Microservices Architecture**

The platform is decomposed into independent, loosely-coupled services:

- **API Gateway**: Entry point for all client requests, routes traffic to appropriate services
- **Auth Service**: Handles user authentication and authorization with session management
- **Inventory Service**: Manages product stock levels and availability checks
- **Order Service**: Processes customer orders and manages order lifecycle
- **Payment Service**: Handles payment processing and transaction verification

**Benefits for E-Commerce:**
- **Scalability**: Each service can scale independently based on demand (e.g., scale Order Service during Black Friday)
- **Fault Isolation**: If Payment Service fails, customers can still browse products and add to cart
- **Technology Flexibility**: Each service can use optimal technology (e.g., use caching for Inventory, queues for Orders)
- **Team Autonomy**: Different teams can develop and deploy services independently

### 2. **Load Balancing**

Intelligent traffic distribution across multiple service instances:

- **Round-Robin Algorithm**: Distributes requests evenly across healthy service instances
- **Health-Based Routing**: Automatically removes unhealthy instances from rotation
- **Dynamic Instance Management**: Add/remove service instances based on load

**Benefits for E-Commerce:**
- **High Availability**: No single point of failure - if one instance crashes, others handle traffic
- **Performance**: Distributes load to prevent any single instance from being overwhelmed
- **Cost Efficiency**: Scale instances up during peak hours, down during off-peak

### 3. **Fault Tolerance & Recovery**

Built-in mechanisms to handle failures gracefully:

- **Health Checks**: Continuous monitoring of service availability
- **Automatic Failover**: Redirect traffic from failed instances to healthy ones
- **Circuit Breaker Pattern**: Prevent cascading failures by temporarily blocking requests to failing services
- **Graceful Degradation**: System continues operating with reduced functionality during partial failures

**Benefits for E-Commerce:**
- **Business Continuity**: Platform stays operational even during component failures
- **Customer Trust**: Minimal downtime maintains customer confidence
- **Revenue Protection**: Orders continue processing during infrastructure issues

### 4. **Priority-Based Processing**

Two-tier order processing system:

- **VIP Orders**: High-priority queue with faster processing and dedicated resources
- **Normal Orders**: Standard priority queue for regular customers
- **Dynamic Resource Allocation**: VIP orders get preferential service instance assignment

**Benefits for E-Commerce:**
- **Customer Segmentation**: Premium customers get enhanced service quality
- **Revenue Optimization**: Incentivizes customers to upgrade to VIP status
- **SLA Management**: Different service level agreements for different customer tiers

### 5. **Data Consistency**

Multiple consistency models for different use cases:

- **Strong Consistency**: Ensures all replicas have the same data (critical for inventory)
- **Eventual Consistency**: Allows temporary inconsistencies for better performance (suitable for product reviews)
- **Inventory Synchronization**: Real-time stock level updates across all services

**Benefits for E-Commerce:**
- **Prevent Overselling**: Strong consistency ensures accurate inventory counts
- **Better Performance**: Eventual consistency for non-critical data improves response times
- **Flexible Trade-offs**: Choose appropriate consistency level based on business requirements

### 6. **Real-Time Monitoring & Observability**

Comprehensive system visibility:

- **Service Health Dashboard**: Real-time status of all microservices
- **Load Distribution Metrics**: View traffic distribution across instances
- **Order Queue Visualization**: Monitor pending orders and processing rates
- **System Logs**: Centralized logging for debugging and auditing

**Benefits for E-Commerce:**
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