// ================= APPLICATION STATE =================
const STATE = {
  activeDate: new Date(), // Date object currently displayed in the checklist
  todayDate: new Date(),  // Real system date
  authenticated: false,
  passcode: "RUTIN_bakkar-fir.27", // Default static passcode
  selectedMonth: "2026-06", // Default starting month
  db: {}, // Loaded daily records
  journal: {}, // Loaded journal entries {"YYYY-MM-DD": {mood, content, tags}}
  finance: {
    accounts: {
      cash: { name: "Nakit Cüzdan", balance: 1500 },
      bank: { name: "Banka Hesabı", balance: 8450 },
      credit: { name: "Kredi Kartı", balance: -450 },
      business: { name: "Şirket Kartı", balance: 24500 }
    },
    transactions: []
  },
  calendar: [], // Loaded calendar events [{id, title, startTime, endTime, desc}]
  language: 'en' // Default starting language
};

// ================= SPIRITUAL BRIEFINGS =================
const AYAHS = [
  { 
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", 
    tr: '"Şüphesiz güçlükle beraber bir kolaylık vardır."', 
    en: '"For indeed, with hardship [will be] ease."', 
    ar: '"فإن مع العسر يسراً"',
    source_tr: "İnşirâh Suresi, 5. Ayet",
    source_en: "Surah Al-Inshirah, Verse 5",
    source_ar: "سورة الشرح، الآية ٥"
  },
  { 
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", 
    tr: '"Allah, hiç kimseye gücünün üstünde bir yük yüklemez."', 
    en: '"Allah does not charge a soul except [with that within] its capacity."', 
    ar: '"لا يكلف الله نفساً إلا وسعها"',
    source_tr: "Bakara Suresi, 286. Ayet",
    source_en: "Surah Al-Baqarah, Verse 286",
    source_ar: "سورة البقرة، الآية ٢٨٦"
  },
  { 
    arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", 
    tr: '"Rabbin seni terk etmedi ve sana darılmadı."', 
    en: '"Your Lord has not taken leave of you, [O Muhammad], nor has He detested [you]."', 
    ar: '"ما ودعك ربك وما قلى"',
    source_tr: "Duhâ Suresi, 3. Ayet",
    source_en: "Surah Ad-Duha, Verse 3",
    source_ar: "سورة الضحى، الآية ٣"
  },
  { 
    arabic: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", 
    tr: '"İnsan için ancak çalıştığının karşılığı vardır."', 
    en: '"And that there is not for man except that for which he strives."', 
    ar: '"وأن ليس للإنسان إلا ما سعى"',
    source_tr: "Necm Suresi, 39. Ayet",
    source_en: "Surah An-Najm, Verse 39",
    source_ar: "سورة النجم، الآية ٣٩"
  },
  { 
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ", 
    tr: '"Benim başarım ancak Allah\'ın yardımıyladır. Yalnız O\'na tevekkül ettim."', 
    en: '"And my success is not but through Allah. Upon him I have relied."', 
    ar: '"وما توفيقي إلا بالله عليه توكلت"',
    source_tr: "Hûd Suresi, 88. Ayet",
    source_en: "Surah Hud, Verse 88",
    source_ar: "سورة هود، الآية ٨٨"
  },
  { 
    arabic: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", 
    tr: '"Sabret! Çünkü Allah iyilik yapanların mükafatını zayi etmez."', 
    en: '"And be patient, for indeed, Allah does not allow to be lost the reward of those who do good."', 
    ar: '"واصبر فإن الله لا يضيع أجر المحسنين"',
    source_tr: "Hûd Suresi, 115. Ayet",
    source_en: "Surah Hud, Verse 115",
    source_ar: "سورة هود، الآية ١١٥"
  },
  { 
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", 
    tr: '"Bilesiniz ki, kalpler ancak Allah\'ı anmakla huzur bulur."', 
    en: '"Unquestionably, by the remembrance of Allah hearts are assured."', 
    ar: '"ألا بذكر الله تطمئن القلوب"',
    source_tr: "Ra\'d Suresi, 28. Ayet",
    source_en: "Surah Ar-Ra'd, Verse 28",
    source_ar: "سورة الرعد، الآية ٢٨"
  },
  { 
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", 
    tr: '"Eğer şükrederseniz, elbette size (nimetimi) artırırım."', 
    en: '"If you are grateful, I will surely increase you [in favor]."', 
    ar: '"لئن شكرتم لأزيدنكم"',
    source_tr: "İbrâhîm Suresi, 7. Ayet",
    source_en: "Surah Ibrahim, Verse 7",
    source_ar: "سورة إبراهيم، الآية ٧"
  },
  { 
    arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ", 
    tr: '"Bana dua edin, size icabet edeyim."', 
    en: '"Call upon Me; I will respond to you."', 
    ar: '"ادعوني أستجب لكم"',
    source_tr: "Mü\'min Suresi, 60. Ayet",
    source_en: "Surah Ghafir, Verse 60",
    source_ar: "سورة غافر، الآية ٦٠"
  },
  { 
    arabic: "إِنَّ اللَّهَ Mİ‘A-S-SĀBİRĪN", 
    tr: '"Şüphesiz Allah sabredenlerle beraberdir."', 
    en: '"Indeed, Allah is with the patient."', 
    ar: '"إن الله مع الصابرين"',
    source_tr: "Bakara Suresi, 153. Ayet",
    source_en: "Surah Al-Baqarah, Verse 153",
    source_ar: "سورة البقرة، الآية ١٥٣"
  }
];

function getAyahOfTheDay(dateKey) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = dateKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AYAHS.length;
  return AYAHS[idx];
}

const ROUTINE_KEYS = [
  'fajr_sunnah', 'fajr_fard',
  'morning_dhikr',
  'quran_devotion',
  'intellectual_growth',
  'physical_training',
  'nutritional_fuel',
  'horizon_sync',
  'duha_prayer',
  'dhuhr_sunnah1', 'dhuhr_fard', 'dhuhr_sunnah2',
  'asr_sunnah', 'asr_fard',
  'evening_dhikr',
  'maghrib_fard', 'maghrib_sunnah',
  'isha_sunnah1', 'isha_fard', 'isha_sunnah2',
  'witr_prayer',
  'mind_log',
  'fin_flow'
];

const HABIT_DISPLAY_NAMES = {
  fajr_sunnah: "Fajr Sunnah",
  fajr_fard: "Fajr Fard",
  morning_dhikr: "Morning Dhikr",
  quran_devotion: "Quran Devotion",
  intellectual_growth: "Intellectual Reading",
  physical_training: "Workout & Sports",
  nutritional_fuel: "Healthy Breakfast",
  horizon_sync: "Horizon Planning",
  duha_prayer: "Duha Prayer",
  dhuhr_sunnah1: "Dhuhr Pre-Sunnah",
  dhuhr_fard: "Dhuhr Fard",
  dhuhr_sunnah2: "Dhuhr Post-Sunnah",
  asr_sunnah: "Asr Sunnah",
  asr_fard: "Asr Fard",
  evening_dhikr: "Evening Dhikr",
  maghrib_fard: "Maghrib Fard",
  maghrib_sunnah: "Maghrib Sunnah",
  isha_sunnah1: "Isha Pre-Sunnah",
  isha_fard: "Isha Fard",
  isha_sunnah2: "Isha Post-Sunnah",
  witr_prayer: "Witr Prayer",
  mind_log: "Mind Log (Journal)",
  fin_flow: "FinFlow (Expense)"
};

const HABIT_ICONS = {
  fajr_sunnah: "🕌", fajr_fard: "🕌", morning_dhikr: "📿", quran_devotion: "📖",
  intellectual_growth: "📚", physical_training: "🏋️", nutritional_fuel: "🍳", horizon_sync: "🎯",
  duha_prayer: "☀️", dhuhr_sunnah1: "🕌", dhuhr_fard: "🕌", dhuhr_sunnah2: "🕌",
  asr_sunnah: "🕌", asr_fard: "🕌", evening_dhikr: "📿", maghrib_fard: "🕌",
  maghrib_sunnah: "🕌", isha_sunnah1: "🕌", isha_fard: "🕌", isha_sunnah2: "🕌",
  witr_prayer: "🕌", mind_log: "📝", fin_flow: "💰"
};

