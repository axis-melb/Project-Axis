/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js
   Core logic for teams, canteen, live scoreboard, and exports.
═══════════════════════════════════════════════════════════════ */

/* ─── DATA MODELS & SPORT CONFIG ─────────────────────────────── */
const SPORT_CONFIG = {
  afl: {
    name: 'AFL',
    buttons: [
      { label: 'Goal (6)', key: 'goals', value: 6, inc: true },
      { label: 'Behind (1)', key: 'behinds', value: 1, inc: true }
    ],
    format: (scores) => `${scores.goals}.${scores.behinds} (${(scores.goals * 6) + scores.behinds})`
  },
  cricket: {
    name: 'Cricket',
    buttons: [
      { label: 'Run +1', key: 'runs', value: 1, inc: false },
      { label: 'Four +4', key: 'runs', value: 4, inc: false },
      { label: 'Six +6', key: 'runs', value: 6, inc: false },
      { label: 'Wicket', key: 'wickets', value: 1, inc: true }
    ],
    format: (scores) => `${scores.runs} / ${scores.wickets}`
  },
  soccer: {
    name: 'Soccer',
    buttons: [{ label: 'Goal +1', key: 'goals', value: 1, inc: false }],
    format: (scores) => `${scores.goals}`
  },
  netball: {
    name: 'Netball',
    buttons: [{ label: 'Goal +1', key: 'goals', value: 1, inc: false }],
    format: (scores) => `${scores.goals}`
  },
  rugby: {
    name: 'Rugby',
    buttons: [
      { label: 'Try (4/5)', key: 'score', value: 5, inc: false }, /* using union standard 5 for demo */
      { label: 'Conversion (2)', key: 'score', value: 2, inc: false },
      { label: 'Penalty (3)', key: 'score', value: 3, inc: false }
    ],
    format: (scores) => `${scores.score}`
  }
};

/* ─── LOCAL STORAGE WRAPPER ──────────────────────────────────── */
const LS = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  
  getTeams: () => LS.get('ausclub_teams'),
  setTeams: (t) => LS.set('ausclub_teams', t),
  
  getProducts: () => LS.get('ausclub_products'),
  setProducts: (p) => LS.set('ausclub_products', p),
  
  getMatches: () => LS.get('ausclub_matches'),
  setMatches: (m) => LS.set('ausclub_matches', m),

  getSales: () => LS.get('ausclub_sales'),
  setSales: (s) => LS.set('ausclub_sales', s)
};

/* ─── STATE ──────────────────────────────────────────────────── */
const state = {
  match: {
    active: false,
    id: null,
    sport: null,
    homeId: null,
    awayId: null,
    homeScores: {},
    awayScores: {},
    cancelled: false,
    salesCounter: {} // productId -> qty sold in current match
  }
};

/* ─── UTILS ──────────────────────────────────────────────────── */
const escHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const generateId = (prefix, nextNum) => `${prefix}${String(nextNum).padStart(3, '0')}`;

