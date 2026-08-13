# Booking Clinic System

A comprehensive online clinic management and appointment booking system developed with a Fullstack architecture, fully containerized with Docker for seamless deployment.

---

## Project Overview

### Key Features

- **Doctor Management**: Manage doctor profiles, work schedules, specialties, and availability for efficient clinic operations
- **Patient Management**: Maintain patient records, health information, consultation history, and personal care data securely
- **Smart Appointment Booking**: Provide an optimized appointment scheduling flow with doctor availability matching and booking workflow support
- **AI Online Consultation**: Offer AI-assisted health consultation and guidance to support faster patient decision-making
- **Multi-Role Clinic System**: Support different user roles such as patients, doctors, and administrators with role-based access and workflows
- **Medicine & Health Services**: Manage medicines, health service information, and treatment-related data within the clinic platform
- **Secure Payment Integration**: Enable safe online transactions using VNPay with a trusted payment gateway workflow
- **Review & Ratings**: Collect patient feedback and quality assessments to improve service performance and trust
- **Real-time Notifications**: Send appointment, update, and reminder notifications to improve patient engagement and communication
- **High-Performance Architecture**: Improve responsiveness and scalability with Redis caching, Dockerized deployment, and modern fullstack technologies

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Spring Boot 3.x, Java 21 |
| **Frontend** | React 18+, Vite, Tailwind CSS |
| **Database** | MySQL 8.0 |
| **Cache** | Redis |
| **Authentication** | JWT Token |
| **Payment Gateway** | VNPay API |
| **API Documentation** | Swagger/OpenAPI |
| **Containerization** | Docker & Docker Compose |


### Project Structure

```
booking-clinic-system/
├── Backend_API/
│   └── booking-clinic/                          # Spring Boot Application (Java 21)
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/example/booking_clinic/
│       │   │   │   ├── controller/              # REST API Controllers
│       │   │   │   ├── service/                 # Business Logic Services
│       │   │   │   │   └── impl/               # Service Implementations
│       │   │   │   ├── repository/              # Data Access Layer (Spring Data JPA)
│       │   │   │   ├── entity/                  # JPA Entity Models
│       │   │   │   ├── dto/                     # Data Transfer Objects
│       │   │   │   ├── exception/               # Custom Exceptions
│       │   │   │   ├── config/                  # Configuration Classes
│       │   │   │   ├── security/                # Security/Authentication
│       │   │   │   └── util/                    # Utility Classes
│       │   │   └── resources/
│       │   │       ├── application.properties   # Spring Boot Configuration
│       │   │       ├── db/                      # Database Migrations
│       │   │       └── [Configuration Files]
│       │   └── test/
│       │       ├── java/com/example/booking_clinic/
│       │       │   ├── controller/              # Controller Tests
│       │       │   ├── service/                 # Service Unit Tests
│       │       │   └── repository/              # Repository Tests
│       │       └── resources/
│       ├── pom.xml                             # Maven Dependencies & Build Config
│       ├── Dockerfile                          # Docker Container Configuration
│       └── target/                             # Build Output (generated)
│
├── Frontend_ReactJs/                           # React Application
│   ├── src/
│   │   ├── components/                         # Reusable UI Components
│   │   ├── pages/                              # Page Components
│   │   ├── services/                           # API Service Layer
│   │   ├── contexts/                           # React Context API
│   │   ├── hooks/                              # Custom React Hooks
│   │   ├── layouts/                            # Layout Components
│   │   ├── styles/                             # CSS & Tailwind Styles
│   │   ├── assets/                             # Static Assets
│   │   ├── utils/                              # Utility Functions
│   │   ├── App.jsx                             # Root Component
│   │   └── main.jsx                            # Entry Point
│   ├── public/                                 # Static Public Files
│   ├── package.json                            # NPM Dependencies
│   ├── vite.config.js                          # Vite Configuration
│   ├── tailwind.config.js                      # Tailwind CSS Configuration
│   ├── Dockerfile                              # Docker Container Configuration
│   └── nginx.conf                              # Nginx Configuration (production)
│
├── db_init/
│   └── init.sql                                # Database Initialization Scripts
│
├── docker-compose.yml                          # Docker Compose Multi-container Setup
│
└── README.md                                   # Project Documentation
```

---

## Getting Started with Docker (Recommended - Fastest)

For users and developers who want to run this project using Docker:

### Step 1: Prepare Your Environment

Ensure your computer has the following software installed:

