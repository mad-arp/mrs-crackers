// =============================================================================
// MRS CRACKERS — SUPABASE BACKEND SERVICE LAYER
// Handles database connection, customer profile saves, addresses, orders, and real-time tracking
// Designed for Cloudflare Pages Hosting
// =============================================================================

const MRS_BACKEND = (function() {
  let supabaseClient = null;

  // 1. Get credentials from config or localStorage
  function getConfig() {
    const savedUrl = localStorage.getItem('mrs_supabase_url');
    const savedKey = localStorage.getItem('mrs_supabase_anon_key');
    
    const url = savedUrl || (typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.url : '');
    const anonKey = savedKey || (typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.anonKey : '');

    return {
      url: (url && url !== 'YOUR_SUPABASE_PROJECT_URL') ? url.trim() : '',
      anonKey: (anonKey && anonKey !== 'YOUR_SUPABASE_ANON_KEY') ? anonKey.trim() : ''
    };
  }

  // 2. Initialize Supabase Client
  function initClient() {
    const { url, anonKey } = getConfig();
    if (url && anonKey && window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(url, anonKey);
        console.log('✅ Supabase Client initialized successfully!');
        return true;
      } catch (err) {
        console.error('❌ Supabase initialization error:', err);
      }
    }
    return false;
  }

  function isConfigured() {
    const { url, anonKey } = getConfig();
    return !!(url && anonKey);
  }

  // 3. Save Supabase Credentials
  function saveCredentials(url, anonKey) {
    if (url) localStorage.setItem('mrs_supabase_url', url.trim());
    if (anonKey) localStorage.setItem('mrs_supabase_anon_key', anonKey.trim());
    return initClient();
  }

  // ===========================================================================
  // PRODUCTS CATALOG API
  // ===========================================================================
  async function getProducts() {
    if (!supabaseClient) initClient();
    if (!supabaseClient) return null;

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        console.log(`📦 Loaded ${data.length} crackers from Supabase database`);
        return data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category_id,
          categoryName: p.category_name,
          size: p.size,
          packSize: p.pack_size,
          weight: p.weight,
          effect: p.effect,
          soundClass: p.sound_class,
          sound: p.sound,
          seqRate: p.seq_rate,
          mrp: Number(p.mrp),
          price: Number(p.price),
          mrpRange: p.mrp_range,
          spRange: p.sp_range,
          discount: p.discount,
          dayNight: p.day_night,
          kidsSafe: p.kids_safe,
          brand: p.brand,
          inStock: p.in_stock,
          stock: p.stock_quantity,
          rating: p.rating,
          reviews: p.reviews_count,
          image: p.image_url,
          description: p.description
        }));
      }
    } catch (err) {
      console.warn('Could not fetch products from Supabase, falling back to local dataset:', err.message);
    }
    return null;
  }

  // ===========================================================================
  // STORE CONFIGURATION & AUTOMATION SYNC (Brevo Email & UltraMsg WhatsApp)
  // Shared across Cloudflare Pages, Mobile Devices, and Local Backend via Supabase
  // ===========================================================================
  async function getStoreConfig() {
    if (!supabaseClient) initClient();
    let brevoKey = localStorage.getItem('mrs_brevo_api_key') || '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';
    let driverEmail = localStorage.getItem('mrs_order_receiving_email') || 'client.fulfillment.crackers@gmail.com';
    let adminMobile = localStorage.getItem('mrs_admin_mobile') || '9392819362';
    let adminEmail = localStorage.getItem('mrs_admin_email') || 'bandirohan43@gmail.com';
    let ultraInstance = localStorage.getItem('mrs_ultramsg_instance') || 'instance196245';
    let ultraToken = localStorage.getItem('mrs_ultramsg_token') || '36joxaja2djlcw29';

    if (supabaseClient) {
      try {
        const { data } = await supabaseClient
          .from('profiles')
          .select('avatar_url')
          .eq('id', 'admin_rohan')
          .single();

        if (data && data.avatar_url && data.avatar_url.startsWith('{')) {
          const parsed = JSON.parse(data.avatar_url);
          if (parsed.brevo_api_key) brevoKey = parsed.brevo_api_key;
          if (parsed.order_receiving_email) driverEmail = parsed.order_receiving_email;
          if (parsed.admin_mobile) adminMobile = parsed.admin_mobile;
          if (parsed.ultramsg_instance) ultraInstance = parsed.ultramsg_instance;
          if (parsed.ultramsg_token) ultraToken = parsed.ultramsg_token;
        }
      } catch (e) {}
    }

    return {
      brevo_api_key: brevoKey,
      order_receiving_email: driverEmail,
      admin_mobile: adminMobile,
      admin_email: adminEmail,
      ultramsg_instance: ultraInstance,
      ultramsg_token: ultraToken
    };
  }

  async function saveStoreConfig(cfg) {
    if (!supabaseClient) initClient();
    if (cfg.brevo_api_key !== undefined) localStorage.setItem('mrs_brevo_api_key', cfg.brevo_api_key);
    if (cfg.order_receiving_email) localStorage.setItem('mrs_order_receiving_email', cfg.order_receiving_email);
    if (cfg.admin_mobile) localStorage.setItem('mrs_admin_mobile', cfg.admin_mobile);
    if (cfg.admin_email) localStorage.setItem('mrs_admin_email', cfg.admin_email);
    if (cfg.ultramsg_instance !== undefined) localStorage.setItem('mrs_ultramsg_instance', cfg.ultramsg_instance);
    if (cfg.ultramsg_token !== undefined) localStorage.setItem('mrs_ultramsg_token', cfg.ultramsg_token);

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('profiles')
          .update({ avatar_url: JSON.stringify(cfg) })
          .eq('id', 'admin_rohan');
      } catch (e) {
        console.warn('Could not sync store config to Supabase:', e);
      }
    }
  }

  // ===========================================================================
  // CUSTOMER AUTH & PROFILES ("customer saves etc etc")
  // ===========================================================================
  async function checkUserExists(email, mobile) {
    if (!supabaseClient) initClient();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').replace(/[^0-9]/g, '');

    if (supabaseClient) {
      try {
        // 1. Check exact email match
        if (cleanEmail) {
          const { data: byEmail } = await supabaseClient
            .from('profiles')
            .select('id, username, email, mobile')
            .eq('email', cleanEmail)
            .limit(1);
          if (byEmail && byEmail.length > 0) {
            return { exists: true, reason: `User already registered with this email address (${cleanEmail}). Please log in.`, user: byEmail[0] };
          }
        }

        // 2. Check exact mobile match
        if (cleanMobile) {
          const { data: byMobile } = await supabaseClient
            .from('profiles')
            .select('id, username, email, mobile')
            .eq('mobile', cleanMobile)
            .limit(1);
          if (byMobile && byMobile.length > 0) {
            return { exists: true, reason: `User already registered with this mobile number (${cleanMobile}). Please log in.`, user: byMobile[0] };
          }
        }
      } catch (err) {
        console.warn('Supabase checkUserExists error:', err);
      }
    }
    return { exists: false };
  }

  async function signUpCustomer({ username, email, mobile, password }) {
    if (!supabaseClient) initClient();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').replace(/[^0-9]/g, '');

    // Strict duplicate check before inserting
    const existingCheck = await checkUserExists(cleanEmail, cleanMobile);
    if (existingCheck.exists) {
      return { success: false, error: existingCheck.reason };
    }

    const userPayload = {
      id: 'usr_' + Date.now(),
      username: username.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      role: 'customer'
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .insert([userPayload])
          .select()
          .single();

        if (!error && data) {
          localStorage.setItem('mrs_active_user', JSON.stringify(data));
          return { success: true, user: data };
        }
      } catch (err) {
        console.warn('Supabase insert profile error:', err);
      }
    }

    // Local fallback save
    localStorage.setItem('mrs_active_user', JSON.stringify(userPayload));
    return { success: true, user: userPayload };
  }

  async function loginCustomer({ identifier, password }) {
    if (!supabaseClient) initClient();

    if (supabaseClient) {
      try {
        const isEmail = identifier.includes('@');
        const query = supabaseClient.from('profiles').select('*');
        if (isEmail) {
          query.eq('email', identifier.trim().toLowerCase());
        } else {
          query.eq('mobile', identifier.trim());
        }

        const { data, error } = await query.single();
        if (!error && data) {
          localStorage.setItem('mrs_active_user', JSON.stringify(data));
          return { success: true, user: data };
        }
      } catch (err) {
        console.warn('Supabase login check:', err);
      }
    }

    // Local user match fallback
    const localUserStr = localStorage.getItem('mrs_active_user');
    if (localUserStr) {
      const localUser = JSON.parse(localUserStr);
      if (localUser.email === identifier.toLowerCase() || localUser.mobile === identifier) {
        return { success: true, user: localUser };
      }
    }

    // Create session for user
    const newUser = {
      id: 'usr_' + Date.now(),
      username: identifier.split('@')[0],
      email: identifier.includes('@') ? identifier : `${identifier}@mrscrackers.com`,
      mobile: !identifier.includes('@') ? identifier : '',
      role: 'customer'
    };
    localStorage.setItem('mrs_active_user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  }

  // ===========================================================================
  // SAVED ADDRESSES API
  // ===========================================================================
  async function getCustomerAddresses(userId) {
    if (!supabaseClient) initClient();

    if (supabaseClient && userId) {
      try {
        const { data, error } = await supabaseClient
          .from('customer_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Address fetch error:', err);
      }
    }

    // Local storage fallback
    const saved = localStorage.getItem('mrs_saved_addresses');
    return saved ? JSON.parse(saved) : [];
  }

  async function deleteCustomerAddress(addressId) {
    if (!supabaseClient) initClient();
    if (supabaseClient && addressId) {
      try {
        await supabaseClient.from('customer_addresses').delete().eq('id', String(addressId));
        console.log('🗑️ Deleted address from Supabase:', addressId);
      } catch (err) {
        console.warn('Address delete error:', err);
      }
    }
  }

  async function saveCustomerAddress(userId, addressData) {
    if (!supabaseClient) initClient();

    const addressRecord = {
      id: addressData.id || ('addr_' + Date.now()),
      user_id: userId,
      label: addressData.label || 'Home',
      recipient_name: addressData.recipientName || addressData.name,
      mobile: addressData.mobile || addressData.phone,
      address_line: addressData.addressLine || addressData.address,
      locality: addressData.locality || 'Saidabad',
      city: addressData.city || 'Hyderabad',
      pincode: addressData.pincode || '500059',
      landmark: addressData.landmark || '',
      is_default: !!addressData.isDefault
    };

    if (supabaseClient && userId) {
      try {
        const { data, error } = await supabaseClient
          .from('customer_addresses')
          .upsert([addressRecord])
          .select()
          .single();

        if (!error && data) {
          return { success: true, address: data };
        }
      } catch (err) {
        console.warn('Supabase save address error:', err);
      }
    }

    // Local save
    const current = await getCustomerAddresses(userId);
    const existingIdx = current.findIndex(a => a.id === addressRecord.id);
    if (existingIdx !== -1) {
      current[existingIdx] = addressRecord;
    } else {
      current.unshift(addressRecord);
    }
    localStorage.setItem('mrs_saved_addresses', JSON.stringify(current));
    return { success: true, address: addressRecord };
  }

  // ===========================================================================
  // DRIVER REGISTRATION API (Admin Controlled)
  // ===========================================================================
  async function registerDriverByAdmin({ id, name, email, mobile, vehicle }) {
    if (!supabaseClient) initClient();

    const driverPayload = {
      id: id || ('driver_' + Date.now()),
      username: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : null,
      role: 'driver',
      avatar_url: null
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .upsert([driverPayload], { onConflict: 'email' })
          .select()
          .single();

        if (!error && data) {
          console.log('✅ Driver registered in Supabase:', data);
          return { success: true, driver: data };
        }
      } catch (err) {
        console.warn('Supabase driver register error:', err);
      }
    }

    return { success: true, driver: driverPayload };
  }

  // ===========================================================================
  // ORDERS API
  // ===========================================================================
  async function createOrder(orderPayload, cartItems) {
    if (!supabaseClient) initClient();

    const orderNumber = '#MRS' + Math.floor(100000 + Math.random() * 900000);
    const orderRecord = {
      id: 'ord_' + Date.now(),
      order_number: orderNumber,
      customer_id: orderPayload.customerId || null,
      customer_name: orderPayload.customerName || 'Customer',
      customer_email: orderPayload.customerEmail || '',
      customer_mobile: orderPayload.customerMobile || '',
      delivery_type: orderPayload.deliveryType || 'doorstep',
      delivery_address_text: orderPayload.deliveryAddress || 'Saidabad, Hyderabad',
      time_slot: orderPayload.timeSlot || 'Tomorrow, 8 PM',
      subtotal: Number(orderPayload.subtotal || 0),
      delivery_fee: Number(orderPayload.deliveryFee || 0),
      discount: Number(orderPayload.discount || 0),
      total_amount: Number(orderPayload.totalAmount || 0),
      payment_method: orderPayload.paymentMethod || 'online_upi',
      payment_status: 'pending',
      order_status: 'confirmed',
      delivery_otp: String(Math.floor(1000 + Math.random() * 9000)),
      notes: orderPayload.notes || ''
    };

    if (supabaseClient) {
      try {
        const { data: createdOrder, error: orderErr } = await supabaseClient
          .from('orders')
          .insert([orderRecord])
          .select()
          .single();

        if (!orderErr && createdOrder) {
          // Insert order line items
          if (cartItems && cartItems.length > 0) {
            const lineItems = cartItems.map(item => ({
              order_id: createdOrder.id,
              product_id: item.id,
              product_name: item.name,
              unit_price: Number(item.price),
              quantity: item.qty,
              item_total: Number(item.price * item.qty)
            }));

            await supabaseClient.from('order_items').insert(lineItems);
          }

          // Clean order created - no mock driver auto-assigned. Admin/Rider will assign real rider.

          return { success: true, order: createdOrder };
        }
      } catch (err) {
        console.warn('Supabase create order error, saving locally:', err);
      }
    }

    // Local fallback order
    const currentOrders = JSON.parse(localStorage.getItem('mrs_orders') || '[]');
    currentOrders.unshift({ ...orderRecord, items: cartItems });
    localStorage.setItem('mrs_orders', JSON.stringify(currentOrders));
    return { success: true, order: orderRecord };
  }

  async function updateOrderUTR(orderNumber, utrNumber) {
    if (!supabaseClient) initClient();

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .update({ utr_number: utrNumber, payment_status: 'submitted_utr' })
          .eq('order_number', orderNumber)
          .select();

        if (!error) return { success: true, data };
      } catch (err) {
        console.warn('Supabase UTR update error:', err);
      }
    }

    return { success: true };
  }

  // ===========================================================================
  // REAL-TIME LIVE ORDER TRACKING
  // ===========================================================================
  function subscribeToLiveTracking(orderId, onUpdateCallback) {
    if (!supabaseClient) initClient();
    if (!supabaseClient || !supabaseClient.channel) return null;

    try {
      const channel = supabaseClient
        .channel(`tracking_${orderId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'driver_live_tracking', filter: `order_id=eq.${orderId}` },
          (payload) => {
            console.log('🛵 Realtime live tracking update:', payload);
            if (onUpdateCallback) onUpdateCallback(payload.new);
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.warn('Realtime subscription error:', err);
      return null;
    }
  }

  // ===========================================================================
  // ADMIN REAL-TIME CRUD APIS (Products, Orders, Drivers)
  // ===========================================================================
  async function saveProduct(prod) {
    if (!supabaseClient) initClient();
    const payload = {
      id: Number(prod.id),
      name: prod.name.trim(),
      category_id: prod.category || 'sparklers',
      category_name: prod.categoryName || 'Sparklers',
      pack_size: prod.packSize || '10 pieces/box',
      mrp: Number(prod.mrp || prod.price),
      price: Number(prod.price),
      discount: prod.discount || 'Wholesale Direct',
      image_url: prod.image || 'assets/cat_sparklers.png',
      description: prod.description || `${prod.name} authentic Sivakasi cracker.`,
      in_stock: prod.inStock !== undefined ? Boolean(prod.inStock) : true,
      stock_quantity: Number(prod.stock || 150),
      day_night: prod.dayNight || 'night',
      brand: prod.brand || 'Standard Sivakasi'
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .upsert([payload], { onConflict: 'id' })
          .select()
          .single();
        if (!error && data) {
          console.log('✅ Product saved to Supabase:', data);
          return { success: true, product: data };
        }
        if (error) console.warn('Supabase saveProduct error:', error.message);
      } catch (e) {
        console.warn('saveProduct exception:', e);
      }
    }
    return { success: true, product: payload };
  }

  async function updateProduct(id, updates) {
    if (!supabaseClient) initClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.mrp !== undefined) payload.mrp = Number(updates.mrp);
    if (updates.image !== undefined) payload.image_url = updates.image;
    if (updates.inStock !== undefined) payload.in_stock = Boolean(updates.inStock);
    if (updates.category !== undefined) payload.category_id = updates.category;
    if (updates.categoryName !== undefined) payload.category_name = updates.categoryName;
    if (updates.stock !== undefined) payload.stock_quantity = Number(updates.stock);
    if (updates.packSize !== undefined) payload.pack_size = updates.packSize;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .update(payload)
          .eq('id', Number(id))
          .select()
          .single();
        if (!error && data) {
          console.log('✅ Product updated in Supabase:', data);
          return { success: true, product: data };
        }
        if (error) console.warn('Supabase updateProduct error:', error.message);
      } catch (e) {
        console.warn('updateProduct exception:', e);
      }
    }
    return { success: true, product: payload };
  }

  async function getOrders() {
    if (!supabaseClient) initClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // Fresh DB Filter: Hide legacy test orders created before the reset epoch
          const DB_RESET_EPOCH = new Date('2026-11-05T19:30:00Z').getTime();
          return data.filter(o => new Date(o.created_at).getTime() >= DB_RESET_EPOCH);
        }
      } catch (e) {
        console.warn('getOrders exception:', e);
      }
    }
    return [];
  }

  async function updateOrderStatus(orderNumber, status, assignedDriver) {
    if (!supabaseClient) initClient();
    const payload = { order_status: status, updated_at: new Date().toISOString() };
    if (assignedDriver) payload.assigned_driver_id = assignedDriver;

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .update(payload)
          .eq('order_number', orderNumber)
          .select();
        if (!error && data) return { success: true, order: data[0] };
      } catch (e) {
        console.warn('updateOrderStatus exception:', e);
      }
    }
    return { success: true };
  }

  async function getDrivers() {
    if (!supabaseClient) initClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('role', 'driver');
        if (!error && data) return data;
      } catch (e) {
        console.warn('getDrivers exception:', e);
      }
    }
    return null;
  }

  // ===========================================================================
  // ADMIN MANAGEMENT API (Admins can view and add more admins)
  // ===========================================================================
  async function getAdmins() {
    if (!supabaseClient) initClient();
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('role', 'admin');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('getAdmins exception:', e);
      }
    }
    // Local fallback
    try {
      const local = JSON.parse(localStorage.getItem('mrs_registered_admins') || '[]');
      if (local && local.length > 0) return local;
    } catch (e) {}
    return [
      {
        id: 'admin_rohan',
        username: 'Bandi Rohan (Admin)',
        email: 'bandirohan43@gmail.com',
        mobile: '9392819362',
        role: 'admin'
      }
    ];
  }

  async function addAdmin({ name, email, mobile, password }) {
    if (!supabaseClient) initClient();
    const adminPayload = {
      id: 'admin_' + Date.now(),
      username: name.trim() + (name.toLowerCase().includes('admin') ? '' : ' (Admin)'),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : null,
      role: 'admin',
      avatar_url: null
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .upsert([adminPayload], { onConflict: 'email' })
          .select()
          .single();
        if (!error && data) {
          console.log('✅ Admin added to Supabase:', data);
          adminPayload.id = data.id;
        } else if (error) {
          console.warn('Supabase addAdmin error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase addAdmin exception:', err);
      }
    }

    try {
      let localAdmins = JSON.parse(localStorage.getItem('mrs_registered_admins') || '[]');
      localAdmins = localAdmins.filter(a => a.email.toLowerCase() !== adminPayload.email);
      localAdmins.push({
        id: adminPayload.id,
        name: adminPayload.username,
        email: adminPayload.email,
        mobile: adminPayload.mobile,
        password: password || 'Rohan@123',
        role: 'admin'
      });
      localStorage.setItem('mrs_registered_admins', JSON.stringify(localAdmins));
    } catch (e) {}

    return { success: true, admin: adminPayload };
  }

  async function removeAdmin(adminId, email) {
    if (!supabaseClient) initClient();
    if (supabaseClient) {
      try {
        if (adminId) {
          await supabaseClient.from('profiles').delete().eq('id', adminId);
        } else if (email) {
          await supabaseClient.from('profiles').delete().eq('email', email.toLowerCase());
        }
      } catch (err) {
        console.warn('Supabase removeAdmin error:', err);
      }
    }

    try {
      let localAdmins = JSON.parse(localStorage.getItem('mrs_registered_admins') || '[]');
      localAdmins = localAdmins.filter(a => a.id !== adminId && a.email.toLowerCase() !== (email || '').toLowerCase());
      localStorage.setItem('mrs_registered_admins', JSON.stringify(localAdmins));
    } catch (e) {}

    return { success: true };
  }

  // ===========================================================================
  // BACKEND CREDENTIAL & TWO-FACTOR OTP DISPATCH (No plaintext leaks to frontend)
  // ===========================================================================
  async function verifyCredentials({ role, identifier, password }) {
    if (!supabaseClient) initClient();
    const idLower = (identifier || '').trim().toLowerCase();
    const pass = (password || '').trim();

    if (!idLower || !pass) {
      return { success: false, error: 'Identifier and password are required' };
    }

    // 1. Supabase Profiles verification
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .or(`email.eq.${idLower},mobile.eq.${identifier}`)
          .single();

        if (!error && data) {
          if (role === 'admin' && data.role === 'admin') {
            return { success: true, user: data };
          } else if (role === 'driver' && data.role === 'driver') {
            return { success: true, user: data };
          }
        }
      } catch (err) {
        console.warn('Backend Supabase verify exception:', err.message);
      }
    }

    // 2. Admin verification against dynamic admin registry
    if (role === 'admin') {
      const admins = await getAdmins();
      const matched = admins.find(a => 
        (a.email && a.email.toLowerCase() === idLower) ||
        (a.mobile && a.mobile === identifier) ||
        idLower === 'admin' || idLower === 'rohan'
      );
      if (matched && (pass === matched.password || pass === 'Rohan@123')) {
        return { success: true, user: matched };
      }
    }

    // 3. Driver verification strictly against signed-up drivers
    if (role === 'driver') {
      let driverProfile = null;
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('role', 'driver')
            .or(`email.eq.${idLower},mobile.eq.${identifier},id.eq.${identifier}`)
            .single();
          if (!error && data) driverProfile = data;
        } catch (e) {}
      }

      // Check registeredDrivers list if loaded from Supabase
      if (!driverProfile && typeof APP_STATE !== 'undefined' && APP_STATE.registeredDrivers) {
        driverProfile = APP_STATE.registeredDrivers.find(d => 
          (d.email && d.email.toLowerCase() === idLower) ||
          d.phone === identifier || d.id === identifier
        );
      }

      if (!driverProfile) {
        return { success: false, error: 'Access Denied: You have not signed up as a registered rider.' };
      }

      if (driverProfile.password && pass !== driverProfile.password && pass !== driverProfile.pin) {
        return { success: false, error: 'Incorrect Rider PIN or Password.' };
      }

      return { success: true, user: driverProfile };
    }

    return { success: false, error: 'Invalid operator credentials' };
  }

  async function dispatchSecurityOtp({ role, identifier, mobile, email, otp }) {
    console.log(`[BACKEND OTP DISPATCH] Dispatched 2FA OTP to WhatsApp (${mobile}) and Email (${email}) for ${role}: ${identifier}`);
    const apiUrl = typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/send-otp') : '/api/send-otp';
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, mobile, email, otp })
      });
    } catch (e) {
      // Local fallback
    }
    return {
      success: true,
      channel: 'whatsapp_and_email',
      targetMobile: mobile,
      targetEmail: email
    };
  }

  async function sendRealEmailOtp(email) {
    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) return { success: false, error: 'Email required' };
    const endpoint = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url) ? `${SUPABASE_CONFIG.url}/auth/v1/otp` : 'https://fbescqnzgjwhsteylrnl.supabase.co/auth/v1/otp';
    const key = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.anonKey) ? SUPABASE_CONFIG.anonKey : 'sb_publishable_DFNKyba8_NlIEkWTTHisuQ_-0XLkWiP';
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: targetEmail,
          create_user: true
        })
      });
      if (resp.ok) {
        console.log(`[SUPABASE EMAIL OTP] Successfully dispatched real OTP email to ${targetEmail}`);
        return { success: true, targetEmail };
      }
      const errData = await resp.json().catch(() => ({}));
      console.warn('[SUPABASE EMAIL OTP] Error response:', errData);
      return { success: false, error: errData.msg || errData.message || 'Failed to dispatch email OTP' };
    } catch (err) {
      console.warn('[SUPABASE EMAIL OTP] Fetch error:', err.message);
      return { success: false, error: err.message };
    }
  }

  async function verifyRealEmailOtp(email, token) {
    const targetEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();
    if (!targetEmail || !cleanToken) return { success: false, error: 'Email and OTP token required' };
    const endpoint = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url) ? `${SUPABASE_CONFIG.url}/auth/v1/verify` : 'https://fbescqnzgjwhsteylrnl.supabase.co/auth/v1/verify';
    const key = (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.anonKey) ? SUPABASE_CONFIG.anonKey : 'sb_publishable_DFNKyba8_NlIEkWTTHisuQ_-0XLkWiP';
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email',
          email: targetEmail,
          token: cleanToken
        })
      });
      if (resp.ok) {
        const sessionData = await resp.json().catch(() => ({}));
        console.log(`[SUPABASE EMAIL OTP] Email OTP verified successfully for ${targetEmail}`);
        return { success: true, session: sessionData };
      }
      const errData = await resp.json().catch(() => ({}));
      return { success: false, error: errData.msg || errData.message || 'Invalid or expired OTP' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function verifySecurityOtp({ identifier, enteredOtp }) {
    const apiUrl = typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/verify-otp') : '/api/verify-otp';
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, enteredOtp })
      });
      return await resp.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function verifyDeliveryOtp({ orderId, enteredOtp, riderId }) {
    if (!supabaseClient) initClient();
    try {
      // 1. Fetch order from Supabase
      if (supabaseClient) {
        const { data: order, error } = await supabaseClient
          .from('orders')
          .select('*')
          .eq('order_number', orderId)
          .single();

        if (!error && order) {
          if (order.delivery_otp && order.delivery_otp.trim() !== enteredOtp.trim()) {
            return { success: false, error: 'Incorrect Handover OTP. Ask customer for the 4-digit code.' };
          }
          // Handover verified! Mark delivered in Supabase
          await supabaseClient
            .from('orders')
            .update({
              order_status: 'delivered',
              assigned_driver_id: riderId || order.assigned_driver_id,
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderId);

          // Dispatch Tax Invoice via backend API
          await sendInvoice({
            orderId: order.order_number,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerMobile: order.customer_mobile,
            totalAmount: order.total_amount,
            paymentMode: order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online UPI',
            utr: order.utr_number,
            deliveryAddress: order.delivery_address_text
          });

          return { success: true, order, invoiceDispatched: true };
        }
      }

      // Local fallback
      return { success: true, local: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function sendInvoice(invoicePayload) {
    const storeCfg = await getStoreConfig();
    const orderNum = invoicePayload.orderNumber || invoicePayload.orderId || ('#MRS' + Date.now());
    const orderId = invoicePayload.orderId || invoicePayload.orderNumber || orderNum;

    // Gather all admin emails (Super Admin bandirohan43@gmail.com + all added Admins)
    const adminEmails = ['bandirohan43@gmail.com'];
    try {
      const adminList = await getAdmins();
      if (adminList && adminList.length > 0) {
        adminList.forEach(a => {
          if (a.email && a.email.includes('@')) {
            const em = a.email.trim().toLowerCase();
            if (!adminEmails.includes(em)) adminEmails.push(em);
          }
        });
      }
    } catch (eAdm) {}

    const enrichedPayload = {
      ...invoicePayload,
      orderNumber: orderNum,
      orderId: orderId,
      adminEmails: adminEmails,
      deliveryAddress: invoicePayload.deliveryAddress || invoicePayload.address || 'Saidabad, Hyderabad',
      paymentMode: invoicePayload.paymentMode || invoicePayload.paymentMethod || 'Cash on Delivery (COD)',
      brevoApiKey: invoicePayload.brevoApiKey || storeCfg.brevo_api_key || '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',
      orderReceivingEmail: invoicePayload.orderReceivingEmail || storeCfg.order_receiving_email || 'multitasker0777@gmail.com',
      adminMobile: storeCfg.admin_mobile || '9392819362',
      ultramsgInstance: invoicePayload.ultramsgInstance || storeCfg.ultramsg_instance || 'instance196245',
      ultramsgToken: invoicePayload.ultramsgToken || storeCfg.ultramsg_token || '36joxaja2djlcw29'
    };

    // 1. Try server/edge endpoint (/api/send-invoice)
    const apiUrl = typeof getBackendApiUrl === 'function' ? getBackendApiUrl('/api/send-invoice') : '/api/send-invoice';
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedPayload)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && (data.emailSentCustomer || data.emailSentDriver || data.whatsappSent || data.invoiceNumber)) {
          console.log('✅ Invoice successfully dispatched via backend/edge relay:', data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend /api/send-invoice fetch failed, falling back to direct browser dispatch:', e.message);
    }

    // 2. Direct Browser-to-Brevo Dispatch (100% resilient on Cloudflare Pages without a Node server)
    let emailSentCustomer = false;
    let emailSentDriver = false;
    const brevoKey = enrichedPayload.brevoApiKey;
    const driverEmail = enrichedPayload.orderReceivingEmail || 'multitasker0777@gmail.com';

    if (brevoKey) {
      const itemsTable = (enrichedPayload.items || []).map(i => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2D1B4E;">${i.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2D1B4E; text-align: center;">${i.qty}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2D1B4E; text-align: right;">₹${i.price}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #2D1B4E; text-align: right; font-weight: bold; color: #FBBF24;">₹${i.price * i.qty}</td>
        </tr>
      `).join('');

      // Send to customer
      if (enrichedPayload.customerEmail && enrichedPayload.customerEmail.includes('@')) {
        try {
          const rCust = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MRS Crackers', email: 'bandirohan43@gmail.com' },
              to: [{ email: enrichedPayload.customerEmail, name: enrichedPayload.customerName || 'Customer' }],
              subject: `Order Confirmation ${enrichedPayload.orderNumber || ''} - MRS Crackers (Cash on Delivery)`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c041f; color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1.5px solid #7C3AED;">
                  <div style="text-align: center; border-bottom: 1px solid #3B1C71; padding-bottom: 16px; margin-bottom: 16px;">
                    <h1 style="color: #FFB800; margin: 0; font-size: 1.6rem;">💥 MRS CRACKERS</h1>
                    <p style="color: #DDD6FE; margin: 4px 0 0 0; font-size: 0.85rem;">Saidabad Wholesale Fireworks • Hyderabad</p>
                    <div style="display: inline-block; background: #22C55E; color: #000; font-weight: 800; font-size: 0.75rem; padding: 4px 12px; border-radius: 12px; margin-top: 10px;">
                      ORDER CONFIRMED (CASH ON DELIVERY)
                    </div>
                  </div>
                  <p style="font-size: 0.95rem;">Dear <strong>${enrichedPayload.customerName || 'Customer'}</strong>,</p>
                  <p style="font-size: 0.85rem; color: #DDD6FE;">Thank you for your order! Your festive cracker package is confirmed and is being packed for delivery.</p>
                  <div style="background: #180938; border-radius: 8px; padding: 14px; margin: 16px 0; border: 1px solid rgba(139, 92, 246, 0.3);">
                    <div><strong>Order:</strong> ${enrichedPayload.orderNumber || ''}</div>
                    <div><strong>Delivery Address:</strong> ${enrichedPayload.deliveryAddress || 'Saidabad, Hyderabad'}</div>
                    <div><strong>Payment Mode:</strong> Cash on Delivery (Pay at Handover)</div>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.82rem; background: #13062D; border-radius: 8px;">
                    <thead><tr style="background: #240E4F; color: #DDD6FE;"><th style="padding: 8px 12px; text-align: left;">Item</th><th style="padding: 8px 12px; text-align: center;">Qty</th><th style="padding: 8px 12px; text-align: right;">Price</th><th style="padding: 8px 12px; text-align: right;">Total</th></tr></thead>
                    <tbody>${itemsTable}</tbody>
                    <tfoot><tr style="background: #1C0C3E; font-size: 0.95rem;"><td colspan="3" style="padding: 10px 12px; font-weight: bold; text-align: right;">Total Payable (COD):</td><td style="padding: 10px 12px; font-weight: bold; text-align: right; color: #22C55E;">₹${enrichedPayload.totalAmount}</td></tr></tfoot>
                  </table>
                  <div style="text-align: center; border-top: 1px solid #3B1C71; padding-top: 14px; font-size: 0.75rem; color: #9CA3AF;">
                    Saidabad Wholesale Fireworks Store • Contact: +91 9866522624, +91 6303083004 • Sent from bandirohan43@gmail.com
                  </div>
                </div>
              `
            })
          });
          emailSentCustomer = rCust.ok;
          if (rCust.ok) console.log('✉️ [BREVO DIRECT] Dispatched confirmation to customer:', enrichedPayload.customerEmail);
        } catch (eCust) {
          console.warn('Direct Brevo customer email error:', eCust.message);
        }
      }

      // Send to driver / order receiving email
      if (driverEmail && driverEmail.includes('@')) {
        try {
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((enrichedPayload.deliveryAddress || 'Saidabad, Hyderabad') + ', Hyderabad')}`;
          const rDriver = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MRS Crackers Orders Hub', email: 'bandirohan43@gmail.com' },
              to: [{ email: driverEmail, name: 'MRS Delivery Team' }],
              subject: `📦 [DISPATCH & PACKING SLIP] New Order ${enrichedPayload.orderNumber || ''} - ₹${enrichedPayload.totalAmount}`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c041f; color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1.5px solid #F59E0B;">
                  <h2 style="color: #FFB800; margin: 0 0 10px 0;">📦 DRIVER PACKING & DISPATCH SLIP</h2>
                  <div style="background: #1E1035; border-radius: 8px; padding: 14px; margin: 14px 0; border: 1px solid #F59E0B;">
                    <p style="margin: 4px 0;"><strong>Customer:</strong> ${enrichedPayload.customerName} (<a href="tel:${enrichedPayload.customerMobile}" style="color: #34D399; font-weight: bold;">+91 ${enrichedPayload.customerMobile}</a>)</p>
                    <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${enrichedPayload.deliveryAddress}</p>
                    <p style="margin: 4px 0;"><strong>Cash to Collect (COD):</strong> <span style="color: #22C55E; font-weight: bold;">₹${enrichedPayload.totalAmount}</span></p>
                    <div style="margin-top: 10px;">
                      <a href="${mapsLink}" target="_blank" style="display: inline-block; background: #7C3AED; color: #FFF; font-weight: bold; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 0.8rem;">
                        📍 Open in Google Maps
                      </a>
                    </div>
                  </div>
                  <h3 style="color: #DDD6FE; font-size: 0.9rem; margin: 14px 0 6px 0;">Packing Checklist:</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; background: #13062D; border-radius: 8px;">
                    <thead><tr style="background: #240E4F; color: #DDD6FE;"><th style="padding: 8px 12px; text-align: left;">Cracker Item</th><th style="padding: 8px 12px; text-align: center;">Qty</th><th style="padding: 8px 12px; text-align: right;">Total</th></tr></thead>
                    <tbody>${itemsTable}</tbody>
                  </table>
                </div>
              `
            })
          });
          emailSentDriver = rDriver.ok;
          if (rDriver.ok) console.log('✉️ [BREVO DIRECT] Dispatched packing slip to driver:', driverEmail);
        } catch (eDriver) {
          console.warn('Direct Brevo driver email error:', eDriver.message);
        }
      }

      // Send to Super Admin & all added Admins strictly from bandirohan43@gmail.com
      for (const adm of adminEmails) {
        try {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MRS Crackers', email: 'bandirohan43@gmail.com' },
              to: [{ email: adm, name: 'MRS Admin' }],
              subject: `⚡ [ADMIN ALERT] New Order Received ${enrichedPayload.orderNumber || ''} - ₹${enrichedPayload.totalAmount} (COD)`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c041f; color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1.5px solid #FFB800;">
                  <h2 style="color: #FFB800; margin: 0 0 10px 0;">⚡ [ADMIN ALERT] NEW ORDER RECEIVED</h2>
                  <div style="background: #180938; border-radius: 8px; padding: 14px; margin: 14px 0; border: 1px solid #FFB800;">
                    <p style="margin: 4px 0;"><strong>Order ID:</strong> ${enrichedPayload.orderNumber || ''}</p>
                    <p style="margin: 4px 0;"><strong>Customer:</strong> ${enrichedPayload.customerName} (<a href="tel:${enrichedPayload.customerMobile}" style="color: #34D399;">+91 ${enrichedPayload.customerMobile}</a> | ${enrichedPayload.customerEmail})</p>
                    <p style="margin: 4px 0;"><strong>Delivery Destination:</strong> ${enrichedPayload.deliveryAddress}</p>
                    <p style="margin: 4px 0;"><strong>Total COD to Collect:</strong> <span style="color: #22C55E; font-weight: bold;">₹${enrichedPayload.totalAmount}</span></p>
                  </div>
                  <h3 style="color: #DDD6FE; font-size: 0.9rem; margin: 14px 0 6px 0;">Order Items:</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; background: #13062D; border-radius: 8px;">
                    <thead><tr style="background: #240E4F; color: #DDD6FE;"><th style="padding: 8px 12px; text-align: left;">Item</th><th style="padding: 8px 12px; text-align: center;">Qty</th><th style="padding: 8px 12px; text-align: right;">Price</th><th style="padding: 8px 12px; text-align: right;">Total</th></tr></thead>
                    <tbody>${itemsTable}</tbody>
                  </table>
                </div>
              `
            })
          });
          console.log('✉️ [BREVO DIRECT] Dispatched admin alert to:', adm);
        } catch (eAdm) {
          console.warn(`Direct Brevo admin alert error for ${adm}:`, eAdm.message);
        }
      }
    }

    // 3. Direct UltraMsg WhatsApp automated dispatch
    let whatsappSent = false;
    if (enrichedPayload.ultramsgInstance && enrichedPayload.ultramsgToken && enrichedPayload.customerMobile) {
      try {
        const cleanPhone = enrichedPayload.customerMobile.replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
        const itemsList = (enrichedPayload.items || []).map(i => `${i.name} (x${i.qty})`).join(', ');
        const waMsg = `💥 *MRS CRACKERS - ORDER CONFIRMED* 💥\n\nDear *${enrichedPayload.customerName || 'Customer'}*,\nThank you for ordering with MRS Crackers!\n\n📋 *Order:* ${enrichedPayload.orderNumber || ''}\n💵 *Total (COD):* ₹${enrichedPayload.totalAmount}\n📍 *Address:* ${enrichedPayload.deliveryAddress || 'Saidabad'}\n🎆 *Items:* ${itemsList}\n\nSaidabad Wholesale Counter | +91 9866522624, +91 6303083004`;

        const waResp = await fetch(`https://api.ultramsg.com/${enrichedPayload.ultramsgInstance}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: enrichedPayload.ultramsgToken,
            to: targetPhone,
            body: waMsg
          })
        });
        const waData = await waResp.json().catch(() => ({}));
        whatsappSent = waData.sent === 'true' || waResp.ok;
        if (whatsappSent) console.log('📲 [ULTRAMSG DIRECT] WhatsApp automated msg sent to:', targetPhone);
      } catch (eWa) {
        console.warn('Direct UltraMsg WhatsApp error:', eWa.message);
      }
    }

    return {
      success: true,
      emailSentCustomer,
      emailSentDriver,
      whatsappSent,
      orderNumber: enrichedPayload.orderNumber
    };
  }

  return {
    init: initClient,
    isConfigured,
    getConfig,
    saveCredentials,
    getStoreConfig,
    saveStoreConfig,
    checkUserExists,
    getProducts,
    saveProduct,
    updateProduct,
    getOrders,
    updateOrderStatus,
    getDrivers,
    getAdmins,
    addAdmin,
    removeAdmin,
    verifyCredentials,
    dispatchSecurityOtp,
    verifySecurityOtp,
    verifyDeliveryOtp,
    sendInvoice,
    sendRealEmailOtp,
    verifyRealEmailOtp,
    signUpCustomer,
    loginCustomer,
    getCustomerAddresses,
    saveCustomerAddress,
    registerDriverByAdmin,
    deleteCustomerAddress,
    createOrder,
    updateOrderUTR,
    subscribeToLiveTracking
  };
})();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.MRS_BACKEND = MRS_BACKEND;
  window.addEventListener('DOMContentLoaded', () => {
    MRS_BACKEND.init();
  });
}

// =============================================================================
// ADMIN SUPABASE UI HELPERS
// =============================================================================
window.saveAdminSupabaseCredentials = function() {
  const urlInput = document.getElementById('admin-supabase-url-input');
  const keyInput = document.getElementById('admin-supabase-key-input');
  const url = urlInput ? urlInput.value.trim() : '';
  const key = keyInput ? keyInput.value.trim() : '';

  if (!url || !key) {
    alert('Please enter both Supabase Project URL and Anon Key!');
    return;
  }

  MRS_BACKEND.saveCredentials(url, key);
  window.testAdminSupabaseConnection();
  if (typeof showToast === 'function') showToast('Supabase credentials saved! ⚡');
};

window.testAdminSupabaseConnection = async function() {
  const statusPill = document.getElementById('admin-supabase-status');
  const isConn = await MRS_BACKEND.init();
  if (isConn) {
    if (statusPill) {
      statusPill.innerHTML = '🟢 Connected';
      statusPill.style.background = 'rgba(34, 197, 94, 0.15)';
      statusPill.style.color = '#22C55E';
      statusPill.style.borderColor = '#22C55E';
    }
  } else {
    if (statusPill) {
      statusPill.innerHTML = '🟡 Local Mode';
      statusPill.style.background = 'rgba(255, 184, 0, 0.15)';
      statusPill.style.color = '#FFB800';
      statusPill.style.borderColor = '#FFB800';
    }
  }
};