const showToast = (msg, type = 'info') => {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast--${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
};

/* ─── INITIALIZATION ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  bindGlobalEvents();
  prefillDate();
  
  renderTeams();
  updateTeamSelects();
  renderProducts();
  renderHistory();
});

function prefillDate() {
  document.getElementById('matchDate').valueAsDate = new Date();
  const now = new Date();
  document.getElementById('matchTime').value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
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
      if (tab === 'teams') renderTeams();
      if (tab === 'canteen') renderProducts();
      if (tab === 'history') renderHistory();
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   GLOBAL DOM EVENTS
────────────────────────────────────────────────────────────── */
function bindGlobalEvents() {
  document.getElementById('addTeamBtn').addEventListener('click', addTeam);
  document.getElementById('addProductBtn').addEventListener('click', addProduct);
  
  document.getElementById('startMatchBtn').addEventListener('click', startMatch);
  document.getElementById('saveMatchBtn').addEventListener('click', saveMatch);
  document.getElementById('resetMatchBtn').addEventListener('click', resetMatch);
  
  document.getElementById('heatOkBtn').addEventListener('click', () => {
    document.getElementById('heatOverlay').classList.add('hidden');
  });

  // Export & Import listeners
  document.getElementById('exportMatchesBtn').addEventListener('click', exportMatches);
  document.getElementById('exportSalesBtn').addEventListener('click', exportSales);
  document.getElementById('exportTeamsBtn').addEventListener('click', exportTeams);
  document.getElementById('exportProductsBtn').addEventListener('click', exportProducts);
  
  document.getElementById('importMatchesBtn').addEventListener('click', () => handleCSVImport('matches'));
  document.getElementById('importSalesBtn').addEventListener('click', () => handleCSVImport('sales'));
  
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  
  // Real-time sport update
  document.getElementById('sportSelect').addEventListener('change', updateTeamSelects);
}

/* ──────────────────────────────────────────────────────────────
   TEAMS MANAGEMENT
────────────────────────────────────────────────────────────── */
window.addTeam = function() {
  const name = document.getElementById('teamName').value.trim();
  const sport = document.getElementById('teamSport').value;
  const suburb = document.getElementById('teamSuburb').value.trim();
  
  if (!name || !sport) return showToast('Name and Sport required.', 'error');
  
  const teams = LS.getTeams();
  const nextNum = teams.length > 0 ? Math.max(...teams.map(t => parseInt(t.id.replace('T','')))) + 1 : 1;
  const team = {
    id: generateId('T', nextNum),
    name, sport, suburb
  };
  
  teams.push(team);
  LS.setTeams(teams);
  
  document.getElementById('teamName').value = '';
  document.getElementById('teamSuburb').value = '';
  
  renderTeams();
  updateTeamSelects();
  showToast(`Team ${team.name} registered.`, 'success');
};

function renderTeams() {
  const teams = LS.getTeams();
  const tbody = document.getElementById('teamsBody');
  document.getElementById('teamCount').textContent = `${teams.length} teams`;
  
  if (!teams.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No teams registered.</td></tr>';
    return;
  }
  
  tbody.innerHTML = teams.map(t => `
    <tr>
      <td><span class="sku-chip">${t.id}</span></td>
      <td><strong>${escHtml(t.name)}</strong></td>
      <td>${(SPORT_CONFIG[t.sport]?.name || t.sport).toUpperCase()}</td>
      <td>${escHtml(t.suburb)}</td>
      <td><button class="delete-btn" onclick="deleteTeam('${t.id}')">Delete</button></td>
    </tr>
  `).join('');
}

window.deleteTeam = function(id) {
  if(!confirm('Delete this team?')) return;
  LS.setTeams(LS.getTeams().filter(t => t.id !== id));
  renderTeams();
  updateTeamSelects();
  showToast('Team deleted', 'info');
};

function updateTeamSelects() {
  const sport = document.getElementById('sportSelect').value;
  const allTeams = LS.getTeams();
  const filtered = sport ? allTeams.filter(t => t.sport === sport) : allTeams;
  
  const hSelect = document.getElementById('homeTeamSelect');
  const aSelect = document.getElementById('awayTeamSelect');
  
  const opts = '<option value="">— Select Team —</option>' + 
    filtered.map(t => `<option value="${t.id}">${escHtml(t.name)} (${t.id})</option>`).join('');
    
  hSelect.innerHTML = opts;
  aSelect.innerHTML = opts;
}

/* ──────────────────────────────────────────────────────────────
   CANTEEN & PRODUCTS
────────────────────────────────────────────────────────────── */
window.addProduct = function() {
  const name = document.getElementById('productName').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value) || 0;
  const retail = parseFloat(document.getElementById('productRetail').value) || 0;
  const initStock = parseInt(document.getElementById('productStock').value, 10) || 0;
  
  if (!name) return showToast('Product name required.', 'error');
  
  const prods = LS.getProducts();
  
  const norm = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  
  const existingIndex = prods.findIndex(p => 
    norm(p.name) === norm(name) && norm(p.size) === norm(size)
  );

  if (existingIndex !== -1) {
    prods[existingIndex].initialStock = parseInt(prods[existingIndex].initialStock || 0, 10) + initStock;
    prods[existingIndex].currentStock = parseInt(prods[existingIndex].currentStock || 0, 10) + initStock;
    if (cost > 0) prods[existingIndex].cost = cost;
    if (retail > 0) prods[existingIndex].retail = retail;
    showToast(`Updated existing ${name} stock by +${initStock}.`, 'success');
  } else {
    const nextNum = prods.length > 0 ? Math.max(...prods.map(p => parseInt(p.id.replace('P','')))) + 1 : 1;
    const product = {
      id: generateId('P', nextNum),
      name, size, cost, retail,
      initialStock: initStock,
      currentStock: initStock
    };
    prods.push(product);
    showToast('Product added to catalogue.', 'success');
  }
  
  LS.setProducts(prods);
  
  ['productName','productSize','productCost','productRetail','productStock'].forEach(id => {
    document.getElementById(id).value = '';
  });
  
  renderProducts();
};

