# MERN Starter Layout

## Structure

- `frontend/` contains the React app built with Vite
- `server/` contains the Express API, MongoDB models, file uploads, and Socket.IO setup

## Getting Started

1. Update `server/.env`
2. Add your MongoDB connection string
3. Install dependencies:

```bash
npm run install:all
```

4. Start backend:

```bash
npm run server
```

5. Start frontend:

```bash
npm run client
```

## Running Tests

Backend:

```bash
cd server
npm test
```

Frontend:

```bash
cd frontend
npm run test
```
