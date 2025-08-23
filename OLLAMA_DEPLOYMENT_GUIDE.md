# دليل نشر bolt.diy مع دعم Ollama على Cloudflare Pages

## 📋 المتطلبات المسبقة

1. **حساب Cloudflare** مع إمكانية الوصول إلى Pages و Workers
2. **خادم Ollama يعمل** على جهازك المحلي أو خادم عام
3. **Wrangler CLI** مثبت: `npm install -g wrangler`

## 🚀 خطوات النشر

### الخطوة 1: إعداد Ollama Proxy Worker

#### 1.1 تعديل إعدادات Worker
```bash
cd workers
# عدل الملف ollama-proxy.js
# غير OLLAMA_BASE_URL إلى عنوان خادم Ollama الخاص بك
```

#### 1.2 نشر Worker
```bash
cd workers
wrangler login
wrangler deploy
```

#### 1.3 تسجيل رابط Worker
بعد النشر، ستحصل على رابط مثل:
```
https://ollama-proxy.your-subdomain.workers.dev
```

### الخطوة 2: إعداد bolt.diy

#### 2.1 إعداد متغيرات البيئة المحلية
```bash
cp .env.example .env.local
```

عدل `.env.local`:
```bash
# للتطوير المحلي
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
DEFAULT_NUM_CTX=32768
VITE_LOG_LEVEL=debug
```

#### 2.2 تثبيت التبعيات والبناء
```bash
pnpm install
pnpm run build
```

### الخطوة 3: نشر على Cloudflare Pages

#### الطريقة الأولى: عبر لوحة التحكم

1. **اذهب إلى Cloudflare Dashboard**
2. **Pages → Create a project**
3. **Connect to Git** واختر repository
4. **إعدادات البناء**:
   - Build command: `pnpm run build`
   - Build output directory: `build/client`
   - Root directory: `/`

5. **إعداد متغيرات البيئة**:
   ```bash
   OLLAMA_API_BASE_URL=https://ollama-proxy.your-subdomain.workers.dev
   DEFAULT_NUM_CTX=32768
   VITE_LOG_LEVEL=info
   ```

#### الطريقة الثانية: عبر Wrangler CLI

```bash
# من المجلد الرئيسي للمشروع
wrangler pages deploy build/client --project-name=bolt-diy-ollama
```

## 🔧 الحلول البديلة

### الحل الأول: استخدام Cloudflare Tunnel (الموصى به)

#### 1. تثبيت cloudflared
```bash
# Linux/macOS
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Windows
# تحميل من: https://github.com/cloudflare/cloudflared/releases
```

#### 2. إعداد النفق
```bash
# تسجيل الدخول
cloudflared tunnel login

# إنشاء نفق
cloudflared tunnel create ollama-tunnel

# إعداد DNS
cloudflared tunnel route dns ollama-tunnel ollama.yourdomain.com

# تشغيل النفق
cloudflared tunnel --url http://localhost:11434 run ollama-tunnel
```

#### 3. استخدام النفق في متغيرات البيئة
```bash
OLLAMA_API_BASE_URL=https://ollama.yourdomain.com
```

### الحل الثاني: استخدام ngrok (للتطوير فقط)

```bash
# تثبيت ngrok
npm install -g ngrok

# تشغيل النفق
ngrok http 11434

# استخدام URL المعطى
OLLAMA_API_BASE_URL=https://xxxxx.ngrok.io
```

## 🧪 اختبار التكامل

### اختبار Worker
```bash
# اختبار صحة Worker
curl https://ollama-proxy.your-subdomain.workers.dev/health

# اختبار قائمة النماذج
curl https://ollama-proxy.your-subdomain.workers.dev/api/tags
```

### اختبار التطبيق
1. افتح bolt.diy في المتصفح
2. اذهب إلى الإعدادات → Providers → Local Providers
3. فعل Ollama
4. تحقق من ظهور النماذج المتاحة

## 🚨 حل المشاكل الشائعة

### خطأ CORS
```
Solution: تأكد من أن Worker يعمل بشكل صحيح ويحتوي على CORS headers
```

### عدم ظهور النماذج
```
Solution: 
1. تحقق من أن Ollama يعمل محلياً
2. تحقق من Worker URL
3. تحقق من متغيرات البيئة
```

### خطأ في الاتصال
```
Solution:
1. تحقق من أن OLLAMA_API_BASE_URL صحيح
2. تحقق من أن Worker يمكنه الوصول لخادم Ollama
3. تحقق من إعدادات الشبكة والجدران النارية
```

## 🔐 اعتبارات الأمان

1. **لا تعرض خادم Ollama مباشرة للإنترنت**
2. **استخدم Cloudflare Tunnel أو VPN للوصول الآمن**
3. **راقب استخدام Worker لتجنب التكاليف غير المتوقعة**
4. **استخدم متغيرات البيئة لحفظ URLs الحساسة**

## 📊 مراقبة الأداء

### في Cloudflare Dashboard
1. **Workers → ollama-proxy → Analytics**
2. **راقب عدد الطلبات والاستجابة**
3. **تحقق من السجلات للأخطاء**

### في bolt.diy
1. **استخدم VITE_LOG_LEVEL=debug للتطوير**
2. **راقب وحدة التحكم في المتصفح**
3. **تحقق من Network tab للطلبات المفشلة**

## 🎯 نصائح للحصول على أفضل أداء

1. **استخدم نماذج محلية أصغر للاستجابة السريعة**
2. **اضبط DEFAULT_NUM_CTX حسب ذاكرة نظامك**
3. **استخدم GPU إذا كان متاحاً لتسريع Ollama**
4. **راقب استخدام الذاكرة والمعالج**

## 📚 موارد إضافية

- [Ollama Documentation](https://ollama.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [bolt.diy GitHub Repository](https://github.com/stackblitz-labs/bolt.diy)