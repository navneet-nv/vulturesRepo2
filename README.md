# 🎨 Bharat Biz-Agent - AI-Powered Business Assistant

**An autonomous AI co-pilot for Indian Small and Medium Businesses (SMBs)**

[![Made for India](https://img.shields.io/badge/Made%20for-India%20🇮🇳-orange)](https://github.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://mongodb.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-purple)](https://openai.com/)

---

## 🌟 Overview

Bharat Biz-Agent is designed to solve the "Digital Fragmentation & Operational Friction" challenge faced by India's 60+ million SMBs. It's not just a chatbot—it's an **action-oriented AI agent** that executes real business tasks through natural conversation.

### Key Features

✅ **Autonomous Task Execution**
- Create and send invoices automatically
- Track payments and send WhatsApp reminders
- Manage customer database
- Generate business analytics

✅ **India-First Design**
- Multilingual support (Hindi, Hinglish, English)
- Voice-first interaction (Speech-to-Text)
- GST compliance built-in
- UPI payment tracking
- Mobile-first responsive design

✅ **WhatsApp Integration**
- Send invoices via WhatsApp
- Automated payment reminders
- Natural language commands

✅ **AI Conversational Agent**
- Understands mixed-language inputs
- Intent recognition and execution
- Human-in-the-loop confirmations for sensitive actions
- Context-aware follow-ups

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with Hooks
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Recharts** for analytics
- **Sonner** for notifications

### Backend
- **Next.js API Routes**
- **MongoDB** for database
- **JWT** authentication
- **bcryptjs** for password hashing

### AI & Integrations
- **OpenAI GPT-4** (via Emergent LLM) - Conversational AI
- **OpenAI Whisper** - Speech-to-Text
- **Twilio WhatsApp API** - Messaging

---

## 📁 Project Structure

```
bharat-biz-agent/
├── app/
│   ├── api/[[...path]]/
│   │   └── route.js           # All API endpoints
│   ├── login/
│   │   └── page.js            # Login page
│   ├── signup/
│   │   └── page.js            # Signup page
│   ├── page.js                # Main dashboard (all pages in one)
│   ├── layout.js              # Root layout
│   └── globals.css            # Global styles
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   └── utils.js               # Utility functions
├── .env                       # Environment variables
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- MongoDB 6.0+
- API Keys:
  - OpenAI API Key
  - Twilio Account (for WhatsApp)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bharat-biz-agent
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment variables**

Create or update `.env` file:
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=bharat_biz_agent

# API Keys
OPENAI_API_KEY=your_openai_key_here
EMERGENT_LLM_KEY=your_emergent_llm_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Security
JWT_SECRET=your_secure_random_string_here

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Start MongoDB** (if not running)
```bash
sudo systemctl start mongodb
# or
mongod --dbpath /path/to/data
```

5. **Run the development server**
```bash
yarn dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 User Guide

### 1. Authentication

**Signup Flow:**
1. Go to `/signup`
2. Enter your name, business name, phone number (+91XXXXXXXXXX), and password
3. Click "Sign Up"
4. Redirects to login page

**Login Flow:**
1. Go to `/login`
2. Enter phone number and password
3. Click "Sign In"
4. Redirects to dashboard

### 2. Dashboard Features

#### Home Dashboard
- View total revenue, invoices, pending payments, and customer count
- See recent invoices with quick actions
- Send payment reminders with one click

#### Create Invoice
1. Click "Create Invoice" button
2. Enter customer name and phone number
3. Add items with description, quantity, and price
4. System automatically calculates GST (18%)
5. Click "Create Invoice"

#### Invoices Page
- View all invoices in a table
- Filter by status (paid/pending)
- Send WhatsApp reminders for pending payments
- Download PDFs (coming soon)

#### Customers Page
- View all customers
- See total invoices and amounts per customer
- Track pending amounts (Udhaar)

#### Analytics Page
- Payment status breakdown (paid, pending, overdue)
- Revenue trends
- Business insights

### 3. AI Agent Chat

**How to use:**
1. Click "AI Agent Chat" button (purple gradient button)
2. Type or speak your command
3. AI understands Hindi, Hinglish, and English

**Voice Input (Speech-to-Text):**
1. Click the microphone button (🎤) in the AI chat modal
2. Allow microphone access when prompted
3. Speak clearly in Hindi, Hinglish, or English
4. Click "Stop Recording" when done
5. System automatically transcribes using OpenAI Whisper
6. Transcribed text appears in the text box
7. Click "Send Message" to get AI response

**Example Voice Commands:**
```
Hindi: "Kitne total invoices hain?"
Hinglish: "Rahul ko 500 rupees ka bill bhejo"
English: "Show me pending payments"
Mixed: "मेरी total revenue कितनी है?"
```

**What AI Agent Can Do:**
- ✅ Check business statistics
- ✅ List invoices
- ✅ Create invoices (with confirmation)
- ✅ Send payment reminders
- ✅ Answer business questions

**Voice Recognition Features:**
- 🗣️ Multi-language support (Hindi, Hinglish, English)
- 🎯 High accuracy with OpenAI Whisper
- ⚡ Real-time transcription
- 🔴 Visual recording indicator
- ✅ Transcription confirmation

---

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "Rahul Kumar",
  "phone": "+919876543210",
  "businessName": "Kumar Textiles",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "userId": "uuid"
}
```

#### POST `/api/auth/login`
Login to existing account.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "Rahul Kumar",
    "phone": "+919876543210",
    "businessName": "Kumar Textiles"
  }
}
```

### Protected Endpoints (Require Authorization Header)

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

#### GET `/api/dashboard/stats`
Get dashboard statistics.

**Response:**
```json
{
  "totalRevenue": 50000,
  "totalInvoices": 10,
  "pendingPayments": 3,
  "totalCustomers": 5
}
```

#### GET `/api/invoices`
Get all invoices.

**Query Parameters:**
- `limit` (optional): Limit number of results

**Response:**
```json
[
  {
    "id": "INV-1234567890",
    "customer_name": "Amit Sharma",
    "customer_phone": "+919999888877",
    "amount": 5000,
    "status": "pending",
    "date": "2024-01-30T10:00:00Z",
    "items": [...]
  }
]
```

#### POST `/api/invoices`
Create a new invoice.

**Request Body:**
```json
{
  "customer_name": "Amit Sharma",
  "customer_phone": "+919999888877",
  "items": [
    {
      "description": "Cotton Fabric",
      "quantity": 10,
      "price": 500
    }
  ],
  "amount": 5000
}
```

#### GET `/api/customers`
Get all customers.

#### POST `/api/customers`
Add a new customer.

#### GET `/api/analytics`
Get business analytics.

#### POST `/api/agent/chat`
Chat with AI agent.

**Request Body:**
```json
{
  "message": "Kitne pending payments hain?",
  "language": "hinglish"
}
```

#### POST `/api/payments/{invoiceId}/remind`
Send WhatsApp payment reminder.

#### POST `/api/voice/transcribe`
Transcribe audio to text using OpenAI Whisper.

**Request Body (FormData):**
```
audio: <audio file (webm format)>
```

**Response:**
```json
{
  "text": "Transcribed text in Hindi/Hinglish/English"
}
```

**Supported Languages:**
- Hindi (हिंदी)
- Hinglish (Hindi + English mix)
- English
- Automatic language detection

---

## 🎯 Problem Statement Alignment

This project addresses **Neurathon 2026 Problem Statement 2: The Bharat Biz-Agent**.

### Requirements Met:

✅ **Localization & Cultural Context**
- Multilingual support (Hindi/Hinglish/English)
- India-specific business logic (GST, UPI)
- Code-mixed input handling

✅ **Integration & Autonomy**
- WhatsApp-first standard
- Autonomous task execution
- Human-in-the-loop safety

✅ **Latency & Performance**
- Lightweight architecture
- Works on slower connections
- Mobile-first design

✅ **Frictionless UI/UX**
- Voice-first interaction ready
- Zero-training interface
- Natural language commands

### Key Features Implemented:

1. **Autonomous Task Execution** ✅
   - Auto-generate invoices
   - Send WhatsApp reminders
   - Update databases

2. **Unstructured Data Processing** 🚧
   - Voice notes (ready for integration)
   - Photo OCR (planned)

3. **Context-Aware Follow-ups** ✅
   - Proactive reminders
   - Smart suggestions

4. **India-First Engineering** ✅
   - GST calculations
   - Phone-based authentication
   - Vernacular support

---

## 🔐 Security Features

- **JWT Authentication** with 7-day expiry
- **Password Hashing** with bcryptjs (salt rounds: 10)
- **Secure API Routes** with token verification
- **Human Confirmation** for sensitive operations
- **Environment Variables** for sensitive keys

---

## 🚧 Roadmap & Future Enhancements

### Phase 1 (Current) ✅
- [x] User authentication
- [x] Invoice management
- [x] Customer tracking
- [x] AI agent chat
- [x] WhatsApp reminders

### Phase 2 (Planned)
- [x] PDF invoice generation
- [x] Email integration
- [x] Voice input with Whisper
- [ ] OCR for handwritten bills
- [ ] Inventory management

### Phase 3 (Future)
- [ ] GST filing automation
- [ ] Bank reconciliation
- [ ] Advanced analytics with charts
- [ ] Multi-user/team support
- [ ] Mobile apps (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is built for **Neurathon 2026** hackathon.

---

## 👥 Team

Built with ❤️ for Indian SMBs

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@bharatbiz.example.com

---

## 🙏 Acknowledgments

- **Neurathon 2026** for the problem statement
- **Indian SMB community** for inspiration
- **shadcn/ui** for beautiful components
- **OpenAI** for AI capabilities
- **Twilio** for WhatsApp integration

---

**Made in India 🇮🇳 | For India 🇮🇳**
