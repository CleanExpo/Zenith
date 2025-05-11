# ShadCN/UI Component Inventory: Zenith SaaS Project

This document tracks the shadcn/ui components required and integrated into the Zenith SaaS project. It will be updated as components are researched (using Context7 MCP or other means) and implemented.

## Component Installation Command Format
```bash
npx shadcn-ui@latest add [component-name]
```

## Required Components Inventory

| Component Name | Purpose / Feature Area | Status (Not Researched / Researched / Installed / Implemented) | Notes / Dependencies |
|----------------|------------------------|--------------------------------------------------------------|----------------------|
| Table          | Dashboard Data Display | Installed (Exists)                                           | `@tanstack/react-table` for advanced features. Install: `npx shadcn@latest add table` |
| Chart          | Dashboard Data Display | Dependency Installed (recharts)                              | Uses `recharts`. Specific chart components (e.g., BarChart, LineChart) to be added from shadcn/ui examples as needed. React 19 may need `overrides` for `react-is`. |
| Card           | Dashboard Data Display / Content Grouping | Installed (Exists)                                 | Install: `npx shadcn@latest add card` |
| Button         | General UI Interaction | Installed                                                    | Install: `npx shadcn@latest add button`. Depends on `cn` from `@/lib/utils`. |

*(This table will be populated based on UI requirements and research.)*

## Base Setup / Dependencies (from shadcn/ui docs)
*   (Details on `components.json`, `tailwind.config.ts` setup for shadcn/ui will be added here after initial research/setup)

## Theme Management
*   (Details on light/dark mode integration with `next-themes` and shadcn/ui)
