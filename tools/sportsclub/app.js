/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js (Bulletproof Defensive Edition)
═══════════════════════════════════════════════════════════════ */

'use strict';

const state = {
  match: null,
};

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
      { label: '+1 Run', value: 1, key: 'runs' },
      { label: '+4 Runs', value: 4, key: 'runs' },
      { label: '+6 Runs', value: 6, key: 'runs' },
      { label: 'Wicket', value: 1, key: 'wickets' },
    ],
    away: [
      { label: '+1 Run', value: 1, key: 'runs' },
      { label: '+4 Runs', value: 4, key: 'runs' },
      { label: '+6 Runs', value: 6, key: 'runs' },
      { label: 'Wicket', value: 1, key: 'wickets' },
    ],
    initScore: () => ({ runs: 0, wickets: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.runs,
    displayDetail: (s) => `${s.wickets} wkts`,
  },
  soccer: {
    label: 'Soccer / Football',
    home: [{ label: 'Goal +1', value: 1, key: 'goals' }],
    away: [{ label: 'Goal +1', value: 1, key: 'goals' }],
    initScore: () => ({ goals: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.goals,
    displayDetail: () => '',
  },
  netball: {
    label: 'Netball / Basketball',
    home: [
      { label: '+1 Pt', value: 1, key: 'points' },
      { label: '+2 Pts', value: 2, key: 'points' },
      { label: '+3 Pts', value: 3, key: 'points' },
    ],
    away: [
      { label: '+1 Pt', value: 1, key: 'points' },
      { label: '+2 Pts', value: 2, key: 'points' },
      { label: '+3 Pts', value: 3, key: 'points' },
    ],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  },
  rugby: {
    label: 'Rugby League / Union',
    home: [
      { label: 'Try +4', value: 4, key: 'points' },
      { label: 'Goal/Pen +2', value: 2, key: 'points' },
      { label: 'Drop +1', value: 1, key: 'points' },
    ],
    away: [
      { label: 'Try +4', value: 4, key: 'points' },
      { label: 'Goal/Pen +2', value: 2, key: 'points' },
      { label: 'Drop +1', value: 1, key: 'points' },
    ],
    initScore: () => ({ points: 0 }),
    calcScore: (s) => s,
    displayMain: (s) => s.points,
    displayDetail: () => '',
  }
};

/* ──────────────────────────────────────────────────────────────
   TABS SYSTEM
────────────────────────────────────────────────────────────── */
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = 'tab-' + tab.dataset.tab;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   TEAM REGISTRATION
────────────────────────────────────────────────────────────── */
function getTeams() { return JSON.parse(localStorage.getItem('ac_teams')) || []; }
function saveTeams(teams) { localStorage.setItem('ac_teams', JSON.stringify(teams)); }

function addTeam() {
  const nameInput = document.getElementById('teamName');
  const sportSelect = document.getElementById('teamSport');
  const suburbInput = document.getElementById('teamSuburb');
  if (!nameInput || !sportSelect) return;

  const name = nameInput.value.trim();
  const sport = sportSelect.value;
  const suburb = suburbInput ? suburbInput.value.trim() : '';

  if (!name || !sport) { alert('Please enter team name and select sport.'); return; }
  const teams = getTeams();
  
  const id = 'T' + String(teams.length + 1).padStart(3, '0');
  teams.push({ id, name, sport, suburb });
  saveTeams(teams);
  
  nameInput.value = ''; if (suburbInput) suburbInput.value = '';
  renderTeams(); 
  refreshTeamDropdowns();
}

function deleteTeam(id) {
  let teams = getTeams();
  teams = teams.filter(t => t.id !== id);
  saveTeams(teams);
  renderTeams(); 
  refreshTeamDropdowns();
}

function renderTeams() {
  const teams = getTeams();
  const tbody = document.getElementById('teamsBody');
  const countSpan = document.getElementById('teamCount');
  if (countSpan) countSpan.textContent = `${teams.length} teams`;
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (teams.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#666;">No registered teams.</td></tr>';
    return;
  }

  teams.forEach(t => {
    const sportLabel = SPORTS[t.sport]?.label || t.sport;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge" style="background:#222; padding:2px 6px; border-radius:4px; border:1px solid #444; font-family:monospace; color:#ffc107;">${t.id}</span></td>
      <td><strong>${t.name}</strong></td>
      <td>${sportLabel}</td>
      <td>${t.suburb || '—'}</td>
      <td><button class="btn btn--danger" style="padding: 2px 8px; font-size:11px;" onclick="deleteTeam('${t.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function refreshTeamDropdowns() {
  const sportSelect = document.getElementById('sportSelect');
  if (!sportSelect) return;
  const sport = sportSelect.value;
  
  const homeSelect = document.getElementById('homeTeamSelect');
  const awaySelect = document.getElementById('awayTeamSelect');
  if (!homeSelect || !awaySelect) return;
  
  const teams = getTeams().filter(t => t.sport === sport);
  
  homeSelect.innerHTML = '<option value="">— Select Team —</option>';
  awaySelect.innerHTML = '<option value="">— Select Team —</option>';
  
  teams.forEach(t => { 
    homeSelect.innerHTML += `<option value="${t.id}">${t.name} (${t.id})</option>`; 
    awaySelect.innerHTML += `<option value="${t.id}">${t.name} (${t.id})</option>`; 
  });
}

/* ──────────────────────────────────────────────────────────────
   CANTEEN INVENTORY
────────────────────────────────────────────────────────────── */
function getProducts() { return JSON.parse(localStorage.getItem('ac_products')) || []; }
function saveProducts(products) { localStorage.setItem('ac_products', JSON.stringify(products)); }

function addProduct() {
  const nameInput = document.getElementById('productName');
  const sizeInput = document.getElementById('productSize');
  const costInput = document.getElementById('productCost');
  const retailInput = document.getElementById('productRetail');
  const stockInput = document.getElementById('productStock');

  if (!nameInput) return;

  const name = nameInput.value.trim();
  const size = sizeInput ? sizeInput.value.trim() : '';
  const cost = costInput ? parseFloat(costInput.value) || 0 : 0;
  const retail = retailInput ? parseFloat(retailInput.value) || 0 : 0;
  const stock = stockInput ? parseInt(stockInput.value) || 0 : 0;

  if (!name) { alert('Please enter a product name.'); return; }
  const products = getProducts();

  const id = 'P' + String(products.length + 1).padStart(3, '0');
  products.push({ 
    id, name, size, cost, retail, 
    initialStock: stock, currentStock: stock  
  });
  
  saveProducts(products);
  
  nameInput.value = ''; 
  if (sizeInput) sizeInput.value = ''; 
  if (costInput) costInput.value = ''; 
  if (retailInput) retailInput.value = ''; 
  if (stockInput) stockInput.value = '0';
  
  renderProducts();
  refreshCanteenSelectDropdown();
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  renderProducts();
  refreshCanteenSelectDropdown();
}

function renderProducts() {
  const products = getProducts();
  const tbody = document.getElementById('productsBody');
  const countSpan = document.getElementById('productCount');
  if (countSpan) countSpan.textContent = `${products.length} products`;
  if (!tbody) return;
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#666;">No products in catalogue.</td></tr>';
    return;
  }

  products.forEach(p => {
    const margin = p.retail - p.cost;
    const marginPct = p.retail > 0 ? Math.round((margin / p.retail) * 100) : 0;
    const initStock = p.initialStock !== undefined ? p.initialStock : 0;
    const currStock = p.currentStock !== undefined ? p.currentStock : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge" style="background:#222; padding:2px 6px; border-radius:4px; border:1px solid #444; font-family:monospace; color:#00ffcc;">${p.id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.size || '—'}</td>
      <td>$${p.cost.toFixed(2)}</td>
      <td>$${p.retail.toFixed(2)}</td>
      <td><span style="color:#00ffcc">+$${margin.toFixed(2)} (${marginPct}%)</span></td>
      <td>${initStock}</td>
      <td style="${currStock <= 0 ? 'color: #ff4d4d; font-weight:bold;' : 'color: #00ffcc;'}">${currStock}</td>
      <td><button class="btn btn--danger" style="padding: 2px 8px; font-size:11px;" onclick="deleteProduct('${p.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ──────────────────────────────────────────────────────────────
   SCOREBOARD & DROPDOWN SALES
────────────────────────────────────────────────────────────── */
function getMatches() { return JSON.parse(localStorage.getItem('ac_matches')) || []; }
function saveMatches(matches) { localStorage.setItem('ac_matches', JSON.stringify(matches)); }
function getSales() { return JSON.parse(localStorage.getItem('ac_sales')) || []; }
function saveSales(sales) { localStorage.setItem('ac_sales', JSON.stringify(sales)); }

function refreshCanteenSelectDropdown() {
  const selectEl = document.getElementById('canteenProductSelect');
  if (!selectEl) return;
  const products = getProducts();
  
  selectEl.innerHTML = '<option value="">— Select Drink / Product —</option>';
  products.forEach(p => {
    const currStock = p.currentStock !== undefined ? p.currentStock : p.initialStock;
    selectEl.innerHTML += `<option value="${p.id}">${p.name} (${p.size || 'N/A'}) - Stock: ${currStock}</option>`;
  });
}

function handleDropdownSale() {
  if (!state.match) { alert('Please start a match first.'); return; }
  const selectEl = document.getElementById('canteenProductSelect');
  if (!selectEl) return;
  const productId = selectEl.value;
  if (!productId) return;

  const products = getProducts();
  const pIndex = products.findIndex(p => p.id === productId);
  
  if (pIndex !== -1) {
    if (products[pIndex].currentStock <= 0) {
      alert('Out of stock!');
      selectEl.value = '';
      return;
    }
    
    products[pIndex].currentStock -= 1;
    saveProducts(products);
    
    const sales = getSales();
    sales.push({
      sales_id: 'S' + Date.now(),
      match_id: state.match.match_id,
      product_id: productId,
      quantity: 1
    });
    saveSales(sales);
    
    renderProducts();
    refreshCanteenSelectDropdown();
    renderCanteenLiveWidget();
    selectEl.value = '';
  }
}

function renderCanteenLiveWidget() {
  const livesalesWidget = document.getElementById('livesales-widget');
  if (!livesalesWidget) return;
  const products = getProducts();
  livesalesWidget.innerHTML = '';

  if (products.length === 0) {
    livesalesWidget.innerHTML = '<p style="color: #666; font-style: italic; font-size:12px;">No products defined.</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    const currStock = product.currentStock !== undefined ? product.currentStock : product.initialStock;
    card.style.cssText = "background: #111; border: 1px solid #333; padding: 6px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; margin-right: 6px; margin-bottom: 6px;";
    card.innerHTML = `<span style="font-weight:bold; color:#fff;">${product.name}</span> <span style="color:#888;">(Stock: <span style="color:${currStock <= 3 ? '#ff4d4d' : '#00ffcc'}">${currStock}</span>)</span>`;
    livesalesWidget.appendChild(card);
  });
}

function startMatch() {
  const sportEl = document.getElementById('sportSelect');
  const dateEl = document.getElementById('matchDate');
  const timeEl = document.getElementById('matchTime');
  const tempEl = document.getElementById('weatherTemp');
  const homeEl = document.getElementById('homeTeamSelect');
  const awayEl = document.getElementById('awayTeamSelect');
  const statusEl = document.getElementById('matchStatus');
  const notesEl = document.getElementById('matchNotes');

  if (!sportEl || !homeEl || !awayEl) return;

  const sport = sportEl.value;
  const homeId = homeEl.value;
  const awayId = awayEl.value;
  const date = dateEl ? dateEl.value : '';
  const time = timeEl ? timeEl.value : '';
  const temp = tempEl ? (parseInt(tempEl.value) || 25) : 25;
  const status = statusEl ? statusEl.value : 'Scheduled';
  let notes = notesEl ? notesEl.value.trim() : '';

  if (!sport || !homeId || !awayId) { alert('Please select Sport, Home Team and Away Team.'); return; }
  if (homeId === awayId) { alert('Home and Away teams cannot be the same.'); return; }

  const teams = getTeams();
  const homeTeam = teams.find(t => t.id === homeId);
  const awayTeam = teams.find(t => t.id === awayId);
  const matchId = 'M' + String(Date.now()).slice(-6);

  let finalStatus = status;
  if (temp >= 40) {
    const heatTempEl = document.getElementById('heatTemp');
    const heatOverlayEl = document.getElementById('heatOverlay');
    if (heatTempEl) heatTempEl.textContent = temp;
    if (heatOverlayEl) heatOverlayEl.classList.remove('hidden');
    finalStatus = 'Cancelled';
    notes = `Cancelled due to Heat Policy. ${notes}`.trim();
  }

  state.match = {
    match_id: matchId, date, time, weather_temp_c: temp, sport_type: sport,
    home_team_id: homeId, away_team_id: awayId,
    homeTeamName: homeTeam ? homeTeam.name : 'Home', awayTeamName: awayTeam ? awayTeam.name : 'Away',
    homeScoreState: SPORTS[sport].initScore(), awayScoreState: SPORTS[sport].initScore(),
    status: finalStatus, notes: notes
  };

  const hn = document.getElementById('homeName'); if(hn) hn.textContent = state.match.homeTeamName;
  const an = document.getElementById('awayName'); if(an) an.textContent = state.match.awayTeamName;
  const sc = document.getElementById('sportChip'); if(sc) sc.textContent = SPORTS[sport].label;
  
  const setupCard = document.querySelector('.card--setup'); if(setupCard) setupCard.classList.add('hidden');
  const lp = document.getElementById('livePanel'); if(lp) lp.classList.remove('hidden');

  updateScoreboardDisplay();
  refreshCanteenSelectDropdown();
  renderCanteenLiveWidget();
  renderScoringButtons();
}

function renderScoringButtons() {
  const homeContainer = document.getElementById('homeBtns');
  const awayContainer = document.getElementById('awayBtns');
  if (!homeContainer || !awayContainer) return;
  
  homeContainer.innerHTML = '';
  awayContainer.innerHTML = '';
  
  const config = SPORTS[state.match.sport_type];

  config.home.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary';
    btn.style.cssText = "width: 100%; margin-bottom: 8px; padding: 10px; font-weight: bold; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer;";
    btn.textContent = b.label;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.match.homeScoreState[b.key] = (state.match.homeScoreState[b.key] || 0) + b.value;
      state.match.homeScoreState = config.calcScore(state.match.homeScoreState);
      updateScoreboardDisplay();
    });
    homeContainer.appendChild(btn);
  });

  config.away.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary';
    btn.style.cssText = "width: 100%; margin-bottom: 8px; padding: 10px; font-weight: bold; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer;";
    btn.textContent = b.label;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.match.awayScoreState[b.key] = (state.match.awayScoreState[b.key] || 0) + b.value;
      state.match.awayScoreState = config.calcScore(state.match.awayScoreState);
      updateScoreboardDisplay();
    });
    awayContainer.appendChild(btn);
  });
}

