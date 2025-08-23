import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

export default class MistralProvider extends BaseProvider {
  name = 'Mistral';
  getApiKeyLink = 'https://console.mistral.ai/api-keys/';

  config = {
    apiTokenKey: 'MISTRAL_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'open-mistral-7b', label: 'Open Mistral 7B', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'open-mixtral-8x22b', label: 'Open Mixtral 8x22B', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'open-codestral-mamba', label: 'Open Codestral Mamba', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'open-mistral-nemo', label: 'Open Mistral Nemo', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'mistral-8b-latest', label: 'Mistral 8B (Latest)', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'mistral-small-latest', label: 'Mistral Small (Latest)', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'codestral-latest', label: 'Codestral (Latest)', provider: 'Mistral', maxTokenAllowed: 8000 },
    { name: 'mistral-large-latest', label: 'Mistral Large (Latest)', provider: 'Mistral', maxTokenAllowed: 8000 },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'MISTRAL_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const mistral = createMistral({
      apiKey,
    });

    return mistral(model);
  }
}
