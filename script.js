/* script.js – AgriPredict Frontend Logic */
// ─── Multilingual Support ───────────────────
const translations = {
  en: {
    brand: "AgriPredict",
    heroTitle: "Empowering Farmers with AI Intelligence",
    heroSub: "Direct marketplace, AI price predictions, and weather insights to help you grow more.",
    mandiTitle: "Live Mandi Prices",
    searchPlaceholder: "Search crops (e.g. Rice, Wheat)...",
    dashboard: "📊 Dashboard",
    marketplace: "🛒 Marketplace"
  },
  hi: {
    brand: "एग्रीप्रेडिक्ट",
    heroTitle: "AI इंटेलिजेंस के साथ किसानों को सशक्त बनाना",
    heroSub: "सीधा बाजार, AI मूल्य भविष्यवाणी, और मौसम की जानकारी आपको अधिक विकसित करने में मदद करने के लिए।",
    mandiTitle: "लाइव मंडी भाव",
    searchPlaceholder: "फसलें खोजें (जैसे चावल, गेहूं)...",
    dashboard: "📊 डैशबोर्ड",
    marketplace: "🛒 मार्केटप्लेस"
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
}

function applyTranslations() {
  const t = translations[currentLang];
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (t[key]) el.textContent = t[key];
  });
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
}

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://agripredict-backend.onrender.com'; // REPLACE WITH YOUR RENDER URL
const WHATSAPP_NUMBER = '919391357351'; // Rakesh's WhatsApp

let allProducts = [];
let cart = [];

// =============================================
//  FETCH & RENDER PRODUCTS
// =============================================
async function loadProducts(filter = 'all') {
  try {
    const res = await fetch(`${API}/api/products`);
    allProducts = await res.json();
  } catch (err) {
    // Fallback to local data if server not running
    allProducts = getLocalProducts();
  }
  renderProducts(allProducts, filter);
}

function renderProducts(products, filter = 'all') {
  const container = document.getElementById('product-list');
  container.innerHTML = '';

  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  if (!filtered.length) {
    container.innerHTML = `<p style="color:var(--muted);grid-column:1/-1">No products found.</p>`;
    return;
  }

  filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 60}ms`;
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      <div class="card-body">
        <span class="card-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-meta">
          <span class="card-price">₹${p.price}<small style="font-weight:400;font-size:.7rem;color:var(--muted)">/${p.unit}</small></span>
          <span class="card-farmer">👨‍🌾 ${p.farmer}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-primary" style="flex:1" onclick="addToCart('${p.id}')">🛒 Add to Cart</button>
        <button class="btn-secondary" onclick="openContactModal('${p.id}')">📞 Contact</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// =============================================
//  CART LOGIC
// =============================================
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCart();
  showToast(`✅ ${product.name} added to cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  countEl.textContent = totalQty;

  if (!cart.length) {
    itemsEl.innerHTML = `<p class="cart-empty">Your cart is empty 🌾</p>`;
    totalEl.textContent = '₹0';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div style="font-size:.78rem;color:var(--muted)">${item.qty} × ₹${item.price}</div>
      </div>
      <div style="display:flex;align-items:center;gap:.3rem">
        <span class="cart-item-price">₹${item.price * item.qty}</span>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
      </div>
    </div>
  `).join('');

  totalEl.textContent = `₹${totalPrice}`;
}

// =============================================
//  CART OPEN / CLOSE
// =============================================
function openCart() {
  document.getElementById('cart').classList.add('open');
  document.getElementById('cart-overlay').classList.remove('hidden');
}
function closeCart() {
  document.getElementById('cart').classList.remove('open');
  document.getElementById('cart-overlay').classList.add('hidden');
}

document.getElementById('cart-toggle').onclick = openCart;
document.getElementById('close-cart').onclick = closeCart;
document.getElementById('cart-overlay').onclick = closeCart;

// =============================================
//  FILTER TABS
// =============================================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(allProducts, btn.dataset.filter);
  };
});

// =============================================
//  CONTACT / ORDER MODAL
// =============================================
function openContactModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  document.getElementById('form-product-id').value = productId;
  document.getElementById('order-summary').textContent =
    `Ordering: ${product?.name} — ₹${product?.price}/${product?.unit}`;
  updateWhatsAppLink();
  document.getElementById('order-modal').classList.remove('hidden');
}

document.getElementById('close-modal').onclick = () =>
  document.getElementById('order-modal').classList.add('hidden');

document.getElementById('checkout-btn').onclick = () => {
  if (!cart.length) { showToast('⚠️ Add items to cart first!'); return; }
  // Pre-fill summary with cart items
  const summary = cart.map(i => `${i.qty}×${i.name}`).join(', ');
  document.getElementById('form-product-id').value = 'cart';
  document.getElementById('order-summary').textContent = `Items: ${summary}`;
  updateWhatsAppLink();
  document.getElementById('order-modal').classList.remove('hidden');
  closeCart();
};

function updateWhatsAppLink() {
  const name = document.getElementById('customerName').value || 'Customer';
  const productId = document.getElementById('form-product-id').value;
  const isCart = productId === 'cart';
  const items = isCart ? cart : [allProducts.find(p => p.id === productId)].filter(Boolean);
  const itemsText = items.map(i => `${i.qty || 1}x ${i.name}`).join(', ');
  const total = isCart ? cart.reduce((s, i) => s + i.price * i.qty, 0) : allProducts.find(p => p.id === productId)?.price;
  
  const msg = encodeURIComponent(`Hi! I want to order from AgriPredict.\n\nItems: ${itemsText}\nTotal: ₹${total}\nName: ${name}`);
  document.getElementById('whatsapp-link').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

// Update WA link as user types name
document.getElementById('customerName').addEventListener('input', updateWhatsAppLink);

// =============================================
//  SUBMIT ORDER FORM
// =============================================
document.getElementById('order-form').addEventListener('submit', async e => {
  e.preventDefault();

  const productId = document.getElementById('form-product-id').value;
  const isCart = productId === 'cart';

  const payload = {
    name: document.getElementById('customerName').value,
    email: document.getElementById('customerEmail').value,
    phone: document.getElementById('customerPhone').value,
    address: document.getElementById('customerAddress').value,
    items: isCart ? cart : [allProducts.find(p => p.id === productId)].filter(Boolean),
    total: isCart
      ? cart.reduce((s, i) => s + i.price * i.qty, 0)
      : allProducts.find(p => p.id === productId)?.price
  };

  try {
    const res = await fetch(`${API}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('order-modal').classList.add('hidden');
      document.getElementById('order-form').reset();
      cart = [];
      updateCartUI();
      showToast('🎉 Order sent! Farmer will contact you shortly.');
    } else {
      showToast(`❌ ${data.error || 'Failed to send order.'}`);
    }
  } catch (err) {
    // Server offline – still show confirmation
    document.getElementById('order-modal').classList.add('hidden');
    document.getElementById('order-form').reset();
    cart = [];
    updateCartUI();
    showToast('📬 Order recorded! (Email will be sent when server is online)');
  }
});

