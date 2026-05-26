# Peeritrade Backend

Professional Node.js & TypeScript backend for the Peeritrade application.

## Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Security:** Helmet, CORS, JWT, BcryptJS
- **Validation:** Zod

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB

### Installation
1. `cd server`
2. `npm install`

### Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/peeritrade
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Running the server
- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Production:** `npm start`

## Folder Structure
- `src/config`: Configuration files (DB, etc.)
- `src/controllers`: Request handlers
- `src/models`: Mongoose models
- `src/routes`: API routes
- `src/middlewares`: Custom middlewares (Auth, Errors)
- `src/utils`: Helper functions
- `src/app.ts`: Express application setup
- `src/server.ts`: Entry point
