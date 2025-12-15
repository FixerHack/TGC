// Завантаження поточних налаштувань при відкритті popup
chrome.storage.sync.get(['enabled', 'language'], (result) => {
  const enabled = result.enabled !== false;
  const language = result.language || 'uk';

  // Встановити стан перемикача
  document.getElementById('toggle-enabled').checked = enabled;
  
  // Встановити вибрану мову
  document.getElementById('language-select').value = language;
  
  // Оновити статус та мітки
  updateStatus(enabled, language);
  updateLabels(language);
});

// Обробник зміни стану перемикача (увімкнено/вимкнено)
document.getElementById('toggle-enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  
  // Зберегти нове значення
  chrome.storage.sync.set({ enabled }, () => {
    chrome.storage.sync.get(['language'], (result) => {
      updateStatus(enabled, result.language || 'uk');
    });
  });
});

// Обробник зміни мови
document.getElementById('language-select').addEventListener('change', (e) => {
  const language = e.target.value;
  
  // Зберегти нову мову
  chrome.storage.sync.set({ language }, () => {
    chrome.storage.sync.get(['enabled'], (result) => {
      updateLabels(language);
      updateStatus(result.enabled !== false, language);
    });
  });
});

// Функція оновлення статусу
function updateStatus(enabled, language) {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  
  const messages = {
    uk: {
      enabled: 'Розширення активне',
      disabled: 'Розширення вимкнено'
    },
    en: {
      enabled: 'Extension active',
      disabled: 'Extension disabled'
    }
  };
  
  if (enabled) {
    statusDiv.className = 'status';
    statusText.textContent = messages[language].enabled;
  } else {
    statusDiv.className = 'status disabled';
    statusText.textContent = messages[language].disabled;
  }
}

// Функція оновлення міток інтерфейсу
function updateLabels(language) {
  const labels = {
    uk: {
      protection: 'Захист увімкнено',
      language: 'Мова / Language',
      clearWhitelist: 'Очистити білий список'
    },
    en: {
      protection: 'Protection enabled',
      language: 'Language / Мова',
      clearWhitelist: 'Clear whitelist'
    }
  };
  
  document.getElementById('label-protection').textContent = labels[language].protection;
  document.getElementById('label-language').textContent = labels[language].language;
  document.getElementById('label-clear').textContent = labels[language].clearWhitelist;
}

// Кнопка очищення білого списку
document.getElementById('clear-whitelist-btn').addEventListener('click', () => {
  chrome.storage.sync.get(['language'], (result) => {
    const lang = result.language || 'uk';
    const confirmMsg = lang === 'uk' 
      ? 'Очистити білий список? Усі додані сайти будуть знову перевірятись.'
      : 'Clear whitelist? All added sites will be checked again.';
    
    if (confirm(confirmMsg)) {
      chrome.storage.sync.set({ whitelist: [] }, () => {
        const successMsg = lang === 'uk' ? '✅ Білий список очищено' : '✅ Whitelist cleared';
        alert(successMsg);
      });
    }
  });
});