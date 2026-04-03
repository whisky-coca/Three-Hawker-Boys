const { createClient } = supabase;
const cfg = window.APP_CONFIG;

if (!cfg) {
  alert('APP_CONFIG manquant');
  throw new Error('APP_CONFIG manquant');
}

const authStorage = window.localStorage;

const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    storageKey: 'yellowjack-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

const els = {
  loginView: document.getElementById('loginView'),
  mustChangeView: document.getElementById('mustChangeView'),
  appView: document.getElementById('appView'),
  menu: document.getElementById('menu'),
  whoami: document.getElementById('whoami'),
  usersMenuBtn: document.getElementById('usersMenuBtn'),
  sidebarUserBox: document.getElementById('sidebarUserBox'),
  caJour: document.getElementById('caJour'),
  caSemaine: document.getElementById('caSemaine'),
  caMois: document.getElementById('caMois'),
  caCarte: document.getElementById('caCarte'),
  caOffert: document.getElementById('caOffert'),
  margeEstimee: document.getElementById('margeEstimee'),
  topProducts: document.getElementById('topProducts'),
  topEmployees: document.getElementById('topEmployees'),
  weeklyHistory: document.getElementById('weeklyHistory'),
  monthlyHistory: document.getElementById('monthlyHistory'),
  salesRows: document.getElementById('salesRows'),
  purchaseRows: document.getElementById('purchaseRows'),
  productRows: document.getElementById('productRows'),
  userRows: document.getElementById('userRows'),
  stockRows: document.getElementById('stockRows'),
  directoryRows: document.getElementById('directoryRows'),
  categoryRows: document.getElementById('categoryRows'),
  saleProduct: document.getElementById('saleProduct'),
  salePrice: document.getElementById('salePrice'),
  saleDiscount: document.getElementById('saleDiscount'),
  saleBeforeDiscount: document.getElementById('saleBeforeDiscount'),
  saleDiscountAmount: document.getElementById('saleDiscountAmount'),
  saleFinalTotal: document.getElementById('saleFinalTotal'),
  profileBox: document.getElementById('profileBox'),
  discountWrap: document.getElementById('discountWrap'),
  directoryManageWrap: document.getElementById('directoryManageWrap'),
  warningManageWrap: document.getElementById('warningManageWrap'),
  warningDirectoryId: document.getElementById('warningDirectoryId'),
  stockCategory: document.getElementById('stockCategory'),
  purchaseCategory: document.getElementById('purchaseCategory'),
  productCategory: document.getElementById('productCategory'),
  defaultPriceBar: document.getElementById('defaultPriceBar'),
  caisseDiscountWrap: document.getElementById('caisseDiscountWrap'),
  payOffert: document.getElementById('payOffert'),
  deliveryZoneForm: document.getElementById('deliveryZoneForm'),
  deliveryRows: document.getElementById('deliveryRows'),
  vipRows: document.getElementById('vipRows'),
  vipMenuBtn: document.getElementById('vipMenuBtn'),
  vipHistoryRows: document.getElementById('vipHistoryRows'),
  recipeRows: document.getElementById('recipeRows'),
  recipeItemRows: document.getElementById('recipeItemRows'),
  topProfitProducts: document.getElementById('topProfitProducts'),
  supplierProducts: document.getElementById('supplierProducts'),
  supplierCartItems: document.getElementById('supplierCartItems'),
  supplierCartCount: document.getElementById('supplierCartCount'),
  supplierCartTotal: document.getElementById('supplierCartTotal'),
  dashboardPurchaseRows: document.getElementById('dashboardPurchaseRows'),
  grossisteMois: document.getElementById('grossisteMois'),
  coutMatiereMois: document.getElementById('coutMatiereMois'),
  beneficeReelMois: document.getElementById('beneficeReelMois'),
  expensesRows: document.getElementById('expensesRows'),
  depensesMois: document.getElementById('depensesMois'),
  vipSubscriptionsMois: document.getElementById('vipSubscriptionsMois'),
  vipSalesMois: document.getElementById('vipSalesMois'),
  topProductsProfit: document.getElementById('topProductsProfit'),
  vipSubscriptionsRows: document.getElementById('vipSubscriptionsRows'),
  dashboardVipSalesRows: document.getElementById('dashboardVipSalesRows'),
};

setInterval(() => {
  const el = document.getElementById('posTime');
  if (el) el.textContent = new Date().toLocaleTimeString();
}, 1000);

let currentProfile = null;
let cache = { ventes: [], achats: [], expenses: [], produits: [], profils: [], stock: [], directory: [], categories: [], basePrices: [], vipClients: [], vipHistory: [], recipes: [], recipeItems: [], supplierItems: [] };
let deliveryZones = [];
let supplierCart = [];

const euro = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));const todayStr = () => new Date().toISOString().slice(0, 10);
const usernameToEmail = (u) => {
  const value = String(u || '').trim().toLowerCase();
  if (value.includes('@')) return value;
  return `${value}@${cfg.USERNAME_DOMAIN}`;
};
const isDirectionRole = r => r === 'directeur' || r === 'codirecteur';
const isDirector = r => r === 'directeur';

const canAccessDashboard = r => ['directeur', 'codirecteur'].includes(r);
const canAccessCaisse = r => ['directeur', 'codirecteur', 'employe_confirme', 'employe'].includes(r);
const canAccessVip = r => ['directeur', 'codirecteur', 'employe_confirme'].includes(r);
const canDeleteVip = r => ['directeur', 'codirecteur'].includes(r);

const canAccessStock = r => ['directeur', 'codirecteur', 'employe_confirme', 'employe'].includes(r);
const canSeeStockCosts = r => ['directeur', 'codirecteur'].includes(r);

const canAccessRecipes = r => ['directeur', 'codirecteur'].includes(r);
const canAccessProductsManage = r => ['directeur', 'codirecteur'].includes(r);
const canReadProductsOnly = r => ['employe_confirme', 'employe', 'lecture_seule'].includes(r);

const canAccessPurchases = r => ['directeur', 'codirecteur'].includes(r);
const canAccessGestion = r => ['directeur', 'codirecteur'].includes(r);
const canAccessDirectoryManage = r => ['directeur', 'codirecteur'].includes(r);
const canAccessDirectoryRead = r => ['directeur', 'codirecteur', 'employe_confirme', 'employe'].includes(r);

const canDiscount = r => ['directeur', 'codirecteur', 'employe_confirme'].includes(r);
const canOfferCart = r => ['directeur', 'codirecteur'].includes(r);
const isReadOnlyRole = r => r === 'lecture_seule';
const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const vipDiscountByLevel = level => {
  if (level === 'Gold') return 20;
  if (level === 'Argent') return 10;
  if (level === 'Bronze') return 5;
  if (level === 'VIP') return 0;
  return 0;
};

const MENU_LEPRECHAUN_BASE_PRICE = 300;
const MENU_LEPRECHAUN_EXTRA_PRICE = 30;

function getMenuLeprechaunRecipes() {
  return (cache.recipes || [])
    .filter(r => r.active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));
}

function getMenuLeprechaunDrinks() {
  return (cache.produits || [])
    .filter(p => p.active !== false && ['BIERE', 'SOFT'].includes(String(p.category || '').toUpperCase()))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'));
}

function getMenuLeprechaunExtras() {
  return (cache.produits || []).filter(p =>
    p.active !== false &&
    ['COOKIE', "GLACE ORANGEO'TANG", 'GLACE ORANGEO TANG', 'GLACE ORANGEO'].includes(String(p.name || '').toUpperCase())
  );
}

function fillMenuLeprechaunSelects() {
  const recipeSelect = document.getElementById('menuRecipe');
  const drinkSelect = document.getElementById('menuDrink');
  const extraSelect = document.getElementById('menuExtra');

  if (recipeSelect) {
    const recipes = getMenuLeprechaunRecipes();
    recipeSelect.innerHTML = recipes.length
      ? `<option value="">Choisir une planche</option>` + recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')
      : `<option value="">Aucune recette disponible</option>`;
  }

  if (drinkSelect) {
    const drinks = getMenuLeprechaunDrinks();
    drinkSelect.innerHTML = drinks.length
      ? `<option value="">Choisir une boisson</option>` + drinks.map(d => `<option value="${d.id}">${d.name} — ${euro(d.price_bar ?? d.price ?? 0)}</option>`).join('')
      : `<option value="">Aucune boisson disponible</option>`;
  }

  if (extraSelect && !extraSelect.dataset.bound) {
    extraSelect.dataset.bound = 'true';
    extraSelect.addEventListener('change', updateMenuLeprechaunPrice);
  }

  if (recipeSelect && !recipeSelect.dataset.bound) {
    recipeSelect.dataset.bound = 'true';
    recipeSelect.addEventListener('change', updateMenuLeprechaunPrice);
  }

  if (drinkSelect && !drinkSelect.dataset.bound) {
    drinkSelect.dataset.bound = 'true';
    drinkSelect.addEventListener('change', updateMenuLeprechaunPrice);
  }

  updateMenuLeprechaunPrice();
}

function updateVipFormDetails() {
  const level = document.getElementById('vipLevel')?.value || 'VIP';
  const weeklyInput = document.getElementById('vipWeeklyPrice');
  const discountInput = document.getElementById('vipDiscountPercent');

  const config = {
    VIP: { discount_percent: 0, weekly_price: 10000 },
    Bronze: { discount_percent: 5, weekly_price: 2000 },
    Argent: { discount_percent: 10, weekly_price: 4000 },
    Gold: { discount_percent: 20, weekly_price: 6000 }
  };

  const selected = config[level] || config.VIP;

  if (weeklyInput) weeklyInput.value = euro(selected.weekly_price);
  if (discountInput) discountInput.value = `${selected.discount_percent}%`;
}

updateVipFormDetails();

function getVipConfig(level) {
  const map = {
    VIP: { discount_percent: 0, weekly_price: 10000 },
    Bronze: { discount_percent: 5, weekly_price: 2000 },
    Argent: { discount_percent: 10, weekly_price: 4000 },
    Gold: { discount_percent: 20, weekly_price: 6000 }
  };
  return map[level] || map.VIP;
}

