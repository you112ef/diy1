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
  getApiKeyLink = 'https://ollama.ai/cloud';
  labelForGetApiKey = 'Get Ollama API Key';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
    apiTokenKey: 'OLLAMA_API_KEY',
  };

  staticModels: ModelInfo[] = [
    // Fallback models if dynamic fetch fails
    {
      name: 'llama2:7b',
      label: 'llama2:7b (7B parameters)',
      provider: 'Ollama',
      maxTokenAllowed: 32768,
    },
    {
      name: 'llama2:13b',
      label: 'llama2:13b (13B parameters)',
      provider: 'Ollama',
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral:7b',
      label: 'mistral:7b (7B parameters)',
      provider: 'Ollama',
      maxTokenAllowed: 32768,
    },
    {
      name: 'codellama:7b',
      label: 'codellama:7b (7B parameters)',
      provider: 'Ollama',
      maxTokenAllowed: 32768,
    },
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

  private getOllamaUrl(serverEnv?: Env): string {
    // Check if we're in production or preview (Cloudflare Pages)
    const isProduction = serverEnv?.NODE_ENV === 'production' || serverEnv?.NODE_ENV === 'preview';
    
    if (isProduction) {
      // Use remote Ollama server in production/preview
      return serverEnv?.OLLAMA_REMOTE_URL || serverEnv?.OLLAMA_API_BASE_URL || '';
    } else {
      // Use local Ollama in development
      return serverEnv?.OLLAMA_LOCAL_URL || serverEnv?.OLLAMA_API_BASE_URL || 'http://127.0.0.1:11434';
    }
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const baseUrl = this.getOllamaUrl(serverEnv);

    if (!baseUrl) {
      logger.warn('No Ollama URL configured, returning static models');
      return this.staticModels;
    }

    try {
      // Add timeout for production environments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      logger.info(`Fetching Ollama models from: ${baseUrl}/api/tags`);

      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaApiResponse;
      
      if (!data.models || data.models.length === 0) {
        logger.warn('No models found in Ollama response, returning static models');
        return this.staticModels;
      }

      logger.info(`Successfully fetched ${data.models.length} models from Ollama`);
      
      const dynamicModels = data.models.map((model: OllamaModel) => ({
        name: model.name,
        label: `${model.name} (${model.details?.parameter_size || 'Unknown size'})`,
        provider: this.name,
        maxTokenAllowed: this.getDefaultNumCtx(serverEnv),
      }));

      // Combine dynamic models with static models for better coverage
      const allModels = [...dynamicModels];
      
      // Add static models that aren't already in dynamic models
      this.staticModels.forEach(staticModel => {
        if (!allModels.some(dynamicModel => dynamicModel.name === staticModel.name)) {
          allModels.push(staticModel);
        }
      });

      return allModels;
    } catch (error) {
      logger.error('Failed to fetch Ollama models:', error);
      logger.info('Returning static models as fallback');
      
      // Return static models instead of empty array to prevent build errors
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

    const baseUrl = this.getOllamaUrl(envRecord);

    if (!baseUrl) {
      throw new Error('No Ollama URL configured. Please set OLLAMA_API_BASE_URL in your environment.');
    }

    logger.debug('Ollama Base Url used: ', baseUrl);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    }) as LanguageModelV1 & { config: any };

    ollamaInstance.config.baseURL = `${baseUrl}/api`;

    return ollamaInstance;
  };
}
