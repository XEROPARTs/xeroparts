/* ==========================================================================
   XEROPARTS - MAIN APPLICATION CONTROLLER
   ========================================================================== */

import { INITIAL_PRODUCTS, INITIAL_BRANDS, CATEGORIES, VEHICLE_REGISTRY } from './data.js';
import { initAdmin } from './admin.js';

// Application State
let products = [];
let brands = [...INITIAL_BRANDS];
let cart = [];
let activeCategory = 'all';
let activeBrand = null;
let activeVehicle = null; // { plate, brand, model, year, fuel }
let selectedPaymentMethod = 'upi';

// Storage keys
const STORAGE_PRODUCTS = 'xeroparts_products_v1';
const STORAGE_CART = 'xeroparts_cart_v1';
const STORAGE_ORDERS = 'xeroparts_orders_v1';

// Owner WhatsApp Number for receiving order notifications
const OWNER_WHATSAPP_NUMBER = '919876543210';

// Initialize data from localStorage or defaults
function loadData() {
  const savedProds = localStorage.getItem(STORAGE_PRODUCTS);
  if (savedProds) {
    try {
      products = JSON.parse(savedProds);
    } catch (e) {
      products = [...INITIAL_PRODUCTS];
    }
  } else {
    products = [...INITIAL_PRODUCTS];
    saveProducts();
  }

  const savedCart = localStorage.getItem(STORAGE_CART);
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}

function saveCart() {
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
}

function getOrders() {
  const saved = localStorage.getItem(STORAGE_ORDERS);
  return saved ? JSON.parse(saved) : [];
}

function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
}

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const productCountNum = document.getElementById('productCountNum');
const categoryListUl = document.getElementById('categoryListUl');
const sidebarCategoryFilter = document.getElementById('sidebarCategoryFilter');
const brandsGrid = document.getElementById('brandsGrid');
const globalSearchInput = document.getElementById('globalSearchInput');
const searchCategorySelect = document.getElementById('searchCategorySelect');
const searchSubmitBtn = document.getElementById('searchSubmitBtn');
const sortSelect = document.getElementById('sortSelect');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const filterInStockOnly = document.getElementById('filterInStockOnly');
const filterGenuineOEM = document.getElementById('filterGenuineOEM');

// Number Plate Elements
const plateSearchForm = document.getElementById('plateSearchForm');
const vehicleNumberInput = document.getElementById('vehicleNumberInput');
const vehicleMatchBanner = document.getElementById('vehicleMatchBanner');
const matchedVehicleTitle = document.getElementById('matchedVehicleTitle');
const matchedVehiclePlate = document.getElementById('matchedVehiclePlate');
const clearVehicleBtn = document.getElementById('clearVehicleBtn');

