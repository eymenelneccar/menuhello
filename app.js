// Sample Menu Data now loaded from assets JSON
let menuData = [];
let categories = [];

async function loadAssets() {
    try {
        // تعطيل التخزين المؤقت لضمان أن التغييرات من لوحة التحكم تظهر فورًا
        const ts = Date.now();
        const [menuRes, catRes] = await Promise.all([
            fetch(`assets/menu.json?v=${ts}`, { cache: 'no-store' }),
            fetch(`assets/categories.json?v=${ts}`, { cache: 'no-store' })
        ]);
        const [menuJson, categoriesJson] = await Promise.all([
            menuRes.json(),
            catRes.json()
        ]);
        menuData = Array.isArray(menuJson) ? menuJson : [];
        categories = Array.isArray(categoriesJson) ? categoriesJson : [];
    } catch (e) {
        console.error('فشل تحميل الملفات من الأصول:', e);
        showMessage('تعذر تحميل البيانات من الأصول.', 'error');
        menuData = [];
        categories = [];
    }
}

// Manually assign a representative image and a background color for menu item cards for variety
const categoryImages = {
    "اللحوم": "https://placehold.co/600x400/10B981/ffffff?text=%20&v=2",
    "الدجاج": "https://placehold.co/600x400/F59E0B/ffffff?text=%20&v=2",
    "الوجبات السريعة": "https://placehold.co/600x400/EF4444/ffffff?text=%20&v=2",
    "المعجنات": "https://placehold.co/600x400/3B82F6/ffffff?text=%20&v=2",
    "المقبلات": "https://placehold.co/600x400/6366F1/ffffff?text=%20&v=2",
    "المشروبات": "https://placehold.co/600x400/EC4899/ffffff?text=%20&v=2",
    "الحلويات": "https://placehold.co/600x400/F472B6/ffffff?text=%20&v=2",
};

// Background colors for the actual menu item cards
// ** التعديل هنا: لزيادة التباين والتنوع في ألوان البطاقات **
const itemCardColors = [
    'bg-yellow-700',   // أصفر داكن/عسلي
    'bg-red-700',      // أحمر داكن/برغندي
    'bg-emerald-700',  // أخضر بحري داكن
    'bg-indigo-700',   // نيلي داكن
    'bg-orange-700',   // برتقالي داكن
    'bg-pink-700',     // وردي داكن
];

// Array to control the size of the cards for the "Puzzle" effect
const categorySizes = {
    "اللحوم": 2, // Double Height
    "الدجاج": 1, 
    "الوجبات السريعة": 1,
    "المعجنات": 2, // Double Height
    "المقبلات": 1, 
    "المشروبات": 1,
    "الحلويات": 1, 
};


let cartItems = []; // Local cart simulation

const categoriesListElement = document.getElementById('categories-list');
const menuItemsForCategoryElement = document.getElementById('menu-items-for-category');
const mainTitleElement = document.getElementById('main-title');
const backButtonElement = document.getElementById('back-button');
const messageBox = document.getElementById('message-box');
const backdropElement = document.getElementById('backdrop');
const itemModal = document.getElementById('item-modal');
const aboutModal = document.getElementById('about-modal');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const orderNoteEl = document.getElementById('order-note');
const orderNameEl = document.getElementById('order-name');
const orderPhoneEl = document.getElementById('order-phone');
const orderAddressEl = document.getElementById('order-address');
const orderTotalEl = document.getElementById('order-total');
const orderSubmitBtn = document.getElementById('order-submit-button');
const orderCallBtn = document.getElementById('order-call-button');
const cartLocationNameEl = document.getElementById('cart-location-name');
const cartCloseButton = document.getElementById('cart-close-button');
const cartClearButton = document.getElementById('cart-clear-button');


// --- Helper Functions ---

function showMessage(message, type = 'success') {
    const baseClass = 'bg-opacity-90 text-white';
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    messageBox.textContent = message;
    messageBox.className = `fixed top-4 left-1/2 -translate-x-1/2 p-3 px-6 rounded-full text-sm font-medium z-50 transition-all duration-300 transform ${baseClass} ${typeClasses[type]} opacity-100 translate-y-0`;

    setTimeout(() => {
        messageBox.classList.add('translate-y-[-50px]', 'opacity-0');
    }, 3000);
}

// Function to toggle the dimming backdrop
window.toggleBackdrop = () => {
    if (backdropElement.classList.contains('hidden')) {
        showBackdrop();
    } else {
        hideBackdrop();
    }
}

window.showBackdrop = () => {
    const bd = backdropElement || document.getElementById('backdrop');
    if (bd) bd.classList.remove('hidden');
}

window.hideBackdrop = () => {
    const bd = backdropElement || document.getElementById('backdrop');
    if (bd) bd.classList.add('hidden');
}

// --- Modal Logic ---

