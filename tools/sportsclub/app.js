/* ═══════════════════════════════════════════════════════════════
   AusClub Pro — app.js (Transparent & Clean Edition)
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
      const targetPanel = document.getElementById('tab-' + tab.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
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
  if (!name) { alert('Please enter a product name.'); return; }

  const size = sizeInput ? sizeInput.value.trim() : '';
  const cost = costInput ? parseFloat(costInput.value) || 0 : 0;
  const retail = retailInput ? parseFloat(retailInput.value) || 0 : 0;
  const stock = stockInput ? parseInt(stockInput.value) || 0 : 0;

  const products = getProducts();
  const id = 'P' + String(products.length + 1).padStart(3, '0');
  
  products.push({ id, name, size, cost, retail, initialStock: stock, currentStock: stock });
  saveProducts(products);
  
  // 清空输入框
  nameInput.value = '';
  if (sizeInput) sizeInput.value = '';
  if (costInput) costInput.value = '';
  if (retailInput) retailInput.value = '';
  if (stockInput) stockInput.value = '0';
  
  // 刷新界面
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
  if (!tbody) return;
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#666;">No products in catalogue.</td></tr>';
    return;
  }

  products.forEach(p => {
    const margin = p.retail - p.cost;
    const marginPct = p.retail > 0 ? Math.round((margin / p.retail) * 100) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge" style="background:#222; padding:2px 6px; border-radius:4px; font-family:monospace; color:#00ffcc;">${p.id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.size || '—'}</td>
      <td>$${p.cost.toFixed(2)}</td>
      <td>$${p.retail.toFixed(2)}</td>
      <td><span style="color:#00ffcc">+$${margin.toFixed(2)} (${marginPct}%)</span></td>
      <td>${p.initialStock}</td>
      <td style="color: #00ffcc;">${p.currentStock}</td>
      <td><button class="btn btn--danger" style="padding: 2px 8px; font-size:11px;" onclick="deleteProduct('${p.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ──────────────────────────────────────────────────────────────
   SCOREBOARD & DROPDOWN SALES
────────────────────────────────────────────────────────────── */
function refreshCanteenSelectDropdown() {
  const selectEl = document.getElementById('canteenProductSelect');
  if (!selectEl) return;
  const products = getProducts();
  
  selectEl.innerHTML = '<option value="">— Select Drink / Product —</option>';
  products.forEach(p => {
    selectEl.innerHTML += `<option value="${p.id}">${p.name} (${p.size || 'N/A'}) - Stock: ${p.currentStock}</option>`;
  });
}

function startMatch() {
  const sportEl = document.getElementById('sportSelect');
  const homeEl = document.getElementById('homeTeamSelect');
  const awayEl = document.getElementById('awayTeamSelect');
  if (!sportEl || !homeEl || !awayEl) return;

  const sport = sportSelect.value;
  const homeId = homeTeamSelect.value;
  const awayId = awayTeamSelect.value;

  if (!sport || !homeId || !awayId) { alert('Please select Sport, Home Team and Away Team.'); return; }
  if (homeId === awayId) { alert('Home and Away teams cannot be the same.'); return; }

  state.match = {
    match_id: 'M' + String(Date.now()).slice(-6),
    sport_type: sport,
    home_team_id: homeId,
    away_team_id: awayId,
    homeScoreState: SPORTS[sport].initScore(),
    awayScoreState: SPORTS[sport].initScore()
  };

  const hn = document.getElementById('homeName'); if(hn) hn.textContent = "Home Team";
  const an = document.getElementById('awayName'); if(an) an.textContent = "Away Team";
  
  const setupCard = document.querySelector('.card--setup'); if(setupCard) setupCard.classList.add('hidden');
  const lp = document.getElementById('livePanel'); if(lp) lp.classList.remove('hidden');

  updateScoreboardDisplay();
  renderScoringButtons();
}

function renderScoringButtons() {
  const homeContainer = document.getElementById('homeBtns');
  const awayContainer = document.getElementById('awayBtns');
  if (!homeContainer || !awayContainer || !state.match) return;
  
  homeContainer.innerHTML = '';
  awayContainer.innerHTML = '';
  
  const config = SPORTS[state.match.sport_type];

  config.home.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary';
    btn.style.cssText = "width: 100%; margin-bottom: 8px; padding: 10px; font-weight: bold; background: #222; color: #fff; border: 1px solid #444;";
    btn.textContent = b.label;
    btn.onclick = (e) => {
      e.preventDefault();
      state.match.homeScoreState[b.key] = (state.match.homeScoreState[b.key] || 0) + b.value;
      state.match.homeScoreState = config.calcScore(state.match.homeScoreState);
      updateScoreboardDisplay();
    };
    homeContainer.appendChild(btn);
  });

  config.away.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary';
    btn.style.cssText = "width: 100%; margin-bottom: 8px; padding: 10px; font-weight: bold; background: #222; color: #fff; border: 1px solid #444;";
    btn.textContent = b.label;
    btn.onclick = (e) => {
      e.preventDefault();
      state.match.awayScoreState[b.key] = (state.match.awayScoreState[b.key] || 0) + b.value;
      state.match.awayScoreState = config.calcScore(state.match.awayScoreState);
      updateScoreboardDisplay();
    };
    awayContainer.appendChild(btn);
  });
}

function updateScoreboardDisplay() {
  if (!state.match) return;
  const config = SPORTS[state.match.sport_type];
  const hsm = document.getElementById('homeScoreMain'); if(hsm) hsm.textContent = config.displayMain(state.match.homeScoreState);
  const asm = document.getElementById('awayScoreMain'); if(asm) asm.textContent = config.displayMain(state.match.awayScoreState);
}

/* ──────────────────────────────────────────────────────────────
   INIT & EVENT BINDING
────────────────────────────────────────────────────────────── */
function init() {
  initTabs();
  
  // 用最直观的传统方式绑定核心按钮，坚决不用复杂循环
  const startBtn = document.getElementById('startMatchBtn');
  if (startBtn) startBtn.onclick = (e) => { e.preventDefault(); startMatch(); };

  const addProdBtn = document.getElementById('addProductBtn');
  if (addProdBtn) addProdBtn.onclick = (e) => { e.preventDefault(); addProduct(); };

  // 页面首次加载时硬性执行一次渲染
  renderProducts();
  refreshCanteenSelectDropdown();
}

// 确保在页面加载完毕后拉起初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
