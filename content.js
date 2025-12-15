(function() {
  'use strict';

  // ========================================
  // ПЕРЕКЛАДИ
  // ========================================

  const TRANSLATIONS = {
    uk: {
      title: 'УВАГА! Виявлено фішинг!',
      description: 'Цей сайт <strong>НЕ є офіційним Telegram</strong> і може бути небезпечним.',
      riskLevel: 'Рівень загрози:',
      riskLow: '🟢 Низький',
      riskMedium: '🟡 Середній',
      riskHigh: '🔴 Високий',
      riskCritical: '🔴 КРИТИЧНИЙ',
      detectedThreats: 'Виявлені загрози:',
      currentDomain: 'Поточний домен:',
      officialDomains: 'Офіційні домени: telegram.org, t.me, web.telegram.org',
      leaveSite: 'Покинути сайт',
      addToWhitelist: 'Додати в білий список',
      proceedOnce: 'Продовжити один раз',
      whitelistConfirm: 'Ви впевнені? Цей сайт більше не буде перевірятись на фішинг!',
      whitelistAdded: '✅ Сайт додано в білий список'
    },
    en: {
      title: 'WARNING! Phishing Detected!',
      description: 'This site is <strong>NOT official Telegram</strong> and may be dangerous.',
      riskLevel: 'Threat Level:',
      riskLow: '🟢 Low',
      riskMedium: '🟡 Medium',
      riskHigh: '🔴 High',
      riskCritical: '🔴 CRITICAL',
      detectedThreats: 'Detected Threats:',
      currentDomain: 'Current domain:',
      officialDomains: 'Official domains: telegram.org, t.me, web.telegram.org',
      leaveSite: 'Leave Site',
      addToWhitelist: 'Add to Whitelist',
      proceedOnce: 'Proceed Once',
      whitelistConfirm: 'Are you sure? This site will no longer be checked for phishing!',
      whitelistAdded: '✅ Site added to whitelist'
    }
  };

  // Офіційні домени Telegram
  const OFFICIAL_DOMAINS = [
    'telegram.org',
    'telegram.me',
    't.me',
    'web.telegram.org',
    'desktop.telegram.org',
    'core.telegram.org',
    'localhost'
  ];

  // База фішингових доменів (з phishing-db.js або локальна копія)
  const KNOWN_PHISHING_DOMAINS = typeof window.KNOWN_PHISHING_DOMAINS !== 'undefined' 
    ? window.KNOWN_PHISHING_DOMAINS 
    : [
      'telegrom.pp.ua',
      'telegram-web.info',
      'telegram-login.net',
      'web-telegram.org',
      'telegram-verify.com',
      'telegram-auth.net',
      'tg-login.com',
      'telegram-code.net',
      'secure-telegram.org',
      'telegram-support.net'
    ];

  // ========================================
  // СПРОЩЕНИЙ ДЕТЕКТОР ФІШИНГУ
  // ========================================

  class PhishingDetector {
    constructor() {
      this.score = 0;
      this.threats = [];
    }

    async analyze() {
      await this.checkDomain();
      await this.checkContent();
      await this.checkInputFields();
      
      return this.getResult();
    }

    // 1. Перевірка домену
    async checkDomain() {
      const hostname = window.location.hostname.toLowerCase();
      
      // Чорний список
      if (KNOWN_PHISHING_DOMAINS.includes(hostname)) {
        this.addThreat('Known phishing domain', 40);
        return;
      }

      // Typosquatting
      const typos = [
        'telegrom', 'telgram', 'teiegram', 'telegram0', 
        'telegram1', 'telegramm', 'telegran', 'telegream',
        'te1egram', 'telegr4m', 'tel3gram'
      ];
      
      if (typos.some(typo => hostname.includes(typo))) {
        this.addThreat('Similar domain name (typo)', 30);
      }

      // Підозрілі домени
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.info', '.xyz'];
      if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
        this.addThreat('Suspicious domain extension', 15);
      }

      // Немає HTTPS
      if (window.location.protocol !== 'https:' && window.location.protocol !== 'file:') {
        this.addThreat('No secure connection (HTTPS)', 20);
      }
    }

    // 2. Перевірка контенту
    async checkContent() {
      if (!this.containsTelegramKeywords()) {
        return;
      }

      const bodyText = document.body.innerText.toLowerCase();
      
      // Підозрілі фрази
      const suspiciousPhrases = [
        { text: 'verify', points: 10 },
        { text: 'suspended', points: 15 },
        { text: 'banned', points: 15 },
        { text: 'winner', points: 10 },
        { text: 'urgent', points: 10 },
        { text: 'підтвердіть', points: 10 },
        { text: 'заблоковано', points: 15 }
      ];

      suspiciousPhrases.forEach(phrase => {
        if (bodyText.includes(phrase.text)) {
          this.addThreat(`Suspicious text: "${phrase.text}"`, phrase.points);
        }
      });
    }

    // 3. Поля введення
    async checkInputFields() {
      const inputs = document.querySelectorAll('input');
      let hasPhone = false;
      let hasCode = false;
      let hasPassword = false;

      inputs.forEach(input => {
        const text = `${input.placeholder} ${input.name} ${input.id} ${input.type}`.toLowerCase();
        
        if (text.includes('phone') || text.includes('tel') || text.includes('номер')) {
          hasPhone = true;
        }
        if (text.includes('code') || text.includes('verify') || text.includes('код')) {
          hasCode = true;
        }
        if (text.includes('password') || text.includes('pass') || text.includes('пароль')) {
          hasPassword = true;
        }
      });

      if (hasPhone) this.addThreat('Phone number field detected', 15);
      if (hasCode) this.addThreat('Verification code field detected', 15);
      if (hasPassword) this.addThreat('Password field detected', 15);
    }

    containsTelegramKeywords() {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('telegram') || bodyText.includes('телеграм');
    }

    addThreat(description, points) {
      this.score += points;
      this.threats.push({ description, points });
    }

    getResult() {
      let riskLevel = 'low';
      if (this.score >= 20 && this.score < 40) riskLevel = 'medium';
      else if (this.score >= 40 && this.score < 70) riskLevel = 'high';
      else if (this.score >= 70) riskLevel = 'critical';

      return {
        isPhishing: this.score >= 20,
        score: this.score,
        riskLevel,
        threats: this.threats
      };
    }
  }

  // ========================================
  // РОБОТА З БІЛИМ СПИСКОМ
  // ========================================

  async function getWhitelist() {
    try {
      const result = await chrome.storage.sync.get(['whitelist']);
      return result.whitelist || [];
    } catch (error) {
      return [];
    }
  }

  async function addToWhitelist(domain) {
    const whitelist = await getWhitelist();
    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      await chrome.storage.sync.set({ whitelist });
    }
  }

  async function isInWhitelist(domain) {
    const whitelist = await getWhitelist();
    return whitelist.includes(domain);
  }

  // ========================================
  // ДОПОМІЖНІ ФУНКЦІЇ
  // ========================================

  async function isExtensionEnabled() {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      return result.enabled !== false;
    } catch (error) {
      return true;
    }
  }

  async function getCurrentLanguage() {
    try {
      const result = await chrome.storage.sync.get(['language']);
      return result.language || 'uk';
    } catch (error) {
      return 'uk';
    }
  }

  // ========================================
  // ПОКАЗ ПОПЕРЕДЖЕННЯ
  // ========================================

  async function showPhishingWarning(result) {
    if (document.getElementById('telegram-phishing-warning')) {
      return;
    }

    const lang = await getCurrentLanguage();
    const texts = TRANSLATIONS[lang];
    const currentDomain = window.location.hostname;

    const riskColors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#B71C1C'
    };

    const riskTexts = {
      low: texts.riskLow,
      medium: texts.riskMedium,
      high: texts.riskHigh,
      critical: texts.riskCritical
    };

    const threatsHtml = result.threats.map(t => 
      `<li style="margin: 5px 0; font-size: 13px;">⚠️ ${t.description} <span style="color: #d32f2f; font-weight: bold;">(+${t.points})</span></li>`
    ).join('');

    const warning = document.createElement('div');
    warning.id = 'telegram-phishing-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: #fff;
          padding: 30px;
          border-radius: 12px;
          max-width: 550px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-height: 90vh;
          overflow-y: auto;
        ">
          <div style="font-size: 60px; margin-bottom: 20px;">🛡️</div>
          <h1 style="color: #d32f2f; margin: 0 0 15px 0; font-size: 24px;">
            ${texts.title}
          </h1>
          <p style="color: #333; margin: 15px 0; font-size: 16px; line-height: 1.5;">
            ${texts.description}
          </p>
          
          <div style="
            background: ${riskColors[result.riskLevel]};
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
          ">
            ${texts.riskLevel} ${riskTexts[result.riskLevel]}
            <div style="font-size: 24px; margin-top: 5px;">
              ${texts.detectedThreats.split(':')[0]}: ${result.threats.length}
            </div>
          </div>

          <div style="
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: left;
            max-height: 200px;
            overflow-y: auto;
          ">
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              ${threatsHtml}
            </ul>
          </div>

          <p style="color: #555; margin: 10px 0; font-size: 14px;">
            <strong>${texts.currentDomain}</strong> ${currentDomain}
          </p>
          <p style="color: #555; margin: 10px 0 20px 0; font-size: 13px;">
            ${texts.officialDomains}
          </p>

          <div style="margin-top: 25px; display: flex; flex-direction: column; gap: 10px;">
            <button id="leave-site-btn" style="
              background: #d32f2f;
              color: white;
              border: none;
              padding: 14px 30px;
              font-size: 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
            ">${texts.leaveSite}</button>
            
            <button id="whitelist-btn" style="
              background: #FF9800;
              color: white;
              border: none;
              padding: 12px 30px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
            ">${texts.addToWhitelist}</button>
            
            <button id="proceed-once-btn" style="
              background: #757575;
              color: white;
              border: none;
              padding: 12px 30px;
              font-size: 14px;
              border-radius: 6px;
              cursor: pointer;
            ">${texts.proceedOnce}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warning);

    // Кнопка "Покинути сайт"
    document.getElementById('leave-site-btn').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });

    // Кнопка "Додати в білий список"
    document.getElementById('whitelist-btn').addEventListener('click', async () => {
      if (confirm(texts.whitelistConfirm)) {
        await addToWhitelist(currentDomain);
        
        // Показати підтвердження
        const btn = document.getElementById('whitelist-btn');
        btn.textContent = texts.whitelistAdded;
        btn.style.background = '#4CAF50';
        btn.disabled = true;
        
        // Закрити попередження через 1 секунду
        setTimeout(() => {
          warning.remove();
        }, 1000);
      }
    });

    // Кнопка "Продовжити один раз"
    document.getElementById('proceed-once-btn').addEventListener('click', () => {
      warning.remove();
    });
  }

  // ========================================
  // ОСНОВНА ЛОГІКА
  // ========================================

  async function checkForPhishing() {
    // Перевірка чи увімкнено розширення
    const enabled = await isExtensionEnabled();
    if (!enabled) {
      console.log('🔕 Extension disabled');
      return;
    }

    const hostname = window.location.hostname.toLowerCase();

    // Перевірка офіційних доменів
    if (OFFICIAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
      console.log('✅ Official Telegram domain');
      return;
    }

    // Перевірка білого списку
    if (await isInWhitelist(hostname)) {
      console.log('✅ Domain in whitelist');
      return;
    }

    // Аналіз на фішинг
    const detector = new PhishingDetector();
    const result = await detector.analyze();

    console.log('🔍 Phishing Analysis:', result);

    if (result.isPhishing) {
      console.log('⚠️ PHISHING DETECTED!');
      await showPhishingWarning(result);
    }
  }

  // Запуск перевірки
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForPhishing);
  } else {
    checkForPhishing();
  }

  // Моніторинг динамічних змін (з затримкою для оптимізації)
  let checkTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(checkTimeout);
    checkTimeout = setTimeout(checkForPhishing, 1000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Слухач змін налаштувань
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.enabled) {
      if (changes.enabled.newValue === false) {
        const warning = document.getElementById('telegram-phishing-warning');
        if (warning) warning.remove();
      } else {
        checkForPhishing();
      }
    }
  });

})();