// Browser-compatible path utilities
import type { ParsedPath } from 'path';
import pathLib from 'path';

/**
 * A browser-compatible path utility that mimics Node's path module
 * Using path-browserify for consistent behavior in browser environments
 */
export const path = {
  join: (...paths: string[]): string => pathLib.join(...paths),
  dirname: (path: string): string => pathLib.dirname(path),
  basename: (path: string, ext?: string): string => pathLib.basename(path, ext),
  extname: (path: string): string => pathLib.extname(path),
  relative: (from: string, to: string): string => pathLib.relative(from, to),
  isAbsolute: (path: string): boolean => pathLib.isAbsolute(path),
  normalize: (path: string): string => pathLib.normalize(path),
  parse: (path: string): ParsedPath => pathLib.parse(path),
  format: (pathObject: ParsedPath): string => pathLib.format(pathObject),
} as const;
