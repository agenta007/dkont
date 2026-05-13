# Dkont

Educational web application for managing a logistics company. The system covers clients, employees, offices, shipments, role-based views, automatic shipment pricing, and operational reports.

## Tech Stack

- Backend: Java 21, Spring Boot 3.5, Spring MVC REST API
- Frontend: React, JSX, Vite
- Data storage: in-memory seed data for simple local execution
- Build tools: Maven and npm

## Requirements

Install these before running the project:

- Java 21
- Maven 3.9+
- Node.js 20+ or newer
- npm

Check your versions:

```bash
java -version
mvn -version
node -v
npm -v
```

## Installation

Clone the repository, then install the frontend dependencies:

```bash
git clone <repository-url>
cd codex
cd frontend
npm install
```

The backend dependencies are downloaded automatically by Maven when you run or test the backend.

## Running The Application

Start the backend API from the project root:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082
```

In a second terminal, start the React frontend:

```bash
cd frontend
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to:

```text
http://127.0.0.1:8082
```

## Demo Login

Seeded users:

```text
admin / admin
elena / demo
nikolay / demo
maria / demo
ivan / demo
stella / demo
```

You can also switch roles from the UI to inspect admin, employee, and client behavior.

## Testing

Run backend tests:

```bash
mvn test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Main Features

- Role views for administrator, employee, and client
- Clients see only shipments where they are sender or receiver
- CRUD flows for clients, employees, offices, and shipments
- Mark shipment as delivered
- Automatic price calculation: `5 + weight * 2`, plus `5` for address delivery
- Revenue report by date range
- Report for sent but undelivered shipments
- Responsive React interface

## API Endpoints

- `GET /api/snapshot`
- `POST /api/login`
- `POST /api/register`
- `GET /api/shipments?role=CLIENT&clientId=1`
- `GET /api/reports?from=2026-05-01&to=2026-05-13`
- `POST /api/clients`
- `POST /api/employees`
- `POST /api/offices`
- `POST /api/shipments`
- `POST /api/shipments/{id}/deliver`
- `DELETE /api/{resource}/{id}`

## Project Structure

```text
.
├── pom.xml
├── src/
│   ├── main/java/com/example/logistics/
│   └── test/java/com/example/logistics/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── README.md
```

## Git Notes

Generated files are ignored:

- `target/`
- `frontend/node_modules/`
- `frontend/dist/`
- `.idea/`

Do not commit generated build output or installed dependencies.

## Notes

The current backend uses an in-memory repository so the project can run without MySQL or PostgreSQL. A production version should replace `LogisticsService` storage with JPA repositories and a real database configuration.
