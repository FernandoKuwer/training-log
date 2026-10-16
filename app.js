// app.js — Training Log logic. Vanilla JS, no framework.
(function () {
  'use strict';

  var STORAGE_KEY = 'training-log-v1';
  var DOW_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var MON_FIRST_DOWS = [1, 2, 3, 4, 5, 6, 0];

  // ---- Storage -----------------------------------------------------------

  function defaultStore() {
    return { version: 1, weeks: {} };
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultStore();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.weeks !== 'object') return defaultStore();
      return parsed;
    } catch (e) {
      return defaultStore();
    }
  }

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getWeek(weekKey) {
    if (!store.weeks[weekKey]) {
      store.weeks[weekKey] = { loads: {}, cardio: {}, done: {} };
    }
    var w = store.weeks[weekKey];
    if (!w.loads) w.loads = {};
    if (!w.cardio) w.cardio = {};
    if (!w.done) w.done = {};
    return w;
  }

  var store = loadStore();

  // ---- Date / ISO week helpers --------------------------------------------

  function stripTime(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function mondayOf(date) {
    var d = stripTime(date);
    var day = d.getDay(); // 0 Sun .. 6 Sat
    var diff = (day === 0) ? -6 : (1 - day);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function isoWeekInfo(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var dayNum = d.getUTCDay() || 7; // Sun -> 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { isoYear: d.getUTCFullYear(), isoWeek: weekNo };
  }

  function weekKeyOf(mondayDate) {
    var info = isoWeekInfo(mondayDate);
    return info.isoYear + '-W' + String(info.isoWeek).padStart(2, '0');
  }

  function addDays(date, n) {
    var d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function dateForDow(weekMonday, dow) {
    // weekMonday + offset, where dow 1..6 -> offset 0..5, dow 0 (Sun) -> offset 6
    var offset = (dow === 0) ? 6 : (dow - 1);
    return addDays(weekMonday, offset);
  }

  function formatWeekLabel(weekMonday) {
    var info = isoWeekInfo(weekMonday);
    var sunday = addDays(weekMonday, 6);
    var range;
    if (weekMonday.getMonth() === sunday.getMonth()) {
      range = weekMonday.getDate() + ' – ' + sunday.getDate() + ' ' + MONTH_ABBR[weekMonday.getMonth()];
    } else {
      range = weekMonday.getDate() + ' ' + MONTH_ABBR[weekMonday.getMonth()] + ' – ' +
        sunday.getDate() + ' ' + MONTH_ABBR[sunday.getMonth()];
    }
    return { weekNum: 'W' + String(info.isoWeek).padStart(2, '0'), range: range };
  }

  // ---- App state -----------------------------------------------------------

  var today = stripTime(new Date());
  var currentWeekMonday = mondayOf(today); // the real "this week", for next-week disabling
  var state = {
    weekMonday: mondayOf(today),
    selectedDow: today.getDay()
  };

  // ---- DOM refs --------------------------------------------------------

  var el = {
    weekLabel: document.getElementById('weekLabel'),
    prevWeekBtn: document.getElementById('prevWeekBtn'),
    nextWeekBtn: document.getElementById('nextWeekBtn'),
    dayStrip: document.getElementById('dayStrip'),
    dayView: document.getElementById('dayView'),
    doseValue: document.getElementById('doseValue'),
    doseBarFill: document.getElementById('doseBarFill'),
    doseBarTrack: document.getElementById('doseBarTrack'),
    doseTick10: document.getElementById('doseTick10'),
    doseTick18: document.getElementById('doseTick18'),
    doseTick10Label: document.getElementById('doseTick10Label'),
    doseTick18Label: document.getElementById('doseTick18Label'),
    installBtn: document.getElementById('installBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    historySheetBackdrop: document.getElementById('historySheetBackdrop'),
    historyTitle: document.getElementById('historyTitle'),
    historySub: document.getElementById('historySub'),
    historyChartWrap: document.getElementById('historyChartWrap'),
    historyList: document.getElementById('historyList'),
    historyCloseBtn: document.getElementById('historyCloseBtn'),
    importConfirmBackdrop: document.getElementById('importConfirmBackdrop'),
    importConfirmText: document.getElementById('importConfirmText'),
    importMergeBtn: document.getElementById('importMergeBtn'),
    importReplaceBtn: document.getElementById('importReplaceBtn'),
    importCancelBtn: document.getElementById('importCancelBtn'),
    toast: document.getElementById('toast')
  };

  // ---- Toast ---------------------------------------------------------------

  var toastTimer = null;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('visible'); }, 2200);
  }

  // ---- Dose meter (F4) -------------------------------------------------

  function weeklyMaxMet() {
    var total = 0;
    PROGRAM.forEach(function (day) {
      day.cardio.forEach(function (c) { total += c.metHours; });
    });
    return total;
  }

  function computeWeekDose(weekKey) {
    var w = store.weeks[weekKey];
    if (!w || !w.cardio) return 0;
    var total = 0;
    PROGRAM.forEach(function (day) {
      day.cardio.forEach(function (c) {
        if (w.cardio[c.id]) total += c.metHours;
      });
    });
    return Math.round(total * 100) / 100;
  }

  function renderDoseMeter() {
    var weekKey = weekKeyOf(state.weekMonday);
    var dose = computeWeekDose(weekKey);
    el.doseValue.textContent = dose.toFixed(1);
    var pct = Math.min(100, (dose / WEEKLY_MET_TARGET) * 100);
    el.doseBarFill.style.width = pct + '%';

    var tickPct10 = (10.0 / WEEKLY_MET_TARGET) * 100;
    var tickPct18 = (18.0 / WEEKLY_MET_TARGET) * 100;
    el.doseTick10.style.left = tickPct10 + '%';
    el.doseTick18.style.left = tickPct18 + '%';
    el.doseTick10Label.style.left = tickPct10 + '%';
    el.doseTick18Label.style.left = tickPct18 + '%';
  }

  // ---- Header / week nav (F1) -------------------------------------------

  function renderHeader() {
    var label = formatWeekLabel(state.weekMonday);
    el.weekLabel.innerHTML = '<span class="wk-num">' + label.weekNum + '</span>' + label.range;
    el.nextWeekBtn.disabled = state.weekMonday.getTime() >= currentWeekMonday.getTime();
    renderDoseMeter();
  }

  function goToWeek(newMonday) {
    state.weekMonday = newMonday;
    renderHeader();
    renderDayStrip();
    renderDayView();
  }

  el.prevWeekBtn.addEventListener('click', function () {
    goToWeek(addDays(state.weekMonday, -7));
  });
  el.nextWeekBtn.addEventListener('click', function () {
    if (el.nextWeekBtn.disabled) return;
    goToWeek(addDays(state.weekMonday, 7));
  });

  // ---- Day strip (F2) ----------------------------------------------------

  function dayStatus(weekKey, dow) {
    var day = PROGRAM_BY_DOW[dow];
    if (day.type === 'rest') return 'rest';
    var w = store.weeks[weekKey];
    var done = w && w.done && w.done['d' + dow];
    return done ? 'done' : 'not-done';
  }

  function renderDayStrip() {
    var weekKey = weekKeyOf(state.weekMonday);
    el.dayStrip.innerHTML = '';
    MON_FIRST_DOWS.forEach(function (dow) {
      var cellDate = dateForDow(state.weekMonday, dow);
      var isToday = sameDate(cellDate, today);
      var isSelected = dow === state.selectedDow;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-cell' + (isSelected ? ' selected' : '');
      btn.setAttribute('aria-current', isToday ? 'true' : 'false');
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.dataset.dow = String(dow);

      var abbr = document.createElement('span');
      abbr.className = 'dow-abbr mono';
      abbr.textContent = DOW_ABBR[dow];

      var dot = document.createElement('span');
      var status = dayStatus(weekKey, dow);
      dot.className = 'status-dot ' + status;

      btn.appendChild(abbr);
      btn.appendChild(dot);
      btn.addEventListener('click', function () {
        state.selectedDow = dow;
        renderDayStrip();
        renderDayView();
      });

      el.dayStrip.appendChild(btn);
    });
  }

  // ---- Day view: exercises, cardio, protocol, completion (F3, F5) ---------

  function prevWeekKeyOf(weekMonday) {
    return weekKeyOf(addDays(weekMonday, -7));
  }

  function formatNum(v) {
    var n = parseFloat(v);
    if (isNaN(n)) return v;
    // Trim trailing zeros but keep up to 2 decimals.
    return String(Math.round(n * 100) / 100);
  }

  function buildPrevCompareHTML(exerciseId, unit) {
    var prevKey = prevWeekKeyOf(state.weekMonday);
    var prevWeek = store.weeks[prevKey];
    var prevRaw = prevWeek && prevWeek.loads ? prevWeek.loads[exerciseId] : undefined;

    if (prevRaw === undefined || prevRaw === '') {
      return '<div>no prior</div>';
    }

    var prevNum = parseFloat(prevRaw);
    var prevDisplay = formatNum(prevRaw) + (unit ? ' ' + unit : '');
    var curKey = weekKeyOf(state.weekMonday);
    var curWeek = store.weeks[curKey];
    var curRaw = curWeek && curWeek.loads ? curWeek.loads[exerciseId] : undefined;

    if (curRaw === undefined || curRaw === '' || isNaN(parseFloat(curRaw)) || isNaN(prevNum)) {
      return '<div>prev ' + prevDisplay + '</div>';
    }

    var curNum = parseFloat(curRaw);
    var delta = Math.round((curNum - prevNum) * 100) / 100;
    var deltaClass, deltaText;
    if (delta > 0) {
      deltaClass = 'delta-pos';
      deltaText = '+' + delta + (unit ? ' ' + unit : '');
    } else if (delta < 0) {
      deltaClass = 'delta-neg';
      deltaText = String(delta) + (unit ? ' ' + unit : '');
    } else {
      deltaClass = 'delta-zero';
      deltaText = '=';
    }
    return '<div>prev ' + prevDisplay + '</div><div class="' + deltaClass + '">' + deltaText + '</div>';
  }

  var saveTimers = {};
  function scheduleLoadSave(exerciseId, rawValue, rowEl, unit) {
    if (saveTimers[exerciseId]) clearTimeout(saveTimers[exerciseId]);
    saveTimers[exerciseId] = setTimeout(function () {
      var weekKey = weekKeyOf(state.weekMonday);
      var w = getWeek(weekKey);
      if (rawValue === '') {
        delete w.loads[exerciseId];
      } else {
        w.loads[exerciseId] = rawValue;
      }
      saveStore();
      var compareEl = rowEl.querySelector('.prev-compare');
      if (compareEl) compareEl.innerHTML = buildPrevCompareHTML(exerciseId, unit);
      delete saveTimers[exerciseId];
    }, 500);
  }

  var BADGE_INFO = {
    failure: { text: '0–1 RIR · TO FAILURE', cls: 'badge-failure' },
    reserve: { text: '2–3 RIR', cls: 'badge-reserve' },
    bodyweight: { text: 'BODYWEIGHT', cls: 'badge-bodyweight' }
  };

  function renderExerciseRow(ex, index, weekKey) {
    var row = document.createElement('div');
    row.className = 'exercise-row';

    var top = document.createElement('div');
    top.className = 'exercise-top';

    var idx = document.createElement('span');
    idx.className = 'exercise-idx mono';
    idx.textContent = String(index + 1).padStart(2, '0');

    var nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.className = 'exercise-name-btn';
    nameBtn.textContent = ex.name;
    nameBtn.addEventListener('click', function () { openHistorySheet(ex); });

    var scheme = document.createElement('span');
    scheme.className = 'exercise-scheme mono';
    scheme.textContent = ex.scheme;

    top.appendChild(idx);
    top.appendChild(nameBtn);
    top.appendChild(scheme);
    row.appendChild(top);

    var note = document.createElement('div');
    note.className = 'exercise-note';
    note.textContent = ex.note;
    row.appendChild(note);

    var badgeInfo = BADGE_INFO[ex.intensity];
    var badge = document.createElement('span');
    badge.className = 'badge ' + badgeInfo.cls;
    badge.textContent = badgeInfo.text;
    row.appendChild(badge);

    if (ex.unit) {
      var inputRow = document.createElement('div');
      inputRow.className = 'input-row';

      var input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.className = 'load-input mono';
      input.setAttribute('aria-label', ex.name + ' value');
      var w = store.weeks[weekKey];
      input.value = (w && w.loads && w.loads[ex.id] !== undefined) ? w.loads[ex.id] : '';
      input.addEventListener('input', function () {
        scheduleLoadSave(ex.id, input.value, row, ex.unit);
      });

      var unitLabel = document.createElement('span');
      unitLabel.className = 'load-unit mono';
      unitLabel.textContent = ex.unit;

      var compare = document.createElement('div');
      compare.className = 'prev-compare';
      compare.innerHTML = buildPrevCompareHTML(ex.id, ex.unit);

      inputRow.appendChild(input);
      inputRow.appendChild(unitLabel);
      inputRow.appendChild(compare);
      row.appendChild(inputRow);
    }

    return row;
  }

  function renderCardioBlock(day, weekKey) {
    if (!day.cardio.length) return null;
    var block = document.createElement('div');
    block.className = 'cardio-block';

    var label = document.createElement('p');
    label.className = 'cardio-block-label';
    label.textContent = 'Aerobic';
    block.appendChild(label);

    day.cardio.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'cardio-row';

      var check = document.createElement('button');
      check.type = 'button';
      var w = store.weeks[weekKey];
      var checked = !!(w && w.cardio && w.cardio[c.id]);
      check.className = 'cardio-check' + (checked ? ' checked' : '');
      check.setAttribute('aria-pressed', checked ? 'true' : 'false');
      check.setAttribute('aria-label', 'Mark ' + c.name + ' complete');

      var text = document.createElement('div');
      text.className = 'cardio-text';
      var nameEl = document.createElement('div');
      nameEl.className = 'cardio-name';
      nameEl.textContent = c.name;
      var detailEl = document.createElement('div');
      detailEl.className = 'cardio-detail mono';
      detailEl.textContent = c.detail;
      text.appendChild(nameEl);
      text.appendChild(detailEl);

      check.addEventListener('click', function () {
        var wk = getWeek(weekKeyOf(state.weekMonday));
        var nowChecked = !wk.cardio[c.id];
        if (nowChecked) wk.cardio[c.id] = true; else delete wk.cardio[c.id];
        saveStore();
        check.classList.toggle('checked', nowChecked);
        check.setAttribute('aria-pressed', nowChecked ? 'true' : 'false');
        renderDoseMeter();
      });

      row.appendChild(check);
      row.appendChild(text);
      block.appendChild(row);
    });

    return block;
  }

  function renderDayView() {
    var weekKey = weekKeyOf(state.weekMonday);
    var day = PROGRAM_BY_DOW[state.selectedDow];
    el.dayView.innerHTML = '';

    if (day.type === 'rest') {
      var head = document.createElement('div');
      head.className = 'session-head';
      var titleWrap = document.createElement('div');
      var title = document.createElement('h1');
      title.className = 'session-title';
      title.textContent = day.title;
      titleWrap.appendChild(title);
      head.appendChild(titleWrap);
      el.dayView.appendChild(head);

      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No session scheduled. Recovery is part of the dose.';
      el.dayView.appendChild(empty);
      return;
    }

    var head = document.createElement('div');
    head.className = 'session-head';

    var titleWrap = document.createElement('div');
    var eyebrow = document.createElement('p');
    eyebrow.className = 'session-eyebrow';
    eyebrow.textContent = day.eyebrow;
    var title = document.createElement('h1');
    title.className = 'session-title';
    title.textContent = day.title;
    var meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.textContent = day.durationMin + ' min';
    titleWrap.appendChild(eyebrow);
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    var toggleWrap = document.createElement('button');
    toggleWrap.type = 'button';
    toggleWrap.className = 'complete-toggle';
    var w = getWeek(weekKey);
    var isDone = !!w.done['d' + state.selectedDow];
    var sw = document.createElement('span');
    sw.className = 'switch' + (isDone ? ' on' : '');
    var swLabel = document.createElement('span');
    swLabel.textContent = isDone ? 'Done' : 'Mark done';
    toggleWrap.appendChild(swLabel);
    toggleWrap.appendChild(sw);
    toggleWrap.setAttribute('aria-pressed', isDone ? 'true' : 'false');
    toggleWrap.addEventListener('click', function () {
      var wk = getWeek(weekKeyOf(state.weekMonday));
      var key = 'd' + state.selectedDow;
      var nowDone = !wk.done[key];
      if (nowDone) wk.done[key] = true; else delete wk.done[key];
      saveStore();
      renderDayStrip();
      renderDayView();
    });

    head.appendChild(titleWrap);
    head.appendChild(toggleWrap);
    el.dayView.appendChild(head);

    var cardioBlock = renderCardioBlock(day, weekKey);
    if (cardioBlock) el.dayView.appendChild(cardioBlock);

    if (day.protocol.length) {
      var list = document.createElement('ol');
      list.className = 'protocol-list';
      day.protocol.forEach(function (step, i) {
        var li = document.createElement('li');
        var idx = document.createElement('span');
        idx.className = 'protocol-idx mono';
        idx.textContent = String(i + 1).padStart(2, '0');
        var txt = document.createElement('span');
        txt.textContent = step;
        li.appendChild(idx);
        li.appendChild(txt);
        list.appendChild(li);
      });
      el.dayView.appendChild(list);
    }

    if (day.exercises.length) {
      var exList = document.createElement('div');
      exList.className = 'exercise-list';
      day.exercises.forEach(function (ex, i) {
        exList.appendChild(renderExerciseRow(ex, i, weekKey));
      });
      el.dayView.appendChild(exList);
    }
  }

  // ---- Progression history (F6) ------------------------------------------

  function allWeeksForExercise(exerciseId) {
    var points = [];
    Object.keys(store.weeks).forEach(function (wk) {
      var w = store.weeks[wk];
      if (w.loads && w.loads[exerciseId] !== undefined && w.loads[exerciseId] !== '') {
        var n = parseFloat(w.loads[exerciseId]);
        if (!isNaN(n)) points.push({ weekKey: wk, value: n });
      }
    });
    // weekKey strings (YYYY-Www, zero-padded) sort correctly lexically.
    points.sort(function (a, b) { return a.weekKey < b.weekKey ? -1 : (a.weekKey > b.weekKey ? 1 : 0); });
    return points;
  }

  function buildChartSVG(pointsAscending) {
    var w = 300, h = 120, padX = 10, padY = 14;
    var values = pointsAscending.map(function (p) { return p.value; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    if (min === max) { min -= 1; max += 1; }

    var n = pointsAscending.length;
    var stepX = (w - padX * 2) / (n - 1);

    function xAt(i) { return padX + i * stepX; }
    function yAt(v) { return h - padY - ((v - min) / (max - min)) * (h - padY * 2); }

    var pathPts = pointsAscending.map(function (p, i) { return xAt(i) + ',' + yAt(p.value); }).join(' ');

    var circles = pointsAscending.map(function (p, i) {
      return '<circle cx="' + xAt(i) + '" cy="' + yAt(p.value) + '" r="3" fill="#1B5E6E" />';
    }).join('');

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="img" aria-label="Progression chart">' +
      '<polyline points="' + pathPts + '" fill="none" stroke="#2E8B9A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />' +
      circles +
      '</svg>';
  }

  function openHistorySheet(ex) {
    var points = allWeeksForExercise(ex.id); // ascending
    el.historyTitle.textContent = ex.name;
    el.historySub.textContent = points.length + ' logged week' + (points.length === 1 ? '' : 's');

    el.historyChartWrap.innerHTML = '';
    if (points.length >= 2) {
      el.historyChartWrap.innerHTML = buildChartSVG(points);
    } else {
      el.historyChartWrap.remove();
    }

    el.historyList.innerHTML = '';
    if (!points.length) {
      var li = document.createElement('li');
      li.className = 'history-empty';
      li.textContent = 'No logged values yet.';
      el.historyList.appendChild(li);
    } else {
      points.slice().reverse().forEach(function (p) {
        var li = document.createElement('li');
        var wk = document.createElement('span');
        wk.className = 'hist-week';
        wk.textContent = p.weekKey;
        var val = document.createElement('span');
        val.textContent = p.value + (ex.unit ? ' ' + ex.unit : '');
        li.appendChild(wk);
        li.appendChild(val);
        el.historyList.appendChild(li);
      });
    }

    el.historySheetBackdrop.classList.remove('hidden');
  }

  function closeHistorySheet() {
    el.historySheetBackdrop.classList.add('hidden');
  }

  el.historyCloseBtn.addEventListener('click', closeHistorySheet);
  el.historySheetBackdrop.addEventListener('click', function (e) {
    if (e.target === el.historySheetBackdrop) closeHistorySheet();
  });

  // ---- Export / Import (F7) ------------------------------------------------

  function pad2(n) { return String(n).padStart(2, '0'); }

  function exportData() {
    var d = new Date();
    var filename = 'training-log-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.json';
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported ' + filename);
  }

  function validImportShape(obj) {
    return !!obj && typeof obj === 'object' && obj.version === 1 && typeof obj.weeks === 'object' && obj.weeks !== null;
  }

  var pendingImport = null;

  function mergeImport(imported) {
    Object.keys(imported.weeks).forEach(function (wk) {
      var incoming = imported.weeks[wk];
      var existing = getWeek(wk);
      if (incoming.loads) Object.assign(existing.loads, incoming.loads);
      if (incoming.cardio) Object.assign(existing.cardio, incoming.cardio);
      if (incoming.done) Object.assign(existing.done, incoming.done);
    });
    saveStore();
  }

  function replaceImport(imported) {
    store = imported;
    saveStore();
  }

  el.exportBtn.addEventListener('click', exportData);

  el.importBtn.addEventListener('click', function () {
    el.importFile.value = '';
    el.importFile.click();
  });

  el.importFile.addEventListener('change', function () {
    var file = el.importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        showToast('Invalid JSON file');
        return;
      }
      if (!validImportShape(parsed)) {
        showToast('File does not match the training-log format');
        return;
      }
      pendingImport = parsed;
      var weekCount = Object.keys(parsed.weeks).length;
      el.importConfirmText.textContent = 'This file contains ' + weekCount + ' week(s) of data. Merge it with your existing log, or replace the log entirely?';
      el.importConfirmBackdrop.classList.remove('hidden');
    };
    reader.readAsText(file);
  });

  el.importMergeBtn.addEventListener('click', function () {
    if (pendingImport) mergeImport(pendingImport);
    pendingImport = null;
    el.importConfirmBackdrop.classList.add('hidden');
    renderHeader();
    renderDayStrip();
    renderDayView();
    showToast('Import merged');
  });

  el.importReplaceBtn.addEventListener('click', function () {
    if (pendingImport) replaceImport(pendingImport);
    pendingImport = null;
    el.importConfirmBackdrop.classList.add('hidden');
    renderHeader();
    renderDayStrip();
    renderDayView();
    showToast('Import replaced existing data');
  });

  el.importCancelBtn.addEventListener('click', function () {
    pendingImport = null;
    el.importConfirmBackdrop.classList.add('hidden');
  });

  // ---- Install prompt (F9) -------------------------------------------------

  var deferredInstallEvent = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  if (!isStandalone()) {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstallEvent = e;
      el.installBtn.classList.add('visible');
    });
  }

  el.installBtn.addEventListener('click', function () {
    if (!deferredInstallEvent) return;
    deferredInstallEvent.prompt();
    deferredInstallEvent.userChoice.then(function () {
      deferredInstallEvent = null;
      el.installBtn.classList.remove('visible');
    });
  });

  window.addEventListener('appinstalled', function () {
    deferredInstallEvent = null;
    el.installBtn.classList.remove('visible');
  });

  // ---- Service worker (F8) --------------------------------------------------

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline-first: ignore */ });
    });
  }

  // ---- Init ------------------------------------------------------------

  renderHeader();
  renderDayStrip();
  renderDayView();
})();
