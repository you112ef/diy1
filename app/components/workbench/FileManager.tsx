import React, { useState, useEffect, useCallback, memo } from 'react';
import { classNames } from '~/utils/classNames';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  isOpen?: boolean;
  children?: FileNode[];
  extension?: string;
  isHidden?: boolean;
  permissions?: string;
}

export interface FileOperation {
  type: 'create' | 'delete' | 'rename' | 'move' | 'copy';
  source: string;
  destination?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface FileManagerProps {
  className?: string;
  onFileSelect?: (file: FileNode) => void;
  onFileOpen?: (file: FileNode) => void;
  onFileCreate?: (path: string, type: 'file' | 'directory') => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  onFileMove?: (source: string, destination: string) => void;
  onFileCopy?: (source: string, destination: string) => void;
}

export const FileManager: React.FC<FileManagerProps> = memo(
  ({
    className,
    onFileSelect,
    onFileOpen,

    /*
     * onFileCreate,
     * onFileDelete,
     * onFileRename,
     * onFileMove,
     * onFileCopy,
     */
  }) => {
    const [files, setFiles] = useState<FileNode[]>([]); // Sample data
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'tree' | 'list' | 'grid'>('tree');

    /*
     * const [sortBy, setSortBy] = useState<'name' | 'type' | 'size' | 'modified'>('name');
     * const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
     */
    const [showHidden, setShowHidden] = useState(false);
    const [currentPath] = useState('/workspace');

    // const [operations] = useState<FileOperation[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', type: 'file' as 'file' | 'directory' });
    const [renameForm, setRenameForm] = useState({ oldName: '', newName: '' });

    // Initialize file system
    useEffect(() => {
      initializeFileSystem();
    }, []);

    // Initialize file system with sample data
    const initializeFileSystem = useCallback(() => {
      const sampleFiles: FileNode[] = [
        {
          id: '1',
          name: 'src',
          path: '/workspace/src',
          type: 'directory',
          isOpen: true,
          children: [
            {
              id: '2',
              name: 'components',
              path: '/workspace/src/components',
              type: 'directory',
              isOpen: false,
              children: [
                {
                  id: '3',
                  name: 'App.tsx',
                  path: '/workspace/src/components/App.tsx',
                  type: 'file',
                  size: 2048,
                  modified: new Date(),
                  extension: 'tsx',
                },
                {
                  id: '4',
                  name: 'Header.tsx',
                  path: '/workspace/src/components/Header.tsx',
                  type: 'file',
                  size: 1536,
                  modified: new Date(),
                  extension: 'tsx',
                },
              ],
            },
            {
              id: '5',
              name: 'utils',
              path: '/workspace/src/utils',
              type: 'directory',
              isOpen: false,
              children: [
                {
                  id: '6',
                  name: 'helpers.ts',
                  path: '/workspace/src/utils/helpers.ts',
                  type: 'file',
                  size: 1024,
                  modified: new Date(),
                  extension: 'ts',
                },
              ],
            },
          ],
        },
        {
          id: '7',
          name: 'public',
          path: '/workspace/public',
          type: 'directory',
          isOpen: false,
          children: [
            {
              id: '8',
              name: 'index.html',
              path: '/workspace/public/index.html',
              type: 'file',
              size: 512,
              modified: new Date(),
              extension: 'html',
            },
          ],
        },
        {
          id: '9',
          name: 'package.json',
          path: '/workspace/package.json',
          type: 'file',
          size: 3072,
          modified: new Date(),
          extension: 'json',
        },
        {
          id: '10',
          name: 'README.md',
          path: '/workspace/README.md',
          type: 'file',
          size: 4096,
          modified: new Date(),
          extension: 'md',
        },
        {
          id: '11',
          name: '.gitignore',
          path: '/workspace/.gitignore',
          type: 'file',
          size: 256,
          modified: new Date(),
          extension: 'gitignore',
          isHidden: true,
        },
      ];

      setFiles(sampleFiles);
    }, []);

    // Get file icon based on type and extension
    const getFileIcon = useCallback((file: FileNode) => {
      if (file.type === 'directory') {
        return file.isOpen ? '📁' : '📂';
      }

      const extension = file.extension?.toLowerCase();

      switch (extension) {
        case 'tsx':
        case 'ts':
        case 'jsx':
        case 'js':
          return '📄';
        case 'css':
        case 'scss':
        case 'sass':
          return '🎨';
        case 'html':
          return '🌐';
        case 'json':
          return '📋';
        case 'md':
          return '📝';
        case 'gitignore':
          return '🚫';
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
          return '🖼️';
        default:
          return '📄';
      }
    }, []);

    // Format file size
    const formatFileSize = useCallback((bytes?: number) => {
      if (!bytes) {
        return '0 B';
      }

      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));

      return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    }, []);

