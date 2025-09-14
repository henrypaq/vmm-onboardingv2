# Leadsie-Style Onboarding Platform

A modern onboarding platform built with Next.js 14, TypeScript, Tailwind CSS, and Shadcn/UI. This platform allows admins to generate unique onboarding links for clients and track the onboarding process.

## Features

- **Admin Dashboard**: Overview of clients, link generation, and onboarding status tracking
- **Client Dashboard**: View onboarding requests and submit permissions/data
- **Link Generator**: Create unique, expiring UUID-based links for client onboarding
- **Onboarding Flow**: Clients can access generated links to submit permission requests
- **API Integration**: RESTful API endpoints compatible with Netlify Functions
- **Responsive Design**: Modern UI built with Tailwind CSS and Shadcn/UI components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Icons**: Lucide React
- **Deployment**: Netlify (ready)

## Project Structure

```
src/
├── app/
│   ├── (admin)/           # Admin dashboard routes
│   │   ├── page.tsx       # Admin dashboard
│   │   ├── clients/       # Client management
│   │   └── links/         # Link generation
│   ├── (client)/          # Client dashboard routes
│   │   ├── page.tsx       # Client dashboard
│   │   └── requests/      # Request management
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── clients/       # Client management
│   │   ├── links/         # Link operations
│   │   └── onboarding/    # Onboarding flow
│   ├── onboarding/        # Public onboarding pages
│   └── login/             # Authentication page
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── forms/             # Form components
│   └── ui/                # Shadcn/UI components
└── lib/
    ├── auth/              # Authentication utilities
    ├── db/                # Database utilities (Supabase ready)
    └── links/             # Link generation utilities
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Supabase - to be configured)
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication (to be configured)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Database Integration

The platform is designed to work with Supabase. Database utilities are prepared in `src/lib/db/database.ts` with placeholder functions that need to be implemented with actual Supabase queries.

### Required Tables

1. **users** - User accounts (admin/client)
2. **clients** - Client information
3. **onboarding_links** - Generated links with expiration
4. **onboarding_requests** - Client permission requests

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/clients` - List all clients (admin)
- `POST /api/clients` - Create new client (admin)
- `POST /api/links/generate` - Generate onboarding link (admin)
- `GET /api/links/validate` - Validate link token
- `POST /api/onboarding/submit` - Submit onboarding request

## Deployment

The project is configured for Netlify deployment:

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## Development Notes

- Authentication is currently placeholder - implement with Supabase Auth
- Database operations are placeholder - implement with Supabase client
- UI components are scaffolded - refine as needed
- All API routes are Netlify Functions compatible

## Next Steps

1. Configure Supabase database and authentication
2. Implement real data fetching in dashboard components
3. Add proper error handling and loading states
4. Implement real-time updates for request status
5. Add email notifications for status changes
6. Enhance UI/UX based on requirements