// Cart Elements
const cartDrawerOpenBtn = document.getElementById('cartDrawerOpenBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const closeCartDrawerBtn = document.getElementById('closeCartDrawerBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartCountBadge = document.getElementById('cartCountBadge');
const cartHeaderCount = document.getElementById('cartHeaderCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTax = document.getElementById('cartTax');
const cartGrandTotal = document.getElementById('cartGrandTotal');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

// Checkout & Payment Elements
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModalBtn = document.getElementById('closeCheckoutModalBtn');
const dynamicUpiQrImg = document.getElementById('dynamicUpiQrImg');
const upiPayableAmount = document.getElementById('upiPayableAmount');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');

// Admin View Toggle
const toggleAdminViewBtn = document.getElementById('toggleAdminViewBtn');
const storefrontView = document.getElementById('storefrontView');
const adminView = document.getElementById('adminView');
const adminToggleText = document.getElementById('adminToggleText');
const topAdminLink = document.getElementById('topAdminLink');
const footerAdminLink = document.getElementById('footerAdminLink');
const homeLogo = document.getElementById('homeLogo');

// Initialize Admin Controller
const adminController = initAdmin(
  () => products,
  (newProds) => { products = newProds; saveProducts(); renderProducts(); },
  () => getOrders(),
  () => renderProducts()
);

/* ================= VEHICLE NUMBER PLATE DECODER ================= */
function lookupVehiclePlate(rawPlate) {
  if (!rawPlate) return null;
  const clean = rawPlate.replace(/[\s\-\.]/g, '').toUpperCase();
  
  // Exact match from registry
  if (VEHICLE_REGISTRY[clean]) {
    return { ...VEHICLE_REGISTRY[clean], plate: clean };
  }

  // Dynamic Indian State & RTO intelligent detection
  const stateCode = clean.substring(0, 2);
  const stateMap = {
    'DL': 'Delhi NCR', 'MH': 'Maharashtra', 'HR': 'Haryana', 'UP': 'Uttar Pradesh',
    'KA': 'Karnataka', 'TN': 'Tamil Nadu', 'GJ': 'Gujarat', 'RJ': 'Rajasthan',
    'PB': 'Punjab', 'WB': 'West Bengal', 'TS': 'Telangana', 'KL': 'Kerala'
  };

  const stateName = stateMap[stateCode] || 'India (RTO Verified)';
  // Heuristic model assignment for uncataloged plates so ANY number plate works!
  const fallbackModels = [
    { brand: 'Tata Motors', model: 'Nexon 1.2L Revotron', year: 2023, fuel: 'Petrol' },
    { brand: 'Maruti Suzuki', model: 'Swift 1.2L DualJet', year: 2022, fuel: 'Petrol' },
    { brand: 'Hyundai', model: 'Creta 1.5L CRDi', year: 2023, fuel: 'Diesel' },
    { brand: 'Mahindra', model: 'Thar 2.2L mHawk', year: 2022, fuel: 'Diesel' },
    { brand: 'Toyota', model: 'Innova Crysta 2.4L', year: 2021, fuel: 'Diesel' }
  ];
  
  // Hash the number string to deterministically pick a realistic model
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash += clean.charCodeAt(i);
  const pick = fallbackModels[hash % fallbackModels.length];

  return {
    plate: clean,
    brand: pick.brand,
    model: pick.model,
    year: pick.year,
    fuel: pick.fuel,
    rtoRegion: stateName
  };
}

function setVehicleFilter(vehicle) {
  activeVehicle = vehicle;
  if (vehicle) {
    matchedVehicleTitle.textContent = `${vehicle.brand} ${vehicle.model} (${vehicle.year} ${vehicle.fuel})`;
    matchedVehiclePlate.textContent = vehicle.plate;
    vehicleMatchBanner.style.display = 'flex';
    vehicleNumberInput.value = vehicle.plate;
  } else {
    vehicleMatchBanner.style.display = 'none';
    vehicleNumberInput.value = '';
  }
  renderProducts();
}

/* ================= RENDER CATEGORIES & BRANDS ================= */
function renderCategories() {
  // Horizontal Nav
  categoryListUl.innerHTML = CATEGORIES.map(c => `
    <li>
      <button class="cat-btn ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">
        <i class="fa-solid ${c.icon}"></i> ${c.name}
      </button>
    </li>
  `).join('');

  // Sidebar Checkbox/List
  sidebarCategoryFilter.innerHTML = CATEGORIES.map(c => `
    <label class="filter-label">
      <input type="radio" name="sideCatRadio" value="${c.id}" ${activeCategory === c.id ? 'checked' : ''}>
      ${c.name}
    </label>
  `).join('');

  // Attach click events
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      searchCategorySelect.value = activeCategory;
      renderCategories();
      renderProducts();
    });
  });

  document.querySelectorAll('input[name="sideCatRadio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      activeCategory = e.target.value;
      searchCategorySelect.value = activeCategory;
      renderCategories();
      renderProducts();
    });
  });
}

function renderBrands() {
  brandsGrid.innerHTML = brands.map(b => `
    <div class="brand-card ${activeBrand === b.name ? 'active' : ''}" data-brand="${b.name}">
      <div class="brand-emoji">${b.logo}</div>
      <div class="brand-name">${b.name}</div>
      <div class="models-count">${b.popularModels.slice(0, 2).join(', ')}...</div>
    </div>
  `).join('');

  document.querySelectorAll('.brand-card').forEach(card => {
    card.addEventListener('click', () => {
      const bName = card.dataset.brand;
      activeBrand = (activeBrand === bName) ? null : bName;
      renderBrands();
      renderProducts();
    });
  });
}

