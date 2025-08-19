/**
 * Auto Initialization Utilities
 * يتم تشغيلها عند بدء التطبيق لتطبيق الإعدادات التلقائية
 */

import { AUTO_SETTINGS, applyAutoSettings, checkRequiredModels } from '~/lib/stores/auto-settings';

/**
 * تهيئة التطبيق تلقائياً
 */
export async function autoInitialize() {
  console.log('🚀 بدء التهيئة التلقائية للتطبيق...');

  try {
    // تطبيق الإعدادات التلقائية
    applyAutoSettings();

    // التحقق من النماذج المطلوبة
    const modelsAvailable = await checkRequiredModels();
    
    if (!modelsAvailable) {
      console.warn('⚠️ بعض النماذج غير متوفرة، قم بتشغيل: pnpm run auto-setup');
    }

    // تطبيق إعدادات الأداء
    if (typeof window !== 'undefined') {
      // تحسين الأداء
      document.documentElement.style.setProperty('--context-length', AUTO_SETTINGS.performance.contextLength.toString());
      
      // إعداد المظهر
      if (AUTO_SETTINGS.ui.theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // إعداد اللغة
      document.documentElement.lang = AUTO_SETTINGS.ui.language;
      document.documentElement.dir = AUTO_SETTINGS.ui.language === 'ar' ? 'rtl' : 'ltr';
    }

    console.log('✅ تم إكمال التهيئة التلقائية بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في التهيئة التلقائية:', error);
    return false;
  }
}

/**
 * التحقق من حالة النظام
 */
export async function systemHealthCheck() {
  const checks = {
    ollama: false,
    models: false,
    environment: false
  };

  try {
    // التحقق من Ollama
    const ollamaResponse = await fetch(`${AUTO_SETTINGS.ollama.baseUrl}/api/tags`);
    checks.ollama = ollamaResponse.ok;

    if (checks.ollama) {
      // التحقق من النماذج
      checks.models = await checkRequiredModels();
    }

    // التحقق من متغيرات البيئة
    checks.environment = typeof window !== 'undefined' && 
                        localStorage.getItem('ollama-settings') !== null;

    console.log('🔍 نتائج فحص النظام:', checks);
    return checks;
  } catch (error) {
    console.error('❌ خطأ في فحص النظام:', error);
    return checks;
  }
}

/**
 * عرض معلومات النظام
 */
export function showSystemInfo() {
  console.log('📊 معلومات النظام:');
  console.log('├── النماذج المتاحة:', AUTO_SETTINGS.ollama.models);
  console.log('├── عنوان Ollama:', AUTO_SETTINGS.ollama.baseUrl);
  console.log('├── المظهر:', AUTO_SETTINGS.ui.theme);
  console.log('├── اللغة:', AUTO_SETTINGS.ui.language);
  console.log('├── طول السياق:', AUTO_SETTINGS.performance.contextLength);
  console.log('└── درجة الحرارة:', AUTO_SETTINGS.performance.temperature);
}