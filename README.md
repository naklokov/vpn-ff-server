# vpn-ff-server

Express + TypeScript + MongoDB API for `user`.

## Setup

1. Copy env file:
   - `cp .env.example .env`
2. Update `MONGO_URI` in `.env` if needed.
3. Install dependencies:
   - `npm install`

## Run

- Dev mode: `npm run dev`
- Build: `npm run build`
- Start from build: `npm start`

## API

Base URL: `http://localhost:3000`

All `/api/*` endpoints require header: `x-api-token: <API_TOKEN>`.

- `POST /api/users` - add user
- `GET /api/users` - get all users
- `PATCH /api/users/:phone` - update user by phone

- `POST /api/payments` - add payment
- `POST /api/payments/check-payment` - check payment receipt by `amount`, `fileBase64`, optional `mimeType`
- `GET /api/payments` - get all payments
- `PATCH /api/payments/:id` - update payment by id