window.openItemModal = (itemId) => {
    const item = menuData.find(i => i.id === itemId || i.id === parseInt(itemId));
    if (!item) return;

    // Fill modal content
    document.getElementById('modal-item-image').src = item.imageUrl || 'https://placehold.co/600x400/334155/ffffff?text=No+Image';
    document.getElementById('modal-item-name').textContent = item.name || '';
    document.getElementById('modal-item-description').textContent = item.description || '';
    const price = typeof item.price === 'number' ? item.price : Number(item.price || 0);
    document.getElementById('modal-item-price').textContent = `${price.toFixed(2)} د.ع`;

    // Theme-based colors for modal
    if (itemModal) itemModal.style.backgroundColor = siteSettings?.theme?.itemCardBgColor || '#374151';
    const modalDesc = document.getElementById('modal-item-description');
    const modalPrice = document.getElementById('modal-item-price');
    if (modalDesc) modalDesc.style.color = siteSettings?.theme?.itemDescriptionColor || '#D1D5DB';
    if (modalPrice) modalPrice.style.color = siteSettings?.theme?.itemPriceColor || '#93C5FD';

    // Variants in modal: show vertical rows with black titles, aligned price/add
    const addBtn = document.getElementById('modal-add-to-cart');
    const priceRowEl = document.getElementById('modal-item-price')?.parentElement;
    const modalContent = document.getElementById('modal-content');
    const variants = Array.isArray(item.variants) ? item.variants.filter(v => v && v.name) : [];
    const hasVariants = variants.length > 0;
    let modalVariants = document.getElementById('modal-variants');
    if (!modalVariants) {
        modalVariants = document.createElement('div');
        modalVariants.id = 'modal-variants';
        modalContent && modalContent.appendChild(modalVariants);
    }

    if (hasVariants) {
        // Hide base price/add row
        if (priceRowEl) priceRowEl.style.display = 'none';
        if (addBtn) addBtn.style.display = 'none';
        // Render variant list
        modalVariants.innerHTML = `
          <div class="mt-4 space-y-2">
            ${variants.map(v => {
              const vp = typeof v.price === 'number' ? v.price : Number(v.price || 0);
              const vName = String(v.name).replace(/\"/g, '&quot;').replace(/'/g, "\\'");
              return `
                <div class="flex items-center justify-between bg-white rounded-lg p-2">
                  <span class="font-extrabold text-black">${vName}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-blue-600 font-bold">${Number(vp).toLocaleString('en-US')} د.ع</span>
                    <button 
                      class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center transition duration-200 shadow-md"
                      onclick="addVariantToCart(${item.id}, '${vName}', ${Number(vp)}, this);"
                      title="إضافة ${vName}"
                      style="background-color: ${siteSettings?.theme?.addToCartBgColor || '#2563EB'}"
                    >
                      <i class="ph ph-plus text-white text-base font-black"></i>
                    </button>
                  </div>
                </div>`;
            }).join('')}
          </div>
        `;
    } else {
        // Show base price/add and clear variants container
        if (priceRowEl) priceRowEl.style.display = '';
        if (addBtn) {
            addBtn.style.display = '';
            addBtn.dataset.itemId = item.id;
            addBtn.style.backgroundColor = siteSettings?.theme?.addToCartBgColor || '#2563EB';
            addBtn.onclick = (e) => { e.stopPropagation(); addItemToCart(item.id); };
            addBtn.innerHTML = '<i class="ph ph-plus text-white text-2xl font-black"></i>';
        }
        if (modalVariants) modalVariants.innerHTML = '';
    }

    // Show modal and backdrop
    itemModal.classList.add('open');
    showBackdrop();
}

window.closeItemModal = () => {
    itemModal.classList.remove('open');
    hideBackdrop();
}

// --- About Us Modal Logic ---
window.openAboutModal = () => {
  if (!aboutModal) return;
  aboutModal.classList.add('open');
  showBackdrop();
};

window.closeAboutModal = () => {
  if (!aboutModal) return;
  aboutModal.classList.remove('open');
  hideBackdrop();
};

