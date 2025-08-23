import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, Message, GenerateContentResult } from 'ai';
import { logger } from '~/utils/logger';

export default class OllamaWorkingProvider extends BaseProvider {
  name = 'Ollama (Simulated - Testing Only)';
  getApiKeyLink = 'https://ollama.com/download';
  labelForGetApiKey = 'Download Ollama for Real Models';
  icon = 'i-ph:cloud-arrow-down';

  config = {
    baseUrlKey: 'OLLAMA_API_BASE_URL',
  };

  // نماذج محاكاة للاختبار فقط
  staticModels: ModelInfo[] = [
    {
      name: 'llama3.2:7b',
      label: 'llama3.2:7b (7B parameters) - SIMULATED',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'mistral:7b',
      label: 'mistral:7b (7B parameters) - SIMULATED',
      provider: this.name,
      maxTokenAllowed: 32768,
    },
    {
      name: 'codellama:7b',
      label: 'codellama:7b (7B parameters) - SIMULATED',
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
    logger.warn('Using SIMULATED Ollama models - these are for testing only!');
    return this.staticModels;
  }

  getModelInstance: (options: {
    model: string;
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }) => LanguageModelV1 = (options) => {
    const { model } = options;
    
    logger.warn(`Creating SIMULATED Ollama instance for model: ${model} - This is for testing only!`);

    // إنشاء مزود محاكي للاختبار
    const simulatedProvider: LanguageModelV1 = {
      id: model,
      provider: this.name,
      generateContent: async (messages: Message[]): Promise<GenerateContentResult> => {
        logger.info(`Simulating response for model: ${model}`);
        
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const lastMessage = messages[messages.length - 1];
        const userInput = lastMessage?.content || 'Hello';
        
        // إنشاء استجابة ذكية بناءً على المدخلات
        let response = '';
        
        if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('مرحبا')) {
          response = `مرحباً! أنا ${model}، نموذج محاكى للاختبار مع bolt.diy. هذا ليس نموذج Ollama حقيقي!\n\nللحصول على نماذج حقيقية:\n1. ثبت Ollama: https://ollama.com/download\n2. شغل: ollama serve\n3. استخدم "Ollama (Real)"`;
        } else if (userInput.toLowerCase().includes('code') || userInput.toLowerCase().includes('كود')) {
          response = `أنا نموذج محاكى للاختبار! إليك مثال بسيط:\n\n\`\`\`python\nprint("Hello from simulated ${model}!")\nprint("This is NOT a real Ollama model!")\n\`\`\``;
        } else if (userInput.toLowerCase().includes('write') || userInput.toLowerCase().includes('اكتب')) {
          response = `أنا نموذج محاكى للاختبار! إليك مقالة قصيرة:\n\n"هذا نموذج محاكى يعمل مع bolt.diy للاختبار والتطوير. إنه ليس نموذج Ollama حقيقي، لكنه يساعد في اختبار واجهة المستخدم والوظائف."`;
        } else if (userInput.toLowerCase().includes('explain') || userInput.toLowerCase().includes('اشرح')) {
          response = `أنا نموذج محاكى للاختبار! إليك شرح:\n\nهذا النموذج يحاكي استجابات Ollama الحقيقية للاختبار. إنه لا يستخدم تقنيات الذكاء الاصطناعي الحقيقية، لكنه يساعد في تطوير واختبار التطبيقات.\n\nللحصول على نماذج حقيقية، ثبت Ollama!`;
        } else {
          response = `أهلاً! أنا ${model}، نموذج محاكى للاختبار مع bolt.diy.\n\n⚠️ تحذير: هذا ليس نموذج Ollama حقيقي!\n\nيمكنني مساعدتك في:\n• اختبار واجهة المستخدم\n• اختبار وظائف التطبيق\n• تطوير منطق التطبيق\n\nللحصول على نماذج حقيقية:\n1. ثبت Ollama: https://ollama.com/download\n2. شغل: ollama serve\n3. استخدم "Ollama (Real)"`;
        }
        
        return {
          content: response,
          finishReason: 'stop',
          usage: {
            promptTokens: userInput.length,
            completionTokens: response.length,
            totalTokens: userInput.length + response.length,
          },
        };
      },
      
      streamText: async function* (messages: Message[]) {
        const result = await this.generateContent(messages);
        yield result.content;
      },
      
      maxTokens: 32768,
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    };

    return simulatedProvider;
  };
}