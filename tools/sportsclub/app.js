/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js
   Stable Local Storage Implementation with strict NaN safeguards
═══════════════════════════════════════════════════════════════ */

'use strict';

const state = { match: null };

/* ── SPORT SCORING CONFIG ──────────── */
const SPORTS = {
  afl: {
    label: 'AFL',
    home: [{ label: 'Goal  +6', value: 6, key: 'goals' }, { label: 'Behind +1', value: 1, key: 'behinds' }],
    away: [{ label: 'Goal  +6', value: 6, key: 'goals' }, { label: 'Behind +1', value: 1, key: 'behinds' }],
    initScore: () => ({ goals: 0, behinds: 0, total: 0 }),
    calcScore: (s) => { s.total = s.goals * 6 + s.behinds; return s; },
    displayMain: (s) => s.total,
    displayDetail: (s) => `${s.goals}.${s.behinds}`,
  },
  cricket: {
    label: 'Cricket',
    home: [{ label: '+1 Run', value: 1, key: 'runs' }, { label: '+4 Runs', value: 4, key: 'runs' }, { label: '+6 Runs', value: 6, key: 'runs' }, { label: 'Wicket', value: 0, key: 'wickets', inc: 1 }, { label: 'Dot Ball', value: 0, key: 'dotballs' }],
    away: [{ label: '+1 Run', value: 1, key: 'runs' }, { label: '+4 Runs', value: 4, key: 'runs' }, { label: '+6 Runs', value: 6, key: 'runs' }, { label: 'Wicket', value: 0, key: 'wickets', inc: 1 }, { label: 'Dot Ball', value: 0, key: 'dotballs' }],
    initScore: () => ({ runs: 0, wickets: 0, overs: 0.0, dotballs: 0 }),
    calcScore: (s) => s,
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
    home: [{ label: '+1 Pt', value: 1, key: 'points' }, { label: '+2 Pts', value: 2, key: 'points' }, { label: '+3 Pts', value: 3, key: 'points' }],
    away: [{ label: '+1 Pt', value: 1, key: 'points' }, { label: '+2 Pts', value: 2, key: 'points' }, { label: '+3 Pts', value: 3, key: 'points' }],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  },
  rugby: {
    label: 'Rugby',
    home: [{ label: 'Try  +4', value: 4, key: 'points' }, { label: 'Union Try +5', value: 5, key: 'points' }, { label: 'Conversion +2', value: 2, key: 'points' }, { label: 'Drop Goal +3', value: 3, key: 'points' }],
    away: [{ label: 'Try  +4', value: 4, key: 'points' }, { label: 'Union Try +5', value: 5, key: 'points' }, { label: 'Conversion +2', value: 2, key: 'points' }, { label: 'Drop Goal +3', value: 3, key: 'points' }],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  },
};

/* ── LOCALSTORAGE SAFE WRAPPERS ──────── */
const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error('LS Error', e); } },
  getTeams: () => LS.get('ausclub_teams'), setTeams: (v) => LS.set('ausclub_teams', v),
  getProducts: () => LS.get('ausclub_products'), setProducts: (v) => LS.set('ausclub_products', v),
  getMatches: () => LS.get('ausclub_matches'), setMatches: (v) => LS.set('ausclub_matches', v),
  getSales: () => LS.get('ausclub_sales'), setSales: (v) => LS.set('ausclub_sales', v),
};

function nextId(prefix, arr) { return prefix + String(arr.length + 1).padStart(3, '0'); }

/* ── TOAST NOTIFICATIONS ────────────── */
let toastTimer;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast toast--${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3200);
}

