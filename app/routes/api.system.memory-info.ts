import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  percentage: number;
  timestamp: string;
  error?: string;
}

// Cloudflare-compatible memory information
const getCloudflareMemoryInfo = (): MemoryInfo => {
  const timestamp = new Date().toISOString();
  
  // In Cloudflare Workers environment, memory information is limited
  // We can only get approximate values from the runtime
  return {
    total: 128 * 1024 * 1024, // 128MB typical Worker memory limit
    free: 64 * 1024 * 1024,   // Approximate free memory
    used: 64 * 1024 * 1024,   // Approximate used memory
    percentage: 50,            // Approximate usage percentage
    timestamp,
    error: 'Memory information is approximate in Cloudflare Workers environment'
  };
};

// Node.js compatible memory information (for development)
const getNodeMemoryInfo = (): MemoryInfo => {
  try {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return getCloudflareMemoryInfo();
    }

    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const free = total - used;
    const percentage = Math.round((used / total) * 100);

    return {
      total,
      free,
      used,
      percentage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get Node.js memory info:', error);
    return getCloudflareMemoryInfo();
  }
};

// Browser-compatible memory information
const getBrowserMemoryInfo = (): MemoryInfo => {
  const timestamp = new Date().toISOString();
  
  try {
    // Check if performance.memory is available (Chrome/Edge)
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      const total = mem.jsHeapSizeLimit;
      const used = mem.usedJSHeapSize;
      const free = total - used;
      const percentage = Math.round((used / total) * 100);

      return {
        total,
        free,
        used,
        percentage,
        timestamp,
      };
    }

    // Fallback for browsers without performance.memory
    return {
      total: 0,
      free: 0,
      used: 0,
      percentage: 0,
      timestamp,
      error: 'Memory information not available in this browser'
    };
  } catch (error) {
    console.error('Failed to get browser memory info:', error);
    return {
      total: 0,
      free: 0,
      used: 0,
      percentage: 0,
      timestamp,
      error: 'Failed to get memory information'
    };
  }
};

const getMemoryInfo = (): MemoryInfo => {
  // Check environment and return appropriate memory info
  const isCloudflare = typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;
  const isNode = typeof process !== 'undefined' && process.memoryUsage;
  const isBrowser = typeof window !== 'undefined';
  
  if (isCloudflare) {
    return getCloudflareMemoryInfo();
  } else if (isNode) {
    return getNodeMemoryInfo();
  } else if (isBrowser) {
    return getBrowserMemoryInfo();
  } else {
    return getCloudflareMemoryInfo();
  }
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    return json(getMemoryInfo());
  } catch (error) {
    console.error('Failed to get memory info:', error);
    return json(getCloudflareMemoryInfo(), { status: 500 });
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(getMemoryInfo());
  } catch (error) {
    console.error('Failed to get memory info:', error);
    return json(getCloudflareMemoryInfo(), { status: 500 });
  }
};
