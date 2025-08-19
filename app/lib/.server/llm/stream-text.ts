import { convertToCoreMessages, streamText as _streamText, type Message } from 'ai';
import { MAX_TOKENS, type FileMap } from './constants';
import { getSystemPrompt } from '~/lib/common/prompts/prompts';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, MODIFICATIONS_TAG_NAME, WORK_DIR } from '~/utils/constants';
import type { IProviderSetting } from '~/types/model';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { allowedHTMLElements } from '~/utils/markdown';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createScopedLogger } from '~/utils/logger';
import { createFilesContext, extractPropertiesFromMessage } from './utils';
import { getFilePaths } from './select-context';
import { extractSearchKeys, performSearch, selectProvider, type Provider } from '~/lib/web/search.server';

export type Messages = Message[];

export interface StreamingOptions extends Omit<Parameters<typeof _streamText>[0], 'model'> {
  supabaseConnection?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
}

const logger = createScopedLogger('stream-text');

export async function streamText(props: {
  messages: Omit<Message, 'id'>[];
  env?: Env;
  options?: StreamingOptions;
  apiKeys?: Record<string, string>;
  files?: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  contextFiles?: FileMap;
  summary?: string;
  messageSliceId?: number;
}) {
  const { messages, env: serverEnv, options, apiKeys, files, providerSettings, promptId, contextOptimization, contextFiles, summary } = props;
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  let processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;
      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;
      content = content.replace(/<div class=\"__boltThought__\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');
      return { ...message, content };
    }
    return message;
  });

  // Optional backend web search injection based on last user message
  const lastUser = [...processedMessages].reverse().find((m) => m.role === 'user');
  let webSearchContext = '';
  if (lastUser && typeof lastUser.content === 'string') {
    const directive = parseWebSearchDirective(lastUser.content);
    if (directive) {
      try {
        const envLike: any = (serverEnv as any) || (globalThis as any).process?.env || {};
        const keys = extractSearchKeys(envLike);
        const provider: Provider | null = selectProvider(directive.provider || '', keys);
        if (provider) {
          const result = await performSearch({ provider, query: directive.query, currentPage: 1, numResults: directive.numResults, keys });
          const lines = result.items.map((r, i) => `#${i + 1} ${r.title}\n${r.link}\n${r.snippet}`);
          webSearchContext = `\nWEB SEARCH RESULTS (provider=${provider}):\n---\n${lines.join('\n\n')}\n---\n`;
        }
      } catch (err) {
        logger.warn(`web-search failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Get provider from LLMManager instead of PROVIDER_LIST
  const llmManager = LLMManager.getInstance();
  const provider = llmManager.getProvider(currentProvider) || llmManager.getDefaultProvider();
  const staticModels = llmManager.getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await llmManager.getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      logger.warn(`MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`);
      modelDetails = modelsList[0];
    }
  }

  const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

  let systemPrompt =
    (PromptLibrary.getPropmtFromLibrary(promptId || 'default', {
      cwd: WORK_DIR,
      allowedHtmlElements: allowedHTMLElements,
      modificationTagName: MODIFICATIONS_TAG_NAME,
      supabase: {
        isConnected: options?.supabaseConnection?.isConnected || false,
        hasSelectedProject: options?.supabaseConnection?.hasSelectedProject || false,
        credentials: options?.supabaseConnection?.credentials || undefined,
      },
    }) ?? getSystemPrompt()) + webSearchContext;

  if (files && contextFiles && contextOptimization) {
    const codeContext = createFilesContext(contextFiles, true);
    const filePaths = getFilePaths(files);
    systemPrompt = `${systemPrompt}
Below are all the files present in the project:
---
${filePaths.join('\n')}
---

Below is the artifact containing the context loaded into context buffer for you to have knowledge of and might need changes to fullfill current user request.
CONTEXT BUFFER:
---
${codeContext}
---
`;
    if (summary) {
      systemPrompt = `${systemPrompt}
      below is the chat history till now
CHAT SUMMARY:
---
${props.summary}
---
`;
      if (props.messageSliceId) {
        processedMessages = processedMessages.slice(props.messageSliceId);
      } else {
        const lastMessage = processedMessages.pop();
        if (lastMessage) {
          processedMessages = [lastMessage];
        }
      }
    }
  }

  logger.info(`Sending llm call to ${provider.name} with model ${modelDetails.name}`);

  const originalMessages = [...messages];
  const hasMultimodalContent = originalMessages.some((msg) => Array.isArray(msg.content));

  try {
    if (hasMultimodalContent) {
      const multimodalMessages = originalMessages.map((msg) => ({
        role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: Array.isArray(msg.content)
          ? msg.content.map((item) => {
              if (typeof item === 'string') {
                return { type: 'text', text: item };
              }
              if (item && typeof item === 'object') {
                if (item.type === 'image' && item.image) {
                  return { type: 'image', image: item.image };
                }
                if (item.type === 'text') {
                  return { type: 'text', text: item.text || '' };
                }
              }
              return { type: 'text', text: String(item || '') };
            })
          : [{ type: 'text', text: typeof msg.content === 'string' ? msg.content : String(msg.content || '') }],
      }));

      return await _streamText({
        model: provider.getModelInstance({ model: modelDetails.name, serverEnv, apiKeys, providerSettings }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: multimodalMessages as any,
        ...options,
      });
    } else {
      const normalizedTextMessages = processedMessages.map((msg) => ({
        role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
        content: typeof msg.content === 'string' ? msg.content : String(msg.content || ''),
      }));

      return await _streamText({
        model: provider.getModelInstance({ model: modelDetails.name, serverEnv, apiKeys, providerSettings }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: convertToCoreMessages(normalizedTextMessages),
        ...options,
      });
    }
  } catch (error: any) {
    if (error.message && error.message.includes('messages must be an array of CoreMessage or UIMessage')) {
      const fallbackMessages = processedMessages.map((msg) => {
        let textContent = '';
        if (typeof msg.content === 'string') {
          textContent = msg.content;
        } else if (Array.isArray(msg.content)) {
          const contentArray = msg.content as any[];
          textContent = contentArray
            .map((contentItem) => (typeof contentItem === 'string' ? contentItem : contentItem?.text || contentItem?.image || String(contentItem || '')))
            .join(' ');
        } else {
          textContent = String(msg.content || '');
        }
        return { role: msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user', content: [{ type: 'text', text: textContent }] } as any;
      });

      return await _streamText({
        model: provider.getModelInstance({ model: modelDetails.name, serverEnv, apiKeys, providerSettings }),
        system: systemPrompt,
        maxTokens: dynamicMaxTokens,
        messages: fallbackMessages as any,
        ...options,
      });
    }

    throw error;
  }
}

function parseWebSearchDirective(content: string): { query: string; provider?: Provider; numResults: number } | null {
  const match = content.match(/<web-search\s+query=\"([^\"]+)\"(?:\s+provider=\"([^\"]+)\")?(?:\s+num=\"(\d+)\")?\s*\/>/i);
  if (!match) return null;
  const query = match[1];
  const provider = (match[2] as Provider | undefined) || undefined;
  const num = match[3] ? parseInt(match[3], 10) : 5;
  return { query, provider, numResults: isFinite(num) ? num : 5 };
}
