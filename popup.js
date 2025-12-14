// Завантаження поточних налаштувань
chrome.storage.sync.get(['enabled', 'language'], (result) => {
  const enabled = result.enabled !== false;
  const language = result.language || 'uk';

  // Встановити стан перемикача
  document.getElementById('toggle-enabled').checked = enabled;
  
  // Встановити мову
  document.getElementById('language-select').value = language;
  
  // Оновити статус
  updateStatus(enabled, language);
  updateLabels(language);
});

// Перемикач увімкнено/вимкнено
document.getElementById('toggle-enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  
  chrome.storage.sync.set({ enabled }, () => {
    chrome.storage.sync.get(['language'], (result) => {
      updateStatus(enabled, result.language || 'uk');
    });
  });
});

// Зміна мови
document.getElementById('language-select').addEventListener('change', (e) => {
  const language = e.target.value;
  
  chrome.storage.sync.set({ language }, () => {
    chrome.storage.sync.get(['enabled'], (result) => {
      updateLabels(language);
      updateStatus(result.enabled !== false, language);
    });
  });
});

// Оновлення статусу
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

// Оновлення міток
function updateLabels(language) {
  const labels = {
    uk: {
      protection: 'Захист увімкнено',
      language: 'Мова / Language'
    },
    en: {
      protection: 'Protection enabled',
      language: 'Language / Мова'
    }
  };
  
  document.getElementById('label-protection').textContent = labels[language].protection;
  document.getElementById('label-language').textContent = labels[language].language;
}