const TRANSLATIONS = {
  en: {
    nav_brief: "Dashboard",
    nav_routines: "Routines",
    nav_monthly: "Monthly Grid",
    nav_journal: "Mind Log",
    nav_finance: "FinFlow+",
    nav_calendar: "Scheduler",
    nav_analytics: "Analytics",
    nav_settings: "Settings",
    nav_lock: "Lock Dashboard",
    auth_title: "Horizon Tracker",
    auth_sub: "Private Single-User Dashboard",
    auth_label: "Access Passcode",
    auth_unlock: "Unlock Dashboard",
    auth_footer: "© 2026 Firnas Technologies",
    brief_greeting_morning: "Good Morning, Enes!",
    brief_greeting_afternoon: "Good Afternoon, Enes!",
    brief_greeting_evening: "Good Evening, Enes!",
    brief_greeting_night: "Good Night, Enes!",
    brief_sub_morning: "Today is a great day to achieve new goals and grow.",
    brief_sub_afternoon: "Keep pushing hard towards your goals this afternoon.",
    brief_sub_evening: "Remember to refresh your mind while unwinding.",
    brief_sub_night: "A good sleep is the best preparation for tomorrow's success.",
    brief_ayah_title: "Daily Verse of Focus",
    brief_ayah_subtitle: "Spiritual guidance to start your morning",
    brief_yesterday_score: "Yesterday's Routine",
    brief_yesterday_spend: "Yesterday's Spending",
    brief_today_events: "Today's Events",
    brief_weather: "Weather",
    brief_video_title: "Recommended Focus Video",
    brief_video_subtitle: "Motivational support to start the day",
    journal_title: "Mind Log & Observations",
    journal_history: "Mind Log History",
    journal_new: "+ New",
    journal_date: "Date",
    journal_mood: "Your Mood Today",
    mood_awesome: "Awesome",
    mood_good: "Good",
    mood_neutral: "Neutral",
    mood_tired: "Tired",
    mood_bad: "Bad",
    journal_summary: "Daily Summary & Mental State",
    journal_placeholder: "What did you achieve today? What challenges did you face? Any thoughts occupying your mind?...",
    journal_tags: "Tags (comma separated)",
    journal_save: "Save & Synchronize",
    journal_delete: "Delete",
    journal_empty: "No entries yet. Write your first log!",
    finance_title: "FinFlow+ Hub",
    finance_subtitle: "Track personal and business transactions",
    finance_total_balance: "Total Net Balance",
    finance_monthly_income: "Monthly Inflow",
    finance_monthly_expense: "Monthly Outflow",
    finance_new_tx: "Log Transaction",
    finance_tx_type: "Type",
    finance_tx_income: "Income",
    finance_tx_expense: "Expense",
    finance_tx_transfer: "Transfer",
    finance_account: "Account",
    finance_target_account: "Target Account",
    finance_category: "Category",
    finance_amount: "Amount (TL)",
    finance_desc: "Description",
    finance_save: "Log Transaction",
    fin_adjust_save: "Save Balance",
    finance_accounts_title: "Account Summary",
    finance_category_title: "Monthly Expense Breakdown",
    finance_history_title: "Recent Transactions",
    finance_table_date: "Date",
    finance_table_desc: "Description",
    finance_table_cat: "Category",
    finance_table_acc: "Account",
    finance_table_amt: "Amount",
    finance_empty: "No financial transactions recorded yet.",
    calendar_title: "Google Calendar & Agenda",
    calendar_subtitle: "View daily program and add new events.",
    calendar_connect: "Connect Google Calendar",
    calendar_connected: "Google Calendar Connected ✓",
    calendar_active_day: "Today",
    calendar_add_title: "Plan New Event",
    calendar_event_title: "Event Title",
    calendar_start_time: "Start Time",
    calendar_end_time: "End Time",
    calendar_notes: "Notes / Location",
    calendar_add_btn: "Add to Timeline",
    settings_title: "Application Settings",
    settings_subtitle: "Configure language and database credentials",
    language_label: "Application Language",
    supabase_title: "Supabase Cloud Sync",
    supabase_subtitle: "Connect a Supabase project to automatically sync and backup your routines",
    supabase_url: "Supabase Project URL",
    supabase_key: "Supabase Anon Key",
    supabase_db_guide: "Database Setup Guide",
    supabase_db_query: "Run this query in your Supabase SQL Editor to create the table:",
    supabase_save: "Save & Sync Now",
    supabase_disconnect: "Disconnect Cloud Sync",
    
    // Extended keys
    focus_current_streak: "Current Streak",
    focus_personal_best: "Personal Best",
    focus_day_navigator: "Day Navigator",
    focus_today: "Today",
    focus_completed: "Completed",
    grid_title: "Monthly Log Grid",
    grid_subtitle: "Click a day to load its routine checklist details.",
    grid_col_date: "Date",
    grid_col_score: "Score",
    weekday_mon: "Mon",
    weekday_tue: "Tue",
    weekday_wed: "Wed",
    weekday_thu: "Thu",
    weekday_fri: "Fri",
    weekday_sat: "Sat",
    weekday_sun: "Sun",
    analytics_title: "Performance Analytics",
    analytics_subtitle: "Historical progress data, trend chart, and habit consistency.",
    analytics_kpi_avg: "Avg Daily Score",
    analytics_kpi_perfect: "Perfect Days (100%)",
    analytics_kpi_top: "Most Consistent",
    analytics_kpi_focus: "Needs Consistency",
    analytics_chart_title: "Daily Score Trend",
    analytics_chart_legend: "Score % over active month days",
    analytics_ranks_title: "Habit-by-Habit Consistency",
    analytics_ranks_legend: "Frequency of completion this month",
    analytics_heatmap_title: "Annual Discipline Calendar",
    analytics_heatmap_legend: "Consistency heatmap over the past 365 days. Click any day to jump to its checklist.",
    analytics_heatmap_less: "Less",
    analytics_heatmap_more: "More",
    analytics_sync_title: "Cloud Sync & Database Backup",
    analytics_sync_subtitle: "Connect a Supabase project to automatically sync and backup your routines",
    supabase_connect_btn: "Connect & Sync",
    journal_tags_placeholder: "e.g. work, gym, devotion, family",
    journal_no_tags: "No tags",
    finance_health_status: "Financial Health: Stable",
    finance_inflow_desc: "▲ Active Inflows",
    finance_outflow_desc: "▼ Spending",
    finance_desc_placeholder: "Enter transaction details...",
    calendar_timeline_title: "Daily Agenda Flow",
    calendar_event_placeholder: "Meeting, class, workout...",
    calendar_notes_placeholder: "Enter description or location...",
    habit_fajr_sunnah_title: "Fajr 2 Rakah Sunnah",
    habit_fajr_sunnah_desc: "Dawn Optional Devotion",
    habit_fajr_fard_title: "Fajr 2 Rakah Fard",
    habit_fajr_fard_desc: "Dawn Obligation",
    habit_morning_dhikr_title: "Morning Dhikr",
    habit_morning_dhikr_desc: "Morning Remembrance",
    habit_quran_devotion_title: "Quran Devotion",
    habit_quran_devotion_desc: "Daily Wird / Tilavet",
    habit_intellectual_growth_title: "Intellectual Growth",
    habit_intellectual_growth_desc: "Book Reading",
    habit_physical_training_title: "Physical Training",
    habit_physical_training_desc: "Workout / Sport",
    habit_nutritional_fuel_title: "Nutritional Fuel",
    habit_nutritional_fuel_desc: "Healthy Breakfast",
    habit_horizon_sync_title: "Horizon Sync",
    habit_horizon_sync_desc: "Daily Planning & Vision Alignment",
    habit_duha_prayer_title: "Duha Prayer",
    habit_duha_prayer_desc: "Forenoon Prayer",
    habit_evening_dhikr_title: "Evening Dhikr",
    habit_evening_dhikr_desc: "Evening Remembrance",
    habit_maghrib_fard_title: "Maghrib 3 Rakah Fard",
    habit_maghrib_fard_desc: "Sunset Obligation",
    habit_maghrib_sunnah_title: "Maghrib 2 Rakah Sunnah",
    habit_maghrib_sunnah_desc: "Post-Sunset Devotion",
    habit_isha_sunnah1_title: "Isha 4 Rakah Sunnah",
    habit_isha_sunnah1_desc: "Pre-Obligation Devotion",
    habit_isha_fard_title: "Isha 4 Rakah Fard",
    habit_isha_fard_desc: "Night Obligation",
    habit_isha_sunnah2_title: "Isha 2 Rakah Sunnah",
    habit_isha_sunnah2_desc: "Post-Obligation Devotion",
    habit_witr_prayer_title: "Witr 3 Rakah Prayer",
    habit_witr_prayer_desc: "Hanefi Wajib",
    habit_dhuhr_sunnah1_title: "Dhuhr 4 Rakah Sunnah",
    habit_dhuhr_sunnah1_desc: "Pre-Obligation Devotion",
    habit_dhuhr_fard_title: "Dhuhr 4 Rakah Fard",
    habit_dhuhr_fard_desc: "Noon Obligation",
    habit_dhuhr_sunnah2_title: "Dhuhr 2 Rakah Sunnah",
    habit_dhuhr_sunnah2_desc: "Post-Obligation Devotion",
    habit_asr_sunnah_title: "Asr 4 Rakah Sunnah",
    habit_asr_sunnah_desc: "Hanefi Sunnah",
    habit_asr_fard_title: "Asr 4 Rakah Fard",
    habit_asr_fard_desc: "Afternoon Obligation",
    habit_mind_log_title: "Mind Log",
    habit_mind_log_desc: "Daily Journaling Complete",
    habit_fin_flow_title: "FinFlow",
    habit_fin_flow_desc: "Daily Expenses Logged",
    block_morning_title: "Morning Core",
    block_morning_desc: "Dawn to Forenoon",
    block_midday_title: "Midday & Afternoon",
    block_midday_desc: "Noon to Sunset",
    block_dusk_title: "Dusk & Evening",
    block_dusk_desc: "Sunset to Night",
    block_night_title: "Night Closeout",
    block_night_desc: "Before Sleep",
    alert_same_accounts: "Source and target accounts cannot be the same!",
    alert_google_load_fail: "Google API library could not be loaded. Please check your internet connection and refresh the page.",
    alert_google_auth_error: "Google auth error: ",
    alert_google_sync_success: "Google Calendar connected successfully! Synchronizing your data.",
    confirm_disconnect: "Disconnect Supabase Sync? Your data will remain stored locally.",
    cat_food: "🍔 Food & Groceries",
    cat_transport: "🚗 Transport & Fuel",
    cat_tech: "💻 Software & Devices",
    cat_bills: "⚡ Bills & Subscriptions",
    cat_invest: "📈 Investments",
    cat_edu: "📚 Books & Education",
    cat_income: "💰 Work/Project Income",
    cat_other: "📦 Other",
    acc_cash: "Cash Wallet",
    acc_bank: "Bank Account",
    acc_credit: "Credit Card",
    acc_business: "Business Card",
    inspire_perfect: "🏆 Perfect Day! Outstanding job keeping the horizon clear!",
    inspire_almost: "🔥 Almost there! Just a few more routines to hit 100%!",
    inspire_solid: "⚡ Solid progress. Keep pushing through the day!",
    inspire_small: "🚀 Small steps build momentum. Complete another routine!",
    inspire_welcome: "✨ Welcome! Start your day by checking off your first routine.",
    brief_video_item_title: "Resolve and Willpower - Rebuilding Yourself",
    brief_video_item_desc: "Contains advice on maintaining spiritual and mental discipline throughout the day.",
    brief_weather_desc: "Istanbul - Clear & Sunny",
    kpi_top_none: "None yet",
    kpi_focus_none: "None yet",
    brief_today_events_label: "Events",
    fin_subtab_daily: "Daily",
    fin_subtab_calendar: "Calendar",
    fin_subtab_summary: "Summary",
    fin_subtab_accounts: "Accounts",
    fin_net_balance: "Net Balance",
    fin_add_income: "Income",
    fin_add_expense: "Expense",
    fin_add_transfer: "Transfer",
    fin_category_group: "Category",
    fin_select_category: "Select Category",
    fin_amount_label: "Amount",
    fin_date_label: "Date",
    fin_desc_label: "Description / Note",
    fin_source_account: "From Account",
    fin_target_account: "To Account",
    fin_adjust_balance: "Adjust Balance",
    fin_adjust_balance_title: "Enter new balance for {account}:",
    fin_delete_tx_confirm: "Are you sure you want to delete this transaction?"
  },
  tr: {
    nav_brief: "Ana Panel",
    nav_routines: "Rutinler",
    nav_monthly: "Aylık Takip",
    nav_journal: "Günlük Yaz",
    nav_finance: "FinFlow+",
    nav_calendar: "Takvim",
    nav_analytics: "Analiz",
    nav_settings: "Ayarlar",
    nav_lock: "Paneli Kilitle",
    auth_title: "Horizon Tracker",
    auth_sub: "Özel Tek Kullanıcılı Panel",
    auth_label: "Erişim Şifresi",
    auth_unlock: "Giriş Yap",
    auth_footer: "© 2026 Firnas Technologies",
    brief_greeting_morning: "Hayırlı Sabahlar, Enes!",
    brief_greeting_afternoon: "Günün Enerjisi, Enes!",
    brief_greeting_evening: "Hayırlı Akşamlar, Enes!",
    brief_greeting_night: "Huzurlu Geceler, Enes!",
    brief_sub_morning: "Bugün yeni hedeflere ulaşmak ve gelişmek için harika bir gün.",
    brief_sub_afternoon: "Öğleden sonra hedeflerine tam gaz odaklanmaya devam et.",
    brief_sub_evening: "Günün yorgunluğunu atarken zihnini tazelemeyi unutma.",
    brief_sub_night: "Güzel bir uyku, yarının başarısı için en büyük hazırlıktır.",
    brief_ayah_title: "Günün Zihinsel Odak Ayeti",
    brief_ayah_subtitle: "Sabaha başlarken manevi rehberlik",
    brief_yesterday_score: "Dünkü Rutin",
    brief_yesterday_spend: "Dünkü Harcama",
    brief_today_events: "Bugünkü Program",
    brief_weather: "Hava Durumu",
    brief_video_title: "Önerilen Zihinsel Odak Videosu",
    brief_video_subtitle: "Güne başlarken motivasyonel destek",
    journal_title: "Zihinsel Günlük & Gözlem",
    journal_history: "Geçmiş Günlükler",
    journal_new: "+ Yeni",
    journal_date: "Tarih",
    journal_mood: "Bugünkü Ruh Halin",
    mood_awesome: "Mükemmel",
    mood_good: "İyi",
    mood_neutral: "Normal",
    mood_tired: "Yorgun",
    mood_bad: "Kötü",
    journal_summary: "Günün Özeti & Zihinsel Durumun",
    journal_placeholder: "Bugün neler başardın? Karşılaştığın zorluklar nelerdi? Zihnini meşgul eden düşünceler var mı?...",
    journal_tags: "Etiketler (Virgülle ayırın)",
    journal_save: "Kaydet & Senkronize Et",
    journal_delete: "Sil",
    journal_empty: "Henüz kayıt yok. İlk günlükünü yaz!",
    finance_title: "FinFlow+ Paneli",
    finance_subtitle: "Kişisel ve şirket harcamalarını takip et",
    finance_total_balance: "Toplam Net Bakiye",
    finance_monthly_income: "Aylık Gelir",
    finance_monthly_expense: "Aylık Gider",
    finance_new_tx: "İşlem Kaydet",
    finance_tx_type: "Tür",
    finance_tx_income: "Gelir",
    finance_tx_expense: "Gider",
    finance_tx_transfer: "Havale/Transfer",
    finance_account: "Hesap",
    finance_target_account: "Hedef Hesap",
    finance_category: "Kategori",
    finance_amount: "Tutar (TL)",
    finance_desc: "Açıklama",
    finance_save: "İşlemi Kaydet",
    fin_adjust_save: "Bakiyeyi Kaydet",
    finance_accounts_title: "Hesap Özetleri",
    finance_category_title: "Aylık Gider Dağılımı",
    finance_history_title: "Son İşlemler",
    finance_table_date: "Tarih",
    finance_table_desc: "Açıklama",
    finance_table_cat: "Kategori",
    finance_table_acc: "Hesap",
    finance_table_amt: "Tutar",
    finance_empty: "Henüz finansal kayıt bulunmuyor.",
    calendar_title: "Google Calendar & Ajanda",
    calendar_subtitle: "Günlük programını gör ve yeni etkinlikler ekle.",
    calendar_connect: "Google Hesabını Bağla",
    calendar_connected: "Google Takvim Bağlandı ✓",
    calendar_active_day: "Bugün",
    calendar_add_title: "Yeni Etkinlik Planla",
    calendar_event_title: "Etkinlik Başlığı",
    calendar_start_time: "Başlangıç Saati",
    calendar_end_time: "Bitiş Saati",
    calendar_notes: "Notlar / Konum",
    calendar_add_btn: "Takvime Ekle",
    settings_title: "Uygulama Ayarları",
    settings_subtitle: "Dil ve veri tabanı yedekleme ayarları",
    language_label: "Uygulama Dili",
    supabase_title: "Supabase Bulut Eşitleme",
    supabase_subtitle: "Rutinleri yedeklemek için bir Supabase projesi bağlayın",
    supabase_url: "Supabase Proje URL",
    supabase_key: "Supabase Anon Key",
    supabase_db_guide: "Veritabanı Kurulum Kılavuzu",
    supabase_db_query: "Tabloyu oluşturmak için Supabase SQL Editöründe bu sorguyu çalıştırın:",
    supabase_save: "Kaydet ve Eşitle",
    supabase_disconnect: "Bulut Bağlantısını Kes",
    
    // Extended keys
    focus_current_streak: "Mevcut Seri",
    focus_personal_best: "En İyi Seri",
    focus_day_navigator: "Gün Gezgini",
    focus_today: "Bugün",
    focus_completed: "Tamamlandı",
    grid_title: "Aylık Takip Tablosu",
    grid_subtitle: "Detayları yüklemek için bir güne tıklayın.",
    grid_col_date: "Tarih",
    grid_col_score: "Skor",
    weekday_mon: "Pzt",
    weekday_tue: "Sal",
    weekday_wed: "Çar",
    weekday_thu: "Per",
    weekday_fri: "Cum",
    weekday_sat: "Cmt",
    weekday_sun: "Paz",
    analytics_title: "Performans Analizi",
    analytics_subtitle: "Geçmiş ilerleme verileri, eğilim grafiği ve alışkanlık kararlılığı.",
    analytics_kpi_avg: "Ort. Günlük Skor",
    analytics_kpi_perfect: "Kusursuz Günler (%100)",
    analytics_kpi_top: "En Kararlı",
    analytics_kpi_focus: "Odaklanılması Gereken",
    analytics_chart_title: "Günlük Skor Eğilimi",
    analytics_chart_legend: "Aktif ay günleri bazında skor %",
    analytics_ranks_title: "Alışkanlık Bazında Kararlılık",
    analytics_ranks_legend: "Bu ayki tamamlanma sıklığı",
    analytics_heatmap_title: "Yıllık Disiplin Takvimi",
    analytics_heatmap_legend: "Son 365 gündeki kararlılık ısı haritası. Detaylar için bir güne tıklayın.",
    analytics_heatmap_less: "Az",
    analytics_heatmap_more: "Çok",
    analytics_sync_title: "Bulut Eşitleme & Veritabanı Yedekleme",
    analytics_sync_subtitle: "Rutinleri yedeklemek için bir Supabase projesi bağlayın",
    supabase_connect_btn: "Bağlan ve Eşitle",
    journal_tags_placeholder: "örn: iş, spor, ibadet, aile",
    journal_no_tags: "Etiket yok",
    finance_health_status: "Finansal Sağlık Durumu: Stabil",
    finance_inflow_desc: "▲ Aktif Kazançlar",
    finance_outflow_desc: "▼ Giderler",
    finance_desc_placeholder: "İşlem açıklaması yazın...",
    calendar_timeline_title: "Günlük Program Akışı",
    calendar_event_placeholder: "Toplantı, ders, buluşma...",
    calendar_notes_placeholder: "Açıklama veya yer girin...",
    habit_fajr_sunnah_title: "Sabah 2 Rekat Sünnet",
    habit_fajr_sunnah_desc: "Farz Öncesi İsteğe Bağlı İbadet",
    habit_fajr_fard_title: "Sabah 2 Rekat Farz",
    habit_fajr_fard_desc: "Sabah Namazı Farzı",
    habit_morning_dhikr_title: "Sabah Evradı / Zikir",
    habit_morning_dhikr_desc: "Güne Başlarken Hatırlama",
    habit_quran_devotion_title: "Kur'an Okuma",
    habit_quran_devotion_desc: "Günlük Vird / Tilavet",
    habit_intellectual_growth_title: "Entelektüel Okuma",
    habit_intellectual_growth_desc: "Kitap Okuma",
    habit_physical_training_title: "Spor ve Egzersiz",
    habit_physical_training_desc: "Antrenman / Yürüyüş",
    habit_nutritional_fuel_title: "Besleyici Kahvaltı",
    habit_nutritional_fuel_desc: "Sağlıklı Öğün",
    habit_horizon_sync_title: "Ufuk Eşitlemesi",
    habit_horizon_sync_desc: "Günlük Planlama & Hedef Hizalama",
    habit_duha_prayer_title: "Duha / Kuşluk Namazı",
    habit_duha_prayer_desc: "Kuşluk Vakti İbadeti",
    habit_evening_dhikr_title: "Akşam Evradı / Zikir",
    habit_evening_dhikr_desc: "Günü Kapatırken Hatırlama",
    habit_maghrib_fard_title: "Akşam 3 Rekat Farz",
    habit_maghrib_fard_desc: "Gün Batımı Farzı",
    habit_maghrib_sunnah_title: "Akşam 2 Rekat Sünnet",
    habit_maghrib_sunnah_desc: "Farz Sonrası Sünnet",
    habit_isha_sunnah1_title: "Yatsı İlk Sünnet",
    habit_isha_sunnah1_desc: "Farz Öncesi İbadet",
    habit_isha_fard_title: "Yatsı 4 Rekat Farz",
    habit_isha_fard_desc: "Yatsı Namazı Farzı",
    habit_isha_sunnah2_title: "Yatsı Son Sünnet",
    habit_isha_sunnah2_desc: "Farz Sonrası İbadet",
    habit_witr_prayer_title: "Vitir Namazı",
    habit_witr_prayer_desc: "Hanefi Vacib İbadet",
    habit_dhuhr_sunnah1_title: "Öğle İlk Sünnet",
    habit_dhuhr_sunnah1_desc: "Farz Öncesi İbadet",
    habit_dhuhr_fard_title: "Öğle 4 Rekat Farz",
    habit_dhuhr_fard_desc: "Öğle Namazı Farzı",
    habit_dhuhr_sunnah2_title: "Öğle Son Sünnet",
    habit_dhuhr_sunnah2_desc: "Farz Sonrası İbadet",
    habit_asr_sunnah_title: "İkindi Sünneti",
    habit_asr_sunnah_desc: "Gayri Müekked Sünnet",
    habit_asr_fard_title: "İkindi 4 Rekat Farz",
    habit_asr_fard_desc: "İkindi Namazı Farzı",
    habit_mind_log_title: "Günlük Yazımı",
    habit_mind_log_desc: "Zihinsel Günlük Tamamlandı",
    habit_fin_flow_title: "FinFlow Eşitlemesi",
    habit_fin_flow_desc: "Günlük Harcamalar Kaydedildi",
    block_morning_title: "Sabah Rutinleri",
    block_morning_desc: "Şafaktan Kuşluk Vaktine",
    block_midday_title: "Öğle ve Öğleden Sonra",
    block_midday_desc: "Öğleden Akşama",
    block_dusk_title: "Akşam ve Yatsı",
    block_dusk_desc: "Gün Batımından Geceye",
    block_night_title: "Günü Kapatış",
    block_night_desc: "Uykudan Önce",
    alert_same_accounts: "Kaynak ve hedef hesaplar aynı olamaz!",
    alert_google_load_fail: "Google API kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.",
    alert_google_auth_error: "Google yetkilendirme hatası: ",
    alert_google_sync_success: "Google Takvim başarıyla bağlandı! Verileriniz senkronize ediliyor.",
    confirm_disconnect: "Bulut bağlantısını kesmek istiyor musunuz? Verileriniz yerel olarak saklanmaya devam edecektir.",
    cat_food: "🍔 Gıda & Market",
    cat_transport: "🚗 Ulaşım & Yakıt",
    cat_tech: "💻 Yazılım & Cihazlar",
    cat_bills: "⚡ Faturalar & Abonelikler",
    cat_invest: "📈 Yatırımlar",
    cat_edu: "📚 Kitap & Eğitim",
    cat_income: "💰 İş/Proje Geliri",
    cat_other: "📦 Diğer",
    acc_cash: "Nakit Cüzdan",
    acc_bank: "Banka Hesabı",
    acc_credit: "Kredi Kartı",
    acc_business: "Şirket Kartı",
    inspire_perfect: "🏆 Kusursuz Gün! Ufku temiz tutma konusunda harika bir iş çıkardın!",
    inspire_almost: "🔥 Neredeyse bitti! %100'e ulaşmak için sadece birkaç rutin kaldı!",
    inspire_solid: "⚡ Sağlam ilerleme. Gün boyu devam et!",
    inspire_small: "🚀 Küçük adımlar ivme kazandırır. Bir rutin daha tamamla!",
    inspire_welcome: "✨ Hoş geldin! İlk rutinini işaretleyerek güne başla.",
    brief_video_item_title: "Kararlılık ve İrade Gücü - Kendini Yeniden İnşa Et",
    brief_video_item_desc: "Manevi ve zihinsel disiplini gün boyunca sürdürmek üzerine tavsiyeler içerir.",
    brief_weather_desc: "İstanbul - Açık & Güneşli",
    kpi_top_none: "Henüz Yok",
    kpi_focus_none: "Henüz Yok",
    brief_today_events_label: "Etkinlik",
    fin_subtab_daily: "Günlük",
    fin_subtab_calendar: "Takvim",
    fin_subtab_summary: "İstatistik",
    fin_subtab_accounts: "Hesaplar",
    fin_net_balance: "Net Bakiye",
    fin_add_income: "Gelir",
    fin_add_expense: "Gider",
    fin_add_transfer: "Transfer",
    fin_category_group: "Kategori",
    fin_select_category: "Kategori Seçin",
    fin_amount_label: "Tutar",
    fin_date_label: "Tarih",
    fin_desc_label: "Açıklama / Not",
    fin_source_account: "Kaynak Hesap",
    fin_target_account: "Hedef Hesap",
    fin_adjust_balance: "Bakiyeyi Düzenle",
    fin_adjust_balance_title: "{account} hesabı için yeni bakiye girin:",
    fin_delete_tx_confirm: "Bu işlemi silmek istediğinize emin misiniz?"
  },
  ar: {
    nav_brief: "اللوحة الرئيسية",
    nav_routines: "العادات اليومية",
    nav_monthly: "المتابعة الشهرية",
    nav_journal: "كتابة اليوميات",
    nav_finance: "الميزانية +FinFlow",
    nav_calendar: "التقويم",
    nav_analytics: "التحليلات",
    nav_settings: "الإعدادات",
    nav_lock: "قفل لوحة التحكم",
    auth_title: "تعقب هورايزون",
    auth_sub: "لوحة تحكم خاصة بمستخدم واحد",
    auth_label: "رمز الدخول",
    auth_unlock: "فتح اللوحة",
    auth_footer: "© ٢٠٢٦ شركة فيرناس للتقنيات",
    brief_greeting_morning: "صباح الخير، أنس!",
    brief_greeting_afternoon: "يوم سعيد، أنس!",
    brief_greeting_evening: "مساء الخير، أنس!",
    brief_greeting_night: "تصبح على خير، أنس!",
    brief_sub_morning: "اليوم يوم رائع لتحقيق أهداف جديدة والنمو الشخصي.",
    brief_sub_afternoon: "استمر في التركيز بقوة على أهدافك بعد الظهر.",
    brief_sub_evening: "تذكر تصفية ذهنك والاسترخاء في المساء.",
    brief_sub_night: "النوم الجيد هو أفضل استعداد لنجاح الغد.",
    brief_ayah_title: "آية التركيز اليومية",
    brief_ayah_subtitle: "الهداية الروحية لبداية الصباح",
    brief_yesterday_score: "التزام الأمس",
    brief_yesterday_spend: "مصاريف الأمس",
    brief_today_events: "جدول اليوم",
    brief_weather: "الطقس",
    brief_video_title: "فيديو التركيز المقترح",
    brief_video_subtitle: "الدعم التحفيزي لبداية اليوم",
    journal_title: "اليوميات وتأملات العقل",
    journal_history: "سجل اليوميات السابق",
    journal_new: "+ جديد",
    journal_date: "التاريخ",
    journal_mood: "مزاجك اليوم",
    journal_summary: "ملخص اليوم والحالة الذهنية",
    journal_placeholder: "ماذا حققت اليوم؟ ما هي التحديات التي واجهتها؟ هل هناك أفكار تشغل بالك؟...",
    journal_tags: "الوسوم (مفصولة بفاصلة)",
    journal_save: "حفظ ومزامنة",
    journal_delete: "حذف",
    journal_empty: "لا توجد مذكرات بعد. اكتب مذكرتك الأولى!",
    finance_title: "لوحة الميزانية +FinFlow",
    finance_subtitle: "تتبع المعاملات الشخصية والتجارية",
    finance_total_balance: "صافي الرصيد الإجمالي",
    finance_monthly_income: "الدخل الشهري",
    finance_monthly_expense: "المصاريف الشهرية",
    finance_new_tx: "تسجيل معاملة مالية",
    finance_tx_type: "النوع",
    finance_tx_income: "دخل",
    finance_tx_expense: "مصروف",
    finance_tx_transfer: "تحويل مالي",
    finance_account: "الحساب",
    finance_target_account: "الحساب المستهدف",
    finance_category: "الفئة",
    finance_amount: "المبلغ (ليرة)",
    finance_desc: "الوصف",
    finance_save: "حفظ المعاملة",
    fin_adjust_save: "حفظ الرصيد",
    finance_accounts_title: "ملخص الحسابات",
    finance_category_title: "توزيع المصاريف الشهرية",
    finance_history_title: "المعاملات الأخيرة",
    finance_table_date: "التاريخ",
    finance_table_desc: "الوصف",
    finance_table_cat: "الفئة",
    finance_table_acc: "الحساب",
    finance_table_amt: "المبلغ",
    finance_empty: "لا توجد سجلات مالية بعد.",
    calendar_title: "تقويم جوجل والمذكرة",
    calendar_subtitle: "عرض جدول اليوم وإضافة مواعيد جديدة.",
    calendar_connect: "ربط حساب جوجل",
    calendar_connected: "تم ربط تقويم جوجل بنجاح ✓",
    calendar_active_day: "اليوم",
    calendar_add_title: "جدولة موعد جديد",
    calendar_event_title: "عنوان الموعد",
    calendar_start_time: "وقت البدء",
    calendar_end_time: "وقت الانتهاء",
    calendar_notes: "ملاحظات / الموقع",
    calendar_add_btn: "إضافة إلى الجدول",
    settings_title: "إعدادات التطبيق",
    settings_subtitle: "إعدادات اللغة والنسخ الاحتياطي لقاعدة البيانات",
    language_label: "لغة التطبيق",
    supabase_title: "مزامنة سوبابيس السحابية",
    supabase_subtitle: "اربط مشروع سوبابيس لمزامنة وحفظ عاداتك تلقائياً",
    supabase_url: "رابط مشروع سوبابيس (URL)",
    supabase_key: "مفتاح سوبابيس (Anon Key)",
    supabase_db_guide: "دليل إعداد قاعدة البيانات",
    supabase_db_query: "قم بتشغيل هذا الاستعلام في محرر SQL في سوبابيس لإنشاء الجدول:",
    supabase_save: "حفظ ومزامنة الآن",
    supabase_disconnect: "فصل الاتصال السحابي",
    
    // Extended keys
    focus_current_streak: "السلسلة الحالية",
    focus_personal_best: "أفضل سلسلة تاريخية",
    focus_day_navigator: "مستكشف الأيام",
    focus_today: "اليوم",
    focus_completed: "مكتمل",
    grid_title: "لوحة المتابعة الشهرية",
    grid_subtitle: "انقر فوق اليوم لعرض تفاصيل العادات اليومية.",
    grid_col_date: "التاريخ",
    grid_col_score: "الالتزام",
    weekday_mon: "الإثنين",
    weekday_tue: "الثلاثاء",
    weekday_wed: "الأربعاء",
    weekday_thu: "الخميس",
    weekday_fri: "الجمعة",
    weekday_sat: "السبت",
    weekday_sun: "الأحد",
    analytics_title: "تحليلات الأداء",
    analytics_subtitle: "بيانات التقدم التاريخية، مخطط الاتجاه، وثبات العادات اليومية.",
    analytics_kpi_avg: "متوسط ​​الالتزام اليومي",
    analytics_kpi_perfect: "الأيام المثالية (١٠٠٪)",
    analytics_kpi_top: "الأكثر التزاماً",
    analytics_kpi_focus: "بحاجة إلى تركيز",
    analytics_chart_title: "اتجاه الالتزام اليومي",
    analytics_chart_legend: "نسبة الالتزام على مدار أيام الشهر",
    analytics_ranks_title: "ثبات العادات بالتفصيل",
    analytics_ranks_legend: "تكرار إنجاز العادات هذا الشهر",
    analytics_heatmap_title: "تقويم الانضباط السنوي",
    analytics_heatmap_legend: "خريطة الانضباط الحرارية لآخر ٣٦٥ يومًا. انقر على أي يوم للانتقال إلى قائمته.",
    analytics_heatmap_less: "أقل",
    analytics_heatmap_more: "أكثر",
    analytics_sync_title: "المزامنة السحابية والنسخ الاحتياطي",
    analytics_sync_subtitle: "اربط مشروع سوبابيس لمزامنة وحفظ عاداتك تلقائياً وبأمان",
    supabase_connect_btn: "اتصال ومزامنة",
    journal_tags_placeholder: "مثال: العمل، النادي، العبادة، العائلة",
    journal_no_tags: "لا توجد وسوم",
    finance_health_status: "الحالة المالية: مستقرة",
    finance_inflow_desc: "▲ التدفقات النشطة",
    finance_outflow_desc: "▼ المصروفات",
    finance_desc_placeholder: "أدخل تفاصيل المعاملة المذكورة...",
    calendar_timeline_title: "جدول المواعيد اليومي",
    calendar_event_placeholder: "اجتماع، درس، تمرين رياضي...",
    calendar_notes_placeholder: "أدخل تفاصيل أو موقع الموعد...",
    habit_fajr_sunnah_title: "سنة الفجر ركعتين",
    habit_fajr_sunnah_desc: "صلاة نافلة قبل الفريضة",
    habit_fajr_fard_title: "فرض الفجر ركعتين",
    habit_fajr_fard_desc: "فريضة الصبح",
    habit_morning_dhikr_title: "أذكار الصباح",
    habit_morning_dhikr_desc: "أوراد الصباح والذكر",
    habit_quran_devotion_title: "ورد القرآن الكريم",
    habit_quran_devotion_desc: "تلاوة وتدبر يومي",
    habit_intellectual_growth_title: "القراءة والتعلم",
    habit_intellectual_growth_desc: "قراءة كتاب / نمو معرفي",
    habit_physical_training_title: "الرياضة والنشاط البدني",
    habit_physical_training_desc: "تمارين رياضية / لياقة",
    habit_nutritional_fuel_title: "وجبة فطور صحية",
    habit_nutritional_fuel_desc: "تغذية متوازنة لبدء اليوم",
    habit_horizon_sync_title: "تزامن الأهداف والتخطيط",
    habit_horizon_sync_desc: "تخطيط يومي ومواءمة الرؤية",
    habit_duha_prayer_title: "صلاة الضحى",
    habit_duha_prayer_desc: "ركعتي الضحى المباركة",
    habit_evening_dhikr_title: "أذكار المساء",
    habit_evening_dhikr_desc: "أوراد المساء والذكر",
    habit_maghrib_fard_title: "فرض المغرب ٣ ركعات",
    habit_maghrib_fard_desc: "صلاة المغرب عند الغروب",
    habit_maghrib_sunnah_title: "سنة المغرب ركعتين",
    habit_maghrib_sunnah_desc: "صلاة سنة بعد فريضة المغرب",
    habit_isha_sunnah1_title: "سنة العشاء القبلية",
    habit_isha_sunnah1_desc: "أربع ركعات سنة قبل الفرض",
    habit_isha_fard_title: "فرض العشاء ٤ ركعات",
    habit_isha_fard_desc: "فريضة صلاة العشاء",
    habit_isha_sunnah2_title: "سنة العشاء البعدية",
    habit_isha_sunnah2_desc: "ركعتين سنة بعد فريضة العشاء",
    habit_witr_prayer_title: "صلاة الوتر",
    habit_witr_prayer_desc: "ثلاث ركعات وتر واجبة",
    habit_dhuhr_sunnah1_title: "سنة الظهر القبلية",
    habit_dhuhr_sunnah1_desc: "أربع ركعات سنة قبل الفرض",
    habit_dhuhr_fard_title: "فرض الظهر ٤ ركعات",
    habit_dhuhr_fard_desc: "فريضة صلاة الظهر",
    habit_dhuhr_sunnah2_title: "سنة الظهر البعدية",
    habit_dhuhr_sunnah2_desc: "ركعتين سنة بعد فريضة الظهر",
    habit_asr_sunnah_title: "سنة العصر",
    habit_asr_sunnah_desc: "أربع ركعات سنة غير مؤكدة",
    habit_asr_fard_title: "فرض العصر ٤ ركعات",
    habit_asr_fard_desc: "فريضة صلاة العصر",
    habit_mind_log_title: "كتابة اليوميات",
    habit_mind_log_desc: "إكمال التدوين اليومي",
    habit_fin_flow_title: "تعقب الميزانية",
    habit_fin_flow_desc: "تسجيل النفقات اليومية كاملة",
    block_morning_title: "الروتين الصباحي",
    block_morning_desc: "من الفجر حتى الضحى",
    block_midday_title: "فترة الظهر والمساء",
    block_midday_desc: "من صلاة الظهر حتى الغروب",
    block_dusk_title: "الروتين المسائي",
    block_dusk_desc: "من الغروب حتى الليل",
    block_night_title: "ختام اليوم",
    block_night_desc: "قبل الذهاب للنوم",
    alert_same_accounts: "لا يمكن أن يكون حساب المصدر وحساب الهدف متطابقين!",
    alert_google_load_fail: "تعذر تحميل مكتبة Google API. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.",
    alert_google_auth_error: "خطأ في مصادقة جوجل: ",
    alert_google_sync_success: "تم ربط تقويم جوجل بنجاح! يتم الآن مزامنة بياناتك.",
    confirm_disconnect: "هل أنت متأكد من رغبتك في فصل المزامنة السحابية؟ ستبقى بياناتك محفوظة محلياً.",
    cat_food: "🍔 الغذاء والبقالة",
    cat_transport: "🚗 النقل والوقود",
    cat_tech: "💻 البرمجيات والأجهزة",
    cat_bills: "⚡ الفواتير والاشتراكات",
    cat_invest: "📈 الاستثمارات",
    cat_edu: "📚 الكتب والتعليم",
    cat_income: "💰 دخل العمل/المشروع",
    cat_other: "📦 أخرى",
    acc_cash: "المحفظة النقدية",
    acc_bank: "الحساب البنكي",
    acc_credit: "بطاقة الائتمان",
    acc_business: "بطاقة الشركة",
    inspire_perfect: "🏆 يوم مثالي! عمل رائع في الحفاظ على أهدافك واضحة!",
    inspire_almost: "🔥 شارفنا على الانتهاء! فقط القليل من العادات للوصول إلى 100٪!",
    inspire_solid: "⚡ تقدم ملموس. استمر في السعي طوال اليوم!",
    inspire_small: "🚀 الخطوات الصغيرة تبني الزخم. أكمل عادة أخرى!",
    inspire_welcome: "✨ مرحبًا بك! ابدأ يومك بتحديد أول عادة لك.",
    brief_video_item_title: "العزيمة وقوة الإرادة - إعادة بناء الذات",
    brief_video_item_desc: "يحتوي على نصائح للحفاظ على الانضباط الروحي والذهني طوال اليوم.",
    brief_weather_desc: "اسطنبول - مشمس وصافٍ",
    kpi_top_none: "لا يوجد بعد",
    kpi_focus_none: "لا يوجد بعد",
    brief_today_events_label: "فعاليات",
    fin_subtab_daily: "يومي",
    fin_subtab_calendar: "التقويم",
    fin_subtab_summary: "إحصائيات",
    fin_subtab_accounts: "الحسابات",
    fin_net_balance: "صافي الرصيد",
    fin_add_income: "دخل",
    fin_add_expense: "مصروف",
    fin_add_transfer: "تحويل",
    fin_category_group: "الفئة",
    fin_select_category: "اختر الفئة",
    fin_amount_label: "المبلغ",
    fin_date_label: "التاريخ",
    fin_desc_label: "الوصف / ملاحظة",
    fin_source_account: "من حساب",
    fin_target_account: "إلى حساب",
    fin_adjust_balance: "تعديل الرصيد",
    fin_adjust_balance_title: "أدخل الرصيد الجديد لحساب {account}:",
    fin_delete_tx_confirm: "هل أنت متأكد من رغبتك في حذف هذه المعاملة؟"
  }
};

