// Background service worker
console.log('职达实习生后台服务已启动');

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // 无法直接打开popup，可以打开新标签页
    chrome.action.openPopup();
  }
  return true;
});

// 安装时的欢迎页面
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('插件已安装');
    // 可以打开欢迎页面
    // chrome.tabs.create({ url: 'welcome.html' });
  }
});