/* ── TABS ────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      if (tab === 'teams') renderTeams();
      if (tab === 'canteen') renderProducts();
      if (tab === 'history') renderHistory();
    });
  });
}

/* ── TEAMS MODULE ────────────── */
function addTeam() {
  const name = document.getElementById('teamName').value.trim();
  const sport = document.getElementById('teamSport').value;
  const suburb = document.getElementById('teamSuburb').value.trim();

  if (!name || !sport || !suburb) return showToast('⚠ Fill in all team fields.', 'error');
  const teams = LS.getTeams();
  if (teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.sport === sport)) return showToast('❌ Team already exists.', 'error');

  const team = { id: nextId('T', teams), name, sport, suburb };
  teams.push(team); LS.setTeams(teams);
  
  document.getElementById('teamName').value = '';
  document.getElementById('teamSport').value = '';
  document.getElementById('teamSuburb').value = '';
  showToast(`✅ Team ${team.name} added.`, 'success');
  renderTeams(); refreshTeamDropdowns();
}

window.deleteTeam = function(id) {
  if (!confirm(`Delete team ${id}?`)) return;
  LS.setTeams(LS.getTeams().filter(t => t.id !== id));
  renderTeams(); refreshTeamDropdowns();
  showToast(`Team deleted.`, 'info');
};

function renderTeams() {
  const teams = LS.getTeams();
  const tbody = document.getElementById('teamsBody');
  document.getElementById('teamCount').textContent = `${teams.length} teams`;
  if (!teams.length) return tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No teams found.</td></tr>';

  tbody.innerHTML = teams.map(t => `
    <tr>
      <td><span class="sku-chip">${t.id}</span></td>
      <td>${escHtml(t.name)}</td>
      <td>${t.sport.toUpperCase()}</td>
      <td>${escHtml(t.suburb)}</td>
      <td><button class="delete-btn" onclick="window.deleteTeam('${t.id}')">Delete</button></td>
    </tr>`).join('');
}

