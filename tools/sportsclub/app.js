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
    initScore: () => ({ runs: 0, wickets: 0, oversStr: '0.0' }), // keeping it simple
    calcScore: (s, val, label) => {
      if (label === 'Wicket') {
        s.wickets += 0; // handled dynamically if complex, but keeping standard template
      }
      return s;
    },
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
   TABS NAVIGATION
────────────────────────────────────────────────────────────── */
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
function getTeams() {
  return JSON.parse(localStorage.getItem('ac_teams')) || [];
}

function saveTeams(teams) {
  localStorage.setItem('ac_teams', JSON.stringify(teams));
}

function addTeam() {
  const nameInput = document.getElementById('teamName');
  const sportSelect = document.getElementById('teamSport');
  const suburbInput = document.getElementById('teamSuburb');

  const name = nameInput.value.trim();
  const sport = sportSelect.value;
  const suburb = suburbInput.value.trim();

  if (!name) {
    alert('Please enter a team name.');
    return;
  }

  const teams = getTeams();
  
  // Poka-Yoke duplicate matching rule
  const duplicate = teams.find(t => t.name.toLowerCase() === name.toLowerCase() && t.sport === sport);
  if (duplicate) {
    alert(`Error: This team already exists under SKU [${duplicate.id}].`);
    return;
  }

  const id = 'T' + String(teams.length + 1).padStart(3, '0');
  teams.push({ id, name, sport, suburb });
  saveTeams(teams);

  nameInput.value = '';
  suburbInput.value = '';

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
    teams.forEach(t => {
      selectEl.innerHTML += `<option value="${t.id}">${t.name} (${t.id})</option>`;
    });
  };

  generateOptions(homeSelect);
  generateOptions(awaySelect);
}

/* ──────────────────────────────────────────────────────────────
   CANTEEN PRODUCTS LOGIC (FIXED FOR STOCK QUANTITY)
────────────────────────────────────────────────────────────── */
function getProducts() {
  return JSON.parse(localStorage.getItem('ac_products')) || [];
}

function saveProducts(products) {
  localStorage.setItem('ac_products', JSON.stringify(products));
}

function addProduct() {
  const nameInput = document.getElementById('productName');
  const sizeInput = document.getElementById('productSize');
  const costInput = document.getElementById('productCost');
  const retailInput = document.getElementById('productRetail');
  const stockInput = document.getElementById('productStock'); // 读取新增加的初始库存框

  const name = nameInput.value.trim();
  const size = sizeInput.value.trim();
  const cost = parseFloat(costInput.value) || 0;
  const retail = parseFloat(retailInput.value) || 0;
  const initialStock = parseInt(stockInput.value) || 0; // 转换为整数

  if (!name) {
    alert('Please enter a product name.');
    return;
  }

  const products = getProducts();

  // Multi-Variant Rule: block only if both name and size are identical
  const duplicate = products.find(p => p.name.toLowerCase() === name.toLowerCase() && p.size.toLowerCase() === size.toLowerCase());
  if (duplicate) {
    alert(`Error: Product variant with size ${size} already exists under SKU [${duplicate.id}].`);
    return;
  }

  const id = 'P' + String(products.length + 1).padStart(3, '0');
  products.push({ 
    id, 
    name, 
    size, 
    cost, 
    retail, 
    initialStock: initialStock, // 完美记录初始库存
    currentStock: initialStock  // 新建时当前库存等于初始库存
  });
  
  saveProducts(products);

  nameInput.value = '';
  sizeInput.value = '';
  costInput.value = '';
  retailInput.value = '';
  stockInput.value = '0';

  renderProducts();
  // 如果比赛正在进行，同步更新销售控制板
  if (state.match) {
    renderCanteenControls();
  }
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  renderProducts();
  if (state.match) {
    renderCanteenControls();
  }
}

