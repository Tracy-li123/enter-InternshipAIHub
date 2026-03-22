import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // 处理 CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 返回采集脚本
  const collectorScript = `
(function() {
  if (window.zhidaCollector) {
    window.zhidaCollector.collect();
    return;
  }

  window.zhidaCollector = {
    collect: async function() {
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
          sourceUrl: window.location.href,
          source: '拉勾网'
        };
      }
      
      // 字节跳动
      else if (url.includes('bytedance.com') || url.includes('jobs.toutiao.com')) {
        jobInfo = {
          title: document.querySelector('.job-title')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim(),
          company: '字节跳动',
          location: document.querySelector('.location')?.textContent?.trim(),
          description: document.querySelector('.job-description')?.textContent?.trim(),
          sourceUrl: window.location.href,
          source: '字节跳动官网'
        };
      }
      
      // 智联招聘
      else if (url.includes('zhaopin.com')) {
        jobInfo = {
          title: document.querySelector('.job-title')?.textContent?.trim() ||
                 document.querySelector('.summary-plane__title')?.textContent?.trim(),
          company: document.querySelector('.company-name')?.textContent?.trim(),
          location: document.querySelector('.job-location')?.textContent?.trim(),
          salary: document.querySelector('.job-salary')?.textContent?.trim(),
          description: document.querySelector('.job-description')?.textContent?.trim(),
          sourceUrl: window.location.href,
          source: '智联招聘'
        };
      }
      
      if (!jobInfo.title || !jobInfo.company) {
        alert('❌ 未能识别岗位信息，请确保在岗位详情页！');
        return;
      }
      
      // 显示加载提示
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'zhida-loading';
      loadingDiv.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px 40px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 999999;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      \`;
      loadingDiv.innerHTML = \`
        <div style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">正在采集岗位信息...</div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}</style>
      \`;
      document.body.appendChild(loadingDiv);
      
      try {
        const response = await fetch('https://mqlhknolbjnsfrqyzidh.supabase.co/functions/v1/import-job-from-extension', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhrbm9sYmpuc2ZycXl6aWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1MjU0MjYsImV4cCI6MjA1NTEwMTQyNn0.ySEKWUXAGIOJi-MlKg-vfGFZQUwX0PU2z_ycAW_vF8E'
          },
          body: JSON.stringify(jobInfo)
        });
        
        const result = await response.json();
        document.body.removeChild(loadingDiv);
        
        if (result.success) {
          const successDiv = document.createElement('div');
          successDiv.style.cssText = loadingDiv.style.cssText;
          successDiv.innerHTML = \`
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <div style="font-size: 18px; font-weight: 600; color: #10b981; margin-bottom: 8px;">采集成功！</div>
            <div style="font-size: 14px; color: #666; margin-bottom: 15px;">\${jobInfo.title}</div>
            <button onclick="this.parentElement.remove()" style="padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">关闭</button>
          \`;
          document.body.appendChild(successDiv);
          setTimeout(() => successDiv.remove(), 3000);
        } else {
          throw new Error(result.error || '采集失败');
        }
      } catch (error) {
        document.body.removeChild(loadingDiv);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = loadingDiv.style.cssText;
        errorDiv.innerHTML = \`
          <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
          <div style="font-size: 18px; font-weight: 600; color: #f44336; margin-bottom: 8px;">采集失败</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">\${error.message}</div>
          <button onclick="this.parentElement.remove()" style="padding: 8px 20px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">关闭</button>
        \`;
        document.body.appendChild(errorDiv);
      }
    }
  };
  
  window.zhidaCollector.collect();
})();
`;

  return new Response(collectorScript, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
});
