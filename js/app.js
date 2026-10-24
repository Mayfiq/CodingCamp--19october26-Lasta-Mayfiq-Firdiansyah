/**
 * To-Do Life Dashboard — app.js
 * Vanilla JavaScript, IIFE module pattern.
 * Initialization order (task 11.1):
 *   ThemeManager → GreetingWidget → FocusTimer → TodoManager → LinkManager
 */
(function () {
  'use strict';

  /* =========================================================
   * STORAGE KEYS
   * ======================================================= */
  var KEYS = {
    USERNAME:       'tld_username',
    THEME:          'tld_theme',
    TIMER_DURATION: 'tld_timer_duration',
    TODOS:          'tld_todos',
    LINKS:          'tld_links'
  };

  /* =========================================================
   * StorageService
   * Thin abstraction over localStorage.
   * All values are JSON-serialized so any JS value can be
   * stored (objects, arrays, strings, numbers, booleans).
   *
   * Requirements: 2.2, 2.7, 4.2, 5.10, 6.4, 7.4, 8.2, 8.3
   * ======================================================= */
  var StorageService = (function () {

    /**
     * Read and JSON-parse a value from localStorage.
     * @param {string} key
     * @returns {*} Parsed value, or null if key does not exist,
     *              an exception is thrown, or JSON is corrupt.
     */
    function get(key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) {
          return null;
        }
        return JSON.parse(raw);
      } catch (e) {
        // localStorage.getItem threw (e.g. SecurityError) or
        // JSON.parse failed (corrupt data) — return null and
        // let the caller fall back to its default value.
        return null;
      }
    }

    /**
     * JSON-stringify and write a value to localStorage.
     * @param {string} key
     * @param {*} value  Any JSON-serializable value.
     * @returns {boolean} true on success, false on any failure
     *                    (e.g. QuotaExceededError, SecurityError).
     */
    function set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        // QuotaExceededError or other storage failure.
        // Fail silently — caller continues with in-memory state.
        return false;
      }
    }

    /**
     * Remove a single key from localStorage.
     * @param {string} key
     */
    function remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore removal failures silently.
      }
    }

    /**
     * Clear all keys from localStorage.
     * Use with caution — removes everything, not just tld_* keys.
     */
    function clear() {
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore clear failures silently.
      }
    }

    return { get: get, set: set, remove: remove, clear: clear };
  }());

  /* =========================================================
   * ThemeManager
   * Manages light/dark theme switching, CSS attribute binding,
   * and LocalStorage persistence.
   *
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   * ======================================================= */
  var ThemeManager = (function () {

    /** @type {'light'|'dark'} */
    var current = 'light';

    var VALID_THEMES = { light: true, dark: true };

    /**
     * Read saved theme from storage, apply it immediately, then
     * wire up the toggle button event listener.
     * Must be called BEFORE any content is rendered to prevent
     * flash of wrong theme (req 7.5).
     */
    function init() {
      var saved = StorageService.get(KEYS.THEME);
      var theme = (saved && VALID_THEMES[saved]) ? saved : 'light';
      apply(theme);

      // Wire event listener on the toggle button (req 7.1).
      var btn = document.getElementById('theme-toggle-btn');
      if (btn) {
        btn.addEventListener('click', function () {
          toggle();
        });
      }
    }

    /**
     * Toggle between 'light' and 'dark', persist, and apply.
     */
    function toggle() {
      var next = current === 'light' ? 'dark' : 'light';
      persist(next);   // persist first (req 7.4 — before visual transition)
      apply(next);
    }

    /**
     * Set the data-theme attribute on <html>, update internal state,
     * and sync the toggle button's visual label and aria-label.
     * This activates the correct CSS custom-property block.
     * @param {'light'|'dark'} theme
     */
    function apply(theme) {
      if (!VALID_THEMES[theme]) {
        theme = 'light';
      }
      current = theme;
      document.documentElement.setAttribute('data-theme', theme);

      // Update the toggle button to reflect the NEW theme that will
      // be activated on the NEXT click (i.e. the opposite of current).
      var icon  = document.getElementById('theme-toggle-icon');
      var label = document.getElementById('theme-toggle-label');
      var btn   = document.getElementById('theme-toggle-btn');

      if (theme === 'dark') {
        // Currently dark → next click switches to light → show sun icon
        if (icon)  { icon.textContent  = '☀️'; }
        if (label) { label.textContent = 'Terang'; }
        if (btn)   { btn.setAttribute('aria-label', 'Beralih ke tema terang'); }
      } else {
        // Currently light → next click switches to dark → show moon icon
        if (icon)  { icon.textContent  = '🌙'; }
        if (label) { label.textContent = 'Gelap'; }
        if (btn)   { btn.setAttribute('aria-label', 'Beralih ke tema gelap'); }
      }
    }

    /**
     * Save theme preference to LocalStorage.
     * Failures are swallowed silently (req 7.6) — the theme is
     * already applied for the current session via apply().
     * @param {'light'|'dark'} theme
     */
    function persist(theme) {
      // StorageService.set already catches all exceptions silently.
      StorageService.set(KEYS.THEME, theme);
    }

    return {
      get current() { return current; },
      init:    init,
      toggle:  toggle,
      apply:   apply,
      persist: persist
    };
  }());

  /* =========================================================
   * GreetingWidget
   * Menampilkan jam berjalan, tanggal, dan salam personal
   * dalam Bahasa Indonesia.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
   * ======================================================= */
  var GreetingWidget = (function () {

    /** @type {number|null} ID dari setInterval yang berjalan */
    var _intervalId = null;

    /** @type {string|null} Nama pengguna aktif */
    var _username = null;

    var DAYS_ID   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var MONTHS_ID = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    /**
     * Menentukan teks salam berdasarkan jam dan nama pengguna.
     * @param {number} hour  0–23
     * @param {string} name  Nama pengguna (boleh kosong/null)
     * @returns {string}
     */
    function getGreetingText(hour, name) {
      var phrase;
      if (hour >= 0 && hour <= 11) {
        phrase = 'Selamat Pagi';
      } else if (hour >= 12 && hour <= 14) {
        phrase = 'Selamat Siang';
      } else if (hour >= 15 && hour <= 17) {
        phrase = 'Selamat Sore';
      } else {
        // 18–23
        phrase = 'Selamat Malam';
      }

      if (name && name.trim().length > 0) {
        return phrase + ', ' + name.trim() + '!';
      }
      return phrase + '!';
    }

    /**
     * Memformat objek Date ke "NamaHari, DD NamaBulan YYYY"
     * dalam Bahasa Indonesia.
     * @param {Date} date
     * @returns {string}
     */
    function formatDate(date) {
      var dayName   = DAYS_ID[date.getDay()];
      var dd        = String(date.getDate()).padStart(2, '0');
      var monthName = MONTHS_ID[date.getMonth()];
      var yyyy      = date.getFullYear();
      return dayName + ', ' + dd + ' ' + monthName + ' ' + yyyy;
    }

    /**
     * Memperbarui elemen DOM jam, tanggal, dan salam.
     * Jika new Date() gagal atau menghasilkan tanggal tidak valid,
     * menampilkan "Waktu tidak tersedia" sesuai req 1.7.
     */
    function updateDisplay() {
      var elTime    = document.getElementById('greeting-time');
      var elDate    = document.getElementById('greeting-date-text');
      var elMessage = document.getElementById('greeting-message');

      var now;
      try {
        now = new Date();
        // Validasi: pastikan Date valid (getTime() mengembalikan NaN jika tidak valid)
        if (isNaN(now.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (e) {
        // req 1.7 — tampilkan pesan fallback
        if (elTime)    elTime.textContent    = 'Waktu tidak tersedia';
        if (elDate)    elDate.textContent    = 'Waktu tidak tersedia';
        if (elMessage) elMessage.textContent = 'Waktu tidak tersedia';
        return;
      }

      // Format jam HH:MM:SS (24 jam)
      var hh  = String(now.getHours()).padStart(2, '0');
      var min = String(now.getMinutes()).padStart(2, '0');
      var ss  = String(now.getSeconds()).padStart(2, '0');
      if (elTime) elTime.textContent = hh + ':' + min + ':' + ss;

      // Format tanggal Bahasa Indonesia
      if (elDate) elDate.textContent = formatDate(now);

      // Teks salam
      if (elMessage) elMessage.textContent = getGreetingText(now.getHours(), _username);
    }

    /**
     * Memulai interval 1 detik yang memanggil updateDisplay().
     * Membersihkan interval lama jika sudah ada.
     */
    function startClock() {
      if (_intervalId !== null) {
        clearInterval(_intervalId);
      }
      _intervalId = setInterval(updateDisplay, 1000);
    }

    // -------------------------------------------------------
    // Task 4.3 — Username management
    // Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
    // -------------------------------------------------------

    /**
     * Validates a name against the allowed character set and length.
     * Accepts letters (including accented Latin chars À–ÿ), spaces,
     * and hyphens; between 1 and 50 characters.
     * @param {string} name
     * @returns {boolean}
     */
    function validateName(name) {
      if (typeof name !== 'string') return false;
      return /^[a-zA-ZÀ-ÿ\s\-]{1,50}$/.test(name);
    }

    /**
     * Injects the name-input form into #greeting-name-form-container
     * and hides the change-name button.
     * Called on first load when no name is stored (req 2.1),
     * and also when the user wants to change their name (req 2.5).
     */
    function promptForName() {
      var container = document.getElementById('greeting-name-form-container');
      var actions   = document.getElementById('greeting-name-actions');

      if (!container) return;

      // Hide change-name button while form is visible
      if (actions) actions.style.display = 'none';

      container.innerHTML =
        '<form id="greeting-name-form" class="name-form" novalidate>' +
          '<label for="greeting-name-input" class="name-form__label">Nama Anda</label>' +
          '<div class="name-form__row">' +
            '<input' +
              ' type="text"' +
              ' id="greeting-name-input"' +
              ' class="name-form__input"' +
              ' maxlength="50"' +
              ' placeholder="Masukkan nama Anda"' +
              ' autocomplete="given-name"' +
              ' aria-describedby="greeting-name-error"' +
            ' />' +
            '<button type="submit" class="btn btn-primary name-form__submit">Simpan</button>' +
          '</div>' +
          '<p id="greeting-name-error" class="name-form__error" role="alert" aria-live="polite"></p>' +
        '</form>';

      var form  = document.getElementById('greeting-name-form');
      var input = document.getElementById('greeting-name-input');

      // Pre-fill with current name so the user can edit rather than retype
      if (_username) {
        input.value = _username;
      }

      // Focus the input for better UX
      // Small delay to ensure the element is painted before focus
      setTimeout(function () { if (input) input.focus(); }, 50);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveName(input.value);
      });
    }

    /**
     * Validates the provided name, saves it to storage, updates
     * _username, refreshes the greeting, hides the form, and shows
     * the change-name button.
     *
     * If localStorage write fails, the name is kept in memory for
     * the session only — no error is shown to the user (req 2.7).
     *
     * @param {string} name
     * @returns {boolean} true if the name was accepted; false if validation failed.
     */
    function saveName(name) {
      var trimmed = (typeof name === 'string') ? name.trim() : '';
      var errorEl = document.getElementById('greeting-name-error');

      // req 2.3 — show validation message and do not save invalid names
      if (!validateName(trimmed)) {
        var msg;
        if (trimmed.length === 0) {
          msg = 'Nama tidak boleh kosong.';
        } else if (trimmed.length > 50) {
          msg = 'Nama tidak boleh lebih dari 50 karakter.';
        } else {
          msg = 'Nama hanya boleh mengandung huruf, spasi, atau tanda hubung (-).';
        }
        if (errorEl) errorEl.textContent = msg;
        return false;
      }

      // Clear any previous error
      if (errorEl) errorEl.textContent = '';

      // req 2.2 / 2.6 — persist to storage (failure is silent per req 2.7)
      StorageService.set(KEYS.USERNAME, trimmed);

      // Update in-memory name and refresh greeting immediately (req 2.4, 2.6)
      _username = trimmed;
      updateDisplay();

      // Hide the form
      var container = document.getElementById('greeting-name-form-container');
      if (container) container.innerHTML = '';

      // Show change-name button (req 2.5)
      _renderChangeNameButton();

      return true;
    }

    /**
     * Re-shows the name input form so the user can update their name.
     * Requirements: 2.5, 2.6
     */
    function changeName() {
      promptForName();
    }

    /**
     * Injects (or re-injects) the "Ubah Nama" button into
     * #greeting-name-actions and wires its click handler.
     * @private
     */
    function _renderChangeNameButton() {
      var actions = document.getElementById('greeting-name-actions');
      if (!actions) return;

      actions.style.display = '';
      actions.innerHTML =
        '<button type="button" id="change-name-btn" class="btn btn-secondary change-name-btn">' +
          'Ubah Nama' +
        '</button>';

      document.getElementById('change-name-btn')
        .addEventListener('click', function () {
          changeName();
        });
    }

    /**
     * Inisialisasi widget: baca nama dari storage, mulai clock,
     * dan panggil updateDisplay() segera agar tidak ada jeda kosong.
     * Jika nama belum tersimpan, tampilkan form input (req 2.1).
     * Jika sudah ada, tampilkan tombol "Ubah Nama" (req 2.5).
     */
    function init() {
      _username = StorageService.get(KEYS.USERNAME);
      updateDisplay();   // tampilkan segera tanpa menunggu detik pertama
      startClock();

      if (!_username) {
        // req 2.1 — no name stored, prompt the user
        promptForName();
      } else {
        // req 2.5 — name already stored, show change-name button
        _renderChangeNameButton();
      }
    }

    return {
      init:            init,
      startClock:      startClock,
      updateDisplay:   updateDisplay,
      getGreetingText: getGreetingText,
      formatDate:      formatDate,
      validateName:    validateName,
      promptForName:   promptForName,
      saveName:        saveName,
      changeName:      changeName
    };
  }());

  /* =========================================================
   * FocusTimer
   * State machine hitung mundur Pomodoro.
   *
   * State transitions:
   *   [*]       → IDLE
   *   IDLE      → RUNNING   : start()
   *   RUNNING   → PAUSED    : pause()
   *   RUNNING   → COMPLETED : tick() mencapai 00:00
   *   PAUSED    → RUNNING   : resume()
   *   PAUSED    → IDLE      : reset()
   *   COMPLETED → IDLE      : reset()
   *   IDLE      → IDLE      : saveDuration() berlaku langsung
   *   RUNNING   → RUNNING   : saveDuration() berlaku sesi berikutnya
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   * ======================================================= */
  var FocusTimer = (function () {

    /** @type {'IDLE'|'RUNNING'|'PAUSED'|'COMPLETED'} */
    var state = 'IDLE';

    /** Detik yang tersisa pada hitung mundur aktif */
    var remainingSeconds = 0;

    /** Durasi yang dikonfigurasi, dalam menit (1–120) */
    var configuredDuration = 25;

    /** ID dari setInterval yang aktif, atau null */
    var intervalId = null;

    // -------------------------------------------------------
    // Helper: DOM shortcuts
    // -------------------------------------------------------

    function _elTime()    { return document.getElementById('timer-time'); }
    function _elStatus()  { return document.getElementById('timer-status'); }

    // -------------------------------------------------------
    // formatDisplay
    // Menghasilkan "MM:SS" dari jumlah detik (0–7200).
    // Req 3.1, Property 4.
    // -------------------------------------------------------

    /**
     * Mengubah jumlah detik menjadi string "MM:SS".
     * @param {number} seconds  0 hingga 7200 (0–120 menit)
     * @returns {string}  format "MM:SS"
     */
    function formatDisplay(seconds) {
      // Guard: clamp to valid range
      var s = Math.max(0, Math.min(7200, Math.floor(seconds)));
      var mm = Math.floor(s / 60);
      var ss = s % 60;
      return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    }

    // -------------------------------------------------------
    // _updateTimerDOM
    // Menyinkronkan elemen #timer-time dengan remainingSeconds
    // dan menetapkan class state pada elemen tersebut.
    // -------------------------------------------------------

    function _updateTimerDOM() {
      var el = _elTime();
      if (!el) return;

      el.textContent = formatDisplay(remainingSeconds);

      // Hapus semua class state, lalu pasang yang sesuai
      el.classList.remove('is-running', 'is-paused', 'is-completed');
      if (state === 'RUNNING')   el.classList.add('is-running');
      if (state === 'PAUSED')    el.classList.add('is-paused');
      if (state === 'COMPLETED') el.classList.add('is-completed');
    }

    // -------------------------------------------------------
    // _updateStatusDOM
    // Menampilkan / menyembunyikan pesan selesai (#timer-status).
    // -------------------------------------------------------

    function _updateStatusDOM() {
      var el = _elStatus();
      if (!el) return;
      if (state === 'COMPLETED') {
        el.textContent = '🎉 Sesi selesai! Tekan Reset untuk memulai kembali.';
        el.classList.add('is-visible');
      } else {
        el.textContent = '';
        el.classList.remove('is-visible');
      }
    }

    // -------------------------------------------------------
    // updateButtonStates
    // Mengaktifkan / menonaktifkan tombol sesuai state.
    // Requirements: 3.8 (IDLE), 3.9 (RUNNING), 3.10 (PAUSED),
    //               COMPLETED.
    // -------------------------------------------------------

    /**
     * Sinkronkan atribut disabled keempat tombol kontrol dengan
     * state mesin saat ini.
     *
     * State rules:
     *   IDLE      → Mulai enabled;  Jeda, Lanjut, Reset disabled
     *   RUNNING   → Jeda enabled;   Mulai, Lanjut, Reset disabled
     *   PAUSED    → Lanjut + Reset enabled; Mulai, Jeda disabled
     *   COMPLETED → Reset enabled;  Mulai, Jeda, Lanjut disabled
     */
    function updateButtonStates() {
      // Set data-timer-state agar CSS bisa juga mengatur tampilan
      var controls = document.getElementById('timer-controls');
      if (controls) {
        controls.setAttribute('data-timer-state', state);
      }

      var btnStart  = document.getElementById('timer-btn-start');
      var btnPause  = document.getElementById('timer-btn-pause');
      var btnResume = document.getElementById('timer-btn-resume');
      var btnReset  = document.getElementById('timer-btn-reset');

      // Req 3.8 — IDLE: hanya "Mulai" aktif
      // Req 3.9 — RUNNING: hanya "Jeda" aktif
      // Req 3.10 — PAUSED: "Lanjut" dan "Reset" aktif
      // COMPLETED: hanya "Reset" aktif
      if (btnStart)  { btnStart.disabled  = (state !== 'IDLE'); }
      if (btnPause)  { btnPause.disabled  = (state !== 'RUNNING'); }
      if (btnResume) { btnResume.disabled = (state !== 'PAUSED'); }
      if (btnReset)  {
        // Reset tersedia di PAUSED dan COMPLETED (req 3.6, 3.10)
        btnReset.disabled = (state !== 'PAUSED' && state !== 'COMPLETED');
      }
    }

    // -------------------------------------------------------
    // tick
    // Dipanggil oleh setInterval setiap 1 detik saat RUNNING.
    // Req 3.3, 3.4.
    // -------------------------------------------------------

    function tick() {
      if (state !== 'RUNNING') return;

      remainingSeconds -= 1;

      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        _updateTimerDOM();
        onComplete();
        return;
      }

      _updateTimerDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // onComplete
    // Dipanggil saat hitung mundur mencapai 00:00.
    // Req 3.7.
    // -------------------------------------------------------

    function onComplete() {
      // Hentikan interval
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }

      state = 'COMPLETED';

      _updateTimerDOM();
      _updateStatusDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // start
    // IDLE → RUNNING. Req 3.3.
    // -------------------------------------------------------

    function start() {
      if (state !== 'IDLE') return;

      // Mulai dari durasi penuh
      remainingSeconds = configuredDuration * 60;
      state = 'RUNNING';

      // Hapus interval lama jika ada (defensive)
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(tick, 1000);

      _updateTimerDOM();
      _updateStatusDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // pause
    // RUNNING → PAUSED. Req 3.4.
    // -------------------------------------------------------

    function pause() {
      if (state !== 'RUNNING') return;

      clearInterval(intervalId);
      intervalId = null;
      state = 'PAUSED';

      _updateTimerDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // resume
    // PAUSED → RUNNING. Req 3.5.
    // -------------------------------------------------------

    function resume() {
      if (state !== 'PAUSED') return;

      state = 'RUNNING';

      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(tick, 1000);

      _updateTimerDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // reset
    // PAUSED → IDLE  atau  COMPLETED → IDLE. Req 3.6.
    // -------------------------------------------------------

    function reset() {
      if (state !== 'PAUSED' && state !== 'COMPLETED') return;

      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }

      state = 'IDLE';
      remainingSeconds = configuredDuration * 60;

      _updateTimerDOM();
      _updateStatusDOM();
      updateButtonStates();
    }

    // -------------------------------------------------------
    // saveDuration
    // Validasi dan simpan durasi kustom.
    // Saat IDLE: berlaku langsung.
    // Saat RUNNING/PAUSED: berlaku sesi berikutnya. Req 4.7.
    // -------------------------------------------------------

    /**
     * Simpan durasi timer kustom.
     * @param {number} minutes  Bilangan bulat 1–120.
     * @returns {boolean} true jika berhasil disimpan, false jika validasi gagal.
     */
    function saveDuration(minutes) {
      var n = Number(minutes);

      // Validasi: bilangan bulat, 1–120 (req 4.2, 4.5, 4.6)
      if (!Number.isInteger(n) || n < 1 || n > 120) {
        return false;
      }

      // Simpan ke storage
      StorageService.set(KEYS.TIMER_DURATION, n);
      configuredDuration = n;

      // Berlaku langsung hanya saat IDLE (req 4.7)
      if (state === 'IDLE') {
        remainingSeconds = configuredDuration * 60;
        _updateTimerDOM();
      }
      // Saat RUNNING/PAUSED: tidak ubah sesi aktif

      return true;
    }

    // -------------------------------------------------------
    // _renderDurationForm
    // Menyisipkan form input durasi ke dalam
    // #timer-duration-container.
    // Req 4.1, 4.2, 4.3, 4.5, 4.6, 4.7.
    // -------------------------------------------------------

    /**
     * Render the custom duration input form inside
     * #timer-duration-container. Wires the save button to call
     * saveDuration() and shows the appropriate error message when
     * validation fails.
     * @private
     */
    function _renderDurationForm() {
      var container = document.getElementById('timer-duration-container');
      if (!container) return;

      container.innerHTML =
        '<form id="timer-duration-form" class="duration-form" novalidate>' +
          '<label for="timer-duration-input" class="duration-form__label">Durasi (menit)</label>' +
          '<div class="duration-form__row">' +
            '<input' +
              ' type="number"' +
              ' id="timer-duration-input"' +
              ' class="duration-form__input"' +
              ' min="1"' +
              ' max="120"' +
              ' step="1"' +
              ' value="' + configuredDuration + '"' +
              ' placeholder="1–120"' +
              ' aria-describedby="timer-duration-error"' +
            ' />' +
            '<button type="submit" id="timer-duration-save-btn" class="btn btn-primary duration-form__submit">Simpan</button>' +
          '</div>' +
          '<p id="timer-duration-error" class="duration-form__error" role="alert" aria-live="polite"></p>' +
          '<p id="timer-duration-info"  class="duration-form__info"  aria-live="polite"></p>' +
        '</form>';

      var form    = document.getElementById('timer-duration-form');
      var input   = document.getElementById('timer-duration-input');
      var errorEl = document.getElementById('timer-duration-error');
      var infoEl  = document.getElementById('timer-duration-info');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Clear previous messages
        errorEl.textContent = '';
        input.classList.remove('is-invalid');

        var raw   = input.value;
        var value = Number(raw);

        // req 4.6 — empty input or non-integer
        if (raw.trim() === '' || !Number.isInteger(value)) {
          errorEl.textContent = 'Masukkan angka bulat.';
          input.classList.add('is-invalid');
          return;
        }

        // req 4.5 — out of range
        if (value < 1 || value > 120) {
          errorEl.textContent = 'Durasi harus antara 1 hingga 120 menit.';
          input.classList.add('is-invalid');
          return;
        }

        // Call the existing saveDuration() logic layer
        var saved = saveDuration(value);

        if (saved) {
          // Update the input to show the confirmed value
          input.value = configuredDuration;

          // req 4.7 — if timer is running, new duration applies next session
          if (state === 'RUNNING') {
            infoEl.textContent = 'Durasi baru akan berlaku pada sesi berikutnya.';
          } else {
            infoEl.textContent = 'Durasi berhasil disimpan.';
          }

          // Auto-clear the info message after 3 seconds
          setTimeout(function () {
            if (infoEl) infoEl.textContent = '';
          }, 3000);
        }
        // saveDuration() only returns false for invalid input,
        // which is already caught above — no extra error branch needed.
      });
    }

    // -------------------------------------------------------
    // _renderControls
    // Menyuntikkan keempat tombol kontrol ke dalam #timer-controls
    // dan mendaftarkan event listener untuk masing-masing.
    // Dipanggil sekali dari init().
    // Task 6.3 — Requirements: 3.8, 3.9, 3.10
    // -------------------------------------------------------

    function _renderControls() {
      var container = document.getElementById('timer-controls');
      if (!container) return;

      // Bangun HTML tombol menggunakan class .btn dari style.css
      container.innerHTML =
        '<button' +
          ' type="button"' +
          ' id="timer-btn-start"' +
          ' class="btn btn-primary"' +
          ' aria-label="Mulai timer"' +
        '>Mulai</button>' +
        '<button' +
          ' type="button"' +
          ' id="timer-btn-pause"' +
          ' class="btn btn-secondary"' +
          ' aria-label="Jeda timer"' +
        '>Jeda</button>' +
        '<button' +
          ' type="button"' +
          ' id="timer-btn-resume"' +
          ' class="btn btn-secondary"' +
          ' aria-label="Lanjut timer"' +
        '>Lanjut</button>' +
        '<button' +
          ' type="button"' +
          ' id="timer-btn-reset"' +
          ' class="btn btn-secondary"' +
          ' aria-label="Reset timer"' +
        '>Reset</button>';

      // Daftarkan event listener untuk setiap tombol
      document.getElementById('timer-btn-start').addEventListener('click', function () {
        start();
      });
      document.getElementById('timer-btn-pause').addEventListener('click', function () {
        pause();
      });
      document.getElementById('timer-btn-resume').addEventListener('click', function () {
        resume();
      });
      document.getElementById('timer-btn-reset').addEventListener('click', function () {
        reset();
      });
    }

    // -------------------------------------------------------
    // init
    // Baca durasi dari storage, set state awal ke IDLE.
    // Req 3.2, 4.4.
    // -------------------------------------------------------

    function init() {
      // Baca durasi tersimpan; fallback ke 25 menit
      var saved = StorageService.get(KEYS.TIMER_DURATION);
      if (Number.isInteger(saved) && saved >= 1 && saved <= 120) {
        configuredDuration = saved;
      } else {
        configuredDuration = 25;
      }

      state            = 'IDLE';
      remainingSeconds = configuredDuration * 60;
      intervalId       = null;

      // Injeksi tombol kontrol dan daftarkan listener (task 6.3)
      _renderControls();

      _updateTimerDOM();
      _updateStatusDOM();
      updateButtonStates();

      // Req 4.1 — inject the duration input UI
      _renderDurationForm();
    }

    return {
      // State & data getters (baca saja)
      get state()               { return state; },
      get remainingSeconds()    { return remainingSeconds; },
      get configuredDuration()  { return configuredDuration; },
      get intervalId()          { return intervalId; },

      // Methods
      init:                init,
      start:               start,
      pause:               pause,
      resume:              resume,
      reset:               reset,
      tick:                tick,
      onComplete:          onComplete,
      saveDuration:        saveDuration,
      updateButtonStates:  updateButtonStates,
      formatDisplay:       formatDisplay,
      _renderControls:     _renderControls,
      _renderDurationForm: _renderDurationForm
    };
  }());

  /* =========================================================
   * TodoManager
   * Mengelola CRUD operasi pada daftar tugas.
   *
   * Data model Todo:
   *   id        : string  — "todo_<timestamp>"
   *   text      : string  — 1–200 karakter
   *   completed : boolean
   *   createdAt : number  — Unix timestamp ms
   *
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8,
   *               5.9, 5.10
   * ======================================================= */
  var TodoManager = (function () {

    /** @type {Array<{id:string, text:string, completed:boolean, createdAt:number}>} */
    var todos = [];

    // -------------------------------------------------------
    // validateText
    // Menerima string dengan panjang 1–200 setelah trim.
    // Menolak string kosong atau hanya spasi.
    // Requirements: 5.2, 5.3, 5.8
    // -------------------------------------------------------

    /**
     * Validasi teks tugas.
     * @param {string} text
     * @returns {{valid: boolean, errorMessage: string|null}}
     */
    function validateText(text) {
      if (typeof text !== 'string') {
        return { valid: false, errorMessage: 'Teks tugas tidak valid.' };
      }
      var trimmed = text.trim();
      if (trimmed.length === 0) {
        // req 5.3 — empty or spaces-only: silent, no error shown
        return { valid: false, errorMessage: null };
      }
      if (trimmed.length > 200) {
        return { valid: false, errorMessage: 'Teks tugas tidak boleh melebihi 200 karakter.' };
      }
      return { valid: true, errorMessage: null };
    }

    // -------------------------------------------------------
    // persist
    // Simpan seluruh array todos ke Storage.
    // Dipanggil setelah setiap perubahan (req 5.10).
    // -------------------------------------------------------

    function persist() {
      StorageService.set(KEYS.TODOS, todos);
    }

    // -------------------------------------------------------
    // addTodo
    // Tambahkan tugas baru jika teks valid. (req 5.2, 5.3)
    // -------------------------------------------------------

    /**
     * Tambahkan tugas baru ke daftar.
     * @param {string} text
     * @returns {boolean} true jika berhasil ditambahkan, false jika tidak.
     */
    function addTodo(text) {
      var validation = validateText(text);
      if (!validation.valid) {
        return false;
      }

      var trimmed = text.trim();
      var now     = Date.now();

      /** @type {{id:string, text:string, completed:boolean, createdAt:number}} */
      var todo = {
        id:        'todo_' + now + '_' + Math.floor(Math.random() * 10000),
        text:      trimmed,
        completed: false,
        createdAt: now
      };

      todos.push(todo);
      persist();   // req 5.10
      render();
      return true;
    }

    // -------------------------------------------------------
    // toggleTodo
    // Ubah status selesai/belum selesai. (req 5.4, 5.5)
    // -------------------------------------------------------

    /**
     * Toggle status completed pada tugas dengan id yang diberikan.
     * @param {string} id
     */
    function toggleTodo(id) {
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
          todos[i].completed = !todos[i].completed;
          persist();   // req 5.10
          render();
          return;
        }
      }
    }

    // -------------------------------------------------------
    // editTodo
    // Update teks tugas; batalkan secara senyap jika teks kosong.
    // (req 5.7, 5.8)
    // -------------------------------------------------------

    /**
     * Edit teks tugas.
     * Jika newText kosong/spasi-saja, perubahan dibatalkan secara senyap.
     * @param {string} id
     * @param {string} newText
     * @returns {boolean} true jika teks diperbarui, false jika dibatalkan.
     */
    function editTodo(id, newText) {
      var validation = validateText(newText);
      if (!validation.valid) {
        // req 5.8 — batalkan perubahan secara senyap
        render();   // re-render untuk menutup field edit
        return false;
      }

      var trimmed = newText.trim();
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
          todos[i].text = trimmed;
          persist();   // req 5.10
          render();
          return true;
        }
      }
      return false;
    }

    // -------------------------------------------------------
    // deleteTodo
    // Hapus tugas secara permanen. (req 5.9)
    // -------------------------------------------------------

    /**
     * Hapus tugas dengan id yang diberikan.
     * @param {string} id
     */
    function deleteTodo(id) {
      var newTodos = [];
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].id !== id) {
          newTodos.push(todos[i]);
        }
      }
      todos = newTodos;
      persist();   // req 5.10
      render();
    }

    // -------------------------------------------------------
    // _renderInputArea
    // Menyuntikkan baris input tambah tugas ke #todo-input-container.
    // Dipanggil SEKALI dari init() agar input tidak kehilangan fokus
    // saat render() dipanggil ulang.
    // Requirements: 5.1, 5.2, 5.3
    // -------------------------------------------------------

    /**
     * Render the add-todo input row (text field + "Tambah" button)
     * inside #todo-input-container.  Called once on init so that
     * re-renders of the list do NOT replace this element (and
     * therefore do NOT discard whatever the user is typing).
     * @private
     */
    function _renderInputArea() {
      var container = document.getElementById('todo-input-container');
      if (!container) return;

      // Only inject if the input hasn't already been rendered.
      if (document.getElementById('todo-new-input')) return;

      container.innerHTML =
        '<input' +
          ' type="text"' +
          ' id="todo-new-input"' +
          ' class="input-text"' +
          ' maxlength="200"' +
          ' placeholder="Tugas baru…"' +
          ' aria-label="Tugas baru"' +
          ' autocomplete="off"' +
        ' />' +
        '<button' +
          ' type="button"' +
          ' id="todo-add-btn"' +
          ' class="btn btn-primary"' +
          ' aria-label="Tambah tugas"' +
        '>Tambah</button>';

      var input  = document.getElementById('todo-new-input');
      var addBtn = document.getElementById('todo-add-btn');

      // Helper: attempt to add whatever is in the input field
      function _tryAdd() {
        var text = input.value;
        var validation = validateText(text);
        // req 5.3 — empty/spaces-only: do NOT add, do NOT show error
        if (!validation.valid) return;
        addTodo(text);      // addTodo calls render() internally
        input.value = '';
        input.focus();
      }

      // req 5.2 — add on button click
      addBtn.addEventListener('click', _tryAdd);

      // req 5.2 — add on Enter key
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          _tryAdd();
        }
      });
    }

    // -------------------------------------------------------
    // render
    // Re-renders the todo list items into #todo-list.
    // Does NOT touch #todo-input-container (handled by
    // _renderInputArea once on init).
    // Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11
    // -------------------------------------------------------

    /**
     * Clear and re-render all todo items inside #todo-list.
     * Each item includes: toggle button, text, edit button, delete button.
     * Completed todos get the .is-completed class (req 5.4).
     * Renders an empty list (no error) when todos is empty (req 5.11).
     */
    function render() {
      var list = document.getElementById('todo-list');
      if (!list) return;

      // Clear existing items
      list.innerHTML = '';

      // req 5.11 — empty list renders without error
      if (todos.length === 0) {
        return;
      }

      for (var i = 0; i < todos.length; i++) {
        var todo = todos[i];
        var li = _buildTodoItem(todo);
        list.appendChild(li);
      }
    }

    // -------------------------------------------------------
    // _buildTodoItem
    // Builds a single <li> element for a todo.
    // @private
    // -------------------------------------------------------

    /**
     * Build and return a <li> DOM element for the given todo.
     * @param {{id:string, text:string, completed:boolean, createdAt:number}} todo
     * @returns {HTMLLIElement}
     * @private
     */
    function _buildTodoItem(todo) {
      var li = document.createElement('li');
      li.className = 'todo-item' + (todo.completed ? ' is-completed' : '');
      li.setAttribute('data-todo-id', todo.id);

      // Toggle button (checkbox-style) — req 5.4, 5.5
      var toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn btn-secondary btn-sm';
      toggleBtn.setAttribute('aria-label', todo.completed ? 'Tandai belum selesai' : 'Tandai selesai');
      toggleBtn.setAttribute('aria-pressed', String(todo.completed));
      toggleBtn.textContent = todo.completed ? '✓' : '○';
      toggleBtn.addEventListener('click', function () {
        toggleTodo(todo.id);
      });

      // Text span — req 5.4
      var textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = todo.text;

      // Edit button — req 5.6
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.setAttribute('aria-label', 'Edit tugas');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', function () {
        _renderEditMode(li, todo);
      });

      // Delete button — req 5.9
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.setAttribute('aria-label', 'Hapus tugas');
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', function () {
        deleteTodo(todo.id);
      });

      li.appendChild(toggleBtn);
      li.appendChild(textSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      return li;
    }

    // -------------------------------------------------------
    // _renderEditMode
    // Replaces a todo item's content with an edit input + buttons.
    // Requirements: 5.6, 5.7, 5.8
    // -------------------------------------------------------

    /**
     * Replace the content of the given <li> element with an inline
     * edit field pre-filled with the todo's current text.
     * @param {HTMLLIElement} li   The list item element to transform.
     * @param {{id:string, text:string, completed:boolean, createdAt:number}} todo
     * @private
     */
    function _renderEditMode(li, todo) {
      // Prevent double-entering edit mode
      if (li.querySelector('.todo-edit-input')) return;

      // Clear current content
      li.innerHTML = '';

      // Edit input — req 5.6 (pre-filled with current text)
      var editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'input-text todo-edit-input';
      editInput.maxLength = 200;
      editInput.value = todo.text;
      editInput.setAttribute('aria-label', 'Edit teks tugas');

      // Save button — req 5.7
      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn btn-primary btn-sm';
      saveBtn.setAttribute('aria-label', 'Simpan perubahan');
      saveBtn.textContent = 'Simpan';

      // Cancel button — req 5.8 (silently cancel on click)
      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-secondary btn-sm';
      cancelBtn.setAttribute('aria-label', 'Batal edit');
      cancelBtn.textContent = 'Batal';

      // Save handler — req 5.7 / 5.8
      function _save() {
        // editTodo handles validation: empty/spaces → silent cancel (req 5.8)
        editTodo(todo.id, editInput.value);
        // render() is called internally by editTodo
      }

      // Cancel handler — silently discard changes (req 5.8)
      function _cancel() {
        render();   // revert by re-rendering the full list
      }

      saveBtn.addEventListener('click', _save);
      cancelBtn.addEventListener('click', _cancel);

      // Allow saving with Enter key
      editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          _save();
        }
        if (e.key === 'Escape') {
          _cancel();
        }
      });

      li.appendChild(editInput);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);

      // Focus the input for immediate typing — req 5.6
      setTimeout(function () { editInput.focus(); editInput.select(); }, 0);
    }

    // -------------------------------------------------------
    // init
    // Baca todos dari Storage; fallback ke array kosong.
    // Req 5.11, 8.1, 8.2, 8.3.
    // -------------------------------------------------------

    function init() {
      var saved = StorageService.get(KEYS.TODOS);

      // Validasi: harus berupa array; abaikan data corrupt (req 8.3)
      if (Array.isArray(saved)) {
        // Saring elemen yang tidak valid untuk keamanan tambahan
        todos = saved.filter(function (item) {
          return (
            item !== null &&
            typeof item === 'object' &&
            typeof item.id        === 'string' &&
            typeof item.text      === 'string' &&
            typeof item.completed === 'boolean' &&
            typeof item.createdAt === 'number'
          );
        });
      } else {
        todos = [];
      }

      // Render the add-todo input row once (persists across list re-renders)
      _renderInputArea();

      // Render the initial todo list (req 5.11)
      render();
    }

    return {
      // Getter read-only untuk todos (digunakan oleh render & test)
      get todos() { return todos; },

      // Methods
      init:              init,
      addTodo:           addTodo,
      toggleTodo:        toggleTodo,
      editTodo:          editTodo,
      deleteTodo:        deleteTodo,
      render:            render,
      persist:           persist,
      validateText:      validateText,
      _renderInputArea:  _renderInputArea
    };
  }());

  /* =========================================================
   * LinkManager
   * Mengelola CRUD operasi pada daftar quick links.
   *
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8,
   *               6.9, 6.10
   * ======================================================= */
  var LinkManager = (function () {

    /** @type {Array<{id: string, name: string, url: string, createdAt: number}>} */
    var links = [];

    /** Batas maksimum quick links yang dapat disimpan (req 6.10) */
    var MAX_LINKS = 20;

    // -------------------------------------------------------
    // validateLink
    // Memvalidasi nama dan URL quick link.
    // Req 6.5, 6.6.
    // -------------------------------------------------------

    /**
     * Validasi nama dan URL quick link.
     *
     * Aturan nama (req 6.6):
     *   - Setelah trim: 1–50 karakter
     *   - Tidak boleh hanya spasi / kosong
     *
     * Aturan URL (req 6.5, 6.6):
     *   - Tidak boleh kosong
     *   - Harus diawali "http://" atau "https://"
     *   - Panjang total ≤ 2048 karakter
     *
     * @param {string} name
     * @param {string} url
     * @returns {{valid: boolean, errorMessage: string|null}}
     */
    function validateLink(name, url) {
      var trimmedName = (typeof name === 'string') ? name.trim() : '';
      var trimmedUrl  = (typeof url  === 'string') ? url.trim()  : '';

      // req 6.6 — nama kosong / hanya spasi
      if (trimmedName.length === 0) {
        return { valid: false, errorMessage: 'Nama tidak boleh kosong.' };
      }

      // nama melebihi 50 karakter
      if (trimmedName.length > 50) {
        return { valid: false, errorMessage: 'Nama tidak boleh lebih dari 50 karakter.' };
      }

      // req 6.6 — URL kosong
      if (trimmedUrl.length === 0) {
        return { valid: false, errorMessage: 'URL tidak boleh kosong.' };
      }

      // req 6.5 — URL tidak diawali http:// atau https://
      if (trimmedUrl.indexOf('http://') !== 0 && trimmedUrl.indexOf('https://') !== 0) {
        return { valid: false, errorMessage: 'Format URL tidak valid. URL harus diawali dengan "http://" atau "https://".' };
      }

      // URL melebihi 2048 karakter
      if (trimmedUrl.length > 2048) {
        return { valid: false, errorMessage: 'URL tidak boleh lebih dari 2048 karakter.' };
      }

      return { valid: true, errorMessage: null };
    }

    // -------------------------------------------------------
    // persist
    // Simpan seluruh array links ke storage.
    // Req 6.4, 6.8.
    // -------------------------------------------------------

    /**
     * Menyimpan seluruh array links ke localStorage.
     * Dipanggil setelah setiap perubahan pada daftar links.
     * Kegagalan storage ditangkap senyap oleh StorageService.
     */
    function persist() {
      StorageService.set(KEYS.LINKS, links);
    }

    // -------------------------------------------------------
    // addLink
    // Tambah quick link baru.
    // Req 6.3, 6.4, 6.10.
    // -------------------------------------------------------

    /**
     * Menambahkan quick link baru ke daftar.
     *
     * @param {string} name  Nama tampilan link
     * @param {string} url   URL tujuan
     * @returns {boolean}    true jika berhasil ditambahkan, false jika gagal
     */
    function addLink(name, url) {
      // req 6.10 — cek batas maksimum
      if (links.length >= MAX_LINKS) {
        return false;
      }

      var result = validateLink(name, url);
      if (!result.valid) {
        return false;
      }

      var trimmedName = name.trim();
      var trimmedUrl  = url.trim();

      /** @type {{id: string, name: string, url: string, createdAt: number}} */
      var newLink = {
        id:        'link_' + Date.now(),
        name:      trimmedName,
        url:       trimmedUrl,
        createdAt: Date.now()
      };

      links.push(newLink);
      persist();
      render();
      return true;
    }

    // -------------------------------------------------------
    // deleteLink
    // Hapus quick link berdasarkan id, dengan konfirmasi.
    // Req 6.7, 6.8.
    // -------------------------------------------------------

    /**
     * Meminta konfirmasi pengguna lalu menghapus quick link
     * yang sesuai dengan id yang diberikan.
     *
     * @param {string} id  ID quick link yang akan dihapus
     */
    function deleteLink(id) {
      // Temukan link yang akan dihapus untuk pesan konfirmasi
      var target = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].id === id) {
          target = links[i];
          break;
        }
      }

      if (!target) return;

      // req 6.7 — konfirmasi sebelum menghapus
      var confirmed = window.confirm(
        'Hapus quick link "' + target.name + '"?\nTindakan ini tidak dapat dibatalkan.'
      );
      if (!confirmed) return;

      // Hapus dari array
      links = links.filter(function (link) { return link.id !== id; });

      // req 6.8 — perbarui storage
      persist();
      render();
    }

    // -------------------------------------------------------
    // render
    // Me-render ulang daftar quick links ke #link-list.
    // Req 6.1, 6.2, 6.7, 6.9.
    // Task 8.3.
    // -------------------------------------------------------

    /**
     * Me-render ulang seluruh daftar quick links ke dalam #link-list.
     *
     * Setiap link dirender sebagai elemen <div role="listitem"> yang berisi:
     *   - Tombol <a> bergaya .link-btn yang membuka URL di tab baru (req 6.1, 6.2)
     *   - Tombol hapus .btn-danger .btn-sm per item (req 6.7)
     *
     * Jika tidak ada link tersimpan, daftar ditampilkan kosong tanpa
     * pesan error (req 6.9 — empty state).
     *
     * Requirements: 6.1, 6.2, 6.7, 6.9, 8.1, 8.2
     */
    function render() {
      var listEl = document.getElementById('link-list');
      if (!listEl) return;

      // Kosongkan kontainer sebelum re-render
      listEl.innerHTML = '';

      if (links.length === 0) {
        // Tampilkan daftar kosong — tidak ada pesan error (req empty-state)
        return;
      }

      // Render setiap link dalam urutan createdAt (sudah di-sort saat init/addLink)
      links.forEach(function (link) {
        var item = document.createElement('div');
        item.setAttribute('role', 'listitem');
        item.className = 'link-item';

        // Tombol quick link — membuka URL di tab baru (req 6.1, 6.2)
        var anchor = document.createElement('a');
        anchor.href        = link.url;
        anchor.target      = '_blank';
        anchor.rel         = 'noopener noreferrer';
        anchor.className   = 'link-btn';
        anchor.textContent = link.name;
        anchor.setAttribute('aria-label', 'Buka ' + link.name + ' di tab baru');

        // Tombol hapus per item (req 6.7) — konfirmasi ditangani di deleteLink()
        var delBtn = document.createElement('button');
        delBtn.type      = 'button';
        delBtn.className = 'btn btn-danger btn-sm';
        delBtn.textContent = '✕';
        delBtn.setAttribute('aria-label', 'Hapus tautan ' + link.name);

        // Closure untuk menangkap id link yang benar
        (function (linkId) {
          delBtn.addEventListener('click', function () {
            deleteLink(linkId);
          });
        }(link.id));

        item.appendChild(anchor);
        item.appendChild(delBtn);
        listEl.appendChild(item);
      });
    }

    // -------------------------------------------------------
    // _renderAddForm
    // Menyisipkan form tambah link ke dalam #link-form-container.
    // Dipanggil sekali dari init() agar form tidak hilang saat
    // render() dipanggil ulang (mirip pola _renderDurationForm).
    // Req 6.3, 6.5, 6.6, 6.10.
    // Task 8.3.
    // -------------------------------------------------------

    /**
     * Inject the add-link form into #link-form-container.
     * The form contains:
     *   - Name input (text, maxlength 50)          — req 6.3, 6.6
     *   - URL input  (text, maxlength 2048)         — req 6.3, 6.5
     *   - Add / submit button                       — req 6.3
     *   - Error message area                        — req 6.5, 6.6, 6.10
     *
     * Called once from init() so the form is not torn down on
     * each re-render triggered by addLink() / deleteLink().
     *
     * @private
     */
    function _renderAddForm() {
      var container = document.getElementById('link-form-container');
      if (!container) return;

      container.innerHTML =
        '<form id="link-add-form" class="link-add-form" novalidate>' +
          '<div class="link-add-form__fields">' +
            '<input' +
              ' type="text"' +
              ' id="link-name-input"' +
              ' class="input-text link-add-form__name"' +
              ' maxlength="50"' +
              ' placeholder="Nama (maks. 50 karakter)"' +
              ' aria-label="Nama tautan cepat"' +
              ' aria-describedby="link-add-error"' +
            ' />' +
            '<input' +
              ' type="text"' +
              ' id="link-url-input"' +
              ' class="input-text link-add-form__url"' +
              ' maxlength="2048"' +
              ' placeholder="URL (https://...)"' +
              ' aria-label="URL tautan cepat"' +
              ' aria-describedby="link-add-error"' +
            ' />' +
            '<button' +
              ' type="submit"' +
              ' id="link-add-btn"' +
              ' class="btn btn-primary link-add-form__submit"' +
            '>Tambah</button>' +
          '</div>' +
          '<p id="link-add-error" class="field-error" role="alert" aria-live="polite"></p>' +
        '</form>';

      var form    = document.getElementById('link-add-form');
      var nameIn  = document.getElementById('link-name-input');
      var urlIn   = document.getElementById('link-url-input');
      var errorEl = document.getElementById('link-add-error');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Reset error state
        errorEl.textContent = '';
        nameIn.classList.remove('is-invalid');
        urlIn.classList.remove('is-invalid');

        var name = nameIn.value;
        var url  = urlIn.value;

        // req 6.10 — batas maksimum 20 links
        if (links.length >= MAX_LINKS) {
          errorEl.textContent = 'Batas maksimum ' + MAX_LINKS + ' tautan cepat telah tercapai.';
          return;
        }

        // Validasi menggunakan validateLink (req 6.5, 6.6)
        var validation = validateLink(name, url);
        if (!validation.valid) {
          errorEl.textContent = validation.errorMessage;

          // Tandai input yang bermasalah
          var trimmedName = (typeof name === 'string') ? name.trim() : '';
          var trimmedUrl  = (typeof url  === 'string') ? url.trim()  : '';
          if (trimmedName.length === 0 || trimmedName.length > 50) {
            nameIn.classList.add('is-invalid');
          }
          if (trimmedUrl.length === 0 ||
              (trimmedUrl.indexOf('http://') !== 0 && trimmedUrl.indexOf('https://') !== 0) ||
              trimmedUrl.length > 2048) {
            urlIn.classList.add('is-invalid');
          }
          return;
        }

        // Tambahkan link — addLink() memanggil persist() + render() di dalamnya
        var added = addLink(name, url);
        if (added) {
          // Reset form setelah berhasil
          nameIn.value = '';
          urlIn.value  = '';
          nameIn.focus();
        }
      });
    }

    // -------------------------------------------------------
    // init
    // Baca links dari storage, sort by createdAt ascending,
    // render form tambah (sekali), dan render daftar.
    // Req 6.9, 8.1, 8.2, 8.3.
    // -------------------------------------------------------

    /**
     * Inisialisasi LinkManager:
     * 1. Baca links dari StorageService (req 8.2)
     * 2. Jika null atau bukan array, inisialisasi sebagai array kosong (req 8.3)
     * 3. Sort berdasarkan createdAt ascending (req 6.9)
     * 4. Render form tambah link (task 8.3)
     * 5. Panggil render() untuk tampilkan links
     */
    function init() {
      var stored = StorageService.get(KEYS.LINKS);

      if (Array.isArray(stored)) {
        // Saring elemen yang tidak valid untuk keamanan tambahan
        links = stored.filter(function (item) {
          return (
            item !== null &&
            typeof item === 'object' &&
            typeof item.id        === 'string' &&
            typeof item.name      === 'string' &&
            typeof item.url       === 'string' &&
            typeof item.createdAt === 'number'
          );
        });
      } else {
        links = [];
      }

      // req 6.9 — urutkan dari yang paling lama ke paling baru
      links.sort(function (a, b) { return a.createdAt - b.createdAt; });

      // Inject form tambah link sekali — tidak di-reset saat render() dipanggil ulang
      _renderAddForm();

      render();
    }

    return {
      // Data getter (baca saja)
      get links()    { return links; },
      MAX_LINKS:     MAX_LINKS,

      // Methods
      init:            init,
      addLink:         addLink,
      deleteLink:      deleteLink,
      render:          render,
      persist:         persist,
      validateLink:    validateLink,
      _renderAddForm:  _renderAddForm
    };
  }());

  /* =========================================================
   * App entry point
   * Initialization order is critical: ThemeManager must run
   * first to prevent flash-of-wrong-theme (req 7.5).
   * ======================================================= */
  function initApp() {
    ThemeManager.init();
    GreetingWidget.init();
    FocusTimer.init();
    TodoManager.init();
    LinkManager.init();
  }

  // Expose modules and storage keys for testing environments.
  // In a browser context these are available on window.App.
  window.App = {
    KEYS:           KEYS,
    StorageService: StorageService,
    ThemeManager:   ThemeManager,
    GreetingWidget: GreetingWidget,
    FocusTimer:     FocusTimer,
    TodoManager:    TodoManager,
    LinkManager:    LinkManager
  };

  // Start the app once the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

}());
