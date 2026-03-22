// Supabase 配置
const SUPABASE_URL = 'https://mqlhknolbjnsfrqyzidh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhrbm9sYmpuc2ZycXl6aWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1MjU0MjYsImV4cCI6MjA1NTEwMTQyNn0.ySEKWUXAGIOJi-MlKg-vfGFZQUwX0PU2z_ycAW_vF8E';

// 默认平台地址（前端页面）
const DEFAULT_PLATFORM_URL = 'http://localhost:5173';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 检测当前网站
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  detectWebsite(tab.url);
  
  // 采集按钮
  document.getElementById('extractBtn').addEventListener('click', extractJobInfo);
  
  // 打开平台按钮 - 打开用户的实际平台
  document.getElementById('openPlatformBtn').addEventListener('click', async () => {
    // 打开预览地址或localhost
    chrome.tabs.create({ url: 'http://localhost:5173' });
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
    
    // 发送到Supabase Edge Function API
    const apiUrl = `${SUPABASE_URL}/functions/v1/import-job-from-extension`;
    
    console.log('采集到的岗位信息:', jobInfo);
    console.log('发送到Supabase API:', apiUrl);
    
    // 发送到后端API
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(jobInfo)
      });
      
      const apiResult = await response.json();
      
      if (apiResult.success) {
        if (apiResult.isDuplicate) {
          successMsg.textContent = `ℹ️ 《${jobInfo.title}》已存在于平台`;
        } else {
          successMsg.textContent = `✅ 成功导入《${jobInfo.title}》到平台`;
        }
        successMsg.classList.add('active');
      } else {
        throw new Error(apiResult.error || '导入失败');
      }
    } catch (apiError) {
      console.error('API调用失败:', apiError);
      // API失败时，保存到本地存储作为备份
      const saved = await chrome.storage.local.get(['savedJobs']) || { savedJobs: [] };
      saved.savedJobs = saved.savedJobs || [];
      saved.savedJobs.push({
        ...jobInfo,
        savedAt: new Date().toISOString()
      });
      await chrome.storage.local.set(saved);
      
      errorMsg.textContent = `⚠️ 已保存到本地，但同步失败: ${apiError.message}`;
      errorMsg.classList.add('active');
      return;
    }
    
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
