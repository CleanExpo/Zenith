# Database Sharding Strategy for Zenith

This document outlines the database sharding strategy for the Zenith SaaS platform to support horizontal scaling as the user base and data volume grow.

## Overview

Database sharding is a technique for distributing data across multiple database instances to improve performance, scalability, and availability. As Zenith grows, we'll need to implement sharding to handle increased load and data volume.

## Current Architecture

Currently, Zenith uses a single Supabase PostgreSQL database with the following characteristics:

- All data is stored in a single database instance
- Connection pooling is implemented via `lib/supabase/poolConfig.ts`
- Row-level security (RLS) is used for data isolation between tenants
- Database functions are used for complex operations

## Sharding Approach

We will implement a **tenant-based sharding** approach, where data for different tenants (organizations) is distributed across multiple database instances. This approach provides several benefits:

1. **Isolation**: Each tenant's data is isolated, improving security and reducing noisy neighbor problems
2. **Scalability**: As new tenants are added, they can be assigned to less-loaded shards
3. **Performance**: Queries for a specific tenant only need to access a single shard
4. **Compliance**: Easier to meet data residency requirements by placing shards in specific regions

## Shard Key Selection

The primary shard key will be the **tenant_id** (organization ID), which will determine which database shard contains a tenant's data. This approach works well because:

1. Most queries in Zenith are scoped to a single tenant
2. Tenant data has natural boundaries with minimal cross-tenant queries
3. The number of tenants will grow over time, making it a good sharding dimension

## Sharding Architecture

### Shard Management Service

A new shard management service will be implemented with the following responsibilities:

1. **Shard Mapping**: Maintain a mapping of tenant IDs to database shards
2. **Shard Allocation**: Assign new tenants to shards based on load balancing algorithms
3. **Shard Routing**: Route queries to the appropriate shard based on the tenant ID
4. **Shard Rebalancing**: Move tenants between shards when necessary to balance load

### Implementation Phases

The sharding implementation will be rolled out in phases:

#### Phase 1: Shard-Ready Architecture

1. Refactor the data access layer to support multiple database connections
2. Implement the shard management service with a single shard
3. Update all queries to route through the shard management service
4. Ensure all tenant data is properly isolated with tenant IDs

#### Phase 2: Read-Only Sharding

1. Add support for multiple read-only replicas
2. Implement read/write splitting to distribute read queries across replicas
3. Add monitoring and observability for shard performance

#### Phase 3: Full Sharding

1. Implement multi-shard support in the shard management service
2. Develop tools for migrating tenants between shards
3. Implement cross-shard query capabilities for admin and reporting features
4. Add automated shard rebalancing based on load metrics

## Shard Data Model

Each shard will contain the same database schema, with tables partitioned by tenant ID. The key tables affected include:

- `research_projects`: Partitioned by tenant_id
- `users`: Global table with references to tenant-specific data
- `teams`: Partitioned by tenant_id
- `analytics`: Partitioned by tenant_id
- `collaboration`: Partitioned by tenant_id

## Query Routing

Queries will be routed to the appropriate shard using the following approach:

1. **Authentication**: When a user authenticates, the system retrieves their tenant ID
2. **Shard Lookup**: The tenant ID is used to look up the appropriate shard
3. **Connection Selection**: A connection is established to the appropriate shard
4. **Query Execution**: The query is executed on the selected shard

For queries that span multiple tenants (e.g., admin reports), a federated query approach will be used:

1. Execute the query on each relevant shard
2. Combine the results in the application layer
3. Apply any necessary post-processing or aggregation

## Connection Pooling

Connection pooling will be enhanced to support multiple shards:

1. Maintain separate connection pools for each shard
2. Implement dynamic pool sizing based on shard load
3. Add connection pool metrics for monitoring

## Monitoring and Observability

To ensure the sharding strategy is effective, we'll implement comprehensive monitoring:

1. **Shard Load Metrics**: Track CPU, memory, disk I/O, and connection count per shard
2. **Query Performance**: Monitor query execution time across shards
3. **Rebalancing Metrics**: Track tenant migrations and rebalancing operations
4. **Tenant Growth**: Monitor tenant data growth to predict future shard needs

## Backup and Recovery

Each shard will have its own backup and recovery strategy:

1. Regular automated backups of each shard
2. Point-in-time recovery capabilities
3. Cross-region replication for disaster recovery
4. Tenant-level backup and restore capabilities

## Implementation Considerations

### Schema Changes

When making schema changes, we need to ensure consistency across all shards:

1. Use a schema migration tool that supports multiple databases
2. Apply schema changes to all shards in a coordinated manner
3. Implement version tracking for each shard's schema

### Tenant Migration

When rebalancing shards, we need to migrate tenants with minimal disruption:

1. Implement a background migration process that copies tenant data to the new shard
2. Use a dual-write approach during migration to keep both shards in sync
3. Switch tenant traffic to the new shard once migration is complete
4. Verify data integrity before removing data from the old shard

### Cross-Shard Transactions

For operations that span multiple shards:

1. Avoid cross-shard transactions where possible
2. Implement a two-phase commit protocol for necessary cross-shard transactions
3. Use eventual consistency for non-critical cross-shard operations

## Future Considerations

As Zenith continues to grow, we may need to consider additional sharding strategies:

1. **Functional Sharding**: Splitting different types of data across different shards
2. **Geographic Sharding**: Placing tenant data in shards located in specific regions
3. **Hybrid Sharding**: Combining tenant-based and functional sharding approaches

## Conclusion

This sharding strategy provides a roadmap for scaling the Zenith database infrastructure as the platform grows. By implementing tenant-based sharding, we can achieve better performance, scalability, and isolation while maintaining a consistent user experience.

The implementation will be phased to minimize disruption and allow for iterative improvements based on real-world usage patterns and performance metrics.
