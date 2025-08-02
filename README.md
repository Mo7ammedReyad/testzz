# Chat Worker - نظام المحادثات

نظام محادثات كامل مبني على Cloudflare Workers باستخدام Hono framework.

## المميزات

# Cloudflare Worker Authentication System

مشروع مصادقة المستخدمين باستخدام Cloudflare Workers و Hono framework

## المميزات
- واجهة مستخدم احترافية باللغة العربية
- نظام تسجيل مستخدمين جديد
- نظام تسجيل دخول آمن
- تشفير كلمات المرور باستخدام bcrypt
- قاعدة بيانات D1 متكاملة
- مسار admin لعرض جميع المستخدمين

## المتطلبات
- حساب Cloudflare
- Wrangler CLI (اختياري - يمكن النشر مباشرة من GitHub)

## الإعداد
1. أنشئ قاعدة بيانات D1 في Cloudflare Dashboard
2. احصل على database_id واستبدله في wrangler.toml
3. ارفع المشروع على GitHub
4. وصل GitHub repository بـ Cloudflare Workers

## المسارات
- `GET /` - صفحة تسجيل الدخول والتسجيل
- `POST /signup` - إنشاء حساب جديد
- `POST /login` - تسجيل الدخول
- `GET /users` - عرض جميع المستخدمين (admin)
- `GET /init-db` - تهيئة قاعدة البيانات

## تهيئة قاعدة البيانات
بعد النشر، قم بزيارة `/init-db` لتهيئة جدول المستخدمين