    // Format date
    const formatDate = useCallback((date?: Date) => {
      if (!date) {
        return '';
      }

      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }, []);

    // Toggle directory open/close
    const toggleDirectory = useCallback((fileId: string) => {
      const updateFile = (files: FileNode[]): FileNode[] => {
        return files.map((file) => {
          if (file.id === fileId) {
            return { ...file, isOpen: !file.isOpen };
          }

          if (file.children) {
            return { ...file, children: updateFile(file.children) };
          }

          return file;
        });
      };

      setFiles(updateFile);
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(
      (file: FileNode) => {
        setSelectedFile(file);
        onFileSelect?.(file);
      },
      [onFileSelect],
    );

    // Handle file double click (open)
    const handleFileDoubleClick = useCallback(
      (file: FileNode) => {
        if (file.type === 'directory') {
          toggleDirectory(file.id);
        } else {
          onFileOpen?.(file);
        }
      },
      [toggleDirectory, onFileOpen],
    );

    // Handle file creation
    const handleCreateFile = useCallback(() => {
      if (createForm.name.trim()) {
        const newFile: FileNode = {
          id: Date.now().toString(),
          name: createForm.name,
          path: `${currentPath}/${createForm.name}`,
          type: createForm.type,
          modified: new Date(),
          extension: createForm.type === 'file' ? createForm.name.split('.').pop() || '' : undefined,
        };

        // Add to current directory
        const addToDirectory = (files: FileNode[], targetPath: string): FileNode[] => {
          return files.map((file) => {
            if (file.path === targetPath) {
              return {
                ...file,
                children: [...(file.children || []), newFile],
              };
            }

            if (file.children) {
              return { ...file, children: addToDirectory(file.children, targetPath) };
            }

            return file;
          });
        };

        setFiles(addToDirectory(files, currentPath));
        setCreateForm({ name: '', type: 'file' });
        setShowCreateDialog(false);

        /*
         * Add operation
         * const operation: FileOperation = {
         *   type: 'create',
         *   source: `${currentPath}/${createForm.name}`,
         *   timestamp: Date.now(),
         *   status: 'completed',
         * };
         * setOperations((prev) => [operation, ...prev.slice(0, 9)]); // This line was removed
         */
      }
    }, [createForm, currentPath, files]);

    // Handle file rename
    const handleRenameFile = useCallback(() => {
      if (selectedFile && renameForm.newName.trim()) {
        const newPath = selectedFile.path.replace(selectedFile.name, renameForm.newName);

        // Update file in tree
        const updateFile = (files: FileNode[]): FileNode[] => {
          return files.map((file) => {
            if (file.id === selectedFile.id) {
              return { ...file, name: renameForm.newName, path: newPath };
            }

            if (file.children) {
              return { ...file, children: updateFile(file.children) };
            }

            return file;
          });
        };

        setFiles(updateFile);
        setRenameForm({ oldName: '', newName: '' });
        setShowRenameDialog(false);

        /*
         * Add operation
         * const operation: FileOperation = {
         *   type: 'rename',
         *   source: selectedFile.path,
         *   destination: newPath,
         *   timestamp: Date.now(),
         *   status: 'completed',
         * };
         * setOperations((prev) => [operation, ...prev.slice(0, 9)]); // This line was removed
         */
      }
    }, [selectedFile, renameForm]);

    // Handle file deletion
    const handleDeleteFile = useCallback(() => {
      if (selectedFile) {
        // Remove file from tree
        const removeFile = (files: FileNode[]): FileNode[] => {
          return files.filter((file) => {
            if (file.id === selectedFile.id) {
              return false;
            }

            if (file.children) {
              file.children = removeFile(file.children);
            }

            return true;
          });
        };

        setFiles(removeFile);
        setSelectedFile(null);
        setShowDeleteDialog(false);

        /*
         * Add operation
         * const operation: FileOperation = {
         *   type: 'delete',
         *   source: selectedFile.path,
         *   timestamp: Date.now(),
         *   status: 'completed',
         * };
         * setOperations((prev) => [operation, ...prev.slice(0, 9)]); // This line was removed
         */
      }
    }, [selectedFile]);

    // Render file tree
    const renderFileTree = useCallback(
      (fileList: FileNode[], level = 0) => {
        return fileList
          .filter((file) => showHidden || !file.isHidden)
          .sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }

            return a.name.localeCompare(b.name);
          })
          .map((file) => (
            <div key={file.id} style={{ paddingLeft: `${level * 20}px` }}>
              <div
                className={classNames(
                  'flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-bolt-elements-background-depth-2 transition-colors',
                  selectedFile?.id === file.id ? 'bg-bolt-elements-background-depth-3' : '',
                )}
                onClick={() => handleFileSelect(file)}
                onDoubleClick={() => handleFileDoubleClick(file)}
              >
                <span className="text-lg">{getFileIcon(file)}</span>
                <span className="text-sm text-bolt-elements-textPrimary">{file.name}</span>
                {file.type === 'directory' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDirectory(file.id);
                    }}
                    className="ml-auto text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                  >
                    {file.isOpen ? '▼' : '▶'}
                  </button>
                )}
              </div>
              {file.type === 'directory' && file.isOpen && file.children && (
                <div>{renderFileTree(file.children, level + 1)}</div>
              )}
            </div>
          ));
      },
      [selectedFile, showHidden, getFileIcon, handleFileSelect, handleFileDoubleClick, toggleDirectory],
    );

    // Render file list
    const renderFileList = useCallback(() => {
      const flattenFiles = (fileList: FileNode[]): FileNode[] => {
        let result: FileNode[] = [];
        fileList.forEach((file) => {
          result.push(file);

          if (file.children && file.isOpen) {
            result = result.concat(flattenFiles(file.children));
          }
        });

        return result;
      };

      const flatFiles = flattenFiles(files)
        .filter((file) => showHidden || !file.isHidden)
        .filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return (
        <div className="space-y-1">
          {flatFiles.map((file) => (
            <div
              key={file.id}
              className={classNames(
                'flex items-center gap-3 px-3 py-2 rounded cursor-pointer hover:bg-bolt-elements-background-depth-2 transition-colors',
                selectedFile?.id === file.id ? 'bg-bolt-elements-background-depth-3' : '',
              )}
              onClick={() => handleFileSelect(file)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <span className="text-lg">{getFileIcon(file)}</span>
              <span className="flex-1 text-sm text-bolt-elements-textPrimary">{file.name}</span>
              <span className="text-xs text-bolt-elements-textSecondary">{formatFileSize(file.size)}</span>
              <span className="text-xs text-bolt-elements-textSecondary">{formatDate(file.modified)}</span>
            </div>
          ))}
        </div>
      );
    }, [
      files,
      showHidden,
      searchQuery,
      selectedFile,
      getFileIcon,
      formatFileSize,
      formatDate,
      handleFileSelect,
      handleFileDoubleClick,
    ]);

    return (
      <div className={classNames('h-full flex flex-col bg-bolt-elements-background', className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary">📁 File Manager</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                title="Create New File/Directory"
              >
                ➕ New
              </button>

              {selectedFile && (
                <>
                  <button
                    onClick={() => setShowRenameDialog(true)}
                    className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                    title="Rename File"
                  >
                    ✏️ Rename
                  </button>

                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-600 rounded transition-colors"
                    title="Delete File"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded"
            />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('tree')}
                className={classNames(
                  'p-1 text-xs rounded transition-colors',
                  viewMode === 'tree'
                    ? 'bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary'
                    : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                )}
                title="Tree View"
              >
                🌳
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={classNames(
                  'p-1 text-xs rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary'
                    : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                )}
                title="List View"
              >
                📋
              </button>
            </div>

            <label className="flex items-center gap-1 text-xs text-bolt-elements-textSecondary">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="mr-1"
              />
              Hidden
            </label>
          </div>
        </div>

        {/* Current Path */}
        <div className="px-4 py-2 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor">
          <span className="text-xs text-bolt-elements-textSecondary">📍 {currentPath}</span>
        </div>

        {/* File Content */}
        <div className="flex-1 overflow-auto p-2">{viewMode === 'tree' ? renderFileTree(files) : renderFileList()}</div>

        {/* Create File Dialog */}
        {showCreateDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Create New</h3>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Name</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                    placeholder="Enter file or directory name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, type: e.target.value as 'file' | 'directory' }))
                    }
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                  >
                    <option value="file">File</option>
                    <option value="directory">Directory</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFile}
                    className="flex-1 px-3 py-2 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1 px-3 py-2 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rename Dialog */}
        {showRenameDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Rename File</h3>
                <button
                  onClick={() => setShowRenameDialog(false)}
                  className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">New Name</label>
                  <input
                    type="text"
                    value={renameForm.newName}
                    onChange={(e) => setRenameForm((prev) => ({ ...prev, newName: e.target.value }))}
                    className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                    placeholder="Enter new name"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRenameFile}
                    className="flex-1 px-3 py-2 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setShowRenameDialog(false)}
                    className="flex-1 px-3 py-2 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Delete File</h3>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-bolt-elements-textSecondary">
                  Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteFile}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="flex-1 px-3 py-2 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

FileManager.displayName = 'FileManager';