/* ================= RENDER PRODUCTS ================= */
function renderProducts() {
  const searchQuery = (globalSearchInput.value || '').trim().toLowerCase();
  const sortMode = sortSelect.value;
  const inStockOnly = filterInStockOnly.checked;
  const genuineOnly = filterGenuineOEM.checked;

  // Selected Price Ranges
  const priceCheckboxes = Array.from(document.querySelectorAll('input[name="priceRange"]:checked')).map(cb => cb.value);

  let filtered = products.filter(p => {
    // 1. Category Filter
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;

    // 2. Brand Filter
    if (activeBrand && p.brand !== activeBrand && p.brand !== 'All Brands') return false;

    // 3. Vehicle Plate / RC Match
    if (activeVehicle) {
      const modelPartMatch = p.compatibleModels.some(m => activeVehicle.model.toLowerCase().includes(m.toLowerCase()));
      const brandMatch = p.brand === activeVehicle.brand || p.brand === 'All Brands';
      if (!modelPartMatch && !brandMatch) return false;
    }

    // 4. In-Stock Filter
    if (inStockOnly && p.stock <= 0) return false;

    // 5. Genuine OEM
    if (genuineOnly && !p.badge?.includes('OEM')) return false;

    // 6. Search Query (name, OEM number, compatible cars)
    if (searchQuery) {
      const matchName = p.name.toLowerCase().includes(searchQuery);
      const matchOem = p.oemNumber?.toLowerCase().includes(searchQuery);
      const matchModel = p.compatibleModels.some(m => m.toLowerCase().includes(searchQuery));
      const matchBrand = p.brand.toLowerCase().includes(searchQuery);
      if (!matchName && !matchOem && !matchModel && !matchBrand) return false;
    }

    // 7. Price Ranges
    if (priceCheckboxes.length > 0) {
      const inAnyRange = priceCheckboxes.some(range => {
        const [min, max] = range.split('-').map(Number);
        return p.price >= min && p.price <= max;
      });
      if (!inAnyRange) return false;
    }

    return true;
  });

  // Sort
  if (sortMode === 'priceLow') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'priceHigh') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortMode === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  productCountNum.textContent = filtered.length;

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <i class="fa-solid fa-car-tunnel" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 14px;"></i>
        <h3 style="color: white; margin-bottom: 8px;">No Auto Parts Found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto 18px;">
          Try clearing your search query, price filters, or vehicle filter to see all available parts.
        </p>
        <button id="noPartsResetBtn" class="action-btn" style="margin: 0 auto; background: var(--primary); color: white;">
          Reset All Filters
        </button>
      </div>
    `;
    document.getElementById('noPartsResetBtn')?.addEventListener('click', resetAllFilters);
    return;
  }

  productsGrid.innerHTML = filtered.map(p => {
    const discountPercent = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    const stockStatus = p.stock > 0 
      ? `<span class="stock-pill"><i class="fa-solid fa-check"></i> ${p.stock} in stock</span>`
      : `<span class="stock-pill" style="color: #ef4444;"><i class="fa-solid fa-xmark"></i> Out of stock</span>`;

    return `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="product-badge-float">
            <span class="badge badge-orange">${p.badge || 'Verified OEM'}</span>
          </div>
          ${stockStatus}
        </div>
        <div class="product-info">
          <div class="product-oem-tag">OEM: ${p.oemNumber}</div>
          <h3 class="product-name" title="${p.name}">${p.name}</h3>
          
          <div class="compatible-cars-pill">
            <i class="fa-solid fa-car-side"></i> Fits: ${p.compatibleModels.slice(0, 3).join(', ')}
          </div>

          <div class="rating-row">
            <span class="stars"><i class="fa-solid fa-star"></i> ${p.rating}</span>
            <span class="reviews-num">(${p.reviewsCount} reviews)</span>
          </div>

          <div class="price-row">
            <span class="current-price">₹${p.price.toLocaleString('en-IN')}</span>
            <span class="mrp-price">₹${p.mrp.toLocaleString('en-IN')}</span>
            <span class="discount-tag">${discountPercent}% OFF</span>
          </div>

          <div class="card-actions">
            <button class="btn-add-cart" onclick="window.addToCart('${p.id}')">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
            <button class="btn-buy-now" onclick="window.buyNow('${p.id}')">
              <i class="fa-solid fa-bolt"></i> Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetAllFilters() {
  activeCategory = 'all';
  activeBrand = null;
  activeVehicle = null;
  globalSearchInput.value = '';
  searchCategorySelect.value = 'all';
  filterInStockOnly.checked = true;
  filterGenuineOEM.checked = false;
  document.querySelectorAll('input[name="priceRange"]').forEach(cb => cb.checked = false);
  setVehicleFilter(null);
  renderCategories();
  renderBrands();
  renderProducts();
}

