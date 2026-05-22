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
      { label: 'Try (4/5)', key: 'score', value: 5, inc: false }, 
      { label: 'Conversion (2)', key: 'score', value: 2, inc: false },
      { label: 'Penalty (3)', key: 'score', value: 3, inc: false }
    ],
    format: (scores) => `${scores.score}`
  }
};

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
    salesCounter: {}
  }
};

const escHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const generateId = (prefix, nextNum) => `${prefix}${String(nextNum).padStart(3, '0')}`;

const showToast = (msg, type = 'info') => {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast--${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
};

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

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      if (tab === 'teams') renderTeams();
      if (tab === 'canteen') renderProducts();
      if (tab === 'history') renderHistory();
    });
  });
}

function bindGlobalEvents() {
  document.getElementById('addTeamBtn').addEventListener('click', addTeam);
  document.getElementById('addProductBtn').addEventListener('click', addProduct);
  document.getElementById('startMatchBtn').addEventListener('click', startMatch);
  document.getElementById('saveMatchBtn').addEventListener('click', saveMatch);
  document.getElementById('resetMatchBtn').addEventListener('click', resetMatch);
  document.getElementById('heatOkBtn').addEventListener('click', () => {
    document.getElementById('heatOverlay').classList.add('hidden');
  });
  document.getElementById('exportMatchesBtn').addEventListener('click', exportMatches);
  document.getElementById('exportSalesBtn').addEventListener('click', exportSales);
  document.getElementById('exportTeamsBtn').addEventListener('click', exportTeams);
  document.getElementById('exportProductsBtn').addEventListener('click', exportProducts);
  document.getElementById('importMatchesBtn').addEventListener('click', () => handleCSVImport('matches'));
  document.getElementById('importSalesBtn').addEventListener('click', () => handleCSVImport('sales'));
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  document.getElementById('sportSelect').addEventListener('change', updateTeamSelects);
}

window.addTeam = function() {
  const name = document.getElementById('teamName').value.trim();
  const sport = document.getElementById('teamSport').value;
  const suburb = document.getElementById('teamSuburb').value.trim();
  
  if (!name || !sport) return showToast('Name and Sport required.', 'error');
  
  const teams = LS.getTeams();
  const nextNum = teams.length > 0 ? Math.max(...teams.map(t => parseInt(t.id.replace('T','')))) + 1 : 1;
  const team = { id: generateId('T', nextNum), name, sport, suburb };
  
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
      <td><button class="delete-btn" onclick="window.deleteTeam('${t.id}')">Delete</button></td>
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
  const opts = '<option value="">— Select Team —</option>' + 
    filtered.map(t => `<option value="${t.id}">${escHtml(t.name)} (${t.id})</option>`).join('');
  document.getElementById('homeTeamSelect').innerHTML = opts;
  document.getElementById('awayTeamSelect').innerHTML = opts;
}

