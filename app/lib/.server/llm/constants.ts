// see https://docs.anthropic.com/en/docs/about-claude/models
export const MAX_TOKENS = 8000;

// limits the number of model responses that can be returned in a single request
export const MAX_RESPONSE_SEGMENTS = 2;

// Enhanced constants for reality transformation
export const REALITY_TRANSFORMATION_MODES = {
  VIRTUAL_TO_REAL: 'VIRTUAL_TO_REAL',
  SIMULATION_TO_ACTUAL: 'SIMULATION_TO_ACTUAL',
  CONCEPT_TO_IMPLEMENTATION: 'CONCEPT_TO_IMPLEMENTATION',
  IDEA_TO_CODE: 'IDEA_TO_CODE',
  DREAM_TO_APPLICATION: 'DREAM_TO_APPLICATION'
} as const;

export const TRANSFORMATION_PRIORITIES = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
} as const;

export const REALITY_LEVELS = {
  CONCEPTUAL: 'CONCEPTUAL',
  PROTOTYPE: 'PROTOTYPE',
  FUNCTIONAL: 'FUNCTIONAL',
  PRODUCTION: 'PRODUCTION',
  REAL_WORLD: 'REAL_WORLD'
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
