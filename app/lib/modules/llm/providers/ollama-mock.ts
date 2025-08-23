import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

export default class OllamaMockProvider extends BaseProvider {
  name = 'Ollama (Mock)';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  // نماذج وهمية للاختبار والتطوير
  staticModels: ModelInfo[] = [
    {
      name: 'llama3.2:3b',
      label: 'llama3.2:3b (3B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:7b',
      label: 'llama3.2:7b (7B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:8b',
      label: 'llama3.2:8b (8B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:70b',
      label: 'llama3.2:70b (70B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral:7b',
      label: 'mistral:7b (7B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'codellama:7b',
      label: 'codellama:7b (7B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'phi3:mini',
      label: 'phi3:mini (3.8B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'gemma:2b',
      label: 'gemma:2b (2B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'qwen2.5:0.5b',
      label: 'qwen2.5:0.5b (0.5B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'nous-hermes2:mixtral-8x7b-dpo',
      label: 'nous-hermes2:mixtral-8x7b-dpo (47B parameters) - Mock',
      provider: this.name,
      maxTokenAllowed: 32768,
    }
  ];

  getDefaultNumCtx(serverEnv?: Env): number {
    return 32768;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    logger.info('Using mock Ollama models for testing');
    return this.staticModels;
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { model } = options;
    
    logger.info(`Creating mock Ollama instance for model: ${model}`);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(),
    }) as LanguageModelV1 & { config: any };

    // إعداد baseURL وهمي
    ollamaInstance.config.baseURL = 'http://mock-ollama.local/api';

    return ollamaInstance;
  };
}