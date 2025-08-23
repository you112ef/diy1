import type { Change } from 'diff';

export type ActionType =
  | 'file'
  | 'shell'
  | 'supabase'
  | 'start' // Added for consistency with BoltAction
  | 'build' // Added for consistency with BoltAction
  | 'openFile'; // Added

export interface BaseAction {
  content: string;
  lang?: string; // Added
  requiresConfirmation?: boolean; // Added
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
  capturedOutput?: string;
  exitCode?: number;
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface BuildAction extends BaseAction {
  type: 'build';
}

export interface SupabaseAction extends BaseAction {
  type: 'supabase';
  operation: 'migration' | 'query';
  filePath?: string;
  projectId?: string;
}

export interface OpenFileAction extends BaseAction {
  type: 'openFile';
  filePath: string;
}

export type BoltAction = FileAction | ShellAction | StartAction | BuildAction | SupabaseAction | OpenFileAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview'; // Add source to differentiate between terminal and preview errors
}

export interface SupabaseAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'supabase';
}

export interface DeployAlert {
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
  content?: string;
  url?: string;
  stage?: 'building' | 'deploying' | 'complete';
  buildStatus?: 'pending' | 'running' | 'complete' | 'failed';
  deployStatus?: 'pending' | 'running' | 'complete' | 'failed';
  source?: 'vercel' | 'netlify' | 'github';
}

export interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  versions: {
    timestamp: number;
    content: string;
  }[];

  // Novo campo para rastrear a origem das mudanças
  changeSource?: 'user' | 'auto-save' | 'external';
}