function renderDashboardVipTables() {
  if (els.vipSubscriptionsRows) {
    const vipRows = (cache.vipClients || [])
      .slice()
      .sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')));

    els.vipSubscriptionsRows.innerHTML = vipRows.map(v => {
      const cfg = getVipConfig(v.level || 'VIP');
      const weeklyPrice = Number(v.weekly_price ?? cfg.weekly_price ?? 0);

      return `
        <tr>
          <td>${v.full_name || ''}</td>
          <td>${v.level || 'VIP'}</td>
          <td>${v.start_date || ''}</td>
          <td>${v.end_date || ''}</td>
          <td>${euro(weeklyPrice)}</td>
          <td>${v.is_active ? 'Oui' : 'Non'}</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="6">Aucun abonnement VIP</td></tr>';
  }

  if (els.dashboardVipSalesRows) {
    const vipSales = (cache.vipHistory || []).slice(0, 10);

    els.dashboardVipSalesRows.innerHTML = vipSales.map(r => `
      <tr>
        <td>${r.sale_date || ''}</td>
        <td>${r.vip_client_name || ''}</td>
        <td>${r.vip_level || r.level || ''}</td>
        <td>${r.service_type || ''}</td>
        <td>${euro(r.total_after_discount || 0)}</td>
        <td>${r.payment_method || ''}</td>
      </tr>
    `).join('') || '<tr><td colspan="6">Aucune vente VIP</td></tr>';
  }
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function updateVipFormFields() {
  const level = document.getElementById('vipLevel')?.value || 'VIP';
  const startInput = document.getElementById('vipStartDate');
  const endInput = document.getElementById('vipEndDate');
  const weeklyInput = document.getElementById('vipWeeklyPrice');
  const discountInput = document.getElementById('vipDiscountPercent');

  const cfg = getVipConfig(level);
  const startDate = startInput?.value || todayStr();
  const endDate = addDays(startDate, 7);

  if (weeklyInput) weeklyInput.value = euro(cfg.weekly_price);
  if (discountInput) discountInput.value = `${cfg.discount_percent}%`;
  if (startInput && !startInput.value) startInput.value = startDate;
  if (endInput && !endInput.value) endInput.value = endDate;
}

document.getElementById('vipLevel')?.addEventListener('change', updateVipFormFields);
document.getElementById('vipStartDate')?.addEventListener('change', () => {
  const endInput = document.getElementById('vipEndDate');
  const startDate = document.getElementById('vipStartDate')?.value || todayStr();
  if (endInput) endInput.value = addDays(startDate, 7);
  updateVipFormFields();
});

function updateVipEndDateFromStart() {
  const startInput = document.getElementById('vipStartDate');
  const endInput = document.getElementById('vipEndDate');
  if (!startInput || !endInput || !startInput.value) return;

  const start = new Date(startInput.value + 'T00:00:00');
  start.setDate(start.getDate() + 7);

  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');

  endInput.value = `${yyyy}-${mm}-${dd}`;
}

document.getElementById('vipStartDate')?.addEventListener('change', () => {
  updateVipEndDateFromStart();
  updateVipFormDetails();
});

function updateMenuPreview() {
  const recipeSelect = document.getElementById('menuRecipe');
  const drinkSelect = document.getElementById('menuDrink');
  const extraSelect = document.getElementById('menuExtra');

  const recipeText = recipeSelect?.selectedOptions[0]?.text || '-';
  const drinkText = drinkSelect?.selectedOptions[0]?.text || '-';
  const extraText = extraSelect?.value || 'Aucun supplément';

  document.getElementById('previewRecipe').textContent = recipeText;
  document.getElementById('previewDrink').textContent = drinkText;
  document.getElementById('previewExtra').textContent = extraText;

  updateMenuPrice();
}

function updateMenuPrice() {
  let base = 300;

  const extra = document.getElementById('menuExtra')?.value;

  if (extra === 'Cookie') base += 30;
  if (extra === "Glace Orangeo'Tang") base += 30;

  const totalInput = document.getElementById('menuLeprechaunTotal');
  if (totalInput) {
    totalInput.value = euro(base);
  }
}

function updateMenuLeprechaunPrice() {
  const extra = document.getElementById('menuExtra')?.value || '';
  let total = MENU_LEPRECHAUN_BASE_PRICE;

  if (extra) total += MENU_LEPRECHAUN_EXTRA_PRICE;

  const totalEl = document.getElementById('menuLeprechaunTotal');
  if (totalEl) totalEl.value = euro(total);
}

function addLeprechaunMenuToCart() {
  const recipeId = document.getElementById('menuRecipe')?.value || '';
  const drinkId = document.getElementById('menuDrink')?.value || '';
  const extraName = document.getElementById('menuExtra')?.value || '';

  if (!recipeId) return toast('Choisis une planche / recette.');
  if (!drinkId) return toast('Choisis une boisson.');

  const recipe = (cache.recipes || []).find(r => String(r.id) === String(recipeId));
  const drink = (cache.produits || []).find(p => String(p.id) === String(drinkId));

  if (!recipe) return toast('Recette introuvable.');
  if (!drink) return toast('Boisson introuvable.');

  let extraProduct = null;
  if (extraName) {
    extraProduct = getMenuLeprechaunExtras().find(
      p => String(p.name || '').toLowerCase() === String(extraName).toLowerCase()
    );
  }

  const totalPrice = MENU_LEPRECHAUN_BASE_PRICE + (extraProduct ? MENU_LEPRECHAUN_EXTRA_PRICE : 0);

  caisseCart.push({
    id: `menu-leprechaun-${Date.now()}`,
    name: 'Menu Leprechaun',
    qty: 1,
    isMenu: true,
    menuType: 'leprechaun',
    product: null,
    recipe_id: recipe.id,
    recipe_name: recipe.name,
    drink_id: drink.id,
    drink_name: drink.name,
    extra_id: extraProduct?.id || null,
    extra_name: extraProduct?.name || '',
    fixedPrice: totalPrice,
    discountPercent: 0,
    isOffered: false
  });

  const recipeSelect = document.getElementById('menuRecipe');
  const drinkSelect = document.getElementById('menuDrink');
  const extraSelect = document.getElementById('menuExtra');

  if (recipeSelect) recipeSelect.value = '';
  if (drinkSelect) drinkSelect.value = '';
  if (extraSelect) extraSelect.value = '';

  updateMenuLeprechaunPrice();
  renderCart();
  toast('Menu Leprechaun ajouté au panier.');
}
window.addLeprechaunMenuToCart = addLeprechaunMenuToCart;

function setView(name) {
  const role = currentProfile?.role;

  const denied =
    (name === 'dashboard' && !canAccessDashboard(role)) ||
    (name === 'caisse' && !canAccessCaisse(role)) ||
    (name === 'vip' && !canAccessVip(role)) ||
    (name === 'stock' && !canAccessStock(role)) ||
    (name === 'recettes' && !canAccessRecipes(role)) ||
    (name === 'produits' && !(canAccessProductsManage(role) || canReadProductsOnly(role))) ||
    (name === 'achats' && !canAccessPurchases(role)) ||
    (name === 'gestion' && !canAccessGestion(role)) ||
    (name === 'annuaire' && !canAccessDirectoryRead(role)) ||
    (name === 'profil' && false) ||
    (name === 'expenses' && !isDirectionRole(role)) ||
    (name === 'contracts' && !isDirectionRole(role));

  if (denied) {
    toast('Accès refusé.');
    return;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

  const target = document.getElementById(name + 'View');
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('#menu button[data-view]').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelector(`#menu button[data-view="${name}"]`)?.classList.add('active');

  if (name === 'gestion') {
    showGestionTab('utilisateursTab');
  }
}

function showGestionTab(tabId, btn = null) {
  document.querySelectorAll('.gestion-tab').forEach(tab => {
    tab.classList.add('hidden');
  });

  document.querySelectorAll('.gestion-tab-btn').forEach(button => {
    button.classList.remove('active');
  });

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.remove('hidden');
  }

  if (btn) {
    btn.classList.add('active');
  } else {
    const autoBtn = document.querySelector(`.gestion-tab-btn[onclick*="${tabId}"]`);
    if (autoBtn) autoBtn.classList.add('active');
  }
}

window.showGestionTab = showGestionTab;

function toast(msg) { alert(msg); }
function showLogin() {
  els.loginView.classList.remove('hidden');
  els.mustChangeView?.classList.add('hidden');
  els.appView.classList.add('hidden');
  els.menu.classList.add('hidden');
  els.sidebarUserBox.classList.add('hidden');
}
function pickServicePrice(product, service) {
  if (!product) return 0;
  return Number(product.price_bar ?? product.price ?? 0);
}
function updateSalePriceByService() {
  const productId = document.getElementById('saleProduct')?.value;
  const service = document.getElementById('saleService')?.value;
  const product = cache.produits.find(p => p.id === productId);
  if (!product || !els.salePrice) return;
  els.salePrice.value = pickServicePrice(product, service).toFixed(2);
  updateSalePreview();
}
function updateSalePreview() {
  const qty = Number(document.getElementById('saleQty')?.value || 0);
  const price = Number(document.getElementById('salePrice')?.value || 0);
  const disc = Number(document.getElementById('saleDiscount')?.value || 0);
  const before = qty * price;
  const discAmt = before * (disc / 100);
  const final = before - discAmt;
  if (els.saleBeforeDiscount) els.saleBeforeDiscount.textContent = euro(before);
  if (els.saleDiscountAmount) els.saleDiscountAmount.textContent = euro(discAmt);
  if (els.saleFinalTotal) els.saleFinalTotal.textContent = euro(final);
}
function categoryOptions(type, selected = '') {
  return cache.categories
    .filter(c => c.active !== false && c.type === type)
    .map(c => `<option value="${c.name}" ${c.name === selected ? 'selected' : ''}>${c.name}</option>`)
    .join('');
}
function convertUsageToStockBase(quantity, usageUnit, stockUnit) {
  const q = Number(quantity || 0);
  const from = String(usageUnit || '').toLowerCase();
  const to = String(stockUnit || '').toLowerCase();

  if (from === to) return q;

  if (from === 'bottle' && to === 'litre') return q * 1;
  if (from === 'bottle' && to === 'cl') return q * 100;
  if (from === 'bottle' && to === 'ml') return q * 1000;

  if (from === 'litre' && to === 'cl') return q * 100;
  if (from === 'litre' && to === 'ml') return q * 1000;
  if (from === 'cl' && to === 'litre') return q / 100;
  if (from === 'cl' && to === 'ml') return q * 10;
  if (from === 'ml' && to === 'litre') return q / 1000;
  if (from === 'ml' && to === 'cl') return q / 10;

  if (from === 'kg' && to === 'g') return q * 1000;
  if (from === 'g' && to === 'kg') return q / 1000;

  if (from === 'piece' && to === 'piece') return q;

  return q;
}
function fillCategorySelects() {
  if (els.stockCategory) els.stockCategory.innerHTML = categoryOptions('stock');
  if (els.purchaseCategory) els.purchaseCategory.innerHTML = categoryOptions('grossiste');
  if (els.productCategory) els.productCategory.innerHTML = categoryOptions('carte');
}

function defaultPriceFor(serviceType) {
  const row = cache.basePrices.find(v => v.service_type === serviceType);
  return Number(row?.default_price || 0);
}

function fillBasePricesForm() {
  const bar = defaultPriceFor('Bar').toFixed(2);
  if (els.defaultPriceBar) els.defaultPriceBar.value = bar;
}

function fillVipClientSelect() {
  const select = document.getElementById('vipSelect');
  if (!select) return;

  const today = todayStr();

  const activeVip = (cache.vipClients || []).filter(v =>
    v.is_active === true &&
    (!v.end_date || v.end_date >= today)
  );

  select.innerHTML = `
    <option value="">Aucun client VIP</option>
    ${activeVip.map(v => `
      <option value="${v.id}">
        ${v.full_name} — ${v.level || 'VIP'} (${Number(v.discount_percent || 0)}%)
      </option>
    `).join('')}
  `;
}

function formatUnit(unit) {
  const map = {
    piece: 'Pièce',
    bottle: 'Bouteille',
    litre: 'Litre',
    ml: 'ML',
    cl: 'CL',
    g: 'Grammes',
    kg: 'Kilogrammes'
  };
  return map[String(unit || '').toLowerCase()] || unit || '';
}

function getRecipeByStockItemId(stockItemId) {
  return (cache.recipes || []).find(r => String(r.stock_item_id) === String(stockItemId)) || null;
}

function updatePOSUser() {
  const el = document.getElementById('posUser');
  if (el && currentProfile) {
    el.textContent = currentProfile.full_name;
  }
}
document.getElementById('posSearch')?.addEventListener('input', (e) => {
  renderCaisseProducts(e.target.value);
});
async function deleteCategory(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;

  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) return toast(error.message);

  await refreshAll();
}
window.deleteCategory = deleteCategory;

function getSelectedVipClient() {
  const vipId = document.getElementById('vipSelect')?.value || '';
  if (!vipId) return null;
  return (cache.vipClients || []).find(v => String(v.id) === String(vipId)) || null;
}

function renderUnprofitableRecipes() {
  const box = document.getElementById('badRecipes');
  if (!box) return;

  const rows = (cache.recipes || []).filter(r => Number(r.margin_amount || 0) <= 0);

  box.innerHTML = rows.length
    ? `<ul>${rows.map(r => `<li><strong>${r.name}</strong> — marge ${euro(r.margin_amount || 0)}</li>`).join('')}</ul>`
    : '<p class="muted">Toutes les recettes sont rentables.</p>';
}

function renderVipHistory() {
  if (!els.vipHistoryRows) return;

  const q = document.getElementById('vipHistorySearch')?.value?.trim().toLowerCase() || '';
  let rows = cache.vipHistory || [];

  if (q) {
    rows = rows.filter(r =>
      `${r.vip_client_name || ''} ${r.vip_level || ''} ${r.level || ''} ${r.payment_method || ''}`
        .toLowerCase()
        .includes(q)
    );
  }

  els.vipHistoryRows.innerHTML = rows.map(r => `
    <tr>
      <td>${r.sale_date || ''}</td>
      <td>${r.vip_client_name || ''}</td>
      <td>${r.vip_level ?? r.level ?? ''}</td>
      <td>${r.service_type || ''}</td>
      <td>${euro(r.total_after_discount || 0)}</td>
      <td>${r.payment_method || ''}</td>
    </tr>
  `).join('') || '<tr><td colspan="6">Aucun historique VIP</td></tr>';
}

async function loadExpenses() {
  if (!isDirectionRole(currentProfile?.role)) {
    cache.expenses = [];
    return;
  }

  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .limit(5000);

  if (error) throw error;
  cache.expenses = data || [];
}

function renderExpenses() {
  if (!els.expensesRows) return;

  const q = document.getElementById('expSearch')?.value?.trim().toLowerCase() || '';
  let rows = cache.expenses || [];

  if (q) {
    rows = rows.filter(v =>
      `${v.title || ''} ${v.category || ''} ${v.type || ''} ${v.payment_method || ''} ${v.notes || ''}`.toLowerCase().includes(q)
    );
  }

  els.expensesRows.innerHTML = rows.map(v => `
    <tr>
      <td>${v.expense_date || ''}</td>
      <td>${v.title || ''}</td>
      <td>${v.category || ''}</td>
      <td>${v.type || ''}</td>
      <td>${euro(v.amount || 0)}</td>
      <td>${v.payment_method || ''}</td>
      <td>
        <button class="secondary" onclick="deleteExpense('${v.id}')">Supprimer</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">Aucune dépense</td></tr>';
}

async function addExpense() {
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const payload = {
    expense_date: document.getElementById('expDate')?.value || todayStr(),
    title: document.getElementById('expTitle')?.value?.trim() || '',
    category: document.getElementById('expCategory')?.value || 'Divers',
    type: document.getElementById('expType')?.value || 'charge',
    amount: Number(document.getElementById('expAmount')?.value || 0),
    payment_method: document.getElementById('expPayment')?.value?.trim() || '',
    notes: document.getElementById('expNotes')?.value?.trim() || '',
    created_by: currentProfile?.id || null
  };

  if (!payload.title) return toast('Libellé requis.');
  if (payload.amount <= 0) return toast('Montant invalide.');

  const { error } = await sb.from('expenses').insert(payload);
  if (error) return toast(error.message);

  const expDate = document.getElementById('expDate');
  const expTitle = document.getElementById('expTitle');
  const expCategory = document.getElementById('expCategory');
  const expType = document.getElementById('expType');
  const expAmount = document.getElementById('expAmount');
  const expPayment = document.getElementById('expPayment');
  const expNotes = document.getElementById('expNotes');

  if (expDate) expDate.value = todayStr();
  if (expTitle) expTitle.value = '';
  if (expCategory) expCategory.value = 'Salaire';
  if (expType) expType.value = 'charge';
  if (expAmount) expAmount.value = '';
  if (expPayment) expPayment.value = '';
  if (expNotes) expNotes.value = '';

  await refreshAll();
  toast('Dépense ajoutée.');
}
window.addExpense = addExpense;

async function deleteExpense(id) {
  if (!confirm('Supprimer cette dépense ?')) return;

  const { error } = await sb.from('expenses').delete().eq('id', id);
  if (error) return toast(error.message);

  await refreshAll();
  toast('Dépense supprimée.');
}
window.deleteExpense = deleteExpense;

document.getElementById('expSearch')?.addEventListener('input', renderExpenses);

async function notifyNewVipToDiscord(vip) {
  const { error } = await sb.functions.invoke('vip-discord-sync', {
    body: {
      event: 'new_vip',
      vip: {
        full_name: vip.full_name,
        phone: vip.phone,
        vip_level: vip.level || vip.vip_level || 'VIP'
      },
      clients: cache.vipClients || []
    }
  });

  if (error) {
    console.error('Discord new VIP notify error:', error);
  }
}

async function saveBasePricesInline() {
  const rows = [
    { service_type: 'Bar', default_price: Number(document.getElementById('inlineDefaultPriceBar')?.value || 0) },
  ];

  for (const row of rows) {
    const { error } = await sb.from('service_default_prices').upsert(row, { onConflict: 'service_type' });
    if (error) return toast(error.message);
  }

  await refreshAll();
  toast('Tarifs mis à jour.');
}
window.saveBasePricesInline = saveBasePricesInline;

document.getElementById('basePricesForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const row = {
    service_type: 'Bar',
    default_price: Number(document.getElementById('defaultPriceBar').value || 0)
  };

  const { error } = await sb.from('service_default_prices').upsert(row, { onConflict: 'service_type' });
  if (error) return toast(error.message);

  await refreshAll();
  toast('Tarif Bar enregistré.');
});

function prefillNewProductPrices() {
  const bar = document.getElementById('productPriceBar');
  if (bar && !bar.value) bar.value = defaultPriceFor('Bar').toFixed(2);
}

async function loadDeliveryZones() {
  const { data, error } = await sb.from('delivery_zones').select('*').eq('active', true).order('zone_name');
  if (error) throw error;

  deliveryZones = data || [];

  const select = document.getElementById('deliveryZone');
  if (!select) return;

  select.innerHTML = `
    <option value="">Aucune livraison</option>
    ${deliveryZones.map(z => `<option value="${z.id}">${z.zone_name} — ${euro(z.price)}</option>`).join('')}
  `;
}

function getDeliveryPrice() {
  const id = document.getElementById('deliveryZone')?.value;
  if (!id) return 0;

  const zone = deliveryZones.find(z => Number(z.id) === Number(id));
  return zone ? Number(zone.price || 0) : 0;
}
async function loadSupplierItems() {
  if (!canAccessPurchases(currentProfile?.role)) {
    cache.supplierItems = [];
    return;
  }

  const { data, error } = await sb
    .from('stock_items')
    .select('*')
    .eq('available_in_supplier', true)
    .order('name');

  if (error) throw error;
  cache.supplierItems = data || [];
}

async function loadSession() {
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();

  if (sessionError) {
    console.warn('SESSION ERROR:', sessionError.message);
    return showLogin();
  }

  const session = sessionData?.session;
  if (!session?.user) {
    return showLogin();
  }

  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    console.warn('PROFILE ERROR:', profileError?.message);
    return showLogin();
  }

  currentProfile = profile;

  if (!profile.active) {
    await sb.auth.signOut();
    toast('Compte désactivé.');
    return showLogin();
  }

  if (profile.must_change_password && els.mustChangeView) {
    els.loginView.classList.add('hidden');
    els.appView.classList.add('hidden');
    els.mustChangeView.classList.remove('hidden');
    els.menu.classList.add('hidden');
    els.sidebarUserBox.classList.add('hidden');
    return;
  }

  els.loginView.classList.add('hidden');
  els.mustChangeView?.classList.add('hidden');
  els.appView.classList.remove('hidden');
  els.menu.classList.remove('hidden');
  els.sidebarUserBox.classList.remove('hidden');

  els.whoami.innerHTML = `<strong>${profile.full_name}</strong><br><span class="muted">${profile.role} • @${profile.username}</span>`;

  document.querySelector('[data-view="dashboard"]')?.classList.toggle('hidden', !canAccessDashboard(profile.role));
  document.querySelector('[data-view="caisse"]')?.classList.toggle('hidden', !canAccessCaisse(profile.role));
  document.querySelector('[data-view="vip"]')?.classList.toggle('hidden', !canAccessVip(profile.role));
  document.querySelector('[data-view="stock"]')?.classList.toggle('hidden', !canAccessStock(profile.role));
  document.querySelector('[data-view="recettes"]')?.classList.toggle('hidden', !canAccessRecipes(profile.role));
  document.querySelector('[data-view="achats"]')?.classList.toggle('hidden', !canAccessPurchases(profile.role));
  document.querySelector('[data-view="gestion"]')?.classList.toggle('hidden', !canAccessGestion(profile.role));
  document.querySelector('[data-view="annuaire"]')?.classList.toggle('hidden', !canAccessDirectoryRead(profile.role));
  document.querySelector('[data-view="produits"]')?.classList.toggle('hidden', !(canAccessProductsManage(profile.role) || canReadProductsOnly(profile.role)));
  document.querySelector('[data-view="profil"]')?.classList.toggle('hidden', false);
  document.getElementById('productForm')?.closest('.card')?.classList.toggle('hidden', !canAccessProductsManage(profile.role));

  els.vipMenuBtn?.classList.toggle('hidden', !canAccessVip(profile.role));
  els.discountWrap?.classList.toggle('hidden', !canDiscount(profile.role));
  els.payOffert?.classList.toggle('hidden', !canOfferCart(profile.role));
  els.directoryManageWrap?.classList.toggle('hidden', !canAccessDirectoryManage(profile.role));
  els.warningManageWrap?.classList.toggle('hidden', !canAccessDirectoryManage(profile.role));
  document.getElementById('globalOffert')?.classList.toggle('hidden', !canOfferCart(profile.role));

  document.querySelectorAll('.private-col').forEach(el => {
    el.classList.toggle('hidden', !canSeeStockCosts(profile.role));
  });

  if (canAccessDashboard(profile.role)) setView('dashboard');
  else if (canAccessCaisse(profile.role)) setView('caisse');
  else if (canReadProductsOnly(profile.role) || canAccessProductsManage(profile.role)) setView('produits');
  else if (canAccessDirectoryRead(profile.role)) setView('annuaire');
  else setView('profil');

  await refreshAll();
}

async function refreshAll() {
  await Promise.allSettled([
    loadCategories(),
    loadBasePrices(),
    loadProduits(),
    loadVentes(),
    loadAchats(),
    loadUsers(),
    loadStock(),
    loadDirectory(),
    loadDeliveryZones(),
    loadVipClients(),
    loadVipHistory(),
    loadRecipes(),
    loadRecipeItems(),
    loadSupplierItems(),
    loadExpenses(),
  ]);

  fillCategorySelects();
  fillBasePricesForm();
  prefillNewProductPrices();

  renderDashboard();

  if (typeof renderDashboardPurchases === 'function') {
    renderDashboardPurchases();
  }

  renderProducts();
  renderSales();
  renderPurchases();
  renderUsers();
  renderStock();
  renderDirectory();
  renderCategories();
  renderDeliveryZones();
  renderProfile();
  renderVipClients();
  renderVipHistory();
  renderUnprofitableRecipes();
  renderSupplierProducts();
  renderSupplierCart();
  renderExpenses();

  fillRecipeCategorySelect();
  fillRecipeSelects();
  fillMenuLeprechaunSelects();
  renderRecipes();
  renderRecipeItems();

  fillVipClientSelect();
  fillDirectorySelect();
  updateSalePriceByService();
  updateSalePreview();

  renderCaisseProducts();
  renderCart();
}

async function loadCategories() {
  if (!isDirectionRole(currentProfile?.role)) { cache.categories = []; return; }
  const { data, error } = await sb.from('categories').select('*').order('type').order('name');
  if (error) throw error;
  cache.categories = data || [];
}
async function loadBasePrices() {
  if (!isDirectionRole(currentProfile?.role)) {
    cache.basePrices = [];
    return;
  }
  const { data, error } = await sb.from('service_default_prices').select('*').order('service_type');
  if (error) throw error;
  cache.basePrices = data || [];
}

async function loadProduits() {
  if (!(canAccessProductsManage(currentProfile?.role) || canReadProductsOnly(currentProfile?.role))) {
    cache.produits = [];
    return;
  }

  const { data, error } = await sb.from('products').select('*').order('name');
  if (error) throw error;
  cache.produits = data || [];

  if (els.saleProduct && canAccessCaisse(currentProfile?.role)) {
    els.saleProduct.innerHTML = cache.produits.filter(p => p.active !== false).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}
async function loadVentes() {
  if (!canAccessDashboard(currentProfile?.role)) {
    cache.ventes = [];
    return;
  }

  let q = sb.from('sales_with_users').select('*').order('sale_date', { ascending: false }).limit(5000);
  const { data, error } = await q;
  if (error) throw error;
  cache.ventes = data || [];
}
async function loadAchats() {
  if (!isDirectionRole(currentProfile?.role)) { cache.achats = []; return; }
  const { data, error } = await sb.from('purchases').select('*').order('purchase_date', { ascending: false }).limit(5000);
  if (error) throw error; cache.achats = data || [];
}
async function loadUsers() {
  if (!isDirectionRole(currentProfile?.role)) { cache.profils = []; return; }
  const { data, error } = await sb.from('profiles').select('id, full_name, username, email, role, active, must_change_password').order('full_name');
  if (error) throw error; cache.profils = data || [];
}
async function loadStock() {
  if (!canAccessStock(currentProfile?.role)) {
    cache.stock = [];
    return;
  }
  const { data, error } = await sb.from('stock_current').select('*').order('name');
  if (error) throw error;
  cache.stock = data || [];
}
async function loadDirectory() {
  if (!canAccessDirectoryRead(currentProfile?.role)) {
    cache.directory = [];
    return;
  }
  const { data, error } = await sb.from('directory_with_warnings').select('*').order('last_name');
  if (error) throw error;
  cache.directory = data || [];
}
async function loadVipClients() {
  if (!canAccessVip(currentProfile?.role)) {
    cache.vipClients = [];
    return;
  }

  try {
    const { data, error } = await sb
      .from('vip_clients')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('VIP CLIENTS ERROR =', error);
      cache.vipClients = [];
      return;
    }

    cache.vipClients = data || [];
  } catch (err) {
    console.error('LOAD VIP CLIENTS EXCEPTION =', err);
    cache.vipClients = [];
  }
}

async function loadVipHistory() {
  if (!canAccessVip(currentProfile?.role)) {
    cache.vipHistory = [];
    return;
  }

  try {
    const { data, error } = await sb
      .from('vip_sales_history')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('VIP HISTORY ERROR =', error);
      cache.vipHistory = [];
      return;
    }

    cache.vipHistory = data || [];
  } catch (err) {
    console.error('LOAD VIP HISTORY EXCEPTION =', err);
    cache.vipHistory = [];
  }
}
async function deleteSale(id) {
  if (!confirm('Supprimer cette vente ?')) return;

  const { error } = await sb.from('sales').delete().eq('id', id);
  if (error) return toast(error.message);

  await refreshAll();
}
window.deleteSale = deleteSale;

async function editDeliveryZone(id) {
  const item = deliveryZones.find(z => String(z.id) === String(id));
  if (!item) return;

  const zone_name = prompt('Zone', item.zone_name);
  if (zone_name === null) return;

  const price = prompt('Prix', item.price);
  if (price === null) return;

  const { error } = await sb.from('delivery_zones')
    .update({ zone_name: zone_name.trim(), price: Number(price || 0) })
    .eq('id', id);

  if (error) return toast(error.message);
  await refreshAll();
}
window.editDeliveryZone = editDeliveryZone;

async function toggleDeliveryZone(id, active) {
  const { error } = await sb.from('delivery_zones')
    .update({ active })
    .eq('id', id);

  if (error) return toast(error.message);
  await refreshAll();
}
window.toggleDeliveryZone = toggleDeliveryZone;

function parseSaleDate(value) {
  return new Date(`${value}T12:00:00`);
}
function startOfIsoWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function isSameWeek(a, b) {
  return startOfIsoWeek(a).getTime() === startOfIsoWeek(b).getTime();
}
function weekLabel(startDate) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  return `${fmt(startDate)} → ${fmt(end)}`;
}
function monthLabel(d) {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
function percentChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}
function changeBadge(value) {
  if (value === null || Number.isNaN(value)) return '<span class="muted">—</span>';
  const sign = value >= 0 ? '+' : '';
  const cls = value >= 0 ? 'ok' : 'low';
  return `<span class="tag ${cls}">${sign}${value.toFixed(1).replace('.', ',')}%</span>`;
}
function renderHistoryCards(sales, now) {
  if (els.weeklyHistory) {
    const weeks = [];
    for (let i = 0; i < 5; i++) {
      const ref = new Date(now);
      ref.setDate(ref.getDate() - (i * 7));
      const start = startOfIsoWeek(ref);
      const total = sales
        .filter(s => isSameWeek(parseSaleDate(s.sale_date), ref))
        .reduce((sum, s) => sum + Number(s.total_after_discount || s.total_amount || 0), 0);
      weeks.push({ start, total });
    }
    els.weeklyHistory.innerHTML = `<table><thead><tr><th>Semaine</th><th>CA</th><th>Évolution</th></tr></thead><tbody>${
      weeks.map((w, idx) => {
        const prev = weeks[idx + 1]?.total ?? null;
        return `<tr><td>${weekLabel(w.start)}</td><td>${euro(w.total)}</td><td>${changeBadge(percentChange(w.total, prev))}</td></tr>`;
      }).join('')
    }</tbody></table>`;
  }

  if (els.monthlyHistory) {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(ref);
      const total = sales
        .filter(s => String(s.sale_date).startsWith(key))
        .reduce((sum, s) => sum + Number(s.total_after_discount || s.total_amount || 0), 0);
      months.push({ ref, total });
    }
    els.monthlyHistory.innerHTML = `<table><thead><tr><th>Mois</th><th>CA</th><th>Évolution</th></tr></thead><tbody>${
      months.map((m, idx) => {
        const prev = months[idx + 1]?.total ?? null;
        return `<tr><td>${monthLabel(m.ref)}</td><td>${euro(m.total)}</td><td>${changeBadge(percentChange(m.total, prev))}</td></tr>`;
      }).join('')
    }</tbody></table>`;
  }
}

function renderDashboard() {
  if (!canAccessDashboard(currentProfile?.role)) return;
  if (!els.caJour) return;

  const now = new Date();
  const today = todayStr();
  const month = monthKey(now);

  const sales = cache.ventes || [];
  const purchases = cache.achats || [];
  const expenses = cache.expenses || [];
  const vipClients = cache.vipClients || [];
  const vipHistory = cache.vipHistory || [];

  const isSaleCountedInCA = (sale) => {
    if (sale.payment_method === 'company') {
      return sale.payment_status === 'paye';
    }
    return true;
  };

  const countedSales = sales.filter(isSaleCountedInCA);

  const day = countedSales
    .filter(s => s.sale_date === today)
    .reduce((a, b) => a + Number(b.total_after_discount || b.total_amount || 0), 0);

  const week = countedSales
    .filter(s => isSameWeek(parseSaleDate(s.sale_date), now))
    .reduce((a, b) => a + Number(b.total_after_discount || b.total_amount || 0), 0);

  const monthv = countedSales
    .filter(s => String(s.sale_date).startsWith(month))
    .reduce((a, b) => a + Number(b.total_after_discount || b.total_amount || 0), 0);

  const card = countedSales
    .filter(s => String(s.sale_date).startsWith(month) && s.payment_method === 'Carte')
    .reduce((a, b) => a + Number(b.total_after_discount || b.total_amount || 0), 0);

  const off = countedSales
    .filter(s => String(s.sale_date).startsWith(month) && s.payment_method === 'Offert')
    .reduce((a, b) => a + Number(b.total_after_discount || b.total_amount || 0), 0);

  const coutMatiere = countedSales
    .filter(s => String(s.sale_date).startsWith(month))
    .reduce((sum, sale) => {
      const product = cache.produits.find(p => p.name === sale.product_name);
      const cost = Number(product?.cost_price || 0) * Number(sale.quantity || 0);
      return sum + cost;
    }, 0);

  const marge = countedSales
    .filter(s => String(s.sale_date).startsWith(month))
    .reduce((sum, sale) => {
      const product = cache.produits.find(p => p.name === sale.product_name);
      const cost = Number(product?.cost_price || 0) * Number(sale.quantity || 0);
      const revenue = Number(sale.total_after_discount || sale.total_amount || 0);
      return sum + (revenue - cost);
    }, 0);

  const achatsMois = purchases
    .filter(a => String(a.purchase_date || '').startsWith(month))
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const depensesMois = expenses
    .filter(e => String(e.expense_date || '').startsWith(month))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const vipSubscriptions = vipClients
    .filter(v => String(v.start_date || '').startsWith(month))
    .reduce((sum, v) => {
      const cfg = getVipConfig(v.level || 'VIP');
      return sum + Number(v.weekly_price ?? cfg.weekly_price ?? 0);
    }, 0);

  const vipSalesMois = vipHistory
    .filter(v => String(v.sale_date || '').startsWith(month))
    .reduce((sum, v) => sum + Number(v.total_after_discount || 0), 0);

  const beneficeReel = monthv + vipSubscriptions - achatsMois - depensesMois;

  animateValue(els.caJour, day);
  animateValue(els.caSemaine, week);
  animateValue(els.caMois, monthv);
  animateValue(els.caCarte, card);
  animateValue(els.caOffert, off);
  animateValue(els.margeEstimee, marge);

  if (els.grossisteMois) animateValue(els.grossisteMois, achatsMois);
  if (els.depensesMois) animateValue(els.depensesMois, depensesMois);
  if (els.coutMatiereMois) animateValue(els.coutMatiereMois, coutMatiere);
  if (els.beneficeReelMois) animateValue(els.beneficeReelMois, beneficeReel);
  if (els.vipSubscriptionsMois) animateValue(els.vipSubscriptionsMois, vipSubscriptions);
  if (els.vipSalesMois) animateValue(els.vipSalesMois, vipSalesMois);

  if (els.beneficeReelMois) {
    const cardEl = els.beneficeReelMois.closest('.stat-card');
    if (cardEl) {
      cardEl.classList.remove('positive', 'negative');
      if (beneficeReel >= 0) cardEl.classList.add('positive');
      else cardEl.classList.add('negative');
    }
  }

  if (els.margeEstimee) {
    const cardEl = els.margeEstimee.closest('.stat-card');
    if (cardEl) {
      cardEl.classList.remove('positive', 'negative');
      if (marge >= 0) cardEl.classList.add('positive');
      else cardEl.classList.add('negative');
    }
  }

  if (els.depensesMois) {
    const cardEl = els.depensesMois.closest('.stat-card');
    if (cardEl) {
      cardEl.classList.add('warning');
    }
  }

  const prod = {};
  const emp = {};
  const profitByProduct = {};

  countedSales.forEach(v => {
    const revenue = Number(v.total_after_discount || v.total_amount || 0);

    prod[v.product_name] = (prod[v.product_name] || 0) + revenue;
    emp[v.full_name] = (emp[v.full_name] || 0) + revenue;

    const product = cache.produits.find(p => p.name === v.product_name);
    const cost = Number(product?.cost_price || 0) * Number(v.quantity || 0);
    const profit = revenue - cost;

    profitByProduct[v.product_name] = (profitByProduct[v.product_name] || 0) + profit;
  });

  if (els.topProductsProfit) {
    const merged = Object.keys(prod)
      .map(name => ({
        name,
        revenue: Number(prod[name] || 0),
        profit: Number(profitByProduct[name] || 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    els.topProductsProfit.innerHTML = merged.length
      ? `<ol>${merged.map(item => `
          <li>
            <strong>${item.name}</strong><br>
            <span class="muted">CA : ${euro(item.revenue)} • Rentabilité : ${euro(item.profit)}</span>
          </li>
        `).join('')}</ol>`
      : '<p class="muted">Aucune donnée.</p>';
  }

  if (els.topEmployees) {
    els.topEmployees.innerHTML = Object.keys(emp).length
      ? `<ol>${Object.entries(emp)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([n, v]) => `<li><strong>${n}</strong> — ${euro(v)}</li>`)
          .join('')}</ol>`
      : '<p class="muted">Aucune vente.</p>';
  }

  const badRecipesBox = document.getElementById('badRecipes');
  if (badRecipesBox) {
    const badRecipes = (cache.recipes || []).filter(r => Number(r.margin_amount || 0) <= 0);

    badRecipesBox.innerHTML = badRecipes.length
      ? `<ul>${badRecipes
          .slice(0, 5)
          .map(r => `<li><strong>${r.name}</strong> — marge ${euro(r.margin_amount || 0)}</li>`)
          .join('')}</ul>`
      : '<p class="muted">Toutes les recettes sont rentables.</p>';
  }

  renderDashboardVipTables();
  renderHistoryCards(countedSales, now);
}

function renderSales() {
  if (!els.salesRows) return;

  const q = document.getElementById('salesSearch')?.value?.trim().toLowerCase() || '';

  const parseSaleTime = (sale) => {
    const raw =
      sale?.created_at ||
      sale?.inserted_at ||
      sale?.sold_at ||
      sale?.sale_date ||
      sale?.date ||
      null;

    if (!raw) return 0;

    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  let rows = [...(cache.ventes || [])]
    .sort((a, b) => {
      const diff = parseSaleTime(b) - parseSaleTime(a);
      if (diff !== 0) return diff;

      const idA = String(a?.id || '');
      const idB = String(b?.id || '');
      return idB.localeCompare(idA);
    });

  if (q) {
    rows = rows.filter(v =>
      `${v.product_name || v.linked_product_name || ''} ${v.full_name || ''} ${v.payment_method || ''} ${v.vip_client_name || ''} ${v.menu_recipe_name || ''} ${v.menu_drink_name || ''} ${v.menu_extra_name || ''}`
        .toLowerCase()
        .includes(q)
    );
  }

  const canManage = isDirectionRole(currentProfile?.role);

  els.salesRows.innerHTML = rows.map(v => {
    const displayProductName = v.product_name || v.linked_product_name || '';
    const isMenu = v.sale_kind === 'menu' || String(displayProductName || '').toLowerCase() === 'menu leprechaun';

    const beforeDiscount = Number(v.total_before_discount || v.total_amount || 0);
    const afterDiscount = Number(v.total_after_discount || v.total_amount || 0);
    const discountAmount = Math.max(0, beforeDiscount - afterDiscount);
    const displayDiscountPercent = beforeDiscount > 0
      ? Math.round((discountAmount / beforeDiscount) * 100)
      : 0;

    const produitHtml = isMenu
      ? `
        <div class="sale-product sale-product--menu">
          <div class="sale-product__title">${displayProductName || 'Menu Leprechaun'}</div>
          <div class="sale-product__line">🍽️ Planche : ${v.menu_recipe_name || '-'}</div>
          <div class="sale-product__line">🥤 Boisson : ${v.menu_drink_name || '-'}</div>
          <div class="sale-product__line">🍰 Dessert : ${v.menu_extra_name || 'Aucun'}</div>
          ${v.vip_client_name ? `<div class="sale-product__line sale-product__line--vip">⭐ VIP : ${v.vip_client_name}</div>` : ''}
        </div>
      `
      : `
        <div class="sale-product">
          <div class="sale-product__title">${displayProductName || ''}</div>
          ${v.vip_client_name ? `<div class="sale-product__line sale-product__line--vip">⭐ VIP : ${v.vip_client_name}</div>` : ''}
        </div>
      `;

    const remiseHtml = `
      <div class="sale-remise">
        <span class="discount-badge">${displayDiscountPercent}%</span>
        ${(discountAmount > 0 || beforeDiscount !== afterDiscount)
          ? `<small>-${euro(discountAmount)}</small>`
          : ''}
        ${v.contest_reward_label
          ? `<small class="sale-contest-reward">${v.contest_reward_label}</small>`
          : ''}
        ${v.contest_reward_code
          ? `<small class="sale-contest-code">Code : ${v.contest_reward_code}</small>`
          : ''}
      </div>
    `;

    return `
      <tr>
        <td>${v.sale_date || ''}</td>
        <td>${v.full_name || ''}</td>
        <td>${produitHtml}</td>
        <td>${v.quantity || 0}</td>
        <td>${remiseHtml}</td>
        <td>${euro(afterDiscount)}</td>
        <td>
          ${
            v.payment_method === 'company'
              ? 'Contrat entreprise'
              : (v.payment_method || '')
          }
          ${
            v.payment_method === 'company'
              ? `<div class="company-payment-status ${v.payment_status === 'paye' ? 'paid' : 'pending'}">
                  ${v.payment_status === 'paye' ? '✅ Payé' : '⏳ Non payé'}
                </div>`
              : ''
          }
        </td>
        <td>
          ${
            canManage
              ? `<button class="action-btn danger" onclick="deleteSale('${v.id}')">Supprimer</button>`
              : ''
          }
        </td>
      </tr>
    `;
  }).join('');
}

function renderPurchases() {
  if (!els.purchaseRows) return;

  els.purchaseRows.innerHTML = (cache.achats || []).map(v => `
    <tr>
      <td>${v.purchase_date || ''}</td>
      <td>${v.item_name || ''}</td>
      <td>${v.category || ''}</td>
      <td>${Number(v.quantity || 0).toFixed(2)}</td>
      <td>${v.unit || ''}</td>
      <td>${euro(v.unit_cost || 0)}</td>
      <td>${euro(v.amount || 0)}</td>
      <td>${v.add_to_menu ? 'Grossiste + Carte' : 'Grossiste'}</td>
    </tr>
  `).join('') || '<tr><td colspan="8">Aucun achat</td></tr>';
}
function renderProducts() {
  if (!els.productRows) return;

  const canManage = canAccessProductsManage(currentProfile?.role);

  els.productRows.innerHTML = cache.produits.map(v => {
    const stockItem = cache.stock.find(s => String(s.id) === String(v.stock_item_id));
    const low = stockItem && Number(stockItem.current_qty || 0) <= Number(stockItem.low_threshold || 0);

    return `
      <tr>
        <td>${v.name}${low ? ` <span class="tag low">Stock bas</span>` : ''}</td>
        <td>${euro(v.price_bar ?? v.price ?? 0)}</td>
        <td>${euro(v.cost_price ?? 0)}</td>
        <td>${v.category}</td>
        <td>${v.active === false ? 'Non' : 'Oui'}</td>
        ${canManage ? `
          <td>
            <button class="secondary" onclick="editProduct('${v.id}')">Modifier</button>
            <button class="secondary" onclick="deleteProduct('${v.id}')">Supprimer</button>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('') || `<tr><td colspan="${canManage ? 6 : 5}">Aucun produit</td></tr>`;
}
function renderUsers() {
  if (!els.userRows || !isDirectionRole(currentProfile?.role)) return;
  els.userRows.innerHTML = cache.profils.map(u => `<tr><td>${u.full_name}</td><td>@${u.username}</td><td>${u.email || ''}</td><td>${u.role}</td><td>${u.active ? 'Oui' : 'Non'}</td><td><button onclick="editUser('${u.id}')" class="secondary">Modifier</button> <button onclick="toggleUserActive('${u.id}', ${u.active ? 'false':'true'})" class="secondary">${u.active ? 'Désactiver':'Réactiver'}</button> <button onclick="resetTmpPassword('${u.id}')" class="secondary">MDP provisoire</button></td></tr>`).join('') || '<tr><td colspan="6">Aucun utilisateur</td></tr>';
}

function resolveItemCategory(item) {
  if (!item) return 'Sans catégorie';

  const raw = String(item.category || '').trim();
  if (raw) return raw;

  if (item.product_id) {
    const linkedProduct = (cache.produits || []).find(p => String(p.id) === String(item.product_id));
    const productCategory = String(linkedProduct?.category || '').trim();
    if (productCategory) return productCategory;
  }

  const recipe = getRecipeByStockItemId(item.id);
  const recipeCategory = String(recipe?.category || '').trim();
  if (recipeCategory) return recipeCategory;

  return 'Sans catégorie';
}

async function adjustStockQty(id) {
  const item = (cache.stock || []).find(v => String(v.id) === String(id));

  if (!item) {
    console.error('Stock item introuvable pour ajustement :', id, cache.stock);
    return toast('Article de stock introuvable.');
  }

  const raw = prompt(
    `Ajuster le stock de "${item.name}"\n\nEntre une quantité positive pour ajouter\nou négative pour retirer.\n\nExemples : 5 ou -2`,
    '0'
  );

  if (raw === null) return;

  const qty = Number(String(raw).replace(',', '.'));

  if (!Number.isFinite(qty) || qty === 0) {
    return toast('Quantité invalide.');
  }

  const payload = {
    stock_item_id: item.id,
    movement_date: todayStr(),
    movement_type: qty > 0 ? 'entry' : 'exit',
    quantity: Math.abs(qty),
    reason: `Ajustement manuel stock: ${item.name}`,
    created_by: currentProfile?.id || null
  };

  console.log('AJUSTEMENT STOCK PAYLOAD =', payload);

  const { error } = await sb.from('stock_movements').insert(payload);

  if (error) {
    console.error('ERREUR AJUSTEMENT STOCK =', error);
    return toast(error.message || 'Erreur lors de l’ajustement du stock.');
  }

  await loadStock();
  renderStock();
  renderSupplierProducts();
  toast('Stock ajusté ✅');
}
window.adjustStockQty = adjustStockQty;

function renderStock() {
  if (!els.stockRows) return;

  const q = document.getElementById('stockSearch')?.value?.trim().toLowerCase() || '';
  let rows = cache.stock || [];

  rows = rows.map(v => ({
    ...v,
    _resolvedCategory: resolveItemCategory(v)
  }));

  if (q) {
    rows = rows.filter(v =>
      `${v.name || ''} ${v.unit || ''} ${v._resolvedCategory || ''}`.toLowerCase().includes(q)
    );
  }

  const canManage = isDirectionRole(currentProfile?.role);
  const showCost = canSeeStockCosts(currentProfile?.role);

  const grouped = rows.reduce((acc, item) => {
    const category = item._resolvedCategory || 'Sans catégorie';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'fr'));

  let html = '';

  categories.forEach(category => {
    html += `
      <tr class="stock-category">
        <td colspan="${showCost ? 8 : 7}">${category}</td>
      </tr>
    `;

    html += grouped[category].map(v => `
      <tr>
        <td>${v.name}</td>
        <td>${v._resolvedCategory || ''}</td>
        <td>${formatUnit(v.unit)}</td>
        ${showCost ? `<td class="private-col">${euro(v.unit_cost || 0)}</td>` : ''}
        <td>${Number(v.current_qty || 0).toFixed(2)}</td>
        <td>${Number(v.low_threshold || 0).toFixed(2)}</td>
        <td>${Number(v.current_qty || 0) <= Number(v.low_threshold || 0)
          ? '<span class="tag low">Stock bas</span>'
          : '<span class="tag ok">OK</span>'}</td>
        ${canManage
          ? `<td class="stock-actions-cell"><div class="stock-actions-wrap"><button type="button" class="secondary stock-btn stock-btn-edit" onclick="editStockItem('${v.id}')">Modifier</button><button type="button" class="secondary stock-btn stock-btn-adjust" onclick="adjustStockQty('${v.id}')">Ajuster quantité</button><button type="button" class="secondary stock-btn stock-btn-delete" onclick="deleteStockItem('${v.id}')">Supprimer</button></div></td>`
          : ''}
      </tr>
    `).join('');
  });

  els.stockRows.innerHTML = html || `<tr><td colspan="${showCost ? 8 : 7}">Aucun stock</td></tr>`;
}

function renderDirectory() {
  if (!els.directoryRows) return;
  const q = document.getElementById('directorySearch')?.value?.trim().toLowerCase() || '';
  let rows = cache.directory; if (q) rows = rows.filter(v => `${v.last_name} ${v.first_name} ${v.phone}`.toLowerCase().includes(q));
  const canManage = isDirectionRole(currentProfile?.role);
  els.directoryRows.innerHTML = rows.map(v => `<tr><td>${v.last_name}</td><td>${v.first_name}</td><td>${v.phone}</td><td class="${isDirectionRole(currentProfile?.role) ? '' : 'hidden'}">${Number(v.warning_count || 0)}</td><td class="${isDirectionRole(currentProfile?.role) ? '' : 'hidden'}">${v.last_warning_note || ''}</td>${canManage ? `<td><button class="secondary" onclick="editDirectory('${v.id}')">Modifier</button> <button class="secondary" onclick="deleteDirectory('${v.id}')">Supprimer</button></td>`:''}</tr>`).join('') || `<tr><td colspan="${canManage ? (isDirectionRole(currentProfile?.role) ? 6 : 4) : (isDirectionRole(currentProfile?.role) ? 5 : 3)}">Aucun contact</td></tr>`;
}
function renderCategories() {
  if (!els.categoryRows) return;

  els.categoryRows.innerHTML = cache.categories.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.type}</td>
      <td>${c.active === false ? 'Non' : 'Oui'}</td>
      <td>
        <button class="secondary" onclick="editCategory('${c.id}')">Modifier</button>
        <button class="secondary" onclick="deleteCategory('${c.id}')">Supprimer</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4">Aucune catégorie</td></tr>';
}

function renderDeliveryZones() {
  if (!els.deliveryRows) return;

  const canManage = isDirectionRole(currentProfile?.role);

  els.deliveryRows.innerHTML = deliveryZones.map(z => `
    <tr>
      <td>
        ${canManage
          ? `<input id="zone_name_${z.id}" value="${z.zone_name}" />`
          : z.zone_name}
      </td>
      <td>
        ${canManage
          ? `<input id="zone_price_${z.id}" type="number" min="0" step="0.01" value="${Number(z.price || 0).toFixed(2)}" />`
          : euro(z.price)}
      </td>
      <td>${z.active === false ? 'Non' : 'Oui'}</td>
      <td>
        ${canManage ? `
          <button class="secondary" onclick="saveDeliveryZoneInline('${z.id}')">Enregistrer</button>
          <button class="secondary" onclick="toggleDeliveryZone('${z.id}', ${z.active === false ? 'true' : 'false'})">
            ${z.active === false ? 'Réactiver' : 'Désactiver'}
          </button>
        ` : ''}
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4">Aucune zone</td></tr>`;
}

function renderVipClients() {
  if (!els.vipRows) return;

  if (!canAccessVip(currentProfile?.role)) {
    els.vipRows.innerHTML = '<tr><td colspan="9">Accès refusé</td></tr>';
    return;
  }

  const q = document.getElementById('vipSearch')?.value?.trim().toLowerCase() || '';
  let rows = cache.vipClients || [];

  if (q) {
    rows = rows.filter(v =>
      `${v.full_name || ''} ${v.phone || ''} ${v.level || ''}`.toLowerCase().includes(q)
    );
  }

  els.vipRows.innerHTML = rows.map(v => {
    const cfg = getVipConfig(v.level || 'VIP');
    const weeklyPrice = Number(v.weekly_price ?? cfg.weekly_price ?? 0);
    const discountPercent = Number(v.discount_percent ?? cfg.discount_percent ?? 0);
    const startDate = v.start_date || '';
    const endDate = v.end_date || '';

    return `
      <tr>
        <td>${v.full_name || ''}</td>
        <td>${v.phone || '/'}</td>
        <td>
          <span class="vip-badge vip-${String(v.level || 'vip').toLowerCase()}">
            ${v.level || 'VIP'}
          </span>
        </td>
        <td>${discountPercent}%</td>
        <td>${euro(weeklyPrice)}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${v.is_active ? 'Oui' : 'Non'}</td>
        <td>
          <button class="secondary" onclick="editVipClient('${v.id}')">Modifier</button>
          ${canDeleteVip(currentProfile?.role)
            ? `<button class="secondary" onclick="toggleVipClient('${v.id}', ${v.is_active ? 'false' : 'true'})">
                ${v.is_active ? 'Désactiver' : 'Réactiver'}
              </button>`
            : ''}
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="9">Aucun client VIP</td></tr>';
}

function animateValue(el, value) {
  if (!el) return;

  let start = 0;
  const duration = 600;
  const step = value / (duration / 16);

  function update() {
    start += step;

    if (start >= value) {
      el.textContent = euro(value);
      return;
    }

    el.textContent = euro(start);
    requestAnimationFrame(update);
  }

  update();
}

function renderSupplierProducts() {
  const container = document.getElementById('supplierProducts');
  if (!container) return;

  const items = (cache.supplierItems || [])
    .filter(i => i.active !== false)
    .map(i => ({
      ...i,
      _resolvedCategory: resolveItemCategory(i)
    }));

  const grouped = items.reduce((acc, item) => {
    const category = item._resolvedCategory || 'Sans catégorie';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'fr'));

  container.innerHTML = categories.map(category => `
    <div class="caisse-category-block">
      <h4 class="caisse-category-title">${category}</h4>
      <div class="caisse-products-grid">
        ${grouped[category].map(item => `
          <div class="caisse-product supplier-product-card" onclick="addToSupplierCart('${item.id}')">
            <div class="supplier-product-name">${item.name}</div>
            <div class="supplier-product-price">${euro(item.unit_cost || 0)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function addToSupplierCart(stockItemId) {
  const item = (cache.supplierItems || []).find(i => String(i.id) === String(stockItemId));
  if (!item) return;

  const existing = supplierCart.find(i => String(i.id) === String(stockItemId));

  if (existing) {
    existing.qty += 1;
  } else {
    supplierCart.push({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unit_cost: Number(item.unit_cost || 0),
      qty: 1,
      available_in_menu: item.available_in_menu,
      product_id: item.product_id || null
    });
  }

  renderSupplierCart();
}
window.addToSupplierCart = addToSupplierCart;

function changeSupplierQty(stockItemId, delta) {
  const item = supplierCart.find(i => String(i.id) === String(stockItemId));
  if (!item) return;

  item.qty = Math.max(1, Number(item.qty || 0) + Number(delta || 0));
  renderSupplierCart();
}
window.changeSupplierQty = changeSupplierQty;

function removeFromSupplierCart(stockItemId) {
  supplierCart = supplierCart.filter(i => String(i.id) !== String(stockItemId));
  renderSupplierCart();
}
window.removeFromSupplierCart = removeFromSupplierCart;

function renderSupplierCart() {
  const container = document.getElementById('supplierCartItems');
  const totalEl = document.getElementById('supplierCartTotal');
  const countEl = document.getElementById('supplierCartCount');
  const countBottom = document.getElementById('supplierCartCountBottom');

  if (!container || !totalEl) return;

  if (!supplierCart.length) {
    container.innerHTML = `<div class="caisse-cart-empty">Panier vide</div>`;
    totalEl.textContent = euro(0);
    if (countEl) countEl.textContent = '0 article';
    if (countBottom) countBottom.textContent = 'Validation rapide des achats';
    return;
  }

  let total = 0;
  let count = 0;

  container.innerHTML = supplierCart.map(item => {
    const lineTotal = Number(item.qty || 0) * Number(item.unit_cost || 0);
    total += lineTotal;
    count += Number(item.qty || 0);

    return `
      <div class="caisse-cart-item">
        <div class="caisse-cart-main">
          <div class="caisse-cart-name">${item.name}</div>
          <div class="caisse-cart-meta">${item.unit} • ${euro(item.unit_cost)} / unité</div>
        </div>
        <div class="caisse-cart-right">
          <div class="caisse-line-total">${euro(lineTotal)}</div>
          <div class="caisse-qty-controls">
            <button class="caisse-qty-btn" onclick="changeSupplierQty('${item.id}', -1)">−</button>
            <input class="caisse-qty-input" type="number" min="1" step="1" value="${item.qty}" onblur="setSupplierQty('${item.id}', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}" />
            <button class="caisse-qty-btn" onclick="changeSupplierQty('${item.id}', 1)">+</button>
            <button class="caisse-remove-btn" onclick="removeFromSupplierCart('${item.id}')">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = euro(total);
  if (countEl) countEl.textContent = `${count} article${count > 1 ? 's' : ''}`;
  if (countBottom) countBottom.textContent = `${count} article${count > 1 ? 's' : ''} dans le panier`;
}

async function addCategory() {
  const raw = document.getElementById('categoryName')?.value || "";
  const typeChecks = [...document.querySelectorAll('.categoryTypeCheck:checked')].map(el => el.value);

  if (!raw.trim()) return alert("Nom requis");
  if (!typeChecks.length) return alert("Sélectionne au moins un type");

  const names = raw
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
    .map(n => n.toUpperCase());

  const uniqueNames = [...new Set(names)];

  const rows = [];
  for (const name of uniqueNames) {
    for (const type of typeChecks) {
      rows.push({
        name,
        type,
        active: true
      });
    }
  }

  const { error } = await sb.from('categories').insert(rows);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  document.getElementById('categoryName').value = "";
  document.querySelectorAll('.categoryTypeCheck').forEach(el => {
    el.checked = el.value === 'carte';
  });

  await loadCategories();
  renderCategories();
  fillCategorySelects();

  alert(`${rows.length} catégorie(s) ajoutée(s) ✅`);
}
window.addCategory = addCategory;
document.getElementById('validateSupplierCart')?.addEventListener('click', validateSupplierCart);
async function validateSupplierCart() {
  if (!supplierCart.length) return toast('Panier vide');

  for (const item of supplierCart) {
    const amount = Number(item.qty || 0) * Number(item.unit_cost || 0);

    const { error: purchaseError } = await sb.from('purchases').insert({
      purchase_date: todayStr(),
      item_name: item.name,
      category: item.category,
      quantity: item.qty,
      unit: item.unit,
      unit_cost: item.unit_cost,
      amount,
      add_to_menu: item.available_in_menu || false,
      stock_item_id: item.id,
      product_id: item.product_id || null,
      created_by: currentProfile.id
    });

    if (purchaseError) return toast(purchaseError.message);

    const { error: moveError } = await sb.from('stock_movements').insert({
      stock_item_id: item.id,
      movement_date: todayStr(),
      movement_type: 'entry',
      quantity: item.qty,
      reason: `Achat grossiste: ${item.name}`,
      created_by: currentProfile.id
    });

    if (moveError) return toast(moveError.message);
  }

  supplierCart = [];
  await refreshAll();
  toast('Achat grossiste enregistré.');
}
async function produceRecipe(recipeId) {
  const recipe = cache.recipes.find(r => String(r.id) === String(recipeId));
  if (!recipe) return;

  const qty = Number(prompt('Quantité à fabriquer ?', '1'));
  if (!Number.isFinite(qty) || qty <= 0) return;

  const { data: items, error } = await sb.from('recipe_items').select('*').eq('recipe_id', recipeId);
  if (error) return toast(error.message);

  for (const item of (items || [])) {
    const needed = Number(item.quantity || 0) * qty;

    const { error: moveError } = await sb.from('stock_movements').insert({
      stock_item_id: item.stock_item_id,
      movement_date: todayStr(),
      movement_type: 'exit',
      quantity: needed,
      reason: `Fabrication recette: ${recipe.name}`,
      created_by: currentProfile.id
    });

    if (moveError) return toast(moveError.message);
  }

  if (recipe.stock_item_id) {
    const { error: entryError } = await sb.from('stock_movements').insert({
      stock_item_id: recipe.stock_item_id,
      movement_date: todayStr(),
      movement_type: 'entry',
      quantity: qty,
      reason: `Fabrication terminée: ${recipe.name}`,
      created_by: currentProfile.id
    });

    if (entryError) return toast(entryError.message);
  }

  await refreshAll();
  toast('Recette fabriquée et stock mis à jour.');
}
window.produceRecipe = produceRecipe;
async function consumeSimpleProductStock(productId, soldQty) {
  const product = cache.produits.find(p => String(p.id) === String(productId));
  if (!product?.stock_item_id) return;

  const { error } = await sb.from('stock_movements').insert({
    stock_item_id: product.stock_item_id,
    movement_date: todayStr(),
    movement_type: 'exit',
    quantity: Number(soldQty || 0),
    reason: `Vente produit: ${product.name}`,
    created_by: currentProfile.id
  });

  if (error) console.error(error);
}
async function saveDeliveryZoneInline(id) {
  const zone_name = document.getElementById(`zone_name_${id}`)?.value?.trim() || '';
  const price = Number(document.getElementById(`zone_price_${id}`)?.value || 0);

  if (!zone_name) return toast('Nom de zone obligatoire.');

  const { error } = await sb.from('delivery_zones')
    .update({ zone_name, price })
    .eq('id', id);

  if (error) return toast(error.message);

  await refreshAll();
  toast('Zone mise à jour.');
}
window.saveDeliveryZoneInline = saveDeliveryZoneInline;

async function editVipClient(id) {
  if (!canAccessVip(currentProfile?.role)) return toast('Accès refusé.');

  const item = (cache.vipClients || []).find(v => String(v.id) === String(id));
  if (!item) return;

  const full_name = prompt('Nom complet', item.full_name || '');
  if (full_name === null) return;

  const phone = prompt('Téléphone', item.phone || '');
  if (phone === null) return;

  const level = prompt('Niveau VIP (VIP, Bronze, Argent, Gold)', item.level || 'VIP');
  if (level === null) return;

  const normalizedLevel = String(level).trim();
  const cfg = getVipConfig(normalizedLevel);

  if (!cfg) return toast('Niveau invalide.');

  const start_date = prompt('Date début (YYYY-MM-DD)', item.start_date || todayStr());
  if (start_date === null) return;

  const end_date = prompt('Date fin (YYYY-MM-DD)', item.end_date || addDays(start_date, 7));
  if (end_date === null) return;

  const { error } = await sb
    .from('vip_clients')
    .update({
      full_name: full_name.trim(),
      phone: phone.trim(),
      level: normalizedLevel,
      discount_percent: cfg.discount_percent,
      weekly_price: cfg.weekly_price,
      start_date,
      end_date
    })
    .eq('id', id);

  if (error) return toast(error.message);

  await refreshAll();
  await syncVipToDiscord();
  toast('VIP mis à jour ✅');
}

async function toggleVipClient(id, is_active) {
  if (!canDeleteVip(currentProfile?.role)) return toast('Suppression réservée à la direction.');

  const { error } = await sb
    .from('vip_clients')
    .update({ is_active })
    .eq('id', id);

  if (error) return toast(error.message);

  await refreshAll();
  await syncVipToDiscord();
  toast('Statut VIP mis à jour ✅');
}
window.toggleVipClient = toggleVipClient;

async function syncVipToDiscord() {
  try {
    const payload = {
      event: 'vip_list_update',
      clients: (cache.vipClients || []).map(v => ({
        full_name: v.full_name || '',
        phone: v.phone || '',
        level: v.level || 'VIP',
        discount_percent: Number(v.discount_percent || 0),
        weekly_price: Number(v.weekly_price || 0),
        start_date: v.start_date || '',
        end_date: v.end_date || '',
        is_active: v.is_active === true
      }))
    };

    const { data, error } = await sb.functions.invoke('vip-discord-sync', {
      body: payload
    });

    console.log('VIP DISCORD DATA =', data);
    console.log('VIP DISCORD ERROR =', error);

    if (error) {
      console.error('Discord sync error:', error);
      toast('Erreur sync Discord : ' + (error.message || 'Erreur inconnue'));
      return false;
    }

    return true;
  } catch (err) {
    console.error('Discord sync exception:', err);
    toast('Exception Discord : ' + (err.message || 'Erreur inconnue'));
    return false;
  }
}

function fillDirectorySelect() { if (els.warningDirectoryId) els.warningDirectoryId.innerHTML = cache.directory.map(v => `<option value="${v.id}">${v.last_name} ${v.first_name}</option>`).join(''); }
function renderProfile() { if (els.profileBox && currentProfile) els.profileBox.innerHTML = `<p><strong>${currentProfile.full_name}</strong></p><p>Nom d'utilisateur : <strong>@${currentProfile.username}</strong></p><p>Rôle : <strong>${currentProfile.role}</strong></p>`; }

/* login */
const loginForm = document.getElementById('loginForm');
const loginBtn = document.querySelector('#loginForm button[type="submit"]') || document.querySelector('#loginForm button');



async function doLogin() {
  console.log('DO LOGIN START');

  try {
    const username = document.getElementById('loginUsername')?.value?.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';

    console.log('username =', username);
    console.log('password ok =', !!password);

    if (!username) return toast("Nom d'utilisateur requis.");
    if (!password) return toast('Mot de passe requis.');

    const email = usernameToEmail(username);
    console.log('email =', email);

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    console.log('LOGIN RESULT =', { data, error });

    if (error) return toast(error.message || 'Erreur de connexion.');

    await loadSession();
  } catch (err) {
    console.error('LOGIN ERROR =', err);
    toast(err?.message || 'Erreur inattendue pendant la connexion.');
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('FORM SUBMIT TRIGGERED');
    await doLogin();
  });
}

if (loginBtn) {
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('BUTTON CLICK TRIGGERED');
    await doLogin();
  });
}
document.getElementById('changePasswordForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const p1 = document.getElementById('newPassword').value, p2 = document.getElementById('confirmPassword').value;
  if (p1 !== p2) return toast('Les mots de passe ne correspondent pas.');
  const { error } = await sb.auth.updateUser({ password: p1 }); if (error) return toast(error.message);
  await sb.from('profiles').update({ must_change_password: false }).eq('id', currentProfile.id);
  await loadSession();
});
document.getElementById('profilePasswordForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const p1 = document.getElementById('profileNewPassword').value, p2 = document.getElementById('profileConfirmPassword').value;
  if (p1 !== p2) return toast('Les mots de passe ne correspondent pas.');
  const { error } = await sb.auth.updateUser({ password: p1 }); if (error) return toast(error.message);
  toast('Mot de passe modifié.'); e.target.reset();
});

document.getElementById('saleProduct')?.addEventListener('change', updateSalePriceByService);
document.getElementById('saleService')?.addEventListener('change', updateSalePriceByService);
['saleQty', 'salePrice', 'saleDiscount'].forEach(id => { document.getElementById(id)?.addEventListener('input', updateSalePreview); document.getElementById(id)?.addEventListener('change', updateSalePreview); });

document.getElementById('saleForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const disc = canDiscount(currentProfile?.role) ? Number(document.getElementById('saleDiscount').value || 0) : 0;
  const qty = Number(document.getElementById('saleQty').value), price = Number(document.getElementById('salePrice').value), before = qty * price, discAmt = before * (disc / 100), final = before - discAmt;
  const payload = { sale_date: document.getElementById('saleDate').value, user_id: currentProfile.id, product_id: document.getElementById('saleProduct').value, quantity: qty, unit_price: price, payment_method: document.getElementById('salePayment').value, service_type: document.getElementById('saleService').value, total_amount: before, total_before_discount: before, discount_percent: disc, discount_amount: discAmt, total_after_discount: final };
  const { error } = await sb.from('sales').insert(payload); if (error) return toast(error.message);
  e.target.reset(); document.getElementById('saleDate').value = todayStr(); document.getElementById('saleQty').value = 1; document.getElementById('saleDiscount').value = 0; await refreshAll();
});

