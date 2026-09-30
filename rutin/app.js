// ================= PASSCODE (PBKDF2) =================
// Stored only on the device as hrt_passcode = {v, alg, iter, salt, hash} (base64). No hash of any
// passcode ships with the app: a device without a stored passcode asks the user to create one.
const PasscodeManager = {
  STORAGE_KEY: 'hrt_passcode',
  LEGACY_KEY: 'hrt_passcode_hash', // "pbkdf2$saltHex$hashHex", written by the first DriveSync build
  ITERATIONS: 310000,

  toB64(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)));
  },

  fromB64(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
  },

  toHex(bytes) {
    return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async derive(passcode, salt, iterations) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(passcode), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  },

  getRecord() {
    try {
      const rec = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
      return rec && rec.salt && rec.hash && rec.iter ? rec : null;
    } catch (e) {
      return null;
    }
  },

  legacyRecord() {
    const m = (localStorage.getItem(this.LEGACY_KEY) || '').match(/^pbkdf2\$([0-9a-f]+)\$([0-9a-f]+)$/);
    return m ? { salt: m[1], hash: m[2] } : null;
  },

  hasPasscode() {
    return !!(this.getRecord() || this.legacyRecord());
  },

  async set(passcode) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await this.derive(passcode, salt, this.ITERATIONS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      v: 1, alg: 'PBKDF2-SHA256', iter: this.ITERATIONS, salt: this.toB64(salt), hash: this.toB64(hash)
    }));
    localStorage.removeItem(this.LEGACY_KEY);
  },

  async verify(passcode) {
    const rec = this.getRecord();
    if (rec) {
      const actual = new Uint8Array(await this.derive(passcode, this.fromB64(rec.salt), rec.iter));
      const expected = this.fromB64(rec.hash);
      if (actual.length !== expected.length) return false;
      let diff = 0;
      for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
      return diff === 0;
    }
    const legacy = this.legacyRecord();
    if (!legacy) return false;
    const salt = new Uint8Array(legacy.salt.match(/../g).map(h => parseInt(h, 16)));
    const ok = this.toHex(await this.derive(passcode, salt, 150000)) === legacy.hash;
    if (ok) await this.set(passcode);
    return ok;
  }
};

