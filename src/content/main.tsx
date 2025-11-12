import { getUserIdFromPage } from '@/services/instagram'

console.log('[CRXJS] Hello world from content script!')

// Pastikan bisa diakses via message
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_USER_ID_FROM_PAGE') {
    const userId = getUserIdFromPage()
    sendResponse({ userId })
  }
})
