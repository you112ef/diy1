#!/usr/bin/env node

/**
 * سكريبت الإعداد التلقائي
 * يقوم بإعداد وتشغيل التطبيق مع الإعدادات المحسنة
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء الإعداد التلقائي...');

// التحقق من وجود Ollama
function checkOllama() {
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    console.log('✅ Ollama مُثبت ومتاح');
    return true;
  } catch (error) {
    console.log('❌ Ollama غير مُثبت');
    return false;
  }
}

// بدء خدمة Ollama
function startOllama() {
  console.log('🔄 بدء خدمة Ollama...');
  const ollama = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore'
  });
  ollama.unref();
  
  // انتظار بدء الخدمة
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ تم بدء خدمة Ollama');
      resolve();
    }, 3000);
  });
}

// التحقق من النماذج المطلوبة
async function checkRequiredModels() {
  const requiredModels = ['stable-code:3b', 'solar:10.7b'];
  
  try {
    const output = execSync('ollama list', { encoding: 'utf8' });
    const installedModels = output.split('\n').slice(1).map(line => {
      const parts = line.trim().split(/\s+/);
      return parts[0];
    }).filter(name => name && name !== 'NAME');
    
    console.log('📋 النماذج المُثبتة:', installedModels);
    
    const missingModels = requiredModels.filter(model => 
      !installedModels.includes(model)
    );
    
    if (missingModels.length > 0) {
      console.log('⚠️ النماذج المفقودة:', missingModels);
      
      for (const model of missingModels) {
        console.log(`📥 تحميل النموذج: ${model}...`);
        try {
          execSync(`ollama pull ${model}`, { stdio: 'inherit' });
          console.log(`✅ تم تحميل النموذج: ${model}`);
        } catch (error) {
          console.error(`❌ فشل في تحميل النموذج: ${model}`);
        }
      }
    } else {
      console.log('✅ جميع النماذج المطلوبة متوفرة');
    }
  } catch (error) {
    console.error('❌ خطأ في التحقق من النماذج:', error.message);
  }
}

// إنشاء ملف البيئة إذا لم يكن موجوداً
function ensureEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 إنشاء ملف .env.local...');
    const envContent = `# Auto-generated environment configuration
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
VITE_LOG_LEVEL=info
DEFAULT_NUM_CTX=32768
NODE_ENV=development
RUNNING_IN_DOCKER=false
VITE_HMR_PROTOCOL=ws
VITE_HMR_HOST=localhost
VITE_HMR_PORT=5173
CHOKIDAR_USEPOLLING=false
WATCHPACK_POLLING=false
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ تم إنشاء ملف .env.local');
  } else {
    console.log('✅ ملف .env.local موجود');
  }
}

// تشغيل التطبيق
function startApplication() {
  console.log('🚀 تشغيل التطبيق...');
  
  const child = spawn('pnpm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('exit', (code) => {
    console.log(`التطبيق توقف برمز الخروج: ${code}`);
    process.exit(code);
  });
  
  // التعامل مع إيقاف التطبيق
  process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف التطبيق...');
    child.kill('SIGINT');
  });
}

// الدالة الرئيسية
async function main() {
  try {
    // التحقق من متطلبات النظام
    ensureEnvFile();
    
    if (checkOllama()) {
      await startOllama();
      await checkRequiredModels();
    } else {
      console.log('⚠️ تحذير: Ollama غير مُثبت، بعض الميزات قد لا تعمل');
    }
    
    // تشغيل التطبيق
    console.log('🎉 الإعداد التلقائي مكتمل!');
    console.log('📱 سيتم فتح التطبيق على: http://localhost:5173');
    console.log('🤖 النماذج المتاحة: stable-code:3b, solar:10.7b');
    console.log('⚙️ تم تطبيق الإعدادات المحسنة تلقائياً');
    
    startApplication();
    
  } catch (error) {
    console.error('❌ خطأ في الإعداد التلقائي:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = { main, checkOllama, startOllama, checkRequiredModels };