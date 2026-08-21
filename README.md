# ShortenLink

A full-stack URL shortener with email OTP authentication, custom aliases, link expiry, guest link limits, and per-link click analytics (device, browser, referrer breakdown).

Built to go beyond typical tutorial-level CRUD apps — includes real email-based OTP verification, JWT auth, guest vs. registered user flows, and actual analytics computed from logged click data (not mocked).

## Features

- **Email OTP verification** for registration and password reset (via Gmail SMTP)
- **JWT-based authentication** with bcrypt password hashing
- **Guest mode** — create up to 5 short links without an account, tracked by IP
- **Custom aliases** for registered users
- **Link expiry** — set links to auto-expire after N days
- **Click analytics** — total clicks, device type breakdown (Desktop/Mobile/Tablet), browser breakdown, top referrers — computed live from logged click data
- **Dashboard** with expandable per-link analytics cards

## Tech Stack

**Frontend:** React (Vite), React Router, Tailwind CSS
**Backend:** Node.js, Express
**Database:** PostgreSQL
**Auth:** JWT, bcrypt
**Email:** Nodemailer (Gmail SMTP)

## Project Structure

```
short_url/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, env validation
│   │   ├── models/         # SQL query functions
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Auth (JWT), optional auth
│   │   ├── utils/          # OTP generation, email sending, JWT, UA parsing
│   │   ├── app.js
│   │   └── server.js
│   └── schema.sql          # PostgreSQL schema
└── frontend/
    └── src/
        ├── components/      # Pages + UI components
        └── lib/             # API client, Auth context
```

## Setup

### Prerequisites
- Node.js
- PostgreSQL
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) enabled (for sending OTP emails)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file (see `.env.example`):
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=short_urls
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_random_secret
JWT_EXPIRES_IN=2h
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_char_app_password
```

Run the schema against your database:
```bash
psql -U postgres -d short_urls -f schema.sql
```

Start the server:
```bash
node src/server.js
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:
```bash
npm run dev
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, send OTP |
| POST | `/api/otp/verify-register` | Verify registration OTP |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/otp/verify-reset` | Verify reset OTP |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/links` | Create short link (guest or authed) |
| GET | `/api/links` | List logged-in user's links |
| DELETE | `/api/links/:id` | Delete a link |
| GET | `/api/links/:id/analytics` | Get click analytics for a link |
| GET | `/:shortCode` | Redirect to original URL |

## Known Limitations / Next Steps

This project intentionally skips a few things that weren't worth the added complexity at this scale, but would matter at production scale:

- **No refresh tokens** — single JWT with a 2-hour expiry. Evaluated the threat model for this project and decided the added complexity (refresh rotation, cookie handling) wasn't justified versus a simple, correctly-scoped access token.
- **No geo-IP lookup** — analytics show device/browser/referrer but not visitor location, since that requires a paid or rate-limited third-party API.
- **No Redis caching** — redirects hit Postgres directly. Fine at this scale; would add caching for short_code → URL lookups at higher traffic.
- **No rate limiting on OTP endpoints yet** — a straightforward addition (`express-rate-limit`) planned to prevent OTP spam abuse.

## Author

Built by Sagar Dutta
