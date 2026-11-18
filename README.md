# BookNook Server

A RESTful backend API for **BookNook**, a small online library management application. It provides book management, borrowing and returning functionality, database integration, and secure authentication.

## Live API

- **Frontend:** https://boooknook-client-oitaa.vercel.app
- **Backend API:** https://booknook-server-xxxx.onrender.com.

## Repository

- **GitHub:** https://github.com/khaledaruna/booknook-server

## Features

- Retrieve all books and individual book details.
- Add new books to the library.
- Update existing book information.
- Delete books with protection against active borrow records.
- Borrow books and track borrowing records.
- Return borrowed books and restore available copies.
- Manage total and available book copies.
- Prevent borrowing unavailable books.
- Prevent duplicate active borrowing of the same book by a user.
- Verify JWT authentication for protected API endpoints.
- Store book and borrowing information in MongoDB.
- Provide structured JSON responses and appropriate HTTP status codes.

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- Better Auth JWT
- JOSE
- CORS
- dotenv

## Project Structure

```text
booknook-server/
├── src/
│   ├── config/
│   │   ├── collections.ts
│   │   └── db.ts
│   ├── controllers/
│   │   ├── booksController.ts
│   │   └── borrowsController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts
│   ├── models/
│   │   ├── bookModels.ts
│   │   └── borrowModels.ts
│   ├── routes/
│   │   ├── booksRoutes.ts
│   │   └── borrowsRoutes.ts
│   ├── types/
│   │   ├── book.types.ts
│   │   └── borrow.types.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/khaledaruna/booknook-server.git
```

### 2. Navigate to the project directory

```bash
cd booknook-server
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
CLIENT_URL=http://localhost:3000

MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=booknook

BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER=http://localhost:3000
BETTER_AUTH_AUDIENCE=booknook-api
```

Replace the MongoDB placeholder with your own connection string. Never commit your `.env` file or expose private credentials.

### 5. Run the development server

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

## API Endpoints

### Books API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get a single book |
| POST | `/books` | Add a new book |
| PATCH | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

### Borrow API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/borrows` | Borrow a book |
| GET | `/borrows` | Get the authenticated user's borrow records |
| DELETE | `/borrows/:id` | Return a borrowed book |

Protected endpoints require a valid JWT Bearer token in the Authorization header.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start the production server |

## Database

BookNook uses MongoDB to store:

- Book information
- Borrowing records
- Book availability information

The server connects to MongoDB using environment variables.

## Authentication

BookNook uses Better Auth for user authentication and JWT for API authorization.

The backend verifies access tokens using the Better Auth JWKS endpoint before allowing protected operations.

## Deployment

The backend is designed to be deployed as a Node.js Web Service on Render.

Configure the production environment variables in the Render dashboard before deploying.

## Related Project

**BookNook Client:** https://github.com/khaledaruna/booknook-client

**Live Website:** https://booknook-client-oita.vercel.app

---

Developed as part of the BookNook online library project.