function updateScoreboardDisplay() {
  if (!state.match) return;
  const config = SPORTS[state.match.sport_type];
  
  const hsm = document.getElementById('homeScoreMain'); if(hsm) hsm.textContent = config.displayMain(state.match.homeScoreState);
  const hsd = document.getElementById('homeScoreDetail'); if(hsd) hsd.textContent = config.displayDetail(state.match.homeScoreState);
  const asm = document.getElementById('awayScoreMain'); if(asm) asm.textContent = config.displayMain(state.match.awayScoreState);
  const asd = document.getElementById('awayScoreDetail'); if(asd) asd.textContent = config.displayDetail(state.match.awayScoreState);
}

function saveMatch() {
  if (!state.match) return;
  const matches = getMatches();
  const sales = getSales();
  const products = getProducts();

  const thisMatchSales = sales.filter(s => s.match_id === state.match.match_id);
  let totalItemsSold = 0;
  let totalRevenue = 0;

  thisMatchSales.forEach(sale => {
    totalItemsSold += sale.quantity;
    const prod = products.find(p => p.id === sale.product_id);
    if (prod) {
      totalRevenue += (sale.quantity * prod.retail);
    }
  });

  const config = SPORTS[state.match.sport_type];
  const savedRecord = {
    match_id: state.match.match_id,
    date: state.match.date,
    time: state.match.time,
    weather_temp_c: state.match.weather_temp_c,
    sport_type: state.match.sport_type,
    home_team_id: state.match.home_team_id,
    away_team_id: state.match.away_team_id,
    home_score: config.displayMain(state.match.homeScoreState) + " " + config.displayDetail(state.match.homeScoreState),
    away_score: config.displayMain(state.match.awayScoreState) + " " + config.displayDetail(state.match.awayScoreState),
    status: state.match.status,
    canteen_items_sold: totalItemsSold,
    canteen_revenue: `$${totalRevenue.toFixed(2)}`,
    notes: state.match.notes
  };

  matches.push(savedRecord);
  saveMatches(matches);

  alert(`Match saved successfully!\n\nItems Sold: ${totalItemsSold}\nTotal Revenue: $${totalRevenue.toFixed(2)}`);
  resetMatch();
}

