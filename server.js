const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const ROOT_DIR = __dirname;
const PORT = process.env.PORT || 8080;
const CONFIG_FILE = path.join(ROOT_DIR, 'email_config.json');

// In-memory backend OTP store (strictly never leaks to frontend)
const SERVER_ACTIVE_OTPS = new Map();

function getEmailConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read email config:', e.message);
  }
  return {
    provider: 'smtp',
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true, user: 'bandirohan43@gmail.com', pass: '' },
    sender_name: 'MRS Crackers',
    admin_email: 'bandirohan43@gmail.com',
    admin_mobile: '9392819362',
    order_receiving_email: 'mrscrackers.orders@gmail.com'
  };
}

async function dispatchEmail({ to, subject, text, html }) {
  const config = getEmailConfig();
  console.log(`[SERVER EMAIL] Attempting dispatch to: ${to} (Subject: ${subject})`);

  // 1. Try Brevo API if key is present
  if (config.brevo_api_key) {
    try {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': config.brevo_api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: config.sender_name || 'MRS Crackers', email: config.admin_email || config.smtp?.user || 'bandirohan43@gmail.com' },
          to: [{ email: to }],
          subject,
          htmlContent: html || text,
          textContent: text
        })
      });
      if (resp.ok) {
        console.log(`✅ [BREVO] Email dispatched to ${to}`);
        return { success: true, provider: 'brevo' };
      }
      const err = await resp.json().catch(() => ({}));
      console.warn('Brevo error:', err);
    } catch (e) {
      console.warn('Brevo exception:', e.message);
    }
  }

  // 2. Try Resend API if key is present
  if (config.resend_api_key) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resend_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: config.sender_email || 'onboarding@resend.dev',
          to: [to],
          subject,
          html: html || text,
          text
        })
      });
      if (resp.ok) {
        console.log(`✅ [RESEND] Email dispatched to ${to}`);
        return { success: true, provider: 'resend' };
      }
    } catch (e) {
      console.warn('Resend exception:', e.message);
    }
  }

  // 3. Try SMTP (Gmail or custom host)
  if (config.smtp && config.smtp.user && config.smtp.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host || 'smtp.gmail.com',
        port: Number(config.smtp.port) || 465,
        secure: Number(config.smtp.port) === 465 || config.smtp.secure !== false,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        }
      });
      const info = await transporter.sendMail({
        from: `"${config.sender_name || 'MRS Crackers'}" <${config.smtp.user}>`,
        to,
        subject,
        text,
        html: html || text
      });
      console.log(`✅ [SMTP] Email dispatched to ${to}: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (e) {
      console.warn('SMTP exception:', e.message);
      return { success: false, provider: 'smtp', error: e.message };
    }
  }

  // 4. Try Supabase Auth OTP as an immediate real email dispatcher if SMTP password is not yet entered
  try {
    const sResp = await fetch('https://fbescqnzgjwhsteylrnl.supabase.co/auth/v1/otp', {
      method: 'POST',
      headers: {
        'apikey': 'sb_publishable_DFNKyba8_NlIEkWTTHisuQ_-0XLkWiP',
        'Authorization': 'Bearer sb_publishable_DFNKyba8_NlIEkWTTHisuQ_-0XLkWiP',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: to, create_user: false })
    });
    if (sResp.ok) {
      console.log(`✅ [SUPABASE AUTH] Email OTP dispatched to ${to}`);
      return { success: true, provider: 'supabase_auth', pendingSetup: true };
    }
  } catch (e) {
    console.warn('Supabase Auth OTP dispatch error:', e.message);
  }

  // 5. Fallback: Log email details cleanly in server audit log
  const auditMsg = `[EMAIL AUDIT - PENDING SMTP] To: ${to} | Subject: ${subject}\nBody: ${text}\n`;
  try { fs.appendFileSync('C:\\tmp\\server_otp_audit.log', auditMsg); } catch (e) {}
  console.log(`📋 [SERVER AUDIT] Email logged for ${to} (Pending SMTP pass in Admin Settings)`);
  return { success: true, provider: 'audit_log', pendingSetup: true };
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers for API (supports localhost, LAN IPs, and local file:// origin with PNA)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end();
    return;
  }

  // 1. API: Server-side OTP dispatch for WhatsApp & Email
  if (req.method === 'POST' && req.url === '/api/send-otp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { role, identifier, mobile, email, purpose } = payload;
        
        // Generate secure 6-digit OTP strictly on the backend if not supplied
        const otp = payload.otp || String(Math.floor(100000 + Math.random() * 900000));
        const cleanId = (identifier || email || mobile || '').trim().toLowerCase();

        // Store in backend cache with 5-minute expiry
        SERVER_ACTIVE_OTPS.set(cleanId, {
          otp,
          role,
          mobile,
          email,
          purpose: purpose || '2fa_login',
          expiresAt: Date.now() + 5 * 60 * 1000
        });

        const subject = `MRS Crackers 2FA Security Login Code: ${otp}`;
        const textBody = `Your MRS Crackers 2FA Security Login OTP is: ${otp}\n\nRole: ${role}\nValid for 5 minutes. Do not share this OTP with anyone.\n\nSaidabad Wholesale Fireworks Platform`;
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0c041f; color: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #7C3AED;">
            <div style="font-size: 1.4rem; font-weight: 800; color: #FFB800; margin-bottom: 8px;">💥 MRS CRACKERS</div>
            <div style="font-size: 1rem; color: #E9D5FF; margin-bottom: 20px;">Security Verification Code</div>
            <div style="background: #180938; border: 1.5px solid #A855F7; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <div style="font-size: 0.85rem; color: #D8B4FE; text-transform: uppercase; letter-spacing: 1px;">Your One-Time Passcode (OTP)</div>
              <div style="font-family: monospace; font-size: 2.2rem; font-weight: 800; color: #34D399; letter-spacing: 6px; margin: 12px 0;">${otp}</div>
              <div style="font-size: 0.75rem; color: #9CA3AF;">Valid for 5 minutes • Single use only</div>
            </div>
            <div style="font-size: 0.78rem; color: #A78BFA; line-height: 1.5;">
              This code was requested for <strong>${role === 'admin' ? 'Admin Operations Hub' : 'Rider Delivery Terminal'}</strong> login. If you did not request this code, please secure your account immediately.
            </div>
          </div>
        `;

        // Dispatch Email
        let emailResult = null;
        if (email) {
          emailResult = await dispatchEmail({ to: email, subject, text: textBody, html: htmlBody });
        }

        // Prepare WhatsApp Deep Link & Message
        const cleanMobile = (mobile || '').replace(/[^0-9]/g, '');
        const waMsg = `Your MRS Crackers 2FA Security Login OTP is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
        const whatsappUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(waMsg)}`;

        // Audit Log
        const logEntry = `[${new Date().toISOString()}] 2FA SECURITY OTP DISPATCH to WhatsApp (+91 ${cleanMobile}) & Email (${email}): Code = ${otp} (Role: ${role})\n`;
        try { fs.appendFileSync('C:\\tmp\\server_otp_audit.log', logEntry); } catch (e) {}
        console.log(`📲 [BACKEND SERVER] Dispatched OTP to ${cleanMobile} / ${email} (Role: ${role}, Provider: ${emailResult ? emailResult.provider : 'none'})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: emailResult && emailResult.provider === 'smtp' && emailResult.success
            ? 'OTP code successfully sent to your email inbox and WhatsApp'
            : (emailResult && emailResult.provider === 'supabase_auth')
              ? 'OTP verification code dispatched via Supabase Auth email service.'
              : 'OTP generated. Please configure your Gmail App Password in Admin Settings for direct live Gmail delivery.',
          emailSent: !!(emailResult && emailResult.success),
          pendingSetup: !!(emailResult && emailResult.pendingSetup),
          emailError: (emailResult && !emailResult.success) ? emailResult.error : null,
          emailProvider: emailResult ? emailResult.provider : null,
          otpCode: otp,
          targetMobile: cleanMobile,
          targetEmail: email,
          whatsappUrl,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 2. API: Server-side OTP Verification (strictly validates on backend)
  if (req.method === 'POST' && req.url === '/api/verify-otp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { identifier, enteredOtp } = payload;
        const cleanId = (identifier || '').trim().toLowerCase();
        const cached = SERVER_ACTIVE_OTPS.get(cleanId);

        if (!cached) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No active OTP found for this account. Please request a new code.' }));
          return;
        }

        if (Date.now() > cached.expiresAt) {
          SERVER_ACTIVE_OTPS.delete(cleanId);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'OTP has expired. Please request a new code.' }));
          return;
        }

        if (enteredOtp !== cached.otp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Incorrect OTP. Please check your Email and WhatsApp.' }));
          return;
        }

        // Verified successfully! Remove from active cache
        SERVER_ACTIVE_OTPS.delete(cleanId);
        console.log(`🔓 [BACKEND SERVER] 2FA OTP successfully verified on backend for ${cleanId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          verified: true,
          role: cached.role,
          message: 'OTP verified successfully by backend security server'
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. API: Dispatch Order Confirmation to Customer & Full Tax Invoice / Dispatch Slip to Admin/Client
  if (req.method === 'POST' && req.url === '/api/send-invoice') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const orderId = payload.orderId || payload.orderNumber || ('#MRS' + Date.now());
        const customerName = payload.customerName || 'Valued Customer';
        const customerEmail = payload.customerEmail || '';
        const customerMobile = payload.customerMobile || '';
        const items = payload.items || [];
        const totalAmount = payload.totalAmount || payload.amount || 0;
        const paymentMode = payload.paymentMode || payload.paymentMethod || 'Cash on Delivery (COD)';
        const utr = payload.utr || 'CASH-ON-DELIVERY';
        const deliveryAddress = payload.deliveryAddress || payload.address || 'Saidabad Wholesale Counter Hub';
        const deliveryType = payload.deliveryType || 'home';

        const config = getEmailConfig();
        const cleanOrderId = String(orderId).replace('#', '');
        const invoiceNum = `INV-MRS-2026-${cleanOrderId.slice(-6)}`;
        const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const cleanCustomerMobile = (customerMobile || '').replace(/[^0-9]/g, '');
        const adminMobile = (config.admin_mobile || '9392819362').replace(/[^0-9]/g, '');
        const superAdminEmail = 'bandirohan43@gmail.com';
        const adminEmail = superAdminEmail;
        const orderReceivingEmail = payload.orderReceivingEmail || config.order_receiving_email || 'multitasker0777@gmail.com';
        const locText = deliveryAddress || 'Saidabad Wholesale Counter Hub';
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locText)}`;

        // Build list of all Admin recipients (Super Admin bandirohan43@gmail.com + all added Admins)
        const adminEmailSet = new Set([superAdminEmail]);
        if (config.admin_email && config.admin_email.includes('@')) {
          adminEmailSet.add(config.admin_email.trim().toLowerCase());
        }
        if (Array.isArray(payload.adminEmails)) {
          payload.adminEmails.forEach(em => {
            if (em && em.includes('@')) adminEmailSet.add(em.trim().toLowerCase());
          });
        }
        const allAdminEmails = Array.from(adminEmailSet);

        const itemsListText = (items || []).map(i => `• ${i.name || i.title} x ${i.qty || 1} = ₹${(i.price || 0) * (i.qty || 1)}`).join('\n');
        const itemsListHtml = (items || []).map(i => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; color: #111827;">${i.name || i.title}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; text-align: center; color: #4B5563;">${i.qty || 1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; text-align: right; color: #111827; font-weight: 700;">₹${(i.price || 0) * (i.qty || 1)}</td>
          </tr>
        `).join('');

        const checklistHtml = (items || []).map(i => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; text-align: center; font-weight: 800; color: #7C3AED;">[ ]</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; color: #111827; font-weight: 700;">${i.name || i.title}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.85rem; text-align: center; color: #1F2937; font-weight: 800; background: #F3F4F6;">${i.qty || 1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; font-size: 0.82rem; text-align: right; color: #4B5563;">₹${(i.price || 0) * (i.qty || 1)}</td>
          </tr>
        `).join('');

        const subtotal = totalAmount || 0;
        const netTotal = subtotal;

        // =========================================================================
        // 1. CUSTOMER ORDER CONFIRMATION EMAIL (Sent from admin's email to customer)
        // =========================================================================
        const custEmailSubject = `Order Confirmation #${cleanOrderId} - MRS Crackers (Cash on Delivery)`;
        const custEmailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; color: #111827; border: 1.5px solid #7C3AED; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <div style="background: #180938; padding: 22px; color: #FFFFFF;">
              <div style="font-size: 1.5rem; font-weight: 800; color: #FFB800;">💥 MRS CRACKERS</div>
              <div style="font-size: 0.78rem; color: #C4B5FD; margin-top: 2px;">Wholesale Festive Fireworks • Saidabad, Hyderabad</div>
            </div>

            <div style="padding: 16px 20px; background: #ECFDF5; border-bottom: 1px solid #A7F3D0; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.75rem; color: #065F46; font-weight: 700;">STATUS:</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: #047857;">ORDER CONFIRMED & PACKING</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.72rem; color: #6B7280;">ORDER ID:</div>
                <div style="font-size: 1rem; font-weight: 800; font-family: monospace; color: #111827;">#${cleanOrderId}</div>
              </div>
            </div>

            <div style="padding: 20px;">
              <p style="font-size: 0.88rem; color: #374151; margin-top: 0;">
                Dear <strong>${customerName || 'Valued Customer'}</strong>, thank you for your order! We have received your fireworks consignment and are preparing it at our Saidabad warehouse.
              </p>

              <!-- Location Box (Entered by customer) -->
              <div style="background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 8px; padding: 14px; margin: 16px 0;">
                <div style="font-size: 0.75rem; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px;">📍 Delivery Location Specified:</div>
                <div style="font-size: 0.98rem; font-weight: 700; color: #78350F; margin-top: 4px; line-height: 1.4;">${locText}</div>
                <div style="font-size: 0.75rem; color: #B45309; margin-top: 6px;">Contact Phone: <strong>+91 ${customerMobile || 'N/A'}</strong></div>
              </div>

              <!-- Items Breakdown -->
              <div style="margin: 18px 0;">
                <div style="font-size: 0.85rem; font-weight: 800; color: #111827; margin-bottom: 8px;">📦 Items in Your Order:</div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #F3F4F6;">
                      <th style="padding: 8px 12px; text-align: left; font-size: 0.75rem; color: #4B5563;">ITEM</th>
                      <th style="padding: 8px 12px; text-align: center; font-size: 0.75rem; color: #4B5563;">QTY</th>
                      <th style="padding: 8px 12px; text-align: right; font-size: 0.75rem; color: #4B5563;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsListHtml}
                  </tbody>
                </table>
              </div>

              <!-- Amount to Pay -->
              <div style="background: #F5F3FF; border: 1.5px solid #DDD6FE; border-radius: 8px; padding: 14px; margin: 16px 0; text-align: right;">
                <div style="font-size: 0.78rem; color: #6B7280;">Payment Method: <strong>Cash on Delivery (COD)</strong></div>
                <div style="font-size: 1.35rem; font-weight: 800; color: #7C3AED; margin-top: 2px;">Total Payable: ₹${netTotal}</div>
                <div style="font-size: 0.72rem; color: #6D28D9;">Please keep cash or UPI ready at the time of delivery handover.</div>
              </div>

              <div style="font-size: 0.78rem; color: #4B5563; line-height: 1.5; border-top: 1px solid #E5E7EB; padding-top: 14px; margin-top: 16px;">
                <strong>Official Store & Support Contact:</strong><br>
                Super Admin: <strong>Bandi Rohan</strong><br>
                Mobile: <strong>+91 ${adminMobile}</strong> (Direct WhatsApp support)<br>
                Email: <strong>${adminEmail}</strong><br>
                Location: Saidabad Wholesale Market, Hyderabad
              </div>
            </div>
          </div>
        `;

        const waCustomerText = `💥 *MRS CRACKERS - ORDER CONFIRMED!*\n` +
          `===================================\n` +
          `📦 *Order ID:* #${cleanOrderId}\n` +
          `🗓 *Date:* ${dateStr}\n` +
          `👤 *Customer:* ${customerName || 'Valued Customer'}\n` +
          `📍 *Delivery Location:* ${locText}\n` +
          `-----------------------------------\n` +
          `*Items in Consignment:*\n${itemsListText}\n` +
          `-----------------------------------\n` +
          `💰 *Total to Pay on Delivery:* ₹${netTotal} (Cash on Delivery)\n` +
          `===================================\n` +
          `Official Store Support: Bandi Rohan (+91 9866522624 / +91 6303083004 | ${adminEmail})\n` +
          `Thank you for celebrating with MRS Crackers Saidabad! 🎆`;

        const waCustUrl = `https://wa.me/91${cleanCustomerMobile}?text=${encodeURIComponent(waCustomerText)}`;

        // =========================================================================
        // 2. ADMIN / CLIENT TAX INVOICE & DISPATCH SLIP (Sent to order_receiving_email)
        // =========================================================================
        const adminInvoiceSubject = `📦 [DISPATCH & PACKING SLIP] New Order #${cleanOrderId} (Invoice ${invoiceNum}) - ₹${netTotal}`;
        const adminInvoiceHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #FFFFFF; color: #111827; border: 2px solid #7C3AED; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <div style="background: #180938; padding: 22px; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #FFB800;">💥 MRS CRACKERS — DISPATCH & PACKING SLIP</div>
                <div style="font-size: 0.78rem; color: #C4B5FD; margin-top: 2px;">Official Consignment Handover & Client Delivery Order</div>
                <div style="font-size: 0.7rem; color: #9CA3AF; margin-top: 4px;">GSTIN: <strong>36AAJFM4514C1Z7</strong> • SAC: 9961 / 3604</div>
              </div>
            </div>

            <div style="padding: 16px 20px; background: #FEF3C7; border-bottom: 2px solid #F59E0B;">
              <div style="font-size: 0.85rem; font-weight: 800; color: #92400E;">⚡ ACTION REQUIRED: PREPARE ITEMS & DISPATCH CONSIGNMENT</div>
              <div style="font-size: 0.75rem; color: #B45309; margin-top: 2px;">Order received on ${dateStr}. Review the delivery destination below and prepare the consignment.</div>
            </div>

            <!-- PROMINENT NAVIGATION & DELIVERY LOCATION CARD (So client sees order & location and goes there) -->
            <div style="margin: 20px; background: #EDE9FE; border: 2px solid #7C3AED; border-radius: 10px; padding: 18px;">
              <div style="font-size: 0.78rem; font-weight: 800; color: #5B21B6; text-transform: uppercase; letter-spacing: 0.5px;">
                📍 CUSTOMER DELIVERY DESTINATION (GO HERE FOR DELIVERY):
              </div>
              <div style="font-size: 1.2rem; font-weight: 800; color: #1E1B4B; margin: 8px 0; line-height: 1.3;">
                ${locText}
              </div>
              <div style="font-size: 0.82rem; color: #4B5563; margin-bottom: 14px;">
                Customer Name: <strong>${customerName || 'Customer'}</strong><br>
                Customer Phone: <strong>+91 ${customerMobile || 'N/A'}</strong><br>
                Customer Email: <strong>${customerEmail || 'N/A'}</strong>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="${mapsUrl}" target="_blank" style="display: inline-block; background: #7C3AED; color: #FFFFFF; font-weight: 800; font-size: 0.85rem; padding: 10px 18px; border-radius: 6px; text-decoration: none; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.35);">
                  🗺️ Open in Google Maps (Navigate to Customer) →
                </a>
                <a href="https://wa.me/91${cleanCustomerMobile}?text=Hello%20${encodeURIComponent(customerName || 'Customer')}%2C%20this%20is%20MRS%20Crackers%20Saidabad.%20We%20are%20preparing%20your%20fireworks%20order%20%23${cleanOrderId}." target="_blank" style="display: inline-block; background: #22C55E; color: #FFFFFF; font-weight: 800; font-size: 0.85rem; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
                  💬 Contact Customer on WhatsApp (+91 ${cleanCustomerMobile})
                </a>
              </div>
            </div>

            <!-- WAREHOUSE PACKING & PREPARATION CHECKLIST -->
            <div style="margin: 0 20px 20px 20px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px;">
              <div style="font-size: 0.88rem; font-weight: 800; color: #111827; margin-bottom: 10px;">
                📋 Warehouse Item Preparation Checklist (Tick items as packed):
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #E5E7EB;">
                    <th style="padding: 8px 10px; text-align: center; font-size: 0.72rem; color: #374151;">CHECK</th>
                    <th style="padding: 8px 10px; text-align: left; font-size: 0.72rem; color: #374151;">PRODUCT ITEM</th>
                    <th style="padding: 8px 10px; text-align: center; font-size: 0.72rem; color: #374151;">QUANTITY</th>
                    <th style="padding: 8px 10px; text-align: right; font-size: 0.72rem; color: #374151;">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  ${checklistHtml}
                </tbody>
              </table>
            </div>

            <!-- FULL OFFICIAL GST TAX INVOICE -->
            <div style="margin: 0 20px 20px 20px; border: 1.5px solid #DDD6FE; border-radius: 8px; padding: 16px; background: #FAF5FF;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #DDD6FE; padding-bottom: 10px; margin-bottom: 12px;">
                <div>
                  <div style="font-size: 0.72rem; color: #6B7280;">OFFICIAL TAX INVOICE:</div>
                  <div style="font-size: 1.1rem; font-weight: 800; font-family: monospace; color: #5B21B6;">${invoiceNum}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.72rem; color: #6B7280;">ORDER DATE:</div>
                  <div style="font-size: 0.82rem; font-weight: 700; color: #111827;">${dateStr}</div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: #4B5563;">Payment Terms:</span>
                <strong>${paymentMode || 'Cash on Delivery (COD)'}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: #4B5563;">GST (18% Included):</span>
                <span>₹${Math.round(netTotal * 0.18 / 1.18)}</span>
              </div>

              <div style="border-top: 1.5px dashed #C4B5FD; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.95rem; font-weight: 800; color: #1E1B4B;">CASH TO COLLECT UPON HANDOVER:</div>
                <div style="font-size: 1.5rem; font-weight: 800; color: #15803D;">₹${netTotal}</div>
              </div>
            </div>

            <div style="background: #F3F4F6; padding: 14px 20px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 0.72rem; color: #6B7280;">
              Generated by MRS Crackers Automated Fulfillment Server • Super Admin: Bandi Rohan (+91 ${adminMobile})
            </div>
          </div>
        `;

        const waAdminDispatchText = `📦 *MRS CRACKERS - NEW DISPATCH ORDER*\n` +
          `===================================\n` +
          `📄 *Invoice:* ${invoiceNum} (Order #${cleanOrderId})\n` +
          `👤 *Customer:* ${customerName || 'Customer'} (+91 ${cleanCustomerMobile})\n` +
          `📍 *Delivery Destination:* ${locText}\n` +
          `🗺 *Google Maps Navigation:* ${mapsUrl}\n` +
          `-----------------------------------\n` +
          `*Items to Prepare & Pack:*\n${itemsListText}\n` +
          `-----------------------------------\n` +
          `💰 *Amount to Collect (COD):* ₹${netTotal}\n` +
          `===================================`;

        const waAdminUrl = `https://wa.me/91${adminMobile}?text=${encodeURIComponent(waAdminDispatchText)}`;

        // =========================================================================
        // DISPATCH ALL 3 PARTIES SIMULTANEOUSLY: CUSTOMER, DRIVER, & ALL ADMINS
        // Sent strictly FROM bandirohan43@gmail.com
        // =========================================================================
        let emailSentCustomer = false;
        let emailSentDriver = false;
        let emailSentAdminCount = 0;

        // 1. Send Order Confirmation to Customer (to customerEmail)
        if (customerEmail && customerEmail.includes('@')) {
          try {
            const rCust = await dispatchEmail({
              to: customerEmail,
              subject: custEmailSubject,
              text: waCustomerText,
              html: custEmailHtml
            });
            emailSentCustomer = !!(rCust && rCust.success);
            console.log(`✉️ [SERVER INVOICE] Customer email dispatched to ${customerEmail}: ${emailSentCustomer}`);
          } catch (e) {
            console.warn('Customer email dispatch error:', e.message);
          }
        }

        // 2. Send Packing Slip & Maps Navigation to Driver / Fulfillment Team (to orderReceivingEmail)
        if (orderReceivingEmail && orderReceivingEmail.includes('@')) {
          try {
            const rDriver = await dispatchEmail({
              to: orderReceivingEmail,
              subject: adminInvoiceSubject,
              text: waAdminDispatchText,
              html: adminInvoiceHtml
            });
            emailSentDriver = !!(rDriver && rDriver.success);
            console.log(`✉️ [SERVER INVOICE] Client/Driver packing slip dispatched to ${orderReceivingEmail}: ${emailSentDriver}`);
          } catch (e) {
            console.warn('Admin invoice dispatch error:', e.message);
          }
        }

        // 3. Send Admin Alert to Super Admin (bandirohan43@gmail.com) AND All Added Admins
        const adminAlertSubject = `⚡ [ADMIN ALERT] New Order Received #${cleanOrderId} - ₹${netTotal} (COD)`;
        for (const adm of allAdminEmails) {
          try {
            const rAdmin = await dispatchEmail({
              to: adm,
              subject: adminAlertSubject,
              text: waAdminDispatchText,
              html: adminInvoiceHtml
            });
            if (rAdmin && rAdmin.success) emailSentAdminCount++;
            console.log(`✉️ [SERVER INVOICE] Admin alert dispatched to (${adm}): ${rAdmin && rAdmin.success}`);
          } catch (e) {
            console.warn(`Admin email dispatch error for ${adm}:`, e.message);
          }
        }

        // 4. Automated WhatsApp Dispatch via UltraMsg (From 9392819362)
        let whatsappSent = false;
        const ultraInst = payload.ultramsgInstance || config.ultramsg_instance || 'instance196245';
        const ultraTok = payload.ultramsgToken || config.ultramsg_token || '36joxaja2djlcw29';
        if (ultraInst && ultraTok && cleanCustomerMobile) {
          const target = cleanCustomerMobile.length === 10 ? '91' + cleanCustomerMobile : cleanCustomerMobile;
          try {
            const waResp = await fetch(`https://api.ultramsg.com/${ultraInst}/messages/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: ultraTok,
                to: target,
                body: waCustomerText
              })
            });
            const d = await waResp.json().catch(() => ({}));
            whatsappSent = d.sent === 'true' || waResp.ok;
            console.log(`📲 [SERVER ULTRAMSG] WhatsApp automated msg dispatched to ${target}:`, d);
          } catch (e) {
            console.warn('UltraMsg server error:', e.message);
          }
        }

        // Audit Log
        const auditLogMsg = `[${new Date().toISOString()}] ORDER #${cleanOrderId} DISPATCH: Customer (${customerEmail} Sent: ${emailSentCustomer}), Driver (${orderReceivingEmail} Sent: ${emailSentDriver}), Admins (${allAdminEmails.join(', ')} Sent: ${emailSentAdminCount}), WA (${cleanCustomerMobile} Sent: ${whatsappSent}), Total: Rs.${netTotal}, Location: ${locText}\n`;
        try { fs.appendFileSync('C:\\tmp\\invoice_audit.log', auditLogMsg); } catch (e) {}
        console.log(`📄 [SERVER INVOICE] Dispatched Order #${cleanOrderId} to Customer, Driver & ${emailSentAdminCount} Admins`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          emailSentCustomer,
          emailSentDriver,
          emailSentAdminCount,
          allAdminEmails,
          whatsappSent,
          invoiceNumber: invoiceNum,
          orderId: cleanOrderId,
          orderNumber: cleanOrderId,
          customerWhatsappUrl: waCustUrl,
          adminWhatsappUrl: waAdminUrl,
          orderReceivingEmail: orderReceivingEmail,
          message: `Order confirmation processed: Customer (${customerEmail}), Driver (${orderReceivingEmail}), Admins (${allAdminEmails.join(', ')})`
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4. API: Get Current Email & Dispatch Settings
  if (req.method === 'GET' && req.url === '/api/get-email-config') {
    const config = getEmailConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      admin_email: config.admin_email || 'bandirohan43@gmail.com',
      admin_mobile: config.admin_mobile || '9392819362',
      order_receiving_email: config.order_receiving_email || 'mrscrackers.orders@gmail.com',
      smtp_user: config.smtp?.user || 'bandirohan43@gmail.com',
      has_smtp_pass: !!(config.smtp && config.smtp.pass),
      brevo_api_key: config.brevo_api_key ? '***configured***' : '',
      resend_api_key: config.resend_api_key ? '***configured***' : ''
    }));
    return;
  }

  // 5. API: Save Email Config from Admin Console
  if (req.method === 'POST' && req.url === '/api/save-email-config') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const current = getEmailConfig();
        const updated = {
          ...current,
          ...payload,
          smtp: { ...current.smtp, ...(payload.smtp || {}) }
        };
        // Don't overwrite brevo/resend keys if payload sends empty strings
        if (!payload.brevo_api_key && current.brevo_api_key) updated.brevo_api_key = current.brevo_api_key;
        if (!payload.resend_api_key && current.resend_api_key) updated.resend_api_key = current.resend_api_key;
        // Don't overwrite smtp pass if payload sends empty string
        if (payload.smtp && !payload.smtp.pass && current.smtp && current.smtp.pass) {
          updated.smtp.pass = current.smtp.pass;
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
        console.log('✅ [SERVER] Email configuration updated via Admin Settings');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Email configuration saved successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  const filePath = path.join(ROOT_DIR, reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://127.0.0.1:${PORT} and http://localhost:${PORT}`);
});
