#!/bin/bash
# تحسين استخدام الذاكرة للتطبيق

export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=256"
export UV_THREADPOOL_SIZE=128
export MALLOC_ARENA_MAX=2

# تشغيل التطبيق مع التحسينات
exec "$@"