// Helper to format Date objects to YYYY-MM-DD
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Setup virtual keypad handler with desktop physical keyboard filtering
function setupKeypad(inputEl, keypadEl, onOkCallback) {
  if (!inputEl || !keypadEl) return;

  const buttons = keypadEl.querySelectorAll('.key-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-val');
      let currentVal = inputEl.value;

      if (val === 'clear') {
        inputEl.value = '';
      } else if (val === 'backspace') {
        inputEl.value = currentVal.slice(0, -1);
      } else if (val === '00') {
        if (currentVal !== '' && currentVal !== '-') {
          inputEl.value = currentVal + '00';
        }
      } else if (val === '.') {
        if (currentVal === '' || currentVal === '-') {
          inputEl.value = currentVal + '0.';
        } else if (!currentVal.includes('.')) {
          inputEl.value = currentVal + '.';
        }
      } else if (val === '-') {
        if (currentVal.startsWith('-')) {
          inputEl.value = currentVal.slice(1);
        } else {
          inputEl.value = '-' + currentVal;
        }
      } else if (val === 'ok') {
        if (onOkCallback) onOkCallback();
      } else {
        if (currentVal === '0') {
          inputEl.value = val;
        } else if (currentVal === '-0') {
          inputEl.value = '-' + val;
        } else {
          inputEl.value = currentVal + val;
        }
      }
      
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.focus();
    });
  });

  inputEl.addEventListener('keydown', (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape', 'Enter'];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onOkCallback) onOkCallback();
      }
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      return;
    }

    if (e.key === '-') {
      e.preventDefault();
      let currentVal = inputEl.value;
      if (currentVal.startsWith('-')) {
        inputEl.value = currentVal.slice(1);
      } else {
        inputEl.value = '-' + currentVal;
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    if (e.key === '.') {
      if (inputEl.value.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();
  });
}

const FINANCE_CATEGORIES = {
  expense: [
    { id: "cat_food", val: "Gıda", emoji: "🍔", color: "#f59e0b" },
    { id: "cat_cafe", val: "Kafe", emoji: "☕", color: "#b45309" },
    { id: "cat_transport", val: "Ulaşım", emoji: "🚗", color: "#3b82f6" },
    { id: "cat_tech", val: "Teknoloji", emoji: "💻", color: "#06b6d4" },
    { id: "cat_bills", val: "Faturalar", emoji: "⚡", color: "#ef4444" },
    { id: "cat_invest", val: "Yatırım", emoji: "📈", color: "#eab308" },
    { id: "cat_edu", val: "Eğitim", emoji: "📚", color: "#f97316" },
    { id: "cat_shopping", val: "Alışveriş", emoji: "🛒", color: "#ec4899" },
    { id: "cat_housing", val: "Konut", emoji: "🏠", color: "#10b981" },
    { id: "cat_health", val: "Sağlık", emoji: "⚕️", color: "#06b6d4" },
    { id: "cat_entertainment", val: "Eğlence", emoji: "🎬", color: "#8b5cf6" },
    { id: "cat_other", val: "Diğer", emoji: "📦", color: "#6b7280" }
  ],
  income: [
    { id: "cat_income", val: "Gelir", emoji: "💰", color: "#10b981" },
    { id: "cat_salary", val: "Maaş", emoji: "💼", color: "#10b981" },
    { id: "cat_invest", val: "Yatırım", emoji: "📈", color: "#eab308" },
    { id: "cat_freelance", val: "Ek Gelir", emoji: "💻", color: "#06b6d4" },
    { id: "cat_gift", val: "Hediye", emoji: "🎁", color: "#ec4899" },
    { id: "cat_other", val: "Diğer", emoji: "💰", color: "#6b7280" }
  ]
};

const catInfo = (category, type) => {
  const list = FINANCE_CATEGORIES[type === 'income' ? 'income' : 'expense'] || [];
  const found = list.find(c => c.val === category);
  if (found) return found;
  const fallback = [...FINANCE_CATEGORIES.expense, ...FINANCE_CATEGORIES.income].find(c => c.val === category);
  return fallback || { val: category, emoji: "📦", color: "#6b7280" };
};

// ================= STORAGE ADAPTER =================
const StorageManager = {
  loadDatabase() {
    const data = localStorage.getItem('hrt_db');
    STATE.db = data ? JSON.parse(data) : {};
  },

  saveDatabase() {
    localStorage.setItem('hrt_db', JSON.stringify(STATE.db));
  },

  loadJournal() {
    const data = localStorage.getItem('hrt_journal');
    STATE.journal = data ? JSON.parse(data) : {};
  },

  saveJournal() {
    localStorage.setItem('hrt_journal', JSON.stringify(STATE.journal));
  },

  loadFinance() {
    const data = localStorage.getItem('hrt_finance');
    if (data) {
      STATE.finance = JSON.parse(data);
    } else {
      STATE.finance = {
        accounts: {
          cash: { name: "Nakit Cüzdan", balance: 1500 },
          bank: { name: "Banka Hesabı", balance: 8450 },
          credit: { name: "Kredi Kartı", balance: -450 },
          business: { name: "Şirket Kartı", balance: 24500 }
        },
        transactions: []
      };
      this.saveFinance();
    }
  },

  saveFinance() {
    localStorage.setItem('hrt_finance', JSON.stringify(STATE.finance));
  },

  loadCalendar() {
    const data = localStorage.getItem('hrt_calendar');
    if (data) {
      try {
        let events = JSON.parse(data);
        if (Array.isArray(events)) {
          // Filter out any legacy events that lack a 'date' property
          const filtered = events.filter(evt => evt && evt.date);
          if (filtered.length !== events.length) {
            STATE.calendar = filtered;
            this.saveCalendar();
          } else {
            STATE.calendar = events;
          }
        } else {
          STATE.calendar = [];
        }
      } catch (e) {
        STATE.calendar = [];
      }
    } else {
      const todayKey = formatDateKey(new Date());
      STATE.calendar = [
        { id: "cal-1", title: "Firnas Team Sync 🚀", startTime: "09:30", endTime: "10:30", desc: "Daily coordination & tech reviews", date: todayKey, isLocal: true },
        { id: "cal-2", title: "Project Review Meeting 🎯", startTime: "13:00", endTime: "14:15", desc: "Briefing new updates on Life OS", date: todayKey, isLocal: true },
        { id: "cal-3", title: "Gym Session 🏋️", startTime: "18:00", endTime: "19:30", desc: "Chest day & cardio workout", date: todayKey, isLocal: true }
      ];
      this.saveCalendar();
    }
  },

  saveCalendar() {
    localStorage.setItem('hrt_calendar', JSON.stringify(STATE.calendar));
  },

  getDayState(dateKey) {
    if (!STATE.db[dateKey]) {
      STATE.db[dateKey] = {
        fajr_sunnah: false,
        fajr_fard: false,
        morning_dhikr: false,
        quran_devotion: false,
        intellectual_growth: false,
        physical_training: false,
        nutritional_fuel: false,
        horizon_sync: false,
        duha_prayer: false,
        dhuhr_sunnah1: false,
        dhuhr_fard: false,
        dhuhr_sunnah2: false,
        asr_sunnah: false,
        asr_fard: false,
        evening_dhikr: false,
        maghrib_fard: false,
        maghrib_sunnah: false,
        isha_sunnah1: false,
        isha_fard: false,
        isha_sunnah2: false,
        witr_prayer: false,
        mind_log: false,
        fin_flow: false
      };
    }
    
    // Safety check: ensure all 23 properties exist in loaded object
    const dayData = STATE.db[dateKey];
    ROUTINE_KEYS.forEach(key => {
      if (dayData[key] === undefined) {
        dayData[key] = false;
      }
    });
    
    return dayData;
  },

  saveDayState(dateKey, dayData) {
    STATE.db[dateKey] = dayData;
    this.saveDatabase();
    if (SupabaseManager.isEnabled()) {
      SupabaseManager.upsert(dateKey, dayData);
    }
  },

  getPersonalBest() {
    return parseInt(localStorage.getItem('hrt_best_streak') || '0', 10);
  },

  savePersonalBest(val) {
    localStorage.setItem('hrt_best_streak', val.toString());
  }
};

// ================= DUAL CALENDAR ENGINE =================
const CalendarEngine = {
  getGregorianString(date) {
    const localeMap = {
      en: 'en-US',
      tr: 'tr-TR',
      ar: 'ar-EG'
    };
    const locale = localeMap[STATE.language] || 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  hijriMonths: {
    en: [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"
    ],
    tr: [
      "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir",
      "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban",
      "Ramazan", "Şevval", "Zilkade", "Zilhicce"
    ],
    ar: [
      "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
      "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
      "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ]
  },

  getHijriParts(date) {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(date);
      const day = parseInt(parts.find(p => p.type === 'day').value, 10);
      const month = parseInt(parts.find(p => p.type === 'month').value, 10);
      const year = parseInt(parts.find(p => p.type === 'year').value, 10);
      return { day, month, year };
    } catch (e) {
      return null;
    }
  },

  getHijriString(date) {
    const parts = this.getHijriParts(date);
    if (!parts) return 'Hijri Calendar Error';
    
    const lang = STATE.language || 'en';
    const monthList = this.hijriMonths[lang] || this.hijriMonths.en;
    const monthName = monthList[parts.month - 1] || monthList[0];
    
    if (lang === 'en') {
      return `${monthName} ${parts.day}, ${parts.year} AH`;
    } else if (lang === 'tr') {
      return `${parts.day} ${monthName} ${parts.year} H`;
    } else if (lang === 'ar') {
      return `${parts.day} ${monthName} ${parts.year} هـ`;
    }
    return `${monthName} ${parts.day}, ${parts.year} AH`;
  },

  getHijriStringShort(date) {
    const parts = this.getHijriParts(date);
    if (!parts) return '';
    
    const lang = STATE.language || 'en';
    const monthList = this.hijriMonths[lang] || this.hijriMonths.en;
    const monthName = monthList[parts.month - 1] || monthList[0];
    
    return `${parts.day} ${monthName}`;
  },

  getDaysInMonth(year, month) {
    const dates = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }
};

// ================= STREAK & COMPLETION ENGINE =================
const StreakEngine = {
  calculateDailyPercentage(dayData) {
    let checkedCount = 0;
    ROUTINE_KEYS.forEach(key => {
      if (dayData[key] === true) {
        checkedCount++;
      }
    });
    return Math.round((checkedCount / ROUTINE_KEYS.length) * 100);
  },

  isPerfectDay(dayData) {
    return this.calculateDailyPercentage(dayData) === 100;
  },

  computeStreaks() {
    StorageManager.loadDatabase();
    
    const startCycle = new Date(2026, 5, 1); // June 1, 2026
    const today = new Date(STATE.todayDate.getFullYear(), STATE.todayDate.getMonth(), STATE.todayDate.getDate());
    
    let tempDate = new Date(startCycle);
    const dayScores = {};
    
    while (tempDate <= today) {
      const key = formatDateKey(tempDate);
      const dayData = STATE.db[key];
      dayScores[key] = dayData ? this.isPerfectDay(dayData) : false;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // 1. Calculate All-time Personal Best
    let maxStreak = 0;
    let currentRun = 0;
    
    tempDate = new Date(startCycle);
    while (tempDate <= today) {
      const key = formatDateKey(tempDate);
      if (dayScores[key] === true) {
        currentRun++;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else {
        currentRun = 0;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    const savedBest = StorageManager.getPersonalBest();
    if (maxStreak > savedBest) {
      StorageManager.savePersonalBest(maxStreak);
    } else {
      maxStreak = savedBest;
    }

    // 2. Calculate Current Streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    const todayKey = formatDateKey(today);
    
    if (dayScores[todayKey] === true) {
      currentStreak = 0;
      while (checkDate >= startCycle) {
        const key = formatDateKey(checkDate);
        if (dayScores[key] === true) {
          currentStreak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);
      
      if (dayScores[yesterdayKey] === true) {
        currentStreak = 0;
        checkDate = yesterday;
        while (checkDate >= startCycle) {
          const key = formatDateKey(checkDate);
          if (dayScores[key] === true) {
            currentStreak++;
          } else {
            break;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        currentStreak = 0;
      }
    }

    return {
      current: currentStreak,
      best: maxStreak
    };
  }
};

  // ================= SUPABASE CLOUD SYNC MANAGER =================
  const SupabaseManager = {
    url: "https://yhyxvhbknyuurppahznm.supabase.co",
    key: "sb_publishable_I1wY5Tc0FEVxSElsAipCJg_7xwJgb9P",

    init() {
      this.url = localStorage.getItem('supabase_url') || "https://yhyxvhbknyuurppahznm.supabase.co";
      this.key = localStorage.getItem('supabase_key') || "sb_publishable_I1wY5Tc0FEVxSElsAipCJg_7xwJgb9P";
    },

    isEnabled() {
      return this.url !== "" && this.key !== "";
    },

    getHeaders() {
      return {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json'
      };
    },

    // Perform background upsert of a single record
    async upsert(dateKey, dayData) {
      if (!this.isEnabled()) return;
      try {
        const url = `${this.url}/rest/v1/routines?date=eq.${dateKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            date: dateKey,
            data: dayData,
            updated_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Sync error: ${response.status} ${response.statusText}`);
        }
        console.log(`Cloud sync success for: ${dateKey}`);
      } catch (e) {
        console.error("Supabase background upload failed:", e);
      }
    },

    // Initial fetch on app start, merging with local data
    async fetchInitialSync() {
      if (!this.isEnabled()) return;
      try {
        const url = `${this.url}/rest/v1/routines`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`
          }
        });

        if (!response.ok) {
          throw new Error(`Fetch error: ${response.statusText}`);
        }

        const rows = await response.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            if (row.date && row.data) {
              STATE.db[row.date] = row.data;
            }
          });
          StorageManager.saveDatabase(); // Save cache
          console.log(`Supabase Sync: Successfully loaded ${rows.length} routines.`);
        }
      } catch (e) {
        console.error("Supabase initial sync fetch failed:", e);
      }
    },

    // Save new credentials, verifying them with a test fetch
    async saveCredentials(url, key) {
      try {
        const cleanUrl = url.trim().replace(/\/$/, "");
        const cleanKey = key.trim();
        const testUrl = `${cleanUrl}/rest/v1/routines?limit=1`;
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': cleanKey,
            'Authorization': `Bearer ${cleanKey}`
          }
        });

        if (!response.ok) {
          throw new Error("Invalid URL or Key, or routines table not found.");
        }

        // Valid: save to local storage
        localStorage.setItem('supabase_url', cleanUrl);
        localStorage.setItem('supabase_key', cleanKey);
        this.url = cleanUrl;
        this.key = cleanKey;

        // Immediately run full sync
        await this.fetchInitialSync();
        return true;
      } catch (e) {
        console.error("Supabase verification failed:", e);
        throw e;
      }
    },

    // Clear credentials
    clearCredentials() {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_key');
      this.url = "";
      this.key = "";
      console.log("Supabase sync disconnected.");
    }
  };

// ================= WEB AUDIO API SYNTHESIS =================
const AudioFeedback = {
  ctx: null,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Failed to resume AudioContext:", e));
    }
  },

  playClick(isCheck = true) {
    try {
      this.init();
      if (!this.ctx) return;

      const play = () => {
        const now = this.ctx.currentTime;
        const baseFreq = isCheck ? 1700 : 1300; // 1700Hz for checks, 1300Hz for unchecks
        const stepFreq = isCheck ? 2100 : 1600;

        // Spark Note 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);
        gain1.gain.setValueAtTime(0.04, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.02);

        // Spark Note 2 (spaced by 15ms for a crisp physical double-switch tick)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(stepFreq, now + 0.015);
        gain2.gain.setValueAtTime(0.03, now + 0.015);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.015);
        osc2.stop(now + 0.035);
      };

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(play);
      } else {
        play();
      }
    } catch (e) {
      console.warn("Audio synthesis failed:", e);
    }
  },

  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;

      // Uplifting arpeggio glissando chime
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now + idx * 0.07);
        
        gain.gain.setValueAtTime(0, now + idx * 0.07);
        // Louder chords: volume increased to 0.22
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } catch (e) {
      console.warn("Audio synthesis failed:", e);
    }
  }
};



// ================= UI CONTROLLER =================
const UIController = {
  dom: {
    authPortal: document.getElementById('auth-portal'),
    authForm: document.getElementById('auth-form'),
    passcode: document.getElementById('passcode'),
    togglePassword: document.getElementById('toggle-password'),
    authError: document.getElementById('auth-error'),
    appContainer: document.getElementById('app-container'),
    
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),
    gregorianDate: document.getElementById('gregorian-date-display'),
    hijriDate: document.getElementById('hijri-date-display'),
    
    progressCircle: document.getElementById('progress-circle'),
    progressPercent: document.getElementById('progress-percent-text'),
    
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    taskCheckboxes: document.querySelectorAll('.task-checkbox'),
    
    notionTableBody: document.getElementById('notion-table-body'),
    
    // Performance Analytics DOM nodes
    kpiAvgScore: document.getElementById('kpi-avg-score'),
    kpiPerfectDays: document.getElementById('kpi-perfect-days'),
    kpiTopHabit: document.getElementById('kpi-top-habit'),
    kpiFocusHabit: document.getElementById('kpi-focus-habit'),
    trendChartContainer: document.getElementById('trend-chart-container'),
    analyticsHabitList: document.getElementById('analytics-habit-list'),

    // Inline cloud sync elements
    inlineSyncForm: document.getElementById('inline-sync-settings-form'),
    inlineSupabaseUrl: document.getElementById('inline-supabase-url'),
    inlineSupabaseKey: document.getElementById('inline-supabase-key'),
    inlineClearSyncBtn: document.getElementById('inline-clear-sync-btn'),
    inlineSyncStatus: document.getElementById('inline-sync-status'),

    // Journal DOM elements
    journalForm: document.getElementById('journal-form'),
    journalDateInput: document.getElementById('journal-date-input'),
    journalContentInput: document.getElementById('journal-content-input'),
    journalTagsInput: document.getElementById('journal-tags-input'),
    journalHistoryList: document.getElementById('journal-history-list'),
    journalDeleteBtn: document.getElementById('journal-delete-btn'),
    journalNewBtn: document.getElementById('journal-new-btn'),
    journalActiveDateDisplay: document.getElementById('journal-active-date-display'),

    // Finance DOM elements
    financeForm: document.getElementById('finance-transaction-form'),
    finAmountInput: document.getElementById('fin-amount-input'),
    finCategorySelect: document.getElementById('fin-category-select'),
    finAccountSelect: document.getElementById('fin-account-select'),
    finTargetAccountSelect: document.getElementById('fin-target-account-select'),
    finTransactionsList: document.getElementById('fin-transactions-list'),
    finCategoryBreakdown: document.getElementById('fin-category-breakdown'),
    finTotalBalance: document.getElementById('fin-total-balance'),
    finMonthlyIncome: document.getElementById('fin-monthly-income'),
    finMonthlyExpense: document.getElementById('fin-monthly-expense'),
    finAdjustModal: document.getElementById('fin-adjust-modal'),
    finAdjustAmountInput: document.getElementById('fin-adjust-amount-input'),
    financeAdjustForm: document.getElementById('finance-adjust-form'),
    finAdjustCancelBtn: document.getElementById('fin-adjust-cancel-btn'),
    finAdjustModalClose: document.getElementById('fin-adjust-modal-close'),
    finAdjustModalTitle: document.getElementById('fin-adjust-modal-title'),

    // Calendar DOM elements
    calendarEventForm: document.getElementById('calendar-event-form'),
    eventTitle: document.getElementById('event-title'),
    eventStartTime: document.getElementById('event-start-time'),
    eventEndTime: document.getElementById('event-end-time'),
    eventDesc: document.getElementById('event-desc'),
    calendarTimelineEvents: document.getElementById('calendar-timeline-events')
  },



  triggerProgressCelebration() {
    // Add pulsing glow to the navigator card widget
    const progressWidget = document.querySelector('.daily-navigator-card');
    if (progressWidget) {
      progressWidget.classList.add('perfect-pulse');
      setTimeout(() => {
        progressWidget.classList.remove('perfect-pulse');
      }, 4500);
    }
  },

  setupLanguage() {
    const cachedLang = localStorage.getItem('hrt_lang') || 'en';
    STATE.language = cachedLang;
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      langSelect.value = cachedLang;
      langSelect.addEventListener('change', () => {
        this.setLanguage(langSelect.value);
      });
    }
    this.setLanguage(cachedLang);
  },

  setLanguage(lang) {
    STATE.language = lang;
    localStorage.setItem('hrt_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    if (STATE.authenticated) {
      this.updateStreakDisplay();
      this.loadDateData();
      this.renderNotionGrid();
      this.renderAnalytics();
      this.renderHeatmap();
      this.renderBrief();
      this.renderJournal();
      this.renderFinance();
      this.renderCalendar();
      this.setupMonthSelector();
    }
  },

  init() {
    this.setupLanguage();
    SupabaseManager.init(); // Initialize credentials
    this.setupAuthentication();
    this.setupNavigation();
    this.setupDateNavigator();
    this.setupChecklist();
    this.setupMonthSelector();
    this.setupSyncSettings(); // Setup Supabase modal & inline controls
    
    // Setup Life OS Subsystems
    this.setupBriefTab();
    this.setupJournalTab();
    this.setupFinanceTab();
    this.setupCalendarTab();
    
    // Unlock Web Audio API on first user gesture (highly recommended for iOS & WebKit autoplay bypass)
    const unlockAudio = () => {
      AudioFeedback.init();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    // Auto-sync check on tab focus (for multi-device real-time updates)
    window.addEventListener('focus', () => {
      if (STATE.authenticated && SupabaseManager.isEnabled()) {
        console.log("Tab focused: Fetching updates from Supabase...");
        SupabaseManager.fetchInitialSync().then(() => {
          this.updateStreakDisplay();
          this.loadDateData();
          this.renderNotionGrid();
          this.renderAnalytics();
          this.renderHeatmap(); // Refresh heatmap grid
          this.renderBrief();
        });
      }
    });

    setInterval(() => {
      const now = new Date();
      if (now.getDate() !== STATE.todayDate.getDate()) {
        STATE.todayDate = now;
        this.updateStreakDisplay();
        this.renderNotionGrid();
        this.renderAnalytics();
        this.renderBrief();
      }
    }, 60000);
  },

  // --- Authentication ---
  setupAuthentication() {
    if (localStorage.getItem('hrt_authenticated') === 'true') {
      STATE.authenticated = true;
      this.dom.authPortal.classList.add('hidden');
      this.dom.appContainer.classList.remove('hidden');
      this.loadDashboard();
    }

    this.dom.togglePassword.addEventListener('click', () => {
      const type = this.dom.passcode.getAttribute('type') === 'password' ? 'text' : 'password';
      this.dom.passcode.setAttribute('type', type);
      const svg = this.dom.togglePassword.querySelector('svg');
      if (type === 'text') {
        svg.style.color = 'var(--primary-light)';
      } else {
        svg.style.color = 'var(--text-muted)';
      }
    });

    this.dom.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = this.dom.passcode.value;
      if (entered === STATE.passcode) {
        STATE.authenticated = true;
        localStorage.setItem('hrt_authenticated', 'true');
        this.dom.authError.textContent = "";
        this.dom.authPortal.classList.add('hidden');
        this.dom.appContainer.classList.remove('hidden');
        this.loadDashboard();
      } else {
        this.dom.authError.textContent = "Incorrect Passcode. Access Denied.";
        this.dom.passcode.value = "";
        this.dom.passcode.focus();
      }
    });

    // Support both sidebar and mobile header logout triggers
    document.querySelectorAll('.logout-btn').forEach(btn => {
      // Skip sync settings buttons which also have the class logout-btn
      if (btn.classList.contains('sync-settings-btn')) return;
      btn.addEventListener('click', () => {
        STATE.authenticated = false;
        localStorage.removeItem('hrt_authenticated');
        this.dom.appContainer.classList.add('hidden');
        this.dom.authPortal.classList.remove('hidden');
        this.dom.passcode.value = "";
      });
    });
  },

  loadDashboard() {
    StorageManager.loadDatabase();
    StorageManager.loadJournal();
    StorageManager.loadFinance();
    StorageManager.loadCalendar();
    this.updateStreakDisplay();
    this.loadDateData();
    this.renderNotionGrid();
    this.renderAnalytics();
    this.renderHeatmap(); // Render yearly heatmap grid
    this.renderBrief();

    // Trigger background sync if Supabase is active
    if (SupabaseManager.isEnabled()) {
      SupabaseManager.fetchInitialSync().then(() => {
        // Re-render views with freshly pulled records
        this.updateStreakDisplay();
        this.loadDateData();
        this.renderNotionGrid();
        this.renderAnalytics();
        this.renderHeatmap(); // Re-render heatmap after sync
        this.renderBrief();
      });
    }
  },

  updateStreakDisplay() {
    const streaks = StreakEngine.computeStreaks();
    
    // Update mobile headers
    const currentStreakEl = document.getElementById('current-streak');
    const bestStreakEl = document.getElementById('best-streak');
    if (currentStreakEl) currentStreakEl.textContent = streaks.current;
    if (bestStreakEl) bestStreakEl.textContent = streaks.best;

    // Update PC Sidebars
    const sideCurrent = document.getElementById('sidebar-current-streak');
    const sideBest = document.getElementById('sidebar-best-streak');
    if (sideCurrent) sideCurrent.textContent = streaks.current;
    if (sideBest) sideBest.textContent = streaks.best;
  },

  // --- Multi-Tab Navigation Sync ---
  setupNavigation() {
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Remove active class from all tab buttons (both mobile and sidebar)
        this.dom.tabBtns.forEach(b => b.classList.remove('active'));
        
        // Mark all matching buttons active
        document.querySelectorAll(`.tab-btn[data-tab="${targetTab}"]`).forEach(b => b.classList.add('active'));
        
        // Switch tab content views
        this.dom.tabPanes.forEach(pane => {
          if (pane.id === targetTab) {
            pane.classList.add('active-pane');
          } else {
            pane.classList.remove('active-pane');
          }
        });

        if (targetTab === 'brief-tab') {
          this.renderBrief();
        } else if (targetTab === 'grid-tab') {
          this.renderNotionGrid();
        } else if (targetTab === 'analytics-tab') {
          this.renderAnalytics();
        } else if (targetTab === 'journal-tab') {
          this.renderJournal();
        } else if (targetTab === 'finance-tab') {
          this.renderFinance();
        } else if (targetTab === 'calendar-tab') {
          this.renderCalendar();
          // Sync Google Calendar whenever the tab is opened (if connected)
          const token = localStorage.getItem('google_access_token');
          if (token && !this._isSyncingCalendar) {
            this._isSyncingCalendar = true;
            this.syncGoogleCalendar(token).finally(() => {
              this._isSyncingCalendar = false;
            });
          }
        }
      });
    });
  },

  // --- Date Navigator ---
  setupDateNavigator() {
    this.dom.prevDayBtn.addEventListener('click', () => {
      STATE.activeDate.setDate(STATE.activeDate.getDate() - 1);
      this.loadDateData();
    });

    this.dom.nextDayBtn.addEventListener('click', () => {
      STATE.activeDate.setDate(STATE.activeDate.getDate() + 1);
      this.loadDateData();
    });

    this.dom.todayBtn.addEventListener('click', () => {
      STATE.activeDate = new Date(STATE.todayDate);
      this.loadDateData();
    });
  },

  loadDateData() {
    const key = formatDateKey(STATE.activeDate);
    
    this.dom.gregorianDate.textContent = CalendarEngine.getGregorianString(STATE.activeDate);
    this.dom.hijriDate.textContent = CalendarEngine.getHijriString(STATE.activeDate);
    
    const dayData = StorageManager.getDayState(key);
    
    this.dom.taskCheckboxes.forEach(cb => {
      const dbKey = cb.getAttribute('data-key');
      cb.checked = !!dayData[dbKey];
    });

    this.updateProgressRing(dayData);
    this.highlightActiveGridRow(key);
    this.highlightActiveHeatmapCell(key); // Highlight selected day square
  },

  updateProgressRing(dayData) {
    const percentage = StreakEngine.calculateDailyPercentage(dayData);
    this.dom.progressPercent.textContent = `${percentage}%`;
    
    // Center point radius r=64. Circumference = 2 * PI * r = 402.12
    const r = 64;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percentage / 100) * circ;
    
    this.dom.progressCircle.style.strokeDasharray = `${circ} ${circ}`;
    this.dom.progressCircle.style.strokeDashoffset = offset;
    
    if (percentage === 100) {
      this.dom.progressCircle.style.stroke = "var(--primary-light)";
    } else if (percentage >= 50) {
      this.dom.progressCircle.style.stroke = "var(--success)";
    } else {
      this.dom.progressCircle.style.stroke = "var(--danger)";
    }

    // Dynamic Inspirational Message
    const inspirationalEl = document.getElementById('daily-status-inspirational');
    if (inspirationalEl) {
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      if (percentage === 100) {
        inspirationalEl.textContent = dict.inspire_perfect;
        inspirationalEl.style.borderLeftColor = "var(--primary-light)";
      } else if (percentage >= 70) {
        inspirationalEl.textContent = dict.inspire_almost;
        inspirationalEl.style.borderLeftColor = "var(--success)";
      } else if (percentage >= 40) {
        inspirationalEl.textContent = dict.inspire_solid;
        inspirationalEl.style.borderLeftColor = "var(--accent-gold)";
      } else if (percentage > 0) {
        inspirationalEl.textContent = dict.inspire_small;
        inspirationalEl.style.borderLeftColor = "var(--danger)";
      } else {
        inspirationalEl.textContent = dict.inspire_welcome;
        inspirationalEl.style.borderLeftColor = "var(--text-muted)";
      }
    }
  },

  // --- Checklist ---
  setupChecklist() {
    this.dom.taskCheckboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const key = formatDateKey(STATE.activeDate);
        const dayData = StorageManager.getDayState(key);
        const dbKey = cb.getAttribute('data-key');
        
        dayData[dbKey] = cb.checked;
        StorageManager.saveDayState(key, dayData);
        
        this.updateStreakDisplay();
        this.updateProgressRing(dayData);

        // Tactile audio feedback on checkbox check/uncheck
        AudioFeedback.playClick(cb.checked);

        // Check if day is fully completed to trigger success chime and pulse celebration
        if (cb.checked) {
          const percentage = StreakEngine.calculateDailyPercentage(dayData);
          if (percentage === 100) {
            AudioFeedback.playSuccess();
            this.triggerProgressCelebration();
          }
        }
        
        // Live sync other panels
        this.renderNotionGrid();
        this.renderAnalytics();
        this.renderHeatmap(); // Re-render yearly heatmap grid
      });
    });
  },

  // --- Synced Month Selectors ---
  setupMonthSelector() {
    const selectors = document.querySelectorAll('.month-sync-select');
    
    selectors.forEach(select => {
      const prevVal = select.value || STATE.selectedMonth;
      select.innerHTML = "";
      
      const startYear = 2026;
      const startMonth = 5; // June (0-indexed is 5)
      const currentLimit = new Date(STATE.todayDate);
      currentLimit.setMonth(currentLimit.getMonth() + 12);
      
      const temp = new Date(startYear, startMonth, 1);
      
      const localeMap = {
        en: 'en-US',
        tr: 'tr-TR',
        ar: 'ar-EG'
      };
      const locale = localeMap[STATE.language] || 'en-US';
      
      while (temp <= currentLimit) {
        const year = temp.getFullYear();
        const monthNum = temp.getMonth();
        const monthStr = String(monthNum + 1).padStart(2, '0');
        
        const option = document.createElement('option');
        option.value = `${year}-${monthStr}`;
        option.textContent = temp.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
        
        select.appendChild(option);
        temp.setMonth(temp.getMonth() + 1);
      }
      
      if (prevVal) {
        select.value = prevVal;
      }
    });
    
    if (!this._monthSelectorListenerBound) {
      this._monthSelectorListenerBound = true;
      selectors.forEach(select => {
        select.addEventListener('change', (e) => {
          STATE.selectedMonth = e.target.value;
          
          // Sync values across all selectors
          selectors.forEach(other => {
            other.value = STATE.selectedMonth;
          });
          
          this.renderNotionGrid();
          this.renderAnalytics();
        });
      });
    }
  },

  // --- Supabase Cloud Sync Settings Controller ---
  setupSyncSettings() {
    const modal = document.getElementById('sync-modal');
    const form = document.getElementById('sync-settings-form');
    const closeBtn = document.getElementById('close-sync-modal');
    const clearBtn = document.getElementById('clear-sync-btn');
    const urlInput = document.getElementById('supabase-url');
    const keyInput = document.getElementById('supabase-key');
    const statusMsg = document.getElementById('sync-status');

    // Helper to refresh UI states on both modal and inline sync cards
    const refreshSyncUI = () => {
      const url = SupabaseManager.url;
      const key = SupabaseManager.key;
      const enabled = SupabaseManager.isEnabled();

      // Sync input values
      urlInput.value = url;
      keyInput.value = key;
      if (this.dom.inlineSupabaseUrl) this.dom.inlineSupabaseUrl.value = url;
      if (this.dom.inlineSupabaseKey) this.dom.inlineSupabaseKey.value = key;

      // Sync status indicators
      statusMsg.className = "sync-status-msg";
      if (this.dom.inlineSyncStatus) this.dom.inlineSyncStatus.className = "sync-status-msg";

      if (enabled) {
        statusMsg.textContent = "Status: Cloud Sync is active.";
        statusMsg.classList.add('status-success');
        clearBtn.style.display = "block";

        if (this.dom.inlineSyncStatus) {
          this.dom.inlineSyncStatus.textContent = "Status: Connected & backup active.";
          this.dom.inlineSyncStatus.classList.add('status-success');
        }
        if (this.dom.inlineClearSyncBtn) this.dom.inlineClearSyncBtn.style.display = "block";
      } else {
        statusMsg.textContent = "Status: Local storage only.";
        statusMsg.classList.add('status-loading');
        clearBtn.style.display = "none";

        if (this.dom.inlineSyncStatus) {
          this.dom.inlineSyncStatus.textContent = "Status: Local storage only.";
          this.dom.inlineSyncStatus.classList.add('status-error');
        }
        if (this.dom.inlineClearSyncBtn) this.dom.inlineClearSyncBtn.style.display = "none";
      }
    };

    // Initial load
    refreshSyncUI();

    // Show modal trigger for all buttons with class .sync-settings-btn
    document.querySelectorAll('.sync-settings-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        refreshSyncUI();
        modal.classList.remove('hidden');
      });
    });

    // Close modal triggers
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    // Modal form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      statusMsg.className = "sync-status-msg status-loading";
      statusMsg.textContent = "Connecting & syncing records...";
      
      const url = urlInput.value;
      const key = keyInput.value;
      
      try {
        await SupabaseManager.saveCredentials(url, key);
        refreshSyncUI();
        
        statusMsg.className = "sync-status-msg status-success";
        statusMsg.textContent = "Success! Cloud Sync connected.";
        
        // Refresh views
        this.updateStreakDisplay();
        this.loadDateData();
        this.renderNotionGrid();
        this.renderAnalytics();
        
        // Close modal after delay
        setTimeout(() => {
          modal.classList.add('hidden');
        }, 1500);
      } catch (err) {
        statusMsg.className = "sync-status-msg status-error";
        statusMsg.textContent = "Connection failed! Check credentials & table setup.";
      }
    });

    // Inline form submit (mobile-accessible)
    if (this.dom.inlineSyncForm) {
      this.dom.inlineSyncForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inlineStatus = this.dom.inlineSyncStatus;
        inlineStatus.className = "sync-status-msg status-loading";
        inlineStatus.textContent = "Connecting & syncing records...";
        
        const url = this.dom.inlineSupabaseUrl.value;
        const key = this.dom.inlineSupabaseKey.value;
        
        try {
          await SupabaseManager.saveCredentials(url, key);
          refreshSyncUI();
          
          inlineStatus.className = "sync-status-msg status-success";
          inlineStatus.textContent = "Success! Cloud Sync connected.";
          
          // Refresh views
          this.updateStreakDisplay();
          this.loadDateData();
          this.renderNotionGrid();
          this.renderAnalytics();
          this.renderHeatmap(); // Refresh heatmap grid
        } catch (err) {
          inlineStatus.className = "sync-status-msg status-error";
          inlineStatus.textContent = "Connection failed! Check credentials & table setup.";
        }
      });
    }

    // Unified disconnect trigger
    const handleDisconnect = () => {
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      if (confirm(dict.confirm_disconnect || "Disconnect Supabase Sync? Your data will remain stored locally.")) {
        SupabaseManager.clearCredentials();
        refreshSyncUI();
        
        statusMsg.className = "sync-status-msg status-error";
        statusMsg.textContent = dict.supabase_disconnect || "Cloud Sync disconnected.";
        
        if (this.dom.inlineSyncStatus) {
          this.dom.inlineSyncStatus.className = "sync-status-msg status-error";
          this.dom.inlineSyncStatus.textContent = dict.supabase_disconnect || "Cloud Sync disconnected.";
        }
      }
    };

    clearBtn.addEventListener('click', handleDisconnect);
    if (this.dom.inlineClearSyncBtn) {
      this.dom.inlineClearSyncBtn.addEventListener('click', handleDisconnect);
    }
  },

  // --- Annual Discipline Heatmap Grid (365-Day contribution calendar) ---
  renderHeatmap() {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;
    container.innerHTML = "";

    // Generate date array ending today
    const endDate = new Date(STATE.todayDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364); // 365 days including today

    // Align start date to start of week (Monday)
    let startDayOfWeek = startDate.getDay();
    const shift = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // shift to Monday
    startDate.setDate(startDate.getDate() - shift);

    const days = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    days.forEach(day => {
      const key = formatDateKey(day);
      const dayData = STATE.db[key];
      
      let pct = 0;
      if (dayData) {
        pct = StreakEngine.calculateDailyPercentage(dayData);
      }

      let scoreClass = "score-0";
      if (pct === 100) {
        scoreClass = "score-100";
      } else if (pct >= 50) {
        scoreClass = "score-med";
      } else if (pct > 0) {
        scoreClass = "score-low";
      }

      const cell = document.createElement('div');
      cell.className = `heatmap-cell ${scoreClass}`;
      cell.setAttribute('data-date-key', key);
      
      const dayNum = String(day.getDate()).padStart(2, '0');
      const monthStr = day.toLocaleDateString('en-US', { month: 'short' });
      const yearVal = day.getFullYear();
      
      cell.title = `${monthStr} ${dayNum}, ${yearVal}: ${pct}% completed`;

      // Highlight if active date
      const activeKey = formatDateKey(STATE.activeDate);
      if (key === activeKey) {
        cell.style.outline = "1px solid var(--primary-light)";
        cell.style.transform = "scale(1.2)";
        cell.style.zIndex = "5";
      }

      cell.addEventListener('click', () => {
        STATE.activeDate = new Date(day);
        this.loadDateData();
        
        // Auto-switch to daily tab if on tablet/mobile
        const focusBtn = document.querySelector('.tab-btn[data-tab="focus-tab"]');
        if (focusBtn && window.innerWidth < 1024) {
          focusBtn.click();
        }
      });

      container.appendChild(cell);
    });
  },

  highlightActiveHeatmapCell(activeKey) {
    const cells = document.querySelectorAll('.heatmap-cell');
    cells.forEach(cell => {
      if (cell.getAttribute('data-date-key') === activeKey) {
        cell.style.outline = "1px solid var(--primary-light)";
        cell.style.transform = "scale(1.2)";
        cell.style.zIndex = "5";
      } else {
        cell.style.outline = "";
        cell.style.transform = "";
        cell.style.zIndex = "";
      }
    });
  },

  // --- Notion-style Monthly Grid & Mobile Calendar Grid ---
  renderNotionGrid() {
    if (!this.dom.notionTableBody) return;
    this.dom.notionTableBody.innerHTML = "";
    
    const [year, month] = STATE.selectedMonth.split('-').map(Number);
    const days = CalendarEngine.getDaysInMonth(year, month - 1);
    
    // 1. Render Table Rows (Desktop)
    days.forEach(day => {
      const key = formatDateKey(day);
      const dayData = StorageManager.getDayState(key);
      const score = StreakEngine.calculateDailyPercentage(dayData);
      
      // Calculate consolidated grid columns based on flat checklist states
      const fajrDone = dayData.fajr_sunnah && dayData.fajr_fard;
      const fajrPartial = dayData.fajr_sunnah || dayData.fajr_fard;
      
      const dhuhrDone = dayData.dhuhr_sunnah1 && dayData.dhuhr_fard && dayData.dhuhr_sunnah2;
      const dhuhrPartial = dayData.dhuhr_sunnah1 || dayData.dhuhr_fard || dayData.dhuhr_sunnah2;
      
      const asrDone = dayData.asr_sunnah && dayData.asr_fard;
      const asrPartial = dayData.asr_sunnah || dayData.asr_fard;
      
      const maghribDone = dayData.maghrib_fard && dayData.maghrib_sunnah;
      const maghribPartial = dayData.maghrib_fard || dayData.maghrib_sunnah;
      
      const ishaDone = dayData.isha_sunnah1 && dayData.isha_fard && dayData.isha_sunnah2;
      const ishaPartial = dayData.isha_sunnah1 || dayData.isha_fard || dayData.isha_sunnah2;
      
      const dhikrDone = dayData.morning_dhikr && dayData.evening_dhikr;
      const dhikrPartial = dayData.morning_dhikr || dayData.evening_dhikr;
      
      const getDotClass = (done, partial) => done ? 'completed' : (partial ? 'partial' : '');
      
      const dayNum = String(day.getDate()).padStart(2, '0');
      const weekdayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
      const hijriStr = CalendarEngine.getHijriStringShort(day);
      
      const tr = document.createElement('tr');
      tr.setAttribute('data-date-key', key);
      
      const activeKey = formatDateKey(STATE.activeDate);
      if (key === activeKey) {
        tr.className = "active-row";
      }
      
      tr.innerHTML = `
        <td class="col-date">
          ${dayNum} ${day.toLocaleDateString('en-US', { month: 'short' })} (${weekdayStr})
          <span class="hijri-grid-date">${hijriStr}</span>
        </td>
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(fajrDone, fajrPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(dhuhrDone, dhuhrPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(asrDone, asrPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(maghribDone, maghribPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(ishaDone, ishaPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.witr_prayer ? 'completed' : ''}"></span></td>
        
        <td class="col-habit text-center"><span class="cell-dot ${getDotClass(dhikrDone, dhikrPartial)}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.quran_devotion ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.duha_prayer ? 'completed' : ''}"></span></td>
        
        <td class="col-habit text-center"><span class="cell-dot ${dayData.intellectual_growth ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.physical_training ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.nutritional_fuel ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.horizon_sync ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.mind_log ? 'completed' : ''}"></span></td>
        <td class="col-habit text-center"><span class="cell-dot ${dayData.fin_flow ? 'completed' : ''}"></span></td>
        
        <td class="col-percent text-center">
          <span class="score-badge ${score === 100 ? 'perfect' : (score > 0 ? 'partial' : '')}">${score}%</span>
        </td>
      `;
      
      tr.addEventListener('click', () => {
        STATE.activeDate = new Date(day);
        this.loadDateData();
        
        // Auto-switch to daily tab if clicking on tablet/mobile
        const focusBtn = document.querySelector('.tab-btn[data-tab="focus-tab"]');
        if (focusBtn && window.innerWidth < 1024) {
          focusBtn.click();
        }
      });
      
      this.dom.notionTableBody.appendChild(tr);
    });

    // 2. Render Mobile Calendar Grid (Mobile viewport replacement)
    const mobileGridContainer = document.getElementById('mobile-calendar-days-grid');
    if (mobileGridContainer) {
      mobileGridContainer.innerHTML = "";

      // Offset weekdays to start correct column alignment (Mon-Sun)
      const firstDay = new Date(year, month - 1, 1);
      let startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday...
      startDayOfWeek = (startDayOfWeek + 6) % 7; // Convert to Mon=0, Sun=6

      for (let i = 0; i < startDayOfWeek; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = "calendar-day-placeholder";
        mobileGridContainer.appendChild(placeholder);
      }

      // Append days
      days.forEach(day => {
        const key = formatDateKey(day);
        const dayData = StorageManager.getDayState(key);
        const score = StreakEngine.calculateDailyPercentage(dayData);
        
        let scoreClass = "day-score-0";
        if (score === 100) {
          scoreClass = "day-score-100";
        } else if (score >= 50) {
          scoreClass = "day-score-med";
        } else if (score > 0) {
          scoreClass = "day-score-low";
        }

        const cell = document.createElement('div');
        cell.className = `calendar-day-cell ${scoreClass}`;
        cell.setAttribute('data-date-key', key);
        
        const activeKey = formatDateKey(STATE.activeDate);
        if (key === activeKey) {
          cell.classList.add('active-day');
        }

        cell.innerHTML = `
          <span>${day.getDate()}</span>
          ${score > 0 ? '<span class="day-dot"></span>' : ''}
        `;

        cell.addEventListener('click', () => {
          STATE.activeDate = new Date(day);
          this.loadDateData();
          
          // Switch back to checklist tab
          const focusBtn = document.querySelector('.tab-btn[data-tab="focus-tab"]');
          if (focusBtn) {
            focusBtn.click();
          }
        });

        mobileGridContainer.appendChild(cell);
      });
    }
  },

  highlightActiveGridRow(activeKey) {
    if (this.dom.notionTableBody) {
      const rows = this.dom.notionTableBody.querySelectorAll('tr');
      rows.forEach(tr => {
        if (tr.getAttribute('data-date-key') === activeKey) {
          tr.classList.add('active-row');
        } else {
          tr.classList.remove('active-row');
        }
      });
    }

    // Synchronize highlight on Mobile Calendar cells
    const mobileCells = document.querySelectorAll('.calendar-day-cell');
    mobileCells.forEach(cell => {
      if (cell.getAttribute('data-date-key') === activeKey) {
        cell.classList.add('active-day');
      } else {
        cell.classList.remove('active-day');
      }
    });
  },

  // ================= MONTHLY PERFORMANCE ANALYTICS ENGINE =================
  renderAnalytics() {
    if (!this.dom.kpiAvgScore) return; // Guard if not authenticated or DOM not ready

    const [year, month] = STATE.selectedMonth.split('-').map(Number);
    const days = CalendarEngine.getDaysInMonth(year, month - 1);
    const N = days.length;

    let totalScoreSum = 0;
    let perfectDaysCount = 0;
    
    // Accumulate individual habit success rates
    const habitSuccessCounts = {};
    ROUTINE_KEYS.forEach(key => habitSuccessCounts[key] = 0);

    const scoresList = [];

    days.forEach(day => {
      const key = formatDateKey(day);
      const dayData = StorageManager.getDayState(key);
      const score = StreakEngine.calculateDailyPercentage(dayData);
      
      totalScoreSum += score;
      scoresList.push(score);

      if (score === 100) {
        perfectDaysCount++;
      }

      ROUTINE_KEYS.forEach(key => {
        if (dayData[key] === true) {
          habitSuccessCounts[key]++;
        }
      });
    });

    const averageScore = N > 0 ? Math.round(totalScoreSum / N) : 0;

    // Determine Top Habit and Focus Habit
    let maxPct = -1;
    let minPct = 101;
    let topHabitKey = null;
    let focusHabitKey = null;

    ROUTINE_KEYS.forEach(key => {
      const pct = Math.round((habitSuccessCounts[key] / N) * 100);
      
      if (pct > maxPct) {
        maxPct = pct;
        topHabitKey = key;
      }
      
      if (pct < minPct) {
        minPct = pct;
        focusHabitKey = key;
      }
    });

    // Populate KPIs
    this.dom.kpiAvgScore.textContent = `${averageScore}%`;
    this.dom.kpiPerfectDays.textContent = `${perfectDaysCount} / ${N}`;
    
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    if (topHabitKey && maxPct > 0) {
      const localizedName = dict[`habit_${topHabitKey}_title`] || HABIT_DISPLAY_NAMES[topHabitKey];
      this.dom.kpiTopHabit.textContent = `${HABIT_ICONS[topHabitKey]} ${localizedName} (${maxPct}%)`;
    } else {
      this.dom.kpiTopHabit.textContent = dict.kpi_top_none || "None yet";
    }

    if (focusHabitKey) {
      const localizedName = dict[`habit_${focusHabitKey}_title`] || HABIT_DISPLAY_NAMES[focusHabitKey];
      this.dom.kpiFocusHabit.textContent = `${HABIT_ICONS[focusHabitKey]} ${localizedName} (${minPct}%)`;
    } else {
      this.dom.kpiFocusHabit.textContent = dict.kpi_focus_none || "None yet";
    }

    // Draw SVG Score Line Chart
    this.renderTrendChart(days, scoresList);

    // Render Habit ranks list (sorted by completion)
    this.renderHabitsRanking(habitSuccessCounts, N);
  },

  renderTrendChart(days, scores) {
    const container = this.dom.trendChartContainer;
    container.innerHTML = "";

    const W = 600;
    const H = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const graphWidth = W - paddingLeft - paddingRight;
    const graphHeight = H - paddingTop - paddingBottom;
    const N = days.length;

    // Build points coordinates
    const points = [];
    for (let i = 0; i < N; i++) {
      const score = scores[i] || 0;
      const x = paddingLeft + (i / (N - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (score / 100) * graphHeight;
      points.push({ x, y, score, dayNum: i + 1, key: formatDateKey(days[i]) });
    }

    // Start drawing SVG
    let svgContent = `
      <svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">
        <defs>
          <!-- Gradient fill for line graph area shadow -->
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines (100%, 50%, 0%) -->
        <!-- 100% line -->
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${W - paddingRight}" y2="${paddingTop}" class="chart-grid-line" stroke="rgba(255,255,255,0.06)" />
        <text x="${paddingLeft - 10}" y="${paddingTop + 4}" class="chart-axis-text" text-anchor="end">100%</text>

        <!-- 50% line -->
        <line x1="${paddingLeft}" y1="${paddingTop + graphHeight/2}" x2="${W - paddingRight}" y2="${paddingTop + graphHeight/2}" class="chart-grid-line" stroke="rgba(255,255,255,0.04)" />
        <text x="${paddingLeft - 10}" y="${paddingTop + graphHeight/2 + 4}" class="chart-axis-text" text-anchor="end">50%</text>

        <!-- 0% line -->
        <line x1="${paddingLeft}" y1="${paddingTop + graphHeight}" x2="${W - paddingRight}" y2="${paddingTop + graphHeight}" class="chart-grid-line" stroke="rgba(255,255,255,0.06)" />
        <text x="${paddingLeft - 10}" y="${paddingTop + graphHeight + 4}" class="chart-axis-text" text-anchor="end">0%</text>
    `;

    // Draw area path (shadow)
    if (points.length > 0) {
      let areaD = `M ${points[0].x} ${paddingTop + graphHeight} `;
      points.forEach(p => {
        areaD += `L ${p.x} ${p.y} `;
      });
      areaD += `L ${points[points.length - 1].x} ${paddingTop + graphHeight} Z`;
      svgContent += `<path d="${areaD}" fill="url(#chartGradient)" class="chart-path-area" />`;
    }

    // Draw main stroke line path
    if (points.length > 0) {
      let lineD = `M ${points[0].x} ${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        lineD += `L ${points[i].x} ${points[i].y} `;
      }
      svgContent += `<path d="${lineD}" fill="none" stroke="var(--primary)" stroke-width="3.5" class="chart-path-line" />`;
    }

    // Draw dots for each day
    points.forEach(p => {
      svgContent += `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" class="chart-point" data-date="${p.key}">
          <title>Day ${p.dayNum} (${p.key.split('-')[2]}): ${p.score}%</title>
        </circle>
      `;
    });

    // Draw X-axis labels (Day 1, Day 10, Day 20, Day 30)
    const step = Math.ceil(N / 4);
    for (let i = 0; i < N; i += step) {
      const p = points[i];
      if (p) {
        svgContent += `
          <text x="${p.x}" y="${paddingTop + graphHeight + 18}" class="chart-axis-text" text-anchor="middle">d.${p.dayNum}</text>
        `;
      }
    }
    // Always draw last day if not drawn
    if ((N - 1) % step !== 0) {
      const p = points[N - 1];
      svgContent += `
        <text x="${p.x}" y="${paddingTop + graphHeight + 18}" class="chart-axis-text" text-anchor="middle">d.${p.dayNum}</text>
      `;
    }

    svgContent += `</svg>`;
    container.innerHTML = svgContent;

    // Attach click triggers to points so clicking a chart dot jumps to that date in the tracker!
    container.querySelectorAll('.chart-point').forEach(dot => {
      dot.addEventListener('click', () => {
        const dateStr = dot.getAttribute('data-date');
        STATE.activeDate = new Date(dateStr);
        this.loadDateData();
        
        // Swap back to Checklist tab
        const focusBtn = document.querySelector('.tab-btn[data-tab="focus-tab"]');
        if (focusBtn) focusBtn.click();
      });
    });
  },

  renderHabitsRanking(habitSuccessCounts, totalDays) {
    const listContainer = this.dom.analyticsHabitList;
    if (!listContainer) return;
    listContainer.innerHTML = "";
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;

    // Convert to sorted array of objects
    const items = ROUTINE_KEYS.map(key => {
      const completed = habitSuccessCounts[key] || 0;
      const pct = Math.round((completed / totalDays) * 100);
      const localizedName = dict[`habit_${key}_title`] || HABIT_DISPLAY_NAMES[key];
      return {
        key,
        name: localizedName,
        icon: HABIT_ICONS[key],
        pct
      };
    });

    // Sort from highest completion % to lowest
    items.sort((a, b) => b.pct - a.pct);

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = "habit-rank-row animate-fade-in";

      let rankClass = "rank-high";
      if (item.pct < 50) {
        rankClass = "rank-low";
      } else if (item.pct < 80) {
        rankClass = "rank-med";
      }

      row.innerHTML = `
        <div class="habit-rank-details">
          <span class="item-icon">${item.icon}</span>
          <span class="habit-rank-name truncate-text" title="${item.name}">${item.name}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <span class="habit-percent ${rankClass}">${item.pct}%</span>
      `;

      listContainer.appendChild(row);

      // Trigger width animation on next frame for a smooth layout slide-in!
      requestAnimationFrame(() => {
        const fill = row.querySelector('.progress-bar-fill');
        if (fill) fill.style.width = `${item.pct}%`;
      });
    });
  },

  // ================= MORNING BRIEFING & LIFE OS HANDLERS =================

  setupBriefTab() {
    document.querySelectorAll('.clickable-brief-widget').forEach(widget => {
      widget.addEventListener('click', () => {
        const target = widget.getAttribute('data-target-tab');
        document.querySelectorAll(`.tab-btn[data-tab="${target}"]`).forEach(btn => btn.click());
      });
    });
  },

  renderBrief() {
    const hr = new Date().getHours();
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    let greeting = dict.brief_greeting_morning || "Good Morning, Enes!";
    let greetingIcon = "🌤️";
    let subgreeting = dict.brief_sub_morning || "Today is a great day to achieve new goals and grow.";
    
    if (hr >= 12 && hr < 18) {
      greeting = dict.brief_greeting_afternoon || "Good Afternoon, Enes!";
      greetingIcon = "☀️";
      subgreeting = dict.brief_sub_afternoon || "Keep pushing hard towards your goals this afternoon.";
    } else if (hr >= 18 && hr < 23) {
      greeting = dict.brief_greeting_evening || "Good Evening, Enes!";
      greetingIcon = "🌙";
      subgreeting = dict.brief_sub_evening || "Remember to refresh your mind while unwinding.";
    } else if (hr >= 23 || hr < 5) {
      greeting = dict.brief_greeting_night || "Good Night, Enes!";
      greetingIcon = "🌌";
      subgreeting = dict.brief_sub_night || "A good sleep is the best preparation for tomorrow's success.";
    }
    
    const greetingTextEl = document.getElementById('brief-greeting-text');
    const greetingIconEl = document.querySelector('.brief-greeting-icon');
    const subgreetingTextEl = document.getElementById('brief-subgreeting-text');
    
    if (greetingTextEl) greetingTextEl.textContent = greeting;
    if (greetingIconEl) greetingIconEl.textContent = greetingIcon;
    if (subgreetingTextEl) subgreetingTextEl.textContent = subgreeting;

    // Render Ayah of the Day
    const activeDateKey = formatDateKey(STATE.activeDate);
    const ayah = getAyahOfTheDay(activeDateKey);
    const arDisplay = document.getElementById('ayah-arabic');
    const trDisplay = document.getElementById('ayah-translation');
    const srcDisplay = document.getElementById('ayah-source');
    
    if (arDisplay) arDisplay.textContent = ayah.arabic;
        // Load History list
    if (this.dom.journalHistoryList) {
      this.dom.journalHistoryList.innerHTML = '';
      const sortedKeys = Object.keys(STATE.journal).sort().reverse();
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      
      if (sortedKeys.length === 0) {
        this.dom.journalHistoryList.innerHTML = `<div class="empty-state">${dict.journal_empty || 'No entries yet. Write your first log!'}</div>`;
        return;
      }

      sortedKeys.forEach(k => {
        const item = STATE.journal[k];
        const row = document.createElement('div');
        row.className = `journal-list-item ${k === activeDateKey ? 'active' : ''}`;
        row.innerHTML = `
          <div class="item-header">
            <span>${k}</span>
            <span class="item-mood">${item.mood}</span>
          </div>
          <h4>${item.content.substring(0, 30)}${item.content.length > 30 ? '...' : ''}</h4>
          <p>${item.tags ? item.tags : (dict.journal_no_tags || 'No tags')}</p>
        `;
        row.addEventListener('click', () => {
          STATE.activeDate = new Date(k);
          this.renderJournal();
        });
        this.dom.journalHistoryList.appendChild(row);
      });
    }
    if (tEventsEl) tEventsEl.textContent = `${todayEventsCount} ${dict.brief_today_events_label || 'Events'}`;

    // Mock temperature details
    const baseTemp = 30 + Math.round(Math.sin(new Date().getHours() / 3) * 2);
    const tempValEl = document.getElementById('weather-temp-val');
    if (tempValEl) tempValEl.textContent = `${baseTemp}°C`;
  },

  setupJournalTab() {
    const moodMap = {
      "🤩": "awesome",
      "🙂": "good",
      "😐": "neutral",
      "😴": "tired",
      "😔": "bad"
    };

    const updateMoodTheme = (mood) => {
      const editorPanel = document.querySelector('.journal-editor-panel');
      if (editorPanel) {
        editorPanel.setAttribute('data-active-mood', moodMap[mood] || 'neutral');
      }
    };

    // Bind mood buttons
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mood = btn.getAttribute('data-mood');
        updateMoodTheme(mood);
      });
    });

    // Handle new button
    if (this.dom.journalNewBtn) {
      this.dom.journalNewBtn.addEventListener('click', () => {
        this.dom.journalForm.reset();
        this.dom.journalDateInput.value = formatDateKey(STATE.todayDate);
        moodBtns.forEach(b => b.classList.remove('active'));
        const defMood = document.querySelector('.mood-btn[data-mood="😐"]');
        if (defMood) defMood.classList.add('active');
        updateMoodTheme("😐");
        this.dom.journalDeleteBtn.style.display = 'none';
      });
    }

    // Handle delete button
    if (this.dom.journalDeleteBtn) {
      this.dom.journalDeleteBtn.addEventListener('click', () => {
        const dateKey = this.dom.journalDateInput.value;
        if (STATE.journal[dateKey]) {
          delete STATE.journal[dateKey];
          StorageManager.saveJournal();
          AudioFeedback.playSuccess();
          this.dom.journalNewBtn.click();
          this.renderJournal();
        }
      });
    }

    // Form Submit
    if (this.dom.journalForm) {
      this.dom.journalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = this.dom.journalDateInput.value;
        const content = this.dom.journalContentInput.value;
        const tags = this.dom.journalTagsInput.value;

        const activeBtn = document.querySelector('.mood-btn.active');
        const currentMood = activeBtn ? activeBtn.getAttribute('data-mood') : '😐';

        STATE.journal[dateKey] = {
          mood: currentMood,
          content: content,
          tags: tags,
          updatedAt: new Date().toISOString()
        };

        StorageManager.saveJournal();
        AudioFeedback.playSuccess();
        this.renderJournal();
        
        // Auto check checklist journal task
        const dayData = StorageManager.getDayState(dateKey);
        dayData.mind_log = true;
        StorageManager.saveDayState(dateKey, dayData);
        this.loadDateData();
      });
    }
  },

  renderJournal() {
    const activeDateKey = formatDateKey(STATE.activeDate);
    if (this.dom.journalActiveDateDisplay) {
      this.dom.journalActiveDateDisplay.textContent = CalendarEngine.getGregorianString(STATE.activeDate);
    }
    if (this.dom.journalDateInput) {
      this.dom.journalDateInput.value = activeDateKey;
    }

    const moodMap = {
      "🤩": "awesome",
      "🙂": "good",
      "😐": "neutral",
      "😴": "tired",
      "😔": "bad"
    };

    const updateMoodTheme = (mood) => {
      const editorPanel = document.querySelector('.journal-editor-panel');
      if (editorPanel) {
        editorPanel.setAttribute('data-active-mood', moodMap[mood] || 'neutral');
      }
    };

    // Pre-fill if exists for active date
    const entry = STATE.journal[activeDateKey];
    const moodBtns = document.querySelectorAll('.mood-btn');
    
    if (entry) {
      if (this.dom.journalContentInput) this.dom.journalContentInput.value = entry.content;
      if (this.dom.journalTagsInput) this.dom.journalTagsInput.value = entry.tags;
      if (this.dom.journalDeleteBtn) this.dom.journalDeleteBtn.style.display = 'block';
      moodBtns.forEach(b => {
        if (b.getAttribute('data-mood') === entry.mood) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      updateMoodTheme(entry.mood);
    } else {
      if (this.dom.journalContentInput) this.dom.journalContentInput.value = '';
      if (this.dom.journalTagsInput) this.dom.journalTagsInput.value = '';
      if (this.dom.journalDeleteBtn) this.dom.journalDeleteBtn.style.display = 'none';
      moodBtns.forEach(b => b.classList.remove('active'));
      const defMood = document.querySelector('.mood-btn[data-mood="😐"]');
      if (defMood) defMood.classList.add('active');
      updateMoodTheme("😐");
    }

    // Load History list
    if (this.dom.journalHistoryList) {
      this.dom.journalHistoryList.innerHTML = '';
      const sortedKeys = Object.keys(STATE.journal).sort().reverse();
      
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      if (sortedKeys.length === 0) {
        const emptyMsg = dict.journal_empty || "Henüz kayıt yok. İlk günlüğünü yaz!";
        this.dom.journalHistoryList.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
        return;
      }

      sortedKeys.forEach(k => {
        const item = STATE.journal[k];
        const row = document.createElement('div');
        const moodType = moodMap[item.mood] || 'neutral';
        row.className = `journal-list-item ${k === activeDateKey ? 'active' : ''}`;
        row.setAttribute('data-mood-type', moodType);

        const formatShortDate = (key, lang) => {
          const [y, m, d] = key.split('-').map(Number);
          const monthsTr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
          const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const months = lang === 'tr' ? monthsTr : monthsEn;
          return `${d} ${months[m - 1]} ${y}`;
        };

        let tagsHtml = '';
        if (item.tags) {
          const tagsList = item.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          tagsList.forEach(t => {
            tagsHtml += `<span class="journal-item-tag">${t}</span>`;
          });
        } else {
          const noTagsLabel = dict.journal_no_tags || (STATE.language === 'tr' ? 'Etiket yok' : 'No tags');
          tagsHtml = `<span class="journal-item-tag empty-tags">${noTagsLabel}</span>`;
        }

        row.innerHTML = `
          <div class="item-header">
            <span>${formatShortDate(k, STATE.language)}</span>
            <span class="item-mood">${item.mood}</span>
          </div>
          <h4>${item.content.substring(0, 30)}${item.content.length > 30 ? '...' : ''}</h4>
          <div class="item-tags-container">${tagsHtml}</div>
        `;
        row.addEventListener('click', () => {
          STATE.activeDate = new Date(k);
          this.renderJournal();
        });
        this.dom.journalHistoryList.appendChild(row);
      });
    }
  },

  setupFinanceTab() {
    // 1. Tab switches
    const tabButtons = document.querySelectorAll('.fin-subtab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        STATE.financeActiveSubTab = btn.getAttribute('data-subtab');
        
        // Hide/show views
        document.querySelectorAll('.finflow-view-pane').forEach(p => p.classList.remove('active'));
        const activePane = document.getElementById(`fin-view-${STATE.financeActiveSubTab}`);
        if (activePane) activePane.classList.add('active');
        
        this.renderFinance();
      });
    });

    // 2. Month controls
    const prevBtn = document.getElementById('fin-prev-month');
    const nextBtn = document.getElementById('fin-next-month');
    
    if (prevBtn && nextBtn) {
      const shiftMonth = (direction) => {
        if (!STATE.financeActiveMonth) {
          STATE.financeActiveMonth = formatDateKey(STATE.activeDate).substring(0, 7);
        }
        let [year, month] = STATE.financeActiveMonth.split('-').map(Number);
        month += direction;
        if (month === 0) {
          month = 12;
          year -= 1;
        } else if (month === 13) {
          month = 1;
          year += 1;
        }
        STATE.financeActiveMonth = `${year}-${String(month).padStart(2, '0')}`;
        this.renderFinance();
      };
      
      prevBtn.addEventListener('click', () => shiftMonth(-1));
      nextBtn.addEventListener('click', () => shiftMonth(1));
    }

    // 3. Add Transaction Modal Controls
    const addTrigger = document.getElementById('fin-add-tx-trigger');
    const modal = document.getElementById('fin-tx-modal');
    const modalClose = document.getElementById('fin-modal-close');
    const modalCancel = document.getElementById('fin-modal-cancel-btn');
    
    if (addTrigger && modal) {
      addTrigger.addEventListener('click', () => {
        // Reset and prefill modal fields
        const dateInput = document.getElementById('fin-date-input');
        if (dateInput) dateInput.value = formatDateKey(new Date());
        
        // Populate category grid for default type (expense)
        STATE.financeSelectedTxType = 'expense';
        STATE.financeSelectedCategory = '';
        
        const typeBtns = modal.querySelectorAll('.fin-modal-type-switcher .type-btn');
        typeBtns.forEach(b => {
          if (b.getAttribute('data-type') === 'expense') b.classList.add('active');
          else b.classList.remove('active');
        });
        
        document.getElementById('fin-target-account-group').classList.add('hidden');
        document.getElementById('fin-modal-category-group').classList.remove('hidden');
        document.querySelector('#fin-modal-source-account-group label').setAttribute('data-i18n', 'finance_account');
        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        document.querySelector('#fin-modal-source-account-group label').textContent = dict.finance_account || 'Account';
        
        this.renderFinanceModalCategories();
        modal.classList.add('active');
      });
    }
    
    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // 4. Modal Type Switcher
    if (modal) {
      const typeBtns = modal.querySelectorAll('.fin-modal-type-switcher .type-btn');
      typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          typeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          STATE.financeSelectedTxType = btn.getAttribute('data-type');
          STATE.financeSelectedCategory = '';
          
          const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
          
          // Target account vs Category display logic
          const targetGroup = document.getElementById('fin-target-account-group');
          const categoryGroup = document.getElementById('fin-modal-category-group');
          const sourceLabel = document.querySelector('#fin-modal-source-account-group label');
          
          if (STATE.financeSelectedTxType === 'transfer') {
            if (targetGroup) targetGroup.classList.remove('hidden');
            if (categoryGroup) categoryGroup.classList.add('hidden');
            if (sourceLabel) {
              sourceLabel.setAttribute('data-i18n', 'fin_source_account');
              sourceLabel.textContent = dict.fin_source_account || "From Account";
            }
          } else {
            if (targetGroup) targetGroup.classList.add('hidden');
            if (categoryGroup) categoryGroup.classList.remove('hidden');
            if (sourceLabel) {
              if (STATE.financeSelectedTxType === 'income') {
                sourceLabel.setAttribute('data-i18n', 'fin_target_account');
                sourceLabel.textContent = dict.fin_target_account || 'To Account';
              } else {
                sourceLabel.setAttribute('data-i18n', 'fin_source_account');
                sourceLabel.textContent = dict.fin_source_account || 'From Account';
              }
            }
            this.renderFinanceModalCategories();
          }
        });
      });
    }

    // 5. Submit transaction form
    const form = document.getElementById('finance-transaction-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('fin-amount-input').value);
        const account = document.getElementById('fin-account-select').value;
        const targetAccount = document.getElementById('fin-target-account-select').value;
        const dateVal = document.getElementById('fin-date-input').value;
        const description = document.getElementById('fin-desc-input').value;
        const selectedType = STATE.financeSelectedTxType;
        let category = STATE.financeSelectedCategory;
        
        if (isNaN(amount) || amount <= 0) return;
        
        if (selectedType !== 'transfer' && !category) {
          const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
          alert(dict.fin_select_category || "Please select a category!");
          return;
        }
        
        if (selectedType === 'transfer') {
          category = "Transfer";
          if (account === targetAccount) {
            const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
            alert(dict.alert_same_accounts || "Source and target accounts cannot be the same!");
            return;
          }
          STATE.finance.accounts[account].balance -= amount;
          STATE.finance.accounts[targetAccount].balance += amount;
        } else if (selectedType === 'expense') {
          STATE.finance.accounts[account].balance -= amount;
        } else if (selectedType === 'income') {
          STATE.finance.accounts[account].balance += amount;
        }
        
        // Add transaction
        const newTx = {
          id: 'tx-' + Date.now(),
          date: dateVal,
          type: selectedType,
          amount: amount,
          category: category,
          account: account,
          targetAccount: selectedType === 'transfer' ? targetAccount : '',
          description: description || category
        };
        
        STATE.finance.transactions.push(newTx);
        StorageManager.saveFinance();
        AudioFeedback.playSuccess();
        
        // Auto check checklist finance task
        const dayData = StorageManager.getDayState(dateVal);
        dayData.fin_flow = true;
        StorageManager.saveDayState(dateVal, dayData);
        this.loadDateData();
        
        // Close modal, reset form & re-render
        closeModal();
        form.reset();
        this.renderFinance();
        this.renderBrief();
      });
    }

    // 6. Summary Toggle (Expense vs Income chart)
    const toggleExpense = document.getElementById('fin-summary-toggle-expense');
    const toggleIncome = document.getElementById('fin-summary-toggle-income');
    if (toggleExpense && toggleIncome) {
      toggleExpense.addEventListener('click', () => {
        toggleExpense.classList.add('active');
        toggleIncome.classList.remove('active');
        STATE.financeSummaryToggleType = 'expense';
        this.renderFinanceSummary();
      });
      toggleIncome.addEventListener('click', () => {
        toggleIncome.classList.add('active');
        toggleExpense.classList.remove('active');
        STATE.financeSummaryToggleType = 'income';
        this.renderFinanceSummary();
      });
    }

    // 7. Keypads and Adjust Balance modal listeners
    const txKeypadEl = document.getElementById('fin-tx-keypad');
    if (this.dom.finAmountInput && txKeypadEl) {
      setupKeypad(this.dom.finAmountInput, txKeypadEl, () => {
        if (this.dom.financeForm) this.dom.financeForm.requestSubmit();
      });
    }

    const adjustKeypadEl = document.getElementById('fin-adjust-keypad');
    if (this.dom.finAdjustAmountInput && adjustKeypadEl) {
      setupKeypad(this.dom.finAdjustAmountInput, adjustKeypadEl, () => {
        if (this.dom.financeAdjustForm) this.dom.financeAdjustForm.requestSubmit();
      });
    }

    const closeAdjustModal = () => {
      if (this.dom.finAdjustModal) this.dom.finAdjustModal.classList.remove('active');
    };
    if (this.dom.finAdjustModalClose) this.dom.finAdjustModalClose.addEventListener('click', closeAdjustModal);
    if (this.dom.finAdjustCancelBtn) this.dom.finAdjustCancelBtn.addEventListener('click', closeAdjustModal);
    if (this.dom.finAdjustModal) {
      this.dom.finAdjustModal.addEventListener('click', (e) => {
        if (e.target === this.dom.finAdjustModal) closeAdjustModal();
      });
    }

    if (this.dom.financeAdjustForm) {
      this.dom.financeAdjustForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const valStr = this.dom.finAdjustAmountInput.value;
        const newVal = parseFloat(valStr);
        if (!isNaN(newVal)) {
          const accountKey = this.dom.financeAdjustForm.getAttribute('data-account-key');
          if (accountKey && STATE.finance.accounts[accountKey]) {
            STATE.finance.accounts[accountKey].balance = newVal;
            StorageManager.saveFinance();
            AudioFeedback.playSuccess();
            this.renderFinance();
            this.renderBrief();
            closeAdjustModal();
          }
        }
      });
    }
  },

  renderFinanceModalCategories() {
    const grid = document.getElementById('fin-modal-category-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const type = STATE.financeSelectedTxType || 'expense';
    const list = FINANCE_CATEGORIES[type] || [];
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    
    list.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-grid-item';
      if (STATE.financeSelectedCategory === cat.val) {
        item.classList.add('selected');
      }
      
      const localizedLabel = dict[cat.id] || cat.val;
      
      item.innerHTML = `
        <div class="badge" style="background:${cat.color}22; color:${cat.color};">${cat.emoji}</div>
        <span class="cat-label">${localizedLabel}</span>
      `;
      
      item.addEventListener('click', () => {
        document.querySelectorAll('#fin-modal-category-grid .category-grid-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        STATE.financeSelectedCategory = cat.val;
      });
      
      grid.appendChild(item);
    });
  },

  renderFinance() {
    const activeDateKey = formatDateKey(STATE.activeDate);
    if (!STATE.financeActiveMonth) {
      STATE.financeActiveMonth = activeDateKey.substring(0, 7);
    }
    if (!STATE.financeActiveSubTab) {
      STATE.financeActiveSubTab = 'daily';
    }
    if (!STATE.financeSummaryToggleType) {
      STATE.financeSummaryToggleType = 'expense';
    }

    // Set month title
    const monthTitle = document.getElementById('fin-current-month');
    if (monthTitle) {
      const [year, month] = STATE.financeActiveMonth.split('-');
      const monthNames = {
        en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
        ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
      };
      const langNames = monthNames[STATE.language] || monthNames.en;
      monthTitle.textContent = `${langNames[Number(month) - 1]} ${year}`;
    }

    // Populate standard select boxes in modal
    const sourceSelect = document.getElementById('fin-account-select');
    const targetSelect = document.getElementById('fin-target-account-select');
    if (sourceSelect && targetSelect) {
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      const accountsMarkup = Object.keys(STATE.finance.accounts).map(k => {
        const acc = STATE.finance.accounts[k];
        const localizedAccName = dict[`acc_${k}`] || acc.name;
        return `<option value="${k}">${localizedAccName} (${acc.balance.toFixed(0)} TL)</option>`;
      }).join('');
      sourceSelect.innerHTML = accountsMarkup;
      targetSelect.innerHTML = accountsMarkup;
    }

    // Call sub-view renderer
    if (STATE.financeActiveSubTab === 'daily') {
      this.renderFinanceDaily();
    } else if (STATE.financeActiveSubTab === 'calendar') {
      this.renderFinanceCalendar();
    } else if (STATE.financeActiveSubTab === 'summary') {
      this.renderFinanceSummary();
    } else if (STATE.financeActiveSubTab === 'accounts') {
      this.renderFinanceAccounts();
    }
  },

  renderFinanceDaily() {
    const dailyList = document.getElementById('fin-daily-grouped-list');
    if (!dailyList) return;
    dailyList.innerHTML = '';

    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const monthlyTxs = STATE.finance.transactions.filter(tx => tx.date.startsWith(STATE.financeActiveMonth));
    
    // Sort transactions descending by date
    const grouped = {};
    monthlyTxs.forEach(tx => {
      if (!grouped[tx.date]) grouped[tx.date] = [];
      grouped[tx.date].push(tx);
    });

    // Monthly totals
    const totalIncome = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const netTotal = totalIncome - totalExpense;

    const localeCode = STATE.language === 'tr' ? 'tr-TR' : 'en-US';
    document.getElementById('fin-daily-summary-income').textContent = `${totalIncome.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;
    document.getElementById('fin-daily-summary-expense').textContent = `${totalExpense.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;
    document.getElementById('fin-daily-summary-total').textContent = `${netTotal.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;

    const sortedDates = Object.keys(grouped).sort().reverse();
    if (sortedDates.length === 0) {
      dailyList.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); font-weight:600;">${dict.finance_empty || 'No transactions recorded for this month.'}</div>`;
      return;
    }

    sortedDates.forEach(dateStr => {
      const txs = grouped[dateStr];
      const dayIncome = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
      const dayExpense = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

      // Parse date to show day of week
      const dateObj = new Date(dateStr);
      const daysOfWeek = {
        en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        tr: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
        ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      };
      const dayName = daysOfWeek[STATE.language] ? daysOfWeek[STATE.language][dateObj.getDay()] : daysOfWeek.en[dateObj.getDay()];
      const dayNum = dateStr.substring(8, 10);

      const groupEl = document.createElement('div');
      groupEl.className = 'fin-daily-group';

      let headerSums = '';
      if (dayIncome > 0) headerSums += `<span class="day-income">+${dayIncome.toFixed(0)}</span>`;
      if (dayExpense > 0) headerSums += `<span class="day-expense">-${dayExpense.toFixed(0)}</span>`;

      groupEl.innerHTML = `
        <div class="fin-daily-group-header">
          <div class="fin-daily-group-date">
            <span class="day-num">${dayNum}</span>
            <span class="day-name">${dayName}</span>
          </div>
          <div class="fin-daily-group-sums">
            ${headerSums}
          </div>
        </div>
        <div class="fin-daily-tx-list"></div>
      `;

      const listContainer = groupEl.querySelector('.fin-daily-tx-list');
      txs.forEach(tx => {
        const itemEl = document.createElement('div');
        itemEl.className = 'fin-daily-tx-item';

        const cat = catInfo(tx.category, tx.type);
        const localizedCatLabel = dict[cat.id] || cat.val;
        const localizedAccName = dict[`acc_${tx.account}`] || (STATE.finance.accounts[tx.account] ? STATE.finance.accounts[tx.account].name : tx.account);
        const localizedTargetName = tx.targetAccount ? (dict[`acc_${tx.targetAccount}`] || (STATE.finance.accounts[tx.targetAccount] ? STATE.finance.accounts[tx.targetAccount].name : tx.targetAccount)) : '';

        let amtClass = 'expense';
        let amtPrefix = '-';
        if (tx.type === 'income') {
          amtClass = 'income';
          amtPrefix = '+';
        } else if (tx.type === 'transfer') {
          amtClass = 'transfer';
          amtPrefix = '⇄';
        }

        itemEl.innerHTML = `
          <div class="fin-daily-tx-left">
            <div class="fin-daily-tx-icon-badge" style="background:${cat.color}15; color:${cat.color};">${cat.emoji}</div>
            <div class="fin-daily-tx-details">
              <span class="fin-daily-tx-desc">${tx.description}</span>
              <div class="fin-daily-tx-sub">
                <span class="acc-tag">${localizedAccName}${tx.targetAccount ? ' → ' + localizedTargetName : ''}</span>
                <span>${localizedCatLabel}</span>
              </div>
            </div>
          </div>
          <div class="fin-daily-tx-right">
            <span class="fin-daily-tx-amount ${amtClass}">${amtPrefix}${tx.amount.toFixed(2)} TL</span>
            <button class="fin-daily-tx-delete-btn" data-id="${tx.id}">&times;</button>
          </div>
        `;

        itemEl.querySelector('.fin-daily-tx-delete-btn').addEventListener('click', () => {
          if (confirm(dict.fin_delete_tx_confirm || 'Are you sure you want to delete this transaction?')) {
            if (tx.type === 'expense') {
              STATE.finance.accounts[tx.account].balance += tx.amount;
            } else if (tx.type === 'income') {
              STATE.finance.accounts[tx.account].balance -= tx.amount;
            } else if (tx.type === 'transfer') {
              STATE.finance.accounts[tx.account].balance += tx.amount;
              STATE.finance.accounts[tx.targetAccount].balance -= tx.amount;
            }

            STATE.finance.transactions = STATE.finance.transactions.filter(x => x.id !== tx.id);
            StorageManager.saveFinance();
            AudioFeedback.playSuccess();
            this.renderFinance();
            this.renderBrief();
          }
        });

        listContainer.appendChild(itemEl);
      });

      dailyList.appendChild(groupEl);
    });
  },

  renderFinanceCalendar() {
    const daysGrid = document.getElementById('fin-calendar-days');
    if (!daysGrid) return;
    daysGrid.innerHTML = '';

    const [year, month] = STATE.financeActiveMonth.split('-').map(Number);
    const firstDayDate = new Date(year, month - 1, 1);
    let startDayIdx = firstDayDate.getDay(); 
    startDayIdx = startDayIdx === 0 ? 6 : startDayIdx - 1; // shift Sunday to index 6

    const totalDays = new Date(year, month, 0).getDate();
    
    // Add empty cell offsets for Monday layout
    for (let i = 0; i < startDayIdx; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'fin-calendar-day-cell other-month';
      daysGrid.appendChild(emptyCell);
    }

    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const modal = document.getElementById('fin-tx-modal');

    // Fill days
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;
      
      const dayTxs = STATE.finance.transactions.filter(tx => tx.date === dateKey);
      const dayIncome = dayTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
      const dayExpense = dayTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

      const cell = document.createElement('div');
      cell.className = 'fin-calendar-day-cell';
      
      const todayKey = formatDateKey(new Date());
      if (dateKey === todayKey) cell.classList.add('today');

      let valuesMarkup = '';
      if (dayIncome > 0) valuesMarkup += `<span class="income-val">+${dayIncome.toFixed(0)}</span>`;
      if (dayExpense > 0) valuesMarkup += `<span class="expense-val">-${dayExpense.toFixed(0)}</span>`;

      cell.innerHTML = `
        <span class="fin-calendar-day-num">${day}</span>
        <div class="fin-calendar-day-values">
          ${valuesMarkup}
        </div>
      `;

      cell.addEventListener('click', () => {
        // Prefill modal form with selected date
        const dateInput = document.getElementById('fin-date-input');
        if (dateInput) dateInput.value = dateKey;
        
        STATE.financeSelectedTxType = 'expense';
        STATE.financeSelectedCategory = '';
        
        const typeBtns = document.querySelectorAll('.fin-modal-type-switcher .type-btn');
        typeBtns.forEach(b => {
          if (b.getAttribute('data-type') === 'expense') b.classList.add('active');
          else b.classList.remove('active');
        });
        
        document.getElementById('fin-target-account-group').classList.add('hidden');
        document.getElementById('fin-modal-category-group').classList.remove('hidden');
        document.querySelector('#fin-modal-source-account-group label').textContent = dict.finance_account || 'Account';
        
        this.renderFinanceModalCategories();
        if (modal) modal.classList.add('active');
      });

      daysGrid.appendChild(cell);
    }
  },

  renderFinanceSummary() {
    const categoryList = document.getElementById('fin-summary-category-list');
    const svg = document.getElementById('fin-donut-chart-svg');
    if (!categoryList || !svg) return;

    categoryList.innerHTML = '';
    // Clear segments except background circle
    const circles = svg.querySelectorAll('circle');
    circles.forEach((c, idx) => {
      if (idx > 0) c.remove();
    });

    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const type = STATE.financeSummaryToggleType || 'expense';
    const monthlyTxs = STATE.finance.transactions.filter(tx => tx.date.startsWith(STATE.financeActiveMonth));
    const targetTxs = monthlyTxs.filter(tx => tx.type === type);

    const titleHeader = document.getElementById('fin-summary-category-header');
    if (titleHeader) {
      titleHeader.textContent = type === 'expense' ? (dict.finance_category_title || "Expenses by Category") : (dict.finance_monthly_income || "Inflow by Category");
    }

    const labelCenter = document.getElementById('fin-donut-center-label');
    if (labelCenter) {
      labelCenter.textContent = type === 'expense' ? (dict.finance_tx_expense || "Expense") : (dict.finance_tx_income || "Income");
    }

    const catTotals = {};
    targetTxs.forEach(tx => {
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    });

    const totalSum = targetTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const centerPercent = document.getElementById('fin-donut-center-percent');
    const localeCode = STATE.language === 'tr' ? 'tr-TR' : 'en-US';
    if (centerPercent) {
      centerPercent.textContent = `${totalSum.toLocaleString(localeCode, {maximumFractionDigits:0})} TL`;
    }

    if (totalSum === 0) {
      categoryList.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted); font-weight:600;">${dict.finance_empty || 'No transactions recorded.'}</div>`;
      return;
    }

    // Sort categories descending
    const list = FINANCE_CATEGORIES[type] || [];
    const sortedCats = list
      .map(c => ({
        ...c,
        total: catTotals[c.val] || 0,
        percent: totalSum > 0 ? ((catTotals[c.val] || 0) / totalSum) * 100 : 0
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);

    const r = 70;
    const circumference = 2 * Math.PI * r; // 439.8
    let accumulatedPercent = 0;

    sortedCats.forEach(cat => {
      // SVG segment
      const segment = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      segment.setAttribute('cx', '100');
      segment.setAttribute('cy', '100');
      segment.setAttribute('r', String(r));
      segment.setAttribute('fill', 'transparent');
      segment.setAttribute('stroke', cat.color);
      segment.setAttribute('stroke-width', '20');
      
      const strokeDasharray = `${(cat.percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = String(circumference - (accumulatedPercent / 100) * circumference + (circumference / 4));
      
      segment.setAttribute('stroke-dasharray', strokeDasharray);
      segment.setAttribute('stroke-dashoffset', strokeDashoffset);
      svg.appendChild(segment);
      
      accumulatedPercent += cat.percent;

      // Info list item
      const item = document.createElement('div');
      item.className = 'fin-category-progress-item';
      const catLabel = dict[cat.id] || cat.val;

      item.innerHTML = `
        <div class="badge" style="background:${cat.color}15; color:${cat.color};">${cat.emoji}</div>
        <div class="fin-category-progress-details">
          <div class="fin-category-progress-row">
            <span class="cat-name">${catLabel}<span class="cat-percent">${cat.percent.toFixed(1)}%</span></span>
            <span class="cat-amount">${cat.total.toLocaleString(localeCode, {minimumFractionDigits:2})} TL</span>
          </div>
          <div class="fin-category-progress-track">
            <div class="fin-category-progress-fill" style="width:0%; background:${cat.color};"></div>
          </div>
        </div>
      `;

      categoryList.appendChild(item);
      requestAnimationFrame(() => {
        const fill = item.querySelector('.fin-category-progress-fill');
        if (fill) fill.style.width = `${cat.percent}%`;
      });
    });
  },

  renderFinanceAccounts() {
    const grid = document.getElementById('fin-accounts-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const totalBalance = Object.keys(STATE.finance.accounts).reduce((sum, k) => sum + STATE.finance.accounts[k].balance, 0);
    const localeCode = STATE.language === 'tr' ? 'tr-TR' : 'en-US';
    
    document.getElementById('fin-accounts-total-balance').textContent = `${totalBalance.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;

    const accountIcons = {
      cash: "👛",
      bank: "🏦",
      credit: "💳",
      business: "💼"
    };

    Object.keys(STATE.finance.accounts).forEach(k => {
      const acc = STATE.finance.accounts[k];
      const localizedAccName = dict[`acc_${k}`] || acc.name;
      const emoji = accountIcons[k] || "💰";

      const card = document.createElement('div');
      card.className = `account-card ${k}`;
      
      card.innerHTML = `
        <div class="account-card-header">
          <span class="acc-title">${localizedAccName}</span>
          <span class="acc-icon">${emoji}</span>
        </div>
        <div class="account-card-body">
          <span class="acc-balance">${acc.balance.toLocaleString(localeCode, {minimumFractionDigits:2})} TL</span>
        </div>
        <div class="account-card-footer">
          <button class="account-card-adjust-btn">${dict.fin_adjust_balance || 'Adjust Balance'}</button>
        </div>
      `;

      card.querySelector('.account-card-adjust-btn').addEventListener('click', () => {
        const titleStr = (dict.fin_adjust_balance_title || "New balance for {account}").replace('{account}', localizedAccName);
        if (this.dom.finAdjustModalTitle) {
          this.dom.finAdjustModalTitle.textContent = titleStr;
        }
        if (this.dom.finAdjustAmountInput) {
          this.dom.finAdjustAmountInput.value = acc.balance;
        }
        if (this.dom.financeAdjustForm) {
          this.dom.financeAdjustForm.setAttribute('data-account-key', k);
        }
        if (this.dom.finAdjustModal) {
          this.dom.finAdjustModal.classList.add('active');
          setTimeout(() => this.dom.finAdjustAmountInput.focus(), 150);
        }
      });

      grid.appendChild(card);
    });
  },

  setupCalendarTab() {
    const client_id = '335043330325-2jmm3bel2c5pe6c5km2ndbqafd64dmrn.apps.googleusercontent.com';

    if (this.dom.calendarEventForm) {
      this.dom.calendarEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeDateKey = formatDateKey(STATE.activeDate);
        const title = this.dom.eventTitle.value;
        const startTime = this.dom.eventStartTime.value;
        const endTime = this.dom.eventEndTime.value;
        const desc = this.dom.eventDesc.value;

        const newEvent = {
          id: 'evt-' + Date.now(),
          title: title,
          startTime: startTime,
          endTime: endTime,
          desc: desc,
          date: activeDateKey,
          isLocal: true
        };

        STATE.calendar.push(newEvent);
        StorageManager.saveCalendar();
        AudioFeedback.playSuccess();

        this.dom.calendarEventForm.reset();
        this.dom.eventStartTime.value = "09:00";
        this.dom.eventEndTime.value = "10:00";

        this.renderCalendar();
        this.renderBrief();
      });
    }

    const authBtn = document.getElementById('google-auth-btn');
    const updateAuthBtnStyle = (isConnected) => {
      if (authBtn) {
        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        if (isConnected) {
          authBtn.innerHTML = dict.calendar_connected || "Google Calendar Connected ✓";
          authBtn.style.backgroundColor = "var(--success)";
          authBtn.style.borderColor = "var(--success)";
        } else {
          authBtn.innerHTML = dict.calendar_connect || "Connect Google Calendar";
          authBtn.style.backgroundColor = "#4285f4";
          authBtn.style.borderColor = "#4285f4";
        }
      }
    };

    if (authBtn) {
      const cachedToken = localStorage.getItem('google_access_token');
      if (cachedToken) {
        updateAuthBtnStyle(true);
        this.syncGoogleCalendar(cachedToken);
      }

      authBtn.addEventListener('click', () => {
        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
          alert(dict.alert_google_load_fail || "Google API library could not be loaded. Please check your internet connection and refresh the page.");
          return;
        }

        try {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: client_id,
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            callback: async (resp) => {
              const innerDict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
              if (resp.error) {
                console.error("GIS Error: ", resp.error);
                alert((innerDict.alert_google_auth_error || "Google auth error: ") + resp.error);
                return;
              }
              if (resp.access_token) {
                localStorage.setItem('google_access_token', resp.access_token);
                updateAuthBtnStyle(true);
                AudioFeedback.playSuccess();
                alert(innerDict.alert_google_sync_success || "Google Calendar connected successfully! Synchronizing your data.");
                this.syncGoogleCalendar(resp.access_token);
              }
            },
          });
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (err) {
          console.error("Google Auth error:", err);
          alert("Bağlantı başlatılamadı: " + err.message);
        }
      });
    }
  },

  async syncGoogleCalendar(accessToken) {
    const lang = STATE.language || 'en';
    const statusEl = document.getElementById('calendar-sync-status');
    
    const showStatus = (msg, type) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.display = 'block';
      if (type === 'error') {
        statusEl.style.color = '#ff6b6b';
        statusEl.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        statusEl.style.background = 'rgba(255, 107, 107, 0.05)';
      } else if (type === 'success') {
        statusEl.style.color = '#51cf66';
        statusEl.style.borderColor = 'rgba(81, 207, 102, 0.3)';
        statusEl.style.background = 'rgba(81, 207, 102, 0.05)';
      } else {
        statusEl.style.color = '#e9ecef';
        statusEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        statusEl.style.background = 'rgba(255, 255, 255, 0.03)';
      }
    };

    const tSyncing = {
      en: "Syncing Google Calendar...",
      tr: "Google Takvim senkronize ediliyor...",
      ar: "جاري مزامنة تقويم جوجل..."
    }[lang] || "Syncing Google Calendar...";

    showStatus(tSyncing, 'info');

    try {
      const activeDateKey = formatDateKey(STATE.activeDate);
      const timeMin = new Date(STATE.activeDate);
      timeMin.setHours(0,0,0,0);
      const timeMax = new Date(STATE.activeDate);
      timeMax.setHours(23,59,59,999);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('google_access_token');
          const authBtn = document.getElementById('google-auth-btn');
          if (authBtn) {
            authBtn.innerHTML = (TRANSLATIONS[lang] || TRANSLATIONS.en).calendar_connect || "Google Hesabını Bağla";
            authBtn.style.backgroundColor = "#4285f4";
            authBtn.style.borderColor = "#4285f4";
          }
          console.log("Google token expired, auth reset.");
          const tExpired = {
            en: "Google Calendar session expired. Please reconnect.",
            tr: "Google Takvim oturumu sona erdi. Lütfen tekrar bağlanın.",
            ar: "انتهت صلاحية جلسة تقويم جوجل. يرجى إعادة الاتصال."
          }[lang] || "Google Calendar session expired. Please reconnect.";
          showStatus(tExpired, 'error');
          return;
        }
        
        if (response.status === 403) {
          const t403 = {
            en: "Sync Error: Google Calendar API is not enabled in your Google Cloud Project. Please enable the Calendar API.",
            tr: "Senkronizasyon Hatası: Google Cloud Projenizde Google Calendar API etkinleştirilmemiş. Lütfen Calendar API'yi etkinleştirin.",
            ar: "خطأ مزامنة: لم يتم تفعيل Google Calendar API في مشروع Google Cloud. يرجى تفعيلها."
          }[lang] || "Sync Error: Google Calendar API is not enabled in your Google Cloud Project. Please enable the Calendar API.";
          showStatus(t403, 'error');
          throw new Error("Google Calendar API not enabled (403)");
        }

        throw new Error("HTTP error " + response.status);
      }

      const data = await response.json();
      
      // Keep local events, replace Google events for this date
      STATE.calendar = STATE.calendar.filter(evt => evt.isLocal || evt.date !== activeDateKey);
      
      const googleEvents = (data.items || []).map(item => {
        let startTime = "09:00";
        let endTime = "10:00";
        if (item.start) {
          const startStr = item.start.dateTime || item.start.date;
          if (item.start.dateTime) {
            const dateObj = new Date(startStr);
            startTime = String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
          }
        }
        if (item.end) {
          const endStr = item.end.dateTime || item.end.date;
          if (item.end.dateTime) {
            const dateObj = new Date(endStr);
            endTime = String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
          }
        }

        return {
          id: item.id,
          title: item.summary || 'Başlıksız Etkinlik',
          startTime: startTime,
          endTime: endTime,
          desc: item.description || item.location || 'Google Takvim Etkinliği',
          date: activeDateKey,
          isLocal: false
        };
      });

      STATE.calendar = [...STATE.calendar, ...googleEvents];
      StorageManager.saveCalendar();
      this.renderCalendar();
      this.renderBrief();

      const tSuccess = {
        en: `Google Calendar synced successfully! (${googleEvents.length} events loaded)`,
        tr: `Google Takvim başarıyla senkronize edildi! (${googleEvents.length} etkinlik yüklendi)`,
        ar: `تمت مزامنة تقويم جوجل بنجاح! (تم تحميل ${googleEvents.length} من الفعاليات)`
      }[lang] || `Google Calendar synced successfully! (${googleEvents.length} events loaded)`;
      
      showStatus(tSuccess, 'success');
    } catch (err) {
      console.error("Google Calendar Sync Error:", err);
      const tError = {
        en: `Google Calendar Sync Error: ${err.message}`,
        tr: `Google Takvim Senkronizasyon Hatası: ${err.message}`,
        ar: `خطأ في مزامنة تقويم جوجل: ${err.message}`
      }[lang] || `Google Calendar Sync Error: ${err.message}`;
      showStatus(tError, 'error');
    }
  },

  renderCalendar() {
    const activeDateKey = formatDateKey(STATE.activeDate);
    
    const dayLabel = document.getElementById('calendar-active-day');
    if (dayLabel) {
      dayLabel.textContent = CalendarEngine.getGregorianString(STATE.activeDate);
    }

    if (this.dom.calendarTimelineEvents) {
      this.dom.calendarTimelineEvents.innerHTML = '';
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      
      // Sort and filter events by active date
      const sortedEvents = [...STATE.calendar]
        .filter(e => !e.date || e.date === activeDateKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      // Hours to render in the scrollable timeline: 08:00 to 22:00
      for (let h = 8; h <= 22; h++) {
        const hourStr = String(h).padStart(2, '0') + ':00';
        const hourEvents = sortedEvents.filter(e => e.startTime.startsWith(String(h).padStart(2, '0')));
        
        const hourRow = document.createElement('div');
        hourRow.className = 'timeline-hour-row';
        hourRow.innerHTML = `
          <div class="timeline-hour-label">${hourStr}</div>
          <div class="timeline-events-placeholder"></div>
        `;

        const placeholder = hourRow.querySelector('.timeline-events-placeholder');
        if (hourEvents.length > 0) {
          hourEvents.forEach(e => {
            const card = document.createElement('div');
            card.className = 'timeline-event-card';
            card.innerHTML = `
              <div class="event-info">
                <h4>${e.title}</h4>
                <p>${e.desc || (dict.calendar_notes_placeholder || 'Notes / Location')}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="event-time">${e.startTime} - ${e.endTime}</span>
                ${e.isLocal ? `<button class="delete-event-btn" data-id="${e.id}">×</button>` : ''}
              </div>
            `;

            if (e.isLocal) {
              card.querySelector('.delete-event-btn').addEventListener('click', (ev) => {
                ev.stopPropagation();
                STATE.calendar = STATE.calendar.filter(x => x.id !== e.id);
                StorageManager.saveCalendar();
                AudioFeedback.playSuccess();
                this.renderCalendar();
                this.renderBrief();
              });
            }

            placeholder.appendChild(card);
          });
        }
        this.dom.calendarTimelineEvents.appendChild(hourRow);
      }
    }
  },

  renderHabitsRanking(habitSuccessCounts, totalDays) {
    const listContainer = this.dom.analyticsHabitList;
    if (!listContainer) return;
    listContainer.innerHTML = "";
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;

    // Convert to sorted array of objects
    const items = ROUTINE_KEYS.map(key => {
      const completed = habitSuccessCounts[key] || 0;
      const pct = Math.round((completed / totalDays) * 100);
      const localizedName = dict[`habit_${key}_title`] || HABIT_DISPLAY_NAMES[key];
      return {
        key,
        name: localizedName,
        icon: HABIT_ICONS[key],
        pct
      };
    });

    // Sort from highest completion % to lowest
    items.sort((a, b) => b.pct - a.pct);

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = "habit-rank-row animate-fade-in";

      let rankClass = "rank-high";
      if (item.pct < 50) {
        rankClass = "rank-low";
      } else if (item.pct < 80) {
        rankClass = "rank-med";
      }

      row.innerHTML = `
        <div class="habit-rank-details">
          <span class="item-icon">${item.icon}</span>
          <span class="habit-rank-name truncate-text" title="${item.name}">${item.name}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <span class="habit-percent ${rankClass}">${item.pct}%</span>
      `;

      listContainer.appendChild(row);

      // Trigger width animation on next frame for a smooth layout slide-in!
      requestAnimationFrame(() => {
        const fill = row.querySelector('.progress-bar-fill');
        if (fill) fill.style.width = `${item.pct}%`;
      });
    });
  }
};

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});
