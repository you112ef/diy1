# 🚀 دليل البدء السريع: bolt.diy + Ollama + Cloudflare Pages

## ⚡ التطبيق السريع (5 دقائق)

### 1. إعداد Worker (للوصول لـ Ollama)

```bash
# عدل رابط Ollama في الملف
nano workers/ollama-proxy.js
# غير: const OLLAMA_BASE_URL = 'http://YOUR_OLLAMA_SERVER_IP:11434';
# إلى: const OLLAMA_BASE_URL = 'http://192.168.1.100:11434';

# نشر Worker
cd workers
wrangler login
wrangler deploy
cd ..
```

### 2. نشر على Cloudflare Pages

```bash
# تشغيل السكريپت التلقائي
chmod +x scripts/deploy-ollama.sh
./scripts/deploy-ollama.sh

# أو يدوياً:
pnpm run build
wrangler pages deploy build/client --project-name=bolt-diy-ollama
```

### 3. إعداد متغيرات البيئة في Cloudflare Pages

في لوحة تحكم Cloudflare Pages → Settings → Environment Variables:

```
OLLAMA_API_BASE_URL=https://ollama-proxy.your-subdomain.workers.dev
DEFAULT_NUM_CTX=32768
VITE_LOG_LEVEL=info
```

## ✅ الاختبار

1. افتح التطبيق المنشور
2. اذهب للإعدادات → Providers → Local Providers
3. فعل Ollama
4. تحقق من ظهور النماذج

## 🔧 البدائل السريعة

### استخدام ngrok (للتطوير)
```bash
ngrok http 11434
# استخدم الرابط المعطى في OLLAMA_API_BASE_URL
```

### استخدام Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:11434
# استخدم الرابط المعطى في OLLAMA_API_BASE_URL
```

## 📋 المتطلبات

- ✅ Ollama يعمل محلياً
- ✅ حساب Cloudflare مع Pages & Workers
- ✅ wrangler CLI مثبت
- ✅ pnpm مثبت

## 🚨 مشاكل شائعة

**المشكلة**: لا تظهر النماذج
**الحل**: تحقق من Worker URL وأن Ollama يعمل

**المشكلة**: CORS Error
**الحل**: تأكد من نشر Worker بشكل صحيح

**المشكلة**: Connection Failed
**الحل**: تحقق من عنوان IP في Worker

## 📚 المزيد من التفاصيل

راجع [OLLAMA_DEPLOYMENT_GUIDE.md](./OLLAMA_DEPLOYMENT_GUIDE.md) للدليل الشامل.