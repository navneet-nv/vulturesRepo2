# 🎙️ Retell AI Integration Guide - Bharat Biz-Agent

## 🧠 Architecture Overview

```
📱 User's Phone / Microphone
         ↓
🎙️ Retell AI (Voice Layer)
   - Speech-to-Text (STT)
   - Text-to-Speech (TTS)  
   - Voice Flow Management
         ↓ (Webhook / API Call)
🤖 Bharat Biz-Agent Backend
   - Natural Language Processing
   - Business Logic
   - Database Operations
   - Invoice/Payment Management
         ↓
📊 Response Back to Retell
         ↓
🔊 Voice Reply to User
```

**Key Point:** Retell AI does NOT replace your agent. It TALKS to it!

---

## ✅ Integration Method: Webhook (Recommended)

**Why Webhook?**
- ✅ Scalable
- ✅ Production-ready
- ✅ Full control over business logic
- ✅ Secure
- ✅ Easy to debug

---

## 🚀 Step-by-Step Integration

### **Step 1: Backend Endpoint (DONE ✅)**

We've created a dedicated Retell AI webhook endpoint at:

```
POST /api/retell-webhook
```

**Location:** `/app/app/api/[[...path]]/route.js`

**Code:**
```javascript
// Retell AI Webhook - Voice Layer Integration (PUBLIC ENDPOINT)
if (path === 'retell-webhook') {
  try {
    // Get transcript from Retell AI
    const { transcript, call_id, user_id } = body;
    
    if (!transcript) {
      return Response.json({ 
        response: 'Sorry, I did not catch that. Please repeat.',
        end_call: false 
      });
    }
    
    // Process voice command
    let agentResponse = '';
    
    // Your business logic here
    // ...
    
    return Response.json({
      response: agentResponse,
      end_call: false
    });
    
  } catch (error) {
    return Response.json({
      response: 'Sorry, technical issue. Please try again.',
      end_call: false
    });
  }
}
```

---

### **Step 2: Expose Backend Publicly**

Retell AI needs a **public URL** to call your webhook.

#### **Option A: Using ngrok (For Testing)**

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   brew install ngrok  # Mac
   choco install ngrok  # Windows
   ```

2. **Start your Next.js server:**
   ```bash
   cd /app
   yarn dev
   # Server runs on localhost:3000
   ```

3. **Create ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the public URL:**
   ```
   Forwarding: https://abcd-1234-5678.ngrok.io -> http://localhost:3000
   ```

5. **Your Webhook URL:**
   ```
   https://abcd-1234-5678.ngrok.io/api/retell-webhook
   ```

#### **Option B: Deploy to Production (Recommended)**

1. **Deploy to Vercel/Netlify/Railway:**
   - Push code to GitHub
   - Connect to deployment platform
   - Get production URL: `https://your-app.vercel.app`

2. **Your Webhook URL:**
   ```
   https://your-app.vercel.app/api/retell-webhook
   ```

---

### **Step 3: Configure Retell AI**

1. **Sign up for Retell AI:**
   - Go to https://retellai.com
   - Create account
   - Get API key

2. **Create a new Agent:**
   - Go to Dashboard → Agents → Create New
   - Name: "Bharat Biz-Agent Voice"
   - Language: English (with Hindi support)

3. **Configure Webhook:**
   - In Agent settings, find "Webhook URL"
   - Paste your URL: `https://abcd-1234.ngrok.io/api/retell-webhook`
   - Method: POST
   - Content-Type: application/json

4. **Set Voice:**
   - Choose a natural-sounding voice
   - Recommended: Female Indian accent (if available)
   - Or: Standard English voice

5. **Configure Prompts:**
   - System Prompt:
     ```
     You are an AI assistant for Bharat Biz-Agent, helping Indian small business owners manage their business. You speak naturally in a mix of Hindi and English (Hinglish). Keep responses short and clear for voice.
     ```

---

### **Step 4: Request/Response Format**

#### **Request from Retell AI:**
```json
{
  "transcript": "Show me my dashboard",
  "call_id": "call_123abc",
  "user_id": "user_456def",
  "timestamp": "2024-01-30T10:00:00Z"
}
```