document.getElementById('stockItemForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const name = document.getElementById('stockItemName').value.trim();
  const category = String(document.getElementById('stockCategory').value || '').trim();
  const unit = document.getElementById('stockItemUnit').value;
  const unit_cost = Number(document.getElementById('stockItemUnitCost').value || 0);
  const threshold = Number(document.getElementById('stockItemThreshold').value || 0);
  const destination = document.getElementById('stockItemDestination').value;
  const priceBar = Number(document.getElementById('stockItemPriceBar').value || 0);
  const qty = Number(document.getElementById('stockItemInitialQty').value || 0);

  const available_in_supplier = true;
  const available_in_menu = destination === 'supplier_menu';

  let productId = null;

  if (available_in_menu) {
    const { data: product, error: productError } = await sb.from('products').insert({
      name,
      category,
      price_bar: priceBar,
      cost_price: unit_cost,
      price: priceBar,
      active: true
    }).select().single();

    if (productError) return toast(productError.message);
    productId = product.id;
  }

  const { data: item, error: itemError } = await sb
    .from('stock_items')
    .insert({
      name,
      category,
      unit,
      unit_cost,
      low_threshold: threshold,
      active: true,
      available_in_supplier,
      available_in_menu,
      product_id: productId
    })
    .select()
    .single();

  if (itemError) return toast(itemError.message);

  if (productId) {
    await sb.from('products').update({ stock_item_id: item.id }).eq('id', productId);
  }

  if (qty > 0) {
    const { error: movementError } = await sb.from('stock_movements').insert({
      stock_item_id: item.id,
      movement_date: todayStr(),
      movement_type: 'entry',
      quantity: qty,
      reason: 'Stock initial',
      created_by: currentProfile.id
    });

    if (movementError) return toast(movementError.message);
  }

  e.target.reset();
  await refreshAll();
  toast('Article stock ajouté.');
});


