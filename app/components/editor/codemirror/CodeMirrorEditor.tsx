import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, indentUnit } from '@codemirror/language';
import { searchKeymap, search } from '@codemirror/search';
import { EditorSelection, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  showTooltip,
  type Tooltip,
  rectangularSelection,
  highlightSpecialChars,
  crosshairCursor,
} from '@codemirror/view';
import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { Theme } from '~/types/theme';
import { classNames } from '~/utils/classNames';
import { debounce } from '~/utils/debounce';
import { createScopedLogger } from '~/utils/logger';
import { BinaryContent } from './BinaryContent';
import { getTheme, reconfigureTheme } from './cm-theme';
import { createEnvMaskingExtension } from './EnvMasking';

const logger = createScopedLogger('CodeMirrorEditor');

export interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: string;
  scroll?: ScrollPosition;
}

export interface EditorSettings {
  fontSize?: string;
  gutterFontSize?: string;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  lineHighlight?: boolean;
  bracketPairColorization?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

type TextEditorDocument = EditorDocument & {
  value: string;
};

export interface ScrollPosition {
  top: number;
  left: number;
}

export interface EditorUpdate {
  selection: EditorSelection;
  content: string;
  changes?: any[];
}

export type OnChangeCallback = (update: EditorUpdate) => void;
export type OnScrollCallback = (position: ScrollPosition) => void;
export type OnSaveCallback = () => void;
export type OnCursorMoveCallback = (line: number, column: number) => void;
export type OnSelectionChangeCallback = (selection: EditorSelection) => void;

interface Props {
  theme: Theme;
  id?: unknown;
  doc?: EditorDocument;
  editable?: boolean;
  debounceChange?: number;
  debounceScroll?: number;
  autoFocusOnDocumentChange?: boolean;
  onChange?: OnChangeCallback;
  onScroll?: OnScrollCallback;
  onSave?: OnSaveCallback;
  onCursorMove?: OnCursorMoveCallback;
  onSelectionChange?: OnSelectionChangeCallback;
  className?: string;
  settings?: EditorSettings;
}

type EditorStates = Map<string, EditorState>;

const readOnlyTooltipStateEffect = StateEffect.define<boolean>();

const editableTooltipField = StateField.define<readonly Tooltip[]>({
  create: () => [],
  update(_tooltips, transaction) {
    if (!transaction.state.readOnly) {
      return [];
    }

    for (const effect of transaction.effects) {
      if (effect.is(readOnlyTooltipStateEffect) && effect.value) {
        return getReadOnlyTooltip(transaction.state);
      }
    }

    return [];
  },
  provide: (field) => {
    return showTooltip.computeN([field], (state) => state.field(field));
  },
});

const getReadOnlyTooltip = (_state: EditorState): readonly Tooltip[] => {
  return [
    {
      pos: 0,
      above: false,
      create: () => {
        const dom = document.createElement('div');
        dom.className = 'cm-tooltip cm-readonly-tooltip';
        dom.textContent = 'Read Only';
        dom.style.cssText = `
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          color: #666;
        `;

        return { dom };
      },
    },
  ];
};

// Enhanced editor state management
const createEditorState = (
  doc: TextEditorDocument,
  theme: Theme,
  settings: EditorSettings = {},
  editable: boolean = true,
): EditorState => {
  const { fontSize = '14px', gutterFontSize = '12px', tabSize = 2, lineHighlight = true } = settings;

  const extensions: Extension[] = [
    // Basic editor features
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),

    /*
     * Language support
     * language,
     */
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    indentUnit.of(' '.repeat(tabSize)),

    // Folding
    foldGutter(),

    // Search and replace
    search(),

    // Autocompletion
    autocompletion({
      activateOnTyping: true,
      maxRenderedOptions: 20,
      defaultKeymap: true,
    }),

    // Keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
      { key: 'Ctrl-S', run: () => true, preventDefault: true },
      { key: 'Cmd-S', run: () => true, preventDefault: true },
    ]),

    // Theme
    getTheme(theme),

    // Environment masking
    createEnvMaskingExtension(() => doc.filePath),

    /*
     * Custom extensions
     * EditorView.lineWrapping.of(wordWrap),
     */
    EditorView.theme({
      '&': {
        fontSize,
        fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
      },
      '.cm-gutters': {
        fontSize: gutterFontSize,
        fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
      },
      '.cm-line': {
        lineHeight: '1.6',
        padding: '0 8px',
      },
      '.cm-activeLine': {
        backgroundColor: lineHighlight ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
      },
      '.cm-cursor': {
        borderLeft: '2px solid #007acc',
        borderRight: 'none',
      },
      '.cm-tooltip': {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
      '.cm-tooltip.cm-readonly-tooltip': {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeaa7',
        color: '#856404',
      },
    }),

    // Read-only tooltip
    editableTooltipField,

    /*
     * Scroll past end
     * scrollPastEnd.of(0.5),
     */
  ];

  if (!editable) {
    extensions.push(
      EditorState.readOnly.of(true),

      // StateEffect.appendConfig.of(readOnlyTooltipStateEffect.of(true)),
    );
  }

  return EditorState.create({
    doc: doc.value,
    extensions,
  });
};

