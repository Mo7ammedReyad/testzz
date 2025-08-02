import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('*', cors())

// Function to generate random ID
function generateRandomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Function to get HTML template
function getHtmlTemplate(userId?: string, messages?: any[]) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>دردشة مجهولة</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 15px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 800px;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .content {
      padding: 20px;
    }
    
    .user-id {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .user-id h3 {
      color: #495057;
      margin-bottom: 10px;
    }
    
    .id-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .id-value {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      padding: 8px 15px;
      font-weight: bold;
      color: #495057;
      font-size: 18px;
    }
    
    .copy-btn {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 8px 15px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .copy-btn:hover {
      background: #5a6fd8;
    }
    
    .message-form {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #495057;
      font-weight: 500;
    }
    
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 5px;
      font-size: 16px;
    }
    
    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }
    
    .send-btn {
      background: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .send-btn:hover {
      background: #218838;
    }
    
    .messages-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }
    
    .messages-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .messages-header h3 {
      color: #495057;
    }
    
    .refresh-btn {
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 5px 10px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .refresh-btn:hover {
      background: #138496;
    }
    
    .message-item {
      background: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      color: #6c757d;
    }
    
    .message-content {
      color: #495057;
      line-height: 1.5;
    }
    
    .no-messages {
      text-align: center;
      color: #6c757d;
      padding: 20px;
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .notification.show {
      opacity: 1;
    }
    
    .notification.error {
      background: #dc3545;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>دردشة مجهولة</h1>
      <p>تواصل مع الآخرين بدون تسجيل دخول</p>
    </div>
    
    <div class="content">
      <div class="user-id">
        <h3>معرفك الخاص</h3>
        <div class="id-display">
          <div class="id-value" id="userId">${userId || 'جاري التحميل...'}</div>
          <button class="copy-btn" onclick="copyUserId()">نسخ</button>
        </div>
      </div>
      
      <div class="message-form">
        <h3>إرسال رسالة</h3>
        <form id="messageForm">
          <div class="form-group">
            <label for="toId">معرف المستلم</label>
            <input type="text" id="toId" placeholder="أدخل معرف المستلم" required>
          </div>
          <div class="form-group">
            <label for="message">الرسالة</label>
            <textarea id="message" placeholder="اكتب رسالتك هنا" required></textarea>
          </div>
          <button type="submit" class="send-btn">إرسال</button>
        </form>
      </div>
      
      <div class="messages-section">
        <div class="messages-header">
          <h3>الرسائل الواردة</h3>
          <button class="refresh-btn" onclick="loadMessages()">تحديث</button>
        </div>
        <div id="messagesContainer">
          ${messages ? messages.map((msg: any) => `
            <div class="message-item">
              <div class="message-header">
                <span>من: ${msg.from_id}</span>
                <span>${new Date(msg.sent_at).toLocaleString('ar-EG')}</span>
              </div>
              <div class="message-content">${msg.message}</div>
            </div>
          `).join('') : '<div class="no-messages">لا توجد رسائل</div>'}
        </div>
      </div>
    </div>
  </div>
  
  <div class="notification" id="notification"></div>
  
  <script>
    let currentUserId = '${userId || ''}';
    
    // Copy user ID to clipboard
    function copyUserId() {
      const userIdElement = document.getElementById('userId');
      navigator.clipboard.writeText(userIdElement.textContent)
        .then(() => showNotification('تم نسخ المعرف بنجاح'))
        .catch(err => showNotification('فشل نسخ المعرف', true));
    }
    
    // Show notification
    function showNotification(message, isError = false) {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.classList.add('show');
      if (isError) notification.classList.add('error');
      
      setTimeout(() => {
        notification.classList.remove('show');
        if (isError) notification.classList.remove('error');
      }, 3000);
    }
    
    // Send message
    document.getElementById('messageForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const toId = document.getElementById('toId').value;
      const message = document.getElementById('message').value;
      
      try {
        const response = await fetch('/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from_id: currentUserId,
            to_id: toId,
            message: message
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          showNotification('تم إرسال الرسالة بنجاح');
          document.getElementById('messageForm').reset();
        } else {
          showNotification(result.error || 'فشل إرسال الرسالة', true);
        }
      } catch (error) {
        showNotification('حدث خطأ أثناء إرسال الرسالة', true);
      }
    });
    
    // Load messages
    async function loadMessages() {
      try {
        const response = await fetch(\`/inbox/\${currentUserId}\`);
        const messages = await response.json();
        
        const container = document.getElementById('messagesContainer');
        
        if (messages.length === 0) {
          container.innerHTML = '<div class="no-messages">لا توجد رسائل</div>';
        } else {
          container.innerHTML = messages.map(msg => \`
            <div class="message-item">
              <div class="message-header">
                <span>من: \${msg.from_id}</span>
                <span>\${new Date(msg.sent_at).toLocaleString('ar-EG')}</span>
              </div>
              <div class="message-content">\${msg.message}</div>
            </div>
          \`).join('');
        }
      } catch (error) {
        showNotification('حدث خطأ أثناء تحميل الرسائل', true);
      }
    }
    
    // Initialize
    if (!currentUserId) {
      window.location.href = '/init';
    } else {
      loadMessages();
    }
  </script>
</body>
</html>
`
}

// Main route - serve HTML
app.get('/', async (c) => {
  // Check if user has an ID in cookie
  const userId = c.req.cookie('userId')
  
  if (userId) {
    // Check if user exists in database
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    
    if (user) {
      // Get user messages
      const messages = await c.env.DB.prepare('SELECT * FROM messages WHERE to_id = ? ORDER BY sent_at DESC').bind(userId).all()
      
      return c.html(getHtmlTemplate(userId, messages.results))
    }
  }
  
  // Redirect to init if no user ID
  return c.redirect('/init')
})

// Init route - create new user
app.get('/init', async (c) => {
  // Generate new user ID
  const userId = generateRandomId()
  
  // Insert user into database
  try {
    await c.env.DB.prepare('INSERT INTO users (id) VALUES (?)').bind(userId).run()
    
    // Set cookie
    c.header('Set-Cookie', `userId=${userId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`)
    
    // Redirect to main page
    return c.redirect('/')
  } catch (error) {
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Send message route
app.post('/send', async (c) => {
  const { from_id, to_id, message } = await c.req.json()
  
  if (!from_id || !to_id || !message) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  
  // Check if recipient exists
  const recipient = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(to_id).first()
  
  if (!recipient) {
    return c.json({ error: 'Recipient not found' }, 404)
  }
  
  // Insert message into database
  try {
    await c.env.DB.prepare('INSERT INTO messages (from_id, to_id, message) VALUES (?, ?, ?)').bind(from_id, to_id, message).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to send message' }, 500)
  }
})

// Get inbox route
app.get('/inbox/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const messages = await c.env.DB.prepare('SELECT * FROM messages WHERE to_id = ? ORDER BY sent_at DESC').bind(id).all()
    
    return c.json(messages.results)
  } catch (error) {
    return c.json({ error: 'Failed to retrieve messages' }, 500)
  }
})

export default app