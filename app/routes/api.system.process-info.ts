import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import type { ProcessInfo } from '~/types/system';

// Only import child_process if we're not in a Cloudflare environment
let execSync: any;

try {
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.platform) {
    // Using dynamic import to avoid require()
    const childProcess = { execSync: null };
    execSync = childProcess.execSync;
  }
} catch {
  // In Cloudflare environment, this will fail, which is expected
  console.log('Running in Cloudflare environment, child_process not available');
}

// For development environments, we'll always provide mock data if real data isn't available
const isDevelopment = process.env.NODE_ENV === 'development';

// Remove mock data function and replace with real system process info
const getRealProcessInfo = async (): Promise<ProcessInfo[]> => {
  try {
    // Use system commands to get real process information
    const { execSync } = await import('child_process');
    
    let processes: ProcessInfo[] = [];
    const platform = process.platform;
    
    if (platform === 'darwin') {
      // macOS - use ps command
      const output = execSync('ps -eo pid,pcpu,pmem,comm,command', { encoding: 'utf-8' }).toString().trim();
      const lines = output.split('\n').slice(1); // Skip header
      
      processes = lines.map((line: string) => {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[0], 10);
        const cpu = parseFloat(parts[1]);
        const memory = parseFloat(parts[2]);
        const name = parts[3];
        const command = parts.slice(4).join(' ');
        
        return {
          pid,
          name,
          cpu: Math.round(cpu),
          memory: Math.round(memory),
          command: command || name,
          timestamp: new Date().toISOString(),
        };
      }).filter(p => p.pid > 0 && !isNaN(p.cpu) && !isNaN(p.memory));
      
    } else if (platform === 'linux') {
      // Linux - use ps command
      const output = execSync('ps -eo pid,pcpu,pmem,comm,command', { encoding: 'utf-8' }).toString().trim();
      const lines = output.split('\n').slice(1); // Skip header
      
      processes = lines.map((line: string) => {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[0], 10);
        const cpu = parseFloat(parts[1]);
        const memory = parseFloat(parts[2]);
        const name = parts[3];
        const command = parts.slice(4).join(' ');
        
        return {
          pid,
          name,
          cpu: Math.round(cpu),
          memory: Math.round(memory),
          command: command || name,
          timestamp: new Date().toISOString(),
        };
      }).filter(p => p.pid > 0 && !isNaN(p.cpu) && !isNaN(p.memory));
      
    } else if (platform === 'win32') {
      // Windows - use tasklist command
      const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' }).toString().trim();
      const lines = output.split('\n');
      
      processes = lines.map((line: string) => {
        const parts = line.split(',').map(part => part.replace(/"/g, ''));
        const name = parts[0];
        const pid = parseInt(parts[1], 10);
        const memoryStr = parts[4].replace(' K', '');
        const memory = Math.round(parseInt(memoryStr, 10) / 1024); // Convert KB to MB
        
        return {
          pid,
          name,
          cpu: 0, // Windows tasklist doesn't provide CPU usage
          memory,
          command: name,
          timestamp: new Date().toISOString(),
        };
      }).filter(p => p.pid > 0 && !isNaN(p.memory));
    }
    
    // Sort by memory usage (descending) and take top 20
    return processes
      .sort((a, b) => b.memory - a.memory)
      .slice(0, 20);
      
  } catch (error) {
    console.error('Failed to get real process info:', error);
    // Fallback to basic system info if commands fail
    return [
      {
        pid: process.pid,
        name: process.title || 'node',
        cpu: 0,
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        command: process.argv.join(' '),
        timestamp: new Date().toISOString(),
      }
    ];
  }
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    // Check if we're in a Node.js environment
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isNode) {
      return json(
        {
          error: 'Process information is not available in this environment',
        },
        { status: 400 },
      );
    }

    // Get real process information
    const processes = await getRealProcessInfo();
    
    if (processes.length === 0) {
      return json(
        {
          error: 'Failed to retrieve process information',
        },
        { status: 500 },
      );
    }

    return json(processes);
  } catch (error) {
    console.error('Error getting process info:', error);
    return json(
      {
        error: 'Failed to retrieve process information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(getRealProcessInfo());
  } catch (error) {
    console.error('Failed to get process info:', error);
    return json(getMockProcessInfo(), { status: 500 });
  }
};
