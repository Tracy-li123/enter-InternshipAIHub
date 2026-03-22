// 默认平台地址
const DEFAULT_PLATFORM_URL = 'http://localhost:5173';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 加载保存的平台地址
  const result = await chrome.storage.sync.get(['platformUrl']);
  const platformUrl = result.platformUrl || DEFAULT_PLATFORM_URL;
  document.getElementById('platformUrl').value = platformUrl;
  
  // 保存平台地址
  document.getElementById('platformUrl').addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ platformUrl: e.target.value });
  });
  
  // 检测当前网站
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  detectWebsite(tab.url);
  
  // 采集按钮
  document.getElementById('extractBtn').addEventListener('click', extractJobInfo);
  
  // 打开平台按钮
  document.getElementById('openPlatformBtn').addEventListener('click', async () => {
    const result = await chrome.storage.sync.get(['platformUrl']);
    const url = result.platformUrl || DEFAULT_PLATFORM_URL;
    chrome.tabs.create({ url });
  });
});

// 检测当前网站
function detectWebsite(url) {
  const websiteNameEl = document.getElementById('websiteName');
  const websiteStatusEl = document.getElementById('websiteStatus');
  
  if (url.includes('zhipin.com')) {
    websiteNameEl.textContent = 'BOSS直聘';
    websiteStatusEl.textContent = '已检测到岗位详情页';
  } else if (url.includes('lagou.com')) {
    websiteNameEl.textContent = '拉勾网';
    websiteStatusEl.textContent = '已检测到岗位详情页';
  } else if (url.includes('bytedance.com')) {
    websiteNameEl.textContent = '字节跳动招聘';
    websiteStatusEl.textContent = '已检测到岗位详情页';
  } else if (url.includes('tencent.com')) {
    websiteNameEl.textContent = '腾讯招聘';
    websiteStatusEl.textContent = '已检测到岗位详情页';
  } else if (url.includes('alibaba.com')) {
    websiteNameEl.textContent = '阿里巴巴招聘';
    websiteStatusEl.textContent = '已检测到岗位详情页';
  } else {
    websiteNameEl.textContent = '未知网站';
    websiteStatusEl.textContent = '请访问支持的招聘网站';
    document.getElementById('extractBtn').disabled = true;
  }
}

// 采集岗位信息
async function extractJobInfo() {
  const loadingEl = document.getElementById('loading');
  const extractBtn = document.getElementById('extractBtn');
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  
  // 清除之前的消息
  successMsg.classList.remove('active');
  errorMsg.classList.remove('active');
  
  // 显示加载状态
  loadingEl.classList.add('active');
  extractBtn.disabled = true;
  
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 执行内容脚本采集信息
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageInfo
    });
    
    const jobInfo = results[0].result;
    
    if (!jobInfo || !jobInfo.title) {
      throw new Error('未能获取岗位信息，请确保在岗位详情页');
    }
    
    // 发送到平台
    const result = await chrome.storage.sync.get(['platformUrl']);
    const platformUrl = result.platformUrl || DEFAULT_PLATFORM_URL;
    
    // 这里需要调用您平台的API
    console.log('采集到的岗位信息:', jobInfo);
    console.log('将发送到:', platformUrl);
    
    // 模拟成功
    successMsg.textContent = `✅ 成功采集《${jobInfo.title}》`;
    successMsg.classList.add('active');
    
    // 保存到本地存储
    const saved = await chrome.storage.local.get(['savedJobs']) || { savedJobs: [] };
    saved.savedJobs = saved.savedJobs || [];
    saved.savedJobs.push({
      ...jobInfo,
      savedAt: new Date().toISOString()
    });
    await chrome.storage.local.set(saved);
    
  } catch (error) {
    console.error('采集失败:', error);
    errorMsg.textContent = `❌ ${error.message}`;
    errorMsg.classList.add('active');
  } finally {
    loadingEl.classList.remove('active');
    extractBtn.disabled = false;
  }
}

// 在页面中执行的采集函数
function extractPageInfo() {
  const url = window.location.href;
  let jobInfo = {};
  
  // BOSS直聘
  if (url.includes('zhipin.com')) {
    jobInfo = {
      title: document.querySelector('.job-title')?.textContent?.trim() || 
             document.querySelector('.name')?.textContent?.trim(),
      company: document.querySelector('.company-name')?.textContent?.trim() ||
               document.querySelector('.sider-company a')?.textContent?.trim(),
      location: document.querySelector('.location-address')?.textContent?.trim() ||
                document.querySelector('.job-location')?.textContent?.trim(),
      salary: document.querySelector('.salary')?.textContent?.trim(),
      description: document.querySelector('.job-sec-text')?.textContent?.trim() ||
                   document.querySelector('.job-detail')?.textContent?.trim(),
      requirements: document.querySelector('.job-require')?.textContent?.trim(),
      sourceUrl: window.location.href,
      source: 'BOSS直聘'
    };
  }
  
  // 拉勾网
  else if (url.includes('lagou.com')) {
    jobInfo = {
      title: document.querySelector('.job-name')?.textContent?.trim(),
      company: document.querySelector('.company')?.textContent?.trim(),
      location: document.querySelector('.work_addr')?.textContent?.trim(),
      salary: document.querySelector('.salary')?.textContent?.trim(),
      description: document.querySelector('.job-detail')?.textContent?.trim() ||
                   document.querySelector('.job_bt')?.textContent?.trim(),
      requirements: document.querySelector('.job_request')?.textContent?.trim(),
      sourceUrl: window.location.href,
      source: '拉勾网'
    };
  }
  
  // 字节跳动
  else if (url.includes('bytedance.com')) {
    jobInfo = {
      title: document.querySelector('.job-title')?.textContent?.trim() ||
             document.querySelector('h1')?.textContent?.trim(),
      company: '字节跳动',
      location: document.querySelector('.location')?.textContent?.trim(),
      description: document.querySelector('.job-description')?.textContent?.trim() ||
                   Array.from(document.querySelectorAll('div')).find(el => 
                     el.textContent.includes('职位描述') || el.textContent.includes('Job Description')
                   )?.textContent?.trim(),
      sourceUrl: window.location.href,
      source: '字节跳动官网'
    };
  }
  
  // 清理数据
  Object.keys(jobInfo).forEach(key => {
    if (typeof jobInfo[key] === 'string') {
      jobInfo[key] = jobInfo[key].replace(/\s+/g, ' ').trim();
    }
  });
  
  return jobInfo;
}
