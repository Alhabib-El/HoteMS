# HoteMS

A reception-driven, POS-style hotel management system: rooms, restaurant, and multiple liquor stores, plus a role-scoped reporting dashboard. Built as a modular monolith — one backend, one frontend, each business domain in its own module.

- No online booking — guests are checked in at the front desk.
- Restaurant and liquor sales can be charged straight to a guest's room folio.
- Multiple liquor stores are supported, each with its own inventory.
- Staff log in with a PIN; each account has a role (Management, Rooms, Restaurant, Liquor) that gates which modules and reporting data they can see.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT + bcrypt for PIN auth
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Recharts

## Project layout

```
/backend    Express API — modules: auth, staff, rooms, restaurant, liquor, reporting
/frontend   React app — one route subtree + nav entry per module, gated by staff role
docker-compose.yml   Local PostgreSQL
```

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # set JWT_SECRET to a random string
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173`. You'll land on a PIN login screen.

### Seeded staff PINs (for local testing)

| Role | Name | PIN |
|---|---|---|
| Management | Alex Manager | `1234` |
| Rooms | Rita Frontdesk | `1111` |
| Restaurant | Remy Waiter | `2222` |
| Liquor | Leo Bartender | `3333` |

Management can add/deactivate staff accounts from the **Staff** page.

## Modules

- **Rooms** — room status board, check-in (incl. short-stay/day-use pricing), active bookings, folio/checkout. Rooms-role staff only.
- **Restaurant** — table map, order screen with waiter assignment, per-item prep status (received → preparing → ready → served), void items with a reason, split/partial bill payment (cash/card/room-charge), menu management. Restaurant-role staff only.
- **Liquor Stores** — switch between stores, POS sale screen, per-store inventory with low-stock alerts and restocking, and transferring stock to the restaurant (creates/tops-up a retail-priced "Bar" menu item the restaurant can sell). Liquor-role staff only.
- **Reporting** — revenue, occupancy, and low-stock data scoped by role: Management sees everything, Restaurant/Liquor/Rooms each see only their own module's numbers.