// --- Cart Drawer Logic ---
function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';
  if (!cartItems.length) {
    if (cartEmptyEl) cartEmptyEl.classList.remove('hidden');
    return;
  }
  if (cartEmptyEl) cartEmptyEl.classList.add('hidden');
  const aggs = aggregateCart();
  aggs.forEach((it) => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200 shadow-sm';
    const unit = typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice || 0);
    row.innerHTML = `
      <!-- Controls on the left, smaller size -->
      <div class="flex items-center gap-1">
        <button data-action="remove-all" data-item-id="${it.id}" data-variant-name="${it.variantName || ''}" class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center" title="حذف">
          <i class="ph ph-trash text-base"></i>
        </button>
        <button data-action="inc" data-item-id="${it.id}" data-variant-name="${it.variantName || ''}" class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center" title="زيادة">
          <span class="text-sm leading-none">+</span>
        </button>
        <span class="text-sm font-bold text-slate-900">${it.qty}</span>
        <button data-action="dec" data-item-id="${it.id}" data-variant-name="${it.variantName || ''}" class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center" title="تقليل">
          <span class="text-sm leading-none">−</span>
        </button>
      </div>
      <!-- Item info on the right -->
      <div class="flex items-center gap-2">
        <img src="${it.imageUrl || 'https://placehold.co/48x48/cccccc/333?text=IMG'}" alt="${it.name || ''}" class="w-12 h-12 object-cover rounded-xl border" onerror="this.onerror=null;this.src='https://placehold.co/48x48/cccccc/333?text=IMG';">
        <div class="text-right">
          <div class="text-sm font-bold">${it.name || ''}</div>
          ${it.variantName ? `<div class="text-xs text-slate-600">الحجم: ${it.variantName}</div>` : ''}
          <div class="text-xs text-slate-500">${Number(unit).toLocaleString('en-US')} د.ع للوحدة</div>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(row);
  });

  // تحديث الإجمالي
  const total = cartItems.reduce((sum, it) => sum + (typeof it.price === 'number' ? it.price : (typeof it.variantPrice === 'number' ? it.variantPrice : Number(it.price||0))), 0);
  if (orderTotalEl) orderTotalEl.textContent = `${Number(total).toLocaleString('en-US')} د.ع`;
}

window.openCart = () => {
  const drawer = cartDrawer || document.getElementById('cart-drawer');
  if (!drawer) { console.warn('cart-drawer element not found'); return; }
  renderCart();
  drawer.classList.add('open');
  showBackdrop();
  // تحديث معلومات الفرع ورابط الاتصال
  try {
    const loc = siteSettings?.locationName || '';
    if (cartLocationNameEl) cartLocationNameEl.textContent = loc || 'الفرع';
    const contactRaw = (siteSettings?.contactNumber || '').trim();
    const contact = contactRaw.replace(/\D+/g, '');
    if (orderCallBtn) {
      orderCallBtn.href = contact ? `tel:${contactRaw}` : '#';
    }
  } catch {}
  // ربط زر الإرسال مرة واحدة
  if (orderSubmitBtn && !orderSubmitBtn.dataset.bound) {
    orderSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitOrder();
    });
    orderSubmitBtn.dataset.bound = '1';
  }
};

window.closeCart = () => {
  const drawer = cartDrawer || document.getElementById('cart-drawer');
  if (drawer) drawer.classList.remove('open');
  hideBackdrop();
};

if (cartCloseButton) cartCloseButton.onclick = () => closeCart();
if (cartClearButton) cartClearButton.onclick = () => {
  cartItems = [];
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = '0';
  renderCart();
};

if (cartItemsContainer) {
  cartItemsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const itemId = btn.dataset.itemId;
    const variantName = btn.dataset.variant_name || btn.dataset.variantName || '';
    if (action === 'remove') {
      const localId = btn.dataset.localId;
      cartItems = cartItems.filter(it => String(it.localId) !== String(localId));
    } else if (action === 'remove-all') {
      cartItems = cartItems.filter(it => {
        if (variantName) {
          return !(String(it.id) === String(itemId) && String(it.variantName || '') === String(variantName));
        }
        return String(it.id) !== String(itemId);
      });
    } else if (action === 'inc') {
      const item = menuData.find(i => String(i.id) === String(itemId));
      if (item) {
        if (variantName && Array.isArray(item.variants)) {
          const v = item.variants.find(v => String(v.name) === String(variantName));
          const vp = v ? (typeof v.price === 'number' ? v.price : Number(v.price || 0)) : (typeof item.price === 'number' ? item.price : Number(item.price || 0));
          cartItems.push({ ...item, price: vp, variantPrice: vp, variantName, quantity: 1, localId: Date.now() });
        } else {
          cartItems.push({ ...item, quantity: 1, localId: Date.now() });
        }
      }
    } else if (action === 'dec') {
      const idx = cartItems.findIndex(it => {
        if (variantName) {
          return String(it.id) === String(itemId) && String(it.variantName || '') === String(variantName);
        }
        return String(it.id) === String(itemId);
      });
      if (idx >= 0) cartItems.splice(idx, 1);
    }
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = cartItems.length.toString();
    renderCart();
  });
}

// ضمان عمل زر السلة حتى لو فشل ربط onclick في الـ HTML
const cartButtonEl = document.getElementById('cart-button');
if (cartButtonEl && !cartButtonEl.dataset.bound) {
  cartButtonEl.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  cartButtonEl.dataset.bound = '1';
}

// --- Invoice and submit logic ---
function aggregateCart() {
  const map = new Map();
  cartItems.forEach((it) => {
    const vName = String(it.variantName || '');
    const key = `${String(it.id || it.name)}|${vName}`;
    const unit = typeof it.variantPrice === 'number' ? it.variantPrice : (typeof it.price === 'number' ? it.price : Number(it.price||0));
    const prev = map.get(key) || { id: it.id, name: it.name || '', unitPrice: unit, qty: 0, imageUrl: it.imageUrl || '', variantName: vName };
    prev.qty += 1;
    map.set(key, prev);
  });
  return Array.from(map.values());
}

function generateInvoiceText(params) {
  const { name, phone, address, note } = params;
  const lines = ['فاتورة الطلب', 'الأصناف:'];
  const itemsAgg = aggregateCart();
  let total = 0;
  itemsAgg.forEach((it) => {
    const amount = it.unitPrice * it.qty;
    total += amount;
    const sizeTxt = it.variantName ? ` (${it.variantName})` : '';
    lines.push(`- ${it.name}${sizeTxt} x ${it.qty} — ${Number(amount).toLocaleString('en-US')} د.ع`);
  });
  lines.push(`المجموع: ${Number(total).toLocaleString('en-US')} د.ع`);
  lines.push(`الاسم: ${name || ''}`);
  lines.push(`الرقم: ${phone || ''}`);
  lines.push(`العنوان: ${address || ''}`);
  lines.push(`ملاحظة: ${note && note.trim() ? note.trim() : 'ماكو شي'}`);
  return lines.join('\n');
}

// تطبيع رقم واتساب ليصبح بصيغة دولية صحيحة لـ wa.me
function normalizeWhatsAppNumber(input) {
  try {
    let d = String(input || '').replace(/\D+/g, '');
    // إزالة الصفر بعد كود الدولة لبعض الدول الشائعة إذا وُجد
    if (d.startsWith('9640')) d = '964' + d.slice(4); // العراق
    if (d.startsWith('9660')) d = '966' + d.slice(4); // السعودية
    if (d.startsWith('9710')) d = '971' + d.slice(4); // الإمارات
    if (d.startsWith('9650')) d = '965' + d.slice(4); // الكويت
    // تركيا عادة تُكتب 90 ثم الرقم بدون 0، فلا حاجة لتعديل خاص
    return d;
  } catch {
    return String(input || '');
  }
}

// إرسال مخفي وسريع إلى Google Sheets عبر Webhook/App Script
function sendOrderToSheetsHidden(params) {
  try {
    const url = (siteSettings?.googleSheetsWebhookUrl || '').trim();
    if (!url) return; // غير مفعّل
    const payload = {
      name: params.name || '',
      phone: params.phone || '',
      address: params.address || '',
      total: Number(params.total || 0),
      timestamp: params.timestamp || new Date().toISOString()
    };
    const body = JSON.stringify(payload);
    // استخدم sendBeacon إن توفر لضمان الإرسال حتى عند انتقال الصفحة
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(url, blob);
      return;
    }
    // بديل: fetch بلا انتظار، لا يقاطع تجربة المستخدم
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
      mode: 'no-cors',
      keepalive: true
    }).catch(() => {});

    // احتياطي إضافي: ping عبر GET (صورة) — يتطلب doGet في Apps Script
    setTimeout(() => {
      try {
        const qs = new URLSearchParams({
          name: String(payload.name || ''),
          phone: String(payload.phone || ''),
          address: String(payload.address || ''),
          total: String(Number(payload.total || 0)),
          timestamp: String(payload.timestamp || new Date().toISOString())
        }).toString();
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = `${url}?${qs}`;
      } catch {}
    }, 0);
  } catch {}
}

async function submitOrder() {
  try {
    const payload = {
      name: orderNameEl?.value?.trim() || '',
      phone: orderPhoneEl?.value?.trim() || '',
      address: orderAddressEl?.value?.trim() || '',
      note: orderNoteEl?.value?.trim() || ''
    };

    // تحقق الحقول الإلزامية: الاسم، الرقم، العنوان
    const missing = [];
    if (!payload.name) missing.push({ el: orderNameEl, label: 'الاسم' });
    if (!payload.phone) missing.push({ el: orderPhoneEl, label: 'الرقم' });
    if (!payload.address) missing.push({ el: orderAddressEl, label: 'العنوان' });
    if (missing.length) {
      // إبراز أول حقل ناقص والتركيز عليه
      const first = missing[0];
      try {
        if (first.el) {
          first.el.focus();
          const prevBorder = first.el.style.border;
          first.el.style.border = '2px solid #dc2626'; // red-600
          setTimeout(() => { first.el.style.border = prevBorder || ''; }, 3000);
        }
      } catch {}
      const names = missing.map(m => m.label).join('، ');
      showMessage(`الحقول المطلوبة مفقودة: ${names}`, 'error');
      return; // لا تواصل الإرسال إذا كانت الحقول ناقصة
    }
    // احسب الإجمالي وتاريخ الإرسال لإرسالهما للشيت بشكل مخفي
    const totalAmount = cartItems.reduce((sum, it) => sum + (typeof it.variantPrice === 'number' ? it.variantPrice : (typeof it.price === 'number' ? it.price : Number(it.price || 0))), 0);
    const timestamp = new Date().toISOString();
    // إرسال مخفي فورًا قبل فتح واتساب لضمان عدم إلغاء الطلب عند التنقّل
    sendOrderToSheetsHidden({
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      total: totalAmount,
      timestamp
    });
    const text = generateInvoiceText(payload);
    const waRaw = (siteSettings?.whatsappNumber || '').trim();
    const waDigits = normalizeWhatsAppNumber(waRaw);
    if (waDigits) {
      const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } else {
      await navigator.clipboard.writeText(text);
      showMessage('تم نسخ الفاتورة إلى الحافظة.', 'success');
    }
  } catch (e) {
    console.warn('submitOrder error', e);
    showMessage('تعذر تجهيز الطلب.', 'error');
  }
}


// --- Rendering Functions ---

function renderCategoriesAsCards() {
  const container = document.getElementById('categories-list');
  if (!container) return;
  container.innerHTML = '';

  const list = Array.isArray(categories) ? categories : [];
  if (list.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-700 mt-10 col-span-2">لا توجد فئات لعرضها حاليًا.</p>';
    return;
  }

  list.forEach((cat, index) => {
    const name = cat.name || '';
    const rawSize = cat?.size ?? 'small';

    let classes = 'row-span-1 h-48';
    let colSpan = 'col-span-1';
    if (rawSize === 2 || rawSize === 'large') {
      classes = 'row-span-2 h-full';
      colSpan = 'col-span-1';
    } else if (rawSize === 'wide') {
      classes = 'row-span-1 h-48';
      colSpan = 'col-span-2';
    } else if (rawSize === 'xsmall') {
      classes = 'row-span-1 h-24';
      colSpan = 'col-span-1';
    }

    const bgImage = cat.imageUrl || categoryImages[name] || 'https://placehold.co/600x400/334155/ffffff?text=%20&v=2';
    const card = document.createElement('div');
    card.className = `category-card animated-item scroll-animate ${colSpan} ${classes} bg-slate-800 p-4 rounded-xl flex flex-col justify-end shadow-xl overflow-hidden relative`;
    card.setAttribute('onclick', `showItemsForCategory('${name}')`);
    card.setAttribute('style', `animation-delay: ${index * 0.1}s; background-image: url(${bgImage}); background-size: cover; background-position: center;`);
    card.innerHTML = `
      <div class="absolute inset-0 bg-black opacity-30 rounded-xl"></div>
      <div class="relative z-10 p-2 text-right">
        <h3 class="text-2xl font-black text-blue-300 leading-none" style="color: ${siteSettings?.theme?.categoryTitleColor || '#2563EB'}">${name}</h3>
        <p class="text-sm text-gray-200 mt-1">${(rawSize === 2 || rawSize === 'large') ? 'عرض القائمة الكاملة' : ''}</p>
      </div>
    `;
    container.appendChild(card);
  });
  refreshScrollAnimations();
}

function renderMenuItemsForSpecificCategory(category) {
    menuItemsForCategoryElement.innerHTML = '';
    
    const filteredItems = (Array.isArray(menuData) ? menuData : []).filter(item => item.category === category);

    if (filteredItems.length === 0) {
        menuItemsForCategoryElement.innerHTML = '<p class="text-center text-gray-700 mt-10">لا توجد أصناف في هذا القسم حاليًا.</p>';
        return;
    }

    filteredItems.forEach((item, index) => {
        const animationDelay = index * 0.1; // 100ms delay per item

        // إذا كان العنصر عنوانًا فرعيًا، اعرض فاصلًا بصريًا قبل بقية الأصناف
        if (item && item.type === 'subheading') {
            const dividerColor = siteSettings?.theme?.dividerColor || '#2563EB';
            const titleColor = siteSettings?.theme?.categoryTitleColor || '#2563EB';
            const sepHtml = `
                <div class="animated-item scroll-animate" style="animation-delay: ${animationDelay}s;">
                  <div class="flex items-center gap-3 my-6">
                    <div class="h-px flex-1" style="background: ${dividerColor};"></div>
                    <span class="inline-block px-3 py-1 rounded-full font-bold text-sm" style="color: ${titleColor}; border: 1px solid ${dividerColor};">${item.name}</span>
                    <div class="h-px flex-1" style="background: ${dividerColor};"></div>
                  </div>
                </div>
            `;
            menuItemsForCategoryElement.insertAdjacentHTML('beforeend', sepHtml);
            return;
        }

        const bgColorClass = itemCardColors[index % itemCardColors.length];
        const price = typeof item.price === 'number' ? item.price : Number(item.price || 0);
        const imageSrc = item.imageUrl || 'https://placehold.co/600x400/334155/ffffff?text=Image';

        const itemHtml = `
            <div 
                class="menu-item-card ${bgColorClass} rounded-xl shadow-xl shadow-gray-400 overflow-hidden animated-item scroll-animate" 
                data-id="${item.id}"
                style="animation-delay: ${animationDelay}s; background-color: ${siteSettings?.theme?.itemCardBgColor || '#374151'};"
                onclick="openItemModal(${item.id})"
            >
                <img src="${imageSrc}" alt="${item.name}" class="w-full h-56 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/334155/ffffff?text=Image+Error';">
                <div class="p-4">
                    <h3 class="text-xl font-bold text-white" style="color: ${siteSettings?.theme?.itemNameColor || '#ffffff'}">${item.name}</h3>
                    <p class="text-sm text-gray-300 mt-1" style="color: ${siteSettings?.theme?.itemDescriptionColor || '#D1D5DB'}">${item.description || ''}</p>
                    <div class="flex justify-between items-center mt-3">
            <span class="text-2xl font-extrabold text-blue-300" style="color: ${siteSettings?.theme?.itemPriceColor || '#93C5FD'}">${price.toFixed(2)} د.ع</span>
                        <button 
                            class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center transition duration-200 shadow-md"
                            data-item-id="${item.id}"
                            onclick="event.stopPropagation(); addItemToCart(${item.id});" 
                            style="background-color: ${siteSettings?.theme?.addToCartBgColor || '#2563EB'}"
                        >
                            <i class="ph ph-plus text-white text-2xl font-black"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        menuItemsForCategoryElement.insertAdjacentHTML('beforeend', itemHtml);
    });
    refreshScrollAnimations();
}