document.getElementById('productPriceBar')?.addEventListener('focus', prefillNewProductPrices);
document.getElementById('productForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  const payload = {
  name: document.getElementById('productName').value.trim(),
  category: String(document.getElementById('productCategory').value || '').trim(),
  price_bar: Number(document.getElementById('productPriceBar').value || 0),
  cost_price: Number(document.getElementById('productCostPrice').value || 0),
  price: Number(document.getElementById('productPriceBar').value || 0),
  active: true
  };
  const { error } = await sb.from('products').insert(payload); if (error) return toast(error.message);
  e.target.reset(); await refreshAll(); prefillNewProductPrices();
});

document.getElementById('categoryForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  const name = document.getElementById('categoryName').value.trim();
  const type = document.getElementById('categoryType').value;
  const { error } = await sb.from('categories').insert({ name, type, active: true });
  if (error) return toast(error.message);
  e.target.reset();
  await refreshAll();
});

document.getElementById('directoryForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  const { error } = await sb.from('directory').insert({ last_name: document.getElementById('dirLastName').value.trim(), first_name: document.getElementById('dirFirstName').value.trim(), phone: document.getElementById('dirPhone').value.trim() });
  if (error) return toast(error.message);
  e.target.reset(); await refreshAll();
});

document.getElementById('warningForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  const { error } = await sb.from('directory_warnings').insert({ directory_id: els.warningDirectoryId.value, warning_level: document.getElementById('warningLevel').value, note: document.getElementById('warningNote').value.trim(), created_by: currentProfile.id });
  if (error) return toast(error.message);
  e.target.reset(); await refreshAll();
});

