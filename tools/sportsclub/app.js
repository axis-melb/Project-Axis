/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js
   Universal Australian Community Sports Club
   Scoreboard & Smart Canteen Predictor
   100% client-side · LocalStorage · No dependencies
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   STATE — in-memory current match
────────────────────────────────────────────────────────────── */
const state = {
  match: null, // active match object
};

/* ──────────────────────────────────────────────────────────────
   SPORT CONFIG — scoring rules per sport
────────────────────────────────────────────────────────────── */
const SPORTS = {
  afl: {
    label: 'AFL',
    home: [
      { label: 'Goal  +6', value: 6, key: 'goals' },
      { label: 'Behind +1', value: 1, key: 'behinds' },
    ],
    away: [
      { label: 'Goal  +6', value: 6, key: 'goals' },
      { label: 'Behind +1', value: 1, key: 'behinds' },
    ],
    initScore: () => ({ goals: 0, behinds: 0, total: 0 }),
    calcScore: (s) => { s.total = s.goals * 6 + s.behinds; return s; },
    displayMain: (s) => s.total,
    displayDetail: (s) => `${s.goals}.${s.behinds}`,
  },
  cricket: {
    label: 'Cricket',
    home: [
      { label: '+1 Run',    value: 1,  key: 'runs' },
      { label: '+4 Runs',   value: 4,  key: 'runs' },
      { label: '+6 Runs',   value: 6,  key: 'runs' },
      { label: 'Wicket',    value: 0,  key: 'wickets', inc: 1 },
      { label: 'Dot Ball',  value: 0,  key: 'dotballs' },
    ],
    away: [
      { label: '+1 Run',    value: 1,  key: 'runs' },
      { label: '+4 Runs',   value: 4,  key: 'runs' },
      { label: '+6 Runs',   value: 6,  key: 'runs' },
      { label: 'Wicket',    value: 0,  key: 'wickets', inc: 1 },
      { label: 'Dot Ball',  value: 0,  key: 'dotballs' },
    ],
    initScore: () => ({ runs: 0, wickets: 0, overs: 0, dotballs: 0 }),
    calcScore: (s, key) => {
      if (key === 'wickets') { s.wickets = Math.min(s.wickets + 1, 10); }
      else if (key === 'dotballs') {
        s.dotballs++;
        s.overs = parseFloat((s.overs + (1 / 6)).toFixed(1));
      } else {
        s.runs += (key === 'runs') ? 0 : 0;
      }
      return s;
    },
    displayMain: (s) => s.runs,
    displayDetail: (s) => `${s.wickets} wkts · ${s.overs} ovs`,
  },
  soccer: {
    label: 'Soccer',
    home: [{ label: 'Goal  +1', value: 1, key: 'goals' }],
    away: [{ label: 'Goal  +1', value: 1, key: 'goals' }],
    initScore: () => ({ goals: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.goals,
    displayDetail: () => '',
  },
  netball: {
    label: 'Netball/Basketball',
    home: [
      { label: '+1 Pt',  value: 1, key: 'points' },
      { label: '+2 Pts', value: 2, key: 'points' },
      { label: '+3 Pts', value: 3, key: 'points' },
    ],
    away: [
      { label: '+1 Pt',  value: 1, key: 'points' },
      { label: '+2 Pts', value: 2, key: 'points' },
      { label: '+3 Pts', value: 3, key: 'points' },
    ],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  },
  rugby: {
    label: 'Rugby',
    home: [
      { label: 'Try  +4',       value: 4, key: 'points' },
      { label: 'Union Try +5',  value: 5, key: 'points' },
      { label: 'Conversion +2', value: 2, key: 'points' },
      { label: 'Drop Goal +3',  value: 3, key: 'points' },
    ],
    away: [
      { label: 'Try  +4',       value: 4, key: 'points' },
      { label: 'Union Try +5',  value: 5, key: 'points' },
      { label: 'Conversion +2', value: 2, key: 'points' },
      { label: 'Drop Goal +3',  value: 3, key: 'points' },
    ],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  },
};

/* ──────────────────────────────────────────────────────────────
   LOCALSTORAGE HELPERS
────────────────────────────────────────────────────────────── */
const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error('LS write failed', e); } },
  getTeams:    () => LS.get('ausclub_teams'),
  setTeams:    (v) => LS.set('ausclub_teams', v),
  getProducts: () => LS.get('ausclub_products'),
  setProducts: (v) => LS.set('ausclub_products', v),
  getMatches:  () => LS.get('ausclub_matches'),
  setMatches:  (v) => LS.set('ausclub_matches', v),
  getSales:    () => LS.get('ausclub_sales'),
  setSales:    (v) => LS.set('ausclub_sales', v),
};