// عرض الأصناف مع دعم أحجام/متغيرات بأسعارها وأزرار إضافة
function renderMenuItemsForSpecificCategoryWithVariants(category) {
    menuItemsForCategoryElement.innerHTML = '';
    const filteredItems = (Array.isArray(menuData) ? menuData : []).filter(item => item.category === category);
    if (filteredItems.length === 0) {
        menuItemsForCategoryElement.innerHTML = '<p class="text-center text-gray-700 mt-10">لا توجد أصناف في هذا القسم حاليًا.</p>';
        return;
    }

    filteredItems.forEach((item, index) => {
        const animationDelay = index * 0.1;
        if (item && item.type === 'subheading') {
            const dividerColor = siteSettings?.theme?.dividerColor || '#2563EB';
            const titleColor = siteSettings?.theme?.categoryTitleColor || '#2563EB';
            const sepHtml = `
                <div class="animated-item scroll-animate" style="animation-delay: ${animationDelay}s;">
                  <div class="flex items-center gap-3 my-6">
                    <div class="h-px flex-1" style="background: ${dividerColor};"></div>
                    <span class="inline-block px-3 py-1 rounded-full font-bold text-sm" style="color: ${titleColor}; border: 1px solid ${dividerColor};">${item.name}</span>
                    <div class="h-px flex-1" style="background: ${dividerColor};"></div>
                  </div>
                </div>
            `;
            menuItemsForCategoryElement.insertAdjacentHTML('beforeend', sepHtml);
            return;
        }

        const bgColorClass = itemCardColors[index % itemCardColors.length];
        const basePrice = typeof item.price === 'number' ? item.price : Number(item.price || 0);
        const imageSrc = item.imageUrl || 'https://placehold.co/600x400/334155/ffffff?text=Image';
        const variants = Array.isArray(item.variants) ? item.variants.filter(v => v && v.name) : [];
        const hasVariants = variants.length > 0;

        const variantsHtml = hasVariants ? `
          <div class="mt-3 space-y-2">
            ${variants.map(v => {
              const vp = typeof v.price === 'number' ? v.price : Number(v.price||0);
              const vName = String(v.name).replace(/\"/g, '&quot;').replace(/'/g, "\\'");
              return `
                <div class="flex items-center justify-between bg-white rounded-lg p-2">
                  <span class="font-extrabold text-black">${vName}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-blue-600 font-bold">${Number(vp).toLocaleString('en-US')} د.ع</span>
                    <button 
                      class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center transition duration-200 shadow-md"
                      onclick="event.stopPropagation(); addVariantToCart(${item.id}, '${vName}', ${Number(vp)}, this);"
                      title="إضافة ${vName}"
                      style="background-color: ${siteSettings?.theme?.addToCartBgColor || '#2563EB'}"
                    >
                      <i class="ph ph-plus text-white text-base font-black"></i>
                    </button>
                  </div>
                </div>`;
            }).join('')}
          </div>
        ` : '';

        const addButtonHtml = hasVariants ? '' : `
          <button 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center transition duration-200 shadow-md"
            data-item-id="${item.id}"
            onclick="event.stopPropagation(); addItemToCart(${item.id});" 
            style="background-color: ${siteSettings?.theme?.addToCartBgColor || '#2563EB'}"
          >
            <i class="ph ph-plus text-white text-2xl font-black"></i>
          </button>
        `;

        const priceRowHtml = hasVariants ? '' : `
          <div class="flex justify-between items-center mt-3">
            <span class="text-2xl font-extrabold text-blue-300" style="color: ${siteSettings?.theme?.itemPriceColor || '#93C5FD'}">${Number(basePrice).toLocaleString('en-US')} د.ع</span>
            ${addButtonHtml}
          </div>
        `;

        const itemHtml = `
            <div 
                class="menu-item-card ${bgColorClass} rounded-xl shadow-xl shadow-gray-400 overflow-hidden animated-item scroll-animate" 
                data-id="${item.id}"
                style="animation-delay: ${animationDelay}s; background-color: ${siteSettings?.theme?.itemCardBgColor || '#374151'};"
                onclick="openItemModal(${item.id})"
            >
                <img src="${imageSrc}" alt="${item.name}" class="w-full h-56 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/334155/ffffff?text=Image+Error';">
                <div class="p-4">
                    <h3 class="text-xl font-bold text-white" style="color: ${siteSettings?.theme?.itemNameColor || '#ffffff'}">${item.name}</h3>
                    <p class="text-sm text-gray-300 mt-1" style="color: ${siteSettings?.theme?.itemDescriptionColor || '#D1D5DB'}">${item.description || ''}</p>
                    ${priceRowHtml}
                    ${variantsHtml}
                </div>
            </div>
        `;
        menuItemsForCategoryElement.insertAdjacentHTML('beforeend', itemHtml);
    });
    refreshScrollAnimations();
}

