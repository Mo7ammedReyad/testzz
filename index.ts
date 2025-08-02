import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { v4 as uuidv4 } from 'uuid'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()
app.use('*', cors())

// HTML Template
const htmlTemplate = (userId: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChatBot Anon</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: auto; padding: 2rem; }
    input, textarea { width: 100%; padding: 0.5rem; margin: 0.5rem 0; }
    button { padding: 0.5rem 1rem; }
    .msg { border: 1px solid #ccc; padding: 0.5rem; margin: 0.5rem 0; }
  </style>
</head>
<body>
  <h2>أهلاً بيك! رقمك التعريفي: <code>${userId}</code></h2>
  <h3>ارسل رسالة:</h3>
  <form method="POST" action="/send">
    <input type="hidden" name="from_id" value="${userId}" />
    <label>إلى (رقم تعريف):</label>
    <input type="text" name="to_id" required />
    <label>الرسالة:</label>
    <textarea name="message" required></textarea>
    <button type="submit">إرسال</button>
  </form>

  <h3>📩 رسائلك:</h3>
  <div id="inbox"></div>
  <script>
    fetch('/inbox/${userId}').then(res => res.json()).then(data => {
      const inbox = document.getElementById('inbox');
      inbox.innerHTML = data.messages.map(m => '<div class="msg">' + m.message + '</div>').join('');
    });
  </script>
</body>
</html>
`;

// توليد هوية جديدة وزيارة الصفحة
app.get('/', async (c) => {
  const id = uuidv4().slice(0, 8)
  await c.env.DB.prepare('INSERT INTO users (id) VALUES (?)').bind(id).run()
  return c.html(htmlTemplate(id))
})

// إرسال رسالة
app.post('/send', async (c) => {
  const data = await c.req.parseBody()
  const from = data['from_id']
  const to = data['to_id']
  const message = data['message']
  await c.env.DB.prepare('INSERT INTO messages (from_id, to_id, message) VALUES (?, ?, ?)')
    .bind(from, to, message).run()
  return c.text('تم الإرسال!')
})

// عرض الرسائل لمستخدم معين
app.get('/inbox/:id', async (c) => {
  const id = c.req.param('id')
  const { results } = await c.env.DB.prepare('SELECT message FROM messages WHERE to_id = ? ORDER BY sent_at DESC')
    .bind(id).all()
  return c.json({ messages: results })
})

export default app