// ================= JSON BACKUP / RESTORE =================
// Only user data keys are exported; passcode and Google credentials never leave the device.
const BackupManager = {
  KEYS: ['hrt_db', 'hrt_journal', 'hrt_finance', 'hrt_calendar', 'hrt_best_streak', 'hrt_lang', 'hrt_theme'],
  UNDO_KEY: 'hrt_restore_undo',

  build() {
    const data = {};
    this.KEYS.forEach(k => {
      const raw = localStorage.getItem(k);
      if (raw === null) return;
      try { data[k] = JSON.parse(raw); } catch (e) { data[k] = raw; }
    });
    return { app: 'horizon-tracker', format: 1, exportedAt: new Date().toISOString(), data };
  },

  toJSON() {
    return JSON.stringify(this.build(), null, 2);
  },

  fileName() {
    return `horizon-backup-${formatDateKey(new Date())}.json`;
  },

  download() {
    const blob = new Blob([this.toJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // Returns { backup, summary } or throws Error with a translation key as message.
  parse(text) {
    let backup;
    try { backup = JSON.parse(text); } catch (e) { throw new Error('backup_invalid'); }
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    if (!isObj(backup) || backup.app !== 'horizon-tracker' || !isObj(backup.data)) throw new Error('backup_invalid');
    const d = backup.data;
    if ('hrt_db' in d && !(isObj(d.hrt_db) && Object.values(d.hrt_db).every(isObj))) throw new Error('backup_invalid');
    if ('hrt_journal' in d && !isObj(d.hrt_journal)) throw new Error('backup_invalid');
    if ('hrt_finance' in d && !(isObj(d.hrt_finance) && isObj(d.hrt_finance.accounts) && Array.isArray(d.hrt_finance.transactions))) throw new Error('backup_invalid');
    if ('hrt_calendar' in d && !Array.isArray(d.hrt_calendar)) throw new Error('backup_invalid');
    return {
      backup,
      summary: {
        days: d.hrt_db ? Object.keys(d.hrt_db).length : 0,
        journal: d.hrt_journal ? Object.keys(d.hrt_journal).length : 0,
        transactions: d.hrt_finance ? d.hrt_finance.transactions.length : 0,
        events: d.hrt_calendar ? d.hrt_calendar.length : 0,
        exportedAt: backup.exportedAt || ''
      }
    };
  },

  write(data) {
    this.KEYS.forEach(k => {
      if (!(k in data)) return;
      const v = data[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
  },

  restore(backup) {
    localStorage.setItem(this.UNDO_KEY, JSON.stringify(this.build()));
    this.write(backup.data);
  },

  hasUndo() {
    return localStorage.getItem(this.UNDO_KEY) !== null;
  },

  undo() {
    const prev = JSON.parse(localStorage.getItem(this.UNDO_KEY));
    this.KEYS.forEach(k => { if (!(k in prev.data)) localStorage.removeItem(k); });
    this.write(prev.data);
    localStorage.removeItem(this.UNDO_KEY);
  }
};

// Google OAuth client IDs are public by design; never put a client secret or refresh token in this file.
const GOOGLE_CLIENT_ID = "335043330325-2jmm3bel2c5pe6c5km2ndbqafd64dmrn.apps.googleusercontent.com";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
// drive.appdata: a hidden per-app folder; the app cannot see any other Drive files.
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

// ================= APPLICATION STATE =================
const STATE = {
  activeDate: new Date(), // Date object currently displayed in the checklist
  todayDate: new Date(),  // Real system date
  authenticated: false,
  selectedMonth: formatDateKey(new Date()).slice(0, 7), // "YYYY-MM", starts at the current month
  db: {}, // Loaded daily records
  journal: {}, // Loaded journal entries {"YYYY-MM-DD": {mood, content, tags}}
  finance: {
    accounts: {
      cash: { name: "Cash Wallet", balance: 0 },
      bank: { name: "Bank Account", balance: 0 }
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
    en: "\"Indeed, with hardship comes ease.\"",
    tafsir: 'فإن مع الضيق والشدة فرجاً ومخرجاً ويسراً عظيماً',
    ar: '"فإن مع العسر يسراً"',
    source_tr: "İnşirâh Suresi, 5. Ayet",
    source_en: "Surah Al-Inshirah, Verse 5",
    source_ar: "سورة الشرح، الآية ٥"
  },
  { 
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", 
    tr: '"Allah, hiç kimseye gücünün üstünde bir yük yüklemez."', 
    en: "\"Allah does not burden any soul beyond what it can bear.\"",
    tafsir: 'لا يطالب الله نفساً من التكاليف إلا بما تطيقه وتسعد به',
    ar: '"لا يكلف الله نفساً إلا وسعها"',
    source_tr: "Bakara Suresi, 286. Ayet",
    source_en: "Surah Al-Baqarah, Verse 286",
    source_ar: "سورة البقرة، الآية ٢٨٦"
  },
  { 
    arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", 
    tr: '"Rabbin seni terk etmedi ve sana darılmadı."', 
    en: "\"Your Lord has not forsaken you, nor is He displeased.\"",
    tafsir: 'ما تركك ربك يا محمد وما أبغضك منذ اختارك لرسالته',
    ar: '"ما ودعك ربك وما قلى"',
    source_tr: "Duhâ Suresi, 3. Ayet",
    source_en: "Surah Ad-Duha, Verse 3",
    source_ar: "سورة الضحى، الآية ٣"
  },
  { 
    arabic: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", 
    tr: '"İnsan için ancak çalıştığının karşılığı vardır."', 
    en: "\"A person will have only what they strive for.\"",
    tafsir: 'ليس للإنسان من الثواب والأجر إلا ما سعى وعمل بنفسه',
    ar: '"وأن ليس للإنسان إلا ما سعى"',
    source_tr: "Necm Suresi, 39. Ayet",
    source_en: "Surah An-Najm, Verse 39",
    source_ar: "سورة النجم، الآية ٣٩"
  },
  { 
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ", 
    tr: '"Benim başarım ancak Allah\'ın yardımıyladır. Yalnız O\'na tevekkül ettim."', 
    en: "\"My success comes only through Allah. In Him I put my trust.\"",
    tafsir: 'وما توفيقي لإصابة الحق والعمل الصالح إلا بمعونة الله وتوفيقه',
    ar: '"وما توفيقي إلا بالله عليه توكلت"',
    source_tr: "Hûd Suresi, 88. Ayet",
    source_en: "Surah Hud, Verse 88",
    source_ar: "سورة هود، الآية ٨٨"
  },
  { 
    arabic: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", 
    tr: '"Sabret! Çünkü Allah iyilik yapanların mükafatını zayi etmez."', 
    en: "\"Be patient, for Allah does not let the reward of those who do good go to waste.\"",
    tafsir: 'واصبر على الطاعات وعن المحرمات، فإن الله لا يضيع ثواب المحسنين',
    ar: '"واصبر فإن الله لا يضيع أجر المحسنين"',
    source_tr: "Hûd Suresi, 115. Ayet",
    source_en: "Surah Hud, Verse 115",
    source_ar: "سورة هود، الآية ١١٥"
  },
  { 
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", 
    tr: '"Bilesiniz ki, kalpler ancak Allah\'ı anmakla huzur bulur."', 
    en: "\"Surely, in the remembrance of Allah do hearts find rest.\"",
    tafsir: 'ألا بذكر الله وطاعته تسكن القلوب وتزول وحشتها وحيرتها',
    ar: '"ألا بذكر الله تطمئن القلوب"',
    source_tr: "Ra\'d Suresi, 28. Ayet",
    source_en: "Surah Ar-Ra'd, Verse 28",
    source_ar: "سورة الرعد، الآية ٢٨"
  },
  { 
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", 
    tr: '"Eğer şükrederseniz, elbette size (nimetimi) artırırım."', 
    en: "\"If you are grateful, I will surely give you more.\"",
    tafsir: 'لئن شكرتم الله على نعمه لأزيدنكم من فضله وإحسانه',
    ar: '"لئن شكرتم لأزيدنكم"',
    source_tr: "İbrâhîm Suresi, 7. Ayet",
    source_en: "Surah Ibrahim, Verse 7",
    source_ar: "سورة إبراهيم، الآية ٧"
  },
  { 
    arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ", 
    tr: '"Bana dua edin, size icabet edeyim."', 
    en: "\"Call upon Me and I will answer you.\"",
    tafsir: 'اعبدوني وأخلصوا لي العبادة، واستعينوا بي أستجب لكم وأعطكم مرادكم',
    ar: '"ادعوني أستجب لكم"',
    source_tr: "Mü\'min Suresi, 60. Ayet",
    source_en: "Surah Ghafir, Verse 60",
    source_ar: "سورة غافر، الآية ٦٠"
  },
  { 
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", 
    tr: '"Şüphesiz Allah sabredenlerle beraberdir."', 
    en: "\"Indeed, Allah is with the patient.\"",
    tafsir: 'إن الله مع الصابرين بالمعونة والتسديد والتأييد في دنياهم وأخراهم',
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
    nav_journal: "Mind Log",
    nav_finance: "FinFlow+",
    nav_calendar: "Agenda",
    nav_settings: "Settings",
    nav_lock: "Lock",
    auth_title: "Horizon Tracker",
    auth_sub: "Private dashboard",
    auth_label: "Access Passcode",
    auth_unlock: "Unlock",
    auth_footer: "© 2026 Firnas Technologies",
    brief_yesterday_score: "Yesterday's score",
    brief_yesterday_spend: "Spent yesterday",
    brief_today_events: "Events today",
    journal_title: "Mind Log",
    journal_history: "History",
    journal_new: "New",
    journal_date: "Date",
    journal_mood: "Mood",
    mood_awesome: "Awesome",
    mood_good: "Good",
    mood_neutral: "Neutral",
    mood_tired: "Tired",
    mood_bad: "Bad",
    journal_summary: "Notes",
    journal_placeholder: "What did you achieve today? What challenges did you face? Any thoughts occupying your mind?...",
    journal_tags: "Tags (comma separated)",
    journal_save: "Save",
    journal_delete: "Delete",
    journal_empty: "No entries yet. Write your first log.",
    finance_total_balance: "Total assets",
    finance_monthly_income: "Income",
    finance_monthly_expense: "Expenses",
    finance_new_tx: "Add transaction",
    finance_tx_income: "Income",
    finance_tx_expense: "Expense",
    finance_account: "Account",
    finance_category: "Category",
    finance_save: "Save",
    finance_category_title: "By category",
    finance_empty: "No transactions this month.",
    calendar_title: "Agenda",
    calendar_add_title: "New event",
    calendar_event_title: "Event Title",
    calendar_start_time: "Start Time",
    calendar_end_time: "End Time",
    calendar_notes: "Notes / Location",
    calendar_add_btn: "Add event",
    settings_title: "Settings",
    settings_subtitle: "Language, passcode and backups",
    language_label: "Language",
    

    focus_current_streak: "Current Streak",
    focus_personal_best: "Personal Best",
    focus_today: "Today",
    grid_title: "Monthly log",
    grid_subtitle: "Select a day to open its checklist.",
    grid_col_date: "Date",
    grid_col_score: "Score",
    weekday_mon: "Mon",
    weekday_tue: "Tue",
    weekday_wed: "Wed",
    weekday_thu: "Thu",
    weekday_fri: "Fri",
    weekday_sat: "Sat",
    weekday_sun: "Sun",
    analytics_title: "Progress",
    analytics_subtitle: "Monthly scores, trends and habit consistency.",
    analytics_kpi_avg: "Average daily score",
    analytics_kpi_perfect: "Perfect days",
    analytics_kpi_top: "Most consistent",
    analytics_kpi_focus: "Needs attention",
    analytics_chart_title: "Daily score",
    analytics_chart_legend: "Score for each day of the month so far",
    analytics_ranks_title: "Habit consistency",
    analytics_ranks_legend: "How often each routine was completed this month",
    analytics_heatmap_title: "Last 365 days",
    analytics_heatmap_legend: "Select a day to open its checklist.",
    analytics_heatmap_less: "Less",
    analytics_heatmap_more: "More",
    journal_tags_placeholder: "e.g. work, gym, devotion, family",
    journal_no_tags: "No tags",
    finance_desc_placeholder: "Optional",
    calendar_timeline_title: "Schedule",
    calendar_event_placeholder: "Meeting, class, workout...",
    calendar_notes_placeholder: "Enter description or location...",
    habit_fajr_sunnah_title: "Fajr 2 Rakah Sunnah",
    habit_fajr_fard_title: "Fajr 2 Rakah Fard",
    habit_morning_dhikr_title: "Morning Dhikr",
    habit_morning_dhikr_desc: "Morning Remembrance",
    habit_quran_devotion_title: "Quran Devotion",
    habit_quran_devotion_desc: "Daily wird / recitation",
    habit_intellectual_growth_title: "Intellectual Growth",
    habit_intellectual_growth_desc: "Book Reading",
    habit_physical_training_title: "Physical Training",
    habit_physical_training_desc: "Workout / Sport",
    habit_nutritional_fuel_title: "Nutritional Fuel",
    habit_nutritional_fuel_desc: "Healthy Breakfast",
    habit_horizon_sync_title: "Horizon Sync",
    habit_horizon_sync_desc: "Daily planning",
    habit_duha_prayer_title: "Duha Prayer",
    habit_evening_dhikr_title: "Evening Dhikr",
    habit_evening_dhikr_desc: "Evening Remembrance",
    habit_maghrib_fard_title: "Maghrib 3 Rakah Fard",
    habit_maghrib_sunnah_title: "Maghrib 2 Rakah Sunnah",
    habit_isha_sunnah1_title: "Isha 4 Rakah Sunnah",
    habit_isha_fard_title: "Isha 4 Rakah Fard",
    habit_isha_sunnah2_title: "Isha 2 Rakah Sunnah",
    habit_witr_prayer_title: "Witr 3 Rakah Prayer",
    habit_dhuhr_sunnah1_title: "Dhuhr 4 Rakah Sunnah",
    habit_dhuhr_fard_title: "Dhuhr 4 Rakah Fard",
    habit_dhuhr_sunnah2_title: "Dhuhr 2 Rakah Sunnah",
    habit_asr_sunnah_title: "Asr 4 Rakah Sunnah",
    habit_asr_fard_title: "Asr 4 Rakah Fard",
    habit_mind_log_title: "Mind Log",
    habit_mind_log_desc: "Daily Journaling Complete",
    habit_fin_flow_title: "FinFlow",
    habit_fin_flow_desc: "Daily Expenses Logged",
    alert_same_accounts: "Source and target accounts cannot be the same!",
    cat_food: "Groceries",
    cat_transport: "Transport",
    cat_tech: "Tech",
    cat_bills: "Bills",
    cat_invest: "Investment",
    cat_edu: "Education",
    cat_income: "Income",
    cat_other: "Other",
    acc_cash: "Cash Wallet",
    acc_bank: "Bank Account",
    acc_credit: "Credit Card",
    acc_business: "Business Card",
    inspire_perfect: "Perfect day. Everything is done.",
    inspire_almost: "Almost there, only a few left.",
    inspire_solid: "Solid progress. Keep going.",
    inspire_small: "Good start. Small steps build momentum.",
    inspire_welcome: "Start the day with your first routine.",
    kpi_top_none: "None yet",
    kpi_focus_none: "None yet",
    fin_subtab_daily: "Daily",
    fin_subtab_calendar: "Calendar",
    fin_subtab_summary: "Summary",
    fin_subtab_accounts: "Accounts",
    fin_net_balance: "Net",
    fin_add_income: "Income",
    fin_add_expense: "Expense",
    fin_add_transfer: "Transfer",
    fin_select_category: "Please select a category.",
    fin_amount_label: "Amount",
    fin_date_label: "Date",
    fin_desc_label: "Note",
    fin_source_account: "From Account",
    fin_target_account: "To Account",
    fin_delete_tx_confirm: "Are you sure you want to delete this transaction?",
    fin_add_account: "Add Account",
    fin_edit_account: "Edit",
    fin_delete_account: "Delete Account",
    fin_account_name: "Account Name",
    fin_initial_balance: "Balance",
    fin_select_icon: "Icon / Emoji",
    fin_confirm_delete_account: "Are you sure you want to delete this account? This action cannot be undone.",
    auth_error: "Incorrect passcode. Please try again.",
    settings_security_title: "Passcode",
    passcode_current: "Current passcode",
    passcode_new: "New passcode",
    passcode_confirm: "Repeat passcode",
    passcode_change_btn: "Change passcode",
    passcode_changed: "Passcode updated.",
    passcode_wrong_current: "Current passcode is incorrect.",
    passcode_mismatch: "The new passcodes do not match.",
    passcode_too_short: "Use at least 4 characters.",
    backup_title: "Backup & restore",
    backup_desc: "Save all routines, journal, finance and calendar data as a JSON file. Passcode and sync credentials are not included.",
    backup_download: "Download backup",
    backup_copy: "Copy to clipboard",
    backup_restore_file: "Restore from file…",
    backup_paste_toggle: "Or paste backup JSON",
    backup_restore_btn: "Restore",
    backup_undo: "Undo last restore",
    backup_downloaded: "Backup file created.",
    backup_copied: "Backup copied to clipboard.",
    backup_copy_failed: "Could not access the clipboard.",
    backup_invalid: "This is not a valid Horizon backup.",
    backup_confirm: "Replace current data with this backup?\n\nDays: {days}\nJournal entries: {journal}\nTransactions: {transactions}\nEvents: {events}\n\nYour current data is kept so you can undo.",
    backup_undo_confirm: "Return to the data you had before the last restore?",
    nav_today: "Today",
    nav_progress: "Progress",
    nav_journal_short: "Journal",
    nav_finance_short: "Finance",
    nav_more: "More",
    auth_toggle: "Show or hide passcode",
    day_prev: "Previous day",
    day_next: "Next day",
    month_prev: "Previous month",
    month_next: "Next month",
    month_select_label: "Select month",
    day_count: "{done} of {total} done",
    section_prayers: "Prayers",
    section_dhikr: "Dhikr & Quran",
    section_growth: "Growth",
    section_close: "Day close",
    prayer_fajr: "Fajr",
    prayer_duha: "Duha",
    prayer_dhuhr: "Dhuhr",
    prayer_asr: "Asr",
    prayer_maghrib: "Maghrib",
    prayer_isha: "Isha",
    prayer_witr: "Witr",
    abbr_sunnah: "S",
    abbr_fard: "F",
    abbr_wajib: "W",
    abbr_nafl: "N",
    chip_legend: "S: Sunnah · F: Fard · W: Wajib · N: Nafl. Numbers are rak'ahs.",
    tag_auto: "auto",
    status_done: "done",
    status_left: "{n} left",
    grid_col_dhikr: "Dhikr",
    grid_col_quran: "Quran",
    grid_col_read: "Read",
    grid_col_sport: "Sport",
    grid_col_fuel: "Food",
    grid_col_plan: "Plan",
    grid_col_journal: "Journal",
    grid_col_expense: "Expense",
    journal_delete_confirm: "Delete this journal entry? This cannot be undone.",
    cat_cafe: "Cafe",
    cat_shopping: "Shopping",
    cat_housing: "Housing",
    cat_health: "Health",
    cat_entertainment: "Leisure",
    cat_salary: "Salary",
    cat_freelance: "Side income",
    cat_gift: "Gift",
    calendar_empty: "Nothing planned for this day.",
    calendar_untitled: "Untitled event",
    settings_appearance: "Appearance",
    theme_label: "Theme",
    theme_light: "Light",
    theme_night: "Night",
    cancel: "Cancel",
    sync_title: "Sync across devices",
    sync_desc: "Routines, Mind Log, finance and agenda sync automatically through one hidden file in your Google Drive. The app cannot see anything else in your Drive.",
    sync_connect: "Connect Google account",
    sync_now: "Sync now",
    sync_disconnect: "Disconnect",
    sync_disconnect_confirm: "Stop syncing this device? Data on this device stays.",
    sync_state_waiting: "Connected, waiting for first sync",
    sync_error_auth: "Google sign-in was cancelled or failed",
    sync_error_scope: "Drive permission was not granted. Connect again and allow Google Drive.",
    sync_error_gis: "Google sign-in could not load. Check your connection and reload.",
    auth_setup_label: "Create a passcode",
    auth_setup_btn: "Save and unlock",
    auth_setup_hint: "No passcode is stored on this device yet. Choose one (at least 4 characters); it stays on this device only.",
    sync_state_off: "Not connected",
    sync_state_syncing: "Syncing…",
    sync_state_ok: "Synced · {time}",
    sync_state_error: "Sync failed: {error}. It will retry on the next change.",
    sync_state_renew: "Google session expired. Tap anywhere to renew."
  },
  tr: {
    nav_journal: "Günlük",
    nav_finance: "Finans",
    nav_calendar: "Takvim",
    nav_settings: "Ayarlar",
    nav_lock: "Kilitle",
    auth_title: "Horizon Tracker",
    auth_sub: "Kişisel panel",
    auth_label: "Erişim Şifresi",
    auth_unlock: "Kilidi aç",
    auth_footer: "© 2026 Firnas Technologies",
    brief_yesterday_score: "Dünkü skor",
    brief_yesterday_spend: "Dünkü harcama",
    brief_today_events: "Bugünkü etkinlik",
    journal_title: "Günlük",
    journal_history: "Geçmiş",
    journal_new: "Yeni",
    journal_date: "Tarih",
    journal_mood: "Ruh hali",
    mood_awesome: "Mükemmel",
    mood_good: "İyi",
    mood_neutral: "Normal",
    mood_tired: "Yorgun",
    mood_bad: "Kötü",
    journal_summary: "Notlar",
    journal_placeholder: "Bugün neler başardın? Karşılaştığın zorluklar nelerdi? Zihnini meşgul eden düşünceler var mı?...",
    journal_tags: "Etiketler (Virgülle ayırın)",
    journal_save: "Kaydet",
    journal_delete: "Sil",
    journal_empty: "Henüz kayıt yok. İlk günlüğünü yaz.",
    finance_total_balance: "Toplam varlık",
    finance_monthly_income: "Gelir",
    finance_monthly_expense: "Gider",
    finance_new_tx: "İşlem ekle",
    finance_tx_income: "Gelir",
    finance_tx_expense: "Gider",
    finance_account: "Hesap",
    finance_category: "Kategori",
    finance_save: "Kaydet",
    finance_category_title: "Kategoriye göre",
    finance_empty: "Bu ay işlem yok.",
    calendar_title: "Takvim",
    calendar_add_title: "Yeni etkinlik",
    calendar_event_title: "Etkinlik Başlığı",
    calendar_start_time: "Başlangıç Saati",
    calendar_end_time: "Bitiş Saati",
    calendar_notes: "Notlar / Konum",
    calendar_add_btn: "Etkinlik ekle",
    settings_title: "Ayarlar",
    settings_subtitle: "Dil, şifre ve yedekleme",
    language_label: "Dil",
    

    focus_current_streak: "Mevcut Seri",
    focus_personal_best: "En İyi Seri",
    focus_today: "Bugün",
    grid_title: "Aylık döküm",
    grid_subtitle: "Bir güne dokunarak o günün listesini açın.",
    grid_col_date: "Tarih",
    grid_col_score: "Skor",
    weekday_mon: "Pzt",
    weekday_tue: "Sal",
    weekday_wed: "Çar",
    weekday_thu: "Per",
    weekday_fri: "Cum",
    weekday_sat: "Cmt",
    weekday_sun: "Paz",
    analytics_title: "İlerleme",
    analytics_subtitle: "Aylık skorlar, eğilim ve alışkanlık istikrarı.",
    analytics_kpi_avg: "Günlük ortalama",
    analytics_kpi_perfect: "Kusursuz gün",
    analytics_kpi_top: "En istikrarlı",
    analytics_kpi_focus: "İlgi bekleyen",
    analytics_chart_title: "Günlük skor",
    analytics_chart_legend: "Ayın bugüne kadarki her günü için skor",
    analytics_ranks_title: "Alışkanlık istikrarı",
    analytics_ranks_legend: "Her rutinin bu ay tamamlanma oranı",
    analytics_heatmap_title: "Son 365 gün",
    analytics_heatmap_legend: "Bir güne dokunarak o günün listesini açın.",
    analytics_heatmap_less: "Az",
    analytics_heatmap_more: "Çok",
    journal_tags_placeholder: "örn: iş, spor, ibadet, aile",
    journal_no_tags: "Etiket yok",
    finance_desc_placeholder: "İsteğe bağlı",
    calendar_timeline_title: "Program",
    calendar_event_placeholder: "Toplantı, ders, buluşma...",
    calendar_notes_placeholder: "Açıklama veya yer girin...",
    habit_fajr_sunnah_title: "Sabah 2 Rekat Sünnet",
    habit_fajr_fard_title: "Sabah 2 Rekat Farz",
    habit_morning_dhikr_title: "Sabah Evradı / Zikir",
    habit_morning_dhikr_desc: "Güne Başlarken Hatırlama",
    habit_quran_devotion_title: "Kur'an Okuma",
    habit_quran_devotion_desc: "Günlük vird / tilavet",
    habit_intellectual_growth_title: "Entelektüel Okuma",
    habit_intellectual_growth_desc: "Kitap Okuma",
    habit_physical_training_title: "Spor ve Egzersiz",
    habit_physical_training_desc: "Antrenman / Yürüyüş",
    habit_nutritional_fuel_title: "Besleyici Kahvaltı",
    habit_nutritional_fuel_desc: "Sağlıklı Öğün",
    habit_horizon_sync_title: "Ufuk Eşitlemesi",
    habit_horizon_sync_desc: "Günlük planlama",
    habit_duha_prayer_title: "Duha / Kuşluk Namazı",
    habit_evening_dhikr_title: "Akşam Evradı / Zikir",
    habit_evening_dhikr_desc: "Günü Kapatırken Hatırlama",
    habit_maghrib_fard_title: "Akşam 3 Rekat Farz",
    habit_maghrib_sunnah_title: "Akşam 2 Rekat Sünnet",
    habit_isha_sunnah1_title: "Yatsı İlk Sünnet",
    habit_isha_fard_title: "Yatsı 4 Rekat Farz",
    habit_isha_sunnah2_title: "Yatsı Son Sünnet",
    habit_witr_prayer_title: "Vitir Namazı",
    habit_dhuhr_sunnah1_title: "Öğle İlk Sünnet",
    habit_dhuhr_fard_title: "Öğle 4 Rekat Farz",
    habit_dhuhr_sunnah2_title: "Öğle Son Sünnet",
    habit_asr_sunnah_title: "İkindi Sünneti",
    habit_asr_fard_title: "İkindi 4 Rekat Farz",
    habit_mind_log_title: "Günlük Yazımı",
    habit_mind_log_desc: "Zihinsel Günlük Tamamlandı",
    habit_fin_flow_title: "FinFlow Eşitlemesi",
    habit_fin_flow_desc: "Günlük Harcamalar Kaydedildi",
    alert_same_accounts: "Kaynak ve hedef hesaplar aynı olamaz!",
    cat_food: "Market",
    cat_transport: "Ulaşım",
    cat_tech: "Teknoloji",
    cat_bills: "Faturalar",
    cat_invest: "Yatırım",
    cat_edu: "Eğitim",
    cat_income: "Gelir",
    cat_other: "Diğer",
    acc_cash: "Nakit Cüzdan",
    acc_bank: "Banka Hesabı",
    acc_credit: "Kredi Kartı",
    acc_business: "Şirket Kartı",
    inspire_perfect: "Kusursuz gün. Hepsi tamam.",
    inspire_almost: "Az kaldı, birkaç tane daha.",
    inspire_solid: "İyi gidiyor. Devam et.",
    inspire_small: "Güzel başlangıç. Küçük adımlar birikir.",
    inspire_welcome: "Güne ilk rutinini işaretleyerek başla.",
    kpi_top_none: "Henüz Yok",
    kpi_focus_none: "Henüz Yok",
    fin_subtab_daily: "Günlük",
    fin_subtab_calendar: "Takvim",
    fin_subtab_summary: "İstatistik",
    fin_subtab_accounts: "Hesaplar",
    fin_net_balance: "Net",
    fin_add_income: "Gelir",
    fin_add_expense: "Gider",
    fin_add_transfer: "Transfer",
    fin_select_category: "Lütfen bir kategori seçin.",
    fin_amount_label: "Tutar",
    fin_date_label: "Tarih",
    fin_desc_label: "Not",
    fin_source_account: "Kaynak Hesap",
    fin_target_account: "Hedef Hesap",
    fin_delete_tx_confirm: "Bu işlemi silmek istediğinize emin misiniz?",
    fin_add_account: "Hesap Ekle",
    fin_edit_account: "Düzenle",
    fin_delete_account: "Hesabı Sil",
    fin_account_name: "Hesap Adı",
    fin_initial_balance: "Bakiye",
    fin_select_icon: "Simge / Emoji",
    fin_confirm_delete_account: "Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    auth_error: "Şifre hatalı. Lütfen tekrar deneyin.",
    settings_security_title: "Giriş şifresi",
    passcode_current: "Mevcut şifre",
    passcode_new: "Yeni şifre",
    passcode_confirm: "Şifre (tekrar)",
    passcode_change_btn: "Şifreyi değiştir",
    passcode_changed: "Şifre güncellendi.",
    passcode_wrong_current: "Mevcut şifre yanlış.",
    passcode_mismatch: "Yeni şifreler eşleşmiyor.",
    passcode_too_short: "En az 4 karakter kullanın.",
    backup_title: "Yedekleme ve geri yükleme",
    backup_desc: "Tüm rutin, günlük, finans ve takvim verilerini JSON dosyası olarak kaydedin. Şifre ve senkron bilgileri dahil edilmez.",
    backup_download: "Yedeği indir",
    backup_copy: "Panoya kopyala",
    backup_restore_file: "Dosyadan geri yükle…",
    backup_paste_toggle: "Ya da yedek JSON'unu yapıştırın",
    backup_restore_btn: "Geri yükle",
    backup_undo: "Son geri yüklemeyi geri al",
    backup_downloaded: "Yedek dosyası oluşturuldu.",
    backup_copied: "Yedek panoya kopyalandı.",
    backup_copy_failed: "Panoya erişilemedi.",
    backup_invalid: "Bu geçerli bir Horizon yedeği değil.",
    backup_confirm: "Mevcut veriler bu yedekle değiştirilsin mi?\n\nGün: {days}\nGünlük kaydı: {journal}\nİşlem: {transactions}\nEtkinlik: {events}\n\nMevcut verileriniz saklanır, geri alabilirsiniz.",
    backup_undo_confirm: "Son geri yüklemeden önceki verilere dönülsün mü?",
    nav_today: "Bugün",
    nav_progress: "İlerleme",
    nav_journal_short: "Günlük",
    nav_finance_short: "Finans",
    nav_more: "Daha",
    auth_toggle: "Şifreyi göster veya gizle",
    day_prev: "Önceki gün",
    day_next: "Sonraki gün",
    month_prev: "Önceki ay",
    month_next: "Sonraki ay",
    month_select_label: "Ay seç",
    day_count: "{done} / {total} tamamlandı",
    section_prayers: "Namaz",
    section_dhikr: "Zikir ve Kur'an",
    section_growth: "Gelişim",
    section_close: "Gün sonu",
    prayer_fajr: "Sabah",
    prayer_duha: "Kuşluk",
    prayer_dhuhr: "Öğle",
    prayer_asr: "İkindi",
    prayer_maghrib: "Akşam",
    prayer_isha: "Yatsı",
    prayer_witr: "Vitir",
    abbr_sunnah: "S",
    abbr_fard: "F",
    abbr_wajib: "V",
    abbr_nafl: "N",
    chip_legend: "S: Sünnet · F: Farz · V: Vacip · N: Nafile. Sayılar rekâtı gösterir.",
    tag_auto: "otomatik",
    status_done: "tamam",
    status_left: "{n} eksik",
    grid_col_dhikr: "Zikir",
    grid_col_quran: "Kur'an",
    grid_col_read: "Kitap",
    grid_col_sport: "Spor",
    grid_col_fuel: "Beslenme",
    grid_col_plan: "Plan",
    grid_col_journal: "Günlük",
    grid_col_expense: "Harcama",
    journal_delete_confirm: "Bu günlük kaydı silinsin mi? Geri alınamaz.",
    cat_cafe: "Kafe",
    cat_shopping: "Alışveriş",
    cat_housing: "Konut",
    cat_health: "Sağlık",
    cat_entertainment: "Eğlence",
    cat_salary: "Maaş",
    cat_freelance: "Ek gelir",
    cat_gift: "Hediye",
    calendar_empty: "Bu gün için plan yok.",
    calendar_untitled: "Başlıksız etkinlik",
    settings_appearance: "Görünüm",
    theme_label: "Tema",
    theme_light: "Açık",
    theme_night: "Gece",
    cancel: "Vazgeç",
    sync_title: "Cihazlar arası eşitleme",
    sync_desc: "Rutinler, günlük, finans ve takvim, Google Drive'ınızdaki gizli bir dosya üzerinden otomatik eşitlenir. Uygulama Drive'ınızdaki başka hiçbir şeyi göremez.",
    sync_connect: "Google hesabını bağla",
    sync_now: "Şimdi eşitle",
    sync_disconnect: "Bağlantıyı kes",
    sync_disconnect_confirm: "Bu cihazda eşitleme durdurulsun mu? Bu cihazdaki veriler kalır.",
    sync_state_waiting: "Bağlandı, ilk eşitleme bekleniyor",
    sync_error_auth: "Google girişi iptal edildi ya da başarısız oldu",
    sync_error_scope: "Drive izni verilmedi. Yeniden bağlanıp Google Drive'a izin verin.",
    sync_error_gis: "Google girişi yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.",
    auth_setup_label: "Şifre oluştur",
    auth_setup_btn: "Kaydet ve aç",
    auth_setup_hint: "Bu cihazda henüz kayıtlı şifre yok. En az 4 karakterli bir şifre seçin; yalnızca bu cihazda saklanır.",
    sync_state_off: "Bağlı değil",
    sync_state_syncing: "Eşitleniyor…",
    sync_state_ok: "Eşitlendi · {time}",
    sync_state_error: "Eşitleme başarısız: {error}. Bir sonraki değişiklikte tekrar denenecek.",
    sync_state_renew: "Google oturumu sona erdi. Yenilemek için herhangi bir yere dokunun."
  },
  ar: {
    nav_journal: "اليوميات",
    nav_finance: "المالية",
    nav_calendar: "التقويم",
    nav_settings: "الإعدادات",
    nav_lock: "قفل",
    auth_title: "تعقب هورايزون",
    auth_sub: "لوحة شخصية",
    auth_label: "رمز الدخول",
    auth_unlock: "فتح القفل",
    auth_footer: "© ٢٠٢٦ شركة فيرناس للتقنيات",
    brief_yesterday_score: "نتيجة أمس",
    brief_yesterday_spend: "مصروف أمس",
    brief_today_events: "أحداث اليوم",
    journal_title: "اليوميات",
    journal_history: "السجل",
    journal_new: "جديد",
    journal_date: "التاريخ",
    journal_mood: "المزاج",
    journal_summary: "الملاحظات",
    journal_placeholder: "ماذا حققت اليوم؟ ما هي التحديات التي واجهتها؟ هل هناك أفكار تشغل بالك؟...",
    journal_tags: "الوسوم (مفصولة بفاصلة)",
    journal_save: "حفظ",
    journal_delete: "حذف",
    journal_empty: "لا توجد مدخلات بعد. اكتب أول يومية.",
    finance_total_balance: "إجمالي الأصول",
    finance_monthly_income: "الدخل",
    finance_monthly_expense: "المصروفات",
    finance_new_tx: "إضافة معاملة",
    finance_tx_income: "دخل",
    finance_tx_expense: "مصروف",
    finance_account: "الحساب",
    finance_category: "الفئة",
    finance_save: "حفظ المعاملة",
    finance_category_title: "حسب الفئة",
    finance_empty: "لا توجد معاملات هذا الشهر.",
    calendar_title: "التقويم",
    calendar_add_title: "حدث جديد",
    calendar_event_title: "عنوان الموعد",
    calendar_start_time: "وقت البدء",
    calendar_end_time: "وقت الانتهاء",
    calendar_notes: "ملاحظات / الموقع",
    calendar_add_btn: "إضافة حدث",
    settings_title: "الإعدادات",
    settings_subtitle: "اللغة ورمز الدخول والنسخ الاحتياطي",
    language_label: "اللغة",
    

    focus_current_streak: "السلسلة الحالية",
    focus_personal_best: "أفضل سلسلة تاريخية",
    focus_today: "اليوم",
    grid_title: "السجل الشهري",
    grid_subtitle: "اختر يوماً لفتح قائمته.",
    grid_col_date: "التاريخ",
    grid_col_score: "الالتزام",
    weekday_mon: "الإثنين",
    weekday_tue: "الثلاثاء",
    weekday_wed: "الأربعاء",
    weekday_thu: "الخميس",
    weekday_fri: "الجمعة",
    weekday_sat: "السبت",
    weekday_sun: "الأحد",
    analytics_title: "التقدّم",
    analytics_subtitle: "النتائج الشهرية والاتجاه وانتظام العادات.",
    analytics_kpi_avg: "المعدل اليومي",
    analytics_kpi_perfect: "الأيام الكاملة",
    analytics_kpi_top: "الأكثر انتظاماً",
    analytics_kpi_focus: "يحتاج اهتماماً",
    analytics_chart_title: "النتيجة اليومية",
    analytics_chart_legend: "نتيجة كل يوم من الشهر حتى الآن",
    analytics_ranks_title: "انتظام العادات",
    analytics_ranks_legend: "نسبة إنجاز كل عادة هذا الشهر",
    analytics_heatmap_title: "آخر 365 يوماً",
    analytics_heatmap_legend: "اختر يوماً لفتح قائمته.",
    analytics_heatmap_less: "أقل",
    analytics_heatmap_more: "أكثر",
    journal_tags_placeholder: "مثال: العمل، النادي، العبادة، العائلة",
    journal_no_tags: "لا توجد وسوم",
    finance_desc_placeholder: "اختياري",
    calendar_timeline_title: "الجدول",
    calendar_event_placeholder: "اجتماع، درس، تمرين رياضي...",
    calendar_notes_placeholder: "أدخل تفاصيل أو موقع الموعد...",
    habit_fajr_sunnah_title: "سنة الفجر ركعتين",
    habit_fajr_fard_title: "فرض الفجر ركعتين",
    habit_morning_dhikr_title: "أذكار الصباح",
    habit_morning_dhikr_desc: "أوراد الصباح والذكر",
    habit_quran_devotion_title: "ورد القرآن الكريم",
    habit_quran_devotion_desc: "الورد اليومي / التلاوة",
    habit_intellectual_growth_title: "القراءة والتعلم",
    habit_intellectual_growth_desc: "قراءة كتاب / نمو معرفي",
    habit_physical_training_title: "الرياضة والنشاط البدني",
    habit_physical_training_desc: "تمارين رياضية / لياقة",
    habit_nutritional_fuel_title: "وجبة فطور صحية",
    habit_nutritional_fuel_desc: "تغذية متوازنة لبدء اليوم",
    habit_horizon_sync_title: "تزامن الأهداف والتخطيط",
    habit_horizon_sync_desc: "التخطيط اليومي",
    habit_duha_prayer_title: "صلاة الضحى",
    habit_evening_dhikr_title: "أذكار المساء",
    habit_evening_dhikr_desc: "أوراد المساء والذكر",
    habit_maghrib_fard_title: "فرض المغرب ٣ ركعات",
    habit_maghrib_sunnah_title: "سنة المغرب ركعتين",
    habit_isha_sunnah1_title: "سنة العشاء القبلية",
    habit_isha_fard_title: "فرض العشاء ٤ ركعات",
    habit_isha_sunnah2_title: "سنة العشاء البعدية",
    habit_witr_prayer_title: "صلاة الوتر",
    habit_dhuhr_sunnah1_title: "سنة الظهر القبلية",
    habit_dhuhr_fard_title: "فرض الظهر ٤ ركعات",
    habit_dhuhr_sunnah2_title: "سنة الظهر البعدية",
    habit_asr_sunnah_title: "سنة العصر",
    habit_asr_fard_title: "فرض العصر ٤ ركعات",
    habit_mind_log_title: "كتابة اليوميات",
    habit_mind_log_desc: "إكمال التدوين اليومي",
    habit_fin_flow_title: "تعقب الميزانية",
    habit_fin_flow_desc: "تسجيل النفقات اليومية كاملة",
    alert_same_accounts: "لا يمكن أن يكون حساب المصدر وحساب الهدف متطابقين!",
    cat_food: "البقالة",
    cat_transport: "المواصلات",
    cat_tech: "التقنية",
    cat_bills: "الفواتير",
    cat_invest: "الاستثمار",
    cat_edu: "التعليم",
    cat_income: "الدخل",
    cat_other: "أخرى",
    acc_cash: "المحفظة النقدية",
    acc_bank: "الحساب البنكي",
    acc_credit: "بطاقة الائتمان",
    acc_business: "بطاقة الشركة",
    inspire_perfect: "يوم كامل. أُنجز كل شيء.",
    inspire_almost: "اقتربت، بقي القليل.",
    inspire_solid: "تقدّم جيد. واصل.",
    inspire_small: "بداية طيبة. الخطوات الصغيرة تتراكم.",
    inspire_welcome: "ابدأ يومك بأول عادة.",
    kpi_top_none: "لا يوجد بعد",
    kpi_focus_none: "لا يوجد بعد",
    fin_subtab_daily: "يومي",
    fin_subtab_calendar: "التقويم",
    fin_subtab_summary: "إحصائيات",
    fin_subtab_accounts: "الحسابات",
    fin_net_balance: "الصافي",
    fin_add_income: "دخل",
    fin_add_expense: "مصروف",
    fin_add_transfer: "تحويل",
    fin_select_category: "يرجى اختيار فئة.",
    fin_amount_label: "المبلغ",
    fin_date_label: "التاريخ",
    fin_desc_label: "ملاحظة",
    fin_source_account: "من حساب",
    fin_target_account: "إلى حساب",
    fin_delete_tx_confirm: "هل أنت متأكد من رغبتك في حذف هذه المعاملة؟",
    fin_add_account: "إضافة حساب",
    fin_edit_account: "تعديل",
    fin_delete_account: "حذف الحساب",
    fin_account_name: "اسم الحساب",
    fin_initial_balance: "الرصيد",
    fin_select_icon: "الرمز",
    fin_confirm_delete_account: "هل أنت متأكد من رغبتك في حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.",
    auth_error: "رمز الدخول غير صحيح. حاول مرة أخرى.",
    settings_security_title: "رمز الدخول",
    passcode_current: "الرمز الحالي",
    passcode_new: "الرمز الجديد",
    passcode_confirm: "أعد إدخال الرمز",
    passcode_change_btn: "تغيير الرمز",
    passcode_changed: "تم تحديث رمز الدخول.",
    passcode_wrong_current: "الرمز الحالي غير صحيح.",
    passcode_mismatch: "الرمزان الجديدان غير متطابقين.",
    passcode_too_short: "استخدم ٤ أحرف على الأقل.",
    backup_title: "النسخ الاحتياطي والاستعادة",
    backup_desc: "احفظ جميع بيانات العادات واليوميات والمالية والتقويم في ملف JSON. لا يتضمن رمز الدخول وبيانات المزامنة.",
    backup_download: "تنزيل النسخة الاحتياطية",
    backup_copy: "نسخ إلى الحافظة",
    backup_restore_file: "استعادة من ملف…",
    backup_paste_toggle: "أو الصق نص النسخة الاحتياطية",
    backup_restore_btn: "استعادة",
    backup_undo: "التراجع عن آخر استعادة",
    backup_downloaded: "تم إنشاء ملف النسخة الاحتياطية.",
    backup_copied: "تم نسخ النسخة الاحتياطية إلى الحافظة.",
    backup_copy_failed: "تعذّر الوصول إلى الحافظة.",
    backup_invalid: "هذه ليست نسخة احتياطية صالحة من Horizon.",
    backup_confirm: "هل تريد استبدال البيانات الحالية بهذه النسخة؟\n\nالأيام: {days}\nاليوميات: {journal}\nالمعاملات: {transactions}\nالأحداث: {events}\n\nستُحفظ بياناتك الحالية ويمكنك التراجع.",
    backup_undo_confirm: "هل تريد العودة إلى البيانات السابقة لآخر استعادة؟",
    nav_today: "اليوم",
    nav_progress: "التقدّم",
    nav_journal_short: "اليوميات",
    nav_finance_short: "المالية",
    nav_more: "المزيد",
    auth_toggle: "إظهار أو إخفاء الرمز",
    day_prev: "اليوم السابق",
    day_next: "اليوم التالي",
    month_prev: "الشهر السابق",
    month_next: "الشهر التالي",
    month_select_label: "اختر الشهر",
    day_count: "أُنجز {done} من {total}",
    section_prayers: "الصلوات",
    section_dhikr: "الأذكار والقرآن",
    section_growth: "التطوير",
    section_close: "ختام اليوم",
    prayer_fajr: "الفجر",
    prayer_duha: "الضحى",
    prayer_dhuhr: "الظهر",
    prayer_asr: "العصر",
    prayer_maghrib: "المغرب",
    prayer_isha: "العشاء",
    prayer_witr: "الوتر",
    abbr_sunnah: "س",
    abbr_fard: "ف",
    abbr_wajib: "و",
    abbr_nafl: "ن",
    chip_legend: "س: سنة · ف: فرض · و: واجب · ن: نافلة. الأرقام عدد الركعات.",
    tag_auto: "تلقائي",
    status_done: "تمّ",
    status_left: "بقي {n}",
    grid_col_dhikr: "الأذكار",
    grid_col_quran: "القرآن",
    grid_col_read: "القراءة",
    grid_col_sport: "الرياضة",
    grid_col_fuel: "التغذية",
    grid_col_plan: "الخطة",
    grid_col_journal: "اليوميات",
    grid_col_expense: "المصروف",
    journal_delete_confirm: "هل تريد حذف هذه اليومية؟ لا يمكن التراجع.",
    mood_awesome: "ممتاز",
    mood_good: "جيد",
    mood_neutral: "عادي",
    mood_tired: "متعب",
    mood_bad: "سيئ",
    cat_cafe: "مقهى",
    cat_shopping: "التسوق",
    cat_housing: "السكن",
    cat_health: "الصحة",
    cat_entertainment: "الترفيه",
    cat_salary: "الراتب",
    cat_freelance: "دخل إضافي",
    cat_gift: "هدية",
    calendar_empty: "لا شيء مخطط لهذا اليوم.",
    calendar_untitled: "حدث بلا عنوان",
    settings_appearance: "المظهر",
    theme_label: "السمة",
    theme_light: "فاتح",
    theme_night: "ليلي",
    cancel: "إلغاء",
    sync_title: "المزامنة بين الأجهزة",
    sync_desc: "تتم مزامنة العادات واليوميات والمالية والتقويم تلقائياً عبر ملف مخفي في Google Drive. لا يرى التطبيق أي شيء آخر في Drive.",
    sync_connect: "ربط حساب جوجل",
    sync_now: "زامِن الآن",
    sync_disconnect: "قطع الاتصال",
    sync_disconnect_confirm: "إيقاف المزامنة على هذا الجهاز؟ تبقى البيانات على هذا الجهاز.",
    sync_state_waiting: "متصل، بانتظار أول مزامنة",
    sync_error_auth: "أُلغي تسجيل الدخول إلى جوجل أو فشل",
    sync_error_scope: "لم يُمنح إذن Drive. اتصل مجدداً واسمح بـ Google Drive.",
    sync_error_gis: "تعذّر تحميل تسجيل دخول جوجل. تحقّق من الاتصال وأعد التحميل.",
    auth_setup_label: "إنشاء رمز دخول",
    auth_setup_btn: "حفظ وفتح",
    auth_setup_hint: "لا يوجد رمز محفوظ على هذا الجهاز بعد. اختر رمزاً من 4 أحرف على الأقل؛ يبقى على هذا الجهاز فقط.",
    sync_state_off: "غير متصل",
    sync_state_syncing: "جارٍ المزامنة…",
    sync_state_ok: "تمت المزامنة · {time}",
    sync_state_error: "فشلت المزامنة: {error}. ستتم إعادة المحاولة عند التغيير التالي.",
    sync_state_renew: "انتهت جلسة جوجل. المس أي مكان للتجديد."
  }
};

// Helper to format Date objects to YYYY-MM-DD
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parse "YYYY-MM-DD" as a local date (new Date("YYYY-MM-DD") is UTC and shifts the day west of GMT).
function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const APP_LOCALES = { en: 'en-US', tr: 'tr-TR', ar: 'ar-u-nu-latn' };
function appLocale() {
  return APP_LOCALES[STATE.language] || 'en-US';
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function formatMoney(amount, fractionDigits = 2) {
  return `${amount.toLocaleString(appLocale(), { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} TL`;
}

function scoreClass(pct) {
  if (pct === 100) return 'score-100';
  if (pct >= 50) return 'score-med';
  return pct > 0 ? 'score-low' : 'score-0';
}

// Earliest day that has at least one completed routine, or null.
function getEarliestActiveDate() {
  let earliest = null;
  Object.keys(STATE.db).forEach(key => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const day = STATE.db[key];
    if (!day || !Object.values(day).some(v => v === true)) return;
    if (earliest === null || key < earliest) earliest = key;
  });
  return earliest ? parseDateKey(earliest) : null;
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
    SyncEngine.markChanged();
  },

  loadJournal() {
    const data = localStorage.getItem('hrt_journal');
    STATE.journal = data ? JSON.parse(data) : {};
  },

  saveJournal() {
    localStorage.setItem('hrt_journal', JSON.stringify(STATE.journal));
    SyncEngine.markChanged();
  },

  loadFinance() {
    const data = localStorage.getItem('hrt_finance');
    if (data) {
      STATE.finance = JSON.parse(data);
      // Migrate old hardcoded Turkish default names → English defaults
      const legacyMap = {
        cash:     { old: "Nakit C\u00fczdan", newName: "Cash Wallet"   },
        bank:     { old: "Banka Hesab\u0131", newName: "Bank Account"  },
        credit:   { old: "Kredi Kart\u0131",  newName: "Credit Card"   },
        business: { old: "\u015eirket Kart\u0131", newName: "Business Card" }
      };
      let migrated = false;
      Object.keys(legacyMap).forEach(k => {
        const acc = STATE.finance.accounts && STATE.finance.accounts[k];
        if (acc && acc.name === legacyMap[k].old) {
          acc.name = legacyMap[k].newName;
          migrated = true;
        }
      });
      if (migrated) this.saveFinance();
    } else {
      STATE.finance = {
        accounts: {
          cash: { name: "Cash Wallet", balance: 0 },
          bank: { name: "Bank Account", balance: 0 }
        },
        transactions: []
      };
      this.saveFinance();
    }
  },

  saveFinance() {
    localStorage.setItem('hrt_finance', JSON.stringify(STATE.finance));
    SyncEngine.markChanged();
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
      STATE.calendar = [];
    }
  },

  saveCalendar() {
    localStorage.setItem('hrt_calendar', JSON.stringify(STATE.calendar));
    SyncEngine.markChanged();
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
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
    return date.toLocaleDateString(appLocale(), options);
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
    if (!parts) return '';
    
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
    
    const today = new Date(STATE.todayDate.getFullYear(), STATE.todayDate.getMonth(), STATE.todayDate.getDate());
    const startCycle = getEarliestActiveDate() || today;
    
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

// ================= GOOGLE DRIVE SYNC =================
// Routines, Mind Log, finance and local calendar events are kept in one JSON file in the user's
// hidden Drive appDataFolder and merged record by record: every day, journal entry, transaction,
// account and event carries the time it last changed on any device, and the newest one wins.
// Equal times (data from before sync existed) are combined: for a day, a routine checked on either
// device stays checked. Records that were only auto-created (blank days, first-run accounts) carry
// no time, so they never override real data coming from another device.
const SYNC_FILE_NAME = "horizon-sync.json";
const SYNC_COLLECTIONS = ['db', 'journal', 'tx', 'acc', 'cal'];
// Seeded by old versions on first run; never treated as real data.
const DEMO_EVENT_IDS = ['cal-1', 'cal-2', 'cal-3'];
const DEMO_ACCOUNT_BALANCES = [1500, 8450, -450, 24500];

// JSON.stringify with sorted keys, so equal data always compares equal.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const SyncEngine = {
  ENABLED_KEY: 'hrt_sync_enabled',
  META_KEY: 'hrt_sync_meta',
  FILE_ID_KEY: 'hrt_sync_file_id',
  LAST_KEY: 'hrt_sync_last',
  DELAY_MS: 2000,

  state: 'off', // off | syncing | ok | error | renew
  message: '',
  onApplied: null,
  _tokenClient: null,
  _snapshot: null,
  _timer: null,
  _syncing: false,
  _again: false,
  _waitingGesture: false,

  isEnabled() {
    return localStorage.getItem(this.ENABLED_KEY) === '1';
  },

  setState(state, message = '') {
    this.state = state;
    this.message = message;
    UIController.renderSyncStatus();
  },

  // ---------- Google sign-in (Identity Services token client) ----------
  cachedToken() {
    const token = localStorage.getItem('google_access_token');
    const expiry = parseInt(localStorage.getItem('google_token_expiry') || '0', 10);
    return token && Date.now() < expiry - 60000 ? token : null;
  },

  hasCalendarScope() {
    return (localStorage.getItem('google_token_scopes') || '').includes(GOOGLE_CALENDAR_SCOPE);
  },

  // Must run inside a user gesture, otherwise the browser blocks Google's popup.
  requestToken(prompt) {
    return new Promise((resolve) => {
      if (!window.google || !google.accounts || !google.accounts.oauth2) return resolve(null);
      if (!this._tokenClient) {
        this._tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: `${GOOGLE_DRIVE_SCOPE} ${GOOGLE_CALENDAR_SCOPE}`,
          callback: () => {}
        });
      }
      this._tokenClient.callback = (resp) => {
        if (!resp || !resp.access_token) return resolve(null);
        localStorage.setItem('google_access_token', resp.access_token);
        localStorage.setItem('google_token_expiry', String(Date.now() + (Number(resp.expires_in) || 3600) * 1000));
        localStorage.setItem('google_token_scopes', resp.scope || '');
        resolve(resp.access_token);
      };
      this._tokenClient.error_callback = () => resolve(null);
      try {
        this._tokenClient.requestAccessToken({ prompt });
      } catch (e) {
        resolve(null);
      }
    });
  },

  // Interactive connect, called from a click.
  async connect() {
    const token = await this.requestToken('');
    if (!token) throw new Error('sync_error_auth');
    if (!(localStorage.getItem('google_token_scopes') || '').includes(GOOGLE_DRIVE_SCOPE)) {
      throw new Error('sync_error_scope');
    }
    localStorage.setItem(this.ENABLED_KEY, '1');
    await this.sync();
    return token;
  },

  // A valid token without any popup, or null. An expired token is renewed silently on the user's
  // next tap or click, because browsers only allow Google's popup inside a gesture.
  getToken() {
    const cached = this.cachedToken();
    if (cached) return cached;
    if (!this.isEnabled()) return null;
    if (!this._waitingGesture) {
      this._waitingGesture = true;
      this.setState('renew');
      const renew = async () => {
        document.removeEventListener('click', renew, true);
        document.removeEventListener('touchend', renew, true);
        this._waitingGesture = false;
        if (await this.requestToken('')) this.sync();
        else this.setState('error', 'sync_error_auth');
      };
      document.addEventListener('click', renew, true);
      document.addEventListener('touchend', renew, true);
    }
    return null;
  },

  disconnect() {
    const token = localStorage.getItem('google_access_token');
    if (token && window.google && google.accounts && google.accounts.oauth2) {
      try { google.accounts.oauth2.revoke(token, () => {}); } catch (e) {}
    }
    [this.ENABLED_KEY, this.FILE_ID_KEY, this.LAST_KEY, 'google_access_token', 'google_token_expiry', 'google_token_scopes']
      .forEach(k => localStorage.removeItem(k));
    this.setState('off');
  },

  // ---------- Local records and change tracking ----------
  readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  // All syncable records, keyed by id, straight from storage.
  collections() {
    const finance = this.readJSON('hrt_finance', { accounts: {}, transactions: [] });
    const tx = {};
    (finance.transactions || []).forEach(t => { if (t && t.id) tx[t.id] = t; });
    const cal = {};
    this.readJSON('hrt_calendar', []).forEach(e => {
      if (e && e.id && e.isLocal && !DEMO_EVENT_IDS.includes(e.id)) cal[e.id] = e;
    });
    return {
      db: this.readJSON('hrt_db', {}),
      journal: this.readJSON('hrt_journal', {}),
      tx,
      acc: finance.accounts || {},
      cal
    };
  },

  meta() {
    const m = this.readJSON(this.META_KEY, {});
    SYNC_COLLECTIONS.forEach(c => { if (!m[c] || typeof m[c] !== 'object') m[c] = {}; });
    return m;
  },

  saveMeta(meta) {
    localStorage.setItem(this.META_KEY, JSON.stringify(meta));
  },

  // Auto-created records that must not count as a change: blank days, and the zero-balance
  // accounts a fresh install starts with.
  isPlaceholder(collection, value) {
    if (collection === 'db') return !Object.values(value || {}).some(v => v === true);
    if (collection === 'acc') {
      if (!value || value.icon) return false;
      const balance = Number(value.balance);
      return balance === 0 || DEMO_ACCOUNT_BALANCES.includes(balance);
    }
    return false;
  },

  // Remember current storage as the baseline, without stamping anything.
  primeSnapshot() {
    const snap = {};
    const all = this.collections();
    SYNC_COLLECTIONS.forEach(c => {
      snap[c] = {};
      Object.keys(all[c]).forEach(k => { snap[c][k] = stableStringify(all[c][k]); });
    });
    this._snapshot = snap;
  },

  // Called after every local save: stamps what changed since the baseline, then syncs soon.
  markChanged() {
    if (!this._snapshot) this.primeSnapshot();
    const now = Date.now();
    const meta = this.meta();
    const all = this.collections();
    SYNC_COLLECTIONS.forEach(c => {
      const before = this._snapshot[c];
      const after = {};
      Object.keys(all[c]).forEach(k => {
        const json = stableStringify(all[c][k]);
        after[k] = json;
        if (before[k] === json) return;
        // New blank days are not edits. Seeded accounts never are, even when a migration renames them;
        // a real edit always sets an icon, which makes the account real.
        if ((!(k in before) || c === 'acc') && this.isPlaceholder(c, all[c][k])) return;
        meta[c][k] = { t: now };
      });
      Object.keys(before).forEach(k => {
        if (!(k in after)) meta[c][k] = { t: now, d: 1 };
      });
      this._snapshot[c] = after;
    });
    this.saveMeta(meta);
    if (this.isEnabled()) this.schedule();
  },

  // After a JSON restore: every restored record becomes the newest version everywhere.
  stampAll() {
    const now = Date.now();
    const meta = this.meta();
    const all = this.collections();
    SYNC_COLLECTIONS.forEach(c => {
      Object.keys(all[c]).forEach(k => {
        if (!this.isPlaceholder(c, all[c][k])) meta[c][k] = { t: now };
      });
    });
    this.saveMeta(meta);
  },

  schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.sync(), this.DELAY_MS);
  },

  // ---------- Payload and merge ----------
  localPayload() {
    const meta = this.meta();
    const all = this.collections();
    const payload = { app: 'horizon-tracker', v: 2 };
    SYNC_COLLECTIONS.forEach(c => {
      const out = {};
      Object.keys(all[c]).forEach(k => {
        const t = (meta[c][k] && meta[c][k].t) || 0;
        // Untouched placeholders stay on this device only.
        if (t === 0 && this.isPlaceholder(c, all[c][k])) return;
        out[k] = { t, v: all[c][k] };
      });
      Object.keys(meta[c]).forEach(k => {
        if (meta[c][k].d && !(k in all[c])) out[k] = { t: meta[c][k].t, d: 1 };
      });
      payload[c] = out;
    });
    payload.best_streak = parseInt(localStorage.getItem('hrt_best_streak') || '0', 10);
    return payload;
  },

  // Files written by the first DriveSync version stored finance and calendar as single blobs.
  upgradeRemote(remote) {
    if (!remote || remote.app !== 'horizon-tracker') return null;
    if (remote.v >= 2) return remote;
    const toRecords = (list, t) => {
      const out = {};
      list.forEach(item => { if (item && item.id) out[item.id] = { t, v: item }; });
      return out;
    };
    const fin = (remote.finance && remote.finance.v) || { accounts: {}, transactions: [] };
    const finT = (remote.finance && remote.finance.t) || 0;
    const acc = {};
    Object.keys(fin.accounts || {}).forEach(k => { acc[k] = { t: finT, v: fin.accounts[k] }; });
    const calList = ((remote.calendar && remote.calendar.v) || []).filter(e => e.isLocal && !DEMO_EVENT_IDS.includes(e.id));
    return {
      app: 'horizon-tracker', v: 2,
      db: remote.db || {}, journal: remote.journal || {},
      tx: toRecords(fin.transactions || [], finT), acc,
      cal: toRecords(calList, (remote.calendar && remote.calendar.t) || 0),
      best_streak: remote.best_streak || 0
    };
  },

  mergeRecord(collection, a, b) {
    if (!a) return b;
    if (!b) return a;
    if (a.t !== b.t) return a.t > b.t ? a : b;
    if (a.d && !b.d) return b;
    if (b.d && !a.d) return a;
    if (collection === 'db' && a.v && b.v) {
      const v = { ...a.v };
      Object.keys(b.v).forEach(k => { v[k] = a.v[k] === true || b.v[k] === true ? true : b.v[k]; });
      return { t: a.t, v };
    }
    return b;
  },

  merge(local, remote) {
    if (!remote) return local;
    const merged = { app: 'horizon-tracker', v: 2 };
    SYNC_COLLECTIONS.forEach(c => {
      const a = local[c] || {};
      const b = remote[c] || {};
      merged[c] = {};
      new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => {
        merged[c][k] = this.mergeRecord(c, a[k], b[k]);
      });
    });
    merged.best_streak = Math.max(local.best_streak || 0, remote.best_streak || 0);
    return merged;
  },

  // Write a merged payload back to the normal storage keys and rebuild the metadata.
  applyLocal(payload) {
    const meta = { db: {}, journal: {}, tx: {}, acc: {}, cal: {} };
    const current = this.collections();
    const values = {};
    SYNC_COLLECTIONS.forEach(c => {
      values[c] = {};
      Object.entries(payload[c] || {}).forEach(([k, r]) => {
        if (r.d) {
          meta[c][k] = { t: r.t, d: 1 };
        } else {
          values[c][k] = r.v;
          if (r.t) meta[c][k] = { t: r.t };
        }
      });
      // Placeholders that were never sent stay as they are.
      Object.keys(current[c]).forEach(k => {
        if (!(k in values[c]) && !(meta[c][k] && meta[c][k].d)) values[c][k] = current[c][k];
      });
    });

    localStorage.setItem('hrt_db', JSON.stringify(values.db));
    localStorage.setItem('hrt_journal', JSON.stringify(values.journal));
    const transactions = Object.values(values.tx).sort((x, y) => (x.date || '').localeCompare(y.date || '') || String(x.id).localeCompare(String(y.id)));
    localStorage.setItem('hrt_finance', JSON.stringify({ accounts: values.acc, transactions }));
    // Google Calendar events stay per device; only local events sync.
    const googleEvents = this.readJSON('hrt_calendar', []).filter(e => e && !e.isLocal);
    localStorage.setItem('hrt_calendar', JSON.stringify([...Object.values(values.cal), ...googleEvents]));
    const best = Math.max(payload.best_streak || 0, parseInt(localStorage.getItem('hrt_best_streak') || '0', 10));
    localStorage.setItem('hrt_best_streak', String(best));

    this.saveMeta(meta);
    this.primeSnapshot();
  },

  // ---------- Drive file I/O ----------
  async api(token, path, options = {}) {
    const res = await fetch(`https://www.googleapis.com${path}`, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (res.status === 401) {
      localStorage.removeItem('google_access_token');
      throw new Error('401');
    }
    return res;
  },

  async findFile(token) {
    const cached = localStorage.getItem(this.FILE_ID_KEY);
    if (cached) return cached;
    const q = encodeURIComponent(`name='${SYNC_FILE_NAME}' and trashed=false`);
    const res = await this.api(token, `/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime%20desc&pageSize=1&fields=files(id,modifiedTime)`);
    if (!res.ok) throw new Error(`Drive ${res.status}`);
    const file = ((await res.json()).files || [])[0];
    if (file) localStorage.setItem(this.FILE_ID_KEY, file.id);
    return file ? file.id : null;
  },

  async download(token, id) {
    const res = await this.api(token, `/drive/v3/files/${id}?alt=media`);
    if (res.status === 404) {
      localStorage.removeItem(this.FILE_ID_KEY);
      return undefined; // file vanished: search again
    }
    if (!res.ok) throw new Error(`Drive ${res.status}`);
    try {
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async upload(token, id, payload) {
    const body = JSON.stringify(payload);
    if (id) {
      const res = await this.api(token, `/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body
      });
      if (!res.ok) throw new Error(`Drive ${res.status}`);
      return;
    }
    const boundary = 'horizon' + Date.now();
    const metadata = JSON.stringify({ name: SYNC_FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' });
    const res = await this.api(token, '/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
    });
    if (!res.ok) throw new Error(`Drive ${res.status}`);
    localStorage.setItem(this.FILE_ID_KEY, (await res.json()).id);
  },

  // ---------- Full sync: download, merge, apply locally, upload ----------
  async sync() {
    if (!this.isEnabled()) return;
    if (this._syncing) {
      this._again = true;
      return;
    }
    clearTimeout(this._timer);
    this._syncing = true;
    try {
      const token = this.getToken();
      if (!token) return;
      this.setState('syncing');

      let id = await this.findFile(token);
      let remote = id ? await this.download(token, id) : null;
      if (remote === undefined) {
        id = await this.findFile(token);
        remote = id ? await this.download(token, id) : null;
      }
      remote = this.upgradeRemote(remote);

      const local = this.localPayload();
      const merged = this.merge(local, remote);
      const mergedJson = stableStringify(merged);
      if (mergedJson !== stableStringify(local)) {
        this.applyLocal(merged);
        if (this.onApplied) this.onApplied();
      }
      if (!remote || mergedJson !== stableStringify(remote)) {
        await this.upload(token, id, merged);
      }
      localStorage.setItem(this.LAST_KEY, String(Date.now()));
      this.setState('ok');
    } catch (e) {
      if (e.message === '401') this.getToken();
      else this.setState('error', e.message);
    } finally {
      this._syncing = false;
      if (this._again) {
        this._again = false;
        this.schedule();
      }
    }
  },

  // Keys from the first DriveSync build and from the earlier Drive backup feature.
  migrateLegacyKeys() {
    if (localStorage.getItem('drive_sync_enabled') === '1') localStorage.setItem(this.ENABLED_KEY, '1');
    ['drive_sync_enabled', 'drive_file_id', 'drive_last_sync', 'hrt_drive_file_id', 'hrt_drive_last_backup', 'hrt_drive_auto']
      .forEach(k => localStorage.removeItem(k));
    // That build stamped finance and calendar as a whole: spread the stamp over their records.
    const old = this.readJSON(this.META_KEY, null);
    if (old && (typeof old.finance === 'number' || typeof old.calendar === 'number')) {
      const meta = { db: old.db || {}, journal: old.journal || {}, tx: {}, acc: {}, cal: {} };
      const all = this.collections();
      if (old.finance) {
        Object.keys(all.tx).forEach(k => { meta.tx[k] = { t: old.finance }; });
        Object.keys(all.acc).forEach(k => { meta.acc[k] = { t: old.finance }; });
      }
      if (old.calendar) Object.keys(all.cal).forEach(k => { meta.cal[k] = { t: old.calendar }; });
      this.saveMeta(meta);
    }
  },

  // Sync when the app comes back into view, at most every few seconds.
  syncOnReturn() {
    const last = parseInt(localStorage.getItem(this.LAST_KEY) || '0', 10);
    if (STATE.authenticated && this.isEnabled() && Date.now() - last > 5000) this.sync();
  }
};

// ================= WEB AUDIO API SYNTHESIS =================
const AudioFeedback = {
  ctx: null,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === "suspended") {
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
    finCategorySelect: document.getElementById('fin-modal-category-grid'),
    finAccountSelect: document.getElementById('fin-account-select'),
    finTargetAccountSelect: document.getElementById('fin-target-account-select'),
    finTransactionsList: document.getElementById('fin-daily-grouped-list'),
    finCategoryBreakdown: document.getElementById('fin-summary-category-list'),
    finTotalBalance: document.getElementById('fin-accounts-total-balance'),
    finMonthlyIncome: document.getElementById('fin-daily-summary-income'),
    finMonthlyExpense: document.getElementById('fin-daily-summary-expense'),

    // Calendar DOM elements
    calendarEventForm: document.getElementById('calendar-event-form'),
    eventTitle: document.getElementById('event-title'),
    eventStartTime: document.getElementById('event-start-time'),
    eventEndTime: document.getElementById('event-end-time'),
    eventDesc: document.getElementById('event-desc'),
    calendarTimelineEvents: document.getElementById('calendar-timeline-events')
  },



  triggerProgressCelebration() {
    const card = document.getElementById('day-card');
    if (!card) return;
    card.classList.add('perfect-pulse');
    setTimeout(() => card.classList.remove('perfect-pulse'), 2600);
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

    const apply = (attr, fn) => {
      document.querySelectorAll(`[${attr}]`).forEach(el => {
        const value = dict[el.getAttribute(attr)];
        if (value) fn(el, value);
      });
    };
    apply('data-i18n', (el, v) => { el.textContent = v; });
    apply('data-i18n-placeholder', (el, v) => el.setAttribute('placeholder', v));
    apply('data-i18n-aria', (el, v) => el.setAttribute('aria-label', v));
    apply('data-i18n-title', (el, v) => el.setAttribute('title', v));
    this.refreshGoogleButton();

    if (STATE.authenticated) {
      this.setupMonthSelector();
      this.updateStreakDisplay();
      this.loadDateData();
      this.renderNotionGrid();
      this.renderAnalytics();
      this.renderHeatmap();
      this.renderJournal();
      this.renderFinance();
      this.renderCalendar();
    }
  },

  init() {
    this.setupTheme();
    this.setupLanguage();

    // Sync: baseline for change tracking, re-render when another device's changes arrive,
    // and pull again whenever the app comes back into view.
    SyncEngine.migrateLegacyKeys();
    SyncEngine.primeSnapshot();
    SyncEngine.onApplied = () => this.refreshAfterSync();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') SyncEngine.syncOnReturn();
    });
    window.addEventListener('focus', () => SyncEngine.syncOnReturn());

    this.setupAuthentication();
    this.setupNavigation();
    this.setupDateNavigator();
    this.setupChecklist();
    this.setupMonthSelector();
    this.setupPasscodeSettings();
    this.setupBackupSettings();
    this.setupGoogleSettings();
    this.setupSyncSettings();
    this.setupJournalTab();
    this.setupFinanceTab();
    this.setupCalendarTab();

    // Unlock Web Audio API on first user gesture (required on iOS / WebKit)
    const unlockAudio = () => {
      AudioFeedback.init();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    setInterval(() => {
      const now = new Date();
      if (formatDateKey(now) !== formatDateKey(STATE.todayDate)) {
        const wasViewingToday = formatDateKey(STATE.activeDate) === formatDateKey(STATE.todayDate);
        const wasViewingThisMonth = STATE.selectedMonth === formatDateKey(STATE.todayDate).slice(0, 7);
        STATE.todayDate = now;
        if (wasViewingToday) STATE.activeDate = new Date(now);
        if (wasViewingThisMonth) STATE.selectedMonth = formatDateKey(now).slice(0, 7);
        this.setupMonthSelector();
        this.loadDateData();
        this.updateStreakDisplay();
        this.renderNotionGrid();
        this.renderAnalytics();
        this.renderHeatmap();
      }
    }, 60000);
  },

  setupTheme() {
    const select = document.getElementById('theme-select');
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = theme === 'night' ? '#051421' : '#0f2e4a';
    };
    const saved = localStorage.getItem('hrt_theme') === 'night' ? 'night' : 'light';
    apply(saved);
    if (!select) return;
    select.value = saved;
    select.addEventListener('change', () => {
      localStorage.setItem('hrt_theme', select.value);
      apply(select.value);
      SyncEngine.markChanged();
    });
  },

  async setupAuthentication() {
    sessionStorage.removeItem('hrt_session_hash'); // legacy session marker
    const confirmField = document.getElementById('passcode-setup-field');
    const confirmInput = document.getElementById('passcode-setup-confirm');
    const label = document.querySelector('label[for="passcode"]');
    const submit = this.dom.authForm.querySelector('button[type="submit"]');
    const hint = document.getElementById('auth-setup-hint');
    const dict = () => TRANSLATIONS[STATE.language] || TRANSLATIONS.en;

    // No stored passcode on this device: the lock screen becomes "create a passcode".
    const renderMode = () => {
      const setup = !PasscodeManager.hasPasscode();
      confirmField.hidden = !setup;
      confirmInput.required = setup;
      hint.hidden = !setup;
      label.setAttribute('data-i18n', setup ? 'auth_setup_label' : 'auth_label');
      submit.setAttribute('data-i18n', setup ? 'auth_setup_btn' : 'auth_unlock');
      label.textContent = dict()[label.getAttribute('data-i18n')];
      submit.textContent = dict()[submit.getAttribute('data-i18n')];
      this.dom.passcode.setAttribute('autocomplete', setup ? 'new-password' : 'current-password');
    };

    const unlock = () => {
      STATE.authenticated = true;
      this.dom.authError.textContent = "";
      this.dom.authPortal.classList.add('hidden');
      this.dom.appContainer.classList.remove('hidden');
      this.loadDashboard();
    };

    renderMode();
    if (sessionStorage.getItem('hrt_session') === 'unlocked') {
      unlock();
    } else {
      this.dom.authPortal.classList.remove('hidden');
      this.dom.appContainer.classList.add('hidden');
    }

    this.dom.togglePassword.addEventListener('click', () => {
      const show = this.dom.passcode.getAttribute('type') === 'password';
      this.dom.passcode.setAttribute('type', show ? 'text' : 'password');
      this.dom.togglePassword.setAttribute('aria-pressed', String(show));
    });

    this.dom.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const entered = this.dom.passcode.value;
      let ok = false;
      if (!PasscodeManager.hasPasscode()) {
        if (entered.length < 4) {
          this.dom.authError.textContent = dict().passcode_too_short;
          return;
        }
        if (entered !== confirmInput.value) {
          this.dom.authError.textContent = dict().passcode_mismatch;
          return;
        }
        await PasscodeManager.set(entered);
        ok = true;
      } else {
        ok = await PasscodeManager.verify(entered);
      }
      this.dom.passcode.value = "";
      confirmInput.value = "";
      if (ok) {
        sessionStorage.setItem('hrt_session', 'unlocked');
        renderMode();
        unlock();
      } else {
        this.dom.authError.textContent = dict().auth_error;
        this.dom.passcode.focus();
      }
    });

    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.authenticated = false;
        sessionStorage.removeItem('hrt_session');
        renderMode();
        this.dom.appContainer.classList.add('hidden');
        this.dom.authPortal.classList.remove('hidden');
        this.dom.passcode.focus();
      });
    });
  },

  loadDashboard() {
    StorageManager.loadDatabase();
    StorageManager.loadJournal();
    StorageManager.loadFinance();
    StorageManager.loadCalendar();
    this.setupMonthSelector();
    this.updateStreakDisplay();
    this.loadDateData();
    this.renderNotionGrid();
    this.renderAnalytics();
    this.renderHeatmap();
    SyncEngine.sync();
  },

  // Re-read storage after a sync brought in changes from another device.
  refreshAfterSync() {
    StorageManager.loadDatabase();
    StorageManager.loadJournal();
    StorageManager.loadFinance();
    StorageManager.loadCalendar();
    this.setupMonthSelector();
    this.updateStreakDisplay();
    this.loadDateData();
    this.renderNotionGrid();
    this.renderAnalytics();
    this.renderHeatmap();
    this.renderFinance();
    this.renderCalendar();
    // Do not overwrite a journal entry that is being typed.
    const active = document.activeElement;
    if (!(active && active.closest && active.closest('#journal-form'))) this.renderJournal();
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

  showTab(targetTab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetTab);
    });
    // On mobile the calendar is reached through "More".
    if (targetTab === 'calendar-tab') {
      document.querySelectorAll('.tabbar .tab-btn[data-tab="settings-tab"]').forEach(b => b.classList.add('active'));
    }
    this.dom.tabPanes.forEach(pane => pane.classList.toggle('active-pane', pane.id === targetTab));
    window.scrollTo(0, 0);

    if (targetTab === 'today-tab') {
      this.renderToday();
    } else if (targetTab === 'progress-tab') {
      this.renderNotionGrid();
      this.renderAnalytics();
      this.renderHeatmap();
      // Show the most recent weeks first (scroll offsets are negative in RTL).
      const scroller = document.querySelector('.heatmap-scroll');
      if (scroller) scroller.scrollLeft = document.documentElement.dir === 'rtl' ? -scroller.scrollWidth : scroller.scrollWidth;
    } else if (targetTab === 'journal-tab') {
      this.renderJournal();
    } else if (targetTab === 'finance-tab') {
      this.renderFinance();
    } else if (targetTab === 'calendar-tab') {
      this.renderCalendar();
      const token = this.getGoogleAccessTokenSync();
      if (token && !this._isSyncingCalendar) {
        this._isSyncingCalendar = true;
        this.syncGoogleCalendar(token).finally(() => { this._isSyncingCalendar = false; });
      }
    } else if (targetTab === 'settings-tab') {
      this.renderSyncStatus();
    }
  },

  setupNavigation() {
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.getAttribute('data-tab')));
    });
    document.querySelectorAll('.tab-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.getAttribute('data-target-tab')));
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
    this.dom.todayBtn.hidden = key === formatDateKey(STATE.todayDate);

    const dayData = StorageManager.getDayState(key);
    this.dom.taskCheckboxes.forEach(cb => {
      cb.checked = !!dayData[cb.getAttribute('data-key')];
    });

    this.updateProgressRing(dayData);
    this.renderToday();
    this.highlightActiveGridRow(key);
    this.highlightActiveHeatmapCell(key);
  },

  updateProgressRing(dayData) {
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const percentage = StreakEngine.calculateDailyPercentage(dayData);
    const done = ROUTINE_KEYS.filter(k => dayData[k] === true).length;

    this.dom.progressPercent.textContent = `${percentage}%`;
    const circle = this.dom.progressCircle;
    const circ = 2 * Math.PI * Number(circle.getAttribute('r'));
    circle.style.strokeDasharray = `${circ} ${circ}`;
    circle.style.strokeDashoffset = circ - (percentage / 100) * circ;
    circle.classList.toggle('is-perfect', percentage === 100);

    let message = dict.inspire_welcome;
    if (percentage === 100) message = dict.inspire_perfect;
    else if (percentage >= 70) message = dict.inspire_almost;
    else if (percentage >= 40) message = dict.inspire_solid;
    else if (percentage > 0) message = dict.inspire_small;
    document.getElementById('daily-status-inspirational').textContent = message;
    document.getElementById('day-count-text').textContent =
      dict.day_count.replace('{done}', done).replace('{total}', ROUTINE_KEYS.length);

    this.updateSectionCounts(dayData);
  },

  // Section counters ("3 / 14") and per-prayer status ("done" / "1 left").
  updateSectionCounts(dayData) {
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    document.querySelectorAll('[data-count-keys]').forEach(el => {
      const keys = el.getAttribute('data-count-keys').split(',');
      const done = keys.filter(k => dayData[k] === true).length;
      if (el.classList.contains('prayer-status')) {
        const left = keys.length - done;
        el.classList.toggle('is-done', left === 0);
        if (left === 0) el.textContent = dict.status_done;
        else if (done === 0) el.textContent = '';
        else el.textContent = dict.status_left.replace('{n}', left);
      } else {
        el.textContent = `${done} / ${keys.length}`;
      }
    });
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
    
    // Range: earliest month with data (or the selected month, if earlier) up to the current month.
    const earliest = getEarliestActiveDate() || STATE.todayDate;
    const [selY, selM] = STATE.selectedMonth.split('-').map(Number);
    let rangeStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const selectedStart = new Date(selY, selM - 1, 1);
    if (selectedStart < rangeStart) rangeStart = selectedStart;
    const currentLimit = new Date(STATE.todayDate.getFullYear(), STATE.todayDate.getMonth(), 1);

    selectors.forEach(select => {
      select.innerHTML = "";
      const temp = new Date(rangeStart);

      const locale = appLocale();
      
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

      select.value = STATE.selectedMonth;
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


  setupSyncSettings() {
    const dict = () => TRANSLATIONS[STATE.language] || TRANSLATIONS.en;

    document.getElementById('sync-connect-btn').addEventListener('click', async () => {
      try {
        await this.connectGoogleCalendar();
      } catch (e) {
        SyncEngine.setState('error', e.message);
      }
    });
    document.getElementById('sync-now-btn').addEventListener('click', () => SyncEngine.sync());
    document.getElementById('sync-disconnect-btn').addEventListener('click', () => {
      if (!confirm(dict().sync_disconnect_confirm)) return;
      SyncEngine.disconnect();
      // Cached Google Calendar events belong to the account; local data stays.
      STATE.calendar = STATE.calendar.filter(evt => evt.isLocal);
      StorageManager.saveCalendar();
      this.refreshGoogleButton();
      this.renderCalendar();
      this.renderToday();
    });

    this.renderSyncStatus();
  },

  renderSyncStatus() {
    const text = document.getElementById('sync-status-text');
    if (!text) return;
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const enabled = SyncEngine.isEnabled();
    const last = parseInt(localStorage.getItem(SyncEngine.LAST_KEY) || '0', 10);

    let state = enabled ? SyncEngine.state : 'off';
    if (enabled && state === 'off') state = last ? 'ok' : 'syncing';
    let message = dict[`sync_state_${state}`] || '';
    if (state === 'ok') {
      const time = new Date(last).toLocaleString(appLocale(), { dateStyle: 'medium', timeStyle: 'short' });
      message = last ? message.replace('{time}', time) : dict.sync_state_waiting;
    } else if (state === 'error') {
      message = message.replace('{error}', dict[SyncEngine.message] || SyncEngine.message || '');
    }

    text.textContent = message;
    document.getElementById('sync-status').className = `sync-state sync-state--${state}`;
    document.getElementById('sync-connect-btn').hidden = enabled;
    document.getElementById('sync-controls').hidden = !enabled;
  },

  setupPasscodeSettings() {
    const form = document.getElementById('passcode-change-form');
    if (!form) return;
    const current = document.getElementById('passcode-current');
    const next = document.getElementById('passcode-new');
    const confirmInput = document.getElementById('passcode-confirm');
    const status = document.getElementById('passcode-change-status');

    const show = (key, ok) => {
      const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
      status.textContent = dict[key];
      status.className = `sync-status-msg ${ok ? 'status-success' : 'status-error'}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (next.value.length < 4) return show('passcode_too_short', false);
      if (next.value !== confirmInput.value) return show('passcode_mismatch', false);
      if (!(await PasscodeManager.verify(current.value))) return show('passcode_wrong_current', false);
      await PasscodeManager.set(next.value);
      form.reset();
      show('passcode_changed', true);
    });
  },

  setupBackupSettings() {
    const status = document.getElementById('backup-status');
    const undoBtn = document.getElementById('backup-undo-btn');
    const fileInput = document.getElementById('backup-file-input');
    const pasteInput = document.getElementById('backup-paste-input');
    if (!status) return;
    const t = () => TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const show = (text, ok) => {
      status.textContent = text;
      status.className = `sync-status-msg ${ok ? 'status-success' : 'status-error'}`;
    };
    undoBtn.hidden = !BackupManager.hasUndo();

    document.getElementById('backup-download-btn').addEventListener('click', () => {
      BackupManager.download();
      show(t().backup_downloaded, true);
    });

    document.getElementById('backup-copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(BackupManager.toJSON());
        show(t().backup_copied, true);
      } catch (e) {
        show(t().backup_copy_failed, false);
      }
    });

    const restoreFromText = (text) => {
      let parsed;
      try {
        parsed = BackupManager.parse(text);
      } catch (e) {
        return show(t()[e.message] || t().backup_invalid, false);
      }
      const s = parsed.summary;
      const msg = t().backup_confirm
        .replace('{days}', s.days).replace('{journal}', s.journal)
        .replace('{transactions}', s.transactions).replace('{events}', s.events);
      if (!confirm(msg)) return;
      BackupManager.restore(parsed.backup);
      SyncEngine.stampAll();
      location.reload();
    };

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      file.text().then(restoreFromText);
      fileInput.value = '';
    });

    document.getElementById('backup-paste-btn').addEventListener('click', () => {
      restoreFromText(pasteInput.value.trim());
    });

    undoBtn.addEventListener('click', () => {
      if (!confirm(t().backup_undo_confirm)) return;
      BackupManager.undo();
      SyncEngine.stampAll();
      location.reload();
    });
  },


  renderHeatmap() {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;
    container.innerHTML = "";

    // 365 days ending today, aligned to start on a Monday.
    const endDate = new Date(STATE.todayDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - (startDate.getDay() + 6) % 7);

    const activeKey = formatDateKey(STATE.activeDate);
    const dateFormat = { day: 'numeric', month: 'short', year: 'numeric' };

    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      const day = new Date(cursor);
      const key = formatDateKey(day);
      const pct = STATE.db[key] ? StreakEngine.calculateDailyPercentage(STATE.db[key]) : 0;

      const cell = document.createElement('div');
      cell.className = `heatmap-cell ${scoreClass(pct)}${key === activeKey ? ' is-active' : ''}`;
      cell.setAttribute('data-date-key', key);
      cell.title = `${day.toLocaleDateString(appLocale(), dateFormat)}: ${pct}%`;
      cell.addEventListener('click', () => {
        STATE.activeDate = day;
        this.loadDateData();
        this.showTab('today-tab');
      });
      container.appendChild(cell);
    }
  },

  highlightActiveHeatmapCell(activeKey) {
    document.querySelectorAll('.heatmap-cell').forEach(cell => {
      cell.classList.toggle('is-active', cell.getAttribute('data-date-key') === activeKey);
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
      const dayData = (STATE.db[key] || {});
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
      
      const hijriStr = CalendarEngine.getHijriStringShort(day);
      
      const tr = document.createElement('tr');
      tr.setAttribute('data-date-key', key);
      
      const activeKey = formatDateKey(STATE.activeDate);
      const todayKey = formatDateKey(STATE.todayDate);
      tr.className = `${key === activeKey ? 'active-row' : ''} ${key > todayKey ? 'is-future' : ''}`.trim();
      
      tr.innerHTML = `
        <td class="col-date">
          ${day.toLocaleDateString(appLocale(), { day: '2-digit', month: 'short', weekday: 'short' })}
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
        
        this.showTab('today-tab');
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
        const dayData = (STATE.db[key] || {});
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
        if (key === activeKey) cell.classList.add('active-day');
        if (key === formatDateKey(STATE.todayDate)) cell.classList.add('is-today');

        cell.textContent = day.getDate();

        cell.addEventListener('click', () => {
          STATE.activeDate = new Date(day);
          this.loadDateData();
          
          this.showTab('today-tab');
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
    const todayKey = formatDateKey(STATE.todayDate);
    const days = CalendarEngine.getDaysInMonth(year, month - 1).filter(d => formatDateKey(d) <= todayKey);
    const N = days.length;

    let totalScoreSum = 0;
    let perfectDaysCount = 0;
    
    // Accumulate individual habit success rates
    const habitSuccessCounts = {};
    ROUTINE_KEYS.forEach(key => habitSuccessCounts[key] = 0);

    const scoresList = [];

    days.forEach(day => {
      const key = formatDateKey(day);
      const dayData = (STATE.db[key] || {});
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

    if (focusHabitKey && maxPct > 0) {
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

    // Draw at the real container width so text stays readable on phones.
    const W = Math.max(280, container.clientWidth || 600);
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
      const x = paddingLeft + (N > 1 ? i / (N - 1) : 0.5) * graphWidth;
      const y = paddingTop + graphHeight - (score / 100) * graphHeight;
      points.push({ x, y, score, dayNum: i + 1, key: formatDateKey(days[i]) });
    }

    // Start drawing SVG
    let svgContent = `
      <svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%">

        <!-- Horizontal Grid Lines (100%, 50%, 0%) -->
        <!-- 100% line -->
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${W - paddingRight}" y2="${paddingTop}" class="chart-grid-line" />
        <text x="${paddingLeft - 10}" y="${paddingTop + 4}" class="chart-axis-text" text-anchor="end">100%</text>

        <!-- 50% line -->
        <line x1="${paddingLeft}" y1="${paddingTop + graphHeight/2}" x2="${W - paddingRight}" y2="${paddingTop + graphHeight/2}" class="chart-grid-line" />
        <text x="${paddingLeft - 10}" y="${paddingTop + graphHeight/2 + 4}" class="chart-axis-text" text-anchor="end">50%</text>

        <!-- 0% line -->
        <line x1="${paddingLeft}" y1="${paddingTop + graphHeight}" x2="${W - paddingRight}" y2="${paddingTop + graphHeight}" class="chart-grid-line" />
        <text x="${paddingLeft - 10}" y="${paddingTop + graphHeight + 4}" class="chart-axis-text" text-anchor="end">0%</text>
    `;

    // Draw area path (shadow)
    if (points.length > 0) {
      let areaD = `M ${points[0].x} ${paddingTop + graphHeight} `;
      points.forEach(p => {
        areaD += `L ${p.x} ${p.y} `;
      });
      areaD += `L ${points[points.length - 1].x} ${paddingTop + graphHeight} Z`;
      svgContent += `<path d="${areaD}" class="chart-path-area" />`;
    }

    // Draw main stroke line path
    if (points.length > 0) {
      let lineD = `M ${points[0].x} ${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        lineD += `L ${points[i].x} ${points[i].y} `;
      }
      svgContent += `<path d="${lineD}" fill="none" class="chart-path-line" />`;
    }

    // Draw dots for each day
    points.forEach(p => {
      svgContent += `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" class="chart-point" data-date="${p.key}">
          <title>${p.key}: ${p.score}%</title>
        </circle>
      `;
    });

    // Draw X-axis labels (Day 1, Day 10, Day 20, Day 30)
    const step = Math.max(1, Math.ceil(N / 4));
    for (let i = 0; i < N; i += step) {
      const p = points[i];
      if (p) {
        svgContent += `
          <text x="${p.x}" y="${paddingTop + graphHeight + 18}" class="chart-axis-text" text-anchor="middle">${p.dayNum}</text>
        `;
      }
    }
    // Always draw last day if not drawn
    if (N > 1 && (N - 1) % step !== 0) {
      const p = points[N - 1];
      svgContent += `
        <text x="${p.x}" y="${paddingTop + graphHeight + 18}" class="chart-axis-text" text-anchor="middle">${p.dayNum}</text>
      `;
    }

    svgContent += `</svg>`;
    container.innerHTML = svgContent;

    // Attach click triggers to points so clicking a chart dot jumps to that date in the tracker!
    container.querySelectorAll('.chart-point').forEach(dot => {
      dot.addEventListener('click', () => {
        const dateStr = dot.getAttribute('data-date');
        STATE.activeDate = parseDateKey(dateStr);
        this.loadDateData();
        
        this.showTab('today-tab');
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


  // Verse of the day and the three quick stats on the Today screen.
  renderToday() {
    const activeKey = formatDateKey(STATE.activeDate);
    const ayah = getAyahOfTheDay(activeKey);
    document.getElementById('ayah-arabic').textContent = ayah.arabic;
    document.getElementById('ayah-translation').textContent = { tr: ayah.tr, ar: ayah.tafsir }[STATE.language] || ayah.en;
    document.getElementById('ayah-source').textContent = ayah[`source_${STATE.language}`] || ayah.source_en;

    const yesterday = new Date(STATE.todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const yesterdayData = STATE.db[yesterdayKey];
    document.getElementById('brief-yesterday-score').textContent =
      yesterdayData ? `${StreakEngine.calculateDailyPercentage(yesterdayData)}%` : '–';

    const spent = STATE.finance.transactions
      .filter(tx => tx.date === yesterdayKey && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    document.getElementById('brief-yesterday-spending').textContent = formatMoney(spent, 0);

    const todayKey = formatDateKey(STATE.todayDate);
    document.getElementById('brief-today-events').textContent = STATE.calendar.filter(e => e.date === todayKey).length;
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

    // Picking another date loads that day's entry
    this.dom.journalDateInput.addEventListener('change', () => {
      if (!this.dom.journalDateInput.value) return;
      STATE.activeDate = parseDateKey(this.dom.journalDateInput.value);
      this.loadDateData();
      this.renderJournal();
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
        this.dom.journalDeleteBtn.hidden = true;
      });
    }

    // Handle delete button
    if (this.dom.journalDeleteBtn) {
      this.dom.journalDeleteBtn.addEventListener('click', () => {
        const dateKey = this.dom.journalDateInput.value;
        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        if (STATE.journal[dateKey] && confirm(dict.journal_delete_confirm)) {
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
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const activeDateKey = formatDateKey(STATE.activeDate);
    this.dom.journalActiveDateDisplay.textContent = CalendarEngine.getGregorianString(STATE.activeDate);
    this.dom.journalDateInput.value = activeDateKey;

    const moodMap = { "🤩": "awesome", "🙂": "good", "😐": "neutral", "😴": "tired", "😔": "bad" };
    const entry = STATE.journal[activeDateKey];
    const activeMood = entry ? entry.mood : "😐";

    this.dom.journalContentInput.value = entry ? entry.content : '';
    this.dom.journalTagsInput.value = entry ? (entry.tags || '') : '';
    this.dom.journalDeleteBtn.hidden = !entry;
    document.querySelectorAll('.mood-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mood') === activeMood);
    });
    document.querySelector('.journal-editor-panel').setAttribute('data-active-mood', moodMap[activeMood] || 'neutral');

    const list = this.dom.journalHistoryList;
    list.innerHTML = '';
    const sortedKeys = Object.keys(STATE.journal).sort().reverse();
    if (sortedKeys.length === 0) {
      list.innerHTML = `<div class="empty-state">${dict.journal_empty}</div>`;
      return;
    }

    sortedKeys.forEach(k => {
      const item = STATE.journal[k];
      const content = item.content || '';
      const tags = (item.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const tagsHtml = tags.length
        ? tags.map(t => `<span class="journal-item-tag">${escapeHTML(t)}</span>`).join('')
        : `<span class="journal-item-tag">${dict.journal_no_tags}</span>`;

      const row = document.createElement('div');
      row.className = `journal-list-item ${k === activeDateKey ? 'active' : ''}`;
      row.setAttribute('data-mood-type', moodMap[item.mood] || 'neutral');
      row.innerHTML = `
        <div class="item-header">
          <span>${parseDateKey(k).toLocaleDateString(appLocale(), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span class="item-mood">${escapeHTML(item.mood || '')}</span>
        </div>
        <h4>${escapeHTML(content.substring(0, 60))}${content.length > 60 ? '…' : ''}</h4>
        <div class="item-tags-container">${tagsHtml}</div>
      `;
      row.addEventListener('click', () => {
        STATE.activeDate = parseDateKey(k);
        this.loadDateData();
        this.renderJournal();
      });
      list.appendChild(row);
    });
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
          description: description || (TRANSLATIONS[STATE.language] || TRANSLATIONS.en)[catInfo(category, selectedType).id] || category
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
        this.renderToday();
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

    // 7. Amount keypad
    const txKeypadEl = document.getElementById('fin-tx-keypad');
    if (this.dom.finAmountInput && txKeypadEl) {
      setupKeypad(this.dom.finAmountInput, txKeypadEl, () => {
        if (this.dom.financeForm) this.dom.financeForm.requestSubmit();
      });
    }

    // 8. Add/Edit Account Modal Controls
    const addAccountBtn = document.getElementById('fin-add-account-btn');
    const accountModal = document.getElementById('fin-account-modal');
    const accountForm = document.getElementById('finance-account-form');
    const accountModalClose = document.getElementById('fin-account-modal-close');
    const accountModalCancel = document.getElementById('fin-account-cancel-btn');
    const accountModalDelete = document.getElementById('fin-account-delete-btn');
    const accountKeyInput = document.getElementById('fin-account-key-hidden');
    const accountNameInput = document.getElementById('fin-account-name-input');
    const accountBalanceInput = document.getElementById('fin-account-balance-input');
    const accountIconInput = document.getElementById('fin-account-icon-input');

    const closeAccountModal = () => {
      if (accountModal) accountModal.classList.remove('active');
    };

    if (accountModalClose) accountModalClose.addEventListener('click', closeAccountModal);
    if (accountModalCancel) accountModalCancel.addEventListener('click', closeAccountModal);
    if (accountModal) {
      accountModal.addEventListener('click', (e) => {
        if (e.target === accountModal) closeAccountModal();
      });
    }

    // Emoji/Icon Grid Interaction
    const emojiBtns = accountModal ? accountModal.querySelectorAll('.emoji-btn') : [];
    emojiBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        emojiBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (accountIconInput) accountIconInput.value = btn.getAttribute('data-emoji');
      });
    });

    // Opening modal for Add Account
    if (addAccountBtn && accountModal) {
      addAccountBtn.addEventListener('click', () => {
        if (accountKeyInput) accountKeyInput.value = ''; // empty means create new
        if (accountNameInput) accountNameInput.value = '';
        if (accountBalanceInput) accountBalanceInput.value = '';
        if (accountIconInput) accountIconInput.value = '💰';
        
        // Reset emoji active class
        emojiBtns.forEach(b => {
          if (b.getAttribute('data-emoji') === '💰') b.classList.add('active');
          else b.classList.remove('active');
        });

        // Set title
        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        const titleEl = document.getElementById('fin-account-modal-title');
        if (titleEl) titleEl.textContent = dict.fin_add_account || 'Add Account';
        
        if (accountModalDelete) accountModalDelete.hidden = true;
        accountModal.classList.add('active');
        setTimeout(() => { if (accountNameInput) accountNameInput.focus(); }, 150);
      });
    }

    // Form submit handler (Create / Edit)
    if (accountForm) {
      accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const key = accountKeyInput.value;
        const name = accountNameInput.value.trim();
        const rawBalance = (accountBalanceInput.value || '').replace(/\s/g, '').replace(',', '.');
        const balance = parseFloat(rawBalance);
        const icon = accountIconInput.value || '💰';

        if (!name) {
          accountNameInput.focus();
          accountNameInput.style.borderColor = 'var(--danger)';
          setTimeout(() => { accountNameInput.style.borderColor = ''; }, 1500);
          return;
        }
        if (isNaN(balance)) {
          accountBalanceInput.focus();
          accountBalanceInput.style.borderColor = 'var(--danger)';
          setTimeout(() => { accountBalanceInput.style.borderColor = ''; }, 1500);
          return;
        }

        if (key) {
          if (STATE.finance.accounts[key]) {
            STATE.finance.accounts[key].name = name;
            STATE.finance.accounts[key].balance = balance;
            STATE.finance.accounts[key].icon = icon;
          }
        } else {
          const newKey = 'acc_' + Date.now();
          STATE.finance.accounts[newKey] = { name, balance, icon };
        }

        StorageManager.saveFinance();
        AudioFeedback.playSuccess();
        this.renderFinance();
        this.renderToday();
        closeAccountModal();
      });
    }

    // Delete Button handler
    if (accountModalDelete) {
      accountModalDelete.addEventListener('click', () => {
        const key = accountKeyInput.value;
        if (!key || !STATE.finance.accounts[key]) return;

        const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
        const confirmMsg = dict.fin_confirm_delete_account || 'Are you sure you want to delete this account?';
        if (confirm(confirmMsg)) {
          delete STATE.finance.accounts[key];
          StorageManager.saveFinance();
          AudioFeedback.playSuccess();
          this.renderFinance();
          this.renderToday();
          closeAccountModal();
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
      const accountsMarkup = Object.keys(STATE.finance.accounts).map(k => {
        const acc = STATE.finance.accounts[k];
        // acc.name is always the authoritative name (user-editable)
        return `<option value="${escapeHTML(k)}">${escapeHTML(acc.name)} (${acc.balance.toFixed(0)} TL)</option>`;
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

    const localeCode = appLocale();
    document.getElementById('fin-daily-summary-income').textContent = `${totalIncome.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;
    document.getElementById('fin-daily-summary-expense').textContent = `${totalExpense.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;
    document.getElementById('fin-daily-summary-total').textContent = `${netTotal.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;

    const sortedDates = Object.keys(grouped).sort().reverse();
    if (sortedDates.length === 0) {
      dailyList.innerHTML = `<div class="empty-state">${dict.finance_empty || 'No transactions recorded for this month.'}</div>`;
      return;
    }

    sortedDates.forEach(dateStr => {
      const txs = grouped[dateStr];
      const dayIncome = txs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
      const dayExpense = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

      // Parse date to show day of week
      const dateObj = parseDateKey(dateStr);
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
      if (dayIncome > 0) headerSums += `<span class="day-income">+${dayIncome.toLocaleString(appLocale(), { maximumFractionDigits: 0 })}</span>`;
      if (dayExpense > 0) headerSums += `<span class="day-expense">-${dayExpense.toLocaleString(appLocale(), { maximumFractionDigits: 0 })}</span>`;

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
              <span class="fin-daily-tx-desc">${escapeHTML(tx.description)}</span>
              <div class="fin-daily-tx-sub">
                <span class="acc-tag">${escapeHTML(localizedAccName)}${tx.targetAccount ? ' → ' + escapeHTML(localizedTargetName) : ''}</span>
                <span>${escapeHTML(localizedCatLabel)}</span>
              </div>
            </div>
          </div>
          <div class="fin-daily-tx-right">
            <span class="fin-daily-tx-amount ${amtClass}" dir="ltr">${amtPrefix}${formatMoney(tx.amount)}</span>
            <button type="button" class="fin-daily-tx-delete-btn" aria-label="${dict.journal_delete}">&times;</button>
          </div>
        `;

        itemEl.querySelector('.fin-daily-tx-delete-btn').addEventListener('click', () => {
          if (confirm(dict.fin_delete_tx_confirm || 'Are you sure you want to delete this transaction?')) {
            if (tx.type === 'expense') {
              if (STATE.finance.accounts[tx.account]) {
                STATE.finance.accounts[tx.account].balance += tx.amount;
              }
            } else if (tx.type === 'income') {
              if (STATE.finance.accounts[tx.account]) {
                STATE.finance.accounts[tx.account].balance -= tx.amount;
              }
            } else if (tx.type === 'transfer') {
              if (STATE.finance.accounts[tx.account]) {
                STATE.finance.accounts[tx.account].balance += tx.amount;
              }
              if (STATE.finance.accounts[tx.targetAccount]) {
                STATE.finance.accounts[tx.targetAccount].balance -= tx.amount;
              }
            }

            STATE.finance.transactions = STATE.finance.transactions.filter(x => x.id !== tx.id);
            StorageManager.saveFinance();
            AudioFeedback.playSuccess();
            this.renderFinance();
            this.renderToday();
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
    const localeCode = appLocale();
    if (centerPercent) {
      centerPercent.textContent = `${totalSum.toLocaleString(localeCode, {maximumFractionDigits:0})} TL`;
    }

    if (totalSum === 0) {
      categoryList.innerHTML = `<div class="empty-state">${dict.finance_empty || 'No transactions recorded.'}</div>`;
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
    const localeCode = appLocale();
    
    document.getElementById('fin-accounts-total-balance').textContent = `${totalBalance.toLocaleString(localeCode, {minimumFractionDigits:2})} TL`;

    const accountIcons = {
      cash: "👛",
      bank: "🏦",
      credit: "💳",
      business: "💼"
    };

    Object.keys(STATE.finance.accounts).forEach(k => {
      const acc = STATE.finance.accounts[k];
      // acc.name is the authoritative name — user edits update it directly.
      // Dict translations are ONLY for brand-new installs where acc.name hasn't been set yet.
      const localizedAccName = acc.name || dict[`acc_${k}`] || k;
      const emoji = acc.icon || accountIcons[k] || "💰";

      const card = document.createElement('div');
      // Built-in accounts use their key as CSS class; dynamic ones get 'custom-acc' + color rotation
      const builtInClasses = ['cash', 'bank', 'credit', 'business'];
      const cardClass = builtInClasses.includes(k) ? k : `custom-acc acc-color-${Object.keys(STATE.finance.accounts).indexOf(k) % 4}`;
      card.className = `account-card ${cardClass}`;
      
      card.innerHTML = `
        <div class="account-card-header">
          <span class="acc-title">${escapeHTML(localizedAccName)}</span>
          <span class="acc-icon">${escapeHTML(emoji)}</span>
        </div>
        <div class="account-card-body">
          <span class="acc-balance">${acc.balance.toLocaleString(localeCode, {minimumFractionDigits:2})} TL</span>
        </div>
        <div class="account-card-footer">
          <button class="account-card-edit-btn">${dict.fin_edit_account || 'Edit Account'}</button>
        </div>
      `;

      card.querySelector('.account-card-edit-btn').addEventListener('click', () => {
        const titleEl = document.getElementById('fin-account-modal-title');
        if (titleEl) {
          titleEl.textContent = dict.fin_edit_account || 'Edit Account';
        }
        
        const accountKeyInput = document.getElementById('fin-account-key-hidden');
        const accountNameInput = document.getElementById('fin-account-name-input');
        const accountBalanceInput = document.getElementById('fin-account-balance-input');
        const accountIconInput = document.getElementById('fin-account-icon-input');
        const accountModalDelete = document.getElementById('fin-account-delete-btn');
        const accountModal = document.getElementById('fin-account-modal');

        if (accountKeyInput) accountKeyInput.value = k;
        // acc.name is authoritative — show what's actually stored
        if (accountNameInput) accountNameInput.value = acc.name;
        if (accountBalanceInput) accountBalanceInput.value = acc.balance;
        if (accountIconInput) accountIconInput.value = emoji;

        // Set matching emoji class active
        const emojiBtns = accountModal ? accountModal.querySelectorAll('.emoji-btn') : [];
        emojiBtns.forEach(b => {
          if (b.getAttribute('data-emoji') === emoji) b.classList.add('active');
          else b.classList.remove('active');
        });

        if (accountModalDelete) accountModalDelete.hidden = false;
        if (accountModal) {
          accountModal.classList.add('active');
          setTimeout(() => accountNameInput.focus(), 150);
        }
      });

      grid.appendChild(card);
    });
  },

  // --- Google account: one sign-in for Drive sync and Google Calendar ---
  setupGoogleSettings() {
    const btn = document.getElementById('google-auth-btn');
    if (!btn) return;
    this.refreshGoogleButton();
    btn.addEventListener('click', async () => {
      try {
        await this.connectGoogleCalendar();
      } catch (e) {
        SyncEngine.setState('error', e.message);
        alert((TRANSLATIONS[STATE.language] || TRANSLATIONS.en)[e.message] || e.message);
      }
    });
  },

  refreshGoogleButton() {
    const btn = document.getElementById('google-auth-btn');
    if (btn) {
      btn.textContent = (TRANSLATIONS[STATE.language] || TRANSLATIONS.en).sync_connect;
      btn.hidden = SyncEngine.isEnabled();
    }
    this.renderSyncStatus();
  },

  getGoogleAccessTokenSync() {
    return SyncEngine.hasCalendarScope() ? SyncEngine.cachedToken() : null;
  },

  clearGoogleToken() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    this.refreshGoogleButton();
  },

  // Kept async for existing callers; never talks to the network.
  async getGoogleAccessToken() {
    return this.getGoogleAccessTokenSync();
  },

  // Connect Google once (must be called from a click); enables Drive sync and Calendar.
  async connectGoogleCalendar() {
    if (!window.google || !google.accounts || !google.accounts.oauth2) {
      throw new Error('sync_error_gis');
    }
    await SyncEngine.connect();
    this.refreshGoogleButton();
    const token = this.getGoogleAccessTokenSync();
    if (token) this.syncGoogleCalendar(token);
  },


  setupCalendarTab() {
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
        this.renderToday();
      });
    }

    // Automatically trigger calendar sync in the background on load
    this.getGoogleAccessToken().then(token => {
      if (token) {
        this.syncGoogleCalendar(token);
      }
    });
  },

  async syncGoogleCalendar(accessToken) {
    const lang = STATE.language || 'en';
    const statusEl = document.getElementById('calendar-sync-status');
    
    const showStatus = (msg, type) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.hidden = false;
      statusEl.className = `status status-${type === 'info' ? 'loading' : type}`;
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
          localStorage.removeItem('google_token_expiry');
          this.refreshGoogleButton();
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
          title: item.summary || (TRANSLATIONS[lang] || TRANSLATIONS.en).calendar_untitled,
          startTime: startTime,
          endTime: endTime,
          desc: item.location || item.description || '',
          date: activeDateKey,
          isLocal: false
        };
      });

      STATE.calendar = [...STATE.calendar, ...googleEvents];
      StorageManager.saveCalendar();
      this.renderCalendar();
      this.renderToday();

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
    const dict = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
    const activeDateKey = formatDateKey(STATE.activeDate);

    const dayLabel = document.getElementById('calendar-active-day');
    if (dayLabel) dayLabel.textContent = CalendarEngine.getGregorianString(STATE.activeDate);

    const container = this.dom.calendarTimelineEvents;
    if (!container) return;
    container.innerHTML = '';

    const events = STATE.calendar
      .filter(e => e.date === activeDateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (events.length === 0) {
      container.innerHTML = `<p class="timeline-empty">${dict.calendar_empty}</p>`;
      return;
    }

    // Show the span of hours from the first to the last event, whatever time of day they are.
    const hours = events.map(e => parseInt(e.startTime, 10));
    for (let h = Math.min(...hours); h <= Math.max(...hours); h++) {
      const hourStr = String(h).padStart(2, '0');
      const row = document.createElement('div');
      row.className = 'timeline-hour-row';
      row.innerHTML = `<div class="timeline-hour-label">${hourStr}:00</div><div class="timeline-events-placeholder"></div>`;
      const slot = row.querySelector('.timeline-events-placeholder');

      events.filter(e => e.startTime.startsWith(hourStr)).forEach(e => {
        const card = document.createElement('div');
        card.className = 'timeline-event-card';
        card.innerHTML = `
          <div class="event-info">
            <h4>${escapeHTML(e.title)}</h4>
            ${e.desc ? `<p>${escapeHTML(e.desc)}</p>` : ''}
          </div>
          <div class="event-meta">
            <span class="event-time" dir="ltr">${escapeHTML(e.startTime)} – ${escapeHTML(e.endTime)}</span>
            ${e.isLocal ? `<button type="button" class="delete-event-btn" aria-label="${dict.journal_delete}">×</button>` : ''}
          </div>
        `;
        if (e.isLocal) {
          card.querySelector('.delete-event-btn').addEventListener('click', () => {
            STATE.calendar = STATE.calendar.filter(x => x.id !== e.id);
            StorageManager.saveCalendar();
            this.renderCalendar();
            this.renderToday();
          });
        }
        slot.appendChild(card);
      });
      container.appendChild(row);
    }
  }
};

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();

  // Offline shell for the web version; the Capacitor app already ships its files locally.
  if ('serviceWorker' in navigator && !window.Capacitor && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker registration failed:', e));
  }
});
