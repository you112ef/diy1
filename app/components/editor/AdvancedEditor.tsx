import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import { CodeMirrorEditor, type EditorDocument, type EditorSettings } from './codemirror/CodeMirrorEditor';

export interface AdvancedEditorProps {
  filePath: string;
  content: string;
  language?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onClose?: () => void;
  className?: string;
  readOnly?: boolean;
}

export interface EditorStats {
  lines: number;
  words: number;
  characters: number;
  bytes: number;
}

export interface EditorHistory {
  content: string;
  timestamp: number;
  description: string;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = memo(
  ({ filePath, content, language, onChange, onSave, onClose, className, readOnly = false }) => {
    const theme = useStore(themeStore);
    const [currentContent, setCurrentContent] = useState(content);
    const [isDirty, setIsDirty] = useState(false);
    const [stats, setStats] = useState<EditorStats>({
      lines: 0,
      words: 0,
      characters: 0,
      bytes: 0,
    });
    const [history, setHistory] = useState<EditorHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<EditorSettings>({
      fontSize: '14px',
      gutterFontSize: '12px',
      tabSize: 2,
      wordWrap: false,
      lineHighlight: true,
      bracketPairColorization: true,
      autoSave: false,
      autoSaveDelay: 5000,
    });

    const autoSaveTimerRef = useRef<NodeJS.Timeout>();

    // Calculate statistics
    const calculateStats = useCallback((text: string) => {
      const lines = text.split('\n').length;
      const words = text.split(/\s+/).filter((word) => word.length > 0).length;
      const characters = text.length;
      const bytes = new Blob([text]).size;

      return { lines, words, characters, bytes };
    }, []);

    // Update statistics when content changes
    useEffect(() => {
      const newStats = calculateStats(currentContent);
      setStats(newStats);
    }, [currentContent, calculateStats]);

    // Auto-save functionality
    useEffect(() => {
      if (settings.autoSave && isDirty && !readOnly) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          handleSave();
        }, settings.autoSaveDelay);
      }

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }, [currentContent, settings.autoSave, settings.autoSaveDelay, isDirty, readOnly]);

    // Handle content changes
    const handleContentChange = useCallback(
      (update: any) => {
        const newContent = update.content;
        setCurrentContent(newContent);
        setIsDirty(newContent !== content);
        onChange?.(newContent);

        // Add to history
        const historyEntry: EditorHistory = {
          content: newContent,
          timestamp: Date.now(),
          description: 'Content modified',
        };
        setHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      },
      [content, onChange],
    );

    // Handle save
    const handleSave = useCallback(() => {
      if (isDirty) {
        onSave?.(currentContent);
        setIsDirty(false);

        // Add save entry to history
        const historyEntry: EditorHistory = {
          content: currentContent,
          timestamp: Date.now(),
          description: 'File saved',
        };
        setHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);
      }
    }, [currentContent, isDirty, onSave]);

    // Handle undo
    const handleUndo = useCallback(() => {
      if (history.length > 0) {
        const previousContent = history[0].content;
        setCurrentContent(previousContent);
        setIsDirty(previousContent !== content);
        onChange?.(previousContent);
      }
    }, [history, content, onChange]);

    // Handle search
    const handleSearch = useCallback(() => {
      if (searchQuery) {
        // Implement search functionality
        console.log('Searching for:', searchQuery);
      }
    }, [searchQuery]);

    // Handle replace
    const handleReplace = useCallback(() => {
      if (searchQuery && replaceQuery) {
        // Implement replace functionality
        console.log('Replacing:', searchQuery, 'with:', replaceQuery);
      }
    }, [searchQuery, replaceQuery]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 's':
              event.preventDefault();
              handleSave();
              break;
            case 'z':
              event.preventDefault();
              handleUndo();
              break;
            case 'f':
              event.preventDefault();
              setShowSearch(true);
              break;
            case 'h':
              event.preventDefault();
              setShowSearch(true);
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleUndo]);

    // Create editor document
    const editorDocument: EditorDocument = {
      value: currentContent,
      isBinary: false,
      filePath,
    };

    return (
      <div className={classNames('h-full flex flex-col bg-bolt-elements-background', className)}>
        {/* Enhanced Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
          <div className="flex items-center gap-4">
            {/* File Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-bolt-elements-textPrimary">📄 {filePath.split('/').pop()}</span>
              {isDirty && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-600 rounded-full">● Modified</span>
              )}
            </div>

            {/* Language Badge */}
            {language && (
              <span className="text-xs px-2 py-1 bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded">
                {language.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Statistics */}
            <div className="flex items-center gap-3 text-xs text-bolt-elements-textSecondary">
              <span>Ln {stats.lines}</span>
              <span>W {stats.words}</span>
              <span>C {stats.characters}</span>
              <span>{Math.round((stats.bytes / 1024) * 100) / 100} KB</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
                title="Search (Ctrl+F)"
              >
                🔍
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
                title="History (Ctrl+H)"
              >
                📚
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
                title="Settings"
              >
                ⚙️
              </button>

              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className={classNames(
                    'px-3 py-1.5 text-xs rounded transition-colors',
                    isDirty
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary cursor-not-allowed',
                  )}
                  title="Save (Ctrl+S)"
                >
                  💾 Save
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Replace Panel */}
        {showSearch && (
          <div className="px-4 py-2 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1 text-sm bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              >
                Search
              </button>
              <button
                onClick={handleReplace}
                className="px-3 py-1 text-sm bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              >
                Replace
              </button>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 relative">
          <CodeMirrorEditor
            theme={theme}
            doc={editorDocument}
            editable={!readOnly}
            onChange={handleContentChange}
            onSave={handleSave}
            settings={settings}
            className="h-full"
          />
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">File History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {history.map((entry, index) => (
                  <div
                    key={index}
                    className="p-3 bg-bolt-elements-background-depth-2 rounded border border-bolt-elements-borderColor cursor-pointer hover:bg-bolt-elements-background-depth-3 transition-colors"
                    onClick={() => {
                      setCurrentContent(entry.content);
                      setIsDirty(entry.content !== content);
                      onChange?.(entry.content);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-bolt-elements-textPrimary">{entry.description}</span>
                      <span className="text-xs text-bolt-elements-textSecondary">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-bolt-elements-textSecondary mt-1">
                      {entry.content.length} characters
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Editor Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Font Size</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => setSettings((prev) => ({ ...prev, fontSize: e.target.value }))}
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Tab Size</label>
                  <select
                    value={settings.tabSize}
                    onChange={(e) => setSettings((prev) => ({ ...prev, tabSize: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                  >
                    <option value={2}>2 spaces</option>
                    <option value={4}>4 spaces</option>
                    <option value={8}>8 spaces</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wordWrap"
                    checked={settings.wordWrap}
                    onChange={(e) => setSettings((prev) => ({ ...prev, wordWrap: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="wordWrap" className="text-sm text-bolt-elements-textPrimary">
                    Word Wrap
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings((prev) => ({ ...prev, autoSave: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="autoSave" className="text-sm text-bolt-elements-textPrimary">
                    Auto Save
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

AdvancedEditor.displayName = 'AdvancedEditor';