function resetMatch() {
  state.match = null;
  const lp = document.getElementById('livePanel'); if(lp) lp.classList.add('hidden');
  const sc = document.querySelector('.card--setup'); if(sc) sc.classList.remove('hidden');
  const mn = document.getElementById('matchNotes'); if(mn) mn.value = '';
  setDefaults();
  renderHistoryTable();
}

function setDefaults() {
  const dInput = document.getElementById('matchDate'); 
  const tInput = document.getElementById('matchTime');
  if (!dInput || !tInput) return;
  const now = new Date();
  dInput.value = now.toISOString().split('T')[0];
  tInput.value = now.toTimeString().split(' ')[0].slice(0, 5);
}

function renderHistoryTable() {
  const tbody = document.getElementById('matchesBody');
  const countSpan = document.getElementById('matchCount');
  if (!tbody) return;
  
  const matches = getMatches();
  const teams = getTeams();
  if (countSpan) countSpan.textContent = `${matches.length} matches`;
  tbody.innerHTML = '';

  if (matches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#666;">No historical matches found.</td></tr>';
    return;
  }

  matches.forEach(m => {
    const homeTeam = teams.find(t => t.id === m.home_team_id)?.name || m.home_team_id;
    const awayTeam = teams.find(t => t.id === m.away_team_id)?.name || m.away_team_id;
    const itemsSold = m.canteen_items_sold !== undefined ? m.canteen_items_sold : 0;
    const revenue = m.canteen_revenue !== undefined ? m.canteen_revenue : '$0.00';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge" style="background:#222; font-family:monospace; padding:2px 6px; border-radius:4px;">${m.match_id}</span></td>
      <td><small style="color:#aaa;">${m.date}</small></td>
      <td><span class="sku-badge" style="background:#333; color:#ffc107;">${m.sport_type.toUpperCase()}</span></td>
      <td><strong>${homeTeam}</strong></td>
      <td><strong>${awayTeam}</strong></td>
      <td><strong style="color:#ffc107;">${m.home_score} - ${m.away_score}</strong></td>
      <td>${m.weather_temp_c}°C</td>
      <td><span style="color: #00ffcc; font-weight:bold;">${itemsSold} sold (${revenue})</span></td>
      <td><span style="padding:2px 6px; border-radius:4px; font-size:11px; background:${m.status==='Cancelled'?'#ff4d4d':'#00ffcc'}; color:#000;">${m.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function convertToCSV(objArray) {
  if (objArray.length === 0) return '';
  const headers = Object.keys(objArray[0]).join(',');
  const rows = objArray.map(obj => Object.values(obj).map(val => {
    let str = String(val); if (str.includes(',')) str = `"${str}"`; return str;
  }).join(','));
  return [headers, ...rows].join('\n');
}

function downloadCSV(filename, csvData) {
  if (!csvData) { alert('No data available.'); return; }
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename); document.body.appendChild(link);
  link.click(); document.body.removeChild(link);
}

function exportMatches() { downloadCSV('matches.csv', convertToCSV(getMatches())); }
function exportSales() { downloadCSV('sales.csv', convertToCSV(getSales())); }
function exportTeams() { downloadCSV('teams.csv', convertToCSV(getTeams())); }
function exportProducts() { downloadCSV('products.csv', convertToCSV(getProducts())); }

function clearAllData() {
  if (confirm('Are you sure you want to delete ALL data?')) {
    localStorage.clear(); 
    location.reload();
  }
}

/* ──────────────────────────────────────────────────────────────
   🛡️ ULTRA-DEFENSIVE EVENT BINDING SYSTEM
   (Prevents any null element from crashing the script)
────────────────────────────────────────────────────────────── */
function safeBind(id, event, callback) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, callback);
  }
}

