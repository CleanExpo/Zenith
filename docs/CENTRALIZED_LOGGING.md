# Centralized Logging System for Zenith

This document outlines the centralized logging system for the Zenith SaaS platform, designed to provide comprehensive visibility into application behavior, performance, and errors.

## Overview

A centralized logging system is essential for monitoring and troubleshooting a distributed application. As Zenith scales, having a unified view of logs across all components becomes critical for maintaining system health and quickly resolving issues.

## Current Logging Implementation

Currently, Zenith uses a basic logging system with the following characteristics:

- Logger implementation in `lib/logger.ts`
- Console-based logging in development
- Basic log levels (info, warn, error)
- Limited structured logging

## Enhanced Logging Architecture

The enhanced centralized logging system will have the following components:

### 1. Structured Logging

All logs will be structured as JSON objects with consistent fields:

```json
{
  "timestamp": "2025-05-17T13:15:33.000Z",
  "level": "info",
  "message": "User authenticated",
  "service": "auth-service",
  "traceId": "abc123",
  "userId": "user-456",
  "tenantId": "tenant-789",
  "metadata": {
    "browser": "Chrome",
    "ip": "192.168.1.1"
  }
}
```

Key fields include:

- **timestamp**: ISO 8601 timestamp
- **level**: Log level (debug, info, warn, error, fatal)
- **message**: Human-readable log message
- **service**: Service or component generating the log
- **traceId**: Unique identifier for tracing requests across services
- **userId**: User ID (if applicable)
- **tenantId**: Tenant/organization ID (if applicable)
- **metadata**: Additional context-specific information

### 2. Log Transport

Logs will be transported from the application to the centralized storage using:

1. **Development Environment**:
   - Console output for immediate visibility
   - Local file storage for persistence

2. **Production Environment**:
   - Buffered in-memory transport with batching
   - Secure HTTPS transport to log storage
   - Fallback to local storage during connectivity issues

### 3. Centralized Storage

Logs will be stored in a centralized system with the following characteristics:

1. **Primary Storage**: Elasticsearch for indexing and searching
2. **Long-term Archive**: S3-compatible object storage
3. **Retention Policies**:
   - Hot storage (Elasticsearch): 7 days
   - Warm storage (Elasticsearch): 30 days
   - Cold storage (S3): 1 year

### 4. Log Aggregation and Processing

Logs will be processed in real-time to:

1. Enrich logs with additional context
2. Filter sensitive information
3. Normalize formats
4. Generate metrics
5. Trigger alerts based on patterns

### 5. Visualization and Analysis

Logs will be visualized and analyzed using:

1. **Kibana Dashboard**: For real-time monitoring and ad-hoc analysis
2. **Custom Admin Dashboard**: Integrated into the Zenith admin interface
3. **Automated Reports**: Daily/weekly summaries of key metrics

## Implementation Plan

The centralized logging system will be implemented in phases:

### Phase 1: Enhanced Logger

1. Update the logger implementation to support structured logging
2. Add context propagation for trace IDs
3. Implement log sanitization for sensitive data
4. Add support for custom metadata

### Phase 2: Transport and Storage

1. Implement batched log transport
2. Set up Elasticsearch for log storage
3. Configure S3 for long-term archival
4. Implement retention policies

### Phase 3: Visualization and Alerting

1. Set up Kibana dashboards
2. Integrate logging into the admin interface
3. Implement alerting based on log patterns
4. Create automated reports

## Logger API

The enhanced logger will provide the following API:

```typescript
// Basic logging with levels
logger.debug(message, metadata);
logger.info(message, metadata);
logger.warn(message, metadata);
logger.error(message, metadata);
logger.fatal(message, metadata);

// Context-aware logging
const contextLogger = logger.withContext({ userId, tenantId });
contextLogger.info('User action', { action: 'login' });

// Request-scoped logging
const requestLogger = logger.forRequest(req);
requestLogger.info('API request received');

// Component-specific logging
const authLogger = logger.forComponent('auth-service');
authLogger.info('Authentication attempt');

// Performance logging
logger.timing('database_query', timeInMs);
```

## Log Categories

Logs will be categorized to facilitate filtering and analysis:

1. **Access Logs**: Authentication and authorization events
2. **Audit Logs**: Security-relevant actions
3. **Error Logs**: Application errors and exceptions
4. **Performance Logs**: Timing and resource usage
5. **Application Logs**: General application events
6. **System Logs**: Infrastructure and platform events

## Security Considerations

The logging system will implement the following security measures:

1. **Data Sanitization**: Automatically redact sensitive information (passwords, tokens, PII)
2. **Access Control**: Role-based access to log data
3. **Encryption**: Logs encrypted in transit and at rest
4. **Compliance**: Configurable retention policies for regulatory compliance

## Monitoring and Alerting

The logging system will support the following monitoring and alerting capabilities:

1. **Real-time Alerts**: Immediate notifications for critical errors
2. **Threshold Alerts**: Notifications when error rates exceed thresholds
3. **Anomaly Detection**: Alerts for unusual patterns in log data
4. **Uptime Monitoring**: Tracking service availability
5. **Performance Monitoring**: Tracking response times and resource usage

## Integration with Other Systems

The logging system will integrate with:

1. **Error Tracking**: Detailed error reporting and grouping
2. **APM (Application Performance Monitoring)**: Tracing and performance metrics
3. **User Analytics**: Correlating user behavior with system events
4. **Security Monitoring**: Detecting suspicious activities

## Best Practices for Developers

Developers should follow these guidelines when using the logging system:

1. **Be Specific**: Use clear, descriptive log messages
2. **Include Context**: Add relevant metadata to logs
3. **Use Appropriate Levels**: Reserve error level for actual errors
4. **Avoid Sensitive Data**: Never log passwords, tokens, or PII
5. **Include Request IDs**: Always propagate trace IDs for request tracking
6. **Log Actionable Information**: Focus on information that helps troubleshooting

## Example Implementation

Here's an example of how the enhanced logger will be used in the application:

```typescript
import { logger } from '@/lib/logger';

// In an API route handler
export async function GET(req: Request) {
  const requestLogger = logger.forRequest(req);
  
  try {
    requestLogger.info('Processing research projects request');
    
    const startTime = performance.now();
    const projects = await getResearchProjects();
    const endTime = performance.now();
    
    requestLogger.timing('get_research_projects', endTime - startTime);
    requestLogger.info('Retrieved research projects', { count: projects.length });
    
    return Response.json({ projects });
  } catch (error) {
    requestLogger.error('Failed to retrieve research projects', { 
      error: error.message,
      stack: error.stack
    });
    
    return Response.json({ error: 'Failed to retrieve projects' }, { status: 500 });
  }
}
```

## Conclusion

The centralized logging system will provide comprehensive visibility into the Zenith platform, enabling faster troubleshooting, better performance monitoring, and improved security. By implementing structured logging with consistent fields and centralized storage, we can effectively manage logs at scale and extract valuable insights from the data.

The phased implementation approach allows for incremental improvements while ensuring that critical logging capabilities are available from the start.
