import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { logger } from '~/utils/logger';

interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaApiResponse {
  models: OllamaModel[];
}

export default class OllamaProvider extends BaseProvider {
  name = 'Ollama';
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
      label: 'llama3.2:3b (3B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:7b',
      label: 'llama3.2:7b (7B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:8b',
      label: 'llama3.2:8b (8B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama3.2:70b',
      label: 'llama3.2:70b (70B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral:7b',
      label: 'mistral:7b (7B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'codellama:7b',
      label: 'codellama:7b (7B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'phi3:mini',
      label: 'phi3:mini (3.8B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'gemma:2b',
      label: 'gemma:2b (2B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'qwen2.5:0.5b',
      label: 'qwen2.5:0.5b (0.5B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'nous-hermes2:mixtral-8x7b-dpo',
      label: 'nous-hermes2:mixtral-8x7b-dpo (47B parameters)',
      provider: this.name,
      maxTokenAllowed: 32768,
    }
  ];

  private _convertEnvToRecord(env?: Env): Record<string, string> {
    if (!env) {
      return {};
    }

    // Convert Env to a plain object with string values
    return Object.entries(env).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  getDefaultNumCtx(serverEnv?: Env): number {
    const envRecord = this._convertEnvToRecord(serverEnv);
    return envRecord.DEFAULT_NUM_CTX ? parseInt(envRecord.DEFAULT_NUM_CTX, 10) : 32768;
  }

  private _isCloudflarePages(): boolean {
    // Check if running in Cloudflare Pages environment
    return typeof process !== 'undefined' && 
           (process.env.CF_PAGES === '1' || 
            process.env.CLOUDFLARE_PAGES === '1' ||
            typeof window === 'undefined' && typeof globalThis.fetch !== 'undefined');
  }

  private _normalizeBaseUrl(baseUrl: string): string {
    // For Cloudflare Pages, don't modify URLs - they should be public endpoints
    if (this._isCloudflarePages()) {
      return baseUrl;
    }

    // For local development, handle Docker networking
    const isDocker = process?.env?.RUNNING_IN_DOCKER === 'true';
    if (isDocker) {
      baseUrl = baseUrl.replace('localhost', 'host.docker.internal');
      baseUrl = baseUrl.replace('127.0.0.1', 'host.docker.internal');
    }

    return baseUrl;
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    // إذا لم يكن هناك baseUrl، استخدم النماذج الوهمية
    if (!baseUrl) {
      logger.info('No Ollama base URL found, using static models for testing');
      return this.staticModels;
    }

    baseUrl = this._normalizeBaseUrl(baseUrl);

    try {
      logger.info(`Attempting to fetch models from: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // إضافة timeout للاتصال
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaApiResponse;
      logger.info(`Successfully fetched ${data.models.length} models from Ollama`);

      return data.models.map((model: OllamaModel) => ({
        name: model.name,
        label: `${model.name} (${model.details.parameter_size})`,
        provider: this.name,
        maxTokenAllowed: this.getDefaultNumCtx(serverEnv as any),
      }));
    } catch (error) {
      logger.warn('Failed to fetch dynamic models from Ollama, falling back to static models:', error);
      
      // في حالة الفشل، نعود للنماذج الوهمية
      return this.staticModels;
    }
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { apiKeys, providerSettings, serverEnv, model } = options;
    const envRecord = this._convertEnvToRecord(serverEnv);

    let { baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: 'OLLAMA_API_BASE_URL',
      defaultApiTokenKey: '',
    });

    // إذا لم يكن هناك baseUrl، استخدم endpoint محلي
    if (!baseUrl) {
      baseUrl = 'http://127.0.0.1:11434';
      logger.warn('No Ollama base URL configured, using default localhost endpoint');
    }

    baseUrl = this._normalizeBaseUrl(baseUrl);

    logger.debug('Ollama Base URL used:', baseUrl);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    }) as LanguageModelV1 & { config: any };

    // إعداد baseURL للـ API
    ollamaInstance.config.baseURL = `${baseUrl}/api`;

    return ollamaInstance;
  };
}