function initEventListeners() {
  safeBind('startMatchBtn', 'click', (e) => { e.preventDefault(); startMatch(); });
  safeBind('resetMatchBtn', 'click', (e) => { e.preventDefault(); resetMatch(); });
  safeBind('saveMatchBtn', 'click', (e) => { e.preventDefault(); saveMatch(); });
  safeBind('logDropdownSaleBtn', 'click', (e) => { e.preventDefault(); handleDropdownSale(); });
  safeBind('addTeamBtn', 'click', (e) => { e.preventDefault(); addTeam(); });
  safeBind('addProductBtn', 'click', (e) => { e.preventDefault(); addProduct(); });
  
  safeBind('exportMatchesBtn', 'click', exportMatches);
  safeBind('exportSalesBtn', 'click', exportSales);
  safeBind('exportTeamsBtn', 'click', exportTeams);
  safeBind('exportProductsBtn', 'click', exportProducts);
  safeBind('clearDataBtn', 'click', clearAllData);

  const sportSelect = document.getElementById('sportSelect');
  if (sportSelect) {
    sportSelect.addEventListener('change', refreshTeamDropdowns);
  }

  const heatOkBtn = document.getElementById('heatOkBtn');
  if (heatOkBtn) {
    heatOkBtn.addEventListener('click', () => {
      const ho = document.getElementById('heatOverlay');
      if (ho) ho.classList.add('hidden');
      saveMatch();
    });
  }

  // 防刷新雷达：拦截可能存在的 form 提交
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (document.getElementById('productName')?.value) {
        addProduct();
      }
    });
  });
}

function init() {
  initTabs();
  initEventListeners();
  setDefaults();
  renderTeams();
  renderProducts();
  refreshTeamDropdowns();
  refreshCanteenSelectDropdown();
  renderHistoryTable();
}

document.addEventListener('DOMContentLoaded', init);
