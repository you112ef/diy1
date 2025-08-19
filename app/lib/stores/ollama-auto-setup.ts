/**
 * Ollama Auto Setup
 * إعداد تلقائي لـ Ollama للعمل بدون تدخل يدوي
 */

export const OLLAMA_CONFIG = {
  baseUrl: 'http://127.0.0.1:11434',
  enabled: true,
  requiredModels: [
    'stable-code:3b',
    'llama3.2:1b', 
    'qwen2.5-coder:1.5b'
  ],
  performance: {
    contextLength: 32768,
    temperature: 0.7,
  }
};

/**
 * تفعيل Ollama تلقائياً في الإعدادات
 */
export function enableOllamaAutomatically() {
  if (typeof window !== 'undefined') {
    try {
      // إعداد Ollama في localStorage
      const ollamaSettings = {
        enabled: true,
        baseUrl: OLLAMA_CONFIG.baseUrl,
      };
      
      localStorage.setItem('ollama-settings', JSON.stringify(ollamaSettings));
      
      // إعداد موفر Ollama في إعدادات الموفرين
      const existingProviders = localStorage.getItem('provider_settings');
      let providerSettings = {};
      
      if (existingProviders) {
        try {
          providerSettings = JSON.parse(existingProviders);
        } catch (e) {
          console.warn('خطأ في قراءة إعدادات الموفرين الحالية');
        }
      }
      
      // تفعيل Ollama في إعدادات الموفرين
      providerSettings = {
        ...providerSettings,
        Ollama: {
          name: 'Ollama',
          settings: {
            enabled: true,
            baseUrl: OLLAMA_CONFIG.baseUrl,
          }
        }
      };
      
      localStorage.setItem('provider_settings', JSON.stringify(providerSettings));
      
      console.log('✅ تم تفعيل Ollama تلقائياً');
      return true;
    } catch (error) {
      console.error('❌ خطأ في تفعيل Ollama:', error);
      return false;
    }
  }
  return false;
}

/**
 * التحقق من حالة Ollama
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name: string }> };
      console.log('✅ Ollama متصل، النماذج المتاحة:', data.models?.length || 0);
      return true;
    }
  } catch (error) {
    console.log('⚠️ Ollama غير متصل. تأكد من تشغيله:', OLLAMA_CONFIG.baseUrl);
  }
  return false;
}

/**
 * تحميل النماذج المطلوبة
 */
export async function downloadRequiredModels(): Promise<void> {
  const isConnected = await checkOllamaStatus();
  if (!isConnected) {
    console.warn('❌ لا يمكن تحميل النماذج - Ollama غير متصل');
    return;
  }
  
  for (const model of OLLAMA_CONFIG.requiredModels) {
    try {
      console.log(`📥 تحميل النموذج: ${model}`);
      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });
      
      if (response.ok) {
        console.log(`✅ تم تحميل: ${model}`);
      } else {
        console.warn(`⚠️ فشل تحميل: ${model}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في تحميل ${model}:`, error);
    }
  }
}

/**
 * إعداد شامل لـ Ollama
 */
export async function setupOllamaComplete() {
  console.log('🚀 بدء الإعداد الشامل لـ Ollama...');
  
  // تفعيل Ollama
  const enabled = enableOllamaAutomatically();
  if (!enabled) {
    console.error('❌ فشل في تفعيل Ollama');
    return false;
  }
  
  // التحقق من الاتصال
  const connected = await checkOllamaStatus();
  if (connected) {
    // تحميل النماذج المطلوبة
    await downloadRequiredModels();
  }
  
  console.log('✅ تم إكمال إعداد Ollama');
  return true;
}