/* ──────────────────────────────────────────────────────────────
   ID GENERATORS
────────────────────────────────────────────────────────────── */
function nextTeamId()    { const t = LS.getTeams();    return 'T' + String(t.length + 1).padStart(3, '0'); }
function nextProductId() { const p = LS.getProducts(); return 'P' + String(p.length + 1).padStart(3, '0'); }
function nextMatchId()   { const m = LS.getMatches();  return 'M' + String(m.length + 1).padStart(3, '0'); }
function nextSalesId()   { const s = LS.getSales();    return 'S' + String(s.length + 1).padStart(3, '0'); }

/* ──────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
────────────────────────────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

/* ──────────────────────────────────────────────────────────────
   TAB NAVIGATION
────────────────────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      // Refresh relevant views
      if (tab === 'teams')   renderTeams();
      if (tab === 'canteen') renderProducts();
      if (tab === 'history') renderHistory();
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   TEAMS MODULE
══════════════════════════════════════════════════════════════ */
function addTeam() {
  const name   = document.getElementById('teamName').value.trim();
  const sport  = document.getElementById('teamSport').value;
  const suburb = document.getElementById('teamSuburb').value.trim();

  if (!name || !sport || !suburb) { showToast('⚠ Fill in all team fields.', 'error'); return; }

  const teams = LS.getTeams();
  const dupe = teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.sport === sport);
  if (dupe) {
    showToast(`❌ Error: This team already exists under SKU ${dupe.id}.`, 'error');
    return;
  }

  const team = { id: nextTeamId(), name, sport, suburb };
  teams.push(team);
  LS.setTeams(teams);

  // Clear form
  document.getElementById('teamName').value  = '';
  document.getElementById('teamSport').value = '';
  document.getElementById('teamSuburb').value = '';

  showToast(`✅ Team ${team.id} "${team.name}" added.`, 'success');
  renderTeams();
  refreshTeamDropdowns();
}

function deleteTeam(id) {
  if (!confirm(`Delete team ${id}? This won't remove historical match data.`)) return;
  LS.setTeams(LS.getTeams().filter(t => t.id !== id));
  renderTeams();
  refreshTeamDropdowns();
  showToast(`Team ${id} deleted.`, 'info');
}