window.addProduct = function() {
  const name = document.getElementById('productName').value.trim();
  const size = document.getElementById('productSize').value.trim();
  const cost = parseFloat(document.getElementById('productCost').value) || 0;
  const retail = parseFloat(document.getElementById('productRetail').value) || 0;
  const initStock = parseInt(document.getElementById('productStock').value, 10) || 0;
  if (!name) return showToast('Product name required.', 'error');
  
  const prods = LS.getProducts();
  const nextNum = prods.length > 0 ? Math.max(...prods.map(p => parseInt(p.id.replace('P','')))) + 1 : 1;
  const product = { id: generateId('P', nextNum), name, size, cost, retail, initialStock: initStock, currentStock: initStock };
  
  prods.push(product);
  LS.setProducts(prods);
  ['productName','productSize','productCost','productRetail','productStock'].forEach(id => document.getElementById(id).value = '');
  
  renderProducts();
  showToast('Added to catalogue.', 'success');
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
      <td><button class="delete-btn" onclick="window.deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}

window.deleteProduct = function(id) {
  if(!confirm('Delete this product?')) return;
  LS.setProducts(LS.getProducts().filter(p => p.id !== id));
  renderProducts();
};

window.startMatch = function() {
  const sport = document.getElementById('sportSelect').value;
  const hId = document.getElementById('homeTeamSelect').value;
  const aId = document.getElementById('awayTeamSelect').value;
  const temp = parseFloat(document.getElementById('weatherTemp').value);
  
  if (!sport || !hId || !aId) return showToast('Sport and both teams are required to start.', 'error');
  if (hId === aId) return showToast('Home and Away teams must be different.', 'error');
  
  const matches = LS.getMatches();
  const nextNum = matches.length > 0 ? Math.max(...matches.map(m => parseInt(m.match_id.replace('M','')))) + 1 : 1;
  const matchId = generateId('M', nextNum);
  
  state.match = { active: true, id: matchId, sport, homeId: hId, awayId: aId, homeScores: {}, awayScores: {}, cancelled: false, salesCounter: {} };
  
  if (!isNaN(temp) && temp >= 40) {
    state.match.cancelled = true;
    document.getElementById('matchNotes').value = "CANCELLED: National Heat Policy triggered (>40°C).";
    document.getElementById('heatTemp').textContent = temp;
    document.getElementById('heatOverlay').classList.remove('hidden');
    document.getElementById('matchStatus').value = 'Cancelled';
  } else {
    document.getElementById('matchStatus').value = 'In Progress';
  }
  
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
  ['sportSelect','homeTeamSelect','awayTeamSelect','startMatchBtn'].forEach(id => document.getElementById(id).disabled = true);
}

window.resetMatch = function() {
  if (state.match.active && !confirm('Reset live panel? Data remains saved in History.')) return;
  state.match.active = false;
  document.getElementById('livePanel').classList.add('hidden');
  ['sportSelect','homeTeamSelect','awayTeamSelect','startMatchBtn'].forEach(id => document.getElementById(id).disabled = false);
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
              onclick="window.handleScore('${side}', '${btn.key}', ${btn.value || 0}${btn.inc ? `, true` : ''})"
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
    scoresObj[key] += 1;
  } else {
    scoresObj[key] = (scoresObj[key] || 0) + value;
  }
  
  updateScoreboardDisplay();
  const displayEl = document.getElementById(`${side}ScoreDisplay`);
  displayEl.classList.add('score-pop');
  setTimeout(() => displayEl.classList.remove('score-pop'), 350);
}

function updateScoreboardDisplay() {
  const cfg = SPORT_CONFIG[state.match.sport];
  const hScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.homeScores);
  const aScores = Object.assign(Object.fromEntries(cfg.buttons.map(b=>[b.key, 0])), state.match.awayScores);
  document.getElementById('homeScoreMain').textContent = cfg.format(hScores);
  document.getElementById('awayScoreMain').textContent = cfg.format(aScores);
}

function getNumericScore(scores, sport) {
  if (sport === 'afl') return (scores.goals || 0) * 6 + (scores.behinds || 0);
  if (sport === 'cricket') return (scores.runs || 0);
  return Object.values(scores).reduce((a,b) => a+b, 0);
}