function renderProducts() {
  const products = getProducts();
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  products.forEach(p => {
    const margin = p.retail - p.cost;
    const marginPct = p.retail > 0 ? Math.round((margin / p.retail) * 100) : 0;
    
    // 获取当前可用库存（处理未定义老数据的兼容fallback）
    const initialStock = p.initialStock !== undefined ? p.initialStock : '—';
    const currentStock = p.currentStock !== undefined ? p.currentStock : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="sku-badge">${p.id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.size || '—'}</td>
      <td>$${p.cost.toFixed(2)}</td>
      <td>$${p.retail.toFixed(2)}</td>
      <td><span class="text--success">+$${margin.toFixed(2)} (${marginPct}%)</span></td>
      <td>${initialStock}</td>
      <td id="stock-td-${p.id}" style="${currentStock <= 0 && currentStock !== '—' ? 'color: #ff4d4d; font-weight:bold;' : ''}">${currentStock}</td>
      <td><button class="btn btn--danger btn--xs" onclick="deleteProduct('${p.id}')">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ──────────────────────────────────────────────────────────────
   SCOREBOARD & LIVE MATCH LOGIC + LIVE POS WIDGET
────────────────────────────────────────────────────────────── */
function getMatches() {
  return JSON.parse(localStorage.getItem('ac_matches')) || [];
}

function saveMatches(matches) {
  localStorage.setItem('ac_matches', JSON.stringify(matches));
}

function getSales() {
  return JSON.parse(localStorage.getItem('ac_sales')) || [];
}

function saveSales(sales) {
  localStorage.setItem('ac_sales', JSON.stringify(sales));
}

// 【新增控制函数】：赛场激活时动态拉出 Canteen 商品
function renderCanteenControls() {
  const livesalesWidget = document.getElementById('livesales-widget');
  if (!livesalesWidget) return;
  
  const products = getProducts();
  livesalesWidget.innerHTML = '';

  if (products.length === 0) {
    livesalesWidget.innerHTML = '<p style="color: #666; font-style: italic;">No products defined in Canteen Catalogue.</p>';
    return;
  }

  products.forEach((product) => {
    const itemRow = document.createElement('div');
    itemRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding: 8px 0;";

    const nameSpan = document.createElement('span');
    nameSpan.innerHTML = `<strong>${product.name}</strong> <small style="color:#aaa;">(${product.size || 'Size N/A'})</small>`;

    const stockSpan = document.createElement('span');
    const currStock = product.currentStock !== undefined ? product.currentStock : product.initialStock;
    stockSpan.innerHTML = `Stock: <span style="color:#ffc107; font-weight:bold;">${currStock}</span>`;

    const sellButton = document.createElement('button');
    sellButton.className = "btn btn--primary btn--xs";
    sellButton.style.padding = "4px 10px";
    sellButton.textContent = '+1 Sold';

    // 智能化 Poka-Yoke：缺货拦截
    if (currStock <= 0) {
      sellButton.className = "btn btn--ghost btn--xs";
      sellButton.style.color = "#666";
      sellButton.style.borderColor = "#333";
      sellButton.textContent = 'Out of Stock';
      sellButton.disabled = true;
    } else {
      sellButton.addEventListener('click', () => logLiveSale(product.id));
    }

    itemRow.appendChild(nameSpan);
    itemRow.appendChild(stockSpan);
    itemRow.appendChild(sellButton);
    livesalesWidget.appendChild(itemRow);
  });
}

// 【新增点单逻辑】：点一下不仅实时扣库存，还会把记录追加到当前的 sales 流水里
function logLiveSale(productId) {
  if (!state.match) return;

  // 1. 扣减主档当前可用库存
  const products = getProducts();
  const pIndex = products.findIndex(p => p.id === productId);
  if (pIndex !== -1) {
    if (products[pIndex].currentStock > 0) {
      products[pIndex].currentStock -= 1;
      saveProducts(products);
      renderProducts(); // 刷新 Canteen 面板数据
      renderCanteenControls(); // 刷新赛场实时 POS 面板数据
    }
  }

  // 2. 将这笔账记录到销售日志 (Sales Log) 绑定当前 match_id
  const sales = getSales();
  const salesId = 'S' + String(Date.now()) + String(Math.floor(Math.random() * 100));
  
  sales.push({
    sales_id: salesId,
    match_id: state.match.match_id,
    product_id: productId,
    quantity: 1
  });
  saveSales(sales);
}

function startMatch() {
  const sport = document.getElementById('sportSelect').value;
  const date = document.getElementById('matchDate').value;
  const time = document.getElementById('matchTime').value;
  const temp = parseInt(document.getElementById('matchTemp').value) || 25;
  const homeId = document.getElementById('homeTeamSelect').value;
  const awayId = document.getElementById('awayTeamSelect').value;
  const status = document.getElementById('matchStatus').value;
  let notes = document.getElementById('matchNotes').value.trim();

  if (!homeId || !awayId) {
    alert('Please select both home and away teams.');
    return;
  }
  if (homeId === awayId) {
    alert('Home and Away teams must be different.');
    return;
  }

  const teams = getTeams();
  const homeTeam = teams.find(t => t.id === homeId);
  const awayTeam = teams.find(t => t.id === awayId);

  const matchId = 'M' + String(Date.now()).slice(-6);

  // Core Compliance Rule: Extreme Heat Policy Trigger
  let finalStatus = status;
  if (temp >= 40) {
    alert('⚠️ EXTREME HEAT POLICY TRIGGERED\n\nTemperature is 40°C or higher. National Safety Framework enforces immediate cancellation. Scores forced to 0.');
    finalStatus = 'Cancelled';
    notes = `Cancelled due to National Heat Policy. Re-match pending. ${notes}`.trim();
  }

  const sportConfig = SPORTS[sport];
  
  state.match = {
    match_id: matchId,
    date,
    time,
    weather_temp_c: temp,
    sport_type: sport,
    home_team_id: homeId,
    away_team_id: awayId,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeScoreState: sportConfig.initScore(),
    awayScoreState: sportConfig.initScore(),
    status: finalStatus,
    notes: notes
  };

  // UI Updates
  document.getElementById('homeName').textContent = homeTeam.name;
  document.getElementById('awayName').textContent = awayTeam.name;
  
  document.getElementById('matchSetupForm').classList.add('hidden');
  document.getElementById('livePanel').classList.remove('hidden');

  updateScoreboardDisplay();
  renderCanteenControls(); // *** 完美合体：比赛开始后，瞬间调出商品销售按钮组 ***

  // If heat cancelled, lock controls instantly
  if (finalStatus === 'Cancelled') {
    saveMatch();
  } else {
    renderScoringButtons();
  }
}

function renderScoringButtons() {
  const container = document.getElementById('scoring-actions-container');
  if (!container) return;
  container.innerHTML = '';

  const config = SPORTS[state.match.sport_type];

  const makeColumn = (title, buttons, isHome) => {
    const col = document.createElement('div');
    col.className = 'scoring-col';
    col.innerHTML = `<h3 class="team-title-sub">${title}</h3>`;
    
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn btn--secondary btn--sm btn--full mb-2';
      btn.textContent = b.label;
      btn.addEventListener('click', () => {
        const scoreState = isHome ? state.match.homeScoreState : state.match.awayScoreState;
        scoreState[b.key] = (scoreState[b.key] || 0) + b.value;
        if (config.calcScore) {
          isHome ? state.match.homeScoreState = config.calcScore(scoreState, b.value, b.label) : state.match.awayScoreState = config.calcScore(scoreState, b.value, b.label);
        }
        updateScoreboardDisplay();
      });
      col.appendChild(btn);
    });
    return col;
  };

  container.appendChild(makeColumn(state.match.homeTeamName, config.home, true));
  container.appendChild(makeColumn(state.match.awayTeamName, config.away, false));
}

function updateScoreboardDisplay() {
  if (!state.match) return;
  const config = SPORTS[state.match.sport_type];

  const homeMain = config.displayMain(state.match.homeScoreState);
  const homeDetail = config.displayDetail(state.match.homeScoreState);
  const awayMain = config.displayMain(state.match.awayScoreState);
  const awayDetail = config.displayDetail(state.match.awayScoreState);

  document.getElementById('homeScoreMain').textContent = homeMain;
  document.getElementById('homeScoreDetail').textContent = homeDetail;
  document.getElementById('awayScoreMain').textContent = awayMain;
  document.getElementById('awayScoreDetail').textContent = awayDetail;
}

function saveMatch() {
  if (!state.match) return;
  
  const matches = getMatches();
  const config = SPORTS[state.match.sport_type];

  // Final flat extraction string formatted for CSV
  const finalHomeScore = config.displayMain(state.match.homeScoreState);
  const finalAwayScore = config.displayMain(state.match.awayScoreState);

  const savedRecord = {
    match_id: state.match.match_id,
    date: state.match.date,
    time: state.match.time,
    weather_temp_c: state.match.weather_temp_c,
    sport_type: state.match.sport_type,
    home_team_id: state.match.home_team_id,
    away_team_id: state.match.away_team_id,
    home_score: finalHomeScore,
    away_score: finalAwayScore,
    status: state.match.status === 'Cancelled' ? 'Cancelled' : 'Completed',
    notes: state.match.notes
  };

  matches.push(savedRecord);
  saveMatches(matches);

  alert('Match logged successfully into LocalStorage.');
  resetMatch();
}

function resetMatch() {
  state.match = null;
  document.getElementById('livePanel').classList.add('hidden');
  document.getElementById('matchSetupForm').classList.remove('hidden');
  document.getElementById('matchNotes').value = '';
  setDefaults();
}

function setDefaults() {
  const dInput = document.getElementById('matchDate');
  const tInput = document.getElementById('matchTime');
  if (!dInput || !tInput) return;

  const now = new Date();
  dInput.value = now.toISOString().split('T')[0];
  tInput.value = now.toTimeString().split(' ')[0].slice(0, 5);
}

/* ──────────────────────────────────────────────────────────────
   DATA MANAGEMENT VIEWS (IMPORT / EXPORT FLAT RELATIONAL CSV)
────────────────────────────────────────────────────────────── */
function convertToCSV(objArray) {
  if (objArray.length === 0) return '';
  const headers = Object.keys(objArray[0]).join(',');
  const rows = objArray.map(obj => 
    Object.values(obj).map(val => {
      let str = String(val);
      if (str.includes(',')) str = `"${str}"`; // escape commas
      return str;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
}

function downloadCSV(filename, csvData) {
  if (!csvData) {
    alert('No data available to export.');
    return;
  }
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportMatches() { downloadCSV('matches.csv', convertToCSV(getMatches())); }
function exportSales() { downloadCSV('sales.csv', convertToCSV(getSales())); }
function exportTeams() { downloadCSV('teams.csv', convertToCSV(getTeams())); }
function exportProducts() { downloadCSV('products.csv', convertToCSV(getProducts())); }

function clearAllData() {
  if (confirm('Are you absolutely sure you want to purge all local records? This cannot be undone.')) {
    localStorage.clear();
    init();
    alert('LocalStorage scrubbed clean.');
  }
}

// 核心增强：CSV 高效双向导入解析引擎 (支持 Device Switching)
function handleCSVImport(fileInputId, type) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput || !fileInput.files[0]) {
    alert('Please choose a valid CSV file first.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      alert('Error: Selected file appears to be empty or lacks headers.');
      return;
    }

    const headers = lines[0].split(',');
    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',');
      if (currentline.length !== headers.length) continue; // Skip corrupted row data safely

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        let val = currentline[j];
        // Remove enclosing quotes if any
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        // Deduce numeric values automatically
        if (!isNaN(val) && val.trim() !== '') {
          obj[headers[j]] = val.includes('.') ? parseFloat(val) : parseInt(val);
        } else {
          obj[headers[j]] = val;
        }
      }
      parsedData.push(obj);
    }

    if (confirm(`Are you sure you want to merge/overwrite imported [${parsedData.length}] data entries into ${type}?`)) {
      if (type === 'matches') {
        saveMatches(parsedData);
      } else if (type === 'sales') {
        saveSales(parsedData);
      }
      alert(`Successfully restored ${type} relational logs into LocalStorage!`);
      init(); // Hot re-trigger to reload master panels instantly
    }
  };

  reader.readAsText(file);
}

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

  // Dynamic CSV Imports (绑到 Data 面板上传按钮上)
  const importMatchesBtn = document.getElementById('importMatchesBtn');
  const importSalesBtn = document.getElementById('importSalesBtn');
  
  if (importMatchesBtn) {
    importMatchesBtn.addEventListener('click', () => handleCSVImport('importMatchesFile', 'matches'));
  }
  if (importSalesBtn) {
    importSalesBtn.addEventListener('click', () => handleCSVImport('importSalesFile', 'sales'));
  }

  // Auto filter teams on sport toggle
  document.getElementById('sportSelect').addEventListener('change', () => {
    refreshTeamDropdowns();
  });
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
