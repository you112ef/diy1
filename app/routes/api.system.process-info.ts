import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

// Exec not available in edge/runtime; keep null to avoid mocks
const execSync: any = null;

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  command?: string;
  timestamp: string;
  error?: string;
}

const getProcessInfo = (): ProcessInfo[] => {
  try {
    // If execution is not available in this environment, return explicit not-available error
    if (!execSync) {
      return [
        {
          pid: 0,
          name: 'N/A',
          cpu: 0,
          memory: 0,
          timestamp: new Date().toISOString(),
          error: 'Process information is not available in this environment',
        },
      ];
    }

    // Different commands for different operating systems
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

      // Default to 1 if we can't get the count
      cpuCount = 1;
    }

    if (platform === 'darwin') {
      // macOS - use ps command to get process information
      try {
        const output = execSync('ps -eo pid,pcpu,pmem,comm -r | head -n 11', { encoding: 'utf-8' }).toString().trim();

        // Skip the header line
        const lines = output.split('\n').slice(1);

        processes = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[0], 10);

          /*
           * Normalize CPU percentage by dividing by CPU count
           * This converts from "% of all CPUs" to "% of one CPU"
           */
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

        // Try alternative command
        try {
          const output = execSync('top -l 1 -stats pid,cpu,mem,command -n 10', { encoding: 'utf-8' }).toString().trim();

          // Parse top output - skip the first few lines of header
          const lines = output.split('\n').slice(6);

          processes = lines.map((line: string) => {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[0], 10);
            const cpu = parseFloat(parts[1]);
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
        } catch (fallbackError) {
          console.error('Failed to get macOS process info with fallback:', fallbackError);
          return [
            {
              pid: 0,
              name: 'N/A',
              cpu: 0,
              memory: 0,
              timestamp: new Date().toISOString(),
              error: 'Process information is not available in this environment',
            },
          ];
        }
      }
    } else if (platform === 'linux') {
      // Linux - use ps command to get process information
      try {
        const output = execSync('ps -eo pid,pcpu,pmem,comm --sort=-pmem | head -n 11', { encoding: 'utf-8' })
          .toString()
          .trim();

        // Skip the header line
        const lines = output.split('\n').slice(1);

        processes = lines.map((line: string) => {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[0], 10);

          // Normalize CPU percentage by dividing by CPU count
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

        // Try alternative command
        try {
          const output = execSync('top -b -n 1 | head -n 17', { encoding: 'utf-8' }).toString().trim();

          // Parse top output - skip the first few lines of header
          const lines = output.split('\n').slice(7);

          processes = lines.map((line: string) => {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[0], 10);
            const cpu = parseFloat(parts[8]);
            const memory = parseFloat(parts[9]);
            const command = parts[11] || parts[parts.length - 1];

            return {
              pid,
              name: command.split('/').pop() || command,
              cpu,
              memory,
              command,
              timestamp: new Date().toISOString(),
            };
          });
        } catch (fallbackError) {
          console.error('Failed to get Linux process info with fallback:', fallbackError);
          return [
            {
              pid: 0,
              name: 'N/A',
              cpu: 0,
              memory: 0,
              timestamp: new Date().toISOString(),
              error: 'Process information is not available in this environment',
            },
          ];
        }
      }
    } else if (platform === 'win32') {
      // Windows - use PowerShell to get process information
      try {
        const output = execSync(
          'powershell "Get-Process | Sort-Object -Property WorkingSet64 -Descending | Select-Object -First 10 Id, CPU, @{Name=\'Memory\';Expression={$_.WorkingSet64/1MB}}, ProcessName | ConvertTo-Json"',
          { encoding: 'utf-8' },
        )
          .toString()
          .trim();

        const processData = JSON.parse(output);
        const processArray = Array.isArray(processData) ? processData : [processData];

        processes = processArray.map((proc: any) => ({
          pid: proc.Id,
          name: proc.ProcessName,

          // Normalize CPU percentage by dividing by CPU count
          cpu: (proc.CPU || 0) / cpuCount,
          memory: proc.Memory,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Failed to get Windows process info:', error);

        // Try alternative command using tasklist
        try {
          const output = execSync('tasklist /FO CSV', { encoding: 'utf-8' }).toString().trim();

          // Parse CSV output - skip the header line
          const lines = output.split('\n').slice(1);

          processes = lines.slice(0, 10).map((line: string) => {
            // Parse CSV format
            const parts = line.split(',').map((part: string) => part.replace(/^"(.+)"$/, '$1'));
            const pid = parseInt(parts[1], 10);
            const memoryStr = parts[4].replace(/[^\d]/g, '');
            const memory = parseInt(memoryStr, 10) / 1024; // Convert KB to MB

            return {
              pid,
              name: parts[0],
              cpu: 0, // tasklist doesn't provide CPU info
              memory,
              timestamp: new Date().toISOString(),
            };
          });
        } catch (fallbackError) {
          console.error('Failed to get Windows process info with fallback:', fallbackError);
          return [
            {
              pid: 0,
              name: 'N/A',
              cpu: 0,
              memory: 0,
              timestamp: new Date().toISOString(),
              error: 'Process information is not available in this environment',
            },
          ];
        }
      }
    } else {
      console.warn(`Unsupported platform: ${platform}, using browser fallback`);
      return [
        {
          pid: 0,
          name: 'N/A',
          cpu: 0,
          memory: 0,
          timestamp: new Date().toISOString(),
          error: 'Process information is not available in this environment',
        },
      ];
    }

    return processes;
  } catch (error) {
    console.error('Failed to get process info:', error);

    return [
      {
        pid: 0,
        name: 'N/A',
        cpu: 0,
        memory: 0,
        timestamp: new Date().toISOString(),
        error: 'Process information is not available in this environment',
      },
    ];
  }
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    return json(getProcessInfo());
  } catch (error) {
    console.error('Failed to get process info:', error);
    return json(
      [
        {
          pid: 0,
          name: 'N/A',
          cpu: 0,
          memory: 0,
          timestamp: new Date().toISOString(),
          error: 'Process information is not available in this environment',
        },
      ],
      { status: 500 },
    );
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(getProcessInfo());
  } catch (error) {
    console.error('Failed to get process info:', error);
    return json(
      [
        {
          pid: 0,
          name: 'N/A',
          cpu: 0,
          memory: 0,
          timestamp: new Date().toISOString(),
          error: 'Process information is not available in this environment',
        },
      ],
      { status: 500 },
    );
  }
};
