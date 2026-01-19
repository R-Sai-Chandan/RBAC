# RBAC Admin Frontend

Minimal React + Vite Admin Dashboard for RBAC System.

## Features
- **Strict Session Auth**: Uses `X-Session-ID`.
- **Dynamic Navigation**: Sidebar built from `GET /rbac/me/navigation`.
- **Validation-Driven UI**: Admin controls hidden by default.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run Development Server:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5173`.

## Authentication
- Login at `/login`.
- Session ID stored in LocalStorage (PoC only; moving to HTTP-only cookies recommended for Prod).
- `api.ts` intercepts 401s and redirects to login.

## Proxy
- Requests to `/rbac/*` are proxied to `http://localhost:3000`.
