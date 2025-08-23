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

  staticModels: ModelInfo[] = [];

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
    // Check if we're in production (Cloudflare Pages)
    const isProduction = serverEnv?.NODE_ENV === 'production';
    
    if (isProduction) {
      // Use remote Ollama server in production
      return serverEnv?.OLLAMA_REMOTE_URL || serverEnv?.OLLAMA_API_BASE_URL || '';
    } else {
      // Use local Ollama in development
      return serverEnv?.OLLAMA_LOCAL_URL || serverEnv?.OLLAMA_API_BASE_URL || '';
    }
  }

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const baseUrl = this.getOllamaUrl(serverEnv);

    if (!baseUrl) {
      logger.warn('No Ollama URL configured, returning empty model list');
      return [];
    }

    try {
      // Add timeout for production environments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
      
      logger.info(`Successfully fetched ${data.models?.length || 0} models from Ollama`);
      
      return data.models.map((model: OllamaModel) => ({
        name: model.name,
        label: `${model.name} (${model.details.parameter_size})`,
        provider: this.name,
        maxTokenAllowed: 8000,
      }));
    } catch (error) {
      logger.error('Failed to fetch Ollama models:', error);
      
      // Return empty array instead of throwing to prevent build errors
      return [];
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
      throw new Error('No Ollama URL configured');
    }

    logger.debug('Ollama Base Url used: ', baseUrl);

    const ollamaInstance = ollama(model, {
      numCtx: this.getDefaultNumCtx(serverEnv),
    }) as LanguageModelV1 & { config: any };

    ollamaInstance.config.baseURL = `${baseUrl}/api`;

    return ollamaInstance;
  };
}
