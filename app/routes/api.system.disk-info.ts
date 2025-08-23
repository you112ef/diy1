import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

interface DiskInfo {
  filesystem: string;
  size: number;
  used: number;
  available: number;
  percentage: number;
  mountpoint: string;
  timestamp: string;
  error?: string;
}

// Cloudflare-compatible disk information
const getCloudflareDiskInfo = (): DiskInfo[] => {
  const timestamp = new Date().toISOString();

  /*
   * In Cloudflare Workers environment, disk information is not available
   * Return a placeholder with information about the environment
   */
  return [
    {
      filesystem: 'Cloudflare Workers',
      size: 0,
      used: 0,
      available: 0,
      percentage: 0,
      mountpoint: '/',
      timestamp,
      error: 'Disk information is not available in Cloudflare Workers environment',
    },
  ];
};

// Node.js compatible disk information (for development)
const getNodeDiskInfo = async (): Promise<DiskInfo[]> => {
  try {
    // Only import fs if we're in a Node.js environment
    let fs: any;

    try {
      if (typeof process !== 'undefined' && process.platform) {
        fs = await import('fs');
      }
    } catch {
      // In Cloudflare environment, this will fail, which is expected
      return getCloudflareDiskInfo();
    }

    if (!fs) {
      return getCloudflareDiskInfo();
    }

    const platform = process.platform;
    let diskInfo: DiskInfo[] = [];

    if (platform === 'darwin' || platform === 'linux') {
      try {
        // Use df command to get disk information
        const { execSync } = await import('child_process');
        const output = execSync('df -h', { encoding: 'utf-8' }).toString().trim();
        const lines = output.split('\n').slice(1); // Skip header

        diskInfo = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const filesystem = parts[0];
          const sizeStr = parts[1];
          const usedStr = parts[2];
          const availableStr = parts[3];
          const percentageStr = parts[4];
          const mountpoint = parts[5];

          // Convert size strings to bytes
          const parseSize = (sizeStr: string): number => {
            const size = parseFloat(sizeStr);

            if (sizeStr.includes('T')) {
              return size * 1024 * 1024 * 1024 * 1024;
            }

            if (sizeStr.includes('G')) {
              return size * 1024 * 1024 * 1024;
            }

            if (sizeStr.includes('M')) {
              return size * 1024 * 1024;
            }

            if (sizeStr.includes('K')) {
              return size * 1024;
            }

            return size;
          };

          const size = parseSize(sizeStr);
          const used = parseSize(usedStr);
          const available = parseSize(availableStr);
          const percentage = parseInt(percentageStr.replace('%', ''), 10);

          return {
            filesystem,
            size,
            used,
            available,
            percentage,
            mountpoint,
            timestamp: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('Failed to get disk info:', error);
        return getCloudflareDiskInfo();
      }
    } else if (platform === 'win32') {
      try {
        const { execSync } = await import('child_process');
        const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8' }).toString().trim();
        const lines = output.split('\n').slice(1); // Skip header

        diskInfo = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const caption = parts[0];
          const freeSpace = parseInt(parts[1], 10);
          const size = parseInt(parts[2], 10);
          const used = size - freeSpace;
          const percentage = Math.round((used / size) * 100);

          return {
            filesystem: `${caption}:`,
            size,
            used,
            available: freeSpace,
            percentage,
            mountpoint: `${caption}:\\`,
            timestamp: new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('Failed to get Windows disk info:', error);
        return getCloudflareDiskInfo();
      }
    }

    return diskInfo.length > 0 ? diskInfo : getCloudflareDiskInfo();
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return getCloudflareDiskInfo();
  }
};

const getDiskInfo = async (): Promise<DiskInfo[]> => {
  // Check if we're in a Cloudflare environment
  const isCloudflare = typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;
  const isNode = typeof process !== 'undefined' && process.platform;

  if (isCloudflare || !isNode) {
    return getCloudflareDiskInfo();
  }

  return await getNodeDiskInfo();
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    return json(await getDiskInfo());
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return json(getCloudflareDiskInfo(), { status: 500 });
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(await getDiskInfo());
  } catch (error) {
    console.error('Failed to get disk info:', error);
    return json(getCloudflareDiskInfo(), { status: 500 });
  }
};
