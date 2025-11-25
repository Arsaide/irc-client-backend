# IRC Client - Backend

This repository contains the backend infrastructure and API for the "IRC Client" project. It consists of a containerized environment (PostgreSQL, Redis, InspIRCd) and a NestJS-based API application.

## 📂 Project Structure

- **`/api`**: Contains the main backend application built with **NestJS**. This is where the business logic, database interactions (Prisma), and API endpoints reside.
- **`/config`**: This directory contains configuration files for the **InspIRCd** server. It is mounted as a volume to the Docker container.
    - *Note:* This folder is populated automatically when the IRC container starts. You can edit files here (e.g., `inspircd.conf`) to change server settings.
- **`docker-compose.yaml`**: Defines the infrastructure services required to run the project.

---

## 🚀 Infrastructure (Docker)

The project uses Docker Compose to spin up the necessary databases and services.

### Prerequisites
- Docker & Docker Compose installed.

### Environment Variables (Root)
Create a `.env` file in the **root** directory to configure Docker services.

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `postgres` | Database superuser. |
| `POSTGRES_PASSWORD` | `password` | Database password. |
| `POSTGRES_DB` | `trpz-db` | Name of the default database. |
| `REDIS_PASSWORD` | `password` | Password for Redis authentication. |

### Running the Infrastructure
To start the database, cache, and IRC server, run:
```bash
    docker compose up -d
  ```

### Services & Ports

| Service | Container Name | Internal Port | **Host Port (External)** | Description |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `trpz-db` | 5432 | **54321** | Main relational database. |
| **Redis** | `trpz-redis` | 6379 | **63798** | Key-value store for caching and sessions. |
| **InspIRCd** | `trpz-irc` | 6667 | **6660-6669** | IRC Chat Server. |

---

## 💻 API Application

The API is located in the `api` folder.

### Setup
1. Navigate to the api folder:
   ```bash
   cd api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables (API)

The `.env` file inside the **api** folder contains environment variables used for configuring the application:

| Variable              | Description                                                    |
| --------------------- |----------------------------------------------------------------|
| `NODE_ENV`            | Environment mode (development, production).                    |
| `APP_IP`              | Application IP address.                                        |
| `APPLICATION_PORT`    | Application port.                                              |
| `FRONTEND_PORT`       | Frontend port for CORS configuration.                          |
| `APPLICATION_URL`     |  Full URL to access the API.                                   |
| `ALLOWED_ORIGIN`      | URL to allow CORS.                                             |
| `COOKIES_SECRET`      | Secret key for cookie encryption.                              |
| `SESSION_SECRET`      | Secret key for session management.                             |
| `SESSION_NAME`        | Name of the session cookie.                                    |
| `SESSION_DOMAIN`      | Domain for the session.                                        |
| `SESSION_MAX_AGE`     | Max age for session cookies.                                   |
| `SESSION_HTTP_ONLY`   | Flag to make session cookies HTTP-only.                        |
| `SESSION_SECURE`      | Flag to secure the session cookie (use `true` in production).  |
| `SESSION_FOLDER`      | Folder for storing session data.                               |
| `POSTGRES_USER`       | PostgreSQL user.                                               |
| `POSTGRES_PASSWORD`   | PostgreSQL password.                                           |
| `POSTGRES_HOST`       | PostgreSQL host.                                               |
| `POSTGRES_PORT`       | PostgreSQL port.                                               |
| `POSTGRES_DB`         | PostgreSQL database name.                                      |
| `POSTGRES_URI`        | PostgreSQL connection URI.                                     |
| `REDIS_USER`          | Redis user.                                                    |
| `REDIS_PASSWORD`      | Redis password.                                                |
| `REDIS_HOST`          | Redis host.                                                    |
| `REDIS_PORT`          | Redis port.                                                    |
| `REDIS_URI`           | Redis connection URI.                                          |

### Environment Variables (Root)

In the **root** directory, create a `.env` file to configure Docker services:

| Variable           | Description                             |
| ------------------ | --------------------------------------- |
| `POSTGRES_USER`    | Database superuser.                     |
| `POSTGRES_PASSWORD`| Database password.                      |
| `POSTGRES_DB`      | Name of the default database.           |
| `REDIS_PASSWORD`   | Password for Redis authentication.      |

### Running the Application

After setting up the `.env` files, follow these steps to run the application:

1. **Build the application**:
    ```bash
    yarn build
    ```

2. **Run in development mode** (with hot-reload):
    ```bash
    yarn start:dev
    ```

3. **Run in production mode**:
    ```bash
    yarn start:prod
    ```

4. **Run tests**:
    ```bash
    yarn test
    ```

5. **Run end-to-end tests**:
    ```bash
    yarn test:e2e
    ```

---

## 📝 Notes

- Ensure that Docker is running and the `.env` files are correctly set before starting the services.

---