function renderProducts() {
  const products = LS.getProducts();
  const tbody = document.getElementById('productsBody');
  document.getElementById('productCount').textContent = `${products.length} products`;
  
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No products registered.</td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(p => {
    const margin = p.retail - p.cost;
    const pct = p.cost > 0 ? ((margin / p.cost) * 100).toFixed(0) : '0';
    return `
    <tr>
      <td><span class="sku-chip">${p.id}</span></td>
      <td>${escHtml(p.name || '')}</td>
      <td>${escHtml(p.size || '')}</td>
      <td>$${(p.cost || 0).toFixed(2)}</td>
      <td>$${(p.retail || 0).toFixed(2)}</td>
      <td><span class="margin-chip">+$${margin.toFixed(2)} (${pct}%)</span></td>
      <td>${p.initialStock || 0}</td>
      <td><strong>${p.currentStock ?? p.initialStock ?? 0}</strong></td>
      <td><button class="delete-btn" onclick="deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}

window.deleteProduct = function(id) {
  if(!confirm('Delete this product?')) return;
  LS.setProducts(LS.getProducts().filter(p => p.id !== id));
  renderProducts();
  showToast('Product deleted', 'info');
};

/* ──────────────────────────────────────────────────────────────
   LIVE SCOREBOARD
────────────────────────────────────────────────────────────── */
window.startMatch = function() {
  const sport = document.getElementById('sportSelect').value;
  const hId = document.getElementById('homeTeamSelect').value;
  const aId = document.getElementById('awayTeamSelect').value;
  const temp = parseFloat(document.getElementById('weatherTemp').value);
  const status = document.getElementById('matchStatus').value;
  
  if (!sport || !hId || !aId) return showToast('Sport and both teams are required to start.', 'error');
  if (hId === aId) return showToast('Home and Away teams must be different.', 'error');
  
  // Create match record
  const matches = LS.getMatches();
  const nextNum = matches.length > 0 ? Math.max(...matches.map(m => parseInt(m.match_id.replace('M','')))) + 1 : 1;
  const matchId = generateId('M', nextNum);
  
  state.match = {
    active: true,
    id: matchId,
    sport,
    homeId: hId,
    awayId: aId,
    homeScores: {},
    awayScores: {},
    cancelled: false,
    salesCounter: {}
  };
  
  // Heat Policy check
  if (!isNaN(temp) && temp >= 40) {
    state.match.cancelled = true;
    document.getElementById('matchNotes').value = "CANCELLED: National Heat Policy triggered (>40°C).";
    document.getElementById('heatTemp').textContent = temp;
    document.getElementById('heatOverlay').classList.remove('hidden');
    document.getElementById('matchStatus').value = 'Cancelled';
  } else {
    document.getElementById('matchStatus').value = 'In Progress';
  }
  
  // Persist intial match record
  matches.push({
    match_id:       state.match.id,
    date:           document.getElementById('matchDate').value,
    time:           document.getElementById('matchTime').value,
    weather_temp_c: isNaN(temp) ? '' : temp,
    sport_type:     sport,
    home_team_id:   hId,
    away_team_id:   aId,
    home_score:     0,
    away_score:     0,
    status:         state.match.cancelled ? 'Cancelled' : 'In Progress',
    notes:          document.getElementById('matchNotes').value
  });
  LS.setMatches(matches);
  
  const teams = LS.getTeams();
  document.getElementById('homeName').textContent = escHtml(teams.find(t=>t.id===hId)?.name) || 'Home';
  document.getElementById('awayName').textContent = escHtml(teams.find(t=>t.id===aId)?.name) || 'Away';
  document.getElementById('sportChip').textContent = SPORT_CONFIG[sport].name;
  
  buildScoringButtons(state.match.cancelled);
  buildCanteenSalesForm(state.match.cancelled);
  updateScoreboardDisplay();
  generateForecast(hId, aId);
  
  document.getElementById('livePanel').classList.remove('hidden');
  
  // Disable setup inputs
  ['sportSelect','homeTeamSelect','awayTeamSelect','startMatchBtn'].forEach(id => {
    document.getElementById(id).disabled = true;
  });
  
  showToast(`Match ${matchId} Live.`, 'success');
}

window.resetMatch = function() {
  if (state.match.active && !confirm('Resetting will clear the live panel. Current data remains saved in History. Continue?')) {
    return;
  }
  state.match.active = false;
  document.getElementById('livePanel').classList.add('hidden');
  ['sportSelect','homeTeamSelect','awayTeamSelect','startMatchBtn'].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  prefillDate();
  document.getElementById('weatherTemp').value = '';
  document.getElementById('matchNotes').value = '';
  document.getElementById('matchStatus').value = 'Completed';
  document.getElementById('homeTeamSelect').value = '';
  document.getElementById('awayTeamSelect').value = '';
  document.getElementById('sportSelect').value = '';
}

function buildScoringButtons(disabled) {
  const sConfig = SPORT_CONFIG[state.match.sport];
  const hBtns = document.getElementById('homeBtns');
  const aBtns = document.getElementById('awayBtns');
  
  const makeBtn = (side, btn) => {
    return `<button class="score-btn score-btn--${side}" 
              onclick="handleScore('${side}', '${btn.key}', ${btn.value || 0}${btn.inc ? `, true` : ''})"
              ${disabled ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
              ${btn.label}
            </button>`;
  };
  
  hBtns.innerHTML = sConfig.buttons.map(b => makeBtn('home', b)).join('');
  aBtns.innerHTML = sConfig.buttons.map(b => makeBtn('away', b)).join('');
}

window.handleScore = function(side, key, value, isIncrement = false) {
  if (state.match.cancelled) return;
  const scoresObj = side === 'home' ? state.match.homeScores : state.match.awayScores;
  
  if (isIncrement && scoresObj[key] !== undefined) {
    scoresObj[key] += 1; // Used for things like AFL goals/behinds where the label value is points but they count occurrences
  } else {
    scoresObj[key] = (scoresObj[key] || 0) + value;
  }
  
  updateScoreboardDisplay();
  
  const displayEl = document.getElementById(`${side}ScoreDisplay`);
  displayEl.classList.add('score-pop');
  setTimeout(() => displayEl.classList.remove('score-pop'), 350);
}

function updateScoreboardDisplay() {
  const sport = state.match.sport;
  const cfg = SPORT_CONFIG[sport];
  
  // Safe defaults
  const hScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.homeScores);
  const aScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.awayScores);
  
  document.getElementById('homeScoreMain').textContent = cfg.format(hScores);
  document.getElementById('awayScoreMain').textContent = cfg.format(aScores);
}

function getNumericScore(scores, sport) {
  if (sport === 'afl') return (scores.goals || 0) * 6 + (scores.behinds || 0);
  if (sport === 'cricket') return (scores.runs || 0);
  
  // For other sports, sum all values
  return Object.values(scores).reduce((a,b) => a+b, 0);
}

/* ──────────────────────────────────────────────────────────────
   LIVE CANTEEN SALES
────────────────────────────────────────────────────────────── */
function buildCanteenSalesForm(disabled) {
  const products = LS.getProducts();
  const container = document.getElementById('canteenSalesForm');
  
  if(!products.length) {
    container.innerHTML = `<p class="muted">No products available. Add some in the Canteen tab.</p>`;
    return;
  }
  
  container.innerHTML = products.map(p => {
    state.match.salesCounter[p.id] = state.match.salesCounter[p.id] || 0;
    return `
    <div class="canteen-sales-item">
      <div class="canteen-sales-item__name">${escHtml(p.name)} - ${escHtml(p.size)}</div>
      <div class="canteen-sales-item__sku">${p.id} · $${p.retail.toFixed(2)}</div>
      <div style="display:flex;gap:8px;">
        <input type="number" id="saleQty_${p.id}" value="${state.match.salesCounter[p.id]}" readonly />
        <button class="btn btn--primary" onclick="sellProduct('${p.id}')" ${disabled ? 'disabled' : ''}>+1 Sold</button>
      </div>
    </div>
    `;
  }).join('');
}

window.sellProduct = function(productId) {
  if(state.match.cancelled) return;
  state.match.salesCounter[productId] = (state.match.salesCounter[productId] || 0) + 1;
  document.getElementById(`saleQty_${productId}`).value = state.match.salesCounter[productId];
}

window.saveMatch = function() {
  if (!state.match.active) return;
  
  const matches = LS.getMatches();
  let sales = LS.getSales();
  let products = LS.getProducts();
  
  const sport = state.match.sport;
  const cfg = SPORT_CONFIG[sport];
  const hScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.homeScores);
  const aScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.awayScores);
  
  const homeScore = getNumericScore(hScores, sport);
  const awayScore = getNumericScore(aScores, sport);
  
  // Update match status & form fields in case they changed
  const mIndex = matches.findIndex(m => m.match_id === state.match.id);
  if (mIndex !== -1) {
    matches[mIndex].date = document.getElementById('matchDate').value || matches[mIndex].date;
    matches[mIndex].time = document.getElementById('matchTime').value || matches[mIndex].time;
    matches[mIndex].weather_temp_c = document.getElementById('weatherTemp').value !== '' ? document.getElementById('weatherTemp').value : matches[mIndex].weather_temp_c;
    matches[mIndex].status = document.getElementById('matchStatus').value || 'Completed';
    matches[mIndex].home_score = state.match.cancelled ? 0 : homeScore;
    matches[mIndex].away_score = state.match.cancelled ? 0 : awayScore;
    matches[mIndex].notes = document.getElementById('matchNotes').value;
    LS.setMatches(matches);
  }
  
  // Save specific sales and deduct inventory
  if(!state.match.cancelled) {
    Object.entries(state.match.salesCounter).forEach(([pId, qty]) => {
      if(qty > 0) {
        // Record Sales
        const nextSalesNum = sales.length > 0 ? Math.max(...sales.map(s => parseInt(s.sales_id.replace('S','')))) + 1 : 1;
        sales.push({
          sales_id: generateId('S', nextSalesNum),
          match_id: state.match.id,
          product_id: pId,
          quantity: qty
        });
        
        // Deduct from Product Inventory
        const pIndex = products.findIndex(p => p.id === pId);
        if(pIndex !== -1) {
          products[pIndex].currentStock = Math.max(0, (products[pIndex].currentStock ?? products[pIndex].initialStock ?? 0) - qty);
        }
      }
    });
    LS.setSales(sales);
    LS.setProducts(products);
  }
  
  showToast(`Match ${state.match.id} saved!`, 'success');
  renderHistory();
  renderProducts();
}

function generateForecast(homeId, awayId) {
  const container = document.getElementById('forecastContent');
  const pastMatches = LS.getMatches().filter(m => 
    (m.home_team_id === homeId && m.away_team_id === awayId) ||
    (m.home_team_id === awayId && m.away_team_id === homeId)
  );
  
  if(pastMatches.length === 0) {
    container.innerHTML = `<p class="muted">No historical data for this matchup to generate forecast.</p>`;
    return;
  }
  
  // Get all sales for these matches
  const matchIds = pastMatches.map(m => m.match_id);
  const sales = LS.getSales().filter(s => matchIds.includes(s.match_id));
  const products = LS.getProducts();
  
  if (sales.length === 0) {
    container.innerHTML = `<p class="muted">Historical matches exist, but zero canteen sales on record.</p>`;
    return;
  }
  
  // Aggregate sales
  const agg = {};
  sales.forEach(s => {
    agg[s.product_id] = (agg[s.product_id] || 0) + parseInt(s.quantity, 10);
  });
  
  // Calculate average per match and sort
  const reqs = Object.entries(agg)
    .map(([pId, total]) => ({
      pId,
      avgQty: Math.ceil(total / pastMatches.length)
    }))
    .sort((a,b) => b.avgQty - a.avgQty)
    .slice(0, 3); // top 3 recommendations
    
  container.innerHTML = reqs.map(rec => {
    const p = products.find(prod => prod.id === rec.pId);
    const label = p ? escHtml(p.name) : rec.pId;
    return `
      <div class="forecast-item">
        <div>
          <div class="forecast-item__sku">${rec.pId}</div>
          <div class="forecast-item__name">${label}</div>
        </div>
        <div style="text-align:right">
          <div class="forecast-item__qty">+${rec.avgQty}</div>
          <div class="forecast-item__unit">Predicted Demand</div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML += `<div class="forecast-meta">Based on ${pastMatches.length} previous matchups</div>`;
}

/* ──────────────────────────────────────────────────────────────
   HISTORY
────────────────────────────────────────────────────────────── */
function renderHistory() {
  const matches = LS.getMatches();
  const teams = LS.getTeams();
  const tbody = document.getElementById('matchesBody');
  document.getElementById('matchCount').textContent = `${matches.length} matches`;
  
  if (!matches.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No matches recorded yet.</td></tr>';
  } else {
    tbody.innerHTML = [...matches].reverse().map(m => {
      const hName = teams.find(t=>t.id===m.home_team_id)?.name || m.home_team_id;
      const aName = teams.find(t=>t.id===m.away_team_id)?.name || m.away_team_id;
      const sportName = SPORT_CONFIG[m.sport_type]?.name || m.sport_type;
      const tempStr = m.weather_temp_c !== '' && m.weather_temp_c !== null ? `${m.weather_temp_c}°C` : '—';
      
      let statusClass = 'status-chip--in-progress';
      if (m.status === 'Completed') statusClass = 'status-chip--completed';
      if (m.status === 'Cancelled') statusClass = 'status-chip--cancelled';
      if (m.status === 'Postponed') statusClass = 'status-chip--postponed';

      return `
      <tr>
        <td><span class="sku-chip">${m.match_id}</span></td>
        <td><strong>${m.date || '—'}</strong></td>
        <td>${sportName}</td>
        <td>${escHtml(hName)}</td>
        <td>${escHtml(aName)}</td>
        <td><strong>${m.home_score} - ${m.away_score}</strong></td>
        <td>${tempStr}</td>
        <td><span class="status-chip ${statusClass}">${m.status}</span></td>
        <td><button class="delete-btn" onclick="deleteMatch('${m.match_id}')">Delete</button></td>
      </tr>
      `;
    }).join('');
  }

  // Render sales
  const sales = LS.getSales();
  const products = LS.getProducts();
  const salesBody = document.getElementById('salesBody');
  document.getElementById('salesCount').textContent = `${sales.length} sales record${sales.length !== 1 ? 's' : ''}`;
  
  if (!sales.length) {
    salesBody.innerHTML = '<tr><td colspan="4" class="empty-state">No sales recorded yet.</td></tr>';
  } else {
    salesBody.innerHTML = [...sales].reverse().map(s => {
      const p = products.find(prod => prod.id === s.product_id);
      const pName = p ? `${p.name} (${p.size})` : s.product_id;
      return `
      <tr>
        <td><span class="sku-chip">${s.sales_id}</span></td>
        <td><span class="sku-chip sku-chip--outline">${s.match_id}</span></td>
        <td>${escHtml(pName)}</td>
        <td><strong>${s.quantity}</strong></td>
      </tr>
      `;
    }).join('');
  }
}

window.deleteMatch = function(id) {
  if(!confirm('Delete this match and all its associated sales records?')) return;
  LS.setMatches(LS.getMatches().filter(m => m.match_id !== id));
  LS.setSales(LS.getSales().filter(s => s.match_id !== id));
  renderHistory();
  showToast(`Match ${id} deleted`, 'info');
};

/* ──────────────────────────────────────────────────────────────
   DATA EXPORTS (CSV)
────────────────────────────────────────────────────────────── */
function toCSV(dataArr) {
  if (!dataArr || !dataArr.length) return '';
  const headers = Object.keys(dataArr[0]);
  const rows = dataArr.map(obj => 
    headers.map(h => {
      let val = obj[h];
      if (val === null || val === undefined) val = '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadStr(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

window.exportMatches = () => {
  const m = LS.getMatches();
  if(!m.length) return showToast('No matches to export', 'error');
  downloadStr('matches.csv', toCSV(m));
};

window.exportSales = () => {
  const s = LS.getSales();
  if(!s.length) return showToast('No sales to export', 'error');
  downloadStr('sales.csv', toCSV(s));
};

window.exportTeams = () => {
  const t = LS.getTeams();
  if(!t.length) return showToast('No teams to export', 'error');
  downloadStr('teams.csv', toCSV(t));
};

window.exportProducts = () => {
  const p = LS.getProducts();
  if(!p.length) return showToast('No products to export', 'error');
  downloadStr('products.csv', toCSV(p));
};

/* ──────────────────────────────────────────────────────────────
   DATA IMPORTS (CSV) - Extremely basic parsing for demo
────────────────────────────────────────────────────────────── */
window.handleCSVImport = function(type) {
  const inputId = type === 'matches' ? 'importMatchesFile' : 'importSalesFile';
  const file = document.getElementById(inputId).files[0];
  if (!file) return showToast(`Please select a file to import ${type}`, 'error');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    try {
      const data = parseCSV(text);
      if (type === 'matches') {
        LS.setMatches(data);
      } else {
        LS.setSales(data);
      }
      showToast(`Successfully imported ${data.length} ${type}!`, 'success');
      document.getElementById(inputId).value = '';
      renderHistory();
    } catch(err) {
      showToast(`Error parsing CSV: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
};

// Extremely naive CSV parser
function parseCSV(str) {
  const lines = str.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    // Regex to split by comma, ignoring commas within quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const values = line.split(regex).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
    
    const obj = {};
    headers.forEach((h, i) => { 
      // simple type inference
      let val = values[i];
      if (/^\d+$/.test(val)) val = parseInt(val, 10);
      else if (/^\d+\.\d+$/.test(val)) val = parseFloat(val);
      obj[h] = val; 
    });
    return obj;
  });
}

window.clearAllData = function() {
  if (confirm('⚠️ WARNING: This will permanently erase ALL data in this app. Proceed?')) {
    localStorage.clear();
    location.reload();
  }
};