document.getElementById('createUserForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  const payload = { full_name: document.getElementById('newFullName').value.trim(), username: document.getElementById('newUsername').value.trim(), temp_password: document.getElementById('newPasswordTmp').value, role: document.getElementById('newRole').value };
  const { data, error } = await sb.functions.invoke('create-user', { body: payload });
  if (error) return toast(error.message || 'Erreur de création');
  if (data?.error) return toast(data.error);
  e.target.reset(); await refreshAll();
});

document.getElementById('deliveryZoneForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const zoneName = document.getElementById('deliveryZoneName').value.trim();
  const price = Number(document.getElementById('deliveryZonePrice').value || 0);

  const { error } = await sb.from('delivery_zones').upsert(
    { zone_name: zoneName, price, active: true },
    { onConflict: 'zone_name' }
  );

  if (error) return toast(error.message);

  e.target.reset();
  await refreshAll();
  toast('Tarif livraison enregistré.');
});

document.getElementById('vipClientForm')?.addEventListener('submit', async e => {
  e.preventDefault();

  if (!canAccessVip(currentProfile?.role)) return toast('Accès refusé.');

  const full_name = document.getElementById('vipFullName')?.value?.trim() || '';
  const phone = document.getElementById('vipPhone')?.value?.trim() || '';
  const level = document.getElementById('vipLevel')?.value || 'VIP';

  let start_date = document.getElementById('vipStartDate')?.value || todayStr();
  let end_date = document.getElementById('vipEndDate')?.value || addDays(start_date, 7);

  const cfg = getVipConfig(level);

  if (!full_name) return toast('Nom complet requis.');

  const payload = {
    full_name,
    phone,
    level,
    discount_percent: Number(cfg.discount_percent || 0),
    weekly_price: Number(cfg.weekly_price || 0),
    start_date,
    end_date,
    is_active: true
  };

  console.log('VIP INSERT PAYLOAD =', payload);

  const { data, error } = await sb
    .from('vip_clients')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('VIP INSERT ERROR =', error);
    return toast(error.message);
  }

  e.target.reset();
  updateVipFormFields();
  await refreshAll();
  await syncVipToDiscord();
  toast('Client VIP ajouté ✅');
});

document.getElementById('vipSearch')?.addEventListener('input', renderVipClients);

async function editStockItem(id) {
  const item = cache.stock.find(v => v.id === id);
  if (!item) return;

  const name = prompt('Nom', item.name);
  if (name === null) return;

  const category = prompt('Catégorie', item.category || '');
  if (category === null) return;

  const unit = prompt('Unité', item.unit);
  if (unit === null) return;

  const unit_cost = prompt('Coût unitaire', item.unit_cost || 0);
  if (unit_cost === null) return;

  const low = prompt('Seuil alerte', item.low_threshold);
  if (low === null) return;

  const { error } = await sb
    .from('stock_items')
    .update({
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      unit_cost: Number(unit_cost || 0),
      low_threshold: Number(low || 0)
    })
    .eq('id', id);

  if (error) return toast(error.message);

  await refreshAll();
}

window.editStockItem = editStockItem;

async function editProduct(id) {
  const item = cache.produits.find(v => v.id === id);
  if (!item) return;

  const name = prompt('Nom produit', item.name);
  if (name === null) return;

  const category = prompt('Catégorie', item.category || '');
  if (category === null) return;

  const price_bar = prompt('Prix Bar', item.price_bar ?? item.price ?? 0);
  if (price_bar === null) return;

  const cost_price = prompt('Prix coûtant', item.cost_price ?? 0);
  if (cost_price === null) return;

  const active = confirm('Produit actif ? OK = Oui / Annuler = Non');

  const { error } = await sb.from('products').update({
    name: name.trim(),
    category: category.trim(),
    price_bar: Number(price_bar || 0),
    cost_price: Number(cost_price || 0),
    price: Number(price_bar || 0),
    active
  }).eq('id', id);

  if (error) return toast(error.message);
  await refreshAll();
}
window.editProduct = editProduct;
async function editCategory(id) {
  const item = cache.categories.find(v => v.id === id);
  if (!item) return;

  const name = prompt('Nom catégorie', item.name);
  if (name === null) return;

  const type = prompt('Type (carte, stock, recette, grossiste)', item.type);
  if (type === null) return;

  const typeValue = type.trim().toLowerCase();
  if (!['carte', 'stock', 'recette', 'grossiste'].includes(typeValue)) return toast('Type invalide');

  const { error } = await sb.from('categories').update({
    name: name.trim().toUpperCase(),
    type: typeValue
  }).eq('id', id);

  if (error) return toast(error.message);
  await refreshAll();
}
window.editCategory = editCategory;

