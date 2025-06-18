import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
// Attempt to import the JSON data directly.
// The path assumes '~/lib/' is aliased to 'app/lib/' in tsconfig.json or vite.config.ts
// If this direct import doesn't work in the Cloudflare Pages environment,
// it would need to be read as a text asset and then parsed.
import allTemplates from '~/lib/templates/project-templates.json';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tags?: string[];
  category?: string;
  framework?: string;
  language?: string;
  files: Array<{ path: string; content: string }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('id');

  const headers = {
    'Access-Control-Allow-Origin': '*', // Adjust for specific origins in production
    'Content-Type': 'application/json',
  };

  // Type assertion for the imported JSON
  const templates = allTemplates as ProjectTemplate[];

  if (templateId) {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      return json(template, { headers });
    } else {
      return json({ error: 'Template not found' }, { status: 404, headers });
    }
  }

  return json(templates, { headers });
}
