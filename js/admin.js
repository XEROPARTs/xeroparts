/* ==========================================================================
   XEROPARTS - OWNER STUDIO & PROFIT / STOCK ANALYTICS
   ========================================================================== */

export function initAdmin(getProducts, setProducts, getOrders, onCatalogUpdate) {
  const kpiTotalRevenue = document.getElementById('kpiTotalRevenue');
  const kpiNetProfit = document.getElementById('kpiNetProfit');
  const kpiMarginPercent = document.getElementById('kpiMarginPercent');
  const kpiTotalOrders = document.getElementById('kpiTotalOrders');
  const kpiTotalStockUnits = document.getElementById('kpiTotalStockUnits');
  const kpiLowStockWarning = document.getElementById('kpiLowStockWarning');

  const inventoryTableBody = document.getElementById('inventoryTableBody');
  const profitAnalysisTableBody = document.getElementById('profitAnalysisTableBody');
  const ordersTableBody = document.getElementById('ordersTableBody');

  const settingGatewayFee = document.getElementById('settingGatewayFee');
  const settingHandlingFee = document.getElementById('settingHandlingFee');
  const settingShippingCost = document.getElementById('settingShippingCost');
  const recalculateProfitBtn = document.getElementById('recalculateProfitBtn');

  // Subtabs switching
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;

      document.getElementById('tabInventory').style.display = tabId === 'tabInventory' ? 'block' : 'none';
      document.getElementById('tabProfitFee').style.display = tabId === 'tabProfitFee' ? 'block' : 'none';
      document.getElementById('tabOrders').style.display = tabId === 'tabOrders' ? 'block' : 'none';
    });
  });

  if (recalculateProfitBtn) {
    recalculateProfitBtn.addEventListener('click', () => {
      renderAdminDashboard();
    });
  }

  // Export Catalog JSON
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const products = getProducts();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `xeroparts_catalog_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Add New Part Modal
  const addNewPartModalBtn = document.getElementById('addNewPartModalBtn');
  const addPartModal = document.getElementById('addPartModal');
  const closeAddPartModalBtn = document.getElementById('closeAddPartModalBtn');
  const addNewPartForm = document.getElementById('addNewPartForm');

  if (addNewPartModalBtn && addPartModal) {
    addNewPartModalBtn.addEventListener('click', () => {
      addPartModal.classList.add('open');
    });
  }
  if (closeAddPartModalBtn && addPartModal) {
    closeAddPartModalBtn.addEventListener('click', () => {
      addPartModal.classList.remove('open');
    });
  }

  if (addNewPartForm) {
    addNewPartForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const products = getProducts();
      const newPart = {
        id: 'XP-' + Math.floor(1000 + Math.random() * 9000),
        name: document.getElementById('newPartName').value.trim(),
        category: document.getElementById('newPartCategory').value,
        brand: document.getElementById('newPartBrand').value,
        compatibleModels: document.getElementById('newPartModels').value.split(',').map(s => s.trim()),
        oemNumber: document.getElementById('newPartOem').value.trim() || 'OEM-GEN-' + Math.floor(1000 + Math.random()*9000),
        costPrice: parseFloat(document.getElementById('newPartCost').value) || 0,
        price: parseFloat(document.getElementById('newPartPrice').value) || 0,
        mrp: Math.round((parseFloat(document.getElementById('newPartPrice').value) || 0) * 1.3),
        stock: parseInt(document.getElementById('newPartStock').value) || 10,
        rating: 4.8,
        reviewsCount: 1,
        badge: 'New Arrival',
        warranty: '1 Year Warranty',
        image: document.getElementById('newPartImage').value || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
        description: document.getElementById('newPartDesc').value || 'Genuine OEM replacement part for optimal vehicle performance.'
      };

      products.unshift(newPart);
      setProducts(products);
      addPartModal.classList.remove('open');
      addNewPartForm.reset();
      renderAdminDashboard();
      if (onCatalogUpdate) onCatalogUpdate();
      alert(`Success! "${newPart.name}" has been added to XeroParts live inventory.`);
    });
  }

  // Render Admin Dashboard
  function renderAdminDashboard() {
    const products = getProducts();
    const orders = getOrders();
    const feePercent = parseFloat(settingGatewayFee?.value || 2.0) / 100;

    // Financial Metrics
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let potentialRevenue = 0;
    let potentialCost = 0;

    products.forEach(p => {
      totalStockUnits += (p.stock || 0);
      if (p.stock <= 5) lowStockCount++;
      potentialRevenue += (p.price * (p.stock || 0));
      potentialCost += ((p.costPrice || p.price * 0.7) * (p.stock || 0));
    });

    let liveOrderRevenue = 0;
    let liveOrderCost = 0;
    orders.forEach(o => {
      liveOrderRevenue += (o.total || 0);
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const prod = products.find(p => p.id === item.id);
          const cp = prod ? (prod.costPrice || prod.price * 0.7) : (item.price * 0.7);
          liveOrderCost += (cp * item.quantity);
        });
      }
    });

    // If no orders yet, display projected potential store metrics with clean indicators
    const displayRevenue = liveOrderRevenue > 0 ? liveOrderRevenue : potentialRevenue;
    const gatewayDeduction = displayRevenue * feePercent;
    const estimatedProfit = liveOrderRevenue > 0 
      ? (liveOrderRevenue - liveOrderCost - gatewayDeduction) 
      : (potentialRevenue - potentialCost - gatewayDeduction);
    const marginPercent = displayRevenue > 0 ? ((estimatedProfit / displayRevenue) * 100).toFixed(1) : '28.5';

    kpiTotalRevenue.textContent = `₹${displayRevenue.toLocaleString('en-IN')}`;
    kpiNetProfit.textContent = `₹${Math.round(estimatedProfit).toLocaleString('en-IN')}`;
    kpiMarginPercent.innerHTML = `<i class="fa-solid fa-coins"></i> ${marginPercent}% Net Profit Margin`;
    kpiTotalOrders.textContent = orders.length;
    kpiTotalStockUnits.textContent = `${totalStockUnits} Units`;

    if (lowStockCount > 0) {
      kpiLowStockWarning.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> ${lowStockCount} Parts in Low Stock (<5)</span>`;
    } else {
      kpiLowStockWarning.innerHTML = `<span style="color: #10b981;"><i class="fa-solid fa-check"></i> All Stock Levels Healthy</span>`;
    }

    // Render Table 1: Inventory
    inventoryTableBody.innerHTML = products.map(p => {
      const cp = p.costPrice || Math.round(p.price * 0.7);
      const grossProfit = p.price - cp;
      const margin = ((grossProfit / p.price) * 100).toFixed(1);
      const stockBadge = p.stock <= 5 
        ? `<span class="badge badge-red">${p.stock} (Low)</span>` 
        : `<span class="badge badge-green">${p.stock} Available</span>`;

      return `
        <tr>
          <td><span style="font-family: monospace; font-weight: bold; color: #38bdf8;">${p.id}</span></td>
          <td>
            <div style="font-weight: 700; color: white;">${p.name}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">${p.brand} • Fits: ${p.compatibleModels.join(', ')}</div>
          </td>
          <td><span class="badge badge-orange">${p.category.toUpperCase()}</span></td>
          <td>₹${cp.toLocaleString('en-IN')}</td>
          <td style="font-weight: bold; color: white;">₹${p.price.toLocaleString('en-IN')}</td>
          <td>
            <span style="color: #10b981; font-weight: bold;">+₹${grossProfit} (${margin}%)</span>
          </td>
          <td>${stockBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="action-btn" style="padding: 4px 8px; font-size: 0.78rem;" onclick="window.editPartStock('${p.id}')">
                <i class="fa-solid fa-pen-to-square"></i> Stock
              </button>
              <button class="action-btn" style="padding: 4px 8px; font-size: 0.78rem; color: #ef4444;" onclick="window.deletePart('${p.id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Table 2: Profit & Charges Analyzer
    profitAnalysisTableBody.innerHTML = products.map(p => {
      const cp = p.costPrice || Math.round(p.price * 0.7);
      const gwFee = Math.round(p.price * feePercent);
      const netPerUnit = p.price - cp - gwFee;
      const margin = ((netPerUnit / p.price) * 100).toFixed(1);
      const totalPotentialProfit = netPerUnit * (p.stock || 0);

      return `
        <tr>
          <td>
            <strong style="color: white;">${p.name}</strong><br>
            <span style="font-size: 0.75rem; color: #94a3b8;">OEM: ${p.oemNumber}</span>
          </td>
          <td>₹${p.price}</td>
          <td style="color: #94a3b8;">₹${cp}</td>
          <td style="color: #f87171;">-₹${gwFee}</td>
          <td style="color: #10b981; font-weight: bold;">₹${netPerUnit}</td>
          <td><span class="badge badge-green">${margin}%</span></td>
          <td style="font-weight: bold; color: #38bdf8;">₹${totalPotentialProfit.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    // Render Table 3: Orders & WhatsApp Log
    if (orders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">
            <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
            No orders placed yet. Orders placed by customers will automatically show up here and dispatch alerts via WhatsApp!
          </td>
        </tr>
      `;
    } else {
      ordersTableBody.innerHTML = orders.map(o => `
        <tr>
          <td><span style="font-family: monospace; font-weight: bold; color: #f59e0b;">${o.id}</span></td>
          <td style="font-weight: bold; color: white;">${o.customerName}</td>
          <td><a href="https://wa.me/91${o.phone}" target="_blank" style="color: #25D366;"><i class="fa-brands fa-whatsapp"></i> ${o.phone}</a></td>
          <td><span class="badge badge-blue">${o.vehicle || 'Standard'}</span></td>
          <td style="font-weight: bold; color: white;">₹${o.total.toLocaleString('en-IN')}</td>
          <td><span class="badge badge-green">${o.paymentMethod.toUpperCase()}</span></td>
          <td>
            <a href="${o.whatsappLink}" target="_blank" class="action-btn" style="padding: 4px 10px; font-size: 0.78rem; background: #25D366; color: white; border: none;">
              <i class="fa-brands fa-whatsapp"></i> Resend Alert
            </a>
          </td>
          <td style="font-size: 0.78rem; color: #94a3b8;">${new Date(o.timestamp).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    }
  }

  // Global window functions for stock edit & delete
  window.editPartStock = function(id) {
    const products = getProducts();
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const newStock = prompt(`Update Stock Units for "${prod.name}" (Current: ${prod.stock}):`, prod.stock);
    if (newStock !== null && !isNaN(parseInt(newStock))) {
      prod.stock = Math.max(0, parseInt(newStock));
      setProducts(products);
      renderAdminDashboard();
      if (onCatalogUpdate) onCatalogUpdate();
    }
  };

  window.deletePart = function(id) {
    if (!confirm('Are you sure you want to remove this part from the XeroParts catalog?')) return;
    let products = getProducts();
    products = products.filter(p => p.id !== id);
    setProducts(products);
    renderAdminDashboard();
    if (onCatalogUpdate) onCatalogUpdate();
  };

  return { renderAdminDashboard };
}