async function deleteStockItem(id){ if(!confirm('Supprimer cet élément de stock ?')) return; const { error } = await sb.from('stock_items').delete().eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.deleteStockItem = deleteStockItem;
async function editPurchase(id){ const item = cache.achats.find(v=>v.id===id); if(!item) return; const item_name = prompt('Nom', item.item_name); if(item_name===null) return; const category = prompt('Catégorie', item.category); if(category===null) return; const amount = prompt('Montant', item.amount); if(amount===null) return; const purchase_date = prompt('Date (YYYY-MM-DD)', item.purchase_date); if(purchase_date===null) return; const { error } = await sb.from('purchases').update({ item_name:item_name.trim(), category:category.trim(), amount:Number(amount||0), purchase_date }).eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.editPurchase = editPurchase;
async function deletePurchase(id){ if(!confirm('Supprimer cet achat ?')) return; const { error } = await sb.from('purchases').delete().eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.deletePurchase = deletePurchase;
async function deleteProduct(id){ if(!confirm('Supprimer ce produit ?')) return; const { error } = await sb.from('products').delete().eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.deleteProduct = deleteProduct;
async function editDirectory(id){ const item = cache.directory.find(v=>v.id===id); if(!item) return; const last_name = prompt('Nom', item.last_name); if(last_name===null) return; const first_name = prompt('Prénom', item.first_name); if(first_name===null) return; const phone = prompt('Téléphone', item.phone); if(phone===null) return; const { error } = await sb.from('directory').update({ last_name:last_name.trim(), first_name:first_name.trim(), phone:phone.trim() }).eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.editDirectory = editDirectory;
async function deleteDirectory(id){ if(!confirm('Supprimer ce contact ?')) return; const { error } = await sb.from('directory').delete().eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.deleteDirectory = deleteDirectory;
async function editUser(id){ const user = cache.profils.find(v=>v.id===id); if(!user) return; const full_name = prompt('Nom complet', user.full_name); if(full_name===null) return; const role = prompt('Rôle (employe, employe_confirme, codirecteur, directeur)', user.role); if(role===null) return; const roleValue = role.trim(); if(!['employe','employe_confirme','codirecteur','directeur'].includes(roleValue)) return toast('Rôle invalide'); if(!isDirector(currentProfile?.role) && roleValue === 'directeur') return toast('Seul un directeur peut attribuer le rôle directeur'); const { error } = await sb.from('profiles').update({ full_name: full_name.trim(), role: roleValue }).eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.editUser = editUser;
async function toggleUserActive(userId, active){ const { data, error } = await sb.functions.invoke('set-user-active', { body: { user_id: userId, active } }); if(error) return toast(error.message || 'Erreur'); if(data?.error) return toast(data.error); await refreshAll(); } window.toggleUserActive = toggleUserActive;
async function resetTmpPassword(userId){ const tmp = prompt('Nouveau mot de passe provisoire :'); if(!tmp) return; const { data, error } = await sb.functions.invoke('reset-user-password', { body: { user_id:userId, temp_password:tmp } }); if(error) return toast(error.message || 'Erreur'); if(data?.error) return toast(data.error); toast('Mot de passe provisoire mis à jour.'); } window.resetTmpPassword = resetTmpPassword;
async function toggleCategory(id, active){ const { error } = await sb.from('categories').update({ active }).eq('id', id); if(error) return toast(error.message); await refreshAll(); } window.toggleCategory = toggleCategory;

document.getElementById('burgerBtn')?.addEventListener('click', () => {
  document.getElementById('menu')?.classList.toggle('active');
});
// Fermer menu mobile après clic
document.querySelectorAll('#menu button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('menu')?.classList.remove('active');
  });
});

let caisseCart = [];
let activeContestReward = null;

function renderCaisseProducts() {
  const container = document.getElementById('caisseProducts');
  if (!container) return;

  const search = (document.getElementById('posSearch')?.value || '').trim().toLowerCase();

  const activeProducts = (cache.produits || [])
    .filter(p => p.active !== false)
    .map(p => ({
      ...p,
      _resolvedCategory: String(p.category || '').trim() || 'Sans catégorie'
    }));

  const grouped = activeProducts.reduce((acc, product) => {
    const category = product._resolvedCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'fr'));
  const categoriesWrap = document.getElementById('posCategories');

  if (categoriesWrap) {
    categoriesWrap.innerHTML = categories.map(category => `
      <button type="button" class="pos-category-btn" onclick="filterPosCategory('${category.replace(/'/g, "\\'")}')">
        ${category}
      </button>
    `).join('');
  }

  let filteredProducts = activeProducts;

  if (window.currentPosCategory) {
    filteredProducts = filteredProducts.filter(p => p._resolvedCategory === window.currentPosCategory);
  }

  if (search) {
    filteredProducts = filteredProducts.filter(p =>
      `${p.name || ''} ${p._resolvedCategory || ''}`.toLowerCase().includes(search)
    );
  }

  container.innerHTML = filteredProducts.map(product => `
    <div class="pos-product" onclick="addToCart('${product.id}')">
      <div class="pos-product-name">${product.name}</div>
      <div class="pos-product-price">${euro(product.price_bar ?? product.price ?? 0)}</div>
    </div>
  `).join('') || `<div class="caisse-cart-empty">Aucun produit</div>`;
}

function filterPosCategory(category) {
  if (window.currentPosCategory === category) {
    window.currentPosCategory = '';
  } else {
    window.currentPosCategory = category;
  }

  document.querySelectorAll('.pos-category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === window.currentPosCategory);
  });

  renderCaisseProducts();
}

window.filterPosCategory = filterPosCategory;
document.getElementById('posSearch')?.addEventListener('input', renderCaisseProducts);

function addToCart(productId) {
  const product = (cache.produits || []).find(p => String(p.id) === String(productId));
  if (!product) {
    console.error('Produit introuvable dans cache.produits:', productId);
    return toast('Produit introuvable.');
  }

  const existing = caisseCart.find(i => !i.isMenu && String(i.id) === String(productId));

  if (existing) {
    existing.qty += 1;
  } else {
    caisseCart.push({
      id: product.id,
      name: product.name || 'Produit',
      qty: 1,
      isMenu: false,
      product: product,
      discountPercent: 0,
      isOffered: false
    });
  }

  renderCart();
}
window.addToCart = addToCart;

function setCartQty(itemId, value) {
  const item = caisseCart.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0) {
    item.qty = 1;
  } else {
    item.qty = Math.floor(qty);
  }

  renderCart();
}
window.setCartQty = setCartQty;

function setSupplierQty(itemId, value) {
  const item = supplierCart.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0) {
    item.qty = 1;
  } else {
    item.qty = Math.floor(qty);
  }

  renderSupplierCart();
}
window.setSupplierQty = setSupplierQty;

function changeCartQty(itemId, delta) {
  const item = caisseCart.find(i => String(i.id) === String(itemId));
  if (!item) return;

  item.qty = Math.max(1, Number(item.qty || 0) + Number(delta || 0));
  renderCart();
}
window.changeCartQty = changeCartQty;

function removeFromCart(itemId) {
  caisseCart = caisseCart.filter(i => String(i.id) !== String(itemId));
  renderCart();
}
window.removeFromCart = removeFromCart;

function setCartItemDiscount(itemId, percent) {
  const item = caisseCart.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const value = Number(percent);
  item.discountPercent = Number.isFinite(value) ? value : 0;
  item.isOffered = item.discountPercent >= 100;

  renderCart();
}
window.setCartItemDiscount = setCartItemDiscount;

function toggleCartItemOffered(itemId) {
  const item = caisseCart.find(i => String(i.id) === String(itemId));
  if (!item) return;

  if (!isDirectionRole(currentProfile?.role)) {
    return toast('Accès refusé.');
  }

  item.isOffered = !item.isOffered;
  item.discountPercent = item.isOffered ? 100 : 0;

  renderCart();
}
window.toggleCartItemOffered = toggleCartItemOffered;

function renderCart() {
  const container = document.getElementById('caisseCartItems');
  const totalEl = document.getElementById('caisseTotal');
  const countEl = document.getElementById('caisseCartCount');
  const service = document.getElementById('caisseService')?.value || 'Bar';
  const globalDiscount = Number(document.getElementById('globalDiscount')?.value || 0);
  const isGlobalOffered = document.getElementById('globalOffert')?.dataset.active === 'true';

  if (!container || !totalEl) return;

  if (!Array.isArray(caisseCart) || caisseCart.length === 0) {
    container.innerHTML = `<div class="caisse-cart-empty">Panier vide</div>`;
    totalEl.textContent = euro(0);
    if (countEl) countEl.textContent = '0 article';

    const countBottom = document.getElementById('caisseCartCountBottom');
    if (countBottom) countBottom.textContent = 'Validation rapide du panier';

    const info = document.getElementById('contestRewardInfo');
    if (info) {
      info.textContent = activeContestReward
        ? `${activeContestReward.message} — appliqué`
        : 'Aucun code appliqué';
    }

    return;
  }

  let subtotalAfterLineDiscounts = 0;
  let count = 0;

  container.innerHTML = caisseCart.map(item => {
    const isMenu = !!item.isMenu;
    const price = isMenu
      ? Number(item.fixedPrice || 0)
      : pickServicePrice(item.product, service);

    const qty = Number(item.qty || 0);
    const base = price * qty;

    const lineDiscountPercent = Number(item.discountPercent || 0);
    const lineDiscountAmount = item.isOffered ? base : base * (lineDiscountPercent / 100);
    const lineAfterDiscount = Math.max(0, base - lineDiscountAmount);

    subtotalAfterLineDiscounts += lineAfterDiscount;
    count += qty;

    const canLineDiscount = canDiscount(currentProfile?.role);
    const canOffer = isDirectionRole(currentProfile?.role);

    const detailHtml = isMenu
      ? `
        <div class="caisse-cart-meta">Planche : ${item.recipe_name || '-'}</div>
        <div class="caisse-cart-meta">Boisson : ${item.drink_name || '-'}</div>
        ${item.extra_name ? `<div class="caisse-cart-meta">Supplément : ${item.extra_name}</div>` : ''}
      `
      : `<div class="caisse-cart-meta">${service} • ${euro(price)} / unité</div>`;

    return `
      <div class="caisse-cart-item">
        <div class="caisse-cart-main">
          <div class="caisse-cart-name">${item.name || 'Produit'}</div>
          ${detailHtml}
          <div class="caisse-cart-meta">
            Sous-total : ${euro(base)}
            ${lineDiscountPercent > 0 ? `• Remise : ${lineDiscountPercent}%` : ''}
            ${item.isOffered ? '• OFFERT' : ''}
          </div>

          <div class="caisse-line-tools">
            ${canLineDiscount ? `
              <select class="cart-line-discount" onchange="setCartItemDiscount('${item.id}', this.value)">
                <option value="0" ${lineDiscountPercent === 0 ? 'selected' : ''}>Remise 0%</option>
                <option value="5" ${lineDiscountPercent === 5 ? 'selected' : ''}>Remise 5%</option>
                <option value="10" ${lineDiscountPercent === 10 ? 'selected' : ''}>Remise 10%</option>
                <option value="15" ${lineDiscountPercent === 10 ? 'selected' : ''}>Remise 15%</option>
                <option value="20" ${lineDiscountPercent === 20 ? 'selected' : ''}>Remise 20%</option>
                <option value="30" ${lineDiscountPercent === 30 ? 'selected' : ''}>Remise 30%</option>
                <option value="40" ${lineDiscountPercent === 40 ? 'selected' : ''}>Remise 40%</option>
                <option value="50" ${lineDiscountPercent === 50 ? 'selected' : ''}>Remise 50%</option>
                <option value="60" ${lineDiscountPercent === 60 ? 'selected' : ''}>Remise 60%</option>
                <option value="70" ${lineDiscountPercent === 70 ? 'selected' : ''}>Remise 70%</option>
                <option value="80" ${lineDiscountPercent === 80 ? 'selected' : ''}>Remise 80%</option>
                ${canOffer ? `<option value="100" ${lineDiscountPercent === 100 ? 'selected' : ''}>🎁 Offert (100%)</option>` : ''}
              </select>
            ` : ''}

            ${canOffer ? `
              <button class="secondary" onclick="toggleCartItemOffered('${item.id}')">
                ${item.isOffered ? 'Retirer offert' : 'Offrir'}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="caisse-cart-right">
          <div class="caisse-line-total">${euro(lineAfterDiscount)}</div>

          <div class="caisse-qty-controls">
            <button class="caisse-qty-btn" onclick="changeCartQty('${item.id}', -1)">−</button>
            <input class="caisse-qty-input" type="number" min="1" step="1" value="${qty}" onblur="setCartQty('${item.id}', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}" />
            <button class="caisse-qty-btn" onclick="changeCartQty('${item.id}', 1)">+</button>
            <button class="caisse-remove-btn" onclick="removeFromCart('${item.id}')">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  let finalTotal = subtotalAfterLineDiscounts;

  if (isGlobalOffered) {
    finalTotal = 0;
  } else {
    finalTotal = Math.max(0, subtotalAfterLineDiscounts - (subtotalAfterLineDiscounts * (globalDiscount / 100)));
  }

  if (activeContestReward) {
    if (Number(activeContestReward.discount_percent || 0) > 0) {
      finalTotal = Math.max(0, finalTotal - (finalTotal * (Number(activeContestReward.discount_percent || 0) / 100)));
    }

    if (Number(activeContestReward.fixed_discount_amount || 0) > 0) {
      finalTotal = Math.max(0, finalTotal - Number(activeContestReward.fixed_discount_amount || 0));
    }

    if (activeContestReward.free_menu === true) {
      const firstMenu = caisseCart.find(i => i?.isMenu === true);
      if (firstMenu) {
        finalTotal = Math.max(0, finalTotal - (Number(firstMenu.fixedPrice || 0) * Number(firstMenu.qty || 0)));
      }
    }

    if (activeContestReward.free_menu_dessert === true) {
      const firstMenuDessert = caisseCart.find(i => i?.isMenu === true);
      if (firstMenuDessert) {
        finalTotal = Math.max(0, finalTotal - (Number(firstMenuDessert.fixedPrice || 0) * Number(firstMenuDessert.qty || 0)));
      }
    }
  }

  totalEl.textContent = euro(finalTotal);

  if (countEl) {
    countEl.textContent = `${count} article${count > 1 ? 's' : ''}`;
  }

  const countBottom = document.getElementById('caisseCartCountBottom');
  if (countBottom) {
    countBottom.textContent = `${count} article${count > 1 ? 's' : ''} dans le panier`;
  }

  const info = document.getElementById('contestRewardInfo');
  if (info) {
    info.textContent = activeContestReward
      ? `${activeContestReward.message} — appliqué`
      : 'Aucun code appliqué';
  }
}

function renderDashboardPurchases() {
  if (!els.dashboardPurchaseRows) return;

  const rows = (cache.achats || []).slice(0, 10);

  els.dashboardPurchaseRows.innerHTML = rows.map(v => `
    <tr>
      <td>${v.purchase_date || ''}</td>
      <td>${v.item_name || ''}</td>
      <td>${v.category || ''}</td>
      <td>${Number(v.quantity || 0).toFixed(2)}</td>
      <td>${v.unit || ''}</td>
      <td>${euro(v.unit_cost || 0)}</td>
      <td>${euro(v.amount || 0)}</td>
      <td><button class="secondary" onclick="deletePurchase('${v.id}')">Supprimer</button></td>
    </tr>
  `).join('') || '<tr><td colspan="8">Aucun achat</td></tr>';
}
async function deletePurchase(id) {
  if (!confirm('Supprimer cet achat ?')) return;

  const purchase = cache.achats.find(a => a.id === id);
  if (!purchase) return;

  // ⚠️ Annulation du stock
  if (purchase.stock_item_id) {
    await sb.from('stock_movements').insert({
      stock_item_id: purchase.stock_item_id,
      movement_date: todayStr(),
      movement_type: 'exit',
      quantity: purchase.quantity,
      reason: 'Suppression achat grossiste',
      created_by: currentProfile.id
    });
  }

  const { error } = await sb.from('purchases').delete().eq('id', id);
  if (error) return toast(error.message);

  await refreshAll();
  toast('Achat supprimé');
}

window.deletePurchase = deletePurchase;
document.getElementById('globalOffert')?.addEventListener('click', () => {
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const btn = document.getElementById('globalOffert');
  btn.dataset.active = btn.dataset.active === 'true' ? 'false' : 'true';
  renderCart();
});

async function ensureMenuLeprechaunProduct() {
  const menuName = 'Menu Leprechaun';

  let product = (cache.produits || []).find(
    p => String(p.name || '').trim().toLowerCase() === menuName.toLowerCase()
  );

  if (product) return product;

  const { data, error } = await sb
    .from('products')
    .insert({
      name: menuName,
      category: 'MENU',
      price_bar: MENU_LEPRECHAUN_BASE_PRICE,
      cost_price: 0,
      price: MENU_LEPRECHAUN_BASE_PRICE,
      active: true
    })
    .select()
    .single();

  if (error) {
    console.error('ERREUR CREATION MENU LEPRECHAUN:', error);
    throw new Error(error.message || 'Impossible de créer le produit Menu Leprechaun');
  }

  cache.produits = [...(cache.produits || []), data];
  return data;
}

async function validateCart(payment) {
  if (!Array.isArray(caisseCart) || caisseCart.length === 0) {
    return toast('Panier vide');
  }

  const service = document.getElementById('caisseService')?.value || 'Bar';
  const globalDiscount = Number(document.getElementById('globalDiscount')?.value || 0);
  const globalOffertBtn = document.getElementById('globalOffert');
  const isGlobalOffered = globalOffertBtn?.dataset.active === 'true';

  const companyBox = document.getElementById('companyContractBox');
  const companySelect = document.getElementById('companySelect');
  const vipClient = typeof getSelectedVipClient === 'function' ? getSelectedVipClient() : null;

  let selectedCompany = null;
  let firstSaleId = null;

  if (payment === 'company') {
    if (!companySelect) return toast('Select entreprise introuvable.');
    if (!companySelect.value) return toast('Choisis une entreprise.');

    const { data, error } = await sb
      .from('company_contracts')
      .select('*')
      .eq('id', companySelect.value)
      .single();

    if (error) return toast(error.message);
    selectedCompany = data;
  }

  caisseCart = caisseCart.filter(item => {
    if (item?.isMenu === true) return true;
    return !!(item && item.id && item.product);
  });

  if (caisseCart.length === 0) {
    return toast('Produit introuvable pour la vente');
  }

  for (const item of caisseCart) {
    if (item.isMenu === true) {
      const qty = Number(item.qty || 1);
      const unitPrice = Number(item.fixedPrice || 0);
      const base = unitPrice * qty;

      let lineDiscountPercent = Number(item.discountPercent || 0);
      if (vipClient) {
        lineDiscountPercent = Math.max(
          lineDiscountPercent,
          Number(vipClient.discount_percent || 0)
        );
      }

      const lineDiscountAmount = item.isOffered
        ? base
        : base * (lineDiscountPercent / 100);

      let final = Math.max(0, base - lineDiscountAmount);

      if (isGlobalOffered) {
        final = 0;
      } else if (globalDiscount > 0) {
        final = Math.max(0, final - (final * (globalDiscount / 100)));
      }

      if (activeContestReward) {
        if (Number(activeContestReward.discount_percent || 0) > 0) {
          final = Math.max(0, final - (final * (Number(activeContestReward.discount_percent || 0) / 100)));
        }

        if (Number(activeContestReward.fixed_discount_amount || 0) > 0) {
          final = Math.max(0, final - Number(activeContestReward.fixed_discount_amount || 0));
        }

        if (activeContestReward.free_menu === true || activeContestReward.free_menu_dessert === true) {
          final = 0;
        }
      }

      let menuProduct;
      try {
        menuProduct = await ensureMenuLeprechaunProduct();
      } catch (err) {
        console.error('Erreur ensureMenuLeprechaunProduct:', err);
        return toast(err.message || 'Impossible de préparer le produit menu');
      }

      const payload = {
        sale_date: todayStr(),
        user_id: currentProfile.id,
        product_id: menuProduct.id,
        quantity: qty,
        unit_price: unitPrice,
        payment_method: payment,
        service_type: service,
        total_amount: base,
        total_before_discount: base,
        discount_percent: lineDiscountPercent,
        discount_amount: lineDiscountAmount,
        total_after_discount: final,
        company_contract_id: selectedCompany?.id || null,
        company_contract_name: selectedCompany?.company_name || '',
        billing_status: payment === 'company' ? 'a_facturer' : 'none',
        payment_status: payment === 'company' ? 'non_paye' : 'paye',

        sale_kind: 'menu',
        menu_type: item.menuType || 'leprechaun',
        menu_recipe_id: item.recipe_id || null,
        menu_recipe_name: item.recipe_name || '',
        menu_drink_id: item.drink_id || null,
        menu_drink_name: item.drink_name || '',
        menu_extra_id: item.extra_id || null,
        menu_extra_name: item.extra_name || '',

        vip_client_id: vipClient?.id || null,
        vip_client_name: vipClient?.full_name || null,
        vip_level: vipClient?.level || null,

        contest_reward_code: activeContestReward?.code || null,
        contest_reward_type: activeContestReward?.reward_type || null,
        contest_reward_value: activeContestReward?.reward_value || null
      };

      const { data: insertedSale, error } = await sb
        .from('sales')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('ERREUR INSERT MENU:', error, payload, item);
        return toast(error.message);
      }

      if (!firstSaleId && insertedSale?.id) {
        firstSaleId = insertedSale.id;
      }

      const recipeProduct = (cache.produits || []).find(
        p => String(p.recipe_id || '') === String(item.recipe_id || '')
      );

      if (recipeProduct) {
        await consumeRecipeStock(recipeProduct.id, qty);
        await consumeSimpleProductStock(recipeProduct.id, qty);
      }

      if (item.drink_id) {
        await consumeRecipeStock(item.drink_id, qty);
        await consumeSimpleProductStock(item.drink_id, qty);
      }

      if (item.extra_id) {
        await consumeRecipeStock(item.extra_id, qty);
        await consumeSimpleProductStock(item.extra_id, qty);
      }

      continue;
    }

    if (!item.id || !item.product) {
      console.error('ITEM PANIER INVALIDE:', item);
      return toast('Produit introuvable pour la vente');
    }

    if (typeof canConsumeRecipeStock === 'function') {
      const stockCheck = await canConsumeRecipeStock(item.id, item.qty);
      if (!stockCheck.ok) return toast(stockCheck.message);
    }

    const qty = Number(item.qty || 0);
    const price = Number(pickServicePrice(item.product, service) || 0);
    const base = price * qty;

    let lineDiscountPercent = Number(item.discountPercent || 0);
    if (vipClient) {
      lineDiscountPercent = Math.max(
        lineDiscountPercent,
        Number(vipClient.discount_percent || 0)
      );
    }

    const lineDiscountAmount = item.isOffered
      ? base
      : base * (lineDiscountPercent / 100);

    let final = Math.max(0, base - lineDiscountAmount);

    if (isGlobalOffered) {
      final = 0;
    } else if (globalDiscount > 0) {
      final = Math.max(0, final - (final * (globalDiscount / 100)));
    }

    if (activeContestReward) {
      if (Number(activeContestReward.discount_percent || 0) > 0) {
        final = Math.max(0, final - (final * (Number(activeContestReward.discount_percent || 0) / 100)));
      }

      if (Number(activeContestReward.fixed_discount_amount || 0) > 0) {
        final = Math.max(0, final - Number(activeContestReward.fixed_discount_amount || 0));
      }
    }

    const payload = {
      sale_date: todayStr(),
      user_id: currentProfile.id,
      product_id: item.id,
      quantity: qty,
      unit_price: price,
      payment_method: payment,
      service_type: service,
      total_amount: base,
      total_before_discount: base,
      discount_percent: lineDiscountPercent,
      discount_amount: lineDiscountAmount,
      total_after_discount: final,
      company_contract_id: selectedCompany?.id || null,
      company_contract_name: selectedCompany?.company_name || '',
      billing_status: payment === 'company' ? 'a_facturer' : 'none',
      payment_status: payment === 'company' ? 'non_paye' : 'paye',

      vip_client_id: vipClient?.id || null,
      vip_client_name: vipClient?.full_name || null,
      vip_level: vipClient?.level || null,

      contest_reward_code: activeContestReward?.code || null,
      contest_reward_type: activeContestReward?.reward_type || null,
      contest_reward_value: activeContestReward?.reward_value || null,
      contest_reward_label: activeContestReward?.message || null,
    };

    const { data: insertedSale, error } = await sb
      .from('sales')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('ERREUR INSERT PRODUIT:', error, payload, item);
      return toast(error.message);
    }

    if (!firstSaleId && insertedSale?.id) {
      firstSaleId = insertedSale.id;
    }

    await consumeRecipeStock(item.id, qty);
    await consumeSimpleProductStock(item.id, qty);
  }

  if (activeContestReward?.code) {
    const { error: rewardUpdateError } = await sb
      .from('reward_codes')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        used_sale_id: firstSaleId || null,
        used_by: currentProfile?.id || null,
        used_note: `Utilisé en caisse par ${currentProfile?.full_name || 'unknown'}`
      })
      .eq('code', activeContestReward.code);

    if (rewardUpdateError) {
      console.error('REWARD CODE UPDATE ERROR =', rewardUpdateError);
    }
  }

  caisseCart = [];

  const globalDiscountSelect = document.getElementById('globalDiscount');
  if (globalDiscountSelect) globalDiscountSelect.value = '0';

  if (globalOffertBtn) globalOffertBtn.dataset.active = 'false';

  if (companyBox) companyBox.classList.add('hidden');
  if (companySelect) companySelect.value = '';

  const vipSelect = document.getElementById('vipSelect');
  if (vipSelect) vipSelect.value = '';

  activeContestReward = null;

  const rewardInput = document.getElementById('contestRewardCode');
  const rewardInfo = document.getElementById('contestRewardInfo');
  if (rewardInput) rewardInput.value = '';
  if (rewardInfo) rewardInfo.textContent = 'Aucun code appliqué';

  renderCart();
  await refreshAll();

  if (typeof renderContracts === 'function') {
    await renderContracts();
  }

  toast('Vente enregistrée ✅');
}