// Enhanced editor view management
const createEditorView = (
  parent: HTMLElement,
  state: EditorState,
  onUpdate: (update: EditorUpdate) => void,
  onScroll: (position: ScrollPosition) => void,
  onCursorMove: (line: number, column: number) => void,
  onSelectionChange: (selection: EditorSelection) => void,
): EditorView => {
  const view = new EditorView({
    state,
    parent,
    dispatch: (transaction) => {
      view.update([transaction]);

      // Handle content changes
      if (transaction.docChanged) {
        const update: EditorUpdate = {
          selection: transaction.state.selection,
          content: transaction.state.doc.toString(),
          changes: transaction.changes.toJSON(),
        };
        onUpdate(update);
      }

      // Handle selection changes
      if (transaction.selection) {
        const { selection } = transaction.state;
        const line = transaction.state.doc.lineAt(selection.main.head).number;
        const column = selection.main.head - transaction.state.doc.lineAt(selection.main.head).from;

        onCursorMove(line, column);
        onSelectionChange(selection);
      }

      /*
       * Handle scroll changes
       * if (transaction.scrollTop !== undefined || transaction.scrollLeft !== undefined) {
       *   onScroll({
       *     top: 0,
       *     left: 0,
       *   });
       * }
       */
    },
  });

  return view;
};

export const CodeMirrorEditor = memo(
  ({
    theme,

    // id,
    doc,
    editable = true,
    debounceChange = 300,
    debounceScroll = 100,
    autoFocusOnDocumentChange = true,
    onChange,
    onScroll,
    onSave,
    onCursorMove,
    onSelectionChange,
    className,
    settings = {},
  }: Props) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView>();
    const editorStatesRef = useRef<EditorStates>(new Map());
    const currentDocRef = useRef<EditorDocument>();

    // Enhanced state management
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState(1);
    const [currentColumn, setCurrentColumn] = useState(1);
    const [totalLines, setTotalLines] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    // Debounced callbacks
    const debouncedOnChange = useRef(
      debounce((update: EditorUpdate) => {
        onChange?.(update);

        // Update statistics
        const lines = update.content.split('\n');
        setTotalLines(lines.length);
        setWordCount(update.content.split(/\s+/).filter((word) => word.length > 0).length);
        setCharCount(update.content.length);
      }, debounceChange),
    ).current;

    const debouncedOnScroll = useRef(
      debounce((position: ScrollPosition) => {
        onScroll?.(position);
      }, debounceScroll),
    ).current;

    // Enhanced cursor move handler
    const handleCursorMove = useCallback(
      (line: number, column: number) => {
        setCurrentLine(line);
        setCurrentColumn(column);
        onCursorMove?.(line, column);
      },
      [onCursorMove],
    );

    // Enhanced selection change handler
    const handleSelectionChange = useCallback(
      (selection: EditorSelection) => {
        onSelectionChange?.(selection);
      },
      [onSelectionChange],
    );

    // Initialize editor
    useEffect(() => {
      if (!editorRef.current || !doc) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const element = editorRef.current;
        let state = editorStatesRef.current.get(doc.filePath);

        if (!state || currentDocRef.current?.value !== doc.value) {
          state = createEditorState(doc, theme, settings, editable);
          editorStatesRef.current.set(doc.filePath, state);
          currentDocRef.current = doc;
        }

        if (viewRef.current) {
          viewRef.current.destroy();
        }

        const view = createEditorView(
          element,
          state,
          debouncedOnChange,
          debouncedOnScroll,
          handleCursorMove,
          handleSelectionChange,
        );

        viewRef.current = view;

        // Auto-focus if enabled
        if (autoFocusOnDocumentChange && editable) {
          view.focus();
        }

        // Update statistics
        const content = doc.value;
        const lines = content.split('\n');
        setTotalLines(lines.length);
        setWordCount(content.split(/\s+/).filter((word) => word.length > 0).length);
        setCharCount(content.length);

        logger.debug(`Editor initialized for ${doc.filePath}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize editor';
        setError(errorMessage);
        logger.error(`Editor initialization failed: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }, [
      doc?.filePath,
      doc?.value,
      theme,
      editable,
      autoFocusOnDocumentChange,
      settings,
      debouncedOnChange,
      debouncedOnScroll,
      handleCursorMove,
      handleSelectionChange,
    ]);

    // Theme update
    useEffect(() => {
      if (viewRef.current) {
        reconfigureTheme(theme);
      }
    }, [theme]);

    // Settings update
    useEffect(() => {
      if (viewRef.current && doc) {
        const newState = createEditorState(doc, theme, settings, editable);
        viewRef.current.setState(newState);
        editorStatesRef.current.set(doc.filePath, newState);
      }
    }, [settings, doc, theme, editable]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
        }
      };
    }, []);

    // Save handler
    const handleSave = useCallback(() => {
      onSave?.();
    }, [onSave]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          handleSave();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    if (doc?.isBinary) {
      return <BinaryContent />;
    }

    return (
      <div className={classNames('relative h-full flex flex-col', className)}>
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
          <div className="flex items-center gap-4 text-sm text-bolt-elements-textSecondary">
            <span>
              Ln {currentLine}, Col {currentColumn}
            </span>
            <span>{totalLines} lines</span>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              title="Save (Ctrl+S)"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-bolt-elements-background-depth-1 z-10">
              <div className="i-svg-spinners:90-ring-with-bg text-2xl text-bolt-elements-textSecondary"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 z-10">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️ Editor Error</div>
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            </div>
          )}

          <div ref={editorRef} className="h-full" />
        </div>
      </div>
    );
  },
);