// --- View Switching Logic ---

window.showCategories = () => {
    categoriesListElement.classList.remove('hidden');
    menuItemsForCategoryElement.classList.add('hidden');
    backButtonElement.classList.add('hidden');
    mainTitleElement.textContent = 'الفئات';
    // Title for categories is always right-aligned and is now structurally on the right
    mainTitleElement.classList.remove('text-left');
    mainTitleElement.classList.add('text-right');
    renderCategoriesAsCards();
    try { refreshScrollAnimations && refreshScrollAnimations(); } catch {}
}

window.showItemsForCategory = (category) => {
    categoriesListElement.classList.add('hidden');
    menuItemsForCategoryElement.classList.remove('hidden');
    backButtonElement.classList.remove('hidden');
    mainTitleElement.textContent = category;
    // تثبيت محاذاة العنوان لليمين كما طلب المستخدم
    mainTitleElement.classList.remove('text-left');
    mainTitleElement.classList.add('text-right');
    renderMenuItemsForSpecificCategoryWithVariants(category);
    try { refreshScrollAnimations && refreshScrollAnimations(); } catch {}
}

// --- Event Handlers/Logic ---

window.addItemToCart = (itemId) => {
    const item = menuData.find(i => i.id === parseInt(itemId) || i.id === itemId);
    if (!item) return;

    cartItems.push({ ...item, quantity: 1, localId: Date.now() });
    const countEl = document.getElementById('cart-count');
    if (countEl) { 
        countEl.textContent = cartItems.length.toString();
        countEl.style.opacity = '1';
    }

    // غيّر زر + إلى علامة صح على بطاقة الايتم
    const cardBtn = document.querySelector(`.menu-item-card button[data-item-id="${itemId}"]`);
    if (cardBtn) {
        cardBtn.innerHTML = '<i class="ph ph-check text-2xl font-black"></i>';
        // أعِدّه إلى + بعد مهلة قصيرة
        if (cardBtn.dataset.revertTimerId) {
            try { clearTimeout(Number(cardBtn.dataset.revertTimerId)); } catch {}
        }
        const tId = setTimeout(() => {
            cardBtn.innerHTML = '<i class="ph ph-plus text-white text-2xl font-black"></i>';
            delete cardBtn.dataset.revertTimerId;
        }, 1200);
        cardBtn.dataset.revertTimerId = String(tId);
    }
  // إذا كانت نافذة التفاصيل مفتوحة لنفس الصنف، حدّث زرها أيضًا
  const modalBtn = document.getElementById('modal-add-to-cart');
  if (modalBtn && modalBtn.dataset.itemId && String(modalBtn.dataset.itemId) === String(itemId)) {
      modalBtn.innerHTML = '<i class="ph ph-check text-2xl font-black"></i>';
      // أعِدّه إلى + بعد مهلة قصيرة
      if (modalBtn.dataset.revertTimerId) {
          try { clearTimeout(Number(modalBtn.dataset.revertTimerId)); } catch {}
      }
      const mtId = setTimeout(() => {
          modalBtn.innerHTML = '<i class="ph ph-plus text-white text-2xl font-black"></i>';
          delete modalBtn.dataset.revertTimerId;
      }, 1200);
      modalBtn.dataset.revertTimerId = String(mtId);
  }

    // تم إلغاء رسالة الإشعار عند الإضافة بناءً على رغبة المستخدم
}

