#!/bin/bash

# Ollama Auto Setup Script
# سكريبت الإعداد التلقائي لـ Ollama

echo "🚀 بدء إعداد Ollama التلقائي..."

# التحقق من تثبيت Ollama
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama غير مثبت. يرجى تثبيته أولاً:"
    echo "curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

# بدء خدمة Ollama في الخلفية
echo "🔄 بدء خدمة Ollama..."
ollama serve &
OLLAMA_PID=$!

# انتظار حتى يصبح Ollama جاهزاً
echo "⏳ انتظار اتصال Ollama..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama متصل بنجاح"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ انتهت مهلة انتظار اتصال Ollama"
        kill $OLLAMA_PID 2>/dev/null
        exit 1
    fi
done

# تحميل النماذج المطلوبة
MODELS=("stable-code:3b" "llama3.2:1b" "qwen2.5-coder:1.5b")

for model in "${MODELS[@]}"; do
    echo "📥 تحميل النموذج: $model"
    if ollama pull "$model"; then
        echo "✅ تم تحميل النموذج بنجاح: $model"
    else
        echo "⚠️ فشل في تحميل النموذج: $model"
    fi
done

echo "🎉 تم إكمال إعداد Ollama!"
echo "النماذج المتاحة:"
ollama list

# إبقاء Ollama يعمل في الخلفية
echo "🔄 Ollama يعمل في الخلفية على: http://127.0.0.1:11434"
echo "لإيقاف Ollama: kill $OLLAMA_PID"