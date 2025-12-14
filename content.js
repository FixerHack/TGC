(function() {
  'use strict';

  // Тексти для різних мов
  const TRANSLATIONS = {
    uk: {
      title: 'УВАГА! Можливий фішинг!',
      description: 'Цей сайт <strong>НЕ є офіційним Telegram</strong>, але містить поля для введення ваших даних.',
      currentDomain: 'Поточний домен:',
      officialDomains: 'Офіційні домени Telegram: telegram.org, t.me, web.telegram.org',
      leaveSite: 'Покинути сайт',
      proceedAnyway: 'Продовжити (небезпечно)'
    },
    en: {
      title: 'WARNING! Possible Phishing!',
      description: 'This site is <strong>NOT official Telegram</strong>, but contains data entry fields.',
      currentDomain: 'Current domain:',
      officialDomains: 'Official Telegram domains: telegram.org, t.me, web.telegram.org',
      leaveSite: 'Leave Site',
      proceedAnyway: 'Proceed Anyway (dangerous)'
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

  // Перевірка чи увімкнено розширення
  async function isExtensionEnabled() {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      return result.enabled !== false;
    } catch (error) {
      return true;
    }
  }

  // Отримання поточної мови
  async function getCurrentLanguage() {
    try {
      const result = await chrome.storage.sync.get(['language']);
      return result.language || 'uk';
    } catch (error) {
      return 'uk';
    }
  }

  function isOfficialTelegramDomain() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (window.location.protocol === 'file:') {
      return false;
    }
    
    return OFFICIAL_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  function containsTelegramKeywords() {
    const bodyText = document.body.innerText.toLowerCase();
    const keywords = [
      'telegram',
      'телеграм',
      'телеграмм',
      'tg messenger',
      'telegram messenger'
    ];
    
    return keywords.some(keyword => bodyText.includes(keyword));
  }

  function hasLoginInputs() {
    const inputs = document.querySelectorAll('input');
    const phonePatterns = [
      /phone/i, /tel/i, /номер/i, /телефон/i, /mobile/i, /number/i
    ];
    const codePatterns = [
      /code/i, /verification/i, /код/i, /verify/i, /otp/i
    ];
    const passwordPatterns = [
      /password/i, /pass/i, /пароль/i, /pwd/i
    ];

    let hasPhoneInput = false;
    let hasCodeOrPasswordInput = false;

    inputs.forEach(input => {
      const placeholder = (input.placeholder || '').toLowerCase();
      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const type = (input.type || '').toLowerCase();
      const combined = `${placeholder} ${name} ${id}`;

      if (type === 'tel' || phonePatterns.some(p => p.test(combined))) {
        hasPhoneInput = true;
      }
      
      if (type === 'password' || 
          codePatterns.some(p => p.test(combined)) ||
          passwordPatterns.some(p => p.test(combined))) {
        hasCodeOrPasswordInput = true;
      }
    });

    return hasPhoneInput || hasCodeOrPasswordInput;
  }

  function hasSuspiciousUrl() {
    const hostname = window.location.hostname.toLowerCase();
    const suspiciousPatterns = [
      /telegr[a4o0]m/i,
      /t[e3][l1][e3]gr[a4o0]m/i,
      /te1egram/i,
      /telegr4m/i,
      /tel3gram/i
    ];

    if (suspiciousPatterns.some(p => p.test(hostname))) {
      return true;
    }

    const commonTypos = [
      'telegrom', 'telgram', 'teiegram', 'telegram0', 
      'telegram1', 'telegramm', 'telegran', 'telegream'
    ];
    
    return commonTypos.some(typo => hostname.includes(typo));
  }

  async function showPhishingWarning() {
    if (document.getElementById('telegram-phishing-warning')) {
      return;
    }

    const lang = await getCurrentLanguage();
    const texts = TRANSLATIONS[lang];

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
          max-width: 500px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
          <h1 style="color: #d32f2f; margin: 0 0 15px 0; font-size: 24px;">
            ${texts.title}
          </h1>
          <p style="color: #333; margin: 15px 0; font-size: 16px; line-height: 1.5;">
            ${texts.description}
          </p>
          <p style="color: #555; margin: 10px 0; font-size: 14px;">
            <strong>${texts.currentDomain}</strong> ${window.location.hostname || 'local file'}
          </p>
          <p style="color: #555; margin: 10px 0 20px 0; font-size: 14px;">
            ${texts.officialDomains}
          </p>
          <div style="margin-top: 25px;">
            <button id="leave-site-btn" style="
              background: #d32f2f;
              color: white;
              border: none;
              padding: 12px 30px;
              font-size: 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-right: 10px;
              font-weight: bold;
            ">${texts.leaveSite}</button>
            <button id="proceed-anyway-btn" style="
              background: #757575;
              color: white;
              border: none;
              padding: 12px 30px;
              font-size: 16px;
              border-radius: 6px;
              cursor: pointer;
            ">${texts.proceedAnyway}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warning);

    // Кнопка "Покинути сайт" - перехід на Google
    document.getElementById('leave-site-btn').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });

    // Кнопка "Продовжити" - закрити попередження
    document.getElementById('proceed-anyway-btn').addEventListener('click', () => {
      warning.remove();
    });
  }

  async function checkForPhishing() {
    // Перевірка чи увімкнено розширення
    const enabled = await isExtensionEnabled();
    if (!enabled) {
      console.log('🔕 Розширення вимкнено');
      return;
    }

    if (isOfficialTelegramDomain()) {
      console.log('✅ Офіційний домен Telegram - все OK');
      return;
    }

    const hasTelegramContent = containsTelegramKeywords();
    const hasInputFields = hasLoginInputs();
    const suspiciousUrl = hasSuspiciousUrl();

    console.log('🔍 Перевірка фішингу:', {
      hasTelegramContent,
      hasInputFields,
      suspiciousUrl,
      domain: window.location.hostname
    });

    if ((hasTelegramContent && hasInputFields) || suspiciousUrl) {
      console.log('⚠️ ФІШИНГ ВИЯВЛЕНО!');
      await showPhishingWarning();
    }
  }

  // Запуск перевірки
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForPhishing);
  } else {
    checkForPhishing();
  }

  // Моніторинг динамічних змін
  const observer = new MutationObserver(() => {
    checkForPhishing();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Слухач зміни налаштувань
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.enabled) {
      if (changes.enabled.newValue === false) {
        // Видалити попередження якщо розширення вимкнено
        const warning = document.getElementById('telegram-phishing-warning');
        if (warning) {
          warning.remove();
        }
      } else {
        // Запустити перевірку якщо розширення увімкнено
        checkForPhishing();
      }
    }
  });

})();