import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import { Terminal } from './Terminal';

export interface TerminalSession {
  id: string;
  title: string;
  type: 'bash' | 'powershell' | 'cmd' | 'zsh' | 'fish';
  workingDirectory: string;
  isActive: boolean;
  history: string[];
  output: string[];
}

export interface TerminalCommand {
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
  duration: number;
}

export interface TerminalSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light' | 'auto';
  cursorBlink: boolean;
  cursorStyle: 'block' | 'underline' | 'bar';
  scrollback: number;
  enableBell: boolean;
}

export const AdvancedTerminal: React.FC = () => {
  const theme = useStore(themeStore);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: '1',
      title: 'Terminal 1',
      type: 'bash',
      workingDirectory: '/workspace',
      isActive: true,
      history: [],
      output: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TerminalSettings>({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
    theme: 'auto',
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 1000,
    enableBell: false,
  });

  const terminalRefs = useRef<Map<string, any>>(new Map());
  const commandHistoryRef = useRef<Map<string, TerminalCommand[]>>(new Map());

  // Create new terminal session
  const createSession = useCallback(
    (type: TerminalSession['type'] = 'bash') => {
      const newSession: TerminalSession = {
        id: Date.now().toString(),
        title: `Terminal ${sessions.length + 1}`,
        type,
        workingDirectory: '/workspace',
        isActive: false,
        history: [],
        output: [],
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(newSession.id);
      commandHistoryRef.current.set(newSession.id, []);
    },
    [sessions.length],
  );

  // Close terminal session
  const closeSession = useCallback(
    (sessionId: string) => {
      if (sessions.length > 1) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        commandHistoryRef.current.delete(sessionId);

        if (activeSessionId === sessionId) {
          const remainingSessions = sessions.filter((s) => s.id !== sessionId);
          setActiveSessionId(remainingSessions[0]?.id || '');
        }
      }
    },
    [sessions, activeSessionId],
  );

  // Rename terminal session
  /*
   * const renameSession = useCallback((sessionId: string, newTitle: string) => {
   *   setSessions(prev => prev.map(s =>
   *     s.id === sessionId ? { ...s, title: newTitle } : s
   *   ));
   * }, []);
   */

  // Change terminal type
  /*
   * const changeTerminalType = useCallback((sessionId: string, newType: TerminalSession['type']) => {
   *   setSessions(prev => prev.map(s =>
   *     s.id === sessionId ? { ...s, type: newType } : s
   *   ));
   * }, []);
   */

  // Execute command
  /*
   * const executeCommand = useCallback(
   *   async (sessionId: string, command: string) => {
   *     const session = sessions.find((s) => s.id === sessionId);
   *     if (!session) {
   *       return;
   *     }
   *
   *     const startTime = Date.now();
   *
   *     try {
   *       // Simulate command execution (replace with real implementation)
   *       let output = '';
   *       let exitCode = 0;
   *
   *       // Handle common commands
   *       switch (command.trim().toLowerCase()) {
   *         case 'ls':
   *         case 'dir':
   *           output = 'README.md\npackage.json\nsrc/\ndist/\nnode_modules/\n.gitignore';
   *           break;
   *         case 'pwd':
   *           output = session.workingDirectory;
   *           break;
   *         case 'whoami':
   *           output = 'developer';
   *           break;
   *         case 'date':
   *           output = new Date().toLocaleString();
   *           break;
   *         case 'echo':
   *           output = command.replace('echo', '').trim();
   *           break;
   *         case 'clear':
   *           // Clear terminal output
   *           setSessions((prev) =>
   *             prev.map((s) => (s.id === sessionId ? { ...s, output: [] } : s)),
   *           );
   *           return;
   *         case 'help':
   *           output = `Available commands:
   * - ls/dir: List files
   * - pwd: Show current directory
   * - whoami: Show current user
   * - date: Show current date/time
   * - echo: Print text
   * - clear: Clear terminal
   * - help: Show this help
   * - cd: Change directory
   * - mkdir: Create directory
   * - rm: Remove file/directory
   * - cat: Show file content`;
   *           break;
   *         default:
   *           if (command.trim()) {
   *             output = `Command not found: ${command.trim()}`;
   *             exitCode = 127;
   *           }
   *       }
   *
   *       const duration = Date.now() - startTime;
   *
   *       // Add command to history
   *       const commandEntry: TerminalCommand = {
   *         command,
   *         output,
   *         exitCode,
   *         timestamp: Date.now(),
   *         duration,
   *       };
   *
   *       const sessionHistory = commandHistoryRef.current.get(sessionId) || [];
   *       commandHistoryRef.current.set(sessionId, [...sessionHistory, commandEntry]);
   *
   *       // Update session output
   *       setSessions((prev) =>
   *         prev.map((s) =>
   *           s.id === sessionId
   *             ? {
   *                 ...s,
   *                 history: [...s.history, command],
   *                 output: [...s.output, `$ ${command}`, output],
   *               }
   *             : s,
   *         ),
   *       );
   *     } catch (error) {
   *       const duration = Date.now() - startTime;
   *       const commandEntry: TerminalCommand = {
   *         command,
   *         output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
   *         exitCode: 1,
   *         timestamp: Date.now(),
   *         duration,
   *       };
   *
   *       const sessionHistory = commandHistoryRef.current.get(sessionId) || [];
   *       commandHistoryRef.current.set(sessionId, [...sessionHistory, commandEntry]);
   *
   *       setSessions((prev) =>
   *         prev.map((s) =>
   *           s.id === sessionId
   *             ? {
   *                 ...s,
   *                 history: [...s.history, command],
   *                 output: [
   *                   ...s.output,
   *                   `$ ${command}`,
   *                   `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
   *                 ],
   *               }
   *             : s,
   *         ),
   *       );
   *     }
   *   },
   *   [sessions],
   * );
   */

  // Handle terminal ready
  const handleTerminalReady = useCallback(
    (sessionId: string, terminal: any) => {
      terminalRefs.current.set(sessionId, terminal);

      // Write welcome message
      const welcomeMessage = `Welcome to Advanced Terminal!
Type 'help' for available commands.
Current directory: ${sessions.find((s) => s.id === sessionId)?.workingDirectory}

$ `;

      terminal.write(welcomeMessage);
    },
    [sessions],
  );

  // Handle terminal input
  /*
   * const handleTerminalInput = useCallback((sessionId: string, input: string) => {
   *   if (input.trim()) {
   *     executeCommand(sessionId, input);
   *   }
   * }, [executeCommand]);
   */

  // Handle terminal resize
  const handleTerminalResize = useCallback((sessionId: string, cols: number, rows: number) => {
    console.log(`Terminal ${sessionId} resized to ${cols}x${rows}`);
  }, []);

  // Get active session
  /*
   * const activeSession = sessions.find(s => s.id === activeSessionId);
   */

  return (
    <div className="h-full flex flex-col bg-bolt-elements-background">
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-background-depth-2 border-b border-bolt-elements-borderColor">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-bolt-elements-textPrimary">🖥️ Advanced Terminal</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => createSession('bash')}
              className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              title="New Bash Terminal"
            >
              + Bash
            </button>
            <button
              onClick={() => createSession('powershell')}
              className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              title="New PowerShell Terminal"
            >
              + PowerShell
            </button>
            <button
              onClick={() => createSession('cmd')}
              className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 rounded transition-colors"
              title="New CMD Terminal"
            >
              + CMD
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 rounded transition-colors"
            title="Terminal Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Terminal Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-bolt-elements-background-depth-1 border-b border-bolt-elements-borderColor">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            className={classNames(
              'px-3 py-1.5 text-xs rounded transition-colors',
              activeSessionId === session.id
                ? 'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary'
                : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            )}
          >
            {session.title}
            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
                }}
                className="ml-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
              >
                ✕
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={classNames('absolute inset-0', session.id === activeSessionId ? 'block' : 'hidden')}
          >
            <Terminal
              id={session.id}
              theme={theme}
              readonly={false}
              onTerminalReady={(terminal) => handleTerminalReady(session.id, terminal)}
              onTerminalResize={(cols, rows) => handleTerminalResize(session.id, cols, rows)}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg p-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Terminal Settings</h3>
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
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => setSettings((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-bolt-elements-textSecondary">{settings.fontSize}px</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Font Family</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings((prev) => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                >
                  <option value="JetBrains Mono, Fira Code, Consolas, Monaco, monospace">JetBrains Mono</option>
                  <option value="Fira Code, Consolas, Monaco, monospace">Fira Code</option>
                  <option value="Consolas, Monaco, monospace">Consolas</option>
                  <option value="Monaco, monospace">Monaco</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                >
                  <option value="auto">Auto</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Cursor Style</label>
                <select
                  value={settings.cursorStyle}
                  onChange={(e) => setSettings((prev) => ({ ...prev, cursorStyle: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                >
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                  <option value="bar">Bar</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cursorBlink"
                  checked={settings.cursorBlink}
                  onChange={(e) => setSettings((prev) => ({ ...prev, cursorBlink: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="cursorBlink" className="text-sm text-bolt-elements-textPrimary">
                  Cursor Blink
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableBell"
                  checked={settings.enableBell}
                  onChange={(e) => setSettings((prev) => ({ ...prev, enableBell: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableBell" className="text-sm text-bolt-elements-textPrimary">
                  Enable Bell
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AdvancedTerminal.displayName = 'AdvancedTerminal';
