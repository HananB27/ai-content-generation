const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate a Reddit-style card image from title text
 */
async function generateRedditCardImage(title, outputPath, options = {}) {
  const {
    username = 'StoryTeller',
    likes = '99+',
    comments = '99+'
  } = options;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 800px;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .card {
          background: white;
          border-radius: 20px;
          width: 750px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #ef4444);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .username {
          font-weight: bold;
          font-size: 20px;
          color: #111;
        }
        .badge {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge svg {
          width: 14px;
          height: 14px;
          fill: white;
        }
        .title {
          font-size: 22px;
          line-height: 1.4;
          color: #1f2937;
          margin-bottom: 16px;
        }
        .footer {
          display: flex;
          gap: 24px;
          color: #6b7280;
          font-size: 16px;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat svg {
          width: 22px;
          height: 22px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="avatar">🎭</div>
          <span class="username">${username}</span>
          <div class="badge">
            <svg viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
          </div>
        </div>
        <div class="title">${title}</div>
        <div class="footer">
          <div class="stat">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            <span>${likes}</span>
          </div>
          <div class="stat">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span>${comments}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 400 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: true
    });
    
    console.log(`Reddit card image generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating Reddit card:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generateRedditCardImage };
