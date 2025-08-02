import { Hono } from 'hono'
import { bcrypt } from 'bcryptjs'
import { html } from 'hono/html'

type Bindings = {
  DB: D1Database
}

type User = {
  id: number
  email: string
  password: string
  created_at: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Inline HTML with modern design
const getLoginPage = (error: string = '') => html`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل الدخول</title>
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
            max-width: 400px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .tabs {
            display: flex;
            background: #f8f9fa;
        }
        
        .tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            background: white;
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }
        
        .form-container {
            padding: 30px;
        }
        
        .form {
            display: none;
        }
        
        .form.active {
            display: block;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .error {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .success {
            background: #efe;
            color: #3c3;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .welcome {
            text-align: center;
            padding: 40px 30px;
        }
        
        .welcome h2 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .logout-btn {
            background: #dc3545;
            margin-top: 20px;
        }
        
        .logout-btn:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>نظام المستخدمين</h1>
            <p>مرحباً بك في منصتنا</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('login')">تسجيل الدخول</button>
            <button class="tab" onclick="showTab('signup')">إنشاء حساب</button>
        </div>
        
        <div class="form-container">
            ${error ? `<div class="error">${error}</div>` : ''}
            
            <!-- Login Form -->
            <form id="loginForm" class="form active" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label for="loginEmail">البريد الإلكتروني</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">كلمة المرور</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn">تسجيل الدخول</button>
            </form>
            
            <!-- Signup Form -->
            <form id="signupForm" class="form" onsubmit="handleSignup(event)">
                <div class="form-group">
                    <label for="signupEmail">البريد الإلكتروني</label>
                    <input type="email" id="signupEmail" required>
                </div>
                <div class="form-group">
                    <label for="signupPassword">كلمة المرور</label>
                    <input type="password" id="signupPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">تأكيد كلمة المرور</label>
                    <input type="password" id="confirmPassword" required minlength="6">
                </div>
                <button type="submit" class="btn">إنشاء حساب</button>
            </form>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all forms
            document.querySelectorAll('.form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected form and activate tab
            if (tabName === 'login') {
                document.getElementById('loginForm').classList.add('active');
                document.querySelectorAll('.tab')[0].classList.add('active');
            } else {
                document.getElementById('signupForm').classList.add('active');
                document.querySelectorAll('.tab')[1].classList.add('active');
            }
        }
        
        async function handleLogin(event) {
            event.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showWelcome(result.user.email);
                } else {
                    showError(result.message || 'فشل تسجيل الدخول');
                }
            } catch (error) {
                showError('حدث خطأ في الاتصال');
            }
        }
        
        async function handleSignup(event) {
            event.preventDefault();
            
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('كلمات المرور غير متطابقة');
                return;
            }
            
            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showWelcome(result.user.email);
                } else {
                    showError(result.message || 'فشل إنشاء الحساب');
                }
            } catch (error) {
                showError('حدث خطأ في الاتصال');
            }
        }
        
        function showWelcome(email) {
            document.querySelector('.container').innerHTML = \`
                <div class="welcome">
                    <h2>مرحباً بك!</h2>
                    <p>تم تسجيل دخولك بنجاح</p>
                    <p><strong>\${email}</strong></p>
                    <button class="btn logout-btn" onclick="logout()">تسجيل الخروج</button>
                </div>
            \`;
        }
        
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            
            const container = document.querySelector('.form-container');
            const existingError = container.querySelector('.error');
            if (existingError) {
                existingError.remove();
            }
            
            container.insertBefore(errorDiv, container.firstChild);
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
        
        function logout() {
            location.reload();
        }
    </script>
</body>
</html>
`

// Routes
app.get('/', (c) => {
  return c.html(getLoginPage())
})

// Signup route
app.post('/signup', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, 400)
    }
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first()
    
    if (existingUser) {
      return c.json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل' }, 400)
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Insert new user
    const result = await c.env.DB.prepare('INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)')
      .bind(email, hashedPassword, new Date().toISOString())
      .run()
    
    if (result.success) {
      const newUser = await c.env.DB.prepare('SELECT id, email, created_at FROM users WHERE email = ?')
        .bind(email)
        .first()
      
      return c.json({ 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح',
        user: newUser
      })
    } else {
      return c.json({ success: false, message: 'فشل إنشاء الحساب' }, 500)
    }
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ success: false, message: 'حدث خطأ في الخادم' }, 500)
  }
})

// Login route
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, 400)
    }
    
    // Find user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first() as User | null
    
    if (!user) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401)
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return c.json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401)
    }
    
    return c.json({ 
      success: true, 
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, message: 'حدث خطأ في الخادم' }, 500)
  }
})

// Admin route to get all users
app.get('/users', async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT id, email, created_at FROM users ORDER BY created_at DESC')
      .all()
    
    return c.json({ 
      success: true, 
      users: users.results 
    })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ success: false, message: 'حدث خطأ في الخادم' }, 500)
  }
})

// Initialize database table on first run
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
    
    return c.json({ 
      success: true, 
      message: 'تم تهيئة قاعدة البيانات بنجاح' 
    })
  } catch (error) {
    console.error('Database init error:', error)
    return c.json({ success: false, message: 'فشل تهيئة قاعدة البيانات' }, 500)
  }
})

export default app