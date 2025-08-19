/**
 * Auto Settings Configuration
 * يقوم بضبط الإعدادات تلقائياً للحصول على أفضل تجربة مستخدم
 */

export const AUTO_SETTINGS = {
  // إعدادات النماذج الافتراضية
  defaultModels: {
    coding: 'stable-code:3b',
    general: 'solar:10.7b',
    fallback: 'gpt-3.5-turbo'
  },

  // إعدادات الأداء
  performance: {
    contextLength: 32768,
    temperature: 0.7,
    maxTokens: 4000,
    streamResponse: true
  },

  // إعدادات واجهة المستخدم
  ui: {
    theme: 'dark',
    language: 'ar', // Arabic support
    showLineNumbers: true,
    enableAutoComplete: true,
    enableSyntaxHighlight: true
  },

  // إعدادات المطورين
  developer: {
    enableDebugMode: false,
    showEventLogs: true,
    enableHotReload: true,
    autoSave: true
  },

  // إعدادات Ollama
  ollama: {
    enabled: true,
    baseUrl: 'http://127.0.0.1:11434',
    autoStart: true,
    models: ['stable-code:3b', 'solar:10.7b']
  },

  // إعدادات النشر التلقائي
  deployment: {
    autoDeployOnPush: true,
    buildCommand: 'pnpm run build',
    outputDirectory: 'build/client',
    environmentVariables: {
      NODE_ENV: 'production',
      VITE_LOG_LEVEL: 'info',
      OLLAMA_API_BASE_URL: 'http://127.0.0.1:11434'
    }
  }
};

/**
 * يطبق الإعدادات التلقائية عند بدء التطبيق
 */
export function applyAutoSettings() {
  // تطبيق إعدادات Ollama
  if (typeof window !== 'undefined') {
    const ollamaSettings = {
      enabled: AUTO_SETTINGS.ollama.enabled,
      baseUrl: AUTO_SETTINGS.ollama.baseUrl
    };
    
    localStorage.setItem('ollama-settings', JSON.stringify(ollamaSettings));
    
    // تطبيق إعدادات واجهة المستخدم
    const uiSettings = {
      theme: AUTO_SETTINGS.ui.theme,
      language: AUTO_SETTINGS.ui.language
    };
    
    localStorage.setItem('ui-settings', JSON.stringify(uiSettings));
    
    // تطبيق إعدادات الأداء
    const performanceSettings = {
      contextLength: AUTO_SETTINGS.performance.contextLength,
      temperature: AUTO_SETTINGS.performance.temperature,
      maxTokens: AUTO_SETTINGS.performance.maxTokens
    };
    
    localStorage.setItem('performance-settings', JSON.stringify(performanceSettings));
    
    console.log('✅ تم تطبيق الإعدادات التلقائية بنجاح');
  }
}

/**
 * يتحقق من حالة النماذج المطلوبة
 */
export async function checkRequiredModels(): Promise<boolean> {
  try {
    const response = await fetch(`${AUTO_SETTINGS.ollama.baseUrl}/api/tags`);
    const data = await response.json();
    
    const installedModels = data.models.map((model: any) => model.name);
    const requiredModels = AUTO_SETTINGS.ollama.models;
    
    const missingModels = requiredModels.filter(model => 
      !installedModels.includes(model)
    );
    
    if (missingModels.length > 0) {
      console.warn('⚠️ النماذج المفقودة:', missingModels);
      return false;
    }
    
    console.log('✅ جميع النماذج المطلوبة متوفرة');
    return true;
  } catch (error) {
    console.error('❌ خطأ في التحقق من النماذج:', error);
    return false;
  }
}