// app/lib/services/projectTemplateService.ts
import type { ProjectTemplate } from '~/types/project-template'; // Assuming path alias

const API_BASE_URL = '/api/project-templates';

/**
 * Fetches all available project templates.
 */
export async function getTemplates(): Promise<ProjectTemplate[]> {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      console.error('Failed to fetch templates:', response.status, response.statusText);
      return [];
    }
    const templates: ProjectTemplate[] = await response.json();
    return templates;
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return [];
  }
}

/**
 * Fetches a single project template by its ID.
 * @param id The ID of the template to fetch.
 * @returns The project template if found, otherwise null.
 */
export async function getTemplateById(id: string): Promise<ProjectTemplate | null> {
  if (!id) {
    console.error('Template ID is required.');
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`);
    if (response.status === 404) {
      console.warn(`Template with id "${id}" not found.`);
      return null;
    }
    if (!response.ok) {
      console.error(`Failed to fetch template "${id}":`, response.status, response.statusText);
      return null;
    }
    const template: ProjectTemplate = await response.json();
    return template;
  } catch (error) {
    console.error(`Error fetching template "${id}":`, error);
    return null;
  }
}
