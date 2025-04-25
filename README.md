# 7th Heaven Bakery System

This is a containerized bakery management system that includes a PostgreSQL database, a backend API service consisting of 3 api endpoints, a frontend web application developed with html,css and js, and RabbitMQ for message queuing.

## System Architecture

The system consists of four main components:

1. **PostgreSQL Database**: Stores information about bakery products and customer orders along with ordered items.
2. **Backend API (Flask)**: Provides endpoints for listing products, placing orders, and checking order status.
3. **Frontend (HTML/CSS/JS)**: A user-friendly web interface to access the api endpoints and place orders.
4. **RabbitMQ**: Handles asynchronous processing of orders.
5. **Docker compose file**: To manage all the containers along with the health checks, resource limits, environment variables and networking between components as frontend-network and backend-network where bakery-frontend-network is used by frontend and backend to connects the frontend container (bakery-frontend) to the backend container (bakery-backend). The backend-network is used by backend,db (PostgreSQL) and rabbitmq. This ensures isolation and security between frontend, backend and internal components.

All components are containerized using Docker and orchestrated with Docker Compose.

## Implementation Details: 

1. **Database (PostgreSQL):**

The database schema includes three tables: 

- `products`: Stores bakery products information. 

- `orders`: Stores customer order details. 

- `order_items`: Stores the relationship between orders and products. 

 

2. **Backend API (Flask):** 

The API includes three endpoints: 

1. `GET /api/products`: Lists all available bakery products. 

2. `POST /api/orders`: Places a new order. 

3. `GET /api/orders/<id>`: Checks the status of an existing order. 

 

3. **Frontend (HTML/CSS/JS):** 

The frontend was implemented using HTML, CSS, and JavaScript. 

 

4. **Message Queue (RabbitMQ):** 

RabbitMQ is used to handle order processing asynchronously, which helps decouple the order placement from the processing workflow. 

### Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│   Frontend    │────▶│    Backend    │────▶│   Database    │
│  (HTML/JS/CSS)│     │    (Flask)    │     │  (PostgreSQL) │
│               │◀────│               │◀────│               │
└───────────────┘     └───────┬───────┘     └───────────────┘
                             │
                             ▼
                      ┌───────────────┐
                      │               │
                      │   RabbitMQ    │
                      │               │
                      └───────────────┘
```

##  Application Flow

1. The user interacts with the frontend web interface
2. The frontend makes API calls to the backend service
3. The backend service queries the database for data
4. When orders are placed, the backend sends a message to RabbitMQ
5. RabbitMQ queues the message for asynchronous processing

## Setup Instructions

### Prerequisites

- Docker
- Docker Compose

### Installation Steps

1. Copy the repository in the project directory and use the terminal from root of the directory to execute the following commands.

2. Start the services using Docker Compose:
   ```
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000
   - RabbitMQ Management: http://localhost:15672 (username: guest, password: guest)

### Stopping the Application

```
docker-compose down
```

To remove the volumes as well:
```
docker-compose down -v
```

## API Endpoints

### 1. Listing All the Bakery Products

**Endpoint:** `GET /api/products`

**Response:**
```json
[ 
  { 
    "available": true, 
    "description": "Chocolate cake with chocolate ganache", 
    "id": 1, 
    "image_url": "chocolate-cake.jpg", 
    "name": "Chocolate Cake", 
    "price": "24.99" 
  }, 
  { 
    "available": true, 
    "description": "Cake with fresh strawberries", 
    "id": 2, 
    "image_url": "strawberry-cake.jpg", 
    "name": "Strawberry Cake", 
    "price": "22.99" 
  }, 
  { 
    "available": true, 
    "description": "Creamy cheesecake with blueberry", 
    "id": 3, 
    "image_url": "blueberry-cheesecake.jpg", 
    "name": "Blueberry Cheesecake", 
    "price": "26.99" 
  }, 
  { 
    "available": true, 
    "description": "Classic cheesecake with Biscoff cookies and spread", 
    "id": 4, 
    "image_url": "biscoff-cheesecake.jpg", 
    "name": "Biscoff Cheesecake", 
    "price": "28.99" 
  }, 
  { 
    "available": true, 
    "description": "Healthy bread made with seven different grains", 
    "id": 5, 
    "image_url": "multigrain-bread.jpg", 
    "name": "Multigrain Bread", 
    "price": "6.99" 
  } 
] 

```

### 2. Placing an Order

**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "customer_name": "Vibhav",
  "customer_email": "Vibhav354@gmail.com",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "message": "Order placed successfully",
  "order_id": 1
}
```

### 3. Checking Order Status

**Endpoint:** `GET /api/orders/{order_id}`

**Response:**
```json
{ 
  "created_at": "Sun, 20 Apr 2025 10:20:03 GMT", 
  "customer_name": "vibhav", 
  "id": 6, 
  "items": [ 
    { 
      "product_id": 5, 
      "product_name": "Multigrain Bread", 
      "quantity": 1, 
      "unit_price": 6.99 
    } 
  ], 
  "status": "pending" 
} 
```
## Advanced features:
## Health Checks and Resource Limits

### Healthchecks:
The health status of containers can be verified by using 'docker inspect' command: 

- **PostgreSQL**: Uses `pg_isready` to verify database is ready to accept connections
- **RabbitMQ**: Checks RabbitMQ status via `rabbitmqctl status`
- **Backend**: Exposes a `/health` endpoint that returns HTTP 200 when healthy along with a curl check
- **Frontend**: Uses simple curl check to verify the service is responding

### Resource Limits

Resource limits have been implemented for all container's memory and cpu usage and it can be seen by 'docker stats' command:

- **PostgreSQL**: 0.5 CPU, 512MB memory
- **RabbitMQ**: 0.3 CPU, 256MB memory
- **Backend**: 0.5 CPU, 256MB memory
- **Frontend**: 0.3 CPU, 128MB memory


