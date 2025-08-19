#!/usr/bin/env node

/**
 * سكريبت تحسين الأداء
 * يقوم بتحسين إعدادات النظام والتطبيق للحصول على أفضل أداء
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ بدء تحسين الأداء...');

/**
 * تحسين إعدادات Node.js
 */
function optimizeNodeSettings() {
  console.log('🔧 تحسين إعدادات Node.js...');
  
  // زيادة حد الذاكرة
  process.env.NODE_OPTIONS = '--max-old-space-size=4096 --max-semi-space-size=256';
  
  // تحسين إعدادات V8
  process.env.UV_THREADPOOL_SIZE = '128';
  
  console.log('✅ تم تحسين إعدادات Node.js');
}

/**
 * تحسين إعدادات Vite
 */
function optimizeViteConfig() {
  console.log('🔧 تحسين إعدادات Vite...');
  
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // إضافة تحسينات إذا لم تكن موجودة
    if (!viteConfig.includes('optimizeDeps')) {
      const optimizations = `
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@remix-run/react',
      'ollama-ai-provider'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          remix: ['@remix-run/react', '@remix-run/node'],
          ai: ['ollama-ai-provider', 'ai']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  server: {
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: false,
      interval: 100
    }
  },`;
      
      // البحث عن موقع إدراج التحسينات
      const insertPosition = viteConfig.indexOf('export default defineConfig');
      if (insertPosition !== -1) {
        const beforeExport = viteConfig.substring(0, insertPosition);
        const afterExport = viteConfig.substring(insertPosition);
        
        // إدراج التحسينات في التكوين
        viteConfig = viteConfig.replace(
          /export default defineConfig\(\{/,
          `export default defineConfig({${optimizations}`
        );
        
        fs.writeFileSync(viteConfigPath, viteConfig);
        console.log('✅ تم تحسين تكوين Vite');
      }
    } else {
      console.log('✅ تكوين Vite محسن مسبقاً');
    }
  }
}

/**
 * تحسين إعدادات TypeScript
 */
function optimizeTSConfig() {
  console.log('🔧 تحسين إعدادات TypeScript...');
  
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  
  if (fs.existsSync(tsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      
      // إضافة تحسينات الأداء
      if (!tsConfig.compilerOptions.incremental) {
        tsConfig.compilerOptions.incremental = true;
        tsConfig.compilerOptions.tsBuildInfoFile = '.tsbuildinfo';
      }
      
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      console.log('✅ تم تحسين تكوين TypeScript');
    } catch (error) {
      console.error('❌ خطأ في تحسين TypeScript:', error.message);
    }
  }
}

/**
 * تنظيف الملفات المؤقتة
 */
function cleanTempFiles() {
  console.log('🧹 تنظيف الملفات المؤقتة...');
  
  const tempDirs = [
    'node_modules/.cache',
    'build',
    'dist',
    '.tsbuildinfo'
  ];
  
  tempDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      try {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'pipe' });
        console.log(`✅ تم حذف: ${dir}`);
      } catch (error) {
        console.log(`⚠️ لا يمكن حذف: ${dir}`);
      }
    }
  });
}

/**
 * إنشاء ملف تحسين الذاكرة
 */
function createMemoryOptimization() {
  console.log('🧠 إنشاء تحسينات الذاكرة...');
  
  const memoryScript = `#!/bin/bash
# تحسين استخدام الذاكرة للتطبيق

export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=256"
export UV_THREADPOOL_SIZE=128
export MALLOC_ARENA_MAX=2

# تشغيل التطبيق مع التحسينات
exec "$@"
`;
  
  const scriptPath = path.join(__dirname, '..', 'scripts', 'memory-optimized.sh');
  fs.writeFileSync(scriptPath, memoryScript);
  
  try {
    execSync(`chmod +x "${scriptPath}"`);
    console.log('✅ تم إنشاء سكريبت تحسين الذاكرة');
  } catch (error) {
    console.log('⚠️ لا يمكن تعيين أذونات السكريبت');
  }
}

/**
 * الدالة الرئيسية
 */
function main() {
  try {
    optimizeNodeSettings();
    optimizeViteConfig();
    optimizeTSConfig();
    cleanTempFiles();
    createMemoryOptimization();
    
    console.log('🎉 تم إكمال تحسين الأداء بنجاح!');
    console.log('💡 نصائح إضافية:');
    console.log('  - استخدم pnpm بدلاً من npm للحصول على أداء أفضل');
    console.log('  - قم بتشغيل: pnpm run auto-dev للحصول على أفضل تجربة');
    console.log('  - تأكد من وجود ذاكرة كافية (4GB+ مستحسن)');
    
  } catch (error) {
    console.error('❌ خطأ في تحسين الأداء:', error);
    process.exit(1);
  }
}

// تشغيل التحسين
if (require.main === module) {
  main();
}

module.exports = { main, optimizeNodeSettings, optimizeViteConfig };