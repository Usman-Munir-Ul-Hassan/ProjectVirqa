# ProjectVirqa

AI-Powered Voice Interview System built with React, Node.js, Socket.IO, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Redux Toolkit, Tailwind CSS, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO, Mongoose |
| Database | MongoDB |
| AI/LLM | OpenRouter, Groq Whisper |
| File Storage | Cloudinary |

## Local Development

### Backend
```bash
cd backend
cp .env.example .env   
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # Fill in backend URLs
npm install
npm run dev
```

## Docker Deployment

```bash
# Build and run both services
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:80
```

## Deploy to Render

This repo includes a `render.yaml` blueprint.
### Required Environment Variables

**Backend** (set in Render dashboard):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_USER`, `GOOGLE_APP_PASSWORD` - For email
- `OPENROUTER_API_KEY` - LLM API
- `GROQ_API_KEY` - Speech-to-text API
- `FRONTEND_URL` -  deployed frontend URL

**Frontend** (set as build-time env vars):
- `VITE_API_URL` -  deployed backend URL + `/api/v1`
- `VITE_SOCKET_URL` - deployed backend URL
- `VITE_GROQ_API_KEY` - Groq API key for Whisper speech-to-text
