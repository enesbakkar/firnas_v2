// ================= APPLICATION STATE =================
const STATE = {
  activeDate: new Date(), // Date object currently displayed in the checklist
  todayDate: new Date(),  // Real system date
  authenticated: false,
  passcode: "RUTIN_bakkar-fir.27", // Default static passcode
  selectedMonth: "2026-06", // Default starting month
  db: {} // Loaded daily records
};

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
    inlineSyncStatus: document.getElementById('inline-sync-status')
  },

  init() {
    SupabaseManager.init(); // Initialize credentials
    this.setupAuthentication();
    this.setupNavigation();
    this.setupDateNavigator();
    this.setupChecklist();
    this.setupMonthSelector();
    this.setupSyncSettings(); // Setup Supabase modal & inline controls
    
    // Auto-sync check on tab focus (for multi-device real-time updates)
    window.addEventListener('focus', () => {
      if (STATE.authenticated && SupabaseManager.isEnabled()) {
        console.log("Tab focused: Fetching updates from Supabase...");
        SupabaseManager.fetchInitialSync().then(() => {
          this.updateStreakDisplay();
          this.loadDateData();
          this.renderNotionGrid();
          this.renderAnalytics();
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
    this.updateStreakDisplay();
    this.loadDateData();
    this.renderNotionGrid();
    this.renderAnalytics();

    // Trigger background sync if Supabase is active
    if (SupabaseManager.isEnabled()) {
      SupabaseManager.fetchInitialSync().then(() => {
        // Re-render views with freshly pulled records
        this.updateStreakDisplay();
        this.loadDateData();
        this.renderNotionGrid();
        this.renderAnalytics();
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

        if (targetTab === 'grid-tab') {
          this.renderNotionGrid();
        } else if (targetTab === 'analytics-tab') {
          this.renderAnalytics();
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
      cb.addEventListener('change', () => {
        const key = formatDateKey(STATE.activeDate);
        const dayData = StorageManager.getDayState(key);
        const dbKey = cb.getAttribute('data-key');
        
        dayData[dbKey] = cb.checked;
        StorageManager.saveDayState(key, dayData);
        
        this.updateStreakDisplay();
        this.updateProgressRing(dayData);
        
        // Live sync other panels
        this.renderNotionGrid();
        this.renderAnalytics();
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
  }
};

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});
