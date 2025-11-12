chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

// ================================================================
// 📦 Instagram Extension - Background Script
// ================================================================

// 🧩 Handler utama untuk berbagai pesan dari popup / content-script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_INSTAGRAM_COOKIES':
      chrome.cookies.getAll({ domain: '.instagram.com' }, (cookies) => {
        sendResponse({ cookies })
      })
      return true

    case 'GET_INSTAGRAM_COOKIE_USER_ID':
      chrome.cookies.getAll(
        { domain: '.instagram.com', name: 'ds_user_id' },
        (cookies) => {
          console.log('[BG] Cookie ds_user_id:', cookies)
          const userId = cookies?.[0]?.value ?? null
          sendResponse({ userId })
        }
      )
      return true

    case 'REQUEST_USER_ID':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id
        if (!tabId) {
          sendResponse({ userId: null })
          return
        }

        chrome.tabs.sendMessage(
          tabId,
          { type: 'GET_USER_ID_FROM_PAGE' },
          (response) => {
            sendResponse({ userId: response?.userId || null })
          }
        )
      })
      return true

    case 'FETCH_IMAGE':
      fetch(message.url)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => sendResponse({ dataUrl: reader.result })
          reader.readAsDataURL(blob)
        })
        .catch((err) => {
          console.error('[BG] Gagal fetch image:', err)
          sendResponse({ dataUrl: null })
        })
      return true

    default:
      break
  }
})

// ================================================================
// 🔹 Deteksi navigasi Instagram (URL berubah di content-script)
// ================================================================
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'INSTAGRAM_URL_CHANGED') {
    console.log('🔄 Detected navigation:', message.url)

    // Broadcast ke semua listener (popup, content-script, dsb)
    chrome.runtime.sendMessage({
      type: 'REFRESH_INSTAGRAM_DATA',
      url: message.url,
    })
  }
})

// ================================================================
// 🔹 Intersep request ke API GraphQL Instagram (opsional / debugging)
// ================================================================
// chrome.webRequest.onCompleted.addListener(
//   async (details) => {
//     if (details.url.includes('/graphql/query')) {
//       try {
//         const response = await fetch(details.url)
//         const data = await response.json()
//         console.log('📡 Intercepted via webRequest:', data)
//       } catch (err) {
//         console.warn('⚠️ Gagal memproses request GraphQL:', err)
//       }
//     }
//   },
//   { urls: ['*://www.instagram.com/*'] }
// )

// ================================================================
// 🔹 Helper: Ambil user_id dari cookie langsung
// ================================================================
async function getInstagramUserIdFromCookie(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.cookies.get(
      { url: 'https://www.instagram.com', name: 'ds_user_id' },
      (cookie) => resolve(cookie?.value ?? null)
    )
  })
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
