// app/components/templates/ProjectTemplateList.tsx
import React, { useState, useEffect } from 'react';
import { getTemplates } from '~/lib/services/projectTemplateService';
import type { ProjectTemplate } from '~/types/project-template';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/Card';
import { classNames } from '~/utils/classNames';
import { ProjectTemplateDetail } from './ProjectTemplateDetail'; // Added import

export function ProjectTemplateList() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null); // New state

  useEffect(() => {
    async function fetchTemplates() {
      /*
       * Ensure selectedTemplate is cleared if the list is re-fetched or component re-mounts
       * This might be too aggressive depending on desired UX, but good for now.
       */
      setSelectedTemplate(null);
      setIsLoading(true);
      setError(null);

      try {
        const fetchedTemplates = await getTemplates();
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error('Error in ProjectTemplateList:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleTemplateClick = (template: ProjectTemplate) => {
    console.log('Selected template:', template.id, template.name);
    setSelectedTemplate(template); // Update state instead of alert
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="i-ph:spinner-gap w-8 h-8 animate-spin text-bolt-elements-textSecondary" />
        <span className="ml-2 text-bolt-elements-textSecondary">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 border border-red-600 rounded-md">
        Error loading templates: {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return <div className="p-4 text-bolt-elements-textSecondary">No project templates available at the moment.</div>;
  }

  // New conditional rendering logic
  if (selectedTemplate) {
    return <ProjectTemplateDetail template={selectedTemplate} onClose={() => setSelectedTemplate(null)} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {templates.map((template) => (
        <div
          key={template.id}
          onClick={() => handleTemplateClick(template)} // Updated handler
          className="cursor-pointer h-full"
        >
          <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:border-bolt-elements-borderColorActive">
            <CardHeader>
              <div className="flex items-center gap-3">
                {template.icon && (
                  <div
                    className={classNames(template.icon, 'w-6 h-6 text-bolt-elements-item-contentAccent flex-shrink-0')}
                  />
                )}
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {' '}
              {/* Use flex-grow to push footer down if card height is fixed/aligned */}
              <CardDescription className="text-sm">{template.description}</CardDescription>
              {template.tags && template.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
            {/* Optional: Add CardFooter if there are actions like 'Use Template' later */}
          </Card>
        </div>
      ))}
    </div>
  );
}
