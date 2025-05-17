import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { isDevelopmentEnvironment } from '@/lib/utils/auth';
import type { Database } from '@/lib/database.types';

/**
 * Connection pool configuration
 */
interface PoolConfig {
  // Maximum number of connections in the pool
  maxConnections: number;
  
  // Minimum number of connections to keep in the pool
  minConnections: number;
  
  // Maximum time (in milliseconds) that a connection can be idle before being removed
  idleTimeoutMillis: number;
  
  // Maximum time (in milliseconds) to wait for a connection from the pool
  connectionTimeoutMillis: number;
  
  // Maximum number of connection retries
  maxRetries: number;
}

/**
 * Default pool configuration
 */
const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxConnections: 10,
  minConnections: 2,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
  maxRetries: 3
};

/**
 * Development pool configuration (smaller pool)
 */
const DEV_POOL_CONFIG: PoolConfig = {
  maxConnections: 5,
  minConnections: 1,
  idleTimeoutMillis: 10000, // 10 seconds
  connectionTimeoutMillis: 3000, // 3 seconds
  maxRetries: 2
};

/**
 * Connection pool for Supabase clients
 */
class ConnectionPool {
  private pool: Array<{
    client: ReturnType<typeof createClient<Database>>;
    lastUsed: number;
    inUse: boolean;
  }> = [];
  private config: PoolConfig;
  private url: string;
  private key: string;
  
  constructor(url: string, key: string, config: Partial<PoolConfig> = {}) {
    this.url = url;
    this.key = key;
    
    // Merge default config with provided config
    const baseConfig = isDevelopmentEnvironment() ? DEV_POOL_CONFIG : DEFAULT_POOL_CONFIG;
    this.config = { ...baseConfig, ...config };
    
    // Initialize the pool with minimum connections
    this.initializePool();
    
    // Start the idle connection cleanup interval
    this.startIdleConnectionCleanup();
    
    logger.info('Supabase connection pool initialized', {
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections
    });
  }
  
  /**
   * Initialize the pool with minimum connections
   */
  private initializePool() {
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection();
    }
  }
  
  /**
   * Create a new connection and add it to the pool
   */
  private createConnection() {
    const client = createClient<Database>(this.url, this.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      global: {
        fetch: fetch.bind(globalThis)
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    
    this.pool.push({
      client,
      lastUsed: Date.now(),
      inUse: false
    });
    
    return client;
  }
  
  /**
   * Get a connection from the pool
   * @returns Supabase client
   */
  public async getConnection(): Promise<ReturnType<typeof createClient<Database>>> {
    // Find an available connection
    const availableConnection = this.pool.find(conn => !conn.inUse);
    
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      return availableConnection.client;
    }
    
    // If no available connection and pool is not full, create a new one
    if (this.pool.length < this.config.maxConnections) {
      const client = this.createConnection();
      this.pool[this.pool.length - 1].inUse = true;
      return client;
    }
    
    // If pool is full, wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout: Could not get a connection from the pool'));
      }, this.config.connectionTimeoutMillis);
      
      const checkForAvailableConnection = () => {
        const availableConnection = this.pool.find(conn => !conn.inUse);
        
        if (availableConnection) {
          clearTimeout(timeout);
          availableConnection.inUse = true;
          availableConnection.lastUsed = Date.now();
          resolve(availableConnection.client);
        } else {
          // Check again after a short delay
          setTimeout(checkForAvailableConnection, 100);
        }
      };
      
      checkForAvailableConnection();
    });
  }
  
  /**
   * Release a connection back to the pool
   * @param client Supabase client to release
   */
  public releaseConnection(client: ReturnType<typeof createClient<Database>>) {
    const connectionIndex = this.pool.findIndex(conn => conn.client === client);
    
    if (connectionIndex !== -1) {
      this.pool[connectionIndex].inUse = false;
      this.pool[connectionIndex].lastUsed = Date.now();
    }
  }
  
  /**
   * Start the idle connection cleanup interval
   */
  private startIdleConnectionCleanup() {
    setInterval(() => {
      const now = Date.now();
      
      // Keep at least minConnections in the pool
      if (this.pool.length > this.config.minConnections) {
        // Find idle connections that exceed the idle timeout
        const idleConnections = this.pool
          .filter(conn => !conn.inUse && now - conn.lastUsed > this.config.idleTimeoutMillis)
          .sort((a, b) => a.lastUsed - b.lastUsed); // Sort by oldest first
        
        // Remove excess idle connections, but keep at least minConnections
        const connectionsToRemove = Math.min(
          idleConnections.length,
          this.pool.length - this.config.minConnections
        );
        
        if (connectionsToRemove > 0) {
          for (let i = 0; i < connectionsToRemove; i++) {
            const connectionIndex = this.pool.findIndex(conn => conn === idleConnections[i]);
            if (connectionIndex !== -1) {
              this.pool.splice(connectionIndex, 1);
            }
          }
          
          logger.info('Removed idle connections from pool', { count: connectionsToRemove });
        }
      }
    }, this.config.idleTimeoutMillis);
  }
  
  /**
   * Get the current pool size
   * @returns Current pool size
   */
  public getPoolSize(): number {
    return this.pool.length;
  }
  
  /**
   * Get the number of active connections
   * @returns Number of active connections
   */
  public getActiveConnectionCount(): number {
    return this.pool.filter(conn => conn.inUse).length;
  }
  
  /**
   * Get the number of idle connections
   * @returns Number of idle connections
   */
  public getIdleConnectionCount(): number {
    return this.pool.filter(conn => !conn.inUse).length;
  }
  
  /**
   * Get pool statistics
   * @returns Pool statistics
   */
  public getPoolStats() {
    return {
      totalConnections: this.pool.length,
      activeConnections: this.getActiveConnectionCount(),
      idleConnections: this.getIdleConnectionCount(),
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections
    };
  }
}

// Create a singleton instance of the connection pool
let connectionPool: ConnectionPool | null = null;

/**
 * Get the connection pool instance
 * @returns Connection pool instance
 */
export function getConnectionPool(): ConnectionPool {
  if (!connectionPool) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    
    connectionPool = new ConnectionPool(supabaseUrl, supabaseKey);
  }
  
  return connectionPool;
}

/**
 * Get a client from the connection pool
 * @returns Supabase client
 */
export async function getPooledClient(): Promise<ReturnType<typeof createClient<Database>>> {
  const pool = getConnectionPool();
  return pool.getConnection();
}

/**
 * Release a client back to the connection pool
 * @param client Supabase client to release
 */
export function releaseClient(client: ReturnType<typeof createClient<Database>>) {
  const pool = getConnectionPool();
  pool.releaseConnection(client);
}

/**
 * Execute a function with a pooled client
 * @param fn Function to execute with the client
 * @returns Result of the function
 */
export async function withPooledClient<T>(
  fn: (client: ReturnType<typeof createClient<Database>>) => Promise<T>
): Promise<T> {
  const client = await getPooledClient();
  
  try {
    return await fn(client);
  } finally {
    releaseClient(client);
  }
}

/**
 * Get pool statistics
 * @returns Pool statistics
 */
export function getPoolStats() {
  if (!connectionPool) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      maxConnections: DEFAULT_POOL_CONFIG.maxConnections,
      minConnections: DEFAULT_POOL_CONFIG.minConnections
    };
  }
  
  return connectionPool.getPoolStats();
}