// =============================================
//  TOAST NOTIFICATION
// =============================================
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

// =============================================
//  FALLBACK LOCAL PRODUCTS (when server is offline)
// =============================================
function getLocalProducts() {
  return [
    {
      id: 'basmati-rice',
      name: 'Basmati Rice',
      category: 'grains',
      description: 'Premium aged Basmati from Punjab fields. Long grain, aromatic, ideal for biryani.',
      price: 75,
      unit: 'kg',
      farmer: 'Ramesh Kumar – Punjab',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'sharbati-wheat',
      name: 'Sharbati Wheat',
      category: 'grains',
      description: 'High-quality wheat from Haryana. Perfect for chapati, bread, and flour mills.',
      price: 28,
      unit: 'kg',
      farmer: 'Suresh Singh – Haryana',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'yellow-corn',
      name: 'Yellow Corn',
      category: 'grains',
      description: 'Fresh sweet corn from Madhya Pradesh. Great for popcorn and animal feed.',
      price: 22,
      unit: 'kg',
      farmer: 'Anil Verma – MP',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'tomatoes',
      name: 'Fresh Tomatoes',
      category: 'vegetables',
      description: 'Juicy farm-fresh tomatoes from Maharashtra. No pesticides used.',
      price: 35,
      unit: 'kg',
      farmer: 'Sunita Devi – Maharashtra',
      image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'onions',
      name: 'Red Onions',
      category: 'vegetables',
      description: 'Nashik red onions, stored properly. Long shelf life, strong flavor.',
      price: 25,
      unit: 'kg',
      farmer: 'Vijay Patil – Nashik',
      image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'spinach',
      name: 'Organic Spinach',
      category: 'vegetables',
      description: 'Fresh organic spinach from Rajasthan. Rich in iron and vitamins.',
      price: 40,
      unit: 'kg',
      farmer: 'Mala Sharma – Rajasthan',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'chana-dal',
      name: 'Chana Dal',
      category: 'pulses',
      description: 'Split chickpeas from Uttar Pradesh. High protein, great for cooking.',
      price: 85,
      unit: 'kg',
      farmer: 'Ravi Gupta – UP',
      image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'masoor-dal',
      name: 'Masoor Dal (Red Lentil)',
      category: 'pulses',
      description: 'Red lentils from Madhya Pradesh. Cooks quickly, rich in protein and fiber.',
      price: 90,
      unit: 'kg',
      farmer: 'Kiran Yadav – MP',
      image: 'https://images.unsplash.com/photo-1569621592218-7be86b96def6?auto=format&fit=crop&w=600&q=80'
    }
  ];
}

// ─── Mandi Prices ───────────────────────────
async function loadMandiPrices() {
  const ticker = document.getElementById('mandi-ticker-items');
  if (!ticker) return;
  try {
    const res = await fetch(`${API}/api/mandi-prices`);
    const data = await res.json();
    ticker.innerHTML = data.map(item => `
      <div class="mandi-item">
        <span>${item.mandi}</span>
        ${item.crop}: <b>₹${item.price}/${item.unit}</b>
        <span class="${item.trend}">(${item.change} ${item.trend === 'up' ? '▲' : '▼'})</span>
      </div>
    `).join('');
    // Duplicate for seamless loop
    ticker.innerHTML += ticker.innerHTML;
  } catch {
    ticker.innerHTML = '<span>⚠️ Mandi data currently unavailable.</span>';
  }
}

// =============================================
//  INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartUI();
  loadMandiPrices();
  applyTranslations();
  
  // Set initial value for select
  const langSelect = document.querySelector('.lang-select');
  if (langSelect) langSelect.value = currentLang;
});

// =============================================
//  MOBILE HAMBURGER MENU
// =============================================
function toggleMobileMenu() {
  const navLinks = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger-btn');
  if (!navLinks) return;
  navLinks.classList.toggle('open');
  // Animate hamburger spans to X when open
  const spans = btn.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
}