function renderTeams() {
  const teams = LS.getTeams();
  const tbody = document.getElementById('teamsBody');
  document.getElementById('teamCount').textContent = `${teams.length} team${teams.length !== 1 ? 's' : ''}`;

  if (!teams.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No teams registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = teams.map(t => `
    <tr>
      <td><span class="sku-chip">${t.id}</span></td>
      <td>${escHtml(t.name)}</td>
      <td>${sportLabel(t.sport)}</td>
      <td>${escHtml(t.suburb)}</td>
      <td><button class="delete-btn" onclick="deleteTeam('${t.id}')">Delete</button></td>
    </tr>
  `).join('');
}

function refreshTeamDropdowns() {
  const teams = LS.getTeams();
  const sport = document.getElementById('sportSelect').value;
  const filtered = sport ? teams.filter(t => t.sport === sport) : teams;

  ['homeTeamSelect', 'awayTeamSelect'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Select Team —</option>' +
      filtered.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${t.name} (${t.id})</option>`).join('');
  });
}

/* ══════════════════════════════════════════════════════════════
   PRODUCTS MODULE
══════════════════════════════════════════════════════════════ */
function addProduct() {
  const name   = document.getElementById('productName').value.trim();
  const size   = document.getElementById('productSize').value.trim();
  const cost   = parseFloat(document.getElementById('productCost').value);
  const retail = parseFloat(document.getElementById('productRetail').value);

  if (!name || !size || isNaN(cost) || isNaN(retail)) {
    showToast('⚠ Fill in all product fields.', 'error'); return;
  }

  const products = LS.getProducts();

  // Strict SKU variant logic
  const exactDupe = products.find(
    p => p.name.toLowerCase() === name.toLowerCase() && p.size.toLowerCase() === size.toLowerCase()
  );
  if (exactDupe) {
    showToast(`❌ Duplicate: "${name} ${size}" already exists as ${exactDupe.id}.`, 'error');
    return;
  }

  // Different size or cost = new variant (new SKU, info only)
  const sameNameDiffSize = products.find(p => p.name.toLowerCase() === name.toLowerCase());
  const prod = { id: nextProductId(), name, size, cost, retail };
  products.push(prod);
  LS.setProducts(products);

  document.getElementById('productName').value  = '';
  document.getElementById('productSize').value  = '';
  document.getElementById('productCost').value  = '';
  document.getElementById('productRetail').value = '';

  if (sameNameDiffSize) {
    showToast(`✅ New variant ${prod.id} added for "${name}" (${size}).`, 'success');
  } else {
    showToast(`✅ Product ${prod.id} "${name}" added.`, 'success');
  }
  renderProducts();
}

function deleteProduct(id) {
  if (!confirm(`Delete product ${id}?`)) return;
  LS.setProducts(LS.getProducts().filter(p => p.id !== id));
  renderProducts();
  showToast(`Product ${id} deleted.`, 'info');
}

function renderProducts() {
  const products = LS.getProducts();
  const tbody = document.getElementById('productsBody');
  document.getElementById('productCount').textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No products registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    const margin = p.retail - p.cost;
    const pct = ((margin / p.cost) * 100).toFixed(0);
    return `
    <tr>
      <td><span class="sku-chip">${p.id}</span></td>
      <td>${escHtml(p.name)}</td>
      <td>${escHtml(p.size)}</td>
      <td>$${p.cost.toFixed(2)}</td>
      <td>$${p.retail.toFixed(2)}</td>
      <td><span class="margin-chip">+$${margin.toFixed(2)} (${pct}%)</span></td>
      <td><button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════════
   SCORING BUTTONS — render dynamic buttons per sport
══════════════════════════════════════════════════════════════ */
function buildScoringButtons(sport, side) {
  const cfg = SPORTS[sport];
  if (!cfg) return '';
  return cfg[side].map(btn => `
    <button
      class="score-btn score-btn--${side}"
      onclick="handleScore('${side}', '${btn.key}', ${btn.value || 0}${btn.inc ? `, true` : ''})"
    >${btn.label}</button>
  `).join('');
}

/* ══════════════════════════════════════════════════════════════
   MATCH MODULE
══════════════════════════════════════════════════════════════ */
function startMatch() {
  const sport     = document.getElementById('sportSelect').value;
  const date      = document.getElementById('matchDate').value;
  const time      = document.getElementById('matchTime').value;
  const tempRaw   = document.getElementById('weatherTemp').value;
  const homeId    = document.getElementById('homeTeamSelect').value;
  const awayId    = document.getElementById('awayTeamSelect').value;
  const status    = document.getElementById('matchStatus').value;
  const notes     = document.getElementById('matchNotes').value.trim();
  const temp      = parseFloat(tempRaw);

  if (!sport || !date || !homeId || !awayId) {
    showToast('⚠ Select sport, date, home & away teams.', 'error'); return;
  }
  if (homeId === awayId) {
    showToast('⚠ Home and Away teams must be different.', 'error'); return;
  }

  const teams     = LS.getTeams();
  const homeTeam  = teams.find(t => t.id === homeId);
  const awayTeam  = teams.find(t => t.id === awayId);
  const cfg       = SPORTS[sport];

  // ── EXTREME HEAT CHECK ─────────────────────────────────────
  if (!isNaN(temp) && temp >= 40) {
    triggerHeatPolicy(temp);

    state.match = {
      id:       nextMatchId(),
      sport, date, time,
      weather:  temp,
      homeId, awayId,
      homeScore: cfg.initScore(),
      awayScore: cfg.initScore(),
      status:   'Cancelled',
      notes:    'Cancelled due to National Heat Policy. Re-match pending.',
      cancelled: true,
    };

    renderLivePanel(sport, homeTeam, awayTeam, true);
    return;
  }

  state.match = {
    id:       nextMatchId(),
    sport, date, time,
    weather:  isNaN(temp) ? null : temp,
    homeId, awayId,
    homeScore: cfg.initScore(),
    awayScore: cfg.initScore(),
    status,
    notes,
    cancelled: false,
  };

  renderLivePanel(sport, homeTeam, awayTeam, false);
  generateForecast(homeId, awayId);
}

function renderLivePanel(sport, homeTeam, awayTeam, cancelled) {
  const panel = document.getElementById('livePanel');
  panel.classList.remove('hidden');

  // Team names on board
  document.getElementById('homeName').textContent = homeTeam.name;
  document.getElementById('awayName').textContent = awayTeam.name;
  document.getElementById('homeLabel').textContent = homeTeam.name.toUpperCase();
  document.getElementById('awayLabel').textContent = awayTeam.name.toUpperCase();
  document.getElementById('sportChip').textContent = SPORTS[sport].label;

  updateScoreDisplay();

  // Scoring buttons
  document.getElementById('homeBtns').innerHTML = buildScoringButtons(sport, 'home');
  document.getElementById('awayBtns').innerHTML = buildScoringButtons(sport, 'away');

  // Canteen sales form
  buildCanteenSalesForm(cancelled);

  // Scroll to live panel
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleScore(side, key, value, isIncrement = false) {
  if (!state.match || state.match.cancelled) return;
  const cfg = SPORTS[state.match.sport];
  const scoreObj = side === 'home' ? state.match.homeScore : state.match.awayScore;

  if (state.match.sport === 'cricket') {
    if (key === 'wickets' && isIncrement) {
      scoreObj.wickets = Math.min((scoreObj.wickets || 0) + 1, 10);
    } else if (key === 'dotballs') {
      scoreObj.dotballs = (scoreObj.dotballs || 0) + 1;
      scoreObj.overs = parseFloat(((scoreObj.overs || 0) + (1 / 6)).toFixed(2));
    } else {
      scoreObj.runs = (scoreObj.runs || 0) + value;
    }
  } else if (state.match.sport === 'afl') {
    scoreObj[key] = (scoreObj[key] || 0) + value;
    cfg.calcScore(scoreObj);
  } else {
    scoreObj[key] = (scoreObj[key] || 0) + value;
  }

  updateScoreDisplay();

  // Pop animation
  const el = document.getElementById(side === 'home' ? 'homeScoreMain' : 'awayScoreMain');
  el.classList.remove('score-pop');
  void el.offsetWidth; // reflow
  el.classList.add('score-pop');
}

function updateScoreDisplay() {
  if (!state.match) return;
  const sport = state.match.sport;
  const cfg   = SPORTS[sport];

  const hMain = document.getElementById('homeScoreMain');
  const aMain = document.getElementById('awayScoreMain');
  const hDetail = document.getElementById('homeScoreDetail');
  const aDetail = document.getElementById('awayScoreDetail');

  hMain.textContent   = cfg.displayMain(state.match.homeScore);
  aMain.textContent   = cfg.displayMain(state.match.awayScore);
  hDetail.textContent = cfg.displayDetail(state.match.homeScore);
  aDetail.textContent = cfg.displayDetail(state.match.awayScore);
}

function resetMatch() {
  if (!confirm('Reset current match? Unsaved data will be lost.')) return;
  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
  document.getElementById('sportSelect').value = '';
  document.getElementById('matchDate').value = '';
  document.getElementById('matchTime').value = '';
  document.getElementById('weatherTemp').value = '';
  document.getElementById('matchNotes').value = '';
  document.getElementById('matchStatus').value = 'Completed';
  showToast('Match reset.', 'info');
}

function saveMatch() {
  if (!state.match) { showToast('No active match to save.', 'error'); return; }

  const cfg     = SPORTS[state.match.sport];
  const matches = LS.getMatches();
  const sales   = LS.getSales();

  // Final score numbers (simple)
  const homeScore = cfg.displayMain(state.match.homeScore);
  const awayScore = cfg.displayMain(state.match.awayScore);

  const matchRecord = {
    match_id:       state.match.id,
    date:           state.match.date,
    time:           state.match.time,
    weather_temp_c: state.match.weather ?? '',
    sport_type:     state.match.sport,
    home_team_id:   state.match.homeId,
    away_team_id:   state.match.awayId,
    home_score:     state.match.cancelled ? 0 : homeScore,
    away_score:     state.match.cancelled ? 0 : awayScore,
    status:         state.match.status,
    notes:          state.match.notes,
  };

  matches.push(matchRecord);
  LS.setMatches(matches);

  // Canteen sales — force 0 if cancelled
  const products = LS.getProducts();
  products.forEach(p => {
    const qty = state.match.cancelled ? 0 : getSalesQty(p.id);
    const saleId = nextSalesId();
    // Re-read latest sales to avoid ID collision
    const freshSales = LS.getSales();
    freshSales.push({
      sales_id:   'S' + String(freshSales.length + 1).padStart(4, '0'),
      match_id:   state.match.id,
      product_id: p.id,
      quantity:   qty,
    });
    LS.setSales(freshSales);
  });

  showToast(`✅ Match ${state.match.id} saved successfully!`, 'success');

  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
}

function getSalesQty(productId) {
  const input = document.getElementById(`sale-${productId}`);
  const val   = input ? parseInt(input.value, 10) : 0;
  return isNaN(val) || val < 0 ? 0 : val;
}

/* ──────────────────────────────────────────────────────────────
   CANTEEN SALES FORM
────────────────────────────────────────────────────────────── */
function buildCanteenSalesForm(cancelled) {
  const products = LS.getProducts();
  const container = document.getElementById('canteenSalesForm');

  if (!products.length) {
    container.innerHTML = '<p class="muted">No products in catalogue. Add products in the Canteen tab.</p>';
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="canteen-sales-item">
      <div class="canteen-sales-item__name">${escHtml(p.name)} · ${escHtml(p.size)}</div>
      <div class="canteen-sales-item__sku">${p.id} · $${p.retail.toFixed(2)}</div>
      <input
        type="number"
        id="sale-${p.id}"
        value="0"
        min="0"
        placeholder="Qty sold"
        ${cancelled ? 'disabled title="Cancelled match — sales forced to 0"' : ''}
      />
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════════
   DEMAND FORECAST ENGINE
══════════════════════════════════════════════════════════════ */
function generateForecast(homeId, awayId) {
  const matches  = LS.getMatches();
  const sales    = LS.getSales();
  const products = LS.getProducts();
  const panel    = document.getElementById('forecastPanel');
  const content  = document.getElementById('forecastContent');

  // Filter completed matches between these two teams (either direction)
  const relevant = matches.filter(m =>
    m.status === 'Completed' &&
    ((m.home_team_id === homeId && m.away_team_id === awayId) ||
     (m.home_team_id === awayId && m.away_team_id === homeId))
  );

  if (!relevant.length) {
    content.innerHTML = '<p class="muted">No historical completed matchups found for these teams. Stock levels are up to you!</p>';
    return;
  }

  const matchIds = relevant.map(m => m.match_id);

  // Average sales per product across historical matchups
  if (!products.length) {
    content.innerHTML = '<p class="muted">Add products to the catalogue to enable forecasting.</p>';
    return;
  }

  const rows = products.map(p => {
    const historicalSales = sales.filter(s => matchIds.includes(s.match_id) && s.product_id === p.id);
    const total = historicalSales.reduce((sum, s) => sum + (parseInt(s.quantity, 10) || 0), 0);
    const avg   = historicalSales.length ? total / historicalSales.length : 0;
    const recommended = Math.ceil(avg * 1.2); // 20% safety stock
    return { product: p, avg, recommended };
  });

  content.innerHTML = `
    <p style="color:var(--text-secondary); margin-bottom: var(--sp-4);">
      Based on <strong style="color:var(--accent)">${relevant.length}</strong> historical completed matchup${relevant.length !== 1 ? 's' : ''},
      recommended stock for today (incl. 20% safety buffer):
    </p>
    ${rows.map(r => `
      <div class="forecast-item">
        <span class="forecast-item__sku">${r.product.id}</span>
        <span class="forecast-item__name">${escHtml(r.product.name)} · ${escHtml(r.product.size)}</span>
        <div>
          <div class="forecast-item__qty">${r.recommended}</div>
          <div class="forecast-item__unit">units</div>
        </div>
      </div>
    `).join('')}
    <p class="forecast-meta">Algorithm: avg(${relevant.length} games) × 1.2× safety stock coefficient</p>
  `;
}

/* ══════════════════════════════════════════════════════════════
   HEAT POLICY
══════════════════════════════════════════════════════════════ */
function triggerHeatPolicy(temp) {
  document.getElementById('heatTemp').textContent = temp;
  document.getElementById('heatOverlay').classList.remove('hidden');
  document.getElementById('matchStatus').value = 'Cancelled';
  document.getElementById('matchNotes').value = 'Cancelled due to National Heat Policy. Re-match pending.';
}

document.getElementById('heatOkBtn').addEventListener('click', () => {
  document.getElementById('heatOverlay').classList.add('hidden');
});

/* ══════════════════════════════════════════════════════════════
   HISTORY
══════════════════════════════════════════════════════════════ */
function renderHistory() {
  const matches  = LS.getMatches();
  const teams    = LS.getTeams();
  const tbody    = document.getElementById('matchesBody');
  document.getElementById('matchCount').textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;

  if (!matches.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No matches recorded yet.</td></tr>';
    return;
  }

  const teamName = (id) => { const t = teams.find(t => t.id === id); return t ? t.name : id; };

  tbody.innerHTML = [...matches].reverse().map(m => `
    <tr>
      <td><span class="sku-chip">${m.match_id}</span></td>
      <td>${m.date}</td>
      <td>${sportLabel(m.sport_type)}</td>
      <td>${escHtml(teamName(m.home_team_id))}</td>
      <td>${escHtml(teamName(m.away_team_id))}</td>
      <td><strong>${m.home_score}</strong> – <strong>${m.away_score}</strong></td>
      <td>${m.weather_temp_c !== '' ? m.weather_temp_c + '°C' : '—'}</td>
      <td><span class="status-chip status-chip--${m.status.toLowerCase()}">${m.status}</span></td>
      <td><button class="delete-btn" onclick="deleteMatch('${m.match_id}')">Delete</button></td>
    </tr>
  `).join('');
}

function deleteMatch(id) {
  if (!confirm(`Delete match ${id} and all related sales records?`)) return;
  LS.setMatches(LS.getMatches().filter(m => m.match_id !== id));
  LS.setSales(LS.getSales().filter(s => s.match_id !== id));
  renderHistory();
  showToast(`Match ${id} deleted.`, 'info');
}

/* ══════════════════════════════════════════════════════════════
   CSV EXPORT
══════════════════════════════════════════════════════════════ */
function csvRow(vals) { return vals.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','); }

function downloadCSV(filename, header, rows) {
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href  = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`📥 ${filename} downloaded!`, 'success');
}

function exportMatches() {
  const header = ['match_id','date','time','weather_temp_c','sport_type','home_team_id','away_team_id','home_score','away_score','status','notes'];
  const rows   = LS.getMatches().map(m => csvRow([m.match_id,m.date,m.time,m.weather_temp_c,m.sport_type,m.home_team_id,m.away_team_id,m.home_score,m.away_score,m.status,m.notes]));
  downloadCSV('matches.csv', header, rows);
}

function exportSales() {
  const header = ['sales_id','match_id','product_id','quantity'];
  const rows   = LS.getSales().map(s => csvRow([s.sales_id, s.match_id, s.product_id, s.quantity]));
  downloadCSV('sales.csv', header, rows);
}

function exportTeams() {
  const header = ['team_id','team_name','sport_type','suburb'];
  const rows   = LS.getTeams().map(t => csvRow([t.id, t.name, t.sport, t.suburb]));
  downloadCSV('teams.csv', header, rows);
}

function exportProducts() {
  const header = ['product_id','product_name','size','cost_price','retail_price'];
  const rows   = LS.getProducts().map(p => csvRow([p.id, p.name, p.size, p.cost, p.retail]));
  downloadCSV('products.csv', header, rows);
}

function clearAllData() {
  if (!confirm('⚠ This will permanently erase ALL data (teams, products, matches, sales). Are you absolutely sure?')) return;
  if (!confirm('Last chance — this cannot be undone. Erase everything?')) return;
  ['ausclub_teams','ausclub_products','ausclub_matches','ausclub_sales'].forEach(k => localStorage.removeItem(k));
  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
  renderTeams();
  renderProducts();
  renderHistory();
  refreshTeamDropdowns();
  showToast('All data cleared.', 'info');
}

/* ──────────────────────────────────────────────────────────────
   UTILS
────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function sportLabel(key) {
  const m = { afl: 'AFL', cricket: 'Cricket', soccer: 'Soccer', netball: 'Netball/Basketball', rugby: 'Rugby' };
  return m[key] || key;
}

/* ──────────────────────────────────────────────────────────────
   SET DEFAULTS
────────────────────────────────────────────────────────────── */
function setDefaults() {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  document.getElementById('matchDate').value = `${yyyy}-${mm}-${dd}`;

  const hh = String(today.getHours()).padStart(2, '0');
  const mn = String(today.getMinutes()).padStart(2, '0');
  document.getElementById('matchTime').value = `${hh}:${mn}`;
}

/* ──────────────────────────────────────────────────────────────
   SPORT SELECT CHANGE — filter team dropdowns
────────────────────────────────────────────────────────────── */
document.getElementById('sportSelect').addEventListener('change', () => {
  refreshTeamDropdowns();
});

/* ──────────────────────────────────────────────────────────────
   WIRE UP EVENT LISTENERS
────────────────────────────────────────────────────────────── */
function initEventListeners() {
  // Scoreboard
  document.getElementById('startMatchBtn').addEventListener('click', startMatch);
  document.getElementById('resetMatchBtn').addEventListener('click', resetMatch);
  document.getElementById('saveMatchBtn').addEventListener('click', saveMatch);

  // Teams
  document.getElementById('addTeamBtn').addEventListener('click', addTeam);

  // Products
  document.getElementById('addProductBtn').addEventListener('click', addProduct);

  // Export
  document.getElementById('exportMatchesBtn').addEventListener('click', exportMatches);
  document.getElementById('exportSalesBtn').addEventListener('click', exportSales);
  document.getElementById('exportTeamsBtn').addEventListener('click', exportTeams);
  document.getElementById('exportProductsBtn').addEventListener('click', exportProducts);
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
}

/* ──────────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────────── */
function init() {
  initTabs();
  initEventListeners();
  setDefaults();
  renderTeams();
  renderProducts();
  refreshTeamDropdowns();
}

document.addEventListener('DOMContentLoaded', init);