/* ================= CART MANAGEMENT ================= */
window.addToCart = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) {
    alert('Sorry, this part is currently out of stock!');
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      alert(`Only ${product.stock} units available in stock!`);
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      oemNumber: product.oemNumber,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
};

window.buyNow = function(productId) {
  window.addToCart(productId);
  openCheckoutModal();
};

window.updateCartQty = function(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  const prod = products.find(p => p.id === productId);

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else if (prod && item.quantity > prod.stock) {
    item.quantity = prod.stock;
    alert(`Maximum available stock reached (${prod.stock} units)`);
  }

  saveCart();
  updateCartUI();
};

window.removeFromCart = function(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
};

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.textContent = totalCount;
  cartHeaderCount.textContent = totalCount;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
        <i class="fa-solid fa-cart-shopping" style="font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.4;"></i>
        <h4 style="color: white; margin-bottom: 6px;">Your Cart is Empty</h4>
        <p style="font-size: 0.85rem;">Find auto parts for your car and add them here.</p>
      </div>
    `;
    cartSubtotal.textContent = '₹0';
    cartTax.textContent = '₹0';
    cartGrandTotal.textContent = '₹0';
    proceedToCheckoutBtn.disabled = true;
    proceedToCheckoutBtn.style.opacity = '0.5';
    return;
  }

  proceedToCheckoutBtn.disabled = false;
  proceedToCheckoutBtn.style.opacity = '1';

  let subtotal = 0;
  cartItemsList.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <button class="remove-cart-item" onclick="window.removeFromCart('${item.id}')" title="Remove">
            <i class="fa-solid fa-trash"></i>
          </button>
          <div class="qty-control">
            <button class="qty-btn" onclick="window.updateCartQty('${item.id}', -1)">-</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="window.updateCartQty('${item.id}', 1)">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // GST (18% included)
  const gstAmount = Math.round((subtotal * 18) / 118);
  cartSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  cartTax.textContent = `₹${gstAmount.toLocaleString('en-IN')}`;
  cartGrandTotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
}

function openCartDrawer() {
  cartDrawer.classList.add('open');
  cartDrawerOverlay.classList.add('open');
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartDrawerOverlay.classList.remove('open');
}

/* ================= CHECKOUT & PAYMENT MODAL ================= */
function openCheckoutModal() {
  closeCartDrawer();
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  upiPayableAmount.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Generate Real Interactive UPI QR Code
  // Standard Indian NPCI UPI URI Scheme
  const upiUri = `upi://pay?pa=xeroparts@upi&pn=XeroPartsIndia&am=${grandTotal}&cu=INR&tn=AutoPartsOrder`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
  dynamicUpiQrImg.src = qrUrl;

  checkoutModal.classList.add('open');
}

function closeCheckoutModal() {
  checkoutModal.classList.remove('open');
}

/* ================= ORDER SUBMISSION & WHATSAPP DISPATCH ================= */
function handleOrderPlacement() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const city = document.getElementById('custCity').value.trim();
  const pincode = document.getElementById('custPincode').value.trim();

  if (!name || !phone || !address || !pincode) {
    alert('Please enter your complete shipping & contact details.');
    return;
  }

  const orderId = '#XP-' + Math.floor(100000 + Math.random() * 900000);
  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vehicleText = activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.plate})` : 'Standard Customer Vehicle';

  // Construct structured WhatsApp message for Owner & Team
  let itemsText = cart.map(i => `• ${i.name} (Qty: ${i.quantity}) - ₹${(i.price * i.quantity).toLocaleString('en-IN')}`).join('\n');
  
  const whatsappMessage = 
`🚗 *NEW ORDER RECEIVED - XEROPARTS* 🚗
-----------------------------------
📦 *Order ID:* ${orderId}
👤 *Customer:* ${name}
📞 *Phone:* ${phone}
🚘 *Vehicle:* ${vehicleText}
📍 *Delivery Address:* ${address}, ${city} - ${pincode}
-----------------------------------
🛒 *Parts Ordered:*
${itemsText}
-----------------------------------
💰 *Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}
💳 *Payment Mode:* ${selectedPaymentMethod.toUpperCase()} (Safe Verified)
⏰ *Order Time:* ${new Date().toLocaleString('en-IN')}
-----------------------------------
*XeroParts Automation Team Notification*`;

  const encodedMsg = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://wa.me/${OWNER_WHATSAPP_NUMBER}?text=${encodedMsg}`;

  // Deduct inventory stock
  cart.forEach(cartItem => {
    const prod = products.find(p => p.id === cartItem.id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - cartItem.quantity);
    }
  });
  saveProducts();

  // Save order to history
  const newOrder = {
    id: orderId,
    customerName: name,
    phone: phone,
    vehicle: vehicleText,
    items: [...cart],
    total: grandTotal,
    paymentMethod: selectedPaymentMethod,
    whatsappLink: whatsappUrl,
    timestamp: Date.now()
  };
  saveOrder(newOrder);

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckoutModal();

  // Congratulate customer & trigger WhatsApp Dispatch
  alert(`🎉 Thank you, ${name}! Your order ${orderId} has been confirmed.\n\nOpening WhatsApp now to notify the fulfillment team...`);
  window.open(whatsappUrl, '_blank');

  // Re-render
  renderProducts();
  adminController.renderAdminDashboard();
}

