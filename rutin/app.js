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
  calendar: [] // Loaded calendar events [{id, title, startTime, endTime, desc}]
};

// ================= SPIRITUAL BRIEFINGS =================
const AYAHS = [
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: '"Şüphesiz güçlükle beraber bir kolaylık vardır."', source: "İnşirâh Suresi, 5. Ayet" },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translation: '"Allah, hiç kimseye gücünün üstünde bir yük yüklemez."', source: "Bakara Suresi, 286. Ayet" },
  { arabic: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", translation: '"Rabbin seni terk etmedi ve sana darılmadı."', source: "Duhâ Suresi, 3. Ayet" },
  { arabic: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", translation: '"İnsan için ancak çalıştığının karşılığı vardır."', source: "Necm Suresi, 39. Ayet" },
  { arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ", translation: '"Benim başarım ancak Allah\'ın yardımıyladır. Yalnız O\'na tevekkül ettim."', source: "Hûd Suresi, 88. Ayet" },
  { arabic: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", translation: '"Sabret! Çünkü Allah iyilik yapanların mükafatını zayi etmez."', source: "Hûd Suresi, 115. Ayet" },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", translation: '"Bilesiniz ki, kalpler ancak Allah\'ı anmakla huzur bulur."', source: "Ra\'d Suresi, 28. Ayet" },
  { arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", translation: '"Eğer şükrederseniz, elbette size (nimetimi) artırırım."', source: "İbrâhîm Suresi, 7. Ayet" },
  { arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ", translation: '"Bana dua edin, size icabet edeyim."', source: "Mü\'min Suresi, 60. Ayet" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: '"Şüphesiz Allah sabredenlerle beraberdir."', source: "Bakara Suresi, 153. Ayet" }
];

function getAyahOfTheDay(dateKey) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = dateKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AYAHS.length;
  return AYAHS[idx];
}

// All 23 daily routine checkboxes tracked for 100% completion score
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

// Human-readable labels and category mappings for Analytics
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

// Helper to format Date objects to YYYY-MM-DD
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
    STATE.calendar = data ? JSON.parse(data) : [
      { id: "cal-1", title: "Firnas Team Sync 🚀", startTime: "09:30", endTime: "10:30", desc: "Daily coordination & tech reviews" },
      { id: "cal-2", title: "Project Review Meeting 🎯", startTime: "13:00", endTime: "14:15", desc: "Briefing new updates on Life OS" },
      { id: "cal-3", title: "Gym Session 🏋️", startTime: "18:00", endTime: "19:30", desc: "Chest day & cardio workout" }
    ];
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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  getHijriString(date) {
    try {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', options);
      return formatter.format(date) + ' AH';
    } catch (e) {
      return 'Hijri Calendar Error';
    }
  },

  getHijriStringShort(date) {
    try {
      const dayOpt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
      const monthOpt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric' });
      const day = dayOpt.format(date);
      const monthNum = parseInt(monthOpt.format(date), 10);
      
      const hijriMonths = [
        "Muharram", "Safar", "Rabi' I", "Rabi' II", 
        "Jumada I", "Jumada II", "Rajab", "Sha'ban", 
        "Ramadan", "Shawwal", "Dhu al-Q.", "Dhu al-H."
      ];
      
      const monthName = hijriMonths[(monthNum - 1) % 12] || "Hijri";
      return `${day} ${monthName}`;
    } catch (e) {
      return '';
    }
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

  init() {
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
      if (percentage === 100) {
        inspirationalEl.textContent = "🏆 Perfect Day! Outstanding job keeping the horizon clear!";
        inspirationalEl.style.borderLeftColor = "var(--primary-light)";
      } else if (percentage >= 70) {
        inspirationalEl.textContent = "🔥 Almost there! Just a few more routines to hit 100%!";
        inspirationalEl.style.borderLeftColor = "var(--success)";
      } else if (percentage >= 40) {
        inspirationalEl.textContent = "⚡ Solid progress. Keep pushing through the day!";
        inspirationalEl.style.borderLeftColor = "var(--accent-gold)";
      } else if (percentage > 0) {
        inspirationalEl.textContent = "🚀 Small steps build momentum. Complete another routine!";
        inspirationalEl.style.borderLeftColor = "var(--danger)";
      } else {
        inspirationalEl.textContent = "✨ Welcome! Start your day by checking off your first routine.";
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
      select.innerHTML = "";
      
      const startYear = 2026;
      const startMonth = 5; // June (0-indexed is 5)
      const currentLimit = new Date(STATE.todayDate);
      currentLimit.setMonth(currentLimit.getMonth() + 12);
      
      const temp = new Date(startYear, startMonth, 1);
      
      while (temp <= currentLimit) {
        const year = temp.getFullYear();
        const monthNum = temp.getMonth();
        const monthStr = String(monthNum + 1).padStart(2, '0');
        
        const option = document.createElement('option');
        option.value = `${year}-${monthStr}`;
        option.textContent = temp.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        select.appendChild(option);
        temp.setMonth(temp.getMonth() + 1);
      }
    });
    
    const activeY = STATE.activeDate.getFullYear();
    const activeM = String(STATE.activeDate.getMonth() + 1).padStart(2, '0');
    STATE.selectedMonth = `${activeY}-${activeM}`;
    
    selectors.forEach(select => {
      select.value = STATE.selectedMonth;
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
      if (confirm("Disconnect Supabase Sync? Your data will remain stored locally.")) {
        SupabaseManager.clearCredentials();
        refreshSyncUI();
        
        statusMsg.className = "sync-status-msg status-error";
        statusMsg.textContent = "Cloud Sync disconnected.";
        
        if (this.dom.inlineSyncStatus) {
          this.dom.inlineSyncStatus.className = "sync-status-msg status-error";
          this.dom.inlineSyncStatus.textContent = "Cloud Sync disconnected.";
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
    
    if (topHabitKey && maxPct > 0) {
      this.dom.kpiTopHabit.textContent = `${HABIT_ICONS[topHabitKey]} ${HABIT_DISPLAY_NAMES[topHabitKey]} (${maxPct}%)`;
    } else {
      this.dom.kpiTopHabit.textContent = "None yet";
    }

    if (focusHabitKey) {
      this.dom.kpiFocusHabit.textContent = `${HABIT_ICONS[focusHabitKey]} ${HABIT_DISPLAY_NAMES[focusHabitKey]} (${minPct}%)`;
    } else {
      this.dom.kpiFocusHabit.textContent = "None yet";
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
    listContainer.innerHTML = "";

    // Convert to sorted array of objects
    const items = ROUTINE_KEYS.map(key => {
      const completed = habitSuccessCounts[key] || 0;
      const pct = Math.round((completed / totalDays) * 100);
      return {
        key,
        name: HABIT_DISPLAY_NAMES[key],
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
    let greeting = "Hayırlı Sabahlar, Enes!";
    let greetingIcon = "🌤️";
    let subgreeting = "Bugün yeni hedeflere ulaşmak ve gelişmek için harika bir gün.";
    
    if (hr >= 12 && hr < 18) {
      greeting = "Günün Enerjisi, Enes!";
      greetingIcon = "☀️";
      subgreeting = "Öğleden sonra hedeflerine tam gaz odaklanmaya devam et.";
    } else if (hr >= 18 && hr < 23) {
      greeting = "Hayırlı Akşamlar, Enes!";
      greetingIcon = "🌙";
      subgreeting = "Günün yorgunluğunu atarken zihnini tazelemeyi unutma.";
    } else if (hr >= 23 || hr < 5) {
      greeting = "Huzurlu Geceler, Enes!";
      greetingIcon = "🌌";
      subgreeting = "Güzel bir uyku, yarının başarısı için en büyük hazırlıktır.";
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
    if (trDisplay) trDisplay.textContent = ayah.translation;
    if (srcDisplay) srcDisplay.textContent = ayah.source;

    // Compute metrics
    const yesterday = new Date(STATE.todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const yesterdayData = STATE.db[yesterdayKey];
    const yScore = yesterdayData ? StreakEngine.calculateDailyPercentage(yesterdayData) : 0;
    
    const yScoreEl = document.getElementById('brief-yesterday-score');
    if (yScoreEl) yScoreEl.textContent = `${yScore}%`;

    // Yesterday spending
    const ySpending = STATE.finance.transactions
      .filter(tx => tx.date === yesterdayKey && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const ySpendEl = document.getElementById('brief-yesterday-spending');
    if (ySpendEl) ySpendEl.textContent = `${ySpending.toFixed(2)} TL`;

    // Today's events
    const todayEventsCount = STATE.calendar.length;
    const tEventsEl = document.getElementById('brief-today-events');
    if (tEventsEl) tEventsEl.textContent = `${todayEventsCount} Etkinlik`;

    // Mock temperature details
    const baseTemp = 30 + Math.round(Math.sin(new Date().getHours() / 3) * 2);
    const tempValEl = document.getElementById('weather-temp-val');
    if (tempValEl) tempValEl.textContent = `${baseTemp}°C`;
  },

  setupJournalTab() {
    let selectedMood = "😐";
    
    // Bind mood buttons
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.getAttribute('data-mood');
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
        selectedMood = "😐";
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

        STATE.journal[dateKey] = {
          mood: selectedMood,
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
    } else {
      if (this.dom.journalContentInput) this.dom.journalContentInput.value = '';
      if (this.dom.journalTagsInput) this.dom.journalTagsInput.value = '';
      if (this.dom.journalDeleteBtn) this.dom.journalDeleteBtn.style.display = 'none';
      moodBtns.forEach(b => b.classList.remove('active'));
      const defMood = document.querySelector('.mood-btn[data-mood="😐"]');
      if (defMood) defMood.classList.add('active');
    }

    // Load History list
    if (this.dom.journalHistoryList) {
      this.dom.journalHistoryList.innerHTML = '';
      const sortedKeys = Object.keys(STATE.journal).sort().reverse();
      
      if (sortedKeys.length === 0) {
        this.dom.journalHistoryList.innerHTML = '<div class="empty-state">Henüz kayıt yok. İlk günlüğünü yaz!</div>';
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
          <p>${item.tags ? item.tags : 'Etiket yok'}</p>
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
    let selectedType = "expense";

    // Bind type buttons
    const typeBtns = document.querySelectorAll('.finance-type-toggle .type-btn');
    const targetGroup = document.getElementById('fin-target-account-group');
    const sourceLabel = document.querySelector('#fin-account-group label');

    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.getAttribute('data-type');
        
        if (selectedType === 'transfer') {
          if (targetGroup) targetGroup.classList.remove('hidden');
          if (sourceLabel) sourceLabel.textContent = "Kaynak Hesap";
        } else {
          if (targetGroup) targetGroup.classList.add('hidden');
          if (sourceLabel) sourceLabel.textContent = selectedType === 'income' ? 'Hedef Hesap' : 'Kaynak Hesap';
        }
      });
    });

    // Form submit
    if (this.dom.financeForm) {
      this.dom.financeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(this.dom.finAmountInput.value);
        const category = this.dom.finCategorySelect.value;
        const account = this.dom.finAccountSelect.value;
        const targetAccount = this.dom.finTargetAccountSelect.value;
        const dateVal = document.getElementById('fin-date-input').value;
        const description = document.getElementById('fin-desc-input').value || category;

        if (isNaN(amount) || amount <= 0) return;

        // Apply account balance mutations
        if (selectedType === 'expense') {
          STATE.finance.accounts[account].balance -= amount;
        } else if (selectedType === 'income') {
          STATE.finance.accounts[account].balance += amount;
        } else if (selectedType === 'transfer') {
          if (account === targetAccount) {
            alert("Kaynak ve hedef hesaplar aynı olamaz!");
            return;
          }
          STATE.finance.accounts[account].balance -= amount;
          STATE.finance.accounts[targetAccount].balance += amount;
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
          description: description
        };

        STATE.finance.transactions.push(newTx);
        StorageManager.saveFinance();
        AudioFeedback.playSuccess();

        // Auto check checklist finance task
        const dayData = StorageManager.getDayState(dateVal);
        dayData.fin_flow = true;
        StorageManager.saveDayState(dateVal, dayData);
        this.loadDateData();

        // Clear form & re-render
        this.dom.financeForm.reset();
        document.getElementById('fin-date-input').value = formatDateKey(STATE.todayDate);
        this.renderFinance();
        this.renderBrief();
      });
    }
  },

  renderFinance() {
    const activeDateKey = formatDateKey(STATE.activeDate);
    const activeMonth = activeDateKey.substring(0, 7); // e.g. "2026-06"
    
    // Set date input default
    const dateInput = document.getElementById('fin-date-input');
    if (dateInput && !dateInput.value) {
      dateInput.value = activeDateKey;
    }

    // Populate accounts select fields
    if (this.dom.finAccountSelect && this.dom.finTargetAccountSelect) {
      const accountsMarkup = Object.keys(STATE.finance.accounts).map(k => {
        const acc = STATE.finance.accounts[k];
        return `<option value="${k}">${acc.name} (${acc.balance.toFixed(0)} TL)</option>`;
      }).join('');
      
      this.dom.finAccountSelect.innerHTML = accountsMarkup;
      this.dom.finTargetAccountSelect.innerHTML = accountsMarkup;
    }

    // Render accounts card list
    const accList = document.getElementById('fin-accounts-list');
    if (accList) {
      accList.innerHTML = Object.keys(STATE.finance.accounts).map(k => {
        const acc = STATE.finance.accounts[k];
        return `
          <div class="account-item">
            <span class="acc-name">${acc.name}</span>
            <span class="acc-balance">${acc.balance.toFixed(2)} TL</span>
          </div>
        `;
      }).join('');
    }

    // Calculate summary statistics
    const totalBalance = Object.keys(STATE.finance.accounts).reduce((sum, k) => sum + STATE.finance.accounts[k].balance, 0);
    
    // Filter monthly transactions
    const monthlyTxs = STATE.finance.transactions.filter(tx => tx.date.startsWith(activeMonth));
    const monthlyIncome = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpense = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

    if (this.dom.finTotalBalance) this.dom.finTotalBalance.textContent = `${totalBalance.toLocaleString('tr-TR')} TL`;
    if (this.dom.finMonthlyIncome) this.dom.finMonthlyIncome.textContent = `${monthlyIncome.toLocaleString('tr-TR')} TL`;
    if (this.dom.finMonthlyExpense) this.dom.finMonthlyExpense.textContent = `${monthlyExpense.toLocaleString('tr-TR')} TL`;

    // Render transaction history list
    if (this.dom.finTransactionsList) {
      this.dom.finTransactionsList.innerHTML = '';
      const sortedTxs = [...STATE.finance.transactions].sort((a, b) => b.date.localeCompare(a.date));
      
      if (sortedTxs.length === 0) {
        this.dom.finTransactionsList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Henüz bir finansal kayıt bulunmuyor.</td></tr>';
      } else {
        sortedTxs.slice(0, 20).forEach(tx => {
          const row = document.createElement('tr');
          let amtClass = 'expense-val';
          let amtPrefix = '-';
          if (tx.type === 'income') {
            amtClass = 'income-val';
            amtPrefix = '+';
          } else if (tx.type === 'transfer') {
            amtClass = 'transfer-val';
            amtPrefix = '⇄';
          }

          const accName = STATE.finance.accounts[tx.account] ? STATE.finance.accounts[tx.account].name : tx.account;
          
          row.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.description}</td>
            <td><span class="date-badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted); padding:0.25rem 0.5rem; font-size:0.7rem;">${tx.category}</span></td>
            <td>${accName}${tx.targetAccount ? ' → ' + (STATE.finance.accounts[tx.targetAccount] ? STATE.finance.accounts[tx.targetAccount].name : tx.targetAccount) : ''}</td>
            <td class="${amtClass}">${amtPrefix}${tx.amount.toFixed(2)} TL</td>
            <td><button class="delete-tx-btn" data-id="${tx.id}">×</button></td>
          `;

          row.querySelector('.delete-tx-btn').addEventListener('click', () => {
            // Reverse account balance effects
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
          });

          this.dom.finTransactionsList.appendChild(row);
        });
      }
    }

    // Render category spending breakdown bars
    if (this.dom.finCategoryBreakdown) {
      this.dom.finCategoryBreakdown.innerHTML = '';
      
      const categoryTotals = {};
      monthlyTxs.filter(tx => tx.type === 'expense').forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      const categories = ['Gıda', 'Ulaşım', 'Teknoloji', 'Faturalar', 'Yatırım', 'Eğitim', 'Diğer'];
      
      const categoryIcons = {
        Gıda: "🍔 Gıda & Market",
        Ulaşım: "🚗 Ulaşım & Yakıt",
        Teknoloji: "💻 Yazılım & Cihazlar",
        Faturalar: "⚡ Faturalar & Abonelikler",
        Yatırım: "📈 Yatırımlar",
        Eğitim: "📚 Kitap & Eğitim",
        Diğer: "📦 Diğer"
      };

      let maxSpend = 0;
      categories.forEach(c => {
        const amt = categoryTotals[c] || 0;
        if (amt > maxSpend) maxSpend = amt;
      });

      categories.forEach(c => {
        const amt = categoryTotals[c] || 0;
        const pct = maxSpend > 0 ? (amt / maxSpend) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'category-bar-item';
        item.innerHTML = `
          <div class="category-bar-info">
            <span>${categoryIcons[c]}</span>
            <span class="val">${amt.toFixed(2)} TL</span>
          </div>
          <div class="category-bar-track">
            <div class="category-bar-fill" style="width: 0%"></div>
          </div>
        `;

        this.dom.finCategoryBreakdown.appendChild(item);
        requestAnimationFrame(() => {
          const fill = item.querySelector('.category-bar-fill');
          if (fill) fill.style.width = `${pct}%`;
        });
      });
    }
  },

  setupCalendarTab() {
    const clientIdInput = document.getElementById('google-client-id');
    if (clientIdInput) {
      clientIdInput.value = localStorage.getItem('google_client_id') || '';
      clientIdInput.addEventListener('input', () => {
        localStorage.setItem('google_client_id', clientIdInput.value);
      });
    }

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
        if (isConnected) {
          authBtn.innerHTML = "Google Takvim Bağlandı ✓";
          authBtn.style.backgroundColor = "var(--success)";
          authBtn.style.borderColor = "var(--success)";
        } else {
          authBtn.innerHTML = "Google Hesabını Bağla";
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
        const client_id = clientIdInput ? clientIdInput.value.trim() : '';
        if (!client_id) {
          alert("Google Takvim'e bağlanmak için lütfen öncelikle sağ alttaki panelden geçerli bir Google Client ID girin.");
          return;
        }

        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
          alert("Google API kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.");
          return;
        }

        try {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: client_id,
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            callback: async (resp) => {
              if (resp.error) {
                console.error("GIS Error: ", resp.error);
                alert("Google yetkilendirme hatası: " + resp.error);
                return;
              }
              if (resp.access_token) {
                localStorage.setItem('google_access_token', resp.access_token);
                updateAuthBtnStyle(true);
                AudioFeedback.playSuccess();
                alert("Google Takvim başarıyla bağlandı! Verileriniz senkronize ediliyor.");
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
            authBtn.innerHTML = "Google Hesabını Bağla";
            authBtn.style.backgroundColor = "#4285f4";
            authBtn.style.borderColor = "#4285f4";
          }
          console.log("Google token expired, auth reset.");
          return;
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
    } catch (err) {
      console.error("Google Calendar Sync Error:", err);
    }
  },

  renderCalendar() {
    const activeDateKey = formatDateKey(STATE.activeDate);
    
    const dayLabel = document.getElementById('calendar-active-day');
    if (dayLabel) {
      dayLabel.textContent = CalendarEngine.getGregorianString(STATE.activeDate);
    }

    // Auto trigger sync if token exists
    const cachedToken = localStorage.getItem('google_access_token');
    if (cachedToken && !this._isSyncingCalendar) {
      this._isSyncingCalendar = true;
      this.syncGoogleCalendar(cachedToken).finally(() => {
        this._isSyncingCalendar = false;
      });
    }

    if (this.dom.calendarTimelineEvents) {
      this.dom.calendarTimelineEvents.innerHTML = '';
      
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
                <p>${e.desc || 'Not girilmemiş.'}</p>
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

    // Convert to sorted array of objects
    const items = ROUTINE_KEYS.map(key => {
      const completed = habitSuccessCounts[key] || 0;
      const pct = Math.round((completed / totalDays) * 100);
      return {
        key,
        name: HABIT_DISPLAY_NAMES[key],
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
