// help.js – Farmer Help Center Logic

// ── Section Navigation ─────────────────────────
function showSection(id, btn) {
  document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.help-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── Government Schemes Data ────────────────────
const SCHEMES = [
  { icon: '💰', name: 'PM-KISAN', full: 'PM Kisan Samman Nidhi', benefit: '₹6,000/year direct to bank', who: 'All small & marginal farmers', how: 'Register at pmkisan.gov.in or nearest CSC center', color: '#10b981' },
  { icon: '🛡️', name: 'Fasal Bima', full: 'Pradhan Mantri Fasal Bima Yojana', benefit: 'Crop insurance at just 2% premium', who: 'All farmers growing notified crops', how: 'Apply through bank or insurance company before sowing', color: '#3b82f6' },
  { icon: '💳', name: 'Kisan Credit Card', full: 'Kisan Credit Card (KCC)', benefit: 'Loan up to ₹3 lakh at 4% interest', who: 'Farmers, fishermen, animal husbandry', how: 'Apply at nearest bank with land documents', color: '#8b5cf6' },
  { icon: '🚜', name: 'PM-KUSUM', full: 'PM Kisan Urja Suraksha Utthan Mahabhiyan', benefit: 'Solar pump at 90% subsidy', who: 'Farmers without grid power', how: 'Apply through state agriculture dept.', color: '#f59e0b' },
  { icon: '🌾', name: 'MSP', full: 'Minimum Support Price', benefit: 'Guaranteed price for your crop', who: 'All farmers growing MSP crops', how: 'Sell at government procurement centers (APMC)', color: '#ef4444' },
  { icon: '🏗️', name: 'PMAY-G', full: 'PM Awas Yojana (Gramin)', benefit: '₹1.2–1.3 lakh for house construction', who: 'Homeless rural families', how: 'Apply through Gram Panchayat', color: '#06b6d4' },
  { icon: '🌊', name: 'PMKSY', full: 'PM Krishi Sinchayee Yojana', benefit: 'Drip/sprinkler irrigation at 55–90% subsidy', who: 'All farmers', how: 'Contact district horticulture office', color: '#84cc16' },
  { icon: '📚', name: 'e-NAM', full: 'National Agriculture Market', benefit: 'Sell crop online at best price across India', who: 'All registered farmers', how: 'Register at enam.gov.in', color: '#f97316' },
];

function renderSchemes() {
  const g = document.getElementById('scheme-grid');
  if (!g) return;
  g.innerHTML = SCHEMES.map(s => `
    <div class="scheme-card glass">
      <div class="scheme-icon" style="background:${s.color}20;border:1px solid ${s.color}40">${s.icon}</div>
      <div class="scheme-body">
        <div class="scheme-tag" style="color:${s.color}">${s.name}</div>
        <h3>${s.full}</h3>
        <p class="scheme-benefit">✅ ${s.benefit}</p>
        <p class="scheme-who">👥 ${s.who}</p>
        <details>
          <summary>How to Apply →</summary>
          <p class="scheme-how">📋 ${s.how}</p>
        </details>
      </div>
    </div>`).join('');
}

// ── Crop Disease Data ──────────────────────────
const SYMPTOMS = ['Yellow leaves', 'Brown spots', 'White powder', 'Wilting', 'Root rot', 'Black spots', 'Curling leaves', 'Stunted growth', 'Holes in leaves', 'Sticky residue'];

const DISEASES = {
  rice: {
    'Yellow leaves,Stunted growth': { name: 'Rice Yellow Dwarf', severity: 'High', cause: 'Leafhopper insect vector', treatment: 'Use imidacloprid spray. Remove infected plants. Use resistant varieties.', prevention: 'Treat seeds before sowing. Control leafhopper population.' },
    'Brown spots': { name: 'Brown Spot Disease', severity: 'Medium', cause: 'Helminthosporium oryzae fungus', treatment: 'Spray Mancozeb (2.5g/L water). Avoid excess nitrogen.', prevention: 'Use certified seeds. Balanced fertilizer use.' },
    'White powder': { name: 'Rice Blast', severity: 'High', cause: 'Magnaporthe oryzae fungus', treatment: 'Spray Tricyclazole (0.6g/L). Drain water from field.', prevention: 'Resistant varieties. Avoid heavy nitrogen.' },
  },
  wheat: {
    'Yellow leaves': { name: 'Yellow Rust', severity: 'High', cause: 'Puccinia striiformis fungus', treatment: 'Spray Propiconazole (1ml/L). Apply at first sign.', prevention: 'Use resistant varieties. Early sowing.' },
    'Brown spots,White powder': { name: 'Powdery Mildew', severity: 'Medium', cause: 'Blumeria graminis fungus', treatment: 'Spray Sulfur 80% WP (3g/L) or Triadimefon.', prevention: 'Avoid dense sowing. Good air circulation.' },
  },
  tomato: {
    'Yellow leaves,Curling leaves': { name: 'Tomato Yellow Leaf Curl Virus', severity: 'High', cause: 'Whitefly transmitted virus', treatment: 'Remove infected plants immediately. Spray neem oil. Control whiteflies.', prevention: 'Silver mulch. Yellow sticky traps. Resistant varieties.' },
    'Brown spots,Black spots': { name: 'Early Blight', severity: 'Medium', cause: 'Alternaria solani fungus', treatment: 'Spray Mancozeb or Chlorothalonil every 7 days.', prevention: 'Crop rotation. Remove crop debris.' },
    'White powder': { name: 'Powdery Mildew', severity: 'Low', cause: 'Leveillula taurica fungus', treatment: 'Spray potassium bicarbonate or neem oil.', prevention: 'Good ventilation. Avoid overhead watering.' },
  },
  potato: {
    'Brown spots,Wilting': { name: 'Late Blight', severity: 'Very High', cause: 'Phytophthora infestans – destroys entire crop', treatment: 'Spray Metalaxyl + Mancozeb immediately. Destroy infected tubers.', prevention: 'Certified seed. Copper fungicide preventively.' },
    'Stunted growth,Yellow leaves': { name: 'Potato Virus Y', severity: 'Medium', cause: 'Aphid-transmitted virus', treatment: 'No cure. Remove infected plants. Control aphids with imidacloprid.', prevention: 'Use virus-free seed. Insect-proof nets.' },
  },
};

const DISEASE_REF = [
  { crop: '🌾 Rice', disease: 'Blast', sign: 'Diamond-shaped lesions on leaves', treatment: 'Tricyclazole spray' },
  { crop: '🌿 Wheat', disease: 'Rust', sign: 'Orange/yellow powder on leaves', treatment: 'Propiconazole spray' },
  { crop: '🍅 Tomato', disease: 'Blight', sign: 'Dark water-soaked spots', treatment: 'Mancozeb spray' },
  { crop: '🥔 Potato', disease: 'Late Blight', sign: 'Brown lesions with white mold edge', treatment: 'Metalaxyl + Mancozeb' },
  { crop: '🌽 Maize', disease: 'Downy Mildew', sign: 'White downy growth on leaf underside', treatment: 'Metalaxyl seed treatment' },
  { crop: '🫘 Chana', disease: 'Wilt', sign: 'Sudden wilting, brown stem inside', treatment: 'Carbendazim seed treatment' },
];

function renderSymptomChips() {
  const wrap = document.getElementById('symptom-chips');
  if (!wrap) return;
  wrap.innerHTML = SYMPTOMS.map(s => `<button class="chip" onclick="toggleChip(this)">${s}</button>`).join('');
}

function toggleChip(el) { el.classList.toggle('selected'); }

function diagnoseCrop() {
  const crop = document.getElementById('dis-crop').value;
  if (!crop) { alert('Please select a crop first'); return; }
  const selected = [...document.querySelectorAll('.chip.selected')].map(c => c.textContent);
  if (selected.length === 0) { alert('Please select at least one symptom'); return; }

  const cropData = DISEASES[crop] || {};
  let best = null, bestScore = 0;
  for (const [key, val] of Object.entries(cropData)) {
    const keySymptoms = key.split(',');
    const score = keySymptoms.filter(s => selected.includes(s)).length;
    if (score > bestScore) { bestScore = score; best = val; }
  }

  const res = document.getElementById('disease-result');
  const content = document.getElementById('disease-result-content');
  res.style.display = 'block';

  if (best && bestScore > 0) {
    const sev = { Low: '#84cc16', Medium: '#f59e0b', High: '#ef4444', 'Very High': '#dc2626' };
    content.innerHTML = `
      <div class="diag-header">
        <h3>🔬 Diagnosis: ${best.name}</h3>
        <span class="sev-badge" style="background:${sev[best.severity]}30;color:${sev[best.severity]};border:1px solid ${sev[best.severity]}50">${best.severity} Risk</span>
      </div>
      <p class="diag-cause"><strong>📌 Cause:</strong> ${best.cause}</p>
      <div class="diag-treatment">
        <h4>💊 Treatment</h4>
        <p>${best.treatment}</p>
      </div>
      <div class="diag-prevention">
        <h4>🛡️ Prevention</h4>
        <p>${best.prevention}</p>
      </div>
      <p class="diag-note">⚠️ For accurate diagnosis, consult your local Agriculture Extension Officer (KVK).</p>`;
  } else {
    content.innerHTML = `<div class="diag-header"><h3>🤔 No Exact Match Found</h3></div>
      <p>Your symptoms don't match known patterns for this crop. Please:</p>
      <ul style="margin:1rem 0 0 1rem;color:var(--muted);line-height:2">
        <li>Call Kisan Call Center: <strong>1800-180-1551</strong> (Free)</li>
        <li>Visit your nearest <strong>Krishi Vigyan Kendra (KVK)</strong></li>
        <li>Take a photo and share on <strong>Pusa Krishi App</strong></li>
      </ul>`;
  }
}

function renderDiseaseRef() {
  const g = document.getElementById('disease-ref-grid');
  if (!g) return;
  g.innerHTML = DISEASE_REF.map(d => `
    <div class="dis-ref-card glass">
      <div class="dis-ref-top"><span>${d.crop}</span><strong>${d.disease}</strong></div>
      <p class="dis-sign">🔎 ${d.sign}</p>
      <p class="dis-treat">💊 ${d.treatment}</p>
    </div>`).join('');
}

// ── Crop Calendar ──────────────────────────────
const CALENDAR_DATA = [
  { crop: '🌾 Rice', season: 'kharif', sow: [5,6], grow: [7,8], harvest: [9,10], regions: ['north','south','east','west'] },
  { crop: '🌿 Wheat', season: 'rabi', sow: [10,11], grow: [1,12], harvest: [2,3], regions: ['north','south','east','west'] },
  { crop: '🌽 Maize', season: 'kharif', sow: [6,7], grow: [8], harvest: [9,10], regions: ['north','south','east','west'] },
  { crop: '🍅 Tomato', season: 'zaid', sow: [1,2,6,7], grow: [3,8], harvest: [4,5,9,10], regions: ['north','south','east','west'] },
  { crop: '🫘 Chana', season: 'rabi', sow: [10,11], grow: [1,12], harvest: [2,3], regions: ['north','south','east','west'] },
  { crop: '🥔 Potato', season: 'rabi', sow: [9,10], grow: [11,12], harvest: [1,2], regions: ['north','south','east','west'] },
  { crop: '🥦 Mustard', season: 'rabi', sow: [9,10], grow: [11,12], harvest: [1,2], regions: ['north','south','east','west'] },
];

function renderCalendar() {
  const state = document.getElementById('cal-state').value;
  const season = document.getElementById('cal-season').value;
  const rows = document.getElementById('cal-rows');
  if (!rows) return;
  const filtered = CALENDAR_DATA.filter(c =>
    (season === 'all' || c.season === season) &&
    c.regions.includes(state)
  );
  rows.innerHTML = filtered.map(c => {
    const cells = Array.from({length:12}, (_,i) => {
      const m = i + 1;
      if (c.sow.includes(m)) return `<span class="cal-cell sow" title="Sowing">🌱</span>`;
      if (c.grow.includes(m)) return `<span class="cal-cell grow" title="Growing">🌿</span>`;
      if (c.harvest.includes(m)) return `<span class="cal-cell harvest" title="Harvesting">🌾</span>`;
      return `<span class="cal-cell rest">—</span>`;
    });
    return `<div class="cal-row"><span class="cal-crop">${c.crop}</span>${cells.join('')}</div>`;
  }).join('') || '<p style="color:var(--muted);padding:2rem">No crops found for this selection.</p>';
}

// ── Farming Calculators ───────────────────────
function switchCalc(id, btn) {
  document.querySelectorAll('.calc-panel').forEach(p => p.style.display='none');
  document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('calc-'+id).style.display='block';
  btn.classList.add('active');
}

const FERT = {
  rice:      { N:120, P:60, K:60 },
  wheat:     { N:120, P:60, K:40 },
  maize:     { N:150, P:70, K:70 },
  sugarcane: { N:250, P:85, K:120 },
  cotton:    { N:120, P:60, K:60 },
  tomato:    { N:100, P:60, K:100 },
};
const SOIL_FACTOR = { normal:1, sandy:1.2, clay:0.85 };

function calcFertilizer() {
  const crop = document.getElementById('fert-crop').value;
  const area = parseFloat(document.getElementById('fert-area').value) || 1;
  const soil = document.getElementById('fert-soil').value;
  const base = FERT[crop];
  const factor = SOIL_FACTOR[soil];
  const N = Math.round(base.N * area * factor);
  const P = Math.round(base.P * area * factor);
  const K = Math.round(base.K * area * factor);
  // Convert to common fertilizers
  const urea = Math.round(N / 0.46);
  const dap  = Math.round(P / 0.46);
  const mop  = Math.round(K / 0.60);
  const res = document.getElementById('fert-result');
  res.style.display = 'block';
  res.innerHTML = `
    <h4>📊 Results for ${area} acre(s) of ${crop}</h4>
    <div class="fert-grid">
      <div class="fert-item"><span>🌿 Urea (N)</span><strong>${urea} kg</strong><small>₹${Math.round(urea*6.5)}</small></div>
      <div class="fert-item"><span>🔵 DAP (P)</span><strong>${dap} kg</strong><small>₹${Math.round(dap*27)}</small></div>
      <div class="fert-item"><span>🟡 MOP (K)</span><strong>${mop} kg</strong><small>₹${Math.round(mop*17)}</small></div>
    </div>
    <p class="calc-note">💡 Split nitrogen into 3 doses: at sowing, tillering, and panicle stage. Consult your local KVK for soil-test based recommendations.</p>`;
}

function calcProfit() {
  const area = parseFloat(document.getElementById('prof-area').value) || 1;
  const yieldQ = parseFloat(document.getElementById('prof-yield').value) || 20;
  const price = parseFloat(document.getElementById('prof-price').value) || 2000;
  const cost = parseFloat(document.getElementById('prof-cost').value) || 15000;
  const revenue = area * yieldQ * price;
  const totalCost = area * cost;
  const profit = revenue - totalCost;
  const roi = ((profit/totalCost)*100).toFixed(1);
  const res = document.getElementById('prof-result');
  res.style.display = 'block';
  const clr = profit > 0 ? '#10b981' : '#ef4444';
  res.innerHTML = `
    <div class="profit-grid">
      <div class="profit-item"><span>📦 Total Yield</span><strong>${(area*yieldQ).toFixed(1)} qtl</strong></div>
      <div class="profit-item"><span>💵 Gross Revenue</span><strong>₹${revenue.toLocaleString('en-IN')}</strong></div>
      <div class="profit-item"><span>💸 Total Cost</span><strong>₹${totalCost.toLocaleString('en-IN')}</strong></div>
      <div class="profit-item" style="border-color:${clr}20;background:${clr}10">
        <span>${profit>0?'🟢':'🔴'} Net Profit</span>
        <strong style="color:${clr}">₹${profit.toLocaleString('en-IN')}</strong>
      </div>
    </div>
    <p style="color:var(--muted);margin-top:1rem;font-size:.85rem">📈 ROI: <strong style="color:${clr}">${roi}%</strong></p>`;
}

const WATER_REQ = { rice:1200, wheat:450, sugarcane:2000, cotton:700, maize:500, vegetables:600 };
const SEASON_FACTOR = { summer:1.3, monsoon:0.5, winter:0.8 };

function calcWater() {
  const crop = document.getElementById('water-crop').value;
  const area = parseFloat(document.getElementById('water-area').value) || 1;
  const season = document.getElementById('water-season').value;
  const base = WATER_REQ[crop] * area * SEASON_FACTOR[season];
  const mm = Math.round(base);
  const liters = Math.round(mm * 4046.86 / 1000);
  const res = document.getElementById('water-result');
  res.style.display = 'block';
  res.innerHTML = `
    <div class="profit-grid">
      <div class="profit-item"><span>💧 Water Needed</span><strong>${mm} mm</strong></div>
      <div class="profit-item"><span>🪣 In Liters</span><strong>${liters.toLocaleString('en-IN')} L</strong></div>
      <div class="profit-item"><span>⏱️ Irrigations</span><strong>${Math.ceil(mm/60)} times</strong></div>
    </div>
    <p class="calc-note">💡 Use drip irrigation to save up to 40% water. Apply at early morning or evening to reduce evaporation.</p>`;
}

const SEED_REQ = { rice:25, wheat:100, maize:8, soybean:70, cotton:2.5, onion:10 };

function calcSeed() {
  const crop = document.getElementById('seed-crop').value;
  const area = parseFloat(document.getElementById('seed-area').value) || 1;
  const kg = (SEED_REQ[crop] * area).toFixed(1);
  const res = document.getElementById('seed-result');
  res.style.display = 'block';
  res.innerHTML = `
    <div class="profit-grid">
      <div class="profit-item"><span>🌱 Seeds Required</span><strong>${kg} kg</strong></div>
      <div class="profit-item"><span>💰 Approx. Cost</span><strong>₹${Math.round(kg * 80)}</strong></div>
    </div>
    <p class="calc-note">💡 Always use certified seeds from government centers for better germination and disease resistance.</p>`;
}

// ── Helplines Data ─────────────────────────────
const HELPLINES = [
  { icon:'📞', name:'Kisan Call Center', number:'1800-180-1551', desc:'Free, 24×7, in 22 languages. Crop advice, schemes, weather.', color:'#10b981' },
  { icon:'🌾', name:'PM-KISAN Helpline', number:'155261', desc:'Queries about PM-KISAN scheme, payment status.', color:'#3b82f6' },
  { icon:'🌦️', name:'Weather Forecast', number:'1800-180-1717', desc:'Daily weather forecast for your region (IMD).', color:'#8b5cf6' },
  { icon:'🏦', name:'Kisan Credit Card', number:'1800-11-0001', desc:'SBI KCC loan queries and assistance.', color:'#f59e0b' },
  { icon:'🛡️', name:'Crop Insurance', number:'1800-200-7710', desc:'PMFBY claim status and enrollment queries.', color:'#ef4444' },
  { icon:'🧪', name:'Soil Testing', number:'1800-180-1551', desc:'Kisan Call Center for nearest soil testing lab.', color:'#06b6d4' },
  { icon:'🚨', name:'Police Emergency', number:'100', desc:'For theft, disputes at mandi or transport.', color:'#dc2626' },
  { icon:'🏥', name:'Medical Emergency', number:'108', desc:'Free ambulance service in rural areas.', color:'#16a34a' },
];

function renderHelplines() {
  const g = document.getElementById('helpline-grid');
  if (!g) return;
  g.innerHTML = HELPLINES.map(h => `
    <a href="tel:${h.number.replace(/-/g,'')}" class="helpline-card glass" style="border-top: 3px solid ${h.color}">
      <div class="hl-icon" style="color:${h.color}">${h.icon}</div>
      <div class="hl-body">
        <h3>${h.name}</h3>
        <p class="hl-number" style="color:${h.color}">${h.number}</p>
        <p class="hl-desc">${h.desc}</p>
      </div>
      <span class="hl-call" style="background:${h.color}20;color:${h.color}">📞 Call</span>
    </a>`).join('');
}

// ── Farming Tips ───────────────────────────────
const TIPS = [
  { cat:'soil', icon:'🌱', title:'Test Your Soil First', body:'Get soil tested every 3 years. Costs only ₹5–20 at government labs. Saves 20–30% fertilizer cost.' },
  { cat:'soil', icon:'♻️', title:'Use Organic Matter', body:'Add farm yard manure (FYM) or compost at 5–10 tonnes/acre. Improves soil structure, water retention, and reduces chemical use.' },
  { cat:'water', icon:'💧', title:'Drip Irrigation Saves 40%', body:'Switch to drip or sprinkler irrigation. Saves 40–60% water. Get 55–90% subsidy under PMKSY scheme.' },
  { cat:'water', icon:'🌅', title:'Irrigate at Right Time', body:'Water crops early morning or late evening to reduce evaporation by up to 30%.' },
  { cat:'pest', icon:'🐛', title:'Integrated Pest Management', body:'Use yellow sticky traps, neem-based sprays, and biological controls before chemical pesticides to reduce cost and chemical residue.' },
  { cat:'pest', icon:'🌿', title:'Neem as Natural Pesticide', body:'Spray neem oil (5ml/L water) to control 200+ insect pests. Safe, cheap, no chemical residue.' },
  { cat:'harvest', icon:'⏰', title:'Harvest at Right Moisture', body:'Harvest wheat at 20–22% moisture, rice at 20–25%. Prevents grain breakage and mold during storage.' },
  { cat:'harvest', icon:'🌤️', title:'Dry Before Storing', body:'Sun-dry grains to 12–14% moisture before storage. Prevents fungal growth and aflatoxin contamination.' },
  { cat:'storage', icon:'📦', title:'Use Hermetic Storage Bags', body:'HDPE triple-layer bags cost ₹150–200. Store grains for 6–12 months without insecticide. Reduces storage losses from 15% to <1%.' },
  { cat:'storage', icon:'❄️', title:'Cold Storage for Vegetables', body:'Tomatoes, onions, and potatoes stored at 5–12°C last 2–4x longer. Check government cold storage schemes.' },
  { cat:'soil', icon:'🌾', title:'Crop Rotation is Essential', body:'Never grow the same crop twice in a row. Alternate legumes (chana, soybean) with cereals to naturally restore nitrogen.' },
  { cat:'water', icon:'🌧️', title:'Rainwater Harvesting', body:'Build a simple farm pond to capture rainwater. A 30×30m pond can irrigate 2 acres through the dry season.' },
];

function filterTips(cat, btn) {
  document.querySelectorAll('.tip-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const g = document.getElementById('tips-grid');
  const filtered = cat === 'all' ? TIPS : TIPS.filter(t => t.cat === cat);
  g.innerHTML = filtered.map(t => `
    <div class="tip-card glass">
      <span class="tip-icon">${t.icon}</span>
      <div>
        <h3>${t.title}</h3>
        <p>${t.body}</p>
      </div>
    </div>`).join('');
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSchemes();
  renderSymptomChips();
  renderDiseaseRef();
  renderCalendar();
  renderHelplines();
  filterTips('all', document.querySelector('.tip-filter-btn'));
});