async function applySuggestedRecipePrice(recipeId) {
  const recipe = cache.recipes.find(r => String(r.id) === String(recipeId));
  if (!recipe) return;

  const price = Number(recipe.suggested_price || 0);

  const { error: recipeError } = await sb
    .from('recipes')
    .update({
      sale_price: price,
      margin_amount: price - Number(recipe.total_cost || 0),
      margin_percent: Number(recipe.total_cost || 0) > 0
        ? (((price - Number(recipe.total_cost || 0)) / Number(recipe.total_cost || 0)) * 100)
        : 0
    })
    .eq('id', recipeId);

  if (recipeError) return toast(recipeError.message);

  if (recipe.product_id) {
    const { error: productError } = await sb
      .from('products')
      .update({
        price_bar: price,
        price: price
      })
      .eq('id', recipe.product_id);

    if (productError) return toast(productError.message);
  }

  await refreshAll();
  toast('Prix conseillé appliqué.');
}

window.applySuggestedRecipePrice = applySuggestedRecipePrice;

async function consumeRecipeStock(productId, soldQty) {
  const product = cache.produits.find(p => String(p.id) === String(productId));
  if (!product?.recipe_id) return;

  const { data: items, error } = await sb.from('recipe_items').select('*').eq('recipe_id', product.recipe_id);
  if (error) {
    console.error(error);
    return;
  }

  for (const item of (items || [])) {
    const movementQty = Number(item.quantity || 0) * Number(soldQty || 0);

    const { error: moveError } = await sb.from('stock_movements').insert({
      stock_item_id: item.stock_item_id,
      movement_date: todayStr(),
      movement_type: 'exit',
      quantity: movementQty,
      reason: `Vente recette: ${product.name}`,
      created_by: currentProfile.id
    });

    if (moveError) {
      console.error(moveError);
    }
  }
}

function updateRecipeIngredientCost() {
  const stockId = document.getElementById('recipeStockItem')?.value || '';
  const qty = Number(document.getElementById('recipeIngredientQty')?.value || 0);
  const usageUnit = document.getElementById('recipeUsageUnit')?.value || '';

  const stockItem = cache.stock.find(s => String(s.id) === String(stockId));
  if (!stockItem) {
    const unitCostEl = document.getElementById('recipeIngredientUnitCost');
    const lineCostEl = document.getElementById('recipeIngredientLineCost');
    if (unitCostEl) unitCostEl.value = '';
    if (lineCostEl) lineCostEl.value = '';
    return;
  }

  const stockUnit = stockItem.unit || '';
  const stockQtyUsed = convertUsageToStockBase(qty, usageUnit, stockUnit);
  const unitCost = Number(stockItem.unit_cost || 0);
  const lineCost = stockQtyUsed * unitCost;

  const unitCostEl = document.getElementById('recipeIngredientUnitCost');
  const lineCostEl = document.getElementById('recipeIngredientLineCost');

  if (unitCostEl) unitCostEl.value = unitCost.toFixed(2);
  if (lineCostEl) lineCostEl.value = lineCost.toFixed(2);
}