// إضافة صنف بحجم محدد إلى السلة
window.addVariantToCart = (itemId, variantName, variantPrice, btnEl) => {
  const item = menuData.find(i => i.id === parseInt(itemId) || i.id === itemId);
  if (!item) return;
  const vp = typeof variantPrice === 'number' ? variantPrice : Number(variantPrice || 0);
  cartItems.push({ ...item, price: vp, variantPrice: vp, variantName, quantity: 1, localId: Date.now() });
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = cartItems.length.toString();
    countEl.style.opacity = '1';
  }
  // تحديت السلة مباشرة
  renderCart();

  // قلب زر الإضافة إلى علامة صح ثم الرجوع إلى + أبيض
  if (btnEl) {
    btnEl.innerHTML = '<i class="ph ph-check text-base font-black"></i>';
    if (btnEl.dataset.revertTimerId) {
      try { clearTimeout(Number(btnEl.dataset.revertTimerId)); } catch {}
    }
    const tId = setTimeout(() => {
      btnEl.innerHTML = '<i class="ph ph-plus text-white text-base font-black"></i>';
      delete btnEl.dataset.revertTimerId;
    }, 1200);
    btnEl.dataset.revertTimerId = String(tId);
  }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadAssets();
  showCategories();
  await initHeroSection();
  await initAnnouncementsOnIndex();
  await initTheme();
  initLocationButton();
  initScrollAnimations();
});


