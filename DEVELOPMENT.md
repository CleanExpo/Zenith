# Development Guide

This document provides guidelines and best practices for developing the Zenith SaaS platform.

## VS Code Configuration

Zenith uses a custom VS Code configuration via CLINE to standardize development practices and improve workflow efficiency.

### Setup

The configuration file `vibe-coding-setup.json` is designed to be used with CLINE, but it appears that CLINE is not currently installed in your environment. However, you can still benefit from the configuration by:

1. **Manual VS Code Configuration**:
   - Open VS Code settings (File > Preferences > Settings or Ctrl+,)
   - Click on the "Open Settings (JSON)" icon in the top right
   - Add the relevant snippets and settings from `vibe-coding-setup.json`

2. **Using the Configuration as a Reference**:
   - Refer to the `vibe-coding-setup.json` file for standardized patterns and guidelines
   - Copy snippets manually when needed
   - Follow the documented best practices

3. **Future CLINE Integration**:
   - If CLINE becomes available in the future, you can initialize the configuration with:
     ```bash
     cline init --config vibe-coding-setup.json
     ```

### Key Features

The VS Code configuration provides several features to enhance your development workflow:

#### 1. Standardized Tasks

- Commit code regularly after AI interactions
- Adjust context before each major prompt
- Run security audits frequently
- Update ShadCN-context.md when adding new UI components
- Ensure accessibility compliance for all new components

#### 2. Code Snippets

The configuration includes several useful snippets:

- **Planning Template**: A structured template for planning new features
  ```
  Feature Name:
  Tech Stack:
  Task Breakdown:
  Debug & Logging Plan:
  UI/UX Design Notes:
  Accessibility Considerations:
  ```

- **Debug Log**: Quick debug logging
  ```javascript
  console.log('[DEBUG]:', {variable});
  ```

- **Early Return**: Pattern for early returns with warning
  ```javascript
  if (condition) { console.warn('Early exit:', reason); return; }
  ```

- **Supabase Server Client**: Initialize Supabase server client
  ```javascript
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('table_name').select('*');
  ```

- **Supabase Client Component**: Template for client component with Supabase
  ```javascript
  'use client';

  import { createClient } from '@/lib/supabase/client';

  export default function Component() {
    const supabase = createClient();
    // Component code here
  }
  ```

- **shadcn/ui Component**: Command to add a new shadcn/ui component
  ```bash
  npx shadcn-ui@latest add component-name
  ```

- **Accessible Component**: Template for creating accessible components
  ```javascript
  import { AriaLive } from '@/components/ui/aria-live';
  import { VisuallyHidden } from '@/components/ui/visually-hidden';

  export default function AccessibleComponent() {
    // Component code here
  }
  ```

#### 3. LLM Interaction Guidelines

When working with AI assistants:

- Explicitly set context using '@' symbol when prompting AI
- Request multiple AI solutions for complex issues
- Switch between different LLMs based on the coding task
- Evaluate AI-generated outputs against defined project standards
- Include relevant parts of ACCESSIBILITY.md when requesting UI components
- Reference ShadCN-context.md when working with UI components

### Zenith-Specific Patterns

The configuration includes guidelines specific to the Zenith project:

#### Components

- **UI**: Use shadcn/ui components from ShadCN-context.md
- **Accessibility**: Follow patterns in ACCESSIBILITY.md
- **Layout**: Use consistent layout patterns from app/layout.tsx

#### Services

- **Database**: Use Supabase for database operations
- **Auth**: Use Supabase Auth for authentication
- **Payment**: Use Stripe for payment processing
- **Cache**: Use Redis for caching

#### Patterns

- **Server Components**: Use Server Components for data fetching
- **Client Components**: Use 'use client' directive for interactive components
- **API**: Use Route Handlers in app/api/** for API endpoints
- **Forms**: Use shadcn/ui Form component for form handling

## Project Architecture

For detailed information about the project architecture, refer to the following documents:

- [Design.md](./Design.md): Overall architecture and design decisions
- [ShadCN-context.md](./ShadCN-context.md): UI component inventory
- [ACCESSIBILITY.md](./ACCESSIBILITY.md): Accessibility implementation guide
- [ROADMAP.md](./ROADMAP.md): Project roadmap and milestones

## Development Workflow

### 1. Feature Development

When developing a new feature:

1. Use the planning template to outline the feature
2. Create necessary components following the Zenith-specific patterns
3. Implement the feature using the appropriate services
4. Ensure accessibility compliance
5. Add tests for the feature
6. Update documentation as needed

### 2. Working with AI

When working with AI assistants:

1. Provide clear context about the Zenith project
2. Reference relevant documentation
3. Use the '@' symbol to set context
4. Evaluate generated code against project standards
5. Commit effective solutions to memory systems (MCP)

### 3. Code Quality

Maintain high code quality by:

1. Following the established patterns and guidelines
2. Using the provided snippets for consistency
3. Ensuring accessibility compliance
4. Running security audits regularly
5. Writing tests for new features

## Integration with Existing Tools

The VS Code configuration works alongside existing tools and configurations:

- **.clinerules**: Provides guidance for building SaaS applications with Next.js, Supabase, and Stripe
- **MCP servers**: Configured for memory, supabase, stripe, fetch, context7, and taskmaster-ai
- **shadcn/ui**: Used for UI components with a focus on accessibility

## Caching Compatibility Patterns

When working with the Enhanced Caching system, particularly with the `EnhancedCachedResearchProjectService`, follow these guidelines to ensure compatibility:

### 1. Handling Pagination Results

The caching system may return pagination results with different property names:

- **Standard Service**: Uses `count` property for total items count
- **Enhanced Service**: Uses `total` property for total items count

To handle this gracefully:

```typescript
// Create an extended interface to handle both property names
interface EnhancedPaginatedResult<T> extends PaginatedResult<T> {
  total?: number;
}

// When setting state, check for both properties
setTotalItems(result.count || result.total || 0);
```

### 2. API Route Pagination

When implementing API routes that use the enhanced caching service:

- Parse query parameters for pagination (`page`, `pageSize`)
- Extract filter parameters from the query string
- Pass all parameters to the caching service methods

```typescript
// Example of proper API route implementation
const url = new URL(request.url);
const page = parseInt(url.searchParams.get('page') || '1');
const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

// Extract filters from query parameters
const filters = {};
url.searchParams.forEach((value, key) => {
  if (key !== 'page' && key !== 'pageSize') {
    filters[key] = value;
  }
});

// Pass all parameters to the service
const result = await EnhancedCachedResearchProjectService.getProjects(
  userId,
  page,
  pageSize,
  Object.keys(filters).length > 0 ? filters : undefined
);
```

### 3. Type Assertions

When TypeScript doesn't recognize the property structure:

```typescript
// Use type assertion to specify the expected return type
const result = await EnhancedCachedResearchProjectService.getProjects(
  userId,
  page,
  pageSize,
  filters
) as { data: ResearchProject[]; total: number };
```

### 4. Memory MCP Integration

Document caching-related changes in the Memory MCP to maintain a knowledge graph of system improvements:

```typescript
// Example of creating an entity for a caching fix
use_mcp_tool({
  server_name: "github.com/modelcontextprotocol/servers/tree/main/src/memory",
  tool_name: "create_entities",
  arguments: {
    entities: [{
      name: "Caching Fix Name",
      entityType: "Code Fix",
      observations: [
        "Description of the fix",
        "Components affected",
        "Implementation details"
      ]
    }]
  }
});
```

## Conclusion

By following these guidelines and using the provided VS Code configuration, you can maintain a consistent and efficient development workflow for the Zenith SaaS platform.