function buildCanteenSalesForm(disabled) {
  const products = LS.getProducts();
  const container = document.getElementById('canteenSalesForm');
  
  if(!products.length) return container.innerHTML = `<p class="muted">No products available.</p>`;
  
  container.innerHTML = products.map(p => {
    state.match.salesCounter[p.id] = state.match.salesCounter[p.id] || 0;
    return `
    <div class="canteen-sales-item">
      <div class="canteen-sales-item__name">${escHtml(p.name)} - ${escHtml(p.size)}</div>
      <div class="canteen-sales-item__sku">${p.id} · $${p.retail.toFixed(2)}</div>
      <div style="display:flex;gap:8px;">
        <input type="number" id="saleQty_${p.id}" value="${state.match.salesCounter[p.id]}" readonly />
        <button class="btn btn--primary" onclick="window.sellProduct('${p.id}')" ${disabled ? 'disabled' : ''}>+1 Sold</button>
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
  
  const mIndex = matches.findIndex(m => m.match_id === state.match.id);
  if (mIndex !== -1) {
    matches[mIndex].date = document.getElementById('matchDate').value || matches[mIndex].date;
    matches[mIndex].time = document.getElementById('matchTime').value || matches[mIndex].time;
    matches[mIndex].weather_temp_c = document.getElementById('weatherTemp').value !== '' ? document.getElementById('weatherTemp').value : matches[mIndex].weather_temp_c;
    matches[mIndex].status = document.getElementById('matchStatus').value || 'Completed';
    matches[mIndex].home_score = state.match.cancelled ? 0 : getNumericScore(hScores, sport);
    matches[mIndex].away_score = state.match.cancelled ? 0 : getNumericScore(aScores, sport);
    matches[mIndex].notes = document.getElementById('matchNotes').value;
    LS.setMatches(matches);
  }
  
  if(!state.match.cancelled) {
    Object.entries(state.match.salesCounter).forEach(([pId, qty]) => {
      if(qty > 0) {
        const nextSalesNum = sales.length > 0 ? Math.max(...sales.map(s => parseInt(s.sales_id.replace('S','')))) + 1 : 1;
        sales.push({ sales_id: generateId('S', nextSalesNum), match_id: state.match.id, product_id: pId, quantity: qty });
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
  const pastMatches = LS.getMatches().filter(m => (m.home_team_id === homeId && m.away_team_id === awayId) || (m.home_team_id === awayId && m.away_team_id === homeId));
  if(pastMatches.length === 0) return document.getElementById('forecastContent').innerHTML = `<p class="muted">No historical data for forecast.</p>`;
  
  const sales = LS.getSales().filter(s => pastMatches.map(m => m.match_id).includes(s.match_id));
  if(sales.length === 0) return document.getElementById('forecastContent').innerHTML = `<p class="muted">Histories found, but no sales recorded.</p>`;
  
  const agg = {};
  sales.forEach(s => agg[s.product_id] = (agg[s.product_id] || 0) + parseInt(s.quantity, 10));
  
  const reqs = Object.entries(agg).map(([pId, total]) => ({ pId, avgQty: Math.ceil(total / pastMatches.length) })).sort((a,b) => b.avgQty - a.avgQty).slice(0, 3);
  document.getElementById('forecastContent').innerHTML = reqs.map(rec => {
    const label = LS.getProducts().find(prod => prod.id === rec.pId)?.name || rec.pId;
    return `<div class="forecast-item"><div><div class="forecast-item__sku">${rec.pId}</div><div class="forecast-item__name">${label}</div></div><div style="text-align:right"><div class="forecast-item__qty">+${rec.avgQty}</div><div class="forecast-item__unit">Predicted</div></div></div>`;
  }).join('') + `<div class="forecast-meta">Based on ${pastMatches.length} previous matchups</div>`;
}

function renderHistory() {
  const matches = LS.getMatches();
  const teams = LS.getTeams();
  const tbody = document.getElementById('matchesBody');
  document.getElementById('matchCount').textContent = `${matches.length} matches`;
  
  if (!matches.length) tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No matches recorded yet.</td></tr>';
  else tbody.innerHTML = [...matches].reverse().map(m => {
    const hName = teams.find(t=>t.id===m.home_team_id)?.name || m.home_team_id;
    const aName = teams.find(t=>t.id===m.away_team_id)?.name || m.away_team_id;
    const tempStr = m.weather_temp_c !== '' && m.weather_temp_c !== null ? `${m.weather_temp_c}°C` : '—';
    let sCls = m.status === 'Completed' ? 'status-chip--completed' : m.status === 'Cancelled' ? 'status-chip--cancelled' : m.status === 'Postponed' ? 'status-chip--postponed' : 'status-chip--in-progress';
    return `<tr><td><span class="sku-chip">${m.match_id}</span></td><td><strong>${m.date || '—'}</strong></td><td>${SPORT_CONFIG[m.sport_type]?.name || m.sport_type}</td><td>${escHtml(hName)}</td><td>${escHtml(aName)}</td><td><strong>${m.home_score} - ${m.away_score}</strong></td><td>${tempStr}</td><td><span class="status-chip ${sCls}">${m.status}</span></td><td><button class="delete-btn" onclick="window.deleteMatch('${m.match_id}')">Delete</button></td></tr>`;
  }).join('');

  const sales = LS.getSales();
  const products = LS.getProducts();
  document.getElementById('salesCount').textContent = `${sales.length} sales`;
  if (!sales.length) document.getElementById('salesBody').innerHTML = '<tr><td colspan="4" class="empty-state">No sales recorded.</td></tr>';
  else document.getElementById('salesBody').innerHTML = [...sales].reverse().map(s => {
    const p = products.find(prod => prod.id === s.product_id);
    return `<tr><td><span class="sku-chip">${s.sales_id}</span></td><td><span class="sku-chip sku-chip--outline">${s.match_id}</span></td><td>${p ? `${escHtml(p.name)} (${escHtml(p.size)})` : s.product_id}</td><td><strong>${s.quantity}</strong></td></tr>`;
  }).join('');
}

window.deleteMatch = function(id) {
  if(!confirm('Delete this match and all its associated sales records?')) return;
  LS.setMatches(LS.getMatches().filter(m => m.match_id !== id));
  LS.setSales(LS.getSales().filter(s => s.match_id !== id));
  renderHistory();
};

function toCSV(dataArr) {
  if (!dataArr || !dataArr.length) return '';
  const headers = Object.keys(dataArr[0]);
  return [headers.join(','), ...dataArr.map(obj => headers.map(h => `"${String(obj[h]??"").replace(/"/g, '""')}"`).join(','))].join('\n');
}

