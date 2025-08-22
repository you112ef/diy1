// app/types/project-template.ts
export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tags?: string[];
  category?: string;
  framework?: string;
  language?: string;
  files: ProjectFile[];
}