// عناصر الهيرو في الصفحة الرئيسية
const heroContainer = document.querySelector('.hero-container');
const heroImageEl = document.querySelector('.hero-image');
const heroTitleEl = document.querySelector('.hero-title');
const heroSubtitleEl = document.querySelector('.hero-subtitle');
const heroTextEl = document.getElementById('hero-text');
const heroActionsEl = document.getElementById('hero-actions');
let heroConfig = { 
  enabled: true, 
  title: 'قائمة الطعام الرقمية', 
  subtitle: 'اطلب الآن واستمتع بمذاق لا يُنسى.', 
  autoplay: true, 
  intervalMs: 4000, 
  images: [], 
  textEnabled: false, 
  textContent: '',
  // أزرار الهيرو: قابلة للتفعيل والتغيير من لوحة التحكم
  buttons: [
    { enabled: true, iconUrl: 'info.png', href: '' },
    { enabled: true, iconUrl: 'instagram.png', href: '' }
  ]
};
let heroTimer = null;
let heroIndex = 0;

async function loadHeroData() {
  try {
    const resp = await fetch('assets/hero.json', { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      if (data && typeof data === 'object') {
        const merged = { ...heroConfig, ...data };
        if (merged.intervalMs && merged.intervalMs < 50) merged.intervalMs = merged.intervalMs * 1000;
        return merged;
      }
    }
  } catch (e) {
    console.warn('تعذر تحميل hero.json', e);
  }
  return { ...heroConfig };
}

function applyHeroToIndex(cfg) {
  if (!heroContainer) return;
  const imgs = Array.isArray(cfg.images) ? cfg.images.filter(Boolean) : [];
  if (!cfg.enabled) {
    heroContainer.classList.add('hidden');
    stopHeroAutoplay();
    return;
  }
  heroContainer.classList.remove('hidden');
  const firstImg = imgs[0] || 'https://placehold.co/800x250/1E293B/E2E8F0?text=Hero';
  if (heroImageEl) {
    heroImageEl.src = firstImg;
  }
  if (heroTextEl) {
    const showText = !!cfg.textEnabled && (cfg.textContent || '').trim().length > 0;
    heroTextEl.textContent = showText ? cfg.textContent : '';
    heroTextEl.classList.toggle('hidden', !showText);
  }
  // عرض أزرار الهيرو إن وُجدت
  if (heroActionsEl) {
    heroActionsEl.innerHTML = '';
    const btns = Array.isArray(cfg.buttons) ? cfg.buttons : [];
    btns.filter(b => b && b.enabled).forEach((b, idx) => {
      const icon = (b.iconUrl || '').trim() || (idx === 0 ? 'info.png' : 'instagram.png');
      const href = (b.href || '').trim();
      // الزر الأول يفتح "من نحن" كمودال مهما كان href
      const el = document.createElement(idx === 0 ? 'button' : (href ? 'a' : 'button'));
      if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener'; }
      el.className = 'hero-action-btn';
      el.innerHTML = `<img src="${icon}" alt="action ${idx+1}" onerror="this.onerror=null;this.src='https://placehold.co/24x24/ffffff/000?text=+'">`;
      heroActionsEl.appendChild(el);

      if (idx === 0) {
        el.title = 'من نحن';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openAboutModal();
        });
      }
    });
  }
}

function startHeroAutoplay() {
  const imgs = Array.isArray(heroConfig.images) ? heroConfig.images.filter(Boolean) : [];
  stopHeroAutoplay();
  if (!heroConfig.autoplay || imgs.length <= 1 || !heroImageEl) return;
  heroIndex = 0;
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % imgs.length;
    heroImageEl.src = imgs[heroIndex] || heroImageEl.src;
  }, Math.max(1000, Number(heroConfig.intervalMs || 4000)));
}

function stopHeroAutoplay() {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = null;
  }
}

async function initHeroSection() {
  heroConfig = await loadHeroData();
  applyHeroToIndex(heroConfig);
  startHeroAutoplay();
}

// إعلان نصي تحت الهيرو
const textAdEl = document.getElementById('text-ad');
const textAdContentEl = document.getElementById('text-ad-content');
let annConfig = { textEnabled: false, textContent: '' };