1. **Git**: Required to clone the project source code. [Download Git](https://git-scm.com/)
2. **Docker Desktop**: Essential tool for running the entire system. [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - *Note*: After installation, **launch Docker Desktop** before proceeding with the following steps
3. **Free up connection ports**: Ensure you have stopped any local applications running MySQL (Laragon, XAMPP, etc.) on port `3306` and Redis on port `6379`

### Step 2: Clone the Project

Open Terminal (CMD, PowerShell, or Git Bash) and run the following commands:

```bash
git clone https://github.com/khoazocute/booking-clinic-system.git
cd booking-clinic-system
```

### Step 3: Start the Application with Docker

Run the command:

```bash
docker-compose up -d --build
```

**How it works**: This command automatically downloads base images, builds both Frontend and Backend source code, and imports sample data (specialties, doctor accounts, existing patients) from `db_init/init.sql` into the database without manual import.

**Initial startup time**: Approximately **3 to 5 minutes** (for downloading dependencies and building the project). Subsequent runs take only **5 - 10 seconds**.

### Step 4: Access and Explore

Once the Terminal displays `Started` for all services:

- **Web Interface (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:8082/api/v1/health](http://localhost:8082/api/v1/health)

---

## Manual Setup (Without Docker)

If Docker is not available on your machine, you can run the application manually by setting up the environment on your local system.

### Prerequisites

Before running the application, ensure your computer has the following installed:

1. **Java Development Kit (JDK) 21**: Required to compile and run the Backend
2. **Node.js (version 18 or higher)**: Required to run the Frontend
3. **MySQL Server (port 3306)**: Can be installed directly or via Laragon, XAMPP
4. **Redis Server**: Used for caching. If not installed locally, you can disable caching or use Docker/WSL to run Redis

---

### Step 1: Set Up the Database (MySQL)

1. Open your database management tool (HeidiSQL, DBeaver, MySQL Workbench, etc.)
2. Create a new database named `booking_clinic_db` using SQL:
   ```sql
   CREATE DATABASE booking_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import all sample tables:
   - Select the newly created `booking_clinic_db` database
   - Open the SQL file: `db_init/init.sql` from the project
   - Execute all SQL statements to load the data

---

### Step 2: Configure and Run Backend (Spring Boot)

1. Open the Backend database configuration file at:
   ```
   Backend_API/booking-clinic/src/main/resources/application.properties
   ```
2. Update the MySQL connection information to match your local setup:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/booking_clinic_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=UTC
   spring.datasource.username=YOUR_MYSQL_USERNAME (typically root)
   spring.datasource.password=YOUR_MYSQL_PASSWORD (leave empty if using Laragon defaults)
   ```
3. Configure Redis (if you have Redis installed locally):
   ```properties
   spring.cache.type=redis
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   ```
   *(If not using Redis, change the configuration to `spring.cache.type=none` to disable caching)*
4. Open Terminal in the `Backend_API/booking-clinic` directory and run:
   ```bash
   # For Windows
   .\mvnw.cmd clean compile spring-boot:run

   # For macOS / Linux
   ./mvnw clean compile spring-boot:run
   ```
   The Backend will successfully start at: **http://localhost:8082**

---

### Step 3: Install and Run Frontend (ReactJS)

1. Open a new Terminal window and navigate to the Frontend directory:
   ```bash
   cd Frontend_ReactJs
   ```
2. Install required dependencies (only run on first setup):
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and access the address shown in the terminal (typically **http://localhost:5173**)

---

## Development Workflow

### When Modifying Code While Docker is Running

- **For Backend (Java) changes**: Run the following command to recompile the source code and update the Backend container:
  ```bash
  docker-compose up -d --build backend
  ```
- **For Frontend (React) changes**: Run the following command to rebuild static files and update the Frontend container:
  ```bash
  docker-compose up -d --build frontend
  ```

---

## Useful Docker Commands

- **Check service status**:
  ```bash
  docker-compose ps
  ```
- **View system logs in real-time**:
  ```bash
  docker-compose logs -f
  ```
- **Stop all services (preserves data)**:
  ```bash
  docker-compose down
  ```
- **Stop all services and remove database data (fresh restart)**:
  ```bash
  docker-compose down -v
  ```

## Redis Demonstration via Terminal

- `docker-compose ps`
- `docker exec -it booking-clinic-redis redis-cli ping` - If you see PONG, the Redis container is running normally
- Demo Redis cache data: `docker exec -it booking-clinic-redis redis-cli keys "*"`
  - If no keys appear initially, visit the specialties/doctors page, then run the command again
  - You should see keys like those below if Redis caching is working:
    ```
    specialties::all
    doctors::all
    medicines::all
    ```
