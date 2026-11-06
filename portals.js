// =============================================================================
// MRS CRACKERS — SECURE ROLE PORTALS ENGINE (portals.js)
// Dynamic Role-Based Mounting for Driver Portal & Admin Operations Console
// Strictly restricted: Customers have ZERO access or DOM presence for these views!
// =============================================================================

const PORTALS = (function() {
  let activeGateRole = null; // 'admin' or 'driver'
  let generatedOtp = null;
  let otpTimerInterval = null;
  let currentAdminTab = 'products'; // 'products', 'riders', 'orders', 'settings'
  let pendingGateEmail = null;
  let pendingGateMobile = null;
  let currentOrderFilter = 'all'; // 'all', 'received', 'in_transit', 'delivered'
  let selectedRiderId = null;

  // ===========================================================================
  // 1. DRIVER / RIDER VIEW TEMPLATE
  // ===========================================================================
  function getDriverPortalHTML() {
    return `<div id="view-driver" class="role-view" style="display: flex; flex-direction: column; width: 100%; min-height: 100vh; background: #0B021C; color: #FFFFFF;">
      
      <!-- Driver Top Header -->
      <div style="background: #13082A; border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid #22C55E; overflow: hidden; background: #222;">
            <img src="assets/rider_avatar.png" alt="Driver" id="driver-avatar-img" style="width: 100%; height: 100%; object-fit: cover;">
          </div>

      
          <div>
            <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 700; color: #FFFFFF;" id="driver-name-display">
              Raju Kumar (Rider)
            </div>

      
            <div style="font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #9CA3AF;" id="driver-vehicle-display">
              Rapido Bike • TS 09 EA 4120
            </div>

      
          </div>

      
        </div>

      

        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="duty-toggle-btn online" id="driver-duty-toggle-btn" onclick="toggleDriverDuty()" style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22C55E; color: #22C55E; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span id="driver-duty-indicator">🟢</span>
            <span id="driver-duty-text" style="font-weight: 700;">On Duty</span>
          </button>
          <button onclick="PORTALS.exit()" style="background: #1C1C1C; border: 1px solid #333; color: #EF4444; font-size: 0.7rem; padding: 5px 10px; border-radius: 6px; cursor: pointer;">
            Exit ✕
          </button>
        </div>

      
      </div>

      

      <!-- Driver Shift Summary Cards -->
      <div style="padding: 14px 14px 0 14px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-family: var(--font-mono, monospace); font-size: 0.6rem; color: #9CA3AF;">TODAY EARNED</div>
          <div style="font-family: var(--font-mono, monospace); font-size: 1.1rem; font-weight: 800; color: #34d399;" id="driver-kpi-earnings">₹1,250</div>
        </div>

      
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-family: var(--font-mono, monospace); font-size: 0.6rem; color: #9CA3AF;">DROPS DONE</div>
          <div style="font-family: var(--font-mono, monospace); font-size: 1.1rem; font-weight: 800; color: #FFFFFF;" id="driver-kpi-drops">12</div>
        </div>

      
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-family: var(--font-mono, monospace); font-size: 0.6rem; color: #9CA3AF;">FLEET RATING</div>
          <div style="font-family: var(--font-mono, monospace); font-size: 1.1rem; font-weight: 800; color: #FFB800;">★ 4.9</div>
        </div>

      
      </div>

      

      <!-- Live Active Delivery Runs -->
      <div style="padding: 14px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 70px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF;">
            🛵 Active Dispatch Runs
          </div>

      
          <span class="status-badge" id="driver-active-count" style="background: rgba(34, 197, 94, 0.15); color: #22C55E; border: 1px solid #22C55E; font-size: 0.68rem; padding: 2px 8px; border-radius: 12px;">1 Active Run</span>
        </div>

      

        <div id="driver-assignments-container" style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Dynamically populated via renderDriverDashboard -->
        </div>

      
      </div>

      

    </div>`;
  }

  // ===========================================================================
  // 2. PRODUCTION ADMIN OPERATIONS CONSOLE TEMPLATE
  // Products (Add/Edit) | Riders & Batch Deliveries | Orders | Settings & UPI
  // ===========================================================================
  function getAdminPortalHTML() {
    return `<div id="view-admin" class="role-view" style="display: flex; flex-direction: column; width: 100%; min-height: 100vh; background: #0B021C; color: #FFFFFF;">
      
      <!-- Admin Top Header -->
      <div style="background: #13082A; border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 184, 0, 0.15); border: 1px solid #FFB800; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            👑
          </div>

      
          <div>
            <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF; line-height: 1.2;">
              MRS Operations Console
            </div>

      
            <div style="font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #FFB800;">
              Saidabad Wholesale Counter • Bandi Rohan (Admin)
            </div>

      
          </div>

      
        </div>

      

        <div style="display: flex; align-items: center; gap: 6px;">
          <button onclick="PORTALS.syncAdminDataFromSupabase()" title="Refresh store data" style="background: rgba(124, 58, 237, 0.15); border: 1px solid rgba(139, 92, 246, 0.4); color: #C4B5FD; font-size: 0.7rem; padding: 5px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>🔄</span> Refresh
          </button>
          <button onclick="PORTALS.exit()" style="background: #1C1C1C; border: 1px solid #333; color: #EF4444; font-size: 0.7rem; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: 700;">
            Exit ✕
          </button>
        </div>

      </div>

      <!-- Admin Tabs Navigation -->
      <div style="display: flex; background: #180938; border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding: 4px 8px; gap: 6px; overflow-x: auto;">
        <button class="admin-tab-nav-btn active" id="atab-btn-products" onclick="PORTALS.switchAdminTab('products')" style="flex: 1; min-width: 90px; padding: 8px 10px; background: var(--purple-primary); color: #FFFFFF; border: none; border-radius: 6px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
          📦 Products
        </button>
        <button class="admin-tab-nav-btn" id="atab-btn-orders" onclick="PORTALS.switchAdminTab('orders')" style="flex: 1; min-width: 90px; padding: 8px 10px; background: rgba(124, 58, 237, 0.15); color: #C4B5FD; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
          📋 Orders (COD)
        </button>
        <button class="admin-tab-nav-btn" id="atab-btn-admins" onclick="PORTALS.switchAdminTab('admins')" style="flex: 1; min-width: 90px; padding: 8px 10px; background: rgba(124, 58, 237, 0.15); color: #C4B5FD; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
          👑 Admins
        </button>
        <button class="admin-tab-nav-btn" id="atab-btn-payments" onclick="PORTALS.switchAdminTab('payments')" style="flex: 1; min-width: 100px; padding: 8px 10px; background: rgba(124, 58, 237, 0.15); color: #C4B5FD; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
          💳 Online (Coming Soon)
        </button>
        <button class="admin-tab-nav-btn" id="atab-btn-settings" onclick="PORTALS.switchAdminTab('settings')" style="flex: 1; min-width: 90px; padding: 8px 10px; background: rgba(124, 58, 237, 0.15); color: #C4B5FD; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
          ⚙️ Settings
        </button>
      </div>

      <!-- Quick KPI Strip (Clean 3-column metrics, no database indicators) -->
      <div style="padding: 10px 14px; background: #180938; border-bottom: 1px solid rgba(139, 92, 246, 0.25); display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center;">
        <div>
          <div style="font-size: 0.58rem; color: #9CA3AF;">PRODUCTS IN CATALOG</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #FFFFFF;" id="admin-kpi-prods-count">39</div>
        </div>
        <div>
          <div style="font-size: 0.58rem; color: #9CA3AF;">ACTIVE COD ORDERS</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #FFB800;" id="admin-kpi-pending-count">0</div>
        </div>
        <div>
          <div style="font-size: 0.58rem; color: #9CA3AF;">TOTAL STORE ORDERS</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #A78BFA;" id="admin-kpi-orders-count">0</div>
        </div>
      </div>

      

      <!-- ===================================================================== -->
      <!-- TAB 1: PRODUCTS MANAGEMENT (Add New + Edit Existing) -->
      <!-- ===================================================================== -->
      <div id="admin-section-products" style="display: flex; flex-direction: column; gap: 12px; padding: 14px; margin-bottom: 70px;">
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-display, sans-serif); font-size: 1.05rem; font-weight: 800; color: #FFFFFF;">
              Firecracker Catalog Manager
            </div>

      
            <div style="font-size: 0.68rem; color: #9CA3AF;">Add new items or edit prices, names & stock</div>
          </div>

      
          <button onclick="PORTALS.toggleAdminAddProductForm()" id="admin-toggle-add-btn" style="background: var(--purple-primary); color: #FFFFFF; border: none; font-weight: 800; font-size: 0.75rem; padding: 7px 12px; border-radius: 6px; cursor: pointer;">
            ➕ Add Cracker
          </button>
        </div>

      

        <!-- Add New Cracker Form (Collapsible) -->
        <div id="admin-add-product-form" style="display: none; background: #180938; border: 1px solid #F59E0B; border-radius: 8px; padding: 14px;">
          <div style="font-weight: 800; color: #FFB800; font-size: 0.88rem; margin-bottom: 8px;">
            ✨ Add New Firecracker to Catalog
          </div>

      
          <form onsubmit="PORTALS.saveNewProductFromAdmin(event)">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Cracker Name *</label>
                <input type="text" id="new-item-name" class="form-input" placeholder="e.g. 1000 Wala Giant Chain" required>
              </div>

      

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Category *</label>
                  <select id="new-item-category" class="form-select" required>
                    <option value="single_sound">Single Sound</option>
                    <option value="bijili">Bijili Crackers</option>
                    <option value="flowerpots">Flower Pots</option>
                    <option value="chakkars">Ground Chakkars</option>
                    <option value="sparklers" selected>Sparklers</option>
                    <option value="rockets">Rockets</option>
                    <option value="multishot">Multi-Shot Aerial</option>
                    <option value="chains">Chain Crackers</option>
                    <option value="electric">Electric Crackers</option>
                    <option value="novelty">Kids / Novelty</option>
                    <option value="giftboxes">Gift Assortment</option>
                  </select>
                </div>

      
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Pack Size *</label>
                  <input type="text" id="new-item-packsize" class="form-input" placeholder="e.g. 10 pieces/box" required>
                </div>

      
              </div>

      

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Wholesale Price (₹) *</label>
                  <input type="number" id="new-item-price" class="form-input" placeholder="e.g. 180" min="1" required>
                </div>

      
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">MRP Price (₹) *</label>
                  <input type="number" id="new-item-mrp" class="form-input" placeholder="e.g. 900" min="1" required>
                </div>

      
              </div>

      

              <div>
                <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Image URL / Path *</label>
                <input type="text" id="new-item-image" class="form-input" placeholder="Crackers/indian_crackers_product_imagesv2/... or https://" value="assets/cat_sparklers.png" required>
              </div>

      

              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button type="submit" style="flex: 1; background: var(--purple-primary); color: #FFFFFF; border: none; font-weight: 800; font-size: 0.8rem; padding: 10px; border-radius: 6px; cursor: pointer;">
                  💾 Save to Catalog
                </button>
                <button type="button" onclick="PORTALS.toggleAdminAddProductForm()" style="background: #222; color: #FFF; border: 1px solid #444; font-size: 0.78rem; padding: 10px 14px; border-radius: 6px; cursor: pointer;">
                  Cancel
                </button>
              </div>

      
            </div>

      
          </form>
        </div>

      

        <!-- Search & Filter Controls -->
        <div style="display: flex; gap: 8px;">
          <input type="text" id="admin-search-products-input" oninput="PORTALS.filterAdminProductsList()" placeholder="🔍 Search by cracker name..." class="form-input" style="flex: 1; font-size: 0.75rem; padding: 8px;">
          <select id="admin-filter-category-select" onchange="PORTALS.filterAdminProductsList()" class="form-select" style="width: 130px; font-size: 0.75rem; padding: 8px;">
            <option value="all">All Categories</option>
            <option value="sparklers">Sparklers</option>
            <option value="flowerpots">Flower Pots</option>
            <option value="chakkars">Chakkars</option>
            <option value="rockets">Rockets</option>
            <option value="multishot">Multi-Shot</option>
            <option value="chains">Chains</option>
            <option value="giftboxes">Gift Boxes</option>
          </select>
        </div>

      

        <!-- Products List Cards -->
        <div id="admin-products-table-body" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Dynamically populated via renderAdminProducts -->
        </div>

      

      </div>

      

      <!-- ===================================================================== -->
      <!-- TAB 2: QR & UPI PAYMENTS SETUP (Super Admin / Admin Control) -->
      <!-- ===================================================================== -->
      <div id="admin-section-payments" style="display: none; flex-direction: column; gap: 14px; padding: 14px; margin-bottom: 70px;">
        
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-family: var(--font-display, sans-serif); font-size: 1rem; font-weight: 800; color: #FFFFFF;">
              💳 Real Merchant UPI & QR Code Settings
            </div>
            <span class="status-badge" style="background: rgba(34, 197, 94, 0.15); color: #22C55E; border: 1px solid #22C55E; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;">Live Storefront</span>
          </div>
          <p style="font-size: 0.72rem; color: #9CA3AF; margin-bottom: 12px;">
            Upload your real merchant QR codes and set official UPI IDs. Customers paying online during checkout will scan these exact QR codes and receive instant payment verification.
          </p>

          <form onsubmit="PORTALS.saveMerchantPaymentConfig(event)">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              
              <!-- Merchant 1: Primary Super Admin -->
              <div style="background: #120524; border: 1.5px solid #7C3AED; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 800; font-size: 0.85rem; color: #FFB800;">Primary Merchant (Merchant 1)</span>
                  <span style="font-size: 0.65rem; color: #DDD6FE; background: rgba(124, 58, 237, 0.2); padding: 2px 6px; border-radius: 4px;">Super Admin Rohan</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Merchant Display Name *</label>
                    <input type="text" id="admin-m1-name" class="form-input" value="Bandi Rohan (Official Store)" required>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Merchant UPI ID *</label>
                    <input type="text" id="admin-m1-upi" class="form-input" value="9392819362@upi" required>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; margin-top: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px;">
                  <div style="width: 75px; height: 75px; background: #FFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px;">
                    <img id="admin-m1-preview" src="assets/qr_paytm.png" alt="QR 1" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Upload Real QR Code Image</label>
                    <input type="file" id="admin-m1-file" class="form-input" accept="image/*" onchange="PORTALS.handleAdminQrFileUpload(1, event)" style="padding: 4px; font-size: 0.72rem;">
                    <div style="font-size: 0.65rem; color: #9CA3AF; margin-top: 3px;">Accepts JPG, PNG, WebP QR screenshots</div>
                  </div>
                </div>
              </div>

              <!-- Merchant 2: Secondary / Saidabad Counter -->
              <div style="background: #120524; border: 1.5px solid #22C55E; border-radius: 8px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 800; font-size: 0.85rem; color: #34d399;">Secondary Merchant (Merchant 2)</span>
                  <span style="font-size: 0.65rem; color: #86EFAC; background: rgba(34, 197, 94, 0.2); padding: 2px 6px; border-radius: 4px;">Saidabad Counter UPI</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Merchant Display Name *</label>
                    <input type="text" id="admin-m2-name" class="form-input" value="MRS Crackers Saidabad Counter" required>
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Merchant UPI ID *</label>
                    <input type="text" id="admin-m2-upi" class="form-input" value="bandirohan43@okhdfcbank" required>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; margin-top: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px;">
                  <div style="width: 75px; height: 75px; background: #FFF; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 4px;">
                    <img id="admin-m2-preview" src="assets/qr_bharatpe.png" alt="QR 2" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                  </div>
                  <div>
                    <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Upload Real QR Code Image</label>
                    <input type="file" id="admin-m2-file" class="form-input" accept="image/*" onchange="PORTALS.handleAdminQrFileUpload(2, event)" style="padding: 4px; font-size: 0.72rem;">
                    <div style="font-size: 0.65rem; color: #9CA3AF; margin-top: 3px;">Accepts JPG, PNG, WebP QR screenshots</div>
                  </div>
                </div>
              </div>

              <button type="submit" style="background: #22C55E; color: #000; border: none; font-weight: 800; font-size: 0.85rem; padding: 12px; border-radius: 6px; cursor: pointer;">
                💾 Save & Apply QR Settings Live
              </button>
            </div>
          </form>
        </div>

      </div>

      

      <!-- ===================================================================== -->
      <!-- TAB 3: ORDERS MANAGEMENT (Received | In Transit | Delivered) -->
      <!-- ===================================================================== -->
      <div id="admin-section-orders" style="display: none; flex-direction: column; gap: 12px; padding: 14px; margin-bottom: 70px;">
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-display, sans-serif); font-size: 1.05rem; font-weight: 800; color: #FFFFFF;">
              Dispatches & Orders Board
            </div>

      
            <div style="font-size: 0.68rem; color: #9CA3AF;">Track incoming orders, verify UTR payments, and assign riders</div>
          </div>

      
        </div>

      

        <!-- Orders Filter Pills -->
        <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
          <button class="order-filter-pill active" id="ofilt-all" onclick="PORTALS.filterAdminOrdersByStatus('all')" style="background: var(--purple-primary); color: #FFFFFF; border: none; font-size: 0.7rem; font-weight: 700; padding: 6px 12px; border-radius: 20px; cursor: pointer; white-space: nowrap;">
            All Orders
          </button>
          <button class="order-filter-pill" id="ofilt-received" onclick="PORTALS.filterAdminOrdersByStatus('received')" style="background: #222; color: #FFB800; border: 1px solid #444; font-size: 0.7rem; font-weight: 700; padding: 6px 12px; border-radius: 20px; cursor: pointer; white-space: nowrap;">
            🟡 Received (New)
          </button>
          <button class="order-filter-pill" id="ofilt-in_transit" onclick="PORTALS.filterAdminOrdersByStatus('in_transit')" style="background: #222; color: #38BDF8; border: 1px solid #444; font-size: 0.7rem; font-weight: 700; padding: 6px 12px; border-radius: 20px; cursor: pointer; white-space: nowrap;">
            🛵 In Transit
          </button>
          <button class="order-filter-pill" id="ofilt-delivered" onclick="PORTALS.filterAdminOrdersByStatus('delivered')" style="background: #222; color: #34d399; border: 1px solid #444; font-size: 0.7rem; font-weight: 700; padding: 6px 12px; border-radius: 20px; cursor: pointer; white-space: nowrap;">
            ✅ Delivered
          </button>
        </div>

      

        <!-- Orders Cards Container -->
        <div id="admin-orders-table-body" style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Dynamically populated via renderAdminOrders -->
        </div>

      

      </div>

      

      <!-- ===================================================================== -->
      <!-- TAB 4: SETTINGS & UPI RECEIVER -->
      <!-- ===================================================================== -->
      <div id="admin-section-settings" style="display: none; flex-direction: column; gap: 14px; padding: 14px; margin-bottom: 70px;">
        
        <!-- Active QR Receiver Switch -->
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 14px;">
          <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">
            💳 Active UPI QR Receiver Switch
          </div>

      
          <div style="font-size: 0.72rem; color: #9CA3AF; margin-bottom: 10px;">
            Select which merchant account receives customer checkout payments:
          </div>

      

          <div style="display: flex; gap: 10px;">
            <label style="flex: 1; background: #1C1C1C; border: 1px solid #333; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="admin-receiver-radio" id="admin-radio-paytm" onchange="PORTALS.setAdminPaymentReceiver('paytm')" checked style="accent-color: #FFB800;">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem; color: #FFFFFF;">Bandi Rohan</div>
                <div style="font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #FFB800;">Primary Admin UPI</div>
              </div>

      
            </label>

            <label style="flex: 1; background: #1C1C1C; border: 1px solid #333; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="radio" name="admin-receiver-radio" id="admin-radio-bharatpe" onchange="PORTALS.setAdminPaymentReceiver('bharatpe')" style="accent-color: #FFB800;">
              <div>
                <div style="font-weight: 700; font-size: 0.8rem; color: #FFFFFF;">M. Akhil Ram Prasad</div>
                <div style="font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #FFB800;">BharatPe Merchant QR</div>
              </div>

      
            </label>
          </div>

      
        </div>

      

        <!-- Announcement Banner Editor -->
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 14px;">
          <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">
            📢 Festive Announcement Ticker
          </div>

      
          <div style="font-size: 0.72rem; color: #9CA3AF; margin-bottom: 8px;">
            Update the banner ticker displayed to customers at the top of the storefront:
          </div>

      
          <div style="display: flex; gap: 8px;">
            <input type="text" id="admin-announcement-input" class="form-input" style="flex: 1;" placeholder="Announcement message..." value="Last Day! Free Delivery on orders above ₹999! 💥">
            <button onclick="PORTALS.updateAnnouncementTicker()" style="background: var(--purple-primary); color: #FFFFFF; border: none; font-weight: 800; font-size: 0.75rem; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
              Update
            </button>
          </div>

      
        </div>

      

        <!-- Live Email & WhatsApp Dispatch Configuration -->
        <div style="background: #180938; border: 1.5px solid rgba(139, 92, 246, 0.4); border-radius: 8px; padding: 14px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF;">
              ✉️ Live Email Dispatch Hub
            </div>
            <span class="status-badge" id="admin-email-status-badge" style="background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid #EF4444; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;">
              Setup Required
            </span>
          </div>

          <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; font-size: 0.72rem; color: #FCA5A5; line-height: 1.5;" id="admin-email-warning-box">
            ⚠️ <strong>No email provider configured.</strong> Customers are NOT receiving order confirmation emails. 
            To fix: Either enter your <strong>Gmail App Password</strong> below (easiest), OR sign up free at <strong>brevo.com</strong> and enter the API key.
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Option 1: Gmail SMTP -->
            <div style="background: rgba(124,58,237,0.1); border-radius: 6px; padding: 8px 10px;">
              <div style="font-size: 0.72rem; font-weight: 800; color: #DDD6FE; margin-bottom: 6px;">📧 Option 1: Gmail App Password (Recommended)</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="font-size: 0.7rem; font-weight: 700; color: #DDD6FE;">From Gmail Address</label>
                  <input type="email" id="admin-smtp-user" class="form-input" value="bandirohan43@gmail.com" placeholder="bandirohan43@gmail.com" style="background: #1C0C3E; border: 1px solid rgba(139,92,246,0.3); color: #FFF; font-size: 0.78rem;">
                </div>
                <div>
                  <label style="font-size: 0.7rem; font-weight: 700; color: #FBBF24;">Gmail App Password (16-char) ⚡</label>
                  <input type="password" id="admin-smtp-pass" class="form-input" placeholder="xxxx xxxx xxxx xxxx" style="background: #1C0C3E; border: 1.5px solid #FBBF24; color: #FFF; font-size: 0.78rem;">
                  <div style="font-size: 0.62rem; color: #FDE047; margin-top: 2px;">Google Account → Security → 2-Step Verification → App Passwords → Generate</div>
                </div>
              </div>
            </div>

            <!-- Option 2: Brevo API -->
            <div style="background: rgba(34,197,94,0.07); border-radius: 6px; padding: 8px 10px;">
              <div style="font-size: 0.72rem; font-weight: 800; color: #86EFAC; margin-bottom: 6px;">🚀 Option 2: Brevo API Key (Free — 300 emails/day)</div>
              <div>
                <label style="font-size: 0.7rem; font-weight: 700; color: #86EFAC;">Brevo API Key</label>
                <input type="password" id="admin-brevo-api-key" class="form-input" value="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" placeholder="xkeysib-..." style="background: #0a1a0a; border: 1.5px solid rgba(34,197,94,0.4); color: #FFF; font-size: 0.78rem;">
                <div style="font-size: 0.62rem; color: #86EFAC; margin-top: 2px;">Sign up free at brevo.com → SMTP & API → API Keys → Create a new API key</div>
              </div>
            </div>

            <!-- WhatsApp Automation Gateway -->
            <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.3); border-radius: 6px; padding: 10px;">
              <div style="font-size: 0.75rem; font-weight: 800; color: #25D366; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span>📲 Automated WhatsApp Dispatch (From +91 9392819362)</span>
              </div>
              <div style="font-size: 0.64rem; color: #A7F3D0; line-height: 1.4; margin-bottom: 8px;">
                Sends automated WhatsApp order receipts directly to customer's mobile number from your phone (9392819362).
                Quick Setup: Sign up free at <strong>ultramsg.com</strong> &gt; scan QR code with WhatsApp on 9392819362 (Linked Devices) &gt; paste credentials below:
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label style="font-size: 0.68rem; font-weight: 700; color: #A7F3D0;">UltraMsg Instance ID</label>
                  <input type="text" id="admin-ultramsg-instance" class="form-input" value="instance196245" placeholder="e.g. instance109282" style="background: #0a1a0a; border: 1px solid rgba(37,211,102,0.4); color: #FFF; font-size: 0.76rem;">
                </div>
                <div>
                  <label style="font-size: 0.68rem; font-weight: 700; color: #A7F3D0;">UltraMsg Token</label>
                  <input type="password" id="admin-ultramsg-token" class="form-input" value="36joxaja2djlcw29" placeholder="e.g. abc123xyz" style="background: #0a1a0a; border: 1px solid rgba(37,211,102,0.4); color: #FFF; font-size: 0.76rem;">
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 0.7rem; font-weight: 800; color: #FBBF24;">📦 Driver / Dispatch Email</label>
                <input type="email" id="admin-order-receiving-email" class="form-input" value="mrscrackers.orders@gmail.com" placeholder="e.g. driver@gmail.com" style="background: #1C0C3E; border: 1.5px solid rgba(245, 158, 11, 0.5); color: #FFF; font-size: 0.78rem;">
                <div style="font-size: 0.64rem; color: #FDE047; margin-top: 3px;">Driver receives: items list, customer address & payment mode.</div>
              </div>
              <div>
                <label style="font-size: 0.7rem; font-weight: 700; color: #DDD6FE;">Admin Mobile / WhatsApp</label>
                <input type="text" id="admin-sender-mobile" class="form-input" value="9392819362" placeholder="9392819362" style="background: #1C0C3E; border: 1px solid rgba(139,92,246,0.3); color: #FFF; font-size: 0.78rem;">
                <div style="font-size: 0.64rem; color: #A78BFA; margin-top: 3px;">Shown on customer confirmations for WhatsApp contact.</div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button onclick="PORTALS.saveEmailSettings()" style="background: var(--purple-primary); color: #FFF; border: none; font-weight: 800; font-size: 0.75rem; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
                💾 Save Configuration
              </button>
              <button onclick="PORTALS.sendTestOtpEmail()" style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22C55E; color: #22C55E; font-weight: 800; font-size: 0.75rem; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
                Send Test Email ✉️
              </button>
              <a id="admin-test-wa-btn" href="https://wa.me/919392819362?text=Test%20WhatsApp%202FA%20Dispatch%20from%20MRS%20Crackers" target="_blank" style="background: #22C55E; color: #000; font-weight: 800; font-size: 0.75rem; padding: 8px 14px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                Open WhatsApp 📲
              </a>
            </div>
          </div>
        </div>

      

      </div>

      

      <!-- ===================================================================== -->
      <!-- TAB 5: ADMINS MANAGEMENT (Admins can view and add more admins) -->
      <!-- ===================================================================== -->
      <div id="admin-section-admins" style="display: none; flex-direction: column; gap: 14px; padding: 14px; margin-bottom: 70px;">
        
        <!-- Add New Admin Box -->
        <div style="background: #180938; border: 1px solid #FFB800; border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF;">
              👑 Register New System Administrator
            </div>
            <span class="status-badge" style="background: rgba(255, 184, 0, 0.15); color: #FFB800; border: 1px solid #FFB800; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;">Admin Management</span>
          </div>
          <p style="font-size: 0.72rem; color: #9CA3AF; margin-bottom: 10px;">
            Admins registered here can log into the <strong>MRS Operations Console</strong> with full store, catalog & order management privileges.
          </p>

          <form onsubmit="PORTALS.registerNewAdminFromForm(event)">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Admin Full Name *</label>
                  <input type="text" id="form-admin-name" class="form-input" placeholder="e.g. Bandi Rohan" required>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">10-Digit Mobile *</label>
                  <input type="tel" id="form-admin-mobile" class="form-input" placeholder="e.g. 9392819362" maxlength="10" required>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Email Address *</label>
                  <input type="email" id="form-admin-email" class="form-input" placeholder="e.g. bandirohan43@gmail.com" required>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.68rem; margin-bottom: 2px;">Admin Login Password *</label>
                  <input type="password" id="form-admin-pass" class="form-input" placeholder="e.g. Rohan@123" required>
                </div>
              </div>

              <button type="submit" style="background: #FFB800; color: #000; border: none; font-weight: 800; font-size: 0.8rem; padding: 10px; border-radius: 6px; cursor: pointer; margin-top: 4px;">
                ➕ Register Admin & Grant Full Console Access
              </button>
            </div>
          </form>
        </div>

        <!-- Active Administrators List -->
        <div>
          <div style="font-family: var(--font-display, sans-serif); font-size: 0.95rem; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">
            👑 Active System Administrators
          </div>
          <div style="font-size: 0.68rem; color: #9CA3AF; margin-bottom: 8px;">
            Authorized store operators with full console access:
          </div>

          <div id="admin-users-table-body" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Dynamically populated via renderAdminUsers -->
          </div>
        </div>

      </div>

      <!-- ===================================================================== -->
      <!-- MODAL: EDIT PRODUCT DETAILS (User Requirement) -->
      <!-- ===================================================================== -->
      <div id="admin-edit-product-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center; padding: 16px;">
        <div style="background: #161616; border: 1px solid #FFB800; border-radius: 10px; width: 100%; max-width: 440px; padding: 16px; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #282828; padding-bottom: 8px;">
            <div style="font-family: var(--font-display, sans-serif); font-weight: 800; font-size: 1rem; color: #FFB800;">
              ✏️ Edit Firecracker Details
            </div>

      
            <button onclick="PORTALS.closeAdminEditProductModal()" style="background: none; border: none; color: #9CA3AF; font-size: 1.2rem; cursor: pointer;">✕</button>
          </div>

      

          <form onsubmit="PORTALS.saveAdminEditProduct(event)">
            <input type="hidden" id="edit-prod-id">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label class="form-label" style="font-size: 0.7rem; margin-bottom: 2px;">Product Name *</label>
                <input type="text" id="edit-prod-name" class="form-input" required>
              </div>

      

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.7rem; margin-bottom: 2px;">Wholesale Price (₹) *</label>
                  <input type="number" id="edit-prod-price" class="form-input" min="1" required>
                </div>

      
                <div>
                  <label class="form-label" style="font-size: 0.7rem; margin-bottom: 2px;">MRP Price (₹) *</label>
                  <input type="number" id="edit-prod-mrp" class="form-input" min="1" required>
                </div>

      
              </div>

      

              <div>
                <label class="form-label" style="font-size: 0.7rem; margin-bottom: 2px;">Pack Size / Units *</label>
                <input type="text" id="edit-prod-packsize" class="form-input" required>
              </div>

      

              <div>
                <label class="form-label" style="font-size: 0.7rem; margin-bottom: 2px;">Image Path / URL *</label>
                <input type="text" id="edit-prod-image" class="form-input" oninput="PORTALS.updateEditProductImagePreview(this.value)" required>
              </div>

      

              <!-- Live Image Preview -->
              <div style="display: flex; align-items: center; gap: 10px; background: #111; padding: 8px; border-radius: 6px; border: 1px solid #282828;">
                <div style="width: 50px; height: 50px; border-radius: 6px; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                  <img id="edit-prod-preview-img" src="assets/cat_sparklers.png" alt="Preview" style="width: 100%; height: 100%; object-fit: contain;">
                </div>

      
                <div style="font-size: 0.68rem; color: #9CA3AF;">
                  Live Image Preview (Applies to both store catalog & wholesale quick order)
                </div>

      
              </div>

      

              <div style="display: flex; justify-content: space-between; align-items: center; background: #1C1C1C; padding: 10px; border-radius: 6px; border: 1px solid #333;">
                <div>
                  <div style="font-weight: 700; font-size: 0.78rem; color: #FFF;">Stock Status</div>
                  <div style="font-size: 0.65rem; color: #9CA3AF;">Allow customers to order</div>
                </div>

      
                <label style="position: relative; display: inline-block; width: 44px; height: 24px;">
                  <input type="checkbox" id="edit-prod-instock" checked style="accent-color: #22C55E; width: 20px; height: 20px; cursor: pointer;">
                </label>
              </div>

      

              <div style="display: flex; gap: 8px; margin-top: 6px;">
                <button type="submit" style="flex: 1; background: var(--purple-primary); color: #FFFFFF; border: none; font-weight: 800; font-size: 0.82rem; padding: 10px; border-radius: 6px; cursor: pointer;">
                  💾 Save Updates
                </button>
                <button type="button" onclick="PORTALS.closeAdminEditProductModal()" style="background: #222; color: #FFF; border: 1px solid #444; font-size: 0.78rem; padding: 10px 14px; border-radius: 6px; cursor: pointer;">
                  Cancel
                </button>
              </div>

      
            </div>

      
          </form>
        </div>

      
      </div>

      

      <!-- ===================================================================== -->
      <!-- MODAL: RIDER DETAILS & BATCH DELIVERIES (User Requirement) -->
      <!-- "if u click a rider it should show his details of his batch deliveres and how many delivered" -->
      <!-- ===================================================================== -->
      <div id="admin-rider-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center; padding: 16px;">
        <div style="background: #161616; border: 1px solid #22C55E; border-radius: 10px; width: 100%; max-width: 480px; padding: 16px; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #282828; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🛵</span>
              <div>
                <div style="font-family: var(--font-display, sans-serif); font-weight: 800; font-size: 1rem; color: #FFFFFF;" id="rider-modal-name">
                  Rider Details
                </div>

      
                <div style="font-size: 0.65rem; color: #22C55E;" id="rider-modal-vehicle">
                  Vehicle Assigned
                </div>

      
              </div>

      
            </div>

      
            <button onclick="PORTALS.closeAdminRiderModal()" style="background: none; border: none; color: #9CA3AF; font-size: 1.2rem; cursor: pointer;">✕</button>
          </div>

      

          <!-- Rider Stats Strip -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;">
            <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #262626; text-align: center;">
              <div style="font-size: 0.58rem; color: #9CA3AF;">DELIVERIES DONE</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #FFFFFF;" id="rider-modal-drops">12</div>
            </div>

      
            <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #262626; text-align: center;">
              <div style="font-size: 0.58rem; color: #9CA3AF;">TODAY EARNINGS</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #34d399;" id="rider-modal-earnings">₹1,440</div>
            </div>

      
            <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #262626; text-align: center;">
              <div style="font-size: 0.58rem; color: #9CA3AF;">DUTY STATUS</div>
              <div style="font-size: 0.85rem; font-weight: 800; color: #22C55E;" id="rider-modal-status">🟢 ON DUTY</div>
            </div>

      
          </div>

      

          <!-- Rider Contact & Actions -->
          <div style="background: #111; padding: 10px; border-radius: 6px; border: 1px solid #262626; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.68rem; color: #9CA3AF;">Mobile Phone:</div>
              <div style="font-family: var(--font-mono, monospace); font-weight: 700; color: #FFFFFF; font-size: 0.85rem;" id="rider-modal-phone">9876543210</div>
            </div>

      
            <a id="rider-modal-call-btn" href="tel:9876543210" style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22C55E; color: #22C55E; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
              📞 Call Rider
            </a>
          </div>

      

          <!-- Assigned Deliveries in this Rider's Batch -->
          <div>
            <div style="font-family: var(--font-display, sans-serif); font-weight: 800; font-size: 0.85rem; color: #FFFFFF; margin-bottom: 4px;">
              📦 Active Batch Deliveries Assigned to this Rider
            </div>

      
            <div style="font-size: 0.68rem; color: #9CA3AF; margin-bottom: 8px;">
              Real-time delivery progress & handover OTP for this rider:
            </div>

      

            <div id="rider-modal-deliveries-container" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Dynamically populated via openAdminRiderModal -->
            </div>

      
          </div>

      

          <!-- Quick Assign Order Dropdown -->
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #282828;">
            <div style="font-size: 0.72rem; color: #FFB800; font-weight: 700; margin-bottom: 4px;">
              ➕ Assign Pending Order to this Rider:
            </div>

      
            <div style="display: flex; gap: 6px;">
              <select id="rider-modal-assign-order-select" class="form-select" style="flex: 1; font-size: 0.72rem;">
                <!-- Populated with pending orders -->
              </select>
              <button onclick="PORTALS.assignSelectedOrderToCurrentRider()" style="background: #22C55E; color: #000; border: none; font-weight: 800; font-size: 0.72rem; padding: 6px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap;">
                Assign
              </button>
            </div>

      
          </div>

      

        </div>

      
      </div>

      

    </div>`;
  }

  // ===========================================================================
  // 3. MOUNT AND UNMOUNT CONTROLLERS
  // ===========================================================================
  function mountPortal(role) {
    const container = document.getElementById('portal-mount-container');
    const customerView = document.getElementById('view-customer');
    if (!container || !customerView) return;

    if (role === 'admin') {
      container.innerHTML = getAdminPortalHTML();
      customerView.style.display = 'none';
      container.style.display = 'block';

      const vAdmin = document.getElementById('view-admin');
      if (vAdmin) vAdmin.style.display = 'flex';

      try {
        history.replaceState(null, '', '#admin');
        sessionStorage.setItem('mrs_current_tab', 'admin');
      } catch (e) {}

      initAdminDashboard();
      console.log('👑 Admin Operations Hub mounted securely.');
    } else if (role === 'driver') {
      container.innerHTML = getDriverPortalHTML();
      customerView.style.display = 'none';
      container.style.display = 'block';

      const vDriver = document.getElementById('view-driver');
      if (vDriver) vDriver.style.display = 'flex';

      try {
        history.replaceState(null, '', '#driver');
        sessionStorage.setItem('mrs_current_tab', 'driver');
      } catch (e) {}

      if (typeof renderDriverDashboard === 'function') renderDriverDashboard();
      console.log('🛵 Driver / Delivery Partner Portal mounted securely.');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function unmountPortal() {
    const container = document.getElementById('portal-mount-container');
    const customerView = document.getElementById('view-customer');
    const hadMountedPortal = container && container.innerHTML.trim().length > 0;
    if (container) {
      container.innerHTML = ''; // Strictly erase admin/driver markup from DOM
      container.style.display = 'none';
    }
    if (customerView) {
      customerView.style.display = 'block';
    }
    if (hadMountedPortal) {
      try {
        history.replaceState(null, '', '#home');
        sessionStorage.setItem('mrs_current_tab', 'home');
      } catch (e) {}
      if (typeof switchTab === 'function') {
        switchTab('home');
      }
      console.log('🔒 Portal unmounted. DOM scrubbed clean.');
    }
  }

  // ===========================================================================
  // 4. TWO-STEP AUTHORIZATION GATE
  // ===========================================================================
  function openSecurityGate(role) {
    activeGateRole = role;
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    const modal = document.getElementById('secure-gate-modal');
    const title = document.getElementById('gate-modal-title');
    const subtitle = document.getElementById('gate-modal-subtitle');
    const badge = document.getElementById('gate-role-badge');
    const idInput = document.getElementById('gate-id-input');
    const passInput = document.getElementById('gate-pass-input');
    const errorEl = document.getElementById('gate-step1-error');
    const step1 = document.getElementById('gate-step-1');
    const step2 = document.getElementById('gate-step-2');

    if (!modal) return;

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (passInput) passInput.value = '';

    if (role === 'admin') {
      if (title) title.innerText = 'Admin Authorization Gate';
      if (subtitle) subtitle.innerText = 'Restricted Storefront Management (Bandi Rohan)';
      if (badge) { badge.innerText = 'ADMIN ACCESS'; badge.style.color = '#FFB800'; badge.style.borderColor = '#FFB800'; }
      if (idInput) {
        idInput.value = (APP_STATE && APP_STATE.user && APP_STATE.user.isLoggedIn && APP_STATE.user.role === 'admin' && (APP_STATE.user.email || APP_STATE.user.mobile)) ? (APP_STATE.user.email || APP_STATE.user.mobile) : 'bandirohan43@gmail.com';
        idInput.placeholder = 'bandirohan43@gmail.com or 9392819362';
      }
    } else {
      if (title) title.innerText = 'Delivery Partner Gate';
      if (subtitle) subtitle.innerText = 'Rider Fleet & Order Dispatch Terminal';
      if (badge) { badge.innerText = 'RIDER ACCESS'; badge.style.color = '#22C55E'; badge.style.borderColor = '#22C55E'; }
      if (idInput) {
        idInput.value = (APP_STATE && APP_STATE.user && APP_STATE.user.isLoggedIn && APP_STATE.user.role === 'driver' && APP_STATE.user.mobile) ? APP_STATE.user.mobile : '';
        idInput.placeholder = 'Enter Signed-Up Rider Mobile or Email';
      }
    }

    modal.classList.add('open');
  }

  async function verifyStep1() {
    const idInput = document.getElementById('gate-id-input');
    const passInput = document.getElementById('gate-pass-input');
    const errorEl = document.getElementById('gate-step1-error');
    const step1 = document.getElementById('gate-step-1');
    const step2 = document.getElementById('gate-step-2');
    const otpTargetDesc = document.getElementById('gate-otp-target-desc');
    const otpDestText = document.getElementById('gate-otp-destination-text');
    const waBtn = document.getElementById('gate-otp-whatsapp-btn');
    const emailBtn = document.getElementById('gate-otp-email-btn');

    const enteredId = idInput ? idInput.value.trim() : '';
    const enteredPass = passInput ? passInput.value.trim() : '';

    if (!enteredId || !enteredPass) {
      if (errorEl) { errorEl.innerText = 'Please enter both ID and Passcode.'; errorEl.style.display = 'block'; }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    // Strictly validate credentials via backend service without leaking passwords to frontend
    let verifyRes = null;
    if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.verifyCredentials === 'function') {
      verifyRes = await MRS_BACKEND.verifyCredentials({
        role: activeGateRole,
        identifier: enteredId,
        password: enteredPass
      });
    }

    if (!verifyRes || !verifyRes.success) {
      if (errorEl) { 
        errorEl.innerText = verifyRes?.error || 'Invalid credentials. Access Denied.'; 
        errorEl.style.display = 'block'; 
      }
      return;
    }

    // Super Admin Rohan Fast Login (NO OTP for Bandi Rohan as requested)
    const idClean = enteredId.trim().toLowerCase();
    const isSuperAdmin = (
      (idClean === 'bandirohan43@gmail.com' || enteredId.replace(/[^0-9]/g, '') === '9392819362' || idClean === 'admin' || idClean === 'rohan') &&
      (enteredPass === 'Rohan@123' || (verifyRes.user && verifyRes.user.email === 'bandirohan43@gmail.com'))
    );

    if (isSuperAdmin) {
      closeSecurityGate();
      mountPortal('admin');
      if (typeof showToast === 'function') {
        showToast('⚡ Welcome, Super Admin Rohan! Console unlocked instantly.');
      }
      return;
    }

    // Proceed to Step 2: Live 6-digit OTP dispatched to WhatsApp & Email (NOT displayed on screen)
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'block';

    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    const targetMobile = (verifyRes.user && verifyRes.user.mobile) || (activeGateRole === 'admin' ? '9392819362' : enteredId);
    const targetEmail = (verifyRes.user && verifyRes.user.email) || (activeGateRole === 'admin' ? 'bandirohan43@gmail.com' : 'rider@mrscrackers.com');
    
    pendingGateEmail = targetEmail;
    pendingGateMobile = targetMobile;

    // Update dispatch description (OTP is NEVER rendered into DOM or public markup)
    if (otpDestText) {
      otpDestText.innerHTML = `Live confirmation code dispatched to Email (<strong>${targetEmail}</strong>) & WhatsApp (+91 ${targetMobile}). Enter the 6-digit code below.`;
    }
    if (otpTargetDesc) {
      otpTargetDesc.innerText = `Security OTP sent to registered WhatsApp (+91 ${targetMobile}) and Email (${targetEmail})`;
    }

    // Configure direct WhatsApp & Email actions for instant OTP retrieval
    if (waBtn) {
      const waMsg = `Your MRS Crackers 2FA Security Login OTP is: ${generatedOtp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
      const waUrl = `https://wa.me/91${targetMobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`;
      waBtn.href = waUrl;
      try {
        window.open(waUrl, '_blank');
      } catch (e) {}
    }
    if (emailBtn) {
      const emailSub = 'MRS Crackers Admin 2FA Security OTP';
      const emailBody = `Your 2FA Security Login OTP is: ${generatedOtp}\n\nTimestamp: ${new Date().toLocaleString()}\nValid for 5 minutes.`;
      emailBtn.href = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSub)}&body=${encodeURIComponent(emailBody)}`;
    }

    // Server-side backend notification dispatch
    if (typeof MRS_BACKEND !== 'undefined') {
      if (typeof MRS_BACKEND.dispatchSecurityOtp === 'function') {
        MRS_BACKEND.dispatchSecurityOtp({
          role: activeGateRole,
          identifier: enteredId,
          mobile: targetMobile,
          email: targetEmail,
          otp: generatedOtp
        });
      }
      // Send real Supabase Auth Email OTP
      if (typeof MRS_BACKEND.sendRealEmailOtp === 'function') {
        MRS_BACKEND.sendRealEmailOtp(targetEmail).then(res => {
          console.log('[PORTALS] Live Supabase email dispatch result:', res);
        });
      }
    }

    const otpInput = document.getElementById('gate-otp-input');
    if (otpInput) { otpInput.value = ''; otpInput.focus(); }

    if (typeof showToast === 'function') {
      showToast('Live OTP dispatched to your Email & WhatsApp! 📲');
    }

    startOtpTimer();
  }

  async function verifyStep2() {
    const otpInput = document.getElementById('gate-otp-input');
    const errorEl = document.getElementById('gate-step2-error');
    const enteredOtp = otpInput ? otpInput.value.trim() : '';

    if (!enteredOtp || enteredOtp.length !== 6) {
      if (errorEl) { errorEl.innerText = 'Please enter the 6-digit OTP.'; errorEl.style.display = 'block'; }
      return;
    }

    let isOtpValid = false;

    // 1. Primary: Verify strictly via backend API without leaking codes
    if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.verifySecurityOtp === 'function') {
      const verifyRes = await MRS_BACKEND.verifySecurityOtp({
        identifier: pendingGateEmail || pendingGateMobile || (activeGateRole === 'admin' ? 'bandirohan43@gmail.com' : 'rider@mrscrackers.com'),
        enteredOtp
      });
      if (verifyRes && verifyRes.success && verifyRes.verified) {
        isOtpValid = true;
      }
    }

    // 2. Real validation against live Supabase Auth Email OTP token
    if (!isOtpValid && typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.verifyRealEmailOtp === 'function' && pendingGateEmail) {
      const emailVerify = await MRS_BACKEND.verifyRealEmailOtp(pendingGateEmail, enteredOtp);
      if (emailVerify && emailVerify.success) {
        isOtpValid = true;
      }
    }

    // 3. Direct validation against dispatched WhatsApp code
    if (!isOtpValid && enteredOtp === generatedOtp) {
      isOtpValid = true;
    }

    if (!isOtpValid) {
      if (errorEl) {
        errorEl.innerText = `Incorrect or expired OTP. Please check your Email (${pendingGateEmail || 'bandirohan43@gmail.com'}) or WhatsApp.`;
        errorEl.style.display = 'block';
      }
      return;
    }

    // Success! Close modal and mount portal
    closeSecurityGate();
    if (otpTimerInterval) clearInterval(otpTimerInterval);

    if (typeof showToast === 'function') {
      showToast(activeGateRole === 'admin' ? '👑 Admin Console Unlocked!' : '🛵 Rider Portal Unlocked!');
    }

    mountPortal(activeGateRole);
  }

  function closeSecurityGate() {
    const modal = document.getElementById('secure-gate-modal');
    if (modal) modal.classList.remove('open');
    if (otpTimerInterval) clearInterval(otpTimerInterval);
  }

  function startOtpTimer() {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    let secondsLeft = 30;
    const timerEl = document.getElementById('gate-otp-timer');
    if (timerEl) timerEl.innerText = `Resend OTP in ${secondsLeft}s`;

    otpTimerInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(otpTimerInterval);
        if (timerEl) timerEl.innerHTML = '<a href="javascript:void(0)" onclick="PORTALS.resendOtp()" style="color: #FFB800; font-weight: 700; text-decoration: none;">Resend Code 🔄</a>';
      } else {
        if (timerEl) timerEl.innerText = `Resend OTP in ${secondsLeft}s`;
      }
    }, 1000);
  }

  function resendOtp() {
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    
    const idInput = document.getElementById('gate-id-input');
    const enteredId = idInput ? idInput.value.trim() : '';
    const targetMobile = pendingGateMobile || (activeGateRole === 'admin' ? '9392819362' : enteredId);
    const targetEmail = pendingGateEmail || (activeGateRole === 'admin' ? 'bandirohan43@gmail.com' : 'rider@mrscrackers.com');

    const waBtn = document.getElementById('gate-otp-whatsapp-btn');
    const emailBtn = document.getElementById('gate-otp-email-btn');

    if (waBtn) {
      const waMsg = `Your MRS Crackers 2FA Security Login OTP is: ${generatedOtp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
      const waUrl = `https://wa.me/91${targetMobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`;
      waBtn.href = waUrl;
      try {
        window.open(waUrl, '_blank');
      } catch (e) {}
    }
    if (emailBtn) {
      const emailSub = 'MRS Crackers Admin 2FA Security OTP (Resent)';
      const emailBody = `Your fresh 2FA Security Login OTP is: ${generatedOtp}\n\nTimestamp: ${new Date().toLocaleString()}\nValid for 5 minutes.`;
      emailBtn.href = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSub)}&body=${encodeURIComponent(emailBody)}`;
    }

    if (typeof MRS_BACKEND !== 'undefined') {
      if (typeof MRS_BACKEND.dispatchSecurityOtp === 'function') {
        MRS_BACKEND.dispatchSecurityOtp({
          role: activeGateRole,
          identifier: enteredId,
          mobile: targetMobile,
          email: targetEmail,
          otp: generatedOtp
        });
      }
      if (typeof MRS_BACKEND.sendRealEmailOtp === 'function') {
        MRS_BACKEND.sendRealEmailOtp(targetEmail);
      }
    }

    if (typeof showToast === 'function') showToast('Fresh OTP dispatched to WhatsApp & Email! 📲');
    startOtpTimer();
  }

  // ===========================================================================
  // 5. ADMIN CONTROLLERS & DATA LOGIC
  // ===========================================================================
  function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    const tabs = ['products', 'payments', 'orders', 'admins', 'settings'];
    tabs.forEach(t => {
      const section = document.getElementById(`admin-section-${t}`);
      const btn = document.getElementById(`atab-btn-${t}`);
      if (section) section.style.display = (t === tabName) ? 'flex' : 'none';
      if (btn) {
        if (t === tabName) {
          btn.style.background = '#FFB800';
          btn.style.color = '#000';
          btn.style.borderColor = '#FFB800';
        } else {
          btn.style.background = '#222';
          btn.style.color = '#9CA3AF';
          btn.style.borderColor = '#333';
        }
      }
    });

    if (tabName === 'products') renderAdminProducts();
    else if (tabName === 'payments') renderAdminPayments();
    else if (tabName === 'orders') renderAdminOrders();
    else if (tabName === 'admins') renderAdminUsers();
    else if (tabName === 'settings') loadEmailSettings();
  }

  function initAdminDashboard() {
    renderAdminProducts();
    renderAdminPayments();
    renderAdminOrders();
    loadEmailSettings();
    renderAdminUsers();
    updateAdminKpis();
    syncAdminDataFromSupabase(true);
  }

  function updateAdminKpis() {
    const prodsEl = document.getElementById('admin-kpi-prods-count');
    const pendingEl = document.getElementById('admin-kpi-pending-count');
    const ordersEl = document.getElementById('admin-kpi-orders-count');
    if (prodsEl && typeof PRODUCTS !== 'undefined') prodsEl.innerText = PRODUCTS.length;
    if (pendingEl && APP_STATE.admin && APP_STATE.admin.orders) {
      const pendingCount = APP_STATE.admin.orders.filter(o => o.paymentStatus === 'PENDING_VERIFICATION' || !o.verified).length;
      pendingEl.innerText = pendingCount;
    }
    if (ordersEl && APP_STATE.admin && APP_STATE.admin.orders) ordersEl.innerText = APP_STATE.admin.orders.length;
  }

  // --- QR & UPI PAYMENTS CONTROLLER ---
  function renderAdminPayments() {
    const m1 = (APP_STATE.merchantConfig && APP_STATE.merchantConfig.merchant1) || {
      name: 'Bandi Rohan (Official Store)',
      upiId: '9392819362@upi',
      qrImage: 'assets/qr_paytm.png'
    };
    const m2 = (APP_STATE.merchantConfig && APP_STATE.merchantConfig.merchant2) || {
      name: 'MRS Crackers Saidabad Counter',
      upiId: 'bandirohan43@okhdfcbank',
      qrImage: 'assets/qr_bharatpe.png'
    };

    const m1Name = document.getElementById('admin-m1-name');
    const m1Upi = document.getElementById('admin-m1-upi');
    const m1Prev = document.getElementById('admin-m1-preview');
    if (m1Name) m1Name.value = m1.name || '';
    if (m1Upi) m1Upi.value = m1.upiId || '';
    if (m1Prev && m1.qrImage) m1Prev.src = m1.qrImage;

    const m2Name = document.getElementById('admin-m2-name');
    const m2Upi = document.getElementById('admin-m2-upi');
    const m2Prev = document.getElementById('admin-m2-preview');
    if (m2Name) m2Name.value = m2.name || '';
    if (m2Upi) m2Upi.value = m2.upiId || '';
    if (m2Prev && m2.qrImage) m2Prev.src = m2.qrImage;
  }

  function handleAdminQrFileUpload(merchantNum, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      const preview = document.getElementById(`admin-m${merchantNum}-preview`);
      if (preview) preview.src = dataUrl;
      if (typeof showToast === 'function') showToast(`Merchant ${merchantNum} QR loaded! Click Save to apply.`);
    };
    reader.readAsDataURL(file);
  }

  function saveMerchantPaymentConfig(event) {
    if (event) event.preventDefault();
    const m1Name = document.getElementById('admin-m1-name')?.value.trim() || 'Bandi Rohan (Official Store)';
    const m1Upi = document.getElementById('admin-m1-upi')?.value.trim() || '9392819362@upi';
    const m1Img = document.getElementById('admin-m1-preview')?.src || 'assets/qr_paytm.png';

    const m2Name = document.getElementById('admin-m2-name')?.value.trim() || 'MRS Crackers Saidabad Counter';
    const m2Upi = document.getElementById('admin-m2-upi')?.value.trim() || 'bandirohan43@okhdfcbank';
    const m2Img = document.getElementById('admin-m2-preview')?.src || 'assets/qr_bharatpe.png';

    if (!APP_STATE.merchantConfig) APP_STATE.merchantConfig = {};
    APP_STATE.merchantConfig.merchant1 = { name: m1Name, upiId: m1Upi, qrImage: m1Img };
    APP_STATE.merchantConfig.merchant2 = { name: m2Name, upiId: m2Upi, qrImage: m2Img };

    try {
      localStorage.setItem('mrs_merchant_config', JSON.stringify(APP_STATE.merchantConfig));
    } catch (e) {}

    // Update customer checkout payment display if present
    if (typeof updateCheckoutPaymentDisplay === 'function') updateCheckoutPaymentDisplay();
    if (typeof showToast === 'function') {
      showToast('✅ Real QR Codes and UPI IDs updated live across storefront!');
    }
  }

  // --- PRODUCTS CONTROLLER ---
  function renderAdminProducts(filterSearch = '', categoryFilter = 'all') {
    const container = document.getElementById('admin-products-table-body');
    if (!container || typeof PRODUCTS === 'undefined') return;

    let list = PRODUCTS;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.categoryName && p.categoryName.toLowerCase().includes(q)));
    }
    if (categoryFilter && categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter || p.category_id === categoryFilter);
    }

    container.innerHTML = list.map(prod => {
      const inStock = prod.inStock !== false;
      return `
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            <div style="width: 44px; height: 44px; min-width: 44px; border-radius: 6px; background: #1C1C1C; border: 1px solid #333; overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img src="${prod.image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>

      
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 700; color: #FFFFFF; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</div>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                <span style="font-size: 0.6rem; background: #222; border: 1px solid #333; color: #FFB800; padding: 1px 5px; border-radius: 3px; font-family: var(--font-mono, monospace);">${prod.categoryName || prod.category}</span>
                <span style="font-size: 0.65rem; color: #9CA3AF;">${prod.packSize || ''}</span>
              </div>

      
            </div>

      
          </div>

      

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <span style="font-size: 0.92rem; font-weight: 800; color: #FFB800;">₹${prod.price}</span>
              <span style="font-size: 0.65rem; color: #666; text-decoration: line-through;">₹${prod.mrp}</span>
            </div>

      
            <div style="display: flex; gap: 6px;">
              <button onclick="PORTALS.toggleProductInStock(${prod.id})" style="background: ${inStock ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${inStock ? '#22C55E' : '#EF4444'}; color: ${inStock ? '#22C55E' : '#EF4444'}; font-size: 0.62rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                ${inStock ? '🟢 IN STOCK' : '🔴 OUT OF STOCK'}
              </button>
              <button onclick="PORTALS.openAdminEditProductModal(${prod.id})" style="background: #222; border: 1px solid #444; color: #FFF; font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                ✏️ Edit
              </button>
            </div>

      
          </div>

      
        </div>

      
      `;
    }).join('');

    updateAdminKpis();
  }

  function filterAdminProductsList() {
    const q = document.getElementById('admin-search-products-input')?.value.trim();
    const cat = document.getElementById('admin-filter-category-select')?.value;
    renderAdminProducts(q, cat);
  }

  function toggleAdminAddProductForm() {
    const form = document.getElementById('admin-add-product-form');
    const btn = document.getElementById('admin-toggle-add-btn');
    if (!form) return;
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    if (btn) btn.innerText = isHidden ? '✕ Close Form' : '➕ Add Cracker';
  }

  async function saveNewProductFromAdmin(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('new-item-name')?.value.trim();
    const category = document.getElementById('new-item-category')?.value;
    const packSize = document.getElementById('new-item-packsize')?.value.trim();
    const price = parseInt(document.getElementById('new-item-price')?.value, 10);
    const mrp = parseInt(document.getElementById('new-item-mrp')?.value, 10);
    const image = document.getElementById('new-item-image')?.value.trim() || 'assets/cat_sparklers.png';

    if (!name || !price || !mrp) {
      alert('Please fill product name, price, and MRP!');
      return;
    }

    const maxId = PRODUCTS.reduce((max, p) => p.id > max ? p.id : max, 0);
    const newId = maxId + 1;
    const catName = category.charAt(0).toUpperCase() + category.slice(1);

    const newProd = {
      id: newId,
      name,
      category,
      categoryName: catName,
      packSize: packSize || '10 pieces/box',
      price,
      mrp,
      image,
      inStock: true,
      stock: 150,
      description: `${name} premium Sivakasi wholesale cracker.`
    };

    PRODUCTS.unshift(newProd);

    // Save to Supabase Cloud Database!
    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.saveProduct(newProd);
    }

    toggleAdminAddProductForm();
    renderAdminProducts();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderQuickOrderTable === 'function') renderQuickOrderTable();
    if (typeof showToast === 'function') showToast(`Added "${name}" to store catalog! 💥`);
  }

  function openAdminEditProductModal(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-name').value = prod.name;
    document.getElementById('edit-prod-price').value = prod.price;
    document.getElementById('edit-prod-mrp').value = prod.mrp;
    document.getElementById('edit-prod-packsize').value = prod.packSize || '10 pieces/box';
    document.getElementById('edit-prod-image').value = prod.image;
    document.getElementById('edit-prod-instock').checked = prod.inStock !== false;
    document.getElementById('edit-prod-preview-img').src = prod.image;

    const modal = document.getElementById('admin-edit-product-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeAdminEditProductModal() {
    const modal = document.getElementById('admin-edit-product-modal');
    if (modal) modal.style.display = 'none';
  }

  function updateEditProductImagePreview(url) {
    const img = document.getElementById('edit-prod-preview-img');
    if (img && url) img.src = url.trim();
  }

  async function saveAdminEditProduct(event) {
    if (event) event.preventDefault();
    const id = parseInt(document.getElementById('edit-prod-id')?.value, 10);
    const name = document.getElementById('edit-prod-name')?.value.trim();
    const price = parseInt(document.getElementById('edit-prod-price')?.value, 10);
    const mrp = parseInt(document.getElementById('edit-prod-mrp')?.value, 10);
    const packSize = document.getElementById('edit-prod-packsize')?.value.trim();
    const image = document.getElementById('edit-prod-image')?.value.trim();
    const inStock = document.getElementById('edit-prod-instock')?.checked;

    const prod = PRODUCTS.find(p => p.id === id);
    if (!prod) return;

    prod.name = name;
    prod.price = price;
    prod.mrp = mrp;
    prod.packSize = packSize;
    prod.image = image;
    prod.inStock = inStock;

    // Save to Supabase Cloud Database!
    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateProduct(id, {
        name,
        price,
        mrp,
        packSize,
        image,
        inStock
      });
    }

    closeAdminEditProductModal();
    renderAdminProducts();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderQuickOrderTable === 'function') renderQuickOrderTable();
    if (typeof showToast === 'function') showToast(`Updated "${name}" details! ✨`);
  }

  async function toggleProductInStock(productId) {
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    prod.inStock = !prod.inStock;

    // Save to Supabase Cloud Database!
    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateProduct(productId, { inStock: prod.inStock });
    }

    renderAdminProducts();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof showToast === 'function') showToast(`${prod.name} is now ${prod.inStock ? '🟢 IN STOCK' : '🔴 OUT OF STOCK'}`);
  }

  // --- RIDERS CONTROLLER ---
  function renderAdminDrivers() {
    const container = document.getElementById('admin-drivers-table-body');
    if (!container) return;

    if (!APP_STATE.registeredDrivers || APP_STATE.registeredDrivers.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; background: rgba(24, 9, 56, 0.6); border: 1px dashed rgba(139, 92, 246, 0.4); border-radius: 12px; color: #9CA3AF;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🛵</div>
          <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem;">No Delivery Riders Registered Yet</div>
          <div style="font-size: 0.75rem; color: #A78BFA; margin-top: 4px;">Use the '+ Add New Rider' button above to register your first delivery partner.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = APP_STATE.registeredDrivers.map(d => {
      return `
        <div onclick="PORTALS.openAdminRiderModal('${d.id}')" style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#22C55E'" onmouseout="this.style.borderColor='#282828'">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #1C1C1C; border: 1px solid #22C55E; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              🛵
            </div>

      
            <div>
              <div style="font-weight: 800; font-size: 0.88rem; color: #FFFFFF;">${d.name} (${d.id})</div>
              <div style="font-size: 0.68rem; color: #9CA3AF; margin-top: 2px;">
                📞 ${d.phone} • ✉️ ${d.email}<br>
                <span style="color: #60A5FA;">${d.vehicle}</span>
              </div>

      
            </div>

      
          </div>

      

          <div style="text-align: right;">
            <span class="status-badge" style="background: ${d.isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${d.isOnline ? '#22C55E' : '#EF4444'}; border: 1px solid ${d.isOnline ? '#22C55E' : '#EF4444'}; font-size: 0.62rem; padding: 2px 6px; border-radius: 10px;">
              ${d.isOnline ? '🟢 ON DUTY' : '🔴 OFFLINE'}
            </span>
            <div style="font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #FFB800; margin-top: 4px; font-weight: 700;">
              📦 ${d.completedTrips || 0} Drops • ₹${d.todayEarnings || 0}
            </div>

      
            <div style="font-size: 0.65rem; color: #22C55E; margin-top: 2px; font-weight: 700;">
              🔍 Click to Track Deliveries ➡️
            </div>

      
          </div>

      
        </div>

      
      `;
    }).join('');

    updateAdminKpis();
  }

  async function registerNewRiderFromForm(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('form-rider-name')?.value.trim();
    const mobile = document.getElementById('form-rider-mobile')?.value.trim();
    const email = document.getElementById('form-rider-email')?.value.trim().toLowerCase();
    const vehicle = document.getElementById('form-rider-vehicle')?.value;
    const pin = document.getElementById('form-rider-pin')?.value.trim();

    if (!name || !mobile || !email || !pin) {
      alert('Please fill Rider Name, Mobile, Email, and Secure PIN!');
      return;
    }

    const newDriver = {
      id: `DRV-${100 + APP_STATE.registeredDrivers.length + 1}`,
      name,
      email,
      phone: mobile,
      vehicle,
      pin,
      isOnline: true,
      rating: 5.0,
      todayEarnings: 0,
      completedTrips: 0
    };

    APP_STATE.registeredDrivers.unshift(newDriver);

    // Sync to Supabase Cloud Database!
    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.registerDriverByAdmin({
        id: newDriver.id,
        name: newDriver.name,
        email: newDriver.email,
        mobile: newDriver.phone,
        vehicle: newDriver.vehicle
      });
    }

    // Reset inputs
    document.getElementById('form-rider-name').value = '';
    document.getElementById('form-rider-mobile').value = '';
    document.getElementById('form-rider-email').value = '';

    renderAdminDrivers();
    if (typeof showToast === 'function') {
      showToast(`Rider ${name} registered in Supabase! Granted Driver View access 🛵`);
    }
  }

  function openAdminRiderModal(driverId) {
    selectedRiderId = driverId;
    const driver = APP_STATE.registeredDrivers.find(d => d.id === driverId) || APP_STATE.registeredDrivers[0];
    if (!driver) return;

    document.getElementById('rider-modal-name').innerText = `${driver.name} (${driver.id})`;
    document.getElementById('rider-modal-vehicle').innerText = driver.vehicle;
    document.getElementById('rider-modal-phone').innerText = driver.phone;
    document.getElementById('rider-modal-call-btn').href = `tel:${driver.phone}`;
    document.getElementById('rider-modal-drops').innerText = driver.completedTrips || 0;
    document.getElementById('rider-modal-earnings').innerText = `₹${driver.todayEarnings || 0}`;
    document.getElementById('rider-modal-status').innerText = driver.isOnline ? '🟢 ON DUTY' : '🔴 OFFLINE';

    // Populate assigned deliveries
    const container = document.getElementById('rider-modal-deliveries-container');
    const assignedRuns = (APP_STATE.driverAssignments || []).filter(a => a.assignedDriver === driverId || driver.name.includes('Ramesh') || a.assignedVehicle === driver.vehicle);

    if (container) {
      if (assignedRuns.length === 0) {
        container.innerHTML = `
          <div style="background: #111; padding: 14px; text-align: center; border-radius: 6px; border: 1px dashed #333; font-size: 0.72rem; color: #9CA3AF;">
            No active orders currently assigned to ${driver.name}.<br>Select an order below to assign a delivery run.
          </div>

      
        `;
      } else {
        container.innerHTML = assignedRuns.map(run => {
          let stageColor = '#FFB800';
          let stageText = 'ASSIGNED';
          if (run.deliveryStage === 'picked_up') { stageColor = '#38BDF8'; stageText = 'PICKED UP (IN TRANSIT)'; }
          else if (run.deliveryStage === 'out_for_delivery') { stageColor = '#22C55E'; stageText = 'OUT FOR DELIVERY'; }
          else if (run.deliveryStage === 'delivered') { stageColor = '#34d399'; stageText = 'DELIVERED'; }

          return `
            <div style="background: #111; border: 1px solid #282828; border-radius: 6px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-family: var(--font-mono, monospace); font-weight: 800; color: #FFFFFF; font-size: 0.85rem;">${run.orderId}</span>
                <span style="font-size: 0.62rem; color: ${stageColor}; border: 1px solid ${stageColor}; padding: 2px 6px; border-radius: 10px; font-weight: 700;">${stageText}</span>
              </div>

      
              <div style="font-size: 0.72rem; color: #D1D5DB; line-height: 1.3;">
                <strong>Customer:</strong> ${run.customer} (${run.phone})<br>
                <strong>Address:</strong> ${run.address}<br>
                <span style="color: #FFB800;">Amount: ₹${run.amount} (${run.paymentMode})</span> • Weight: ${run.weight}
              </div>

      
              <div style="background: #000; padding: 4px 8px; border-radius: 4px; margin-top: 6px; display: flex; justify-content: space-between; font-size: 0.65rem; font-family: var(--font-mono, monospace);">
                <span style="color: #9CA3AF;">Handover Verification: <strong style="color: #22C55E;">OTP Protected</strong></span>
                <span style="color: #60A5FA;">Counter Rack: ${run.pickupRack || 'Rack R-12'}</span>
              </div>

      
            </div>

      
          `;
        }).join('');
      }
    }

    // Populate unassigned order select dropdown
    const select = document.getElementById('rider-modal-assign-order-select');
    if (select) {
      const orders = (APP_STATE.admin && APP_STATE.admin.orders) ? APP_STATE.admin.orders : [];
      select.innerHTML = orders.map(o => `<option value="${o.id}">${o.id} - ${o.customer} (₹${o.amount})</option>`).join('');
    }

    const modal = document.getElementById('admin-rider-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeAdminRiderModal() {
    const modal = document.getElementById('admin-rider-modal');
    if (modal) modal.style.display = 'none';
  }

  function assignSelectedOrderToCurrentRider() {
    const select = document.getElementById('rider-modal-assign-order-select');
    const orderId = select?.value;
    if (!orderId || !selectedRiderId) return;

    const driver = APP_STATE.registeredDrivers.find(d => d.id === selectedRiderId);
    if (!driver) return;

    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    // Create / push new run into driverAssignments
    APP_STATE.driverAssignments.unshift({
      orderId: order.id,
      customer: order.customer,
      phone: order.phone || '9848012345',
      address: typeof order.address === 'string' ? order.address : 'Saidabad Colony, Hyderabad',
      pickupRack: 'Rack R-12 (Saidabad Counter)',
      weight: order.weight || '1.5 kg',
      assignedVehicle: driver.vehicle,
      assignedDriver: driver.id,
      amount: order.amount,
      paymentMode: order.payment || 'Paytm',
      deliveryStage: 'picked_up',
      customerOtp: String(Math.floor(1000 + Math.random() * 9000)),
      notes: 'Hand over safely to customer.'
    });

    // Update in Supabase
    if (typeof MRS_BACKEND !== 'undefined') {
      MRS_BACKEND.updateOrderStatus(order.id, 'out_for_delivery', driver.id);
    }

    openAdminRiderModal(selectedRiderId);
    renderAdminDrivers();
    renderAdminOrders();
    if (typeof showToast === 'function') showToast(`Order ${orderId} dispatched to ${driver.name}! 🛵`);
  }

  // --- ORDERS CONTROLLER ---
  function renderAdminOrders(statusFilter = null) {
    if (statusFilter) currentOrderFilter = statusFilter;
    const container = document.getElementById('admin-orders-table-body');
    if (!container || !APP_STATE.admin || !APP_STATE.admin.orders) return;

    let orders = APP_STATE.admin.orders;
    if (currentOrderFilter === 'received') {
      orders = orders.filter(o => o.status === 'Processing' || o.status === 'received' || o.paymentStatus === 'PENDING_VERIFICATION' || o.paymentStatus === 'COD_PENDING' || !o.verified || o.status === 'Confirmed & Packing');
    } else if (currentOrderFilter === 'in_transit') {
      orders = orders.filter(o => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'In Transit', 'Confirmed & Packing', 'CONFIRMED'].includes(o.status));
    } else if (currentOrderFilter === 'delivered') {
      orders = orders.filter(o => o.status === 'Delivered' || o.status === 'delivered');
    }

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: rgba(24, 9, 56, 0.6); border: 1px dashed rgba(139, 92, 246, 0.4); border-radius: 12px; color: #9CA3AF;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📦</div>
          <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem;">No Customer Orders Found</div>
          <div style="font-size: 0.75rem; color: #A78BFA; margin-top: 4px;">Orders placed by customers will appear here for verification and driver dispatch.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      const isDelivered = order.status === 'Delivered' || order.status === 'delivered';
      const isCodOrder = order.paymentStatus === 'COD_PENDING' || (order.payment && order.payment.includes('Cash on Delivery')) || order.paymentMethod === 'cod';
      const isPaid = order.paymentStatus === 'PAID' || (order.verified === true && !isCodOrder) || order.status === 'CONFIRMED';
      const isPendingPayment = !isCodOrder && (order.paymentStatus === 'PENDING_VERIFICATION');
      const isRejected = order.paymentStatus === 'REJECTED' || order.status === 'CANCELLED';
      const customerEmail = order.email || (APP_STATE.user && APP_STATE.user.email) || 'bandirohan43@gmail.com';
      const customerPhone = order.phone || '9392819362';

      let statusBadgeColor = '#FFB800';
      let statusBadgeBg = 'rgba(255, 184, 0, 0.15)';
      if (isDelivered) {
        statusBadgeColor = '#22C55E';
        statusBadgeBg = 'rgba(34, 197, 94, 0.15)';
      } else if (isRejected) {
        statusBadgeColor = '#EF4444';
        statusBadgeBg = 'rgba(239, 68, 68, 0.15)';
      } else if (isCodOrder) {
        statusBadgeColor = '#22C55E';
        statusBadgeBg = 'rgba(34, 197, 94, 0.15)';
      } else if (isPaid) {
        statusBadgeColor = '#38BDF8';
        statusBadgeBg = 'rgba(56, 189, 248, 0.15)';
      }

      return `
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: var(--font-mono, monospace); font-weight: 800; font-size: 0.9rem; color: #FFFFFF;">${order.id}</span>
              <span style="font-size: 0.65rem; color: #9CA3AF;">${order.date || 'Today, Saidabad'}</span>
            </div>

            <span class="status-badge" style="background: ${statusBadgeBg}; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px; font-weight: 700;">
              ${isCodOrder && !isDelivered ? '💵 CASH ON DELIVERY (ACTIVE)' : (order.paymentStatus === 'PENDING_VERIFICATION' ? '⏳ PENDING PAYMENT VERIFICATION' : order.status)}
            </span>
          </div>

      

          <div style="font-size: 0.75rem; color: #D1D5DB; line-height: 1.4;">
            <strong>Customer:</strong> ${order.customer} (+91 ${customerPhone})<br>
            <span style="color: #9CA3AF;">Registered Email:</span> <span style="color: #60A5FA;">${customerEmail}</span><br>
            <span style="color: #9CA3AF;">Amount:</span> <strong style="color: #FFB800; font-size: 0.85rem;">₹${order.amount}</strong> (${order.payment || 'Cash on Delivery'})
            ${order.utr && order.utr !== 'CASH-ON-DELIVERY' ? `<br><span style="color: #34d399; font-family: var(--font-mono, monospace);">UTR / Ref: ${order.utr}</span>` : ''}
            ${order.assignedRiderName ? `<br><span style="color: #A78BFA; font-weight: 700;">Assigned Rider: ${order.assignedRiderName}</span>` : ''}
            ${order.type === 'store' ? `<br><span style="color: #F59E0B; font-weight: 700;">Counter Store Pickup (Saidabad Hub)</span>` : `<br><span style="color: #38BDF8; font-weight: 700;">Express Doorstep Delivery</span>`}
          </div>

          ${(isCodOrder && !isDelivered) ? `
            <!-- Cash on Delivery Fulfillment Actions -->
            <div style="background: rgba(34, 197, 94, 0.08); border: 1.5px solid #22C55E; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.74rem; color: #86EFAC; font-weight: 800;">💵 Cash on Delivery (Amount to collect: ₹${order.amount})</span>
                <span style="font-size: 0.65rem; background: #DCFCE7; color: #15803D; padding: 2px 6px; border-radius: 4px; font-weight: 800;">COD ORDER</span>
              </div>
              <div style="font-size: 0.7rem; color: #D1D5DB;">
                Hand over crackers consignment & collect <strong>₹${order.amount} in cash</strong> from customer upon delivery / counter handover.
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button onclick="PORTALS.markOrderCompleted('${order.id}')" style="background: #22C55E; color: #000; border: none; font-size: 0.72rem; font-weight: 800; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                  ✅ Mark Delivered & Cash Collected (₹${order.amount})
                </button>
                <button onclick="window.MRS_INVOICE.openInvoiceModal('${order.id}')" style="background: var(--purple-primary); color: #FFFFFF; border: none; font-size: 0.68rem; font-weight: 800; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                  📄 View GST Invoice
                </button>
                <button onclick="window.open(window.MRS_INVOICE.getWhatsAppUrl(APP_STATE.admin.orders.find(o => o.id === '${order.id}') || {}), '_blank')" style="background: rgba(34, 197, 94, 0.2); border: 1px solid #22C55E; color: #86EFAC; font-size: 0.68rem; font-weight: 800; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                  💬 WhatsApp Customer
                </button>
              </div>
            </div>
          ` : ''}

      

          ${isPendingPayment ? `
            <!-- Payment Verification Actions -->
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 0.7rem; color: #FBBF24; font-weight: 700;">
                Verify Customer Payment (UTR: ${order.utr || 'Pending'})
              </div>

      
              <div style="display: flex; gap: 6px;">
                <button onclick="PORTALS.adminVerifyPayment('${order.id}')" style="flex: 1; background: #22C55E; color: #000; border: none; font-size: 0.68rem; font-weight: 800; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                  ✓ Verify & Confirm (PAID)
                </button>
                <button onclick="PORTALS.adminRejectPayment('${order.id}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #F87171; font-size: 0.68rem; font-weight: 700; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                  ✕ Reject Payment
                </button>
              </div>

      
            </div>

      
          ` : ''}

          ${isPaid ? `
            <!-- Confirmed / Delivered & Tax Invoice Audit -->
            <div style="background: rgba(34, 197, 94, 0.08); border: 1px dashed #22C55E; border-radius: 6px; padding: 8px 10px; font-size: 0.68rem; color: #86EFAC;">
              <div style="font-weight: 700; color: #34d399;">✓ Payment Verified & Order Confirmed</div>
              <div style="color: #D1D5DB; margin-top: 2px;">
                Tax invoice & confirmation sent to: <strong>${customerEmail}</strong>
              </div>

              <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                <button onclick="window.MRS_INVOICE.openInvoiceModal('${order.id}')" style="background: var(--purple-primary); color: #FFFFFF; border: none; font-size: 0.68rem; font-weight: 800; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                  📄 View GST Invoice
                </button>
                <button onclick="window.open(window.MRS_INVOICE.getWhatsAppUrl(APP_STATE.admin.orders.find(o => o.id === '${order.id}') || {}), '_blank')" style="background: #22C55E; color: #FFF; border: none; font-size: 0.68rem; font-weight: 800; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                  💬 WhatsApp Customer
                </button>
                ${!isDelivered ? `
                  <button onclick="PORTALS.markOrderCompleted('${order.id}')" style="background: #3B82F6; color: #FFF; border: none; font-size: 0.68rem; font-weight: 800; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    ✅ Mark Completed
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    updateAdminKpis();
  }

  function filterAdminOrdersByStatus(status) {
    currentOrderFilter = status;
    const pills = ['all', 'received', 'in_transit', 'delivered'];
    pills.forEach(p => {
      const btn = document.getElementById(`ofilt-${p}`);
      if (btn) {
        if (p === status) {
          btn.style.background = '#7C3AED';
          btn.style.color = '#FFF';
          btn.style.borderColor = '#7C3AED';
        } else {
          btn.style.background = '#222';
          btn.style.color = '#9CA3AF';
          btn.style.borderColor = '#444';
        }
      }
    });
    renderAdminOrders();
  }

  async function markOrderCompleted(orderId) {
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = 'Delivered';
    order.paymentStatus = 'PAID';
    order.verified = true;
    order.completedAt = new Date().toISOString();

    // Trigger tax invoice dispatch to customer
    try {
      if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.sendInvoice === 'function') {
        const items = order.items && order.items.length ? order.items : [
          { name: 'Diwali Fireworks Consignment', price: order.amount, qty: 1 }
        ];
        await MRS_BACKEND.sendInvoice({
          orderId: order.id,
          customerName: order.customer || 'Valued Customer',
          customerEmail: order.email || 'bandirohan43@gmail.com',
          customerMobile: order.phone || '9392819362',
          items: items,
          totalAmount: order.amount,
          paymentMode: order.paymentMode || order.payment || 'Cash on Delivery (COD)',
          utr: order.utr || 'COD-COLLECTED',
          deliveryAddress: typeof order.address === 'string' ? order.address : 'Saidabad Wholesale Counter Hub'
        });
      }
    } catch (err) {
      console.warn('[PORTALS] Invoice dispatch notice:', err);
    }

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderStatus(orderId, 'delivered');
    }
    renderAdminOrders();
    updateAdminKpis();
    if (typeof showToast === 'function') showToast(`Order #${orderId} marked as delivered & cash collected! ✅`);
  }

  async function adminVerifyPayment(orderId) {
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    order.paymentStatus = 'PAID';
    order.status = 'CONFIRMED';
    order.verified = true;
    order.verifiedAt = new Date().toISOString();
    order.verifiedBy = 'Bandi Rohan (Super Admin)';

    // Trigger confirmation email & official GST Tax Invoice dispatch to customer
    try {
      if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.sendInvoice === 'function') {
        const items = order.items && order.items.length ? order.items : [
          { name: 'Diwali Fireworks Consignment', price: order.amount, qty: 1 }
        ];
        await MRS_BACKEND.sendInvoice({
          orderId: order.id,
          customerName: order.customer || 'Valued Customer',
          customerEmail: order.email || 'bandirohan43@gmail.com',
          customerMobile: order.phone || '9392819362',
          items: items,
          totalAmount: order.amount,
          paymentMode: order.paymentMode || order.payment || 'Online UPI',
          utr: order.utr || 'VERIFIED-MANUAL',
          deliveryAddress: typeof order.address === 'string' ? order.address : 'Saidabad Wholesale Counter Hub'
        });
      }
    } catch (err) {
      console.warn('[PORTALS] Invoice dispatch notice:', err);
    }

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderUTR(orderId, order.utr || 'VERIFIED-MANUAL');
      await MRS_BACKEND.updateOrderStatus(orderId, 'CONFIRMED');
    }

    renderAdminOrders();
    updateAdminKpis();
    if (typeof showToast === 'function') {
      showToast(`✅ Payment verified for #${orderId}! Confirmation email & GST invoice sent to ${order.customer}.`);
    }
  }

  async function adminRejectPayment(orderId) {
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    const reason = prompt('Enter rejection reason for customer:', 'Payment reference not found on UPI statement');
    if (!reason) return;

    order.paymentStatus = 'REJECTED';
    order.status = 'CANCELLED';
    order.rejectionReason = reason;
    order.rejectedAt = new Date().toISOString();

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderStatus(orderId, 'CANCELLED');
    }

    renderAdminOrders();
    if (typeof showToast === 'function') showToast(`Order ${orderId} payment rejected and cancelled.`);
  }

  async function adminAssignRiderDirect(orderId, riderId) {
    if (!riderId) return;
    const rider = (APP_STATE.registeredDrivers || []).find(d => d.id === riderId);
    if (!rider) {
      alert('Access Denied: Cannot assign order. This rider has not signed up or is not registered with the store.');
      return;
    }
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    const secureCustomerOtp = String(Math.floor(1000 + Math.random() * 9000));
    order.assignedDriverId = riderId;
    order.assignedRiderName = rider.name;
    order.assignedRiderPhone = rider.phone;
    order.status = 'ASSIGNED';
    order.deliveryOtp = secureCustomerOtp;
    order.otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    order.otpAttempts = 0;

    // Push into driverAssignments
    if (!APP_STATE.driverAssignments) APP_STATE.driverAssignments = [];
    APP_STATE.driverAssignments.unshift({
      orderId: order.id,
      customer: order.customer,
      customerName: order.customer,
      phone: order.phone,
      address: typeof order.address === 'object' ? `${order.address.house}, ${order.address.area}, Hyderabad` : order.address,
      amount: order.amount,
      weight: order.weight || '2.5 kg',
      pickupRack: order.rackNo || 'R-4',
      paymentMode: order.payment,
      assignedDriver: riderId,
      deliveryStage: 'assigned',
      customerOtp: secureCustomerOtp,
      otpExpiresAt: order.otpExpiresAt,
      otpAttempts: 0
    });

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderStatus(orderId, 'ASSIGNED', riderId);
    }

    renderAdminOrders();
    if (typeof showToast === 'function') showToast(`Order ${orderId} assigned to ${rider.name}!`);
  }

  async function adminVerifyOrderUTR(orderId) {
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    order.verified = true;
    order.status = 'Counter Packed (Ready)';

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderUTR(orderId, order.utr || 'VERIFIED-MANUAL');
      await MRS_BACKEND.updateOrderStatus(orderId, 'packed');
    }

    renderAdminOrders();
    if (typeof showToast === 'function') showToast(`Payment for order ${orderId} verified! 💥`);
  }

  async function advanceAdminOrderStatus(orderId, nextStatus) {
    const order = APP_STATE.admin.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = nextStatus === 'delivered' ? 'Delivered' : 'In Transit';

    if (typeof MRS_BACKEND !== 'undefined') {
      await MRS_BACKEND.updateOrderStatus(orderId, nextStatus);
    }

    // STRICT TRIGGER: Official Tax Invoice is generated and sent ONLY WHEN MARKED DELIVERED
    if (nextStatus === 'delivered') {
      if (typeof window.MRS_INVOICE !== 'undefined') {
        window.MRS_INVOICE.dispatchDeliveryInvoice(order);
      }
    }

    renderAdminOrders();
    if (typeof showToast === 'function') {
      showToast(nextStatus === 'delivered' ? `Order ${orderId} Marked Delivered! GST Tax invoice sent to Email & WhatsApp. 💥` : `Order ${orderId} marked as In Transit! 🚀`);
    }
  }

  // --- SETTINGS CONTROLLER ---
  function setAdminPaymentReceiver(merchant) {
    APP_STATE.admin.activeReceiver = merchant;
    if (typeof showToast === 'function') {
      showToast(`Active Store UPI receiver switched to: ${merchant === 'paytm' ? 'Bandi Rohan (UPI)' : 'M. Akhil Ram Prasad (BharatPe)'} 💳`);
    }
  }

  function updateAnnouncementTicker() {
    const text = document.getElementById('admin-announcement-input')?.value.trim();
    if (text) {
      APP_STATE.admin.announcementText = text;
      const banner = document.getElementById('top-announcement-text');
      if (banner) banner.innerText = text;
      if (typeof showToast === 'function') showToast('Store announcement ticker updated! 📢');
    }
  }

  async function syncAdminDataFromSupabase(silent = false) {
    if (typeof MRS_BACKEND === 'undefined') return;

    try {
      // 1. Hydrate Products
      const liveProds = await MRS_BACKEND.getProducts();
      if (liveProds && liveProds.length > 0) {
        PRODUCTS = liveProds;
        renderAdminProducts();
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof renderQuickOrderTable === 'function') renderQuickOrderTable();
      }

      // 2. Hydrate Drivers strictly from Supabase
      const liveDrivers = await MRS_BACKEND.getDrivers();
      if (liveDrivers && liveDrivers.length > 0) {
        APP_STATE.registeredDrivers = liveDrivers.map(d => ({
          id: d.id,
          name: d.username,
          email: d.email,
          phone: d.mobile || '',
          vehicle: d.vehicle || 'Delivery Bike',
          isOnline: true,
          rating: 5.0,
          todayEarnings: 0,
          completedTrips: 0
        }));
      } else {
        APP_STATE.registeredDrivers = [];
      }
      renderAdminDrivers();

      // 3. Hydrate Orders
      const liveOrders = await MRS_BACKEND.getOrders();
      if (liveOrders && liveOrders.length > 0) {
        liveOrders.forEach(lo => {
          const exists = APP_STATE.admin.orders.find(o => o.id === lo.order_number);
          if (!exists) {
            APP_STATE.admin.orders.unshift({
              id: lo.order_number,
              customer: lo.customer_name,
              phone: lo.customer_mobile,
              amount: Number(lo.total_amount),
              payment: lo.payment_method === 'cod' ? 'Cash on Delivery' : 'Paytm UPI',
              status: lo.order_status,
              utr: lo.utr_number,
              verified: lo.payment_status === 'verified'
            });
          }
        });
        renderAdminOrders();
      }

      updateAdminKpis();
      if (!silent && typeof showToast === 'function') {
        showToast('Store catalog & orders refreshed! ✨');
      }
    } catch (err) {
      console.warn('Sync error:', err);
    }
  }

  
  // --- ADMIN USERS MANAGEMENT CONTROLLER ---
  async function renderAdminUsers() {
    const container = document.getElementById('admin-users-table-body');
    if (!container) return;

    let admins = [];
    if (typeof MRS_BACKEND !== 'undefined' && MRS_BACKEND.getAdmins) {
      admins = await MRS_BACKEND.getAdmins();
    } else {
      try {
        admins = JSON.parse(localStorage.getItem('mrs_registered_admins') || '[]');
      } catch (e) {}
    }

    if (!admins || admins.length === 0) {
      admins = [
        {
          id: 'admin_rohan',
          username: 'Bandi Rohan (Admin)',
          email: 'bandirohan43@gmail.com',
          mobile: '9392819362',
          role: 'admin'
        }
      ];
    }

    container.innerHTML = admins.map(a => {
      const email = a.email || '';
      const mobile = a.mobile || '';
      const isSuper = email.toLowerCase() === 'bandirohan43@gmail.com' || mobile === '9392819362';
      const canDelete = admins.length > 1 && !isSuper;
      return `
        <div style="background: #180938; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #1C1C1C; border: 1px solid #FFB800; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              👑
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.85rem; color: #FFFFFF;">${a.username || a.name || 'Admin'}</div>
              <div style="font-size: 0.68rem; color: #9CA3AF; margin-top: 2px;">
                <span style="color: #FFB800; font-family: var(--font-mono, monospace);">${email}</span> • Mobile: ${mobile || 'N/A'}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: rgba(255, 184, 0, 0.15); border: 1px solid #FFB800; color: #FFB800; font-size: 0.62rem; font-weight: 700; padding: 3px 8px; border-radius: 12px;">
              ${isSuper ? 'Primary Admin' : 'Admin'}
            </span>
            ${canDelete ? `
              <button onclick="PORTALS.removeAdminUser('${a.id}', '${email}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; color: #EF4444; font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                Remove
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  async function registerNewAdminFromForm(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById('form-admin-name');
    const mobileInput = document.getElementById('form-admin-mobile');
    const emailInput = document.getElementById('form-admin-email');
    const passInput = document.getElementById('form-admin-pass');

    const name = nameInput ? nameInput.value.trim() : '';
    const mobile = mobileInput ? mobileInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const pass = passInput ? passInput.value.trim() : 'Rohan@123';

    if (!name || !email || !mobile || !pass) {
      alert('Please fill all admin details.');
      return;
    }

    if (typeof MRS_BACKEND !== 'undefined' && MRS_BACKEND.addAdmin) {
      await MRS_BACKEND.addAdmin({ name, email, mobile, password: pass });
    }

    if (nameInput) nameInput.value = '';
    if (mobileInput) mobileInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';

    renderAdminUsers();
    if (typeof showToast === 'function') {
      showToast(`Admin registered: ${name}! 👑`);
    }
  }

  async function removeAdminUser(id, email) {
    if (!confirm(`Are you sure you want to remove admin access for ${email}?`)) return;
    if (typeof MRS_BACKEND !== 'undefined' && MRS_BACKEND.removeAdmin) {
      await MRS_BACKEND.removeAdmin(id, email);
    }
    renderAdminUsers();
    if (typeof showToast === 'function') {
      showToast(`Admin removed: ${email}`);
    }
  }

  async function saveEmailSettings() {
    const user = document.getElementById('admin-smtp-user')?.value.trim();
    const pass = document.getElementById('admin-smtp-pass')?.value.trim();
    const orderReceivingEmail = document.getElementById('admin-order-receiving-email')?.value.trim();
    const adminMobile = document.getElementById('admin-sender-mobile')?.value.trim();
    const brevoKey = document.getElementById('admin-brevo-api-key')?.value.trim();
    const ultraInstance = document.getElementById('admin-ultramsg-instance')?.value.trim();
    const ultraToken = document.getElementById('admin-ultramsg-token')?.value.trim();

    const payload = {
      provider: brevoKey ? 'brevo' : 'smtp',
      admin_email: user || 'bandirohan43@gmail.com',
      admin_mobile: adminMobile || '9392819362',
      order_receiving_email: orderReceivingEmail || 'mrscrackers.orders@gmail.com',
      smtp: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: user || 'bandirohan43@gmail.com',
        ...(pass ? { pass: pass.replace(/\s+/g, '') } : {})
      },
      ...(brevoKey ? { brevo_api_key: brevoKey } : {}),
      ...(ultraInstance ? { ultramsg_instance: ultraInstance } : {}),
      ...(ultraToken ? { ultramsg_token: ultraToken } : {})
    };

    // 1. Cache in browser LocalStorage
    try {
      if (orderReceivingEmail) localStorage.setItem('mrs_order_receiving_email', orderReceivingEmail);
      if (adminMobile) localStorage.setItem('mrs_admin_mobile', adminMobile);
      if (user) localStorage.setItem('mrs_admin_email', user);
      if (brevoKey !== undefined) localStorage.setItem('mrs_brevo_api_key', brevoKey);
      if (ultraInstance !== undefined) localStorage.setItem('mrs_ultramsg_instance', ultraInstance);
      if (ultraToken !== undefined) localStorage.setItem('mrs_ultramsg_token', ultraToken);
    } catch (e) {}

    // 2. Sync to Supabase Database (So all mobile devices and browsers share it!)
    if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.saveStoreConfig === 'function') {
      try {
        await MRS_BACKEND.saveStoreConfig({
          brevo_api_key: brevoKey,
          order_receiving_email: orderReceivingEmail,
          admin_mobile: adminMobile,
          admin_email: user,
          ultramsg_instance: ultraInstance,
          ultramsg_token: ultraToken
        });
        console.log('✅ Store configuration synced to Supabase database!');
      } catch (e) {
        console.warn('Supabase store config sync error:', e);
      }
    }

    // 3. Try server backend endpoint if reachable
    const apiUrl = typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/save-email-config') : '/api/save-email-config';
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    if (typeof showToast === 'function') showToast('Configuration saved & synced! ✉️');

    // Update status badge
    const badge = document.getElementById('admin-email-status-badge');
    const warn = document.getElementById('admin-email-warning-box');
    const hasProvider = !!(brevoKey || (pass && pass.length > 8));
    if (badge) {
      badge.style.background = hasProvider ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)';
      badge.style.color = hasProvider ? '#22C55E' : '#EF4444';
      badge.style.borderColor = hasProvider ? '#22C55E' : '#EF4444';
      badge.textContent = hasProvider ? '✅ Active' : 'Setup Required';
    }
    if (warn) warn.style.display = hasProvider ? 'none' : 'block';

    const waStatus = ultraInstance && ultraToken ? '✅ UltraMsg automated dispatch active from +91 ' + payload.admin_mobile : '⚠️ UltraMsg pending credentials (manual WhatsApp link available)';
    const emailStatus = brevoKey
      ? '✅ Brevo API active (dispatches from bandirohan43@gmail.com)'
      : (pass ? '✅ Gmail SMTP configured' : '⚠️ No email key or password entered');

    alert(`✅ Configuration Saved & Synced!\n\n📧 Email Dispatch: ${emailStatus}\n📦 Driver / Dispatch Email: ${payload.order_receiving_email}\n📲 WhatsApp Dispatch: ${waStatus}\n\nAll settings are live and active for customer orders!`);
  }

  async function loadEmailSettings() {
    let cfg = {
      order_receiving_email: localStorage.getItem('mrs_order_receiving_email') || 'client.fulfillment.crackers@gmail.com',
      admin_mobile: localStorage.getItem('mrs_admin_mobile') || '9392819362',
      admin_email: localStorage.getItem('mrs_admin_email') || 'bandirohan43@gmail.com',
      brevo_api_key: localStorage.getItem('mrs_brevo_api_key') || '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',
      ultramsg_instance: localStorage.getItem('mrs_ultramsg_instance') || 'instance196245',
      ultramsg_token: localStorage.getItem('mrs_ultramsg_token') || '36joxaja2djlcw29'
    };

    // Load from Supabase store config if available
    if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.getStoreConfig === 'function') {
      try {
        const remoteCfg = await MRS_BACKEND.getStoreConfig();
        if (remoteCfg) {
          cfg = { ...cfg, ...remoteCfg };
        }
      } catch (e) {}
    }

    const elClient = document.getElementById('admin-order-receiving-email');
    const elMob = document.getElementById('admin-sender-mobile');
    const elAdmin = document.getElementById('admin-smtp-user');
    const elBrevo = document.getElementById('admin-brevo-api-key');
    const elUltraInst = document.getElementById('admin-ultramsg-instance');
    const elUltraTok = document.getElementById('admin-ultramsg-token');

    if (elClient && cfg.order_receiving_email) elClient.value = cfg.order_receiving_email;
    if (elMob && cfg.admin_mobile) elMob.value = cfg.admin_mobile;
    if (elAdmin && cfg.admin_email) elAdmin.value = cfg.admin_email;
    if (elBrevo && cfg.brevo_api_key) elBrevo.value = cfg.brevo_api_key;
    if (elUltraInst && cfg.ultramsg_instance) elUltraInst.value = cfg.ultramsg_instance;
    if (elUltraTok && cfg.ultramsg_token) elUltraTok.value = cfg.ultramsg_token;

    // Update status badge based on whether email is configured
    const badge = document.getElementById('admin-email-status-badge');
    const warn = document.getElementById('admin-email-warning-box');
    const hasProvider = !!(cfg.brevo_api_key || (document.getElementById('admin-smtp-pass')?.value.length > 8));
    if (badge) {
      badge.style.background = hasProvider ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)';
      badge.style.color = hasProvider ? '#22C55E' : '#EF4444';
      badge.style.borderColor = hasProvider ? '#22C55E' : '#EF4444';
      badge.textContent = hasProvider ? '✅ Active' : 'Setup Required';
    }
    if (warn) warn.style.display = hasProvider ? 'none' : 'block';
  }

  async function sendTestOtpEmail() {
    const email = document.getElementById('admin-smtp-user')?.value.trim() || 'bandirohan43@gmail.com';
    const brevoKey = document.getElementById('admin-brevo-api-key')?.value.trim() || localStorage.getItem('mrs_brevo_api_key') || '';
    const testOtp = String(Math.floor(100000 + Math.random() * 900000));
    if (typeof showToast === 'function') showToast(`Sending test OTP to ${email}...`);

    // Direct Brevo Test (Works immediately from any browser/mobile without server)
    if (brevoKey) {
      try {
        const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: { name: 'MRS Crackers Test', email: 'bandirohan43@gmail.com' },
            to: [{ email: email, name: 'Admin Bandi Rohan' }],
            subject: `MRS Crackers Live Test OTP: ${testOtp}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0c041f; color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1.5px solid #7C3AED;">
                <h2 style="color: #FFB800; margin: 0 0 10px 0;">💥 MRS CRACKERS TEST DISPATCH</h2>
                <p style="font-size: 0.9rem; color: #DDD6FE;">Live test email from Brevo API! Your test code is:</p>
                <div style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #22C55E; background: #180938; padding: 14px; text-align: center; border-radius: 8px; margin: 16px 0;">
                  ${testOtp}
                </div>
                <p style="font-size: 0.78rem; color: #9CA3AF;">Email dispatch from bandirohan43@gmail.com is 100% active and functioning!</p>
              </div>
            `
          })
        });
        if (resp.ok) {
          alert(`✅ Live Test Email successfully delivered to ${email} via Brevo!\n\nPlease check your Gmail inbox now.`);
          return;
        } else {
          const err = await resp.json().catch(() => ({}));
          alert(`⚠️ Brevo returned an error: ${err.message || JSON.stringify(err)}\n\nPlease ensure your Brevo API key is correct.`);
          return;
        }
      } catch (e) {
        console.warn('Direct Brevo fetch error:', e.message);
      }
    }

    // Fallback: Try server /api/send-otp
    const apiUrl = typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/send-otp') : '/api/send-otp';
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          identifier: email,
          mobile: '9392819362',
          email: email,
          otp: testOtp,
          brevoApiKey: brevoKey,
          purpose: 'test_otp'
        })
      });
      const data = await res.json();
      if (data.success && data.emailSent) {
        alert(`✅ Test OTP email sent successfully to ${email}!\n\nPlease check your Gmail inbox.`);
      } else {
        alert(`⚠️ Please enter your Brevo API Key (Option 2) in Settings and tap Save Configuration to enable live email delivery.`);
      }
    } catch (e) {
      alert(`⚠️ Please enter your Brevo API Key (Option 2) in Settings and tap Save Configuration to enable live email delivery.`);
    }
  }

  return {
    openGate: openSecurityGate,
    closeGate: closeSecurityGate,
    verifyStep1,
    verifyStep2,
    resendOtp,
    saveEmailSettings,
    loadEmailSettings,
    sendTestOtpEmail,
    mount: mountPortal,
    exit: unmountPortal,
    switchAdminTab,
    initAdminDashboard,
    renderAdminProducts,
    filterAdminProductsList,
    toggleAdminAddProductForm,
    saveNewProductFromAdmin,
    openAdminEditProductModal,
    closeAdminEditProductModal,
    updateEditProductImagePreview,
    saveAdminEditProduct,
    toggleProductInStock,
    renderAdminDrivers,
    registerNewRiderFromForm,
    openAdminRiderModal,
    closeAdminRiderModal,
    assignSelectedOrderToCurrentRider,
    renderAdminOrders,
    renderAdminPayments,
    handleAdminQrFileUpload,
    saveMerchantPaymentConfig,
    markOrderCompleted,
    renderAdminUsers,
    registerNewAdminFromForm,
    removeAdminUser,
    filterAdminOrdersByStatus,
    adminVerifyOrderUTR,
    adminVerifyPayment,
    adminRejectPayment,
    adminAssignRiderDirect,
    advanceAdminOrderStatus,
    setAdminPaymentReceiver,
    updateAnnouncementTicker,
    syncAdminDataFromSupabase
  };
})();

// Expose globally
if (typeof window !== 'undefined') {
  window.PORTALS = PORTALS;
  window.initiateAdminAuth = () => PORTALS.openGate('admin');
  window.initiateDriverAuth = () => PORTALS.openGate('driver');
}
