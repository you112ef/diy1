/**
 * Ollama Management
 * إدارة Ollama الحقيقية بدون محاكاة
 */

export const OLLAMA_CONFIG = {
  baseUrl: 'http://127.0.0.1:11434',
  defaultModels: [
    'stable-code:3b',
    'llama3.2:1b', 
    'qwen2.5-coder:1.5b'
  ]
};

/**
 * التحقق من حالة Ollama الحقيقية
 */
export async function checkOllamaStatus(): Promise<{ connected: boolean; models: number; error?: string }> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name: string }> };
      const modelCount = data.models?.length || 0;
      return { connected: true, models: modelCount };
    } else {
      const errorText = await response.text();
      return { connected: false, models: 0, error: `HTTP ${response.status}: ${errorText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { connected: false, models: 0, error: errorMessage };
  }
}

/**
 * تشغيل Ollama (يتطلب تثبيت Ollama أولاً)
 */
export async function startOllama(): Promise<{ success: boolean; error?: string }> {
  try {
    // في المتصفح، لا يمكننا تشغيل Ollama مباشرة
    // يجب على المستخدم تشغيله يدوياً
    const status = await checkOllamaStatus();
    if (status.connected) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Ollama is not running. Please start it manually using: ollama serve' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to check Ollama status. Make sure Ollama is installed and running.' 
    };
  }
}

/**
 * تحميل نموذج من Ollama
 */
export async function pullOllamaModel(modelName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Failed to pull model: ${errorText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}

/**
 * إزالة نموذج من Ollama
 */
export async function removeOllamaModel(modelName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Failed to remove model: ${errorText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}

/**
 * الحصول على معلومات النموذج
 */
export async function getOllamaModelInfo(modelName: string): Promise<{ success: boolean; model?: any; error?: string }> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (response.ok) {
      const modelInfo = await response.json();
      return { success: true, model: modelInfo };
    } else {
      const errorText = await response.text();
      return { success: false, error: `Failed to get model info: ${errorText}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Network error: ${errorMessage}` };
  }
}