function refreshTeamDropdowns() {
  const teams = LS.getTeams();
  const sport = document.getElementById('sportSelect').value;
  const filtered = sport ? teams.filter(t => t.sport === sport) : teams;
  
  ['homeTeamSelect', 'awayTeamSelect'].forEach(id => {
    const sel = document.getElementById(id); const cur = sel.value;
    sel.innerHTML = '<option value="">— Select Team —</option>' + filtered.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${t.name} (${t.id})</option>`).join('');
  });
}

/* ── PRODUCTS MODULE ────────────── */
function addProduct() {
  const name = document.getElementById('productName').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value) || 0;
  const retail = parseFloat(document.getElementById('productRetail').value) || 0;
  
  // Safe parsing to prevent NaN errors corrupting stock tracking
  let initStock = parseInt(document.getElementById('productStock').value, 10);
  if (isNaN(initStock)) initStock = 0;

  if (!name || !size) return showToast('⚠ Provide Name & Size.', 'error');
  
  const products = LS.getProducts();
  if (products.find(p => p.name.toLowerCase() === name.toLowerCase() && p.size.toLowerCase() === size.toLowerCase())) {
    return showToast('❌ Variant already exists.', 'error');
  }

  const prod = { id: nextId('P', products), name, size, cost, retail, initialStock: initStock, currentStock: initStock };
  products.push(prod); LS.setProducts(products);
  
  document.getElementById('productName').value = '';
  document.getElementById('productSize').value = '';
  document.getElementById('productCost').value = '';
  document.getElementById('productRetail').value = '';
  document.getElementById('productStock').value = '';
  
  showToast(`✅ Product ${name} added.`, 'success');
  renderProducts();
}

window.deleteProduct = function(id) {
  if (!confirm(`Delete product ${id}?`)) return;
  LS.setProducts(LS.getProducts().filter(p => p.id !== id));
  renderProducts();
  showToast(`Product deleted.`, 'info');
};

function renderProducts() {
  const products = LS.getProducts();
  const tbody = document.getElementById('productsBody');
  document.getElementById('productCount').textContent = `${products.length} products`;
  if (!products.length) return tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No products registered yet.</td></tr>';

  tbody.innerHTML = products.map(p => {
    const margin = p.retail - p.cost;
    const pct = p.cost > 0 ? ((margin / p.cost) * 100).toFixed(0) : '0';
    
    // Safety check formatting
    let initStk = parseInt(p.initialStock);
    if (isNaN(initStk)) initStk = 0;
    let curStk = parseInt(p.currentStock);
    if (isNaN(curStk)) curStk = initStk;

    return `
    <tr>
      <td><span class="sku-chip">${p.id}</span></td>
      <td>${escHtml(p.name)}</td>
      <td>${escHtml(p.size)}</td>
      <td>$${parseFloat(p.cost).toFixed(2)}</td>
      <td>$${parseFloat(p.retail).toFixed(2)}</td>
      <td><span class="margin-chip">+$${margin.toFixed(2)} (${pct}%)</span></td>
      <td>${initStk}</td>
      <td><strong style="color:var(--text-primary);">${curStk}</strong></td>
      <td><button class="delete-btn" onclick="window.deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}

/* ── SCORING LOGIC ────────────── */
function buildScoringButtons(sport, side) {
  const cfg = SPORTS[sport]; if (!cfg) return '';
  return cfg[side].map(btn => `
    <button class="score-btn score-btn--${side}" onclick="window.handleScore('${side}', '${btn.key}', ${btn.value || 0}, ${btn.inc ? `true` : `false`})">
      ${btn.label}
    </button>
  `).join('');
}

window.handleScore = function(side, key, value, isIncrement) {
  if (!state.match || state.match.cancelled) return;
  const cfg = SPORTS[state.match.sport];
  const scoreObj = side === 'home' ? state.match.homeScore : state.match.awayScore;
  value = parseFloat(value) || 0;

  if (state.match.sport === 'cricket') {
    if (key === 'wickets' && isIncrement) {
      scoreObj.wickets = Math.min((scoreObj.wickets || 0) + 1, 10);
    } else if (key === 'dotballs') {
      scoreObj.dotballs = (scoreObj.dotballs || 0) + 1;
      scoreObj.overs = parseFloat(((scoreObj.overs || 0) + (1 / 6)).toFixed(1));
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

  const el = document.getElementById(side === 'home' ? 'homeScoreMain' : 'awayScoreMain');
  if(el) {
    el.classList.remove('score-pop'); void el.offsetWidth; el.classList.add('score-pop');
  }
};

/* ── MATCH MODULE ────────────── */
function startMatch() {
  const sport = document.getElementById('sportSelect').value;
  const date = document.getElementById('matchDate').value;
  const time = document.getElementById('matchTime').value;
  const tempRaw = document.getElementById('weatherTemp').value;
  const homeId = document.getElementById('homeTeamSelect').value;
  const awayId = document.getElementById('awayTeamSelect').value;

  if (!sport || !date || !homeId || !awayId) return showToast('⚠ Select sport, date & teams.', 'error');
  if (homeId === awayId) return showToast('⚠ Teams must be different.', 'error');

  const teams = LS.getTeams();
  const homeTeam = teams.find(t => t.id === homeId);
  const awayTeam = teams.find(t => t.id === awayId);
  const cfg = SPORTS[sport];
  const temp = parseFloat(tempRaw);

  const isHeatRisk = !isNaN(temp) && temp >= 40;
  
  state.match = {
    id: nextId('M', LS.getMatches()), sport, date, time, weather: isNaN(temp) ? null : temp,
    homeId, awayId, homeScore: cfg.initScore(), awayScore: cfg.initScore(),
    status: isHeatRisk ? 'Cancelled' : document.getElementById('matchStatus').value,
    notes: isHeatRisk ? 'Cancelled due to National Heat Policy.' : document.getElementById('matchNotes').value,
    cancelled: isHeatRisk,
    salesCounter: {}
  };

  const matches = LS.getMatches();
  matches.push({
    match_id: state.match.id, date: state.match.date, time: state.match.time, 
    weather_temp_c: state.match.weather ?? '', sport_type: state.match.sport,
    home_team_id: state.match.homeId, away_team_id: state.match.awayId,
    home_score: 0, away_score: 0, status: isHeatRisk ? "Cancelled" : "In Progress", notes: state.match.notes,
  });
  LS.setMatches(matches);

  if (isHeatRisk) { triggerHeatPolicy(temp); }

  renderLivePanel(sport, homeTeam, awayTeam, isHeatRisk);
  generateForecast(homeId, awayId);
}

function updateScoreDisplay() {
  if (!state.match) return;
  const cfg = SPORTS[state.match.sport];
  document.getElementById('homeScoreMain').textContent = cfg.displayMain(state.match.homeScore);
  document.getElementById('awayScoreMain').textContent = cfg.displayMain(state.match.awayScore);
  document.getElementById('homeScoreDetail').textContent = cfg.displayDetail(state.match.homeScore);
  document.getElementById('awayScoreDetail').textContent = cfg.displayDetail(state.match.awayScore);
}

function renderLivePanel(sport, homeTeam, awayTeam, cancelled) {
  const panel = document.getElementById('livePanel');
  panel.classList.remove('hidden');

  document.getElementById('homeName').textContent = homeTeam.name;
  document.getElementById('awayName').textContent = awayTeam.name;
  document.getElementById('homeLabel').textContent = homeTeam.name.toUpperCase();
  document.getElementById('awayLabel').textContent = awayTeam.name.toUpperCase();
  document.getElementById('sportChip').textContent = SPORTS[sport].label;

  updateScoreDisplay();
  document.getElementById('homeBtns').innerHTML = buildScoringButtons(sport, 'home');
  document.getElementById('awayBtns').innerHTML = buildScoringButtons(sport, 'away');

  buildCanteenSalesForm(cancelled);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── LIVE CANTEEN SALES LOGIC ────────────── */
function buildCanteenSalesForm(cancelled) {
  const products = LS.getProducts();
  const container = document.getElementById('canteenSalesForm');

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="muted" style="grid-column: 1/-1;">No products found in catalogue. Go to Canteen tab and Add Product to enable live tracking.</p>';
    return;
  }

  container.innerHTML = products.map(p => {
    state.match.salesCounter[p.id] = state.match.salesCounter[p.id] || 0;
    
    let initStk = parseInt(p.initialStock); if (isNaN(initStk)) initStk = 0;
    let curStk = parseInt(p.currentStock); if (isNaN(curStk)) curStk = initStk;
    
    const isOut = curStk <= 0;
    const disabledStr = (cancelled || isOut) ? 'disabled style="filter: grayscale(1); cursor: not-allowed; opacity: 0.5;"' : '';
    const btnLabel = isOut ? 'OUT OF STOCK' : '[+1 Sold]';

    return `
    <div class="canteen-sales-item" style="display: flex; flex-direction: column; gap: 8px;">
      <div class="canteen-sales-item__name">${escHtml(p.name)} (${escHtml(p.size)})</div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em;">
          <div class="canteen-sales-item__sku" style="margin: 0;">Stock: <strong id="stock-${p.id}" style="color:var(--text-primary); font-size: 1.1em;">${curStk}</strong></div>
          <div class="canteen-sales-item__sku" style="margin: 0;">Sold Today: <strong id="sold-${p.id}" style="color:var(--text-primary); font-size: 1.1em;">${state.match.salesCounter[p.id]}</strong></div>
      </div>
      <button class="btn btn--primary" style="margin-top: 4px;" id="btn-sell-${p.id}" ${disabledStr} onclick="window.sellProduct('${p.id}')">${btnLabel}</button>
    </div>
  `}).join('');
}

window.sellProduct = function(productId) {
  if (!state.match || state.match.cancelled) return;
  const products = LS.getProducts();
  const pIndex = products.findIndex(prod => prod.id === productId);
  if (pIndex === -1) return;

  let initStock = parseInt(products[pIndex].initialStock); if(isNaN(initStock)) initStock = 0;
  let currentStock = parseInt(products[pIndex].currentStock); if(isNaN(currentStock)) currentStock = initStock;
  
  if (currentStock <= 0) return;

  // 1. Immediately deduct stock
  products[pIndex].currentStock = currentStock - 1;
  LS.setProducts(products);
  
  // 2. Increment match UI sales counter
  state.match.salesCounter[productId] = (state.match.salesCounter[productId] || 0) + 1;

  // 3. Log sales item securely
  const freshSales = LS.getSales();
  freshSales.push({
    sales_id: 'S' + String(freshSales.length + 1).padStart(4, '0'),
    match_id: state.match.id,
    product_id: productId,
    quantity: 1,
  });
  LS.setSales(freshSales);

  // 4. Update the live Stock/Sales texts safely
  document.getElementById(`stock-${productId}`).textContent = products[pIndex].currentStock;
  document.getElementById(`sold-${productId}`).textContent = state.match.salesCounter[productId];

  // 5. Instantly disable if depleted
  if (products[pIndex].currentStock <= 0) {
    const btn = document.getElementById(`btn-sell-${productId}`);
    if (btn) {
      btn.disabled = true;
      btn.style.filter = "grayscale(1)"; btn.style.opacity = "0.5"; btn.style.cursor = "not-allowed";
      btn.textContent = "OUT OF STOCK";
    }
  }
};

/* ── Finalise & Reset ────────────── */
function resetMatch() {
  if (!confirm('Reset current match window? (Canteen stock deductions are permanent).')) return;
  if (state.match && state.match.id) {
    LS.setMatches(LS.getMatches().filter(m => m.match_id !== state.match.id));
    LS.setSales(LS.getSales().filter(m => m.match_id !== state.match.id));
  }
  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
  document.getElementById('matchDate').value = '';
  document.getElementById('matchNotes').value = '';
  showToast('Match reset/cleared.', 'info');
}

function saveMatch() {
  if (!state.match) return;
  const cfg = SPORTS[state.match.sport];
  const matches = LS.getMatches();
  
  const mIndex = matches.findIndex(m => m.match_id === state.match.id);
  if (mIndex !== -1) {
    matches[mIndex].status = document.getElementById('matchStatus').value || 'Completed';
    matches[mIndex].home_score = state.match.cancelled ? 0 : cfg.displayMain(state.match.homeScore);
    matches[mIndex].away_score = state.match.cancelled ? 0 : cfg.displayMain(state.match.awayScore);
    matches[mIndex].notes = document.getElementById('matchNotes').value;
    LS.setMatches(matches);
  }

  showToast(`✅ Match saved successfully! Check History panel.`, 'success');
  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
  renderHistory();
  
  // Auto-switch to history tab so they can see the records working properly
  document.querySelector('.tab-btn[data-tab="history"]').click();
}

/* ── ALL REMAINING EVENT & DATA LOGIC ────────────── */

function generateForecast(homeId, awayId) {
  const relevant = LS.getMatches().filter(m => m.status === 'Completed' && ((m.home_team_id === homeId && m.away_team_id === awayId) || (m.home_team_id === awayId && m.away_team_id === homeId)));
  const content = document.getElementById('forecastContent');
  if (!relevant.length) return content.innerHTML = '<p class="muted">No historical matchups found. Stock is up to you!</p>';

  const rows = LS.getProducts().map(p => {
    const historical = LS.getSales().filter(s => relevant.some(r => r.match_id === s.match_id) && s.product_id === p.id);
    const avg = historical.length ? historical.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0) / historical.length : 0;
    return { product: p, recommended: Math.ceil(avg * 1.2) };
  });

  content.innerHTML = `
    <p style="color:var(--text-secondary); margin-bottom: var(--sp-4);">Based on <strong>${relevant.length}</strong> previous matches (incl 20% safety stock buffer):</p>
    ${rows.map(r => `
      <div class="forecast-item">
        <span class="forecast-item__name">${escHtml(r.product.name)}</span>
        <div class="forecast-item__qty">${r.recommended}</div>
      </div>`).join('')}
  `;
}

function renderHistory() {
  const matches = LS.getMatches(); const teams = LS.getTeams();
  const tbody = document.getElementById('matchesBody');
  document.getElementById('matchCount').textContent = `${matches.length} matches`;
  if (!matches.length) return tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No matches found.</td></tr>';

  tbody.innerHTML = [...matches].reverse().map(m => `
    <tr>
      <td><span class="sku-chip">${m.match_id}</span></td>
      <td>${m.date}</td>
      <td>${(m.sport_type || '').toUpperCase()}</td>
      <td>${escHtml((teams.find(t => t.id === m.home_team_id) || {}).name || m.home_team_id)}</td>
      <td>${escHtml((teams.find(t => t.id === m.away_team_id) || {}).name || m.away_team_id)}</td>
      <td><strong>${m.home_score}</strong> – <strong>${m.away_score}</strong></td>
      <td>${m.weather_temp_c ? m.weather_temp_c + '°C' : '—'}</td>
      <td><span class="status-chip status-chip--${m.status.toLowerCase()}">${m.status}</span></td>
      <td><button class="delete-btn" onclick="window.deleteMatch('${m.match_id}')">Del</button></td>
    </tr>`).join('');
}

window.deleteMatch = function(id) {
  if (!confirm(`Delete Match ${id} and all its sales records?`)) return;
  LS.setMatches(LS.getMatches().filter(m => m.match_id !== id));
  LS.setSales(LS.getSales().filter(s => s.match_id !== id));
  renderHistory();
};

function triggerHeatPolicy(temp) {
  document.getElementById('heatTemp').textContent = temp;
  document.getElementById('heatOverlay').classList.remove('hidden');
}

function clearAllData() {
  if (!confirm(`⚠️ Permanently wipe all LocalStorage data? Cannot be undone.`)) return;
  ['ausclub_teams','ausclub_products','ausclub_matches','ausclub_sales'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── INIT & EVENT LISTENERS ────────────── */
function initEventListeners() {
  document.getElementById('sportSelect').addEventListener('change', refreshTeamDropdowns);
  document.getElementById('heatOkBtn').addEventListener('click', () => document.getElementById('heatOverlay').classList.add('hidden'));
  document.getElementById('startMatchBtn').addEventListener('click', startMatch);
  document.getElementById('resetMatchBtn').addEventListener('click', resetMatch);
  document.getElementById('saveMatchBtn').addEventListener('click', saveMatch);
  document.getElementById('addTeamBtn').addEventListener('click', addTeam);
  document.getElementById('addProductBtn').addEventListener('click', addProduct);
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  
  // Set default times
  const today = new Date();
  document.getElementById('matchDate').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  document.getElementById('matchTime').value = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Demo Seed: Insert placeholder data if brand new load so you can click Start Match immediately.
  if (LS.getTeams().length === 0) {
    LS.setTeams([
      { id: 'T001', name: 'Lions', sport: 'afl', suburb: 'Brisbane' },
      { id: 'T002', name: 'Magpies', sport: 'afl', suburb: 'Collingwood' }
    ]);
  }
  if (LS.getProducts().length === 0) {
    LS.setProducts([
      { id: 'P001', name: 'Coca-Cola', size: '375ml', cost: 1.5, retail: 3.5, initialStock: 50, currentStock: 50 },
      { id: 'P002', name: 'Beef Pie', size: '1pc', cost: 2.0, retail: 5.5, initialStock: 30, currentStock: 30 }
    ]);
  }

  initTabs();
  initEventListeners();
  renderTeams();
  renderProducts();
  refreshTeamDropdowns();
});