function fillRecipeCategorySelect() {
  const select = document.getElementById('recipeCategory');
  if (!select) return;

  select.innerHTML = cache.categories
    .filter(c => c.active !== false && c.type === 'recette')
    .map(c => `<option value="${c.name}">${c.name}</option>`)
    .join('');
}
function fillRecipeSelects() {
  const recipeSelect = document.getElementById('recipeSelect');
  const recipeDetailSelect = document.getElementById('recipeDetailSelect');
  const stockSelect = document.getElementById('recipeStockItem');

  if (recipeSelect) {
    recipeSelect.innerHTML = cache.recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }

  if (recipeDetailSelect) {
    recipeDetailSelect.innerHTML = `<option value="">Choisir une recette</option>` + cache.recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  }

  if (stockSelect) {
    stockSelect.innerHTML = cache.stock.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }
}
function renderRecipes() {
  if (!els.recipeRows) return;

  els.recipeRows.innerHTML = cache.recipes.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.category}</td>
      <td>${euro(r.sale_price || 0)}</td>
      <td>${euro(r.total_cost || 0)}</td>
      <td>${euro(r.margin_amount || 0)}</td>
      <td>${Number(r.margin_percent || 0).toFixed(1)}%</td>
      <td>${euro(r.suggested_price || 0)}</td>
      <td>
        <button class="secondary" onclick="produceRecipe('${r.id}')">Fabriquer</button>
        <button class="secondary" onclick="applySuggestedRecipePrice('${r.id}')">Appliquer prix conseillé</button>
        <button class="secondary" onclick="deleteRecipe('${r.id}')">Supprimer</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8">Aucune recette</td></tr>';
}
function renderRecipeItems() {
  if (!els.recipeItemRows) return;

  const recipeId = document.getElementById('recipeDetailSelect')?.value || '';
  const rows = recipeId ? cache.recipeItems.filter(i => String(i.recipe_id) === String(recipeId)) : [];

  els.recipeItemRows.innerHTML = rows.map(i => `
    <tr>
      <td>${i.ingredient_name}</td>
      <td>${Number(i.quantity || 0).toFixed(2)}</td>
      <td>-</td>
      <td>${euro(i.unit_cost || 0)}</td>
      <td>${euro(i.line_cost || 0)}</td>
      <td><button class="secondary" onclick="deleteRecipeItem('${i.id}', '${i.recipe_id}')">Supprimer</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6">Aucun ingrédient</td></tr>';
}
function applyTargetMargin(recipeId, marginPercent) {
  const recipe = cache.recipes.find(r => String(r.id) === String(recipeId));
  if (!recipe) return;

  const cost = Number(recipe.total_cost || 0);
  if (cost <= 0) return toast('Coût recette invalide');

  const margin = Number(marginPercent) / 100;
  const price = cost / (1 - margin);

  return applySuggestedRecipePriceWithCustom(recipeId, price);
}
async function applySuggestedRecipePriceWithCustom(recipeId, price) {
  const recipe = cache.recipes.find(r => String(r.id) === String(recipeId));
  if (!recipe) return;

  const cost = Number(recipe.total_cost || 0);
  const marginAmount = price - cost;
  const marginPercent = cost > 0 ? ((marginAmount / cost) * 100) : 0;

  const { error } = await sb.from('recipes').update({
    sale_price: price,
    margin_amount: marginAmount,
    margin_percent: marginPercent
  }).eq('id', recipeId);

  if (error) return toast(error.message);

  if (recipe.product_id) {
    await sb.from('products').update({
      price_bar: price,
      price: price
    }).eq('id', recipe.product_id);
  }

  await refreshAll();
  toast('Prix calculé selon marge cible');
}
async function loadRecipes() {
  if (!isDirectionRole(currentProfile?.role)) {
    cache.recipes = [];
    return;
  }
  const { data, error } = await sb.from('recipes').select('*').order('name');
  if (error) throw error;
  cache.recipes = data || [];
}

async function loadRecipeItems() {
  if (!isDirectionRole(currentProfile?.role)) {
    cache.recipeItems = [];
    return;
  }
  const { data, error } = await sb.from('recipe_items').select('*').order('ingredient_name');
  if (error) throw error;
  cache.recipeItems = data || [];
}
async function recomputeRecipeCost(recipeId) {
  const { data, error } = await sb.from('recipe_items').select('line_cost').eq('recipe_id', recipeId);
  if (error) return toast(error.message);

  const totalCost = (data || []).reduce((sum, row) => sum + Number(row.line_cost || 0), 0);

  const recipe = cache.recipes.find(r => String(r.id) === String(recipeId));
  const salePrice = Number(recipe?.sale_price || 0);
  const suggestedPrice = totalCost * 3;
  const marginAmount = salePrice - totalCost;
  const marginPercent = totalCost > 0 ? ((marginAmount / totalCost) * 100) : 0;

  const { error: updateRecipeError } = await sb.from('recipes').update({
    total_cost: totalCost,
    suggested_price: suggestedPrice,
    margin_amount: marginAmount,
    margin_percent: marginPercent
  }).eq('id', recipeId);

  if (updateRecipeError) return toast(updateRecipeError.message);

  if (recipe?.product_id) {
    const { error: updateProductError } = await sb.from('products').update({
      cost_price: totalCost
    }).eq('id', recipe.product_id);

    if (updateProductError) return toast(updateProductError.message);
  }

  if (recipe?.stock_item_id) {
    const { error: updateStockError } = await sb.from('stock_items').update({
      unit_cost: totalCost
    }).eq('id', recipe.stock_item_id);

    if (updateStockError) return toast(updateStockError.message);
  }
}
async function deleteRecipe(id) {
  if (!confirm('Supprimer cette recette ?')) return;
  const { error } = await sb.from('recipes').delete().eq('id', id);
  if (error) return toast(error.message);
  await refreshAll();
}
window.deleteRecipe = deleteRecipe;

async function deleteRecipeItem(id, recipeId) {
  if (!confirm('Supprimer cet ingrédient ?')) return;
  const { error } = await sb.from('recipe_items').delete().eq('id', id);
  if (error) return toast(error.message);
  await recomputeRecipeCost(recipeId);
  await refreshAll();
}
window.deleteRecipeItem = deleteRecipeItem;

document.getElementById('recipeForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const name = document.getElementById('recipeName').value.trim();
  const category = String(document.getElementById('recipeCategory').value || '').trim();
  const sale_price = Number(document.getElementById('recipeSalePrice').value || 0);
  const outputUnit = document.getElementById('recipeOutputUnit')?.value || 'piece';
  const initialStockQty = Number(document.getElementById('recipeInitialStockQty')?.value || 0);

  // 1) créer la recette
  const { data: recipe, error: recipeError } = await sb.from('recipes').insert({
    name,
    category,
    sale_price,
    total_cost: 0,
    suggested_price: 0,
    margin_amount: 0,
    margin_percent: 0,
    active: true
  }).select().single();

  if (recipeError) return toast(recipeError.message);

  // 2) créer le produit dans la carte du restaurant
  const { data: product, error: productError } = await sb.from('products').insert({
    name,
    category,
    price_bar: sale_price,
    cost_price: 0,
    price: sale_price,
    active: true,
    recipe_id: recipe.id
  }).select().single();

  if (productError) return toast(productError.message);

  // 3) créer l'article de stock lié à la recette
  const { data: stockItem, error: stockError } = await sb.from('stock_items').insert({
    name,
    category,
    unit: outputUnit,
    unit_cost: 0,
    low_threshold: 0,
    active: true,
    available_in_supplier: false,
    available_in_menu: true,
    product_id: product.id
  }).select().single();

  if (stockError) return toast(stockError.message);

  // 4) stock initial si besoin
  if (initialStockQty > 0) {
    const { error: movementError } = await sb.from('stock_movements').insert({
      stock_item_id: stockItem.id,
      movement_date: todayStr(),
      movement_type: 'entry',
      quantity: initialStockQty,
      reason: `Création recette: ${name}`,
      created_by: currentProfile.id
    });

    if (movementError) return toast(movementError.message);
  }

  // 5) lier recette -> produit + stock
  const { error: recipeLinkError } = await sb.from('recipes').update({
    product_id: product.id,
    stock_item_id: stockItem.id
  }).eq('id', recipe.id);

  if (recipeLinkError) return toast(recipeLinkError.message);

  // 6) lier produit -> stock
  const { error: productLinkError } = await sb.from('products').update({
    stock_item_id: stockItem.id
  }).eq('id', product.id);

  if (productLinkError) return toast(productLinkError.message);

  e.target.reset();
  await refreshAll();
  toast('Recette créée dans Recettes, Stock et Carte du Restaurant.');
});

document.getElementById('recipeItemForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');

  const recipeId = document.getElementById('recipeSelect').value;
  const stockId = document.getElementById('recipeStockItem').value;
  const qty = Number(document.getElementById('recipeIngredientQty').value || 0);
  const usageUnit = document.getElementById('recipeUsageUnit').value;

  const stockItem = cache.stock.find(s => String(s.id) === String(stockId));
  if (!stockItem) return toast('Ingrédient introuvable.');

  const stockUnit = stockItem.unit || '';
  const convertedQty = convertUsageToStockBase(qty, usageUnit, stockUnit);
  const unitCost = Number(stockItem.unit_cost || 0);
  const lineCost = convertedQty * unitCost;

  const { error } = await sb.from('recipe_items').insert({
    recipe_id: recipeId,
    stock_item_id: stockId,
    ingredient_name: stockItem.name,
    quantity: convertedQty,
    unit_cost: unitCost,
    line_cost: lineCost
  });

  if (error) return toast(error.message);

  await recomputeRecipeCost(recipeId);
  e.target.reset();
  await refreshAll();
  toast('Ingrédient ajouté.');
});

function updateCompanySelect() {
  const payment = window.lastPaymentType || '';
  const select = document.getElementById('companySelect');

  if (payment === 'company') {
    select.style.display = 'block';
    loadCompanies();
  } else {
    select.style.display = 'none';
  }
}
async function loadCompanies() {
  const { data } = await sb.from('company_contracts').select('*').eq('active', true);

  const select = document.getElementById('companySelect');
  select.innerHTML = data.map(c => `
    <option value="${c.id}">${c.company_name}</option>
  `).join('');
}
async function addCompany() {
  const payload = {
    company_name: document.getElementById('companyName').value,
    contact_name: document.getElementById('companyContact').value,
    phone: document.getElementById('companyPhone').value,
    email: document.getElementById('companyEmail').value
  };

  await sb.from('company_contracts').insert(payload);
  await loadCompaniesList();
  loadCompaniesList();
}

async function loadCompaniesList() {
  const { data, error } = await sb
    .from('company_contracts')
    .select('*')
    .order('company_name');

  if (error) {
    console.error('loadCompaniesList error:', error);
    return toast(error.message);
  }

  const rows = document.getElementById('companyRows');
  if (!rows) return;

  rows.innerHTML = (data || []).map(c => `
    <tr>
      <td>${c.company_name || ''}</td>
      <td>${c.contact_name || ''}</td>
      <td>${c.phone || ''}</td>
      <td>${c.email || ''}</td>
      <td>${euro(c.credit_limit || 0)}</td>
      <td>${c.active ? 'Oui' : 'Non'}</td>
      <td>
        <button class="secondary" onclick="deleteCompany('${c.id}')">Supprimer</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7">Aucune entreprise</td></tr>';
}
async function renderContracts() {
  const contractsRows = document.getElementById('contractsRows');
  const contractSalesRows = document.getElementById('contractSalesRows');

  if (!contractsRows || !contractSalesRows) return;

  const { data, error } = await sb
    .from('sales')
    .select('*')
    .eq('payment_method', 'company') // 
    .order('sale_date', { ascending: false });

  if (error) {
    console.error('renderContracts error:', error);
    contractsRows.innerHTML = '<tr><td colspan="4">Erreur chargement contrats</td></tr>';
    contractSalesRows.innerHTML = '<tr><td colspan="8">Erreur chargement historique</td></tr>';
    return;
  }

  const sales = data || [];

  const grouped = {};
  for (const sale of sales) {
    const key = sale.company_contract_name || 'Sans entreprise';

    if (!grouped[key]) {
      grouped[key] = {
        total: 0,
        payment_status: 'non_paye'
      };
    }

    grouped[key].total += Number(sale.total_after_discount || 0);

    if ((sale.payment_status || 'non_paye') === 'paye') {
      grouped[key].payment_status = 'paye';
    }
  }

  contractsRows.innerHTML = Object.keys(grouped).length
    ? Object.entries(grouped).map(([company, info]) => `
        <tr>
          <td>${company}</td>
          <td>${euro(info.total)}</td>
          <td>
            <span class="tag ${info.payment_status === 'paye' ? 'ok' : 'low'}">
              ${info.payment_status === 'paye' ? 'Payé' : 'Non payé'}
            </span>
          </td>
          <td>
            <button class="secondary" onclick="markCompanyAsPaid('${company.replace(/'/g, "\\'")}')">Payé</button>
            <button class="secondary" onclick="markCompanyAsUnpaid('${company.replace(/'/g, "\\'")}')">Non payé</button>
            <button class="secondary" onclick="generateInvoiceByCompany('${company.replace(/'/g, "\\'")}')">Facturer PDF</button>
            <button class="secondary" onclick="deleteCompanySales('${company.replace(/'/g, "\\'")}')">Supprimer</button>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="4">Aucune vente entreprise</td></tr>';

  contractSalesRows.innerHTML = sales.length
    ? sales.map(s => `
        <tr>
          <td>${s.sale_date || ''}</td>
          <td>${s.company_contract_name || ''}</td>
          <td>${s.product_name || s.product_id || ''}</td>
          <td>${s.quantity || 0}</td>
          <td>${euro(s.total_after_discount || 0)}</td>
          <td>${s.billing_status || ''}</td>
          <td>
            <span class="tag ${(s.payment_status || 'non_paye') === 'paye' ? 'ok' : 'low'}">
              ${(s.payment_status || 'non_paye') === 'paye' ? 'Payé' : 'Non payé'}
            </span>
          </td>
          <td>
            <button class="secondary" onclick="deleteContractSale('${s.id}')">Supprimer</button>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="8">Aucune vente entreprise</td></tr>';
}
async function generateInvoiceByCompany(companyName) {
  const { data: sales, error } = await sb
    .from('sales')
    .select('*')
    .eq('company_contract_name', companyName)
    .eq('billing_status', 'a_facturer')
    .order('sale_date', { ascending: true });

  if (error) return toast(error.message);
  if (!sales || !sales.length) return toast('Aucune vente à facturer.');

  const total = sales.reduce((sum, s) => sum + Number(s.total_after_discount || 0), 0);

  // Création facture en base
  const { data: invoice, error: invoiceError } = await sb
    .from('invoices')
    .insert({
      company_name: companyName,
      start_date: sales[0]?.sale_date || todayStr(),
      end_date: sales[sales.length - 1]?.sale_date || todayStr(),
      total,
      status: 'generated'
    })
    .select()
    .single();

  if (invoiceError) return toast(invoiceError.message);

  // Mise à jour ventes
  for (const sale of sales) {
    const { error: updateError } = await sb
      .from('sales')
      .update({
        billing_status: 'facture_generee',
        invoice_id: invoice.id
      })
      .eq('id', sale.id);

    if (updateError) return toast(updateError.message);
  }

  openInvoicePdfWindow(companyName, sales, total, invoice);

  await renderContracts();
  toast('Facture générée ✅');
}
function openInvoicePdfWindow(companyName, sales, total, invoice) {
  const invoiceNumber = invoice?.id ? String(invoice.id).slice(0, 8).toUpperCase() : 'TEMP';
  const startDate = invoice?.start_date || '';
  const endDate = invoice?.end_date || '';
  const generatedAt = new Date().toLocaleDateString('fr-FR');

  const rows = sales.map(s => `
    <tr>
      <td>${s.sale_date || ''}</td>
      <td>${s.product_name || 'Produit'}</td>
      <td>${s.quantity || 0}</td>
      <td>${euro(s.unit_price || 0)}</td>
      <td>${Number(s.discount_percent || 0)}%</td>
      <td>${euro(s.total_after_discount || 0)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Facture ${invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 30px;
          color: #1f140d;
          background: #fff;
        }

        .invoice-wrap {
          max-width: 1100px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
          border-bottom: 2px solid #d6b26a;
          padding-bottom: 18px;
        }

        .brand {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .brand img {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 14px;
          border: 2px solid #b88a2a;
        }

        .brand-title {
          font-size: 30px;
          font-weight: 900;
          margin: 0;
          color: #2b1a10;
        }

        .brand-sub {
          margin-top: 6px;
          color: #7a6758;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .invoice-meta {
          text-align: right;
        }

        .invoice-meta h2 {
          margin: 0 0 10px;
          font-size: 28px;
          color: #6b4320;
        }

        .meta-line {
          margin: 4px 0;
          font-size: 14px;
        }

        .box {
          border: 1px solid #d9c08b;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 22px;
          background: #fffaf1;
        }

        .box h3 {
          margin: 0 0 10px;
          color: #5a351e;
          font-size: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 14px;
        }

        th, td {
          border: 1px solid #d9c08b;
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: linear-gradient(90deg, #7a4b2b, #9a6030);
          color: #fff4da;
          font-weight: 800;
        }

        tbody tr:nth-child(even) {
          background: #faf3e5;
        }

        .totals {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }

        .total-box {
          min-width: 320px;
          border: 2px solid #c79a3b;
          border-radius: 16px;
          padding: 18px 20px;
          background: linear-gradient(180deg, #fff8eb, #f2dfb5);
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .total-line.final {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #cfa95e;
          font-size: 22px;
          font-weight: 900;
          color: #2b1a10;
        }

        .footer-note {
          margin-top: 28px;
          font-size: 13px;
          color: #7a6758;
        }

        .actions {
          margin-top: 24px;
          display: flex;
          gap: 10px;
        }

        .actions button {
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
        }

        .btn-print {
          background: #b88a2a;
          color: white;
        }

        .btn-close {
          background: #ddd;
          color: #222;
        }

        @media print {
          .actions { display: none; }
          body { padding: 0; }
          .invoice-wrap { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-wrap">
        <div class="topbar">
          <div class="brand">
            <img src="/logo-three-hawker-boys.png" alt="Logo">
            <div>
              <h1 class="brand-title">Three Hawker Boys</h1>
              <div class="brand-sub">Irish Pub Premium</div>
            </div>
          </div>

          <div class="invoice-meta">
            <h2>FACTURE</h2>
            <div class="meta-line"><strong>N° :</strong> ${invoiceNumber}</div>
            <div class="meta-line"><strong>Date :</strong> ${generatedAt}</div>
            <div class="meta-line"><strong>Période :</strong> ${startDate} → ${endDate}</div>
          </div>
        </div>

        <div class="box">
          <h3>Entreprise facturée</h3>
          <div><strong>${companyName}</strong></div>
        </div>

        <div class="box">
          <h3>Détail des ventes</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>Remise</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="total-box">
            <div class="total-line">
              <span>Nombre de lignes</span>
              <strong>${sales.length}</strong>
            </div>
            <div class="total-line final">
              <span>Total à payer</span>
              <strong>${euro(total)}</strong>
            </div>
          </div>
        </div>

        <div class="footer-note">
          Merci de votre confiance.<br>
          Facture générée automatiquement par le système Three Hawker Boys.
        </div>

        <div class="actions">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
          <button class="btn-close" onclick="window.close()">Fermer</button>
        </div>
      </div>

      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=1100,height=850');

  if (!win) {
    toast('Popup bloquée. Autorise les popups pour générer le PDF.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}
function openInvoiceWindow(companyName, sales, total, invoice) {
  const invoiceNumber = invoice?.id ? String(invoice.id).slice(0, 8).toUpperCase() : 'TEMP';
  const startDate = invoice?.start_date || '';
  const endDate = invoice?.end_date || '';

  const rows = sales.map(s => `
    <tr>
      <td>${s.sale_date || ''}</td>
      <td>${s.product_name || s.company_contract_name || s.product_id || ''}</td>
      <td>${s.quantity || 0}</td>
      <td>${euro(s.unit_price || 0)}</td>
      <td>${euro(s.total_after_discount || 0)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Facture ${invoiceNumber}</title>
      <style>
        body{
          font-family:Arial,sans-serif;
          margin:40px;
          color:#1f140d;
        }
        h1,h2,h3{
          margin:0 0 12px;
        }
        .top{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          margin-bottom:28px;
        }
        .brand{
          font-size:28px;
          font-weight:900;
        }
        .muted{
          color:#6f6358;
        }
        .box{
          border:1px solid #d9c08b;
          border-radius:14px;
          padding:16px;
          margin-bottom:18px;
        }
        table{
          width:100%;
          border-collapse:collapse;
          margin-top:14px;
        }
        th,td{
          border:1px solid #d9c08b;
          padding:10px;
          text-align:left;
        }
        th{
          background:#f3e1b3;
        }
        .total{
          margin-top:18px;
          text-align:right;
          font-size:22px;
          font-weight:900;
        }
        .actions{
          margin-top:22px;
          display:flex;
          gap:10px;
        }
        button{
          padding:12px 16px;
          border:none;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }
        .print{
          background:#b88a2a;
          color:#fff;
        }
        .close{
          background:#ddd;
          color:#222;
        }
        @media print{
          .actions{display:none}
          body{margin:20px}
        }
      </style>
    </head>
    <body>
      <div class="top">
        <div>
          <div class="brand">Three Hawer Boys</div>
          <div class="muted">Irish Pub Premium</div>
        </div>
        <div>
          <h2>Facture</h2>
          <div><strong>N° :</strong> ${invoiceNumber}</div>
          <div><strong>Période :</strong> ${startDate} → ${endDate}</div>
        </div>
      </div>

      <div class="box">
        <h3>Entreprise</h3>
        <div>${companyName}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            <th>Qté</th>
            <th>Prix unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="total">Total à payer : ${euro(total)}</div>

      <div class="actions">
        <button class="print" onclick="window.print()">🖨️ Imprimer / PDF</button>
        <button class="close" onclick="window.close()">Fermer</button>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) {
    toast('Popup bloquée. Autorise les popups pour imprimer la facture.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}
function showInvoice(sales, total, company) {
  const win = window.open('', '', 'width=800,height=600');

  win.document.write(`
    <h2>Facture - ${company}</h2>
    <table border="1" style="width:100%;border-collapse:collapse">
      <tr><th>Produit</th><th>Qté</th><th>Total</th></tr>
      ${sales.map(s => `
        <tr>
          <td>${s.product_id}</td>
          <td>${s.quantity}</td>
          <td>${euro(s.total_after_discount)}</td>
        </tr>
      `).join('')}
    </table>
    <h3>Total: ${euro(total)}</h3>
  `);

  win.print();
}
async function deleteCompany(id) {
  if (!confirm('Supprimer cette entreprise ?')) return;

  const { error } = await sb.from('company_contracts').delete().eq('id', id);
  if (error) return toast(error.message);

  await loadCompaniesList();
  await loadCompanies();
  toast('Entreprise supprimée.');
}
window.deleteCompany = deleteCompany;

async function markCompanyAsPaid(companyName) {
  const { error } = await sb
    .from('sales')
    .update({ payment_status: 'paye' })
    .eq('company_contract_name', companyName);

  if (error) return toast(error.message);

  await refreshAll();      // 🔥 recalcul dashboard
  await renderContracts(); // refresh UI

  toast(`Entreprise "${companyName}" marquée comme PAYÉE ✅`);
}
window.markCompanyAsPaid = markCompanyAsPaid;

async function markCompanyAsPaid(companyName) {
  const { error } = await sb
    .from('sales')
    .update({ payment_status: 'paye' })
    .eq('company_contract_name', companyName);

  if (error) return toast(error.message);

  await refreshAll();      // 🔥 recalcul dashboard
  await renderContracts(); // refresh UI

  toast(`Entreprise "${companyName}" marquée comme PAYÉE ✅`);
}
window.markCompanyAsPaid = markCompanyAsPaid;

async function deleteContractSale(id) {
  if (!confirm('Supprimer cette vente entreprise ?')) return;

  const { error } = await sb
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) return toast(error.message);

  await refreshAll();
  await renderContracts();
  toast('Vente entreprise supprimée.');
}
window.deleteContractSale = deleteContractSale;
async function deleteCompanySales(companyName) {
  if (!confirm(`Supprimer toutes les ventes de l'entreprise "${companyName}" ?`)) return;

  const { error } = await sb
    .from('sales')
    .delete()
    .eq('company_contract_name', companyName);

  if (error) return toast(error.message);

  await refreshAll();
  await renderContracts();
  toast(`Toutes les ventes de "${companyName}" ont été supprimées.`);
}
window.deleteCompanySales = deleteCompanySales;

document.getElementById('caisseService')?.addEventListener('change', updateCompanySelect);
document.getElementById('payCarte')?.addEventListener('click', () => {
  validateCart('Carte');
});
document.getElementById('payOffert')?.addEventListener('click', () => {
  if (!isDirectionRole(currentProfile?.role)) return toast('Accès refusé.');
  validateCart('Offert');
});
document.getElementById('payCompany')?.addEventListener('click', async () => {
  const box = document.getElementById('companyContractBox');
  if (box) {
    box.classList.remove('hidden'); // affiche le bloc entreprise
  }
  await loadCompanies(); // charge les entreprises
});

async function applyContestRewardCode() {
  const input = document.getElementById('contestRewardCode');
  const info = document.getElementById('contestRewardInfo');

  const code = String(input?.value || '').trim().toUpperCase();
  if (!code) return toast('Entre un code concours.');

  const service = document.getElementById('caisseService')?.value || 'Bar';

  const subtotal = (Array.isArray(caisseCart) ? caisseCart : []).reduce((sum, item) => {
    if (item?.isMenu) {
      return sum + (Number(item.fixedPrice || 0) * Number(item.qty || 0));
    }
    const price = pickServicePrice(item.product, service);
    return sum + (Number(price || 0) * Number(item.qty || 0));
  }, 0);

  const { data, error } = await sb.functions.invoke('redeem-reward-code', {
    body: {
      code,
      cart_total: subtotal
    }
  });

  if (error) return toast(error.message || 'Erreur code concours');
  if (data?.error) return toast(data.error);
  if (!data?.reward) return toast('Code invalide');

  activeContestReward = data.reward;

  if (info) {
    info.textContent = `${activeContestReward.message} — Code ${activeContestReward.code}`;
  }

  renderCart();
  toast('Code concours appliqué ✅');
}
window.applyContestRewardCode = applyContestRewardCode;
document.getElementById('menuRecipe')?.addEventListener('change', updateMenuPreview);
document.getElementById('menuDrink')?.addEventListener('change', updateMenuPreview);
document.getElementById('menuExtra')?.addEventListener('change', updateMenuPreview);
document.getElementById('recipeStockItem')?.addEventListener('change', updateRecipeIngredientCost);
document.getElementById('recipeIngredientQty')?.addEventListener('input', updateRecipeIngredientCost);
document.getElementById('recipeUsageUnit')?.addEventListener('change', updateRecipeIngredientCost);
document.getElementById('recipeDetailSelect')?.addEventListener('change', renderRecipeItems);
document.getElementById('globalDiscount')?.addEventListener('change', renderCart);
document.getElementById('deliveryZone')?.addEventListener('change', renderCart);
document.getElementById('vipSelect')?.addEventListener('change', renderCart);
document.getElementById('vipHistorySearch')?.addEventListener('input', renderVipHistory);
document.getElementById('logoutBtn')?.addEventListener('click', async () => { await sb.auth.signOut(); currentProfile = null; showLogin(); });
document.querySelectorAll('#menu button[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
document.getElementById('stockSearch')?.addEventListener('input', renderStock);
document.getElementById('directorySearch')?.addEventListener('input', renderDirectory);
document.getElementById('salesSearch')?.addEventListener('input', renderSales);
if (document.getElementById('saleDate')) document.getElementById('saleDate').value = todayStr();
if (document.getElementById('purchaseDate')) document.getElementById('purchaseDate').value = todayStr();
if (document.getElementById('expDate')) document.getElementById('expDate').value = todayStr();
sb.auth.onAuthStateChange((_event, session) => { console.log('AUTH EVENT =', _event, session ? 'session OK' : 'no session'); });
loadSession().catch(err => {
  console.error('LOAD SESSION ERROR', err);
  showLogin();
});
updateVipFormFields();