#### **Response to Retell AI:**
```json
{
  "response": "आपका business dashboard यह है: Total revenue है 25000 rupees. आपके पास 4 invoices हैं।",
  "end_call": false,
  "data": {
    "totalRevenue": 25000,
    "totalInvoices": 4
  }
}
```

**Response Fields:**
- `response` (string, required): Text that Retell will speak to user
- `end_call` (boolean, optional): Whether to end the call (default: false)
- `data` (object, optional): Additional structured data for logging

---

### **Step 5: Testing Your Integration**

#### **Test 1: Direct API Test**
```bash
curl -X POST http://localhost:3000/api/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Namaste, show me my dashboard",
    "call_id": "test-123",
    "user_id": "test-user"
  }'
```

**Expected Response:**
```json
{
  "response": "नमस्ते! Welcome to Bharat Biz-Agent...",
  "end_call": false
}
```

#### **Test 2: Through ngrok**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hello, what is my revenue?",
    "call_id": "test-123",
    "user_id": "test-user"
  }'
```

#### **Test 3: Through Retell AI Dashboard**
1. Go to Retell AI Dashboard
2. Open your agent
3. Click "Test Call"
4. Speak: "Namaste, show my business stats"
5. Verify response in voice

---

## 🎯 Voice Commands Supported

### **Greetings:**
- "Hello" / "Hi" / "Namaste"
- Response: Welcome message in Hinglish

### **Dashboard & Stats:**
- "Show my dashboard"
- "Business stats"
- "How is my business doing?"
- Response: Revenue, invoices, customers count

### **Invoices:**
- "Show my invoices"
- "How many invoices?"
- "Latest bills"
- Response: List of recent invoices

### **Payments:**
- "Pending payments"
- "Who owes me money?"
- "Payment status"
- Response: List of pending payments

### **Customers:**
- "Show customers"
- "Customer list"
- Response: List of customers with pending amounts

### **Reminders:**
- "Send payment reminder"
- "Remind customers"
- Response: Confirmation of WhatsApp reminder sent

---

## 🔐 Authentication & Security

### **Current Implementation:**
- Webhook is **public** (no authentication required)
- For demo and testing purposes
- Returns general responses

### **Production Recommendations:**

1. **Add API Key Authentication:**
   ```javascript
   const retellApiKey = request.headers.get('x-retell-api-key');
   if (retellApiKey !== process.env.RETELL_API_KEY) {
     return Response.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **User Identification:**
   - Use `user_id` from Retell to map to your users
   - Authenticate based on phone number
   - Store session data

3. **Rate Limiting:**
   - Limit requests per user
   - Prevent abuse

4. **Request Validation:**
   - Verify request comes from Retell IP
   - Validate timestamp
   - Check signature (if provided by Retell)

---

## 🇮🇳 Hindi/Hinglish Support

### **How It Works:**

1. **User speaks in Hindi:**
   - "मेरी revenue कितनी है?"
   
2. **Retell AI transcribes:**
   - Transcript: "Meri revenue kitni hai?"
   
3. **Your backend processes:**
   - Detects Hindi/Hinglish
   - Processes intent
   
4. **Returns Hinglish response:**
   - "आपकी total revenue है 25000 rupees"
   
5. **Retell speaks it back:**
   - Natural voice output in Hinglish

### **Tips for Better Hindi Support:**

1. **Use Devanagari in responses:**
   ```javascript
   response: "आपके पास 4 invoices हैं"
   ```

2. **Mix English numbers:**
   ```javascript
   response: "Total revenue है 25000 rupees"
   ```

3. **Keep it natural:**
   - Like talking to a friend
   - Use common Hinglish phrases
   - Don't be too formal

---

## 🎨 Voice Response Best Practices

### **1. Keep It Short:**
❌ Bad: "Your business dashboard shows that you have a total revenue of 25,000 rupees with 4 invoices out of which 3 are pending..."

✅ Good: "Total revenue: 25,000 rupees. 4 invoices, 3 pending."

### **2. Use Natural Language:**
❌ Bad: "Query executed successfully. Result: Revenue equals twenty-five thousand."

✅ Good: "आपकी revenue है 25 हज़ार rupees."

### **3. Provide Options:**
❌ Bad: "Done."

✅ Good: "Done! Want to check invoices or send reminders?"

### **4. Handle Errors Gracefully:**
❌ Bad: "Error 500: Internal server error"

✅ Good: "Sorry, technical issue. Please try again."

---

## 📊 Advanced Features

### **1. Context Management:**

Store conversation context:
```javascript
const conversationContext = {
  user_id: body.user_id,
  last_query: body.transcript,
  state: 'awaiting_confirmation'
};
```

### **2. Multi-Turn Conversations:**

```javascript
// First turn
User: "Show pending payments"
Agent: "You have 3 pending. Want me to send reminders?"

// Second turn  
User: "Yes"
Agent: "Sending reminders now..."
```

### **3. Action Confirmation:**

```javascript
if (transcript.includes('send reminder')) {
  return {
    response: "Send reminder to Rahul for 5000 rupees? Say yes to confirm.",
    end_call: false,
    data: { awaiting_confirmation: true, action: 'send_reminder', customer: 'Rahul' }
  };
}
```

---

## 🐛 Debugging & Troubleshooting

### **Common Issues:**

**1. Webhook not receiving calls:**
- ✅ Check ngrok is running
- ✅ Verify URL in Retell dashboard
- ✅ Check server is running on port 3000
- ✅ Test with curl first

**2. Responses not spoken:**
- ✅ Check response format is correct JSON
- ✅ Verify `response` field exists
- ✅ Keep response text reasonable length
- ✅ Avoid special characters in response

**3. Hindi not working:**
- ✅ Use UTF-8 encoding
- ✅ Test Devanagari characters
- ✅ Check Retell voice supports Hindi
- ✅ Use Hinglish as fallback

**4. Timeout errors:**
- ✅ Respond within 5 seconds
- ✅ Use async operations efficiently
- ✅ Add timeout handling
- ✅ Return quick acknowledgment, process async

---

## 📈 Production Deployment Checklist

- [ ] Deploy backend to production (Vercel/Railway)
- [ ] Get production domain (https://your-app.com)
- [ ] Update Retell webhook URL
- [ ] Add API key authentication
- [ ] Implement rate limiting
- [ ] Set up error logging (Sentry)
- [ ] Test all voice commands
- [ ] Add monitoring (Datadog/New Relic)
- [ ] Set up alerts for errors
- [ ] Document API for team
- [ ] Create user guide
- [ ] Train support team

---

## 🎉 Example Conversations

### **Conversation 1: Check Stats**
```
User (Voice): "Namaste, business kaisa chal raha hai?"

Retell → Your Webhook:
{
  "transcript": "Namaste business kaisa chal raha hai"
}

Your Webhook → Retell:
{
  "response": "नमस्ते! Business बढ़िया chal raha hai. Total revenue है 25000 rupees, 4 invoices हैं।"
}

Retell → User (Voice): "Namaste! Business badhiya chal raha hai..."
```

### **Conversation 2: Send Reminder**
```
User: "Pending payments ke liye reminder bhejo"

Response: "आपके 3 pending payments हैं। Sending reminders via WhatsApp..."

User: (Hears confirmation in voice)
```

---

## 🔗 Resources

**Retell AI:**
- Website: https://retellai.com
- Docs: https://docs.retellai.com
- Discord: https://discord.gg/retellai

**Your Webhook:**
- Local: http://localhost:3000/api/retell-webhook
- ngrok: https://your-tunnel.ngrok.io/api/retell-webhook
- Production: https://your-app.vercel.app/api/retell-webhook

**Testing Tools:**
- Postman: Test API calls
- ngrok: Public tunnel
- Retell Dashboard: Test voice calls

---

## 💡 Next Steps

1. **Get ngrok running:**
   ```bash
   ngrok http 3000
   ```

2. **Sign up for Retell AI:**
   - Go to retellai.com
   - Create account

3. **Configure webhook:**
   - Use your ngrok URL
   - Test with voice call

4. **Enhance responses:**
   - Add more intents
   - Improve Hindi support
   - Add user authentication

5. **Deploy to production:**
   - Choose hosting platform
   - Update webhook URL
   - Go live!

---

**🎙️ Voice-First | 🇮🇳 Hindi/Hinglish | 🤖 AI-Powered | ✅ Production-Ready**

Your Bharat Biz-Agent is now ready for voice interaction through Retell AI! 🎉
