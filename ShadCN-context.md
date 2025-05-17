# ShadCN UI Components Inventory

This document tracks the shadcn/ui components installed and used in the Zenith project.

## Installed Components

| Component | Status | Usage |
|-----------|--------|-------|
| Form | ✅ Installed | Used for form validation and handling in project creation |
| Popover | ✅ Installed | Used for date picker in project forms |
| Select | ✅ Installed | Used for priority selection in project forms |
| Calendar | ✅ Installed | Used for date selection in project forms |
| Button | ✅ Installed | Used throughout the application for actions |
| Input | ✅ Installed | Used for text input fields |
| Textarea | ✅ Installed | Used for multi-line text input |
| Card | ✅ Installed | Used for containing form elements and content |
| Label | ✅ Installed | Used for form field labels |
| Pagination | ✅ Installed | Used for paginating through lists |
| Sonner | ✅ Installed | Used for toast notifications throughout the app |
| Alert | ✅ Installed | Used for displaying important messages to users |
| Skeleton | ✅ Installed | Used for loading states and placeholders |
| LoadingSkeleton | ✅ Installed | Custom component built on top of Skeleton for standardized loading states |
| Dialog | ✅ Installed | Used for modal dialogs and user interactions |
| Tooltip | ✅ Installed | Used for contextual information and form field guidance |
| DropdownMenu | ✅ Installed | Used for navigation menus and user interface options |
| ThemeProvider | ✅ Installed | Used for theme management and dark/light mode support |
| SkipLink | ✅ Installed | Used for accessibility to skip to main content |
| VisuallyHidden | ✅ Installed | Used for screen reader content that's visually hidden |
| AriaLive | ✅ Installed | Used for announcing dynamic content to screen readers |
| LoadingIndicator | ✅ Installed | Used for showing loading states with accessibility support |
| ErrorMessage | ✅ Installed | Used for displaying error messages with proper accessibility |

## Enhanced Components

### Accessibility Components

The project includes several custom accessibility components:

1. **SkipLink**: Allows keyboard users to bypass navigation and jump directly to the main content
2. **VisuallyHidden**: Hides content visually while keeping it accessible to screen readers
3. **AriaLive**: Announces dynamic content changes to screen readers using ARIA live regions
4. **ErrorMessage**: Displays error messages with appropriate styling and screen reader announcements
5. **LoadingIndicator**: Provides visual feedback during loading states with proper accessibility support

### Enhanced Form Implementation

The project includes an enhanced form implementation using shadcn/ui components. This implementation:

1. Uses the Form component for form state management and validation
2. Integrates Select component for dropdown selection
3. Implements Popover and Calendar components for date picking
4. Provides proper form validation with error messages
5. Includes loading state indicators during form submission
6. Uses Sonner for toast notifications on form submission success/failure
7. Integrates with accessibility components for improved screen reader support

### Lazy Loading Implementation

The project includes a lazy loading implementation for heavy components:

1. Uses Next.js dynamic imports for code splitting
2. Implements a custom `lazyLoad` utility in `lib/utils/lazy.ts`
3. Provides a standardized loading skeleton component
4. Uses Suspense boundaries for improved user experience
5. Optimizes analytics components that are heavy due to chart rendering

## Installation Commands

To install additional shadcn/ui components, use:

```bash
npx shadcn@latest add [component-name]
```

## Required Dependencies

The following dependencies are required for the shadcn/ui components:

- tailwindcss-animate
- date-fns (for Calendar component)
- lucide-react (for icons)
- sonner (for toast notifications)

## Theme Customization

The shadcn/ui components use the theme defined in the tailwind.config.ts file. To customize the appearance of components, modify the theme settings in this file.
