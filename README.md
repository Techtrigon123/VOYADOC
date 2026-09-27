# Voyenta

Travel document software for travel agents, travel agencies and tour operators. Create professional travel documents such as hotel vouchers, invoices, receipts and quotations from one centralized workspace.

## Features

- Hotel voucher generation
- Proforma invoice creation
- GST/tax invoice generation
- Payment receipt creation
- Travel quotation generation
- PDF download and print
- Centralized document workspace
- Document history

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- React 19
- Tailwind CSS 4
- shadcn/ui-style components
- Lucide React icons
- MongoDB with Mongoose
- pdf-lib for server-side PDF generation

## Prerequisites

- Node.js 18+
- MongoDB
- npm or yarn

## Local Development

1. Clone the repository and open `checkin-app`.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in values:

   ```bash
   cp .env.example .env.local
   ```

4. Start MongoDB locally.

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `NODE_ENV` | Environment name |

## Project Structure

```
checkin-app/
├── app/
│   ├── (marketing)/         # Public marketing pages
│   ├── (auth)/              # Login / Signup / Forgot password
│   ├── dashboard/           # Protected dashboard pages
│   ├── tools/               # Document creation tools
│   ├── api/                 # Next.js API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   ├── marketing/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   └── utils.ts
├── models/
│   ├── User.ts
│   ├── Event.ts
│   ├── Attendee.ts
│   └── Payment.ts
├── types/
│   └── index.ts
├── .env.example
└── package.json
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Production Build

```bash
npm run build
npm run start
```

## Deployment Notes

- Set all environment variables in your hosting provider.
- Use a managed MongoDB cluster.
- Enable HTTPS for secure access.

## Troubleshooting

- If `npm run dev` fails, delete `.next` and `node_modules/.cache`, then retry.
- If MongoDB connection fails, verify `MONGODB_URI` and network access.
