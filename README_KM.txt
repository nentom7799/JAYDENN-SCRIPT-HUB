JAYDENN SCRIPT HUB — SETUP GUIDE (Khmer)
=========================================

អ្វីដែលមានក្នុង ZIP
- index.html / styles.css / app.js: Website UI និងមុខងារ
- assets/jaydenn-branding.jpg: រូប Branding ដែលអ្នកផ្ញើ
- config.js: កន្លែងដាក់ Supabase project URL និង anon key
- supabase.sql: Database + Row Level Security policies
- Website អាចបើកសាកល្បងបានភ្លាមៗក្នុង Preview Mode ដោយមិនចាំបាច់ភ្ជាប់ database។

ជំហានទី 1 — សាកល្បងលើកុំព្យូទ័រ
1. Extract ZIP។
2. បើក folder JAYDENN_SCRIPT_HUB។
3. ប្រើ VS Code និង Live Server extension ដើម្បីបើក index.html។
   (កុំប្រើ file:// សម្រាប់ការសាកល្បង Supabase; ប្រើ local server។)
4. Preview Mode អាច Search, Filter, Copy និងរក្សាទុកការកែប្រែ Admin លើ browser/device នោះប៉ុណ្ណោះ។
   វាមិនមែនជា shared database ហើយកុំប្រើវាជា production admin។

ជំហានទី 2 — បង្កើត Supabase database
1. បង្កើត project នៅ https://supabase.com/ ។
2. ចូល SQL Editor ហើយ Run មាតិកា file supabase.sql។
3. ចូល Authentication > Users ហើយបង្កើត admin user មួយដោយ email/password។
4. ចម្លង UUID របស់ user នោះ។
5. ត្រឡប់ទៅ SQL Editor ហើយដំណើរការ៖
   insert into public.site_admins (user_id) values ('PASTE-ADMIN-UUID-HERE');
6. នៅ Project Settings > API ចម្លង Project URL និង anon/publishable key។
7. បើក config.js ហើយបញ្ចូល៖
   SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
   SUPABASE_ANON_KEY: "YOUR_PUBLIC_ANON_KEY"
8. កុំដាក់ service_role key ឬ secret key នៅក្នុង config.js ឬ GitHub។

ជំហានទី 3 — ដាក់ Website Online តាម Vercel
1. បង្កើត GitHub repository ថ្មី ហើយ upload ឯកសារទាំងអស់ក្នុង folder នេះ។
2. ចូល https://vercel.com/ ហើយជ្រើស Add New > Project។
3. Import GitHub repository។
4. Framework Preset ជ្រើស Other; Build Command និង Output Directory ទុកទទេ/default។
5. ចុច Deploy។ រាល់ពេល update code ហើយ push ទៅ GitHub, Vercel នឹង deploy ថ្មី។

ជំហានទី 4 — សាកល្បងសុវត្ថិភាព
- បើក Website ជា visitor: អាចមើល និង Copy resource បាន។
- សាកល្បង Admin login ដោយ user ដែលបាន allowlist ក្នុង site_admins។
- សាកល្បង login ជា user ធម្មតា (មិនបាន allowlist): insert/update/delete ត្រូវបរាជ័យ។
- កុំបិទ Row Level Security និងកុំបង្កើត policy ដែលអនុញ្ញាតឱ្យ anon សរសេរ។
- កុំបង្ហោះ script ដែលលួច account, steal cookie/token, bypass security, exploit ឬបំពាន Roblox Terms។
- ពិនិត្យ source code របស់ resource នីមួយៗមុន publish។ Website មិនអាចធានាថា code ដែល admin ផ្ទុកឡើងមានសុវត្ថិភាពដោយស្វ័យប្រវត្តិទេ។

ចំណាំសំខាន់
- Supabase anon/publishable key ត្រូវបានរចនាឱ្យប្រើក្នុង browser; សុវត្ថិភាពពឹងផ្អែកលើ RLS policies។
- Service role/secret key មានសិទ្ធិខ្ពស់ ហាមដាក់ក្នុង frontend។
- Visitor count ក្នុង build នេះគឺ local count លើ browser ប៉ុណ្ណោះ មិនមែន global analytics។
- បច្ចុប្បន្នមាន sample placeholders ប៉ុណ្ណោះ មិនមាន exploit script ឬ third-party code។
- មុនបើកប្រើជាសាធារណៈ ត្រូវធ្វើការសាកល្បង deploy និង RLS ជាក់ស្តែង។

ឯកសារយោងផ្លូវការ
Supabase Docs: https://supabase.com/docs
Vercel Docs: https://vercel.com/docs
Roblox Creator Documentation: https://create.roblox.com/docs