async function loadAnnouncements() {
  try {
    const resp = await fetch('assets/announcements.json', { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      return { ...annConfig, ...(data || {}) };
    }
  } catch (e) {
    console.warn('تعذر تحميل announcements.json', e);
  }
  return { ...annConfig };
}

function applyTextAd(cfg) {
  if (!textAdEl || !textAdContentEl) return;
  if (cfg.textEnabled && cfg.textContent) {
    textAdContentEl.textContent = cfg.textContent;
    textAdEl.classList.remove('hidden');
  } else {
    textAdEl.classList.add('hidden');
  }
}

async function initAnnouncementsOnIndex() {
  const cfg = await loadAnnouncements();
  applyTextAd(cfg);
}

// إعدادات الموقع والثيم
let siteSettings = {
  theme: {
    textColor: '#111827',
    bgColor: '#ffffff',
    dividerColor: '#2563EB',
    backButtonColor: '#374151',
    navBgColor: '#0f172a',
    navBorderColor: '#1e3a8a',
    navItemColor: '#ffffff',
    textAdBgColor: '#0b2545',
    textAdTextColor: '#ffffff',
    textAdBorderColor: '#1e40af',
    itemNameColor: '#ffffff',
    categoryTitleColor: '#2563EB',
    itemCardBgColor: '#374151',
    itemDescriptionColor: '#D1D5DB',
    itemPriceColor: '#93C5FD',
    addToCartBgColor: '#b81e0e'
  }
};

async function loadSiteSettings() {
  try {
    const resp = await fetch('assets/settings.json', { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      return { ...siteSettings, ...(data || {}) };
    }
  } catch {}
  return { ...siteSettings };
}

function applyTheme(theme) {
  try {
    const t = { ...siteSettings.theme, ...(theme || {}) };
    // خلفية عامة ولون خط عام
    document.body.style.backgroundColor = t.bgColor;
    document.body.style.color = t.textColor;

    // العنوان والفاصل تحت "الفئات"
    if (mainTitleElement) {
      mainTitleElement.style.color = t.textColor;
      mainTitleElement.style.borderColor = t.dividerColor;
    }

    // زر الرجوع
    if (backButtonElement) {
      backButtonElement.style.color = t.backButtonColor;
    }

    // شريط التنقل السفلي
    const navEl = document.querySelector('nav.nav-bar');
    if (navEl) {
      navEl.style.backgroundColor = t.navBgColor;
      navEl.style.borderTopColor = t.navBorderColor;
      navEl.querySelectorAll('button, i, span').forEach(el => {
        el.style.color = t.navItemColor;
      });
    }

    // إعلان نصي
    const textAdBox = document.querySelector('#text-ad > div');
    if (textAdBox) {
      textAdBox.style.background = t.textAdBgColor;
      textAdBox.style.borderColor = t.textAdBorderColor;
    }
    if (textAdContentEl) textAdContentEl.style.color = t.textAdTextColor;
    const textAdIcon = document.querySelector('#text-ad i');
    if (textAdIcon) textAdIcon.style.color = t.textAdTextColor;

    // ألوان أسماء الأصناف وعناوين الفئات
    document.querySelectorAll('.menu-item-card h3').forEach(el => { el.style.color = t.itemNameColor; });
    document.querySelectorAll('.category-card h3').forEach(el => { el.style.color = t.categoryTitleColor; });

    // ألوان بطاقة الايتم والوصف والسعر وزر الإضافة للسلة
    document.querySelectorAll('.menu-item-card').forEach(el => { el.style.backgroundColor = t.itemCardBgColor; });
    document.querySelectorAll('.menu-item-card p.text-sm').forEach(el => { el.style.color = t.itemDescriptionColor; });
    document.querySelectorAll('.menu-item-card span.text-2xl').forEach(el => { el.style.color = t.itemPriceColor; });
    document.querySelectorAll('.menu-item-card button[data-item-id]').forEach(el => { el.style.backgroundColor = t.addToCartBgColor; });

    // عناصر المودال: الخلفية والألوان
    if (itemModal) itemModal.style.backgroundColor = t.itemCardBgColor;
    const modalNameEl = document.getElementById('modal-item-name');
    const modalDescEl = document.getElementById('modal-item-description');
    const modalPriceEl = document.getElementById('modal-item-price');
    const modalAddBtn = document.getElementById('modal-add-to-cart');
    if (modalNameEl) modalNameEl.style.color = t.itemNameColor;
    if (modalDescEl) modalDescEl.style.color = t.itemDescriptionColor;
    if (modalPriceEl) modalPriceEl.style.color = t.itemPriceColor;
    if (modalAddBtn) modalAddBtn.style.backgroundColor = t.addToCartBgColor;
  } catch (e) {
    console.warn('تعذر تطبيق الثيم', e);
  }
}

async function initTheme() {
  siteSettings = await loadSiteSettings();
  // Determine current branch key from page context or URL
  try {
    const hintedKey = typeof window.__BRANCH_KEY === 'string' ? window.__BRANCH_KEY.trim() : '';
    const urlKey = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '').trim();
    const branchKey = hintedKey || urlKey;
    const branches = siteSettings?.branches || {};
    const b = branches[branchKey] || null;
    if (b && typeof b === 'object') {
      // Overlay per-branch fields if available
      if (b.locationName) siteSettings.locationName = b.locationName;
      if (b.whatsappNumber) siteSettings.whatsappNumber = b.whatsappNumber;
      if (b.contactNumber) siteSettings.contactNumber = b.contactNumber;
      if (b.mapLink) siteSettings.mapLink = b.mapLink;
    }
    // Optional: allow page hint for display name if branch settings didn't define it
    const bn = window.__BRANCH_NAME;
    if (!siteSettings.locationName && bn && typeof bn === 'string' && bn.trim()) {
      const name = bn.trim();
      siteSettings.locationName = name.startsWith('فرع') ? name : `فرع ${name}`;
    }
  } catch {}
  applyTheme(siteSettings.theme);
}

// زر الموقع: يربط إلى رابط الخريطة من الإعدادات إن وُجد
function initLocationButton() {
  try {
    const el = document.getElementById('nav-location-button');
    if (!el) return;
    const link = (siteSettings?.mapLink || '').trim();
    // إزالة أي مستمع سابق لمنع التكرار
    el.replaceWith(el.cloneNode(true));
    const fresh = document.getElementById('nav-location-button');
    if (!fresh) return;
    if (link) {
      fresh.setAttribute('href', link);
      fresh.setAttribute('target', '_blank');
      fresh.setAttribute('rel', 'noopener');
      fresh.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      fresh.setAttribute('href', '#');
      fresh.removeAttribute('target');
      fresh.classList.add('opacity-50', 'cursor-not-allowed');
      fresh.addEventListener('click', function(e) {
        e.preventDefault();
        showMessage('لم يتم ضبط رابط الموقع في الإعدادات.', 'error');
      });
    }
  } catch (e) {
    console.warn('initLocationButton error', e);
  }
}


// Scroll animations: IntersectionObserver to toggle in-view class
let scrollObserver = null;
function initScrollAnimations() {
  if (scrollObserver) return;
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('in-view');
      } else {
        el.classList.remove('in-view');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.scroll-animate').forEach(el => scrollObserver.observe(el));
}
function refreshScrollAnimations() {
  if (!scrollObserver) {
    initScrollAnimations();
    return;
  }
  document.querySelectorAll('.scroll-animate').forEach(el => scrollObserver.observe(el));
}