// voice.js – AgriPredict Voice Assistant v2 (Conversational AI)

const AgriVoice = {
  recognition: null,
  isListening: false,
  synth: window.speechSynthesis,
  
  // v2: Intent & Entity Mapping
  config: {
    intents: {
      ADVICE: ['sell', 'advice', 'bech', 'bechna', 'అమ్మాలా', 'సలహా', 'బెచో', 'సలహా', 'status', 'decision', 'opinion'],
      NAVIGATE: ['go to', 'show', 'open', 'డ్యాష్‌బోర్డ్', 'హెల్ప్', 'మార్కెట్', 'चलो', 'खोलें', 'Dashboard', 'Help', 'Market'],
      CART: ['cart', 'basket', 'కార్ట్', 'టోకు', 'टोकरी']
    },
    crops: {
      rice: ['rice', 'వరి', 'चावल', 'బియ్యం'],
      wheat: ['wheat', 'గోధుమ', 'गेहूं'],
      tomato: ['tomato', 'టమోటా', 'టమాట', 'टमाटर'],
      onion: ['onion', 'ఉల్లిపాయ', 'प्याज'],
      soybean: ['soybean', 'సోయాబీన్', 'सोयाबीन']
    }
  },

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => { this.isListening = true; this.updateUI(true); };
    this.recognition.onend = () => { this.isListening = false; this.updateUI(false); };
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      this.processVoice(transcript);
    };

    this.renderMicButton();
  },

  renderMicButton() {
    const micBtn = document.createElement('button');
    micBtn.id = 'agri-voice-btn';
    micBtn.className = 'agri-voice-btn';
    micBtn.innerHTML = '🎙️';
    micBtn.onclick = () => this.toggle();
    document.body.appendChild(micBtn);

    const style = document.createElement('style');
    style.innerHTML = `
      .agri-voice-btn {
        position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px;
        border-radius: 50%; background: var(--accent); color: white; border: none;
        font-size: 1.5rem; cursor: pointer; box-shadow: 0 8px 25px var(--accent-glow);
        z-index: 1000; transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center;
      }
      .agri-voice-btn.listening { background: #ef4444; animation: pulse-mic 1.5s infinite; }
      .agri-voice-btn.thinking { background: #f59e0b; animation: spin-mic 2s infinite linear; }
      @keyframes pulse-mic { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
      @keyframes spin-mic { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      .voice-status-toast {
        position: fixed; bottom: 6.5rem; right: 2rem; background: var(--bg-card);
        border: 1px solid var(--border); padding: 0.8rem 1.2rem; border-radius: 12px;
        font-size: 0.85rem; backdrop-filter: blur(10px); z-index: 1000;
      }
    `;
    document.head.appendChild(style);
  },

  updateUI(listening, thinking = false) {
    const btn = document.getElementById('agri-voice-btn');
    if (!btn) return;
    btn.className = 'agri-voice-btn' + (listening ? ' listening' : '') + (thinking ? ' thinking' : '');
    if (listening) this.showStatus('Listening... Try: "Should I sell rice?"');
    else if (thinking) this.showStatus('Processing command...');
    else setTimeout(() => this.hideStatus(), 2000);
  },

  showStatus(text) {
    let t = document.getElementById('agri-voice-status') || document.createElement('div');
    t.id = 'agri-voice-status'; t.className = 'voice-status-toast';
    t.textContent = text; t.style.display = 'block';
    if (!t.parentElement) document.body.appendChild(t);
  },

  hideStatus() { const t = document.getElementById('agri-voice-status'); if (t) t.style.display = 'none'; },

  toggle() {
    if (this.isListening) this.recognition.stop();
    else {
      this.recognition.lang = document.documentElement.lang === 'hi' ? 'hi-IN' : (document.documentElement.lang === 'te' ? 'te-IN' : 'en-IN');
      this.recognition.start();
    }
  },

  speak(text) {
    if (this.synth.speaking) this.synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.lang === 'hi' ? 'hi-IN' : (document.documentElement.lang === 'te' ? 'te-IN' : 'en-IN');
    utter.rate = 0.9; // Slightly slower for clarity
    this.synth.speak(utter);
  },

  // v2: Main Processing Logic
  processVoice(text) {
    this.updateUI(false, true); // Thinking mode
    const lang = document.documentElement.lang;
    
    // 1. Detect Intent
    let intent = null;
    for (const [key, keywords] of Object.entries(this.config.intents)) {
      if (keywords.some(k => text.includes(k))) { intent = key; break; }
    }

    // 2. Detect Crop Entity
    let crop = null;
    for (const [key, names] of Object.entries(this.config.crops)) {
      if (names.some(n => text.includes(n))) { crop = key; break; }
    }

    console.log(`Intent: ${intent}, Crop: ${crop}`);

    // 3. Handle Intent
    setTimeout(() => {
      if (intent === 'ADVICE' || (intent === null && crop)) {
        this.generateNaturalAdvice(crop);
      } else if (intent === 'NAVIGATE') {
        this.handleNavigation(text);
      } else if (intent === 'CART') {
        if (typeof toggleCart === 'function') toggleCart();
      } else {
        this.speak(lang === 'hi' ? 'क्षमा करें, मैं इसे समझ नहीं पाया' : (lang === 'te' ? 'క్షమించండి, అది అర్థం కాలేదు' : 'I missed that. Try asking for crop advice.'));
      }
      this.updateUI(false, false);
    }, 600);
  },

  generateNaturalAdvice(targetCrop) {
    const lang = document.documentElement.lang;
    const cards = document.querySelectorAll('.decision-card');
    
    if (cards.length === 0) {
      this.speak(lang === 'en' ? 'The decision engine is still loading.' : 'इंजन लोड हो रहा है');
      return;
    }

    let card = cards[0];
    if (targetCrop) {
      for (const c of cards) {
        if (c.querySelector('h3').textContent.toLowerCase().includes(targetCrop)) { card = c; break; }
      }
    }

    const name = card.querySelector('h3').textContent;
    const action = card.querySelector('.decision-badge').textContent;
    const confidence = card.querySelector('.conf-val').textContent;
    const reasoning = card.querySelector('.reasoning-item').textContent;

    // v2: Natural Language Generator Templates
    const templates = {
      en: [
        `${name} market looks stable. My advice is to ${action}. I'm ${confidence} sure because ${reasoning}.`,
        `Based on regional data, I suggest you ${action} your ${name}. There is a ${confidence} confidence level here.`,
        `The current decision for ${name} is to ${action}. ${reasoning}.`
      ],
      hi: [
        `${name} के लिए मेरी सलाह है: ${action}। मुझे इस पर ${confidence} भरोसा है क्योंकि ${reasoning}।`,
        `मार्केट डेटा के अनुसार, आप ${name} को ${action} करें। ${reasoning}।`
      ],
      te: [
        `${name} కోసం నా సలహా: ${action}. దీనిపై నాకు ${confidence} నమ్మకం ఉంది. ఎందుకంటే ${reasoning}.`
      ]
    };

    const options = templates[lang] || templates.en;
    const selected = options[Math.floor(Math.random() * options.length)];
    this.speak(selected);
  },

  handleNavigation(text) {
    if (text.includes('dashboard') || text.includes('డ్యాష్‌బోర్డ్') || text.includes('डैशबोर्ड')) window.location.href = 'dashboard.html';
    else if (text.includes('help') || text.includes('సహాయం') || text.includes('सहायता')) window.location.href = 'help.html';
    else if (text.includes('market') || text.includes('home') || text.includes('మార్కెట్')) window.location.href = '/';
  }
};

AgriVoice.init();