function downloadStr(filename, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  a.download = filename;
  a.click();
}

window.exportMatches = () => LS.getMatches().length ? downloadStr('matches.csv', toCSV(LS.getMatches())) : showToast('Empty','error');
window.exportSales = () => LS.getSales().length ? downloadStr('sales.csv', toCSV(LS.getSales())) : showToast('Empty','error');
window.exportTeams = () => LS.getTeams().length ? downloadStr('teams.csv', toCSV(LS.getTeams())) : showToast('Empty','error');
window.exportProducts = () => LS.getProducts().length ? downloadStr('products.csv', toCSV(LS.getProducts())) : showToast('Empty','error');

window.handleCSVImport = function(type) {
  const id = type === 'matches' ? 'importMatchesFile' : 'importSalesFile';
  const file = document.getElementById(id).files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const line = (s) => s.trim().split('\n');
      const lines = line(e.target.result);
      if (lines.length < 2) return;
      const h = lines[0].split(',').map(x => x.replace(/"/g, '').trim());
      const data = lines.slice(1).map(l => {
        const v = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(x => x.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        const obj = {};
        h.forEach((key, i) => obj[key] = /^\d+$/.test(v[i]) ? parseInt(v[i], 10) : /^\d+\.\d+$/.test(v[i]) ? parseFloat(v[i]) : v[i]);
        return obj;
      });
      type === 'matches' ? LS.setMatches(data) : LS.setSales(data);
      document.getElementById(id).value = '';
      renderHistory();
      showToast('Imported successfully', 'success');
    } catch(err) { showToast('Error', 'error'); }
  };
  reader.readAsText(file);
};

window.clearAllData = function() {
  if (confirm('⚠️ WARNING: Erase ALL data?')) { localStorage.clear(); location.reload(); }
};
