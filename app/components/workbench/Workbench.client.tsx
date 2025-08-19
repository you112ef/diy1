import { useStore } from '@nanostores/react';
import { motion, type Variants } from 'framer-motion';
import { memo, useCallback, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Popover, Transition } from '@headlessui/react';
import { ActionRunner } from '~/lib/runtime/action-runner';
import type { FileHistory } from '~/types/actions';
import { DiffView } from './DiffView';
import { IconButton } from '~/components/ui/IconButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { Preview } from './Preview';
import { AdvancedEditor } from '~/components/editor/AdvancedEditor';
import { AdvancedTerminal } from './terminal/AdvancedTerminal';
import { FileManager, type FileNode } from './FileManager';
import useViewport from '~/lib/hooks';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  actionRunner: ActionRunner;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
}

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  middle: {
    value: 'diff',
    text: 'Diff',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

const FileModifiedDropdown = memo(
  ({
    fileHistory,
    onSelectFile,
  }: {
    fileHistory: Record<string, FileHistory>;
    onSelectFile: (filePath: string) => void;
  }) => {
    const modifiedFiles = Object.entries(fileHistory);
    const hasChanges = modifiedFiles.length > 0;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFiles = useMemo(() => {
      return modifiedFiles.filter(([filePath]) => filePath.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [modifiedFiles, searchQuery]);

    return (
      <div className="flex items-center gap-2">
        <Popover className="relative">
          {({ open: _open }: { open: boolean }) => (
            <>
              <Popover.Button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textPrimary border border-bolt-elements-borderColor">
                <span className="font-medium">File Changes</span>
                {hasChanges && (
                  <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-500 text-xs flex items-center justify-center border border-accent-500/30">
                    {modifiedFiles.length}
                  </span>
                )}
              </Popover.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-150 ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute z-50 mt-2 w-80 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg shadow-lg">
                  <div className="p-3 border-b border-bolt-elements-borderColor">
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredFiles.length === 0 ? (
                      <div className="p-3 text-center text-bolt-elements-textSecondary text-sm">
                        {searchQuery ? 'No files match your search' : 'No modified files'}
                      </div>
                    ) : (
                      filteredFiles.map(([filePath, history]) => (
                        <button
                          key={filePath}
                          onClick={() => onSelectFile(filePath)}
                          className="w-full p-3 text-left hover:bg-bolt-elements-background-depth-2 transition-colors border-b border-bolt-elements-borderColor last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-bolt-elements-textPrimary truncate">
                              {filePath.split('/').pop()}
                            </span>
                            <span className="text-xs text-bolt-elements-textSecondary">
                              {typeof history.changes === 'number' ? history.changes : 0} changes
                            </span>
                          </div>
                          <div className="text-xs text-bolt-elements-textSecondary truncate mt-1">{filePath}</div>
                        </button>
                      ))
                    )}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  },
);

const Workbench = memo(
  ({
    /*
     * chatStarted,
     * isStreaming,
     */
    actionRunner,

    /*
     * metadata,
     * updateChatMestaData,
     */
  }: WorkspaceProps) => {
    const isMobile = useViewport();
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [showFileManager, setShowFileManager] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [activeView, setActiveView] = useState<'editor' | 'fileManager' | 'terminal'>('editor');

    const isOpen = useStore(workbenchStore.showWorkbench);
    const viewType = useStore(workbenchStore.currentView);

    const handleFileSelect = useCallback((file: FileNode) => {
      setSelectedFile(file);

      // Here you would load the actual file content
      setFileContent(
        `// Content of ${file.name}\n// This is a sample file content\n\nfunction example() {\n  console.log("Hello from ${file.name}");\n}`,
      );
      setActiveView('editor');
    }, []);

    const handleFileOpen = useCallback(
      (file: FileNode) => {
        handleFileSelect(file);
      },
      [handleFileSelect],
    );

    const handleFileSave = useCallback(
      (content: string) => {
        if (selectedFile) {
          // Here you would save the file content
          console.log(`Saving ${selectedFile.path}:`, content);
          toast.success(`File ${selectedFile.name} saved successfully!`);
        }
      },
      [selectedFile],
    );

    const handleFileChange = useCallback((content: string) => {
      setFileContent(content);
    }, []);

    const toggleFileManager = useCallback(() => {
      setShowFileManager(!showFileManager);

      if (!showFileManager) {
        setActiveView('fileManager');
      }
    }, [showFileManager]);

    const toggleTerminal = useCallback(() => {
      setShowTerminal(!showTerminal);

      if (!showTerminal) {
        setActiveView('terminal');
      }
    }, [showTerminal]);

    const closeWorkbench = useCallback(() => {
      workbenchStore.showWorkbench.set(false);
    }, []);

    const setViewType = useCallback((viewType: WorkbenchViewType) => {
      workbenchStore.currentView.set(viewType);
    }, []);

    /*
     * const toggleWorkbench = useCallback(() => {
     *   workbenchStore.showWorkbench.set(!isOpen);
     * }, [isOpen]);
     *
     * const handleGitHubPush = useCallback(() => {
     *   // Handle GitHub push
     *   console.log('Pushing to GitHub...');
     * }, []);
     */

    if (isMobile) {
      return null;
    }

    return (
      <motion.div
        className="fixed right-0 top-0 h-full bg-bolt-elements-background border-l border-bolt-elements-borderColor z-40"
        variants={workbenchVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        style={
          {
            '--workbench-width': '50vw',
          } as any
        }
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">🚀 Advanced Workbench</h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFileManager}
                  className={classNames(
                    'px-3 py-1.5 text-sm rounded transition-colors',
                    showFileManager
                      ? 'bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary'
                      : 'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textSecondary',
                  )}
                  title="File Manager"
                >
                  📁 Files
                </button>

                <button
                  onClick={toggleTerminal}
                  className={classNames(
                    'px-3 py-1.5 text-sm rounded transition-colors',
                    showTerminal
                      ? 'bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary'
                      : 'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textSecondary',
                  )}
                  title="Terminal"
                >
                  🖥️ Terminal
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileModifiedDropdown
                fileHistory={{}}
                onSelectFile={(filePath) => {
                  // Handle file selection from history
                  console.log('Selected file from history:', filePath);
                }}
              />

              <IconButton
                onClick={closeWorkbench}
                className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                title="Close Workbench"
              >
                ✕
              </IconButton>
            </div>
          </div>

          {/* View Selector */}
          <div className="px-4 py-2 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor">
            <Slider options={sliderOptions} selected={viewType} setSelected={setViewType} />
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {/* File Manager */}
            {showFileManager && (
              <div
                className={classNames(
                  'absolute inset-0 transition-all duration-300',
                  activeView === 'fileManager' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
                )}
              >
                <FileManager
                  onFileSelect={handleFileSelect}
                  onFileOpen={handleFileOpen}
                  onFileCreate={(path, type) => {
                    console.log('Creating:', type, 'at', path);
                  }}
                  onFileDelete={(path) => {
                    console.log('Deleting:', path);
                  }}
                  onFileRename={(oldPath, newPath) => {
                    console.log('Renaming:', oldPath, 'to', newPath);
                  }}
                />
              </div>
            )}

            {/* Terminal */}
            {showTerminal && (
              <div
                className={classNames(
                  'absolute inset-0 transition-all duration-300',
                  activeView === 'terminal' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
                )}
              >
                <AdvancedTerminal />
              </div>
            )}

            {/* Editor Views */}
            {!showFileManager && !showTerminal && (
              <div className="h-full">
                {viewType === 'code' && (
                  <div className="h-full">
                    {selectedFile ? (
                      <AdvancedEditor
                        filePath={selectedFile.path}
                        content={fileContent}
                        language={selectedFile.extension}
                        onChange={handleFileChange}
                        onSave={handleFileSave}
                        onClose={() => setSelectedFile(null)}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-bolt-elements-textSecondary">
                        <div className="text-center">
                          <div className="text-4xl mb-4">📝</div>
                          <div className="text-lg mb-2">No file selected</div>
                          <div className="text-sm">Open a file from the file manager to start editing</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {viewType === 'diff' && (
                  <div className="h-full">
                    <DiffView
                      fileHistory={{}}
                      setFileHistory={() => {
                        // Handle file history updates
                      }}
                      actionRunner={actionRunner}
                    />
                  </div>
                )}

                {viewType === 'preview' && (
                  <div className="h-full">
                    <Preview />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor">
            <div className="flex items-center justify-between text-xs text-bolt-elements-textSecondary">
              <div className="flex items-center gap-4">
                {selectedFile && (
                  <>
                    <span>📄 {selectedFile.name}</span>
                    <span>📁 {selectedFile.path}</span>
                    {selectedFile.size && <span>💾 {Math.round((selectedFile.size / 1024) * 100) / 100} KB</span>}
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span>🚀 Advanced Workbench v2.0</span>
                <span>⚡ Enhanced Performance</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

Workbench.displayName = 'Workbench';

export default Workbench;
