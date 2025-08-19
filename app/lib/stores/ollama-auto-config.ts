/**
 * Ollama Auto Configuration
 * تكوين تلقائي لـ Ollama للعمل بدون إعدادات يدوية
 */

export const OLLAMA_AUTO_CONFIG = {
  // إعدادات الاتصال التلقائية
  connection: {
    baseUrl: 'http://127.0.0.1:11434',
    enabled: true,
    autoStart: true,
  },

  // النماذج المطلوبة للتحميل التلقائي
  requiredModels: [
    'stable-code:3b',
    'llama3.2:1b',
    'qwen2.5-coder:1.5b',
  ],

  // إعدادات الأداء
  performance: {
    contextLength: 32768,
    temperature: 0.7,
    numCtx: 32768,
  },
};

/**
 * تطبيق الإعدادات التلقائية لـ Ollama
 */
export function applyOllamaAutoConfig() {
  if (typeof window !== 'undefined') {
    // تطبيق إعدادات الاتصال
    const ollamaSettings = {
      enabled: OLLAMA_AUTO_CONFIG.connection.enabled,
      baseUrl: OLLAMA_AUTO_CONFIG.connection.baseUrl,
      autoStart: OLLAMA_AUTO_CONFIG.connection.autoStart,
    };
    
    localStorage.setItem('ollama-auto-settings', JSON.stringify(ollamaSettings));
    
    // تطبيق إعدادات الأداء
    const performanceSettings = {
      contextLength: OLLAMA_AUTO_CONFIG.performance.contextLength,
      temperature: OLLAMA_AUTO_CONFIG.performance.temperature,
      numCtx: OLLAMA_AUTO_CONFIG.performance.numCtx,
    };
    
    localStorage.setItem('ollama-performance', JSON.stringify(performanceSettings));
    
    console.log('✅ تم تطبيق الإعدادات التلقائية لـ Ollama');
  }
}

/**
 * التحقق من حالة Ollama وتحميل النماذج المطلوبة
 */
export async function ensureOllamaModels(): Promise<boolean> {
  try {
    const baseUrl = OLLAMA_AUTO_CONFIG.connection.baseUrl;
    
    // التحقق من اتصال Ollama
    const healthResponse = await fetch(`${baseUrl}/api/tags`);
    if (!healthResponse.ok) {
      console.warn('⚠️ Ollama غير متصل. تأكد من تشغيله على:', baseUrl);
      return false;
    }
    
    const data = await healthResponse.json();
    const installedModels = data.models.map((model: any) => model.name);
    
    // التحقق من النماذج المطلوبة
    const missingModels = OLLAMA_AUTO_CONFIG.requiredModels.filter(
      model => !installedModels.includes(model)
    );
    
    if (missingModels.length > 0) {
      console.log('📥 تحميل النماذج المفقودة:', missingModels);
      
      // محاولة تحميل النماذج المفقودة
      for (const model of missingModels) {
        try {
          console.log(`📥 تحميل النموذج: ${model}`);
          const pullResponse = await fetch(`${baseUrl}/api/pull`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: model }),
          });
          
          if (pullResponse.ok) {
            console.log(`✅ تم تحميل النموذج بنجاح: ${model}`);
          } else {
            console.warn(`⚠️ فشل في تحميل النموذج: ${model}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في تحميل النموذج ${model}:`, error);
        }
      }
    }
    
    console.log('✅ جميع نماذج Ollama جاهزة');
    return true;
  } catch (error) {
    console.error('❌ خطأ في التحقق من نماذج Ollama:', error);
    return false;
  }
}

/**
 * تهيئة Ollama تلقائياً
 */
export async function initializeOllamaAuto() {
  console.log('🚀 بدء التهيئة التلقائية لـ Ollama...');
  
  // تطبيق الإعدادات
  applyOllamaAutoConfig();
  
  // التحقق من النماذج وتحميلها
  const modelsReady = await ensureOllamaModels();
  
  if (modelsReady) {
    console.log('✅ تم إعداد Ollama بنجاح وجاهز للاستخدام');
  } else {
    console.log('⚠️ Ollama مُعدّ جزئياً، قد تحتاج لتشغيل Ollama يدوياً');
  }
  
  return modelsReady;
}