// app/components/templates/ProjectTemplateDetail.tsx
import React from 'react';
import type { ProjectTemplate } from '~/types/project-template';
import { Button } from '~/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/Card';
import { classNames } from '~/utils/classNames';

interface ProjectTemplateDetailProps {
  template: ProjectTemplate;
  onClose: () => void;
}

export function ProjectTemplateDetail({ template, onClose }: ProjectTemplateDetailProps) {
  return (
    <div className="p-4 md:p-6">
      <Button onClick={onClose} variant="outline" size="sm" className="mb-4">
        <div className="i-ph:arrow-left mr-2" />
        Back to Templates
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            {template.icon && (
              <div className={classNames(template.icon, 'w-8 h-8 text-bolt-elements-item-contentAccent flex-shrink-0')} />
            )}
            <CardTitle className="text-2xl">{template.name}</CardTitle>
          </div>
          <CardDescription className="text-base">{template.description}</CardDescription>
          {template.tags && template.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <h4 className="text-md font-semibold mb-2 text-bolt-elements-textPrimary">Files in this template:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-bolt-elements-textSecondary max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
            {template.files.map(file => (
              <li key={file.path} className="font-mono text-xs">
                {file.path}
                {/* Optionally display very short content:
                {file.content.length < 50 && file.content.length > 0 && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500 italic">
                    (Content: {file.content.replace(/\n/g, ' ')})
                  </span>
                )}
                */}
              </li>
            ))}
          </ul>
          {(template.category || template.framework || template.language) && (
            <div className="mt-4 pt-4 border-t border-bolt-elements-borderColor">
              {template.category && <p className="text-xs text-bolt-elements-textTertiary"><strong>Category:</strong> {template.category}</p>}
              {template.framework && <p className="text-xs text-bolt-elements-textTertiary"><strong>Framework:</strong> {template.framework}</p>}
              {template.language && <p className="text-xs text-bolt-elements-textTertiary"><strong>Language:</strong> {template.language}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full md:w-auto" onClick={() => alert(`Placeholder: Using template '${template.name}'`)}>
             <div className="i-ph:sparkle mr-2" />
            Use This Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
