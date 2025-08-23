import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  command?: string;
  timestamp: string;
  error?: string;
}

// Cloudflare-compatible system information
const getCloudflareSystemInfo = (): ProcessInfo[] => {
  const timestamp = new Date().toISOString();

  // In Cloudflare Workers environment, we can get some basic info
  const processes: ProcessInfo[] = [
    {
      pid: 1,
      name: 'Cloudflare Worker',
      cpu: 0, // CPU usage not available in Workers
      memory: 0, // Memory usage not available in Workers
      command: 'Bolt AI Worker Process',
      timestamp,
    },
    {
      pid: 2,
      name: 'System',
      cpu: 0,
      memory: 0,
      command: 'Cloudflare Runtime',
      timestamp,
    },
  ];

  return processes;
};

// Node.js compatible system information (for development)
const getNodeSystemInfo = async (): Promise<ProcessInfo[]> => {
  try {
    // Only import child_process if we're in a Node.js environment
    let execSync: any;

    try {
      if (typeof process !== 'undefined' && process.platform) {
        const childProcess = await import('child_process');
        execSync = childProcess.execSync;
      }
    } catch {
      // In Cloudflare environment, this will fail, which is expected
      return getCloudflareSystemInfo();
    }

    if (!execSync) {
      return getCloudflareSystemInfo();
    }

    const platform = process.platform;
    let processes: ProcessInfo[] = [];

    // Get CPU count for normalizing CPU percentages
    let cpuCount = 1;

    try {
      if (platform === 'darwin') {
        const cpuInfo = execSync('sysctl -n hw.ncpu', { encoding: 'utf-8' }).toString().trim();
        cpuCount = parseInt(cpuInfo, 10) || 1;
      } else if (platform === 'linux') {
        const cpuInfo = execSync('nproc', { encoding: 'utf-8' }).toString().trim();
        cpuCount = parseInt(cpuInfo, 10) || 1;
      } else if (platform === 'win32') {
        const cpuInfo = execSync('wmic cpu get NumberOfCores', { encoding: 'utf-8' }).toString().trim();
        const match = cpuInfo.match(/\d+/);
        cpuCount = match ? parseInt(match[0], 10) : 1;
      }
    } catch (error) {
      console.error('Failed to get CPU count:', error);
      cpuCount = 1;
    }

    if (platform === 'darwin') {
      try {
        const output = execSync('ps -eo pid,pcpu,pmem,comm -r | head -n 11', { encoding: 'utf-8' }).toString().trim();
        const lines = output.split('\n').slice(1);

        processes = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[0], 10);
          const cpu = parseFloat(parts[1]) / cpuCount;
          const memory = parseFloat(parts[2]);
          const command = parts.slice(3).join(' ');

          return {
            pid,
            name: command.split('/').pop() || command,
            cpu,
            memory,
            command,
            timestamp: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('Failed to get macOS process info:', error);
        return getCloudflareSystemInfo();
      }
    } else if (platform === 'linux') {
      try {
        const output = execSync('ps -eo pid,pcpu,pmem,comm --sort=-%cpu | head -n 11', { encoding: 'utf-8' })
          .toString()
          .trim();
        const lines = output.split('\n').slice(1);

        processes = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[0], 10);
          const cpu = parseFloat(parts[1]) / cpuCount;
          const memory = parseFloat(parts[2]);
          const command = parts.slice(3).join(' ');

          return {
            pid,
            name: command.split('/').pop() || command,
            cpu,
            memory,
            command,
            timestamp: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('Failed to get Linux process info:', error);
        return getCloudflareSystemInfo();
      }
    } else if (platform === 'win32') {
      try {
        const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf-8' }).toString().trim();
        const lines = output.split('\n').slice(0, 10);

        processes = lines.map((line: string) => {
          const parts = line.split(',').map((part) => part.replace(/"/g, ''));
          const name = parts[0];
          const pid = parseInt(parts[1], 10);
          const memory = parseFloat(parts[4]) || 0;

          return {
            pid,
            name: name.split('.')[0],
            cpu: 0, // CPU not available in tasklist
            memory: memory / 1024, // Convert KB to MB
            command: name,
            timestamp: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('Failed to get Windows process info:', error);
        return getCloudflareSystemInfo();
      }
    }

    return processes.length > 0 ? processes : getCloudflareSystemInfo();
  } catch (error) {
    console.error('Failed to get system info:', error);
    return getCloudflareSystemInfo();
  }
};

const getProcessInfo = async (): Promise<ProcessInfo[]> => {
  // Check if we're in a Cloudflare environment
  const isCloudflare = typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;
  const isNode = typeof process !== 'undefined' && process.platform;

  if (isCloudflare || !isNode) {
    return getCloudflareSystemInfo();
  }

  return await getNodeSystemInfo();
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    return json(await getProcessInfo());
  } catch (error) {
    console.error('Failed to get process info:', error);
    return json(getCloudflareSystemInfo(), { status: 500 });
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(await getProcessInfo());
  } catch (error) {
    console.error('Failed to get process info:', error);
    return json(getCloudflareSystemInfo(), { status: 500 });
  }
};
