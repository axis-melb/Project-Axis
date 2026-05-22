/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js (Optimized: Horizontal POS & Sales History Closure)
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

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.view-section');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.add('hidden'));
      tab.classList.add('active');
      const targetView = document.getElementById(tab.dataset.tab + 'View');
      if (targetView) targetView.classList.remove('hidden');
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   TEAMS CORE LOGIC
────────────────────────────────────────────────────────────── */
function getTeams() { return JSON.parse(localStorage.getItem('ac_teams')) || []; }
function saveTeams(teams) { localStorage.setItem('ac_teams', JSON.stringify(teams)); }

function addTeam() {
  const nameInput = document.getElementById('teamName');
  const sportSelect = document.getElementById('teamSport');
  const suburbInput = document.getElementById('teamSuburb');
  const name = nameInput.value.trim();
  const sport = sportSelect.value;
  const suburb = suburbInput.value.trim();

  if (!name) { alert('Please enter a team name.'); return; }
  const teams = getTeams();
  const duplicate = teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.sport === sport);
  if (duplicate) { alert(`Error: This team already exists under SKU [${duplicate.id}].`); return; }

  const id = 'T' + String(teams.length + 1).padStart(3, '0');
  teams.push({ id, name, sport, suburb });
  saveTeams(teams);
  nameInput.value = ''; suburbInput.value = '';
  renderTeams(); refreshTeamDropdowns();
}

function deleteTeam(id) {
  let teams = getTeams();
  teams = teams.filter(t => t.id !== id);
  saveTeams(teams);
  renderTeams(); refreshTeamDropdowns();
}

function renderTeams() {
  const teams = getTeams();
  const tbody = document.getElementById('teams-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  teams.forEach(t => {
    const sportLabel = SPORTS[t.sport]?.label || t.sport;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge">${t.id}</span></td>
      <td><strong>${t.name}</strong></td>
      <td>${sportLabel}</td>
      <td>${t.suburb || '—'}</td>
      <td><button class="btn btn--danger btn--xs" onclick="deleteTeam('${t.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function refreshTeamDropdowns() {
  const sport = document.getElementById('sportSelect').value;
  const homeSelect = document.getElementById('homeTeamSelect');
  const awaySelect = document.getElementById('awayTeamSelect');
  if (!homeSelect || !awaySelect) return;
  const teams = getTeams().filter(t => t.sport === sport);
  const generateOptions = (selectEl) => {
    selectEl.innerHTML = '<option value="">— Select Team —</option>';
    teams.forEach(t => { selectEl.innerHTML += `<option value="${t.id}">${t.name} (${t.id})</option>`; });
  };
  generateOptions(homeSelect); generateOptions(awaySelect);
}

/* ──────────────────────────────────────────────────────────────
   CANTEEN PRODUCTS LOGIC (FIXED FOR INITIAL/CURRENT STOCK)
────────────────────────────────────────────────────────────── */
function getProducts() { return JSON.parse(localStorage.getItem('ac_products')) || []; }
function saveProducts(products) { localStorage.setItem('ac_products', JSON.stringify(products)); }

function addProduct() {
  const nameInput = document.getElementById('productName');
  const sizeInput = document.getElementById('productSize');
  const costInput = document.getElementById('productCost');
  const retailInput = document.getElementById('productRetail');
  const stockInput = document.getElementById('productStock'); // 精准对应 HTML 里的新 id

  const name = nameInput.value.trim();
  const size = sizeInput.value.trim();
  const cost = parseFloat(costInput.value) || 0;
  const retail = parseFloat(retailInput.value) || 0;
  const stock = parseInt(stockInput.value) || 0; // 确保抓到数量

  if (!name) { alert('Please enter a product name.'); return; }
  const products = getProducts();
  const duplicate = products.find(p => p.name.toLowerCase() === name.toLowerCase() && p.size.toLowerCase() === size.toLowerCase());
  if (duplicate) { alert(`Error: Variant with size ${size} already exists under SKU [${duplicate.id}].`); return; }

  const id = 'P' + String(products.length + 1).padStart(3, '0');
  products.push({ 
    id, 
    name, 
    size, 
    cost, 
    retail, 
    initialStock: stock, // 成功捕获并写入初始库存
    currentStock: stock  // 当前可用库存初始等于进货量
  });
  
  saveProducts(products);
  nameInput.value = ''; sizeInput.value = ''; costInput.value = ''; retailInput.value = ''; stockInput.value = '0';
  renderProducts();
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  renderProducts();
}

function renderProducts() {
  const products = getProducts();
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  products.forEach(p => {
    const margin = p.retail - p.cost;
    const marginPct = p.retail > 0 ? Math.round((margin / p.retail) * 100) : 0;
    const initStock = p.initialStock !== undefined ? p.initialStock : 0;
    const currStock = p.currentStock !== undefined ? p.currentStock : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge">${p.id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.size || '—'}</td>
      <td>$${p.cost.toFixed(2)}</td>
      <td>$${p.retail.toFixed(2)}</td>
      <td><span class="text--success">+$${margin.toFixed(2)} (${marginPct}%)</span></td>
      <td>${initStock}</td>
      <td style="${currStock <= 0 ? 'color: #ff4d4d; font-weight:bold;' : 'color: #00ffcc;'}">${currStock}</td>
      <td><button class="btn btn--danger btn--xs" onclick="deleteProduct('${p.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ──────────────────────────────────────────────────────────────
   SCOREBOARD & HORIZONTAL POS WIDGET LOGIC
────────────────────────────────────────────────────────────── */
function getMatches() { return JSON.parse(localStorage.getItem('ac_matches')) || []; }
function saveMatches(matches) { localStorage.setItem('ac_matches', JSON.stringify(matches)); }
function getSales() { return JSON.parse(localStorage.getItem('ac_sales')) || []; }
function saveSales(sales) { localStorage.setItem('ac_sales', JSON.stringify(sales)); }

// 【优化后的横向緊湊 POS 控件】：像小标签一样横向平铺，节省垂直空间
function renderCanteenControls() {
  const livesalesWidget = document.getElementById('livesales-widget');
  if (!livesalesWidget) return;
  const products = getProducts();
  livesalesWidget.innerHTML = '';

  if (products.length === 0) {
    livesalesWidget.innerHTML = '<p style="color: #666; font-style: italic; font-size:12px;">No products defined in Canteen.</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    // 使用简洁的行内块样式，形成横向流式布局
    card.style.cssText = "background: #1a1a1a; border: 1px solid #333; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 140px;";

    const info = document.createElement('div');
    const currStock = product.currentStock !== undefined ? product.currentStock : product.initialStock;
    info.innerHTML = `<div style="font-weight:bold;">${product.name}</div><div style="color:#aaa; font-size:10
