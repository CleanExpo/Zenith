# Research Document: Zenith SaaS Project

## 1. Environment Detection

*   **IDE:** Visual Studio Code
*   **Operating System:** Windows 11
*   **Shell:** PowerShell 7
*   **Project Structure Framework:** Next.js 13+ App Directory
*   **Available Extensions/Plugins/Tools (IDE):** (To be determined - will leverage VS Code's capabilities for Next.js/TypeScript/Tailwind development)

## 2. Project Architecture Analysis (Initial Notes)

This document assumes a new project build.

### Existing Components & Integrations (Planned)
*   **Supabase:** Database (PostgreSQL) & Authentication
*   **Stripe:** Payment Processing
*   **Redis:** Caching Layer
*   **Tailwind CSS:** Styling
*   **Vercel:** Deployment Platform
*   **Authentication System:** Leveraging Supabase Auth, potentially Google OAuth
*   **Error Handling Utilities:** To be developed

### Build Systems & Package Managers
*   **Package Manager:** npm (default for Next.js, can be confirmed/changed)
*   **Build System:** Next.js build system

## 3. Third-Party Dependencies (Initial List)

*   **Core Framework:** Next.js, React, ReactDOM
*   **Database & Auth:** Supabase (e.g., `@supabase/supabase-js`)
*   **Payments:** Stripe (e.g., `@stripe/stripe-js`, `stripe`)
*   **Caching:** Redis (e.g., `ioredis` or `redis`)
*   **Styling:** Tailwind CSS, PostCSS, Autoprefixer
*   **UI Components:** shadcn/ui (specific components to be inventoried in `ShadCN-context.md`)
*   **Deployment:** Vercel platform specific configurations (if any)
*   **OAuth:** Google OAuth (libraries as needed, e.g., `next-auth` if Supabase direct integration isn't sufficient or for more providers)
*   **Utilities:** (To be determined, e.g., date handling, form management, state management)

## 4. Component Research & Selection (shadcn/ui)

This section will be populated based on UI requirements and research using Context7.

### 4.1. Table Component

*   **Source:** shadcn/ui (via Context7 ID: `/shadcn-ui/ui`)
*   **Description:** Provides components for basic tables (`<Table>`, `<TableHeader>`, etc.) and advanced `DataTable` functionality using TanStack Table.
*   **Key Features (from Context7 output):**
    *   Basic table structure (caption, header, body, rows, cells).
    *   Reusable `DataTable` component leveraging `@tanstack/react-table`.
    *   Sorting.
    *   Row actions (e.g., with dropdown menus).
    *   Customizable column definitions.
    *   Pagination.
    *   Column visibility control.
    *   Row selection.
    *   Filtering.
*   **Installation Commands (from Context7 output):**
    ```bash
    npx shadcn@latest add table
    ```
    For advanced `DataTable` features, also install TanStack Table:
    ```bash
    npm install @tanstack/react-table
    ```
*   **Import Example (basic table - from Context7 output):**
    ```tsx
    import {
      Table,
      TableBody,
      TableCaption,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
    } from "@/components/ui/table"
    ```
*   **Dependencies (explicitly mentioned for DataTable):** `@tanstack/react-table`. Other dependencies for dropdowns, buttons, checkboxes used in examples would be installed via their respective `shadcn@latest add <component>` commands.

*(Further details on specific usage for the Zenith dashboard will be added as UI design progresses.)*

### 4.2. Chart Components

*   **Source:** shadcn/ui (via Context7 ID: `/shadcn-ui/ui`), primarily uses **Recharts** library.
*   **Description:** shadcn/ui offers helper components (`ChartContainer`, `ChartTooltip`, `ChartLegend`, etc.) to integrate and style charts built with Recharts.
*   **Key Features (from Context7 output):**
    *   Integration with Recharts for various chart types (BarChart, LineChart shown in examples).
    *   Customizable chart configuration (`ChartConfig`).
    *   Theming via CSS variables.
    *   Components for tooltips and legends.
    *   Accessibility layer support.
*   **Installation Commands (from Context7 output):**
    *   No specific `npx shadcn@latest add chart` command was found in the provided snippets for a general chart component. Chart helper components (like `ChartContainer`) are typically imported from `@/components/ui/chart`.
    *   The primary dependency is `recharts`. If not already part of the project, it would need to be installed (e.g., `npm install recharts`).
    *   For React 19 compatibility with Recharts, the following override in `package.json` is suggested:
      ```json
      "overrides": {
        "react-is": "^19.0.0-rc-69d4b800-20241021"
      }
      ```
*   **Import Example (helpers - from Context7 output):**
    ```tsx
    import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
    // And Recharts components themselves:
    import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
    ```
*   **Dependencies:** `recharts`.

*(Specific chart types like Bar, Line, Pie, etc., will be implemented using Recharts, styled with shadcn/ui helpers and theme variables.)*

### 4.3. Card Component

*   **Source:** shadcn/ui (via Context7 ID: `/shadcn-ui/ui`)
*   **Description:** A versatile component for displaying content in a structured card format, typically including a header, title, description, content area, and footer.
*   **Key Features (from Context7 output):**
    *   Structured sections: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
    *   Accessibility considerations for title and description elements.
*   **Installation Command (from Context7 output):**
    ```bash
    npx shadcn@latest add card
    ```
*   **Import Example (from Context7 output):**
    ```tsx
    import {
      Card,
      CardContent,
      CardDescription,
      CardFooter,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card"
    ```
*   **Dependencies:** No specific external Radix UI package mentioned for the base Card component in the primary snippets; it seems self-contained within the shadcn/ui structure once added. (Note: Hover Card is a separate component with its own dependencies).

*(Cards will be used extensively in the dashboard for displaying summaries, stats, and other modular information.)*

## 5. API Research

(This section will detail research into Supabase, Stripe, and any other external APIs as needed.)
