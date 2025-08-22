// see https://docs.anthropic.com/en/docs/about-claude/models
export const MAX_TOKENS = 8000;

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

// Enhanced constants for reality transformation
export const REALITY_TRANSFORMATION_MODES = {
  VIRTUAL_TO_REAL: 'virtual_to_real',
  SIMULATION_TO_ACTUAL: 'simulation_to_actual',
  CONCEPT_TO_IMPLEMENTATION: 'concept_to_implementation',
  IDEA_TO_CODE: 'idea_to_code',
  DREAM_TO_APPLICATION: 'dream_to_application'
} as const;

export const TRANSFORMATION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export const REALITY_LEVELS = {
  CONCEPTUAL: 'conceptual',
  PROTOTYPE: 'prototype',
  FUNCTIONAL: 'functional',
  PRODUCTION: 'production',
  REAL_WORLD: 'real_world'
} as const;

export interface File {
  type: 'file';
  content: string;
  isBinary: boolean;
}

export interface Folder {
  type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yml',
];
