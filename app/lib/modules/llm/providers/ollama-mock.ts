import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { logger } from '~/utils/logger';

export default class OllamaMockProvider extends BaseProvider {
  name = 'Ollama (Mock - Testing Only)';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama for Real Models';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  // نماذج وهمية للاختبار فقط - لا تعمل فعلياً
  staticModels: ModelInfo[] = [
    {
      name: 'llama3.2:3b',
      label: 'llama3.2:3b (3B parameters) - MOCK ONLY',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:7b',
      label: 'llama3.2:7b (7B parameters) - MOCK ONLY',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:8b',
      label: 'llama3.2:8b (8B parameters) - MOCK ONLY',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral:7b',
      label: 'mistral:7b (7B parameters) - MOCK ONLY',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'codellama:7b',
      label: 'codellama:7b (7B parameters) - MOCK ONLY',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
  ];

  getDefaultNumCtx(serverEnv?: Env): number {
    return 32768;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    logger.warn('Using MOCK Ollama models - these are for testing only and will not respond!');
    return this.staticModels;
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { model } = options;
    
    logger.warn(`Creating MOCK Ollama instance for model: ${model} - This will not work!`);

    // إنشاء مزود وهمي لا يعمل
    const mockProvider: LanguageModelV1 = {
      id: model,
      provider: this.name,
      generateContent: async (messages: Message[]): Promise<GenerateContentResult> => {
        logger.error('MOCK PROVIDER CALLED - This will not work! Use real Ollama instead.');
        
        return {
          content: `❌ ERROR: This is a MOCK provider for ${model}. It will not work!\n\nPlease use:\n1. Ollama (Real) - for actual working models\n2. Install Ollama server: https://ollama.com/download\n3. Run: ollama serve`,
          finishReason: 'stop',
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        };
      },
      
      streamText: async function* (messages: Message[]) {
        yield `❌ ERROR: MOCK provider ${model} - This will not work!`;
      },
      
      maxTokens: 32768,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };

    return mockProvider;
  };
}