import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { html } from 'hono/html'
import { serveStatic } from 'hono/cloudflare-workers'
import bcrypt from 'bcryptjs'
import type { JwtVariables } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = JwtVariables

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// JWT Middleware for protected routes
const authMiddleware = jwt({ secret: 'your-secret-key-here' })

// HTML Template with inline CSS
const getHtmlTemplate = (message?: string, error?: string) => html`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل الدخول والتسجيل</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            width: 100%;
            max-width: 800px;
            display: flex;
            min-height: 500px;
        }
        
        .form-section {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .form-section:first-child {
            background: #f8f9fa;
            border-left: 1px solid #e9ecef;
        }
        
        h2 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input[type="email"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        .message {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .welcome {
            text-align: center;
            color: #333;
        }
        
        .welcome h1 {
            color: #667eea;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
                max-width: 400px;
            }
            
            .form-section:first-child {
                border-left: none;
                border-bottom: 1px solid #e9ecef;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="form-section">
            <h2>تسجيل مستخدم جديد</h2>
            <form id="signupForm">
                <div class="form-group">
                    <label for="signupEmail">البريد الإلكتروني:</label>
                    <input type="email" id="signupEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="signupPassword">كلمة المرور:</label>
                    <input type="password" id="signupPassword" name="password" required minlength="6">
                </div>
                <button type="submit">إنشاء حساب</button>
            </form>
        </div>
        
        <div class="form-section">
            <h2>تسجيل الدخول</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">البريد الإلكتروني:</label>
                    <input type="email" id="loginEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">كلمة المرور:</label>
                    <input type="password" id="loginPassword" name="password" required>
                </div>
                <button type="submit">دخول</button>
            </form>
        </div>
    </div>

    ${message ? `<div class="message success">${message}</div>` : ''}
    ${error ? `<div class="message error">${error}</div>` : ''}

    <script>
        // Signup Form Handler
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
                    e.target.reset();
                } else {
                    alert(result.error || 'حدث خطأ في إنشاء الحساب');
                }
            } catch (error) {
                alert('حدث خطأ في الاتصال بالخادم');
            }
        });

        // Login Form Handler
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Store token in localStorage
                    localStorage.setItem('token', result.token);
                    // Reload page to show welcome message
                    window.location.reload();
                } else {
                    alert(result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
                }
            } catch (error) {
                alert('حدث خطأ في الاتصال بالخادم');
            }
        });

        // Check if user is logged in
        window.addEventListener('load', async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('/', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.user) {
                            document.body.innerHTML = \`
                                <div class="welcome">
                                    <h1>مرحباً بك!</h1>
                                    <p>تم تسجيل دخولك بنجاح</p>
                                    <p><strong>البريد الإلكتروني:</strong> ${result.user.email}</p>
                                    <button onclick="localStorage.removeItem('token'); window.location.reload();">تسجيل الخروج</button>
                                </div>
                            \`;
                        }
                    }
                } catch (error) {
                    console.error('Error checking auth status:', error);
                }
            }
        });
    </script>
</body>
</html>
`

// Root route - serve HTML
app.get('/', async (c) => {
  const authHeader = c.req.header('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      // Verify token and get user info
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      const { results } = await c.env.DB.prepare(
        'SELECT id, email, created_at FROM users WHERE id = ?'
      ).bind(payload.sub).all()
      
      if (results && results.length > 0) {
        return c.json({ user: results[0] })
      }
    } catch (error) {
      // Invalid token, continue to show login form
    }
  }
  
  return c.html(getHtmlTemplate())
})

// Signup route
app.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, 400)
    }
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (existingUser) {
      return c.json({ error: 'المستخدم موجود بالفعل' }, 400)
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Insert user
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)'
    ).bind(email, hashedPassword, new Date().toISOString()).run()
    
    if (result.success) {
      return c.json({ message: 'تم إنشاء الحساب بنجاح' })
    } else {
      return c.json({ error: 'فشل في إنشاء الحساب' }, 500)
    }
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'حدث خطأ في الخادم' }, 500)
  }
})

// Login route
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400)
    }
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, email, password FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (!user) {
      return c.json({ error: 'المستخدم غير موجود' }, 401)
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return c.json({ error: 'كلمة المرور غير صحيحة' }, 401)
    }
    
    // Create JWT token (simple implementation)
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = { 
      sub: user.id, 
      email: user.email, 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = btoa('your-secret-key-here') // In production, use proper signing
    
    const token = `${encodedHeader}.${encodedPayload}.${signature}`
    
    return c.json({ 
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user.id, email: user.email }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'حدث خطأ في الخادم' }, 500)
  }
})

// Protected route - Get all users (admin only)
app.get('/users', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, email, created_at FROM users ORDER BY created_at DESC'
    ).all()
    
    return c.json({ users: results })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ error: 'حدث خطأ في الخادم' }, 500)
  }
})

// Initialize database table
app.get('/init-db', async (c) => {
  try {
    const result = await c.env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    
    return c.json({ message: 'Database initialized successfully' })
  } catch (error) {
    console.error('Database init error:', error)
    return c.json({ error: 'Failed to initialize database' }, 500)
  }
})

export default app