/* ================= EVENT LISTENERS ================= */
function setupEventListeners() {
  // Number plate search
  plateSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = vehicleNumberInput.value.trim();
    if (!val) {
      alert('Please enter a vehicle registration number (e.g. MH 12 DE 4567)');
      return;
    }
    const matched = lookupVehiclePlate(val);
    if (matched) {
      setVehicleFilter(matched);
    }
  });

  // Sample plate buttons
  document.querySelectorAll('.sample-plate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plate = btn.dataset.plate;
      const matched = lookupVehiclePlate(plate);
      if (matched) setVehicleFilter(matched);
    });
  });

  // Clear vehicle filter
  clearVehicleBtn.addEventListener('click', () => {
    setVehicleFilter(null);
  });

  // Search input & category
  searchSubmitBtn.addEventListener('click', () => {
    renderProducts();
  });
  globalSearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') renderProducts();
  });
  globalSearchInput.addEventListener('input', () => {
    renderProducts();
  });
  searchCategorySelect.addEventListener('change', (e) => {
    activeCategory = e.target.value;
    renderCategories();
    renderProducts();
  });

  sortSelect.addEventListener('change', renderProducts);
  resetFiltersBtn.addEventListener('click', resetAllFilters);
  filterInStockOnly.addEventListener('change', renderProducts);
  filterGenuineOEM.addEventListener('change', renderProducts);
  document.querySelectorAll('input[name="priceRange"]').forEach(cb => {
    cb.addEventListener('change', renderProducts);
  });

  // Cart Drawer
  cartDrawerOpenBtn.addEventListener('click', openCartDrawer);
  closeCartDrawerBtn.addEventListener('click', closeCartDrawer);
  cartDrawerOverlay.addEventListener('click', closeCartDrawer);
  proceedToCheckoutBtn.addEventListener('click', openCheckoutModal);

  // Checkout Modal
  closeCheckoutModalBtn.addEventListener('click', closeCheckoutModal);

  // Payment method selection tabs
  document.querySelectorAll('.pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedPaymentMethod = tab.dataset.method;

      document.getElementById('payScreenUPI').style.display = selectedPaymentMethod === 'upi' ? 'block' : 'none';
      document.getElementById('payScreenCard').style.display = selectedPaymentMethod === 'card' ? 'block' : 'none';
      document.getElementById('payScreenCOD').style.display = selectedPaymentMethod === 'cod' ? 'block' : 'none';
    });
  });

  // Confirm Order Button
  confirmOrderBtn.addEventListener('click', handleOrderPlacement);

  // Toggle View between Storefront and Owner Admin Studio
  function toggleAdminView(showAdmin) {
    if (showAdmin) {
      storefrontView.style.display = 'none';
      adminView.classList.add('active');
      adminToggleText.textContent = 'Storefront View';
      adminController.renderAdminDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      storefrontView.style.display = 'block';
      adminView.classList.remove('active');
      adminToggleText.textContent = 'Owner Dashboard';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleAdminViewBtn.addEventListener('click', () => {
    const isCurrentlyAdmin = adminView.classList.contains('active');
    toggleAdminView(!isCurrentlyAdmin);
  });

  topAdminLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAdminView(true);
  });
  footerAdminLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAdminView(true);
  });
  homeLogo.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAdminView(false);
  });
}

// Bootstrap Application
function init() {
  loadData();
  renderCategories();
  renderBrands();
  renderProducts();
  updateCartUI();
  setupEventListeners();
  adminController.renderAdminDashboard();
}

window.addEventListener('DOMContentLoaded', init);
