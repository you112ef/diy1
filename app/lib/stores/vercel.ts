import { atom } from 'nanostores';
import type { VercelConnection } from '~/types/vercel';
import { logStore } from './logs';
import { toast } from 'react-toastify';

// Initialize with stored connection or defaults
const storedConnection = typeof window !== 'undefined' ? localStorage.getItem('vercel_connection') : null;
const initialConnection: VercelConnection = storedConnection
  ? JSON.parse(storedConnection)
  : {
      user: null,
      token: '',
      stats: undefined,
    };

export const vercelConnection = atom<VercelConnection>(initialConnection);
export const isConnecting = atom<boolean>(false);
export const isFetchingStats = atom<boolean>(false);

export const updateVercelConnection = (updates: Partial<VercelConnection>) => {
  const currentState = vercelConnection.get();
  const newState = { ...currentState, ...updates };
  vercelConnection.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('vercel_connection', JSON.stringify(newState));
  }
};

export async function fetchVercelStats(token: string) {
  try {
    isFetchingStats.set(true);

    const projectsApiURL = 'https://api.vercel.com/v9/projects';
    const projectsApiHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log('[VercelStore fetchVercelStats] Requesting Projects:');
    console.log('[VercelStore fetchVercelStats]   Token (first 5 chars):', token ? token.substring(0, 5) + '...' : 'undefined');
    console.log('[VercelStore fetchVercelStats]   Target URL:', projectsApiURL);
    console.log('[VercelStore fetchVercelStats]   Request Headers:', JSON.stringify(projectsApiHeaders, null, 2));

    const projectsResponse = await fetch(projectsApiURL, { headers: projectsApiHeaders });

    console.log('[VercelStore fetchVercelStats] Response Projects:');
    console.log(`[VercelStore fetchVercelStats]   Status: ${projectsResponse.status}`);
    console.log(`[VercelStore fetchVercelStats]   Status Text: ${projectsResponse.statusText}`);
    const projectsResponseHeadersObj: Record<string, string> = {};
    projectsResponse.headers.forEach((value, key) => {
      projectsResponseHeadersObj[key] = value;
    });
    console.log('[VercelStore fetchVercelStats]   Response Headers:', JSON.stringify(projectsResponseHeadersObj, null, 2));

    if (!projectsResponse.ok) {
      const errorBody = await projectsResponse.clone().text();
      console.log('[VercelStore fetchVercelStats]   Projects Error Body (Text):', errorBody);
      try {
        const errorJson = JSON.parse(errorBody);
        console.log('[VercelStore fetchVercelStats]   Projects Error Body (Parsed JSON):', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projectsData = (await projectsResponse.json()) as any;
    const projects = projectsData.projects || [];

    // Fetch latest deployment for each project
    const projectsWithDeployments = await Promise.all(
      projects.map(async (project: any) => {
        try {
          const deploymentsApiURL = `https://api.vercel.com/v6/deployments?projectId=${project.id}&limit=1`;
          const deploymentsApiHeaders = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          };
          console.log(`[VercelStore fetchVercelStats] Requesting Deployments for Project ${project.id}:`);
          console.log('[VercelStore fetchVercelStats]   Target URL:', deploymentsApiURL);
          console.log('[VercelStore fetchVercelStats]   Request Headers:', JSON.stringify(deploymentsApiHeaders, null, 2));

          const deploymentsResponse = await fetch(deploymentsApiURL, { headers: deploymentsApiHeaders });

          console.log(`[VercelStore fetchVercelStats] Response Deployments for Project ${project.id}:`);
          console.log(`[VercelStore fetchVercelStats]   Status: ${deploymentsResponse.status}`);
          console.log(`[VercelStore fetchVercelStats]   Status Text: ${deploymentsResponse.statusText}`);
          const deploymentsResponseHeadersObj: Record<string, string> = {};
          deploymentsResponse.headers.forEach((value, key) => {
            deploymentsResponseHeadersObj[key] = value;
          });
          console.log('[VercelStore fetchVercelStats]   Response Headers:', JSON.stringify(deploymentsResponseHeadersObj, null, 2));

          if (deploymentsResponse.ok) {
            const deploymentsData = (await deploymentsResponse.json()) as any;
            return {
              ...project,
              latestDeployments: deploymentsData.deployments || [],
            };
          }

          return project;
        } catch (error) {
          console.error(`[VercelStore fetchVercelStats] Error fetching deployments for project ${project.id}:`, error);
          // Optionally log error response for this specific deployment fetch if possible, though response object might not be available here
          return project;
        }
      }),
    );

    const currentState = vercelConnection.get();
    updateVercelConnection({
      ...currentState,
      stats: {
        projects: projectsWithDeployments,
        totalProjects: projectsWithDeployments.length,
      },
    });
  } catch (error) {
    console.error('Vercel API Error:', error);
    logStore.logError('Failed to fetch Vercel stats', { error });
    toast.error('Failed to fetch Vercel statistics');
  } finally {
    isFetchingStats.set(false);
  }
}
