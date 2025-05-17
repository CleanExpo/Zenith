# Design.md

## 1. Project Architecture Analysis

### Architecture Blueprint

```javascript
// CLIENT-SIDE (Next.js - App Directory: Zenith/app)
// ├── App Directory (Zenith/app)
// │   ├── Components (Zenith/components) - Includes shadcn/ui components and custom components
// │   ├── Pages (Route Handlers & Page Components within Zenith/app/**)
// │   └── Layouts (e.g., Zenith/app/layout.tsx)
// ├── Public Assets (Zenith/public)
// └── Tailwind CSS (Zenith/tailwind.config.ts, Zenith/app/globals.css)

// SERVER-SIDE
// ├── Supabase API Integration
// │   ├── Database (PostgreSQL) - Schema defined in supabase_schema.sql (or managed via Supabase UI/migrations)
// │   └── Auth - Integrated via Supabase client libraries
// ├── Stripe API Integration (e.g., Zenith/app/stripe/callback/route.ts)
// ├── Redis Cache (e.g., Zenith/lib/utils/redis.ts - to be created)
// ├── Middleware (e.g., Zenith/middleware.ts)
// │   ├── Auth
// │   └── Error handling
// └── API Routes (Next.js Route Handlers in Zenith/app/api/**)

// INFRASTRUCTURE
// ├── Vercel Deployment
// ├── Environment Variables (.env.local, .env.example)
// ├── Monitoring Tools (To be defined)
// └── Build System (Next.js/Vercel)
```

## 2. Continuous API Integration Framework

- __Persistent Supabase Client (Server-side)__: `Zenith/lib/supabase/server.ts`
- __Supabase Client (Client-side)__: `Zenith/lib/supabase/client.ts`
- __Stripe Integration__: Example path `Zenith/app/stripe/callback/route.ts` (actual implementation to follow Stripe best practices)
- __Redis Connection Pooling__: To be created at `Zenith/lib/utils/redis.ts`
- __Error Handling Middleware/Utilities__: To be created/enhanced, e.g., `Zenith/lib/utils/errorHandler.ts`

## 3. Database Schema

### Current Schema (Example from initial plan - actual schema in Supabase)
```sql
-- This is an example. The actual schema resides in the Supabase project.
-- Migrations should be handled via Supabase mechanisms or a migration tool.

CREATE TABLE research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Example linkage to auth users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies for RLS (Row Level Security) would be defined here, e.g.:
-- CREATE POLICY "Enable read access for authenticated users" ON research_projects FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable insert for owning user" ON research_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Data Flow Diagram (Conceptual)
```
[User Interaction (Browser)] --> [Next.js Frontend Components]
        |                                 ^
        |                                 | (API Calls)
        v                                 |
[Next.js API Routes (Backend)] ----> [Supabase Client (server.ts)] ----> [Supabase (PostgreSQL DB & Auth)]
        |                                                                     ^
        |                                                                     | (Cache Read/Write)
        +------------------------------------------------------------------> [Redis Cache (redis.ts)]
        |
        +------------------------------------------------------------------> [Stripe API]

```

## 4. Component Mapping (Initial High-Level)

### Frontend Components
- __Authentication__:
  - Login Page (`Zenith/app/auth/login/page.tsx`)
  - Signup Page (`Zenith/app/auth/signup/page.tsx`)
  - Auth Forms/Buttons (within `Zenith/components/auth/`)
- __Common UI / Shared Components__:
  - Layout (`Zenith/app/layout.tsx`)
  - Navigation (To be created, e.g., `Zenith/components/layout/Navbar.tsx`)
  - Footer (To be created, e.g., `Zenith/components/layout/Footer.tsx`)
  - Error Display (`Zenith/components/common/ErrorDisplay.tsx` - if exists, or to be created)
  - shadcn/ui components (e.g. `Zenith/components/ui/calendar.tsx`, `Zenith/components/ui/pagination.tsx`, and others to be added)
- __Feature-Specific Components__:
  - Landing Page Sections (`Zenith/components/sections/landing/` - if exists, or to be created)
  - Dashboard (`Zenith/app/dashboard/page.tsx` and related components in `Zenith/components/dashboard/`)
  - Research Projects Display/Management (e.g., components for `Zenith/app/api/research-projects/route.ts`)

### Backend Components (Logical)
- __Database Models/Types__: `Zenith/lib/database.types.ts` (auto-generated or manually defined based on Supabase schema)
- __Supabase Integration Logic__:
  - Server-side: `Zenith/lib/supabase/server.ts`
  - Client-side: `Zenith/lib/supabase/client.ts`
- __Stripe Integration Logic__: Route handlers (e.g., `Zenith/app/stripe/**`) and utility functions.
- __Redis Integration Logic__: `Zenith/lib/utils/redis.ts` (to be created)
- __Middleware__: `Zenith/middleware.ts` (for auth, request processing, etc.)
- __API Route Handlers__: Located in `Zenith/app/api/**` (e.g., `Zenith/app/api/research-projects/route.ts`)

## 5. UI Architecture Planning (shadcn/ui Focus)

### UI-MCP (UI Management Context Protocol/Plan)
- __Purpose__: To systematically manage the integration, state, and theming of shadcn/ui components.
- __Component Registration & Inventory__:
  - `Zenith/ShadCN-context.md`: This file will serve as the central inventory for all shadcn/ui components used in the project.
  - It will list each component, its installation command (as per Context7), version, and purpose within the application.
  - Installation will be done via CLI: `npx shadcn-ui@latest add [component-name]`
- __Theming__:
  - Leverage Tailwind CSS for theming, as shadcn/ui is built on top of it.
  - `Zenith/tailwind.config.ts` and `Zenith/app/globals.css` will define base styles, themes (light/dark if implemented), and custom utility classes.
  - shadcn/ui theming variables (CSS variables) will be configured as per shadcn/ui documentation, typically in `globals.css`.
- __State Management for UI Components__:
  - Primarily use React's built-in state (useState, useReducer) and context (useContext) for local and shared component state.
  - For more complex global state, consider Zustand or Jotai if needed, keeping it lightweight.
- __Hook Implementation__:
  - Custom React hooks (`Zenith/hooks/` directory - to be created) will be used to encapsulate reusable UI logic, data fetching related to UI, and interactions with shadcn/ui components where necessary.
  - Example: `useDataTable.ts` for managing state and logic for a shadcn/ui data table.
- __Directory Structure for UI Components__:
  - shadcn/ui components: `Zenith/components/ui/` (default location after `npx shadcn-ui add`)
  - Custom components built using shadcn/ui or other elements: `Zenith/components/custom/` (or feature-specific directories like `Zenith/components/dashboard/`)

## 6. SaaS Infrastructure Planning (High-Level)
- __Cloud Provider__: Vercel (for Next.js deployment and serverless functions)
- __Database__: Supabase (PostgreSQL)
- __Authentication__: Supabase Auth (with potential for Google OAuth, etc.)
- __Caching__: Redis (e.g., Upstash Redis or self-managed)
- __Payment Processing__: Stripe
- __Monitoring & Logging__: Vercel Analytics, Supabase logging, and potentially a third-party service (e.g., Sentry, Logtail) for more detailed insights.
- __Multi-tenancy__: If required, this would involve schema changes (e.g., `organization_id` in tables) and RLS policies in Supabase. (Not in immediate scope unless specified).
- __Backup & Disaster Recovery__: Supabase handles database backups. Vercel handles deployment rollbacks.

*(This document will be updated as the project progresses and more detailed design decisions are made.)*
