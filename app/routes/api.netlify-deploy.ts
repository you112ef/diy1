import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import crypto from 'crypto';
import type { NetlifySiteInfo } from '~/types/netlify';

interface DeployRequestBody {
  siteId?: string;
  files: Record<string, string>;
  chatId: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { siteId, files, token, chatId } = (await request.json()) as DeployRequestBody & { token: string };

    if (!token) {
      return json({ error: 'Not connected to Netlify' }, { status: 401 });
    }

    let targetSiteId = siteId;
    let siteInfo: NetlifySiteInfo | undefined;

    // If no siteId provided, create a new site
    if (!targetSiteId) {
      const siteName = `bolt-diy-${chatId}-${Date.now()}`;
      const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: siteName,
          custom_domain: null,
        }),
      });

      if (!createSiteResponse.ok) {
        const errorData = await createSiteResponse.json().catch(() => ({ message: createSiteResponse.statusText }));
        return json({ error: 'Failed to create site on Netlify', details: errorData.message || errorData.error || errorData }, { status: createSiteResponse.status });
      }

      const newSite = (await createSiteResponse.json()) as any;
      targetSiteId = newSite.id;
      siteInfo = {
        id: newSite.id,
        name: newSite.name,
        url: newSite.url,
        chatId,
      };
    } else {
      // Get existing site info
      if (targetSiteId) {
        const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (siteResponse.ok) {
          const existingSite = (await siteResponse.json()) as any;
          siteInfo = {
            id: existingSite.id,
            name: existingSite.name,
            url: existingSite.url,
            chatId,
          };
        } else {
          targetSiteId = undefined;
        }
      }

      // If no siteId provided or site doesn't exist, create a new site
      if (!targetSiteId) {
        const siteName = `bolt-diy-${chatId}-${Date.now()}`;
        const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: siteName,
            custom_domain: null,
          }),
        });

        if (!createSiteResponse.ok) {
          const errorData = await createSiteResponse.json().catch(() => ({ message: createSiteResponse.statusText }));
          return json({ error: 'Failed to create site on Netlify', details: errorData.message || errorData.error || errorData }, { status: createSiteResponse.status });
        }

        const newSite = (await createSiteResponse.json()) as any;
        targetSiteId = newSite.id;
        siteInfo = {
          id: newSite.id,
          name: newSite.name,
          url: newSite.url,
          chatId,
        };
      }
    }

    // Create file digests
    const fileDigests: Record<string, string> = {};

    for (const [filePath, content] of Object.entries(files)) {
      // Ensure file path starts with a forward slash
      const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      fileDigests[normalizedPath] = hash;
    }

    // Create a new deploy with digests
    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: fileDigests,
        async: true,
        skip_processing: false,
        draft: false, // Change this to false for production deployments
        function_schedules: [],
        required: Object.keys(fileDigests), // Add this line
        framework: null,
      }),
    });

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json().catch(() => ({ message: deployResponse.statusText }));
      return json({ error: 'Failed to create deployment on Netlify', details: errorData.message || errorData.error || errorData }, { status: deployResponse.status });
    }

    const deploy = (await deployResponse.json()) as any;
    let retryCount = 0;
    const maxRetries = 60;

    // Poll until deploy is ready for file uploads
    while (retryCount < maxRetries) {
      const statusResponse = await fetch(`https://api.netlify.com/api/v1/sites/${targetSiteId}/deploys/${deploy.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const status = (await statusResponse.json()) as any;

      if (status.state === 'prepared' || status.state === 'uploaded') {
        // Upload all files regardless of required array
        for (const [filePath, content] of Object.entries(files)) {
          const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;

          let uploadSuccess = false;
          let uploadRetries = 0;

          while (!uploadSuccess && uploadRetries < 3) {
            try {
              const uploadResponse = await fetch(
                `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${normalizedPath}`,
                {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/octet-stream',
                  },
                  body: content,
                },
              );

              uploadSuccess = uploadResponse.ok;

              if (!uploadSuccess) {
                const errorText = await uploadResponse.text().catch(() => uploadResponse.statusText);
                console.error('Upload failed:', errorText);
                uploadRetries++;
                await new Promise((resolve) => setTimeout(resolve, 2000));
                // No early return here, let the outer loop decide if all retries failed for this file
              }
            } catch (error) {
              console.error('Upload error:', error);
              uploadRetries++;
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }

          if (!uploadSuccess) {
            // If after all retries, a file still failed to upload
            return json({ error: `Failed to upload file ${filePath} after multiple retries.`, details: `Last attempt status: ${uploadResponse?.statusText || 'Unknown'}` }, { status: 500 });
          }
        }
      }

      if (status.state === 'ready') {
        // Only return after files are uploaded
        if (Object.keys(files).length === 0 || status.summary?.status === 'ready') {
          return json({
            success: true,
            deploy: {
              id: status.id,
              state: status.state,
              url: status.ssl_url || status.url,
            },
            site: siteInfo,
          });
        }
      }

      if (status.state === 'error') {
        return json({ error: 'Deploy preparation failed on Netlify', details: status.error_message || 'Unknown Netlify deploy error' }, { status: 500 });
      }

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (retryCount >= maxRetries) {
      return json({ error: 'Deploy preparation timed out' }, { status: 500 });
    }

    // Make sure we're returning the deploy ID and site info
    return json({
      success: true,
      deploy: {
        id: deploy.id,
        state: deploy.state,
      },
      site: siteInfo,
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return json({ error: 'Deployment failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
