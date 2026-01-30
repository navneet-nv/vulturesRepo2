import { MongoClient, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}

// Verify JWT Token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const db = await connectToDatabase();
    
    // Public routes
    if (path === 'health') {
      return Response.json({ status: 'ok', message: 'Bharat Biz-Agent API is running' });
    }
    
    // Protected routes - require authentication
    const user = verifyToken(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Dashboard Stats
    if (path === 'dashboard/stats') {
      const invoices = await db.collection('invoices')
        .find({ userId: user.userId })
        .toArray();
      
      const customers = await db.collection('customers')
        .find({ userId: user.userId })
        .toArray();
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const pendingPayments = invoices.filter(inv => inv.status === 'pending').length;
      
      return Response.json({
        totalRevenue,
        totalInvoices: invoices.length,
        pendingPayments,
        totalCustomers: customers.length
      });
    }
    
    // Get all invoices
    if (path === 'invoices') {
      const limit = url.searchParams.get('limit');
      let query = db.collection('invoices')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 });
      
      if (limit) {
        query = query.limit(parseInt(limit));
      }
      
      const invoices = await query.toArray();
      return Response.json(invoices);
    }
    
    // Get single invoice
    if (path.startsWith('invoices/') && path.split('/').length === 2) {
      const invoiceId = path.split('/')[1];
      const invoice = await db.collection('invoices')
        .findOne({ id: invoiceId, userId: user.userId });
      
      if (!invoice) {
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      return Response.json(invoice);
    }
    
    // Get all customers
    if (path === 'customers') {
      const customers = await db.collection('customers')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return Response.json(customers);
    }
    
    // Get all payments
    if (path === 'payments') {
      const payments = await db.collection('payments')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();
      
      return Response.json(payments);
    }
    
    // Get analytics
    if (path === 'analytics') {
      const invoices = await db.collection('invoices')
        .find({ userId: user.userId })
        .toArray();
      
      // Revenue by month
      const revenueByMonth = {};
      invoices.forEach(inv => {
        const month = new Date(inv.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amount;
      });
      
      // Payment status breakdown
      const statusBreakdown = {
        paid: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status === 'pending').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length
      };
      
      return Response.json({
        revenueByMonth,
        statusBreakdown,
        totalRevenue: invoices.reduce((sum, inv) => sum + inv.amount, 0)
      });
    }
    
    return Response.json({ error: 'Route not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    
    // Auth routes
    if (path === 'auth/signup') {
      const { name, phone, businessName, password } = body;
      
      // Check if user exists
      const existingUser = await db.collection('users').findOne({ phone });
      if (existingUser) {
        return Response.json({ error: 'Phone number already registered' }, { status: 400 });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = {
        id: uuidv4(),
        name,
        phone,
        businessName,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      await db.collection('users').insertOne(user);
      
      return Response.json({ message: 'User created successfully', userId: user.id });
    }
    
    if (path === 'auth/login') {
      const { phone, password } = body;
      
      const user = await db.collection('users').findOne({ phone });
      if (!user) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return Response.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          businessName: user.businessName
        }
      });
    }
    
    // Protected routes
    const user = verifyToken(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create invoice
    if (path === 'invoices') {
      const invoice = {
        id: `INV-${Date.now()}`,
        userId: user.userId,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        items: body.items,
        amount: body.amount,
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        gstAmount: body.amount * 0.18, // 18% GST
        totalWithGST: body.amount * 1.18
      };
      
      await db.collection('invoices').insertOne(invoice);
      
      // Create or update customer
      const existingCustomer = await db.collection('customers').findOne({
        userId: user.userId,
        phone: body.customer_phone
      });
      
      if (!existingCustomer) {
        await db.collection('customers').insertOne({
          id: uuidv4(),
          userId: user.userId,
          name: body.customer_name,
          phone: body.customer_phone,
          totalInvoices: 1,
          totalAmount: body.amount,
          pendingAmount: body.amount,
          createdAt: new Date().toISOString()
        });
      } else {
        await db.collection('customers').updateOne(
          { _id: existingCustomer._id },
          {
            $inc: {
              totalInvoices: 1,
              totalAmount: body.amount,
              pendingAmount: body.amount
            }
          }
        );
      }
      
      return Response.json({ message: 'Invoice created successfully', invoice });
    }
    
    // Add customer
    if (path === 'customers') {
      const customer = {
        id: uuidv4(),
        userId: user.userId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        totalInvoices: 0,
        totalAmount: 0,
        pendingAmount: 0,
        createdAt: new Date().toISOString()
      };
      
      await db.collection('customers').insertOne(customer);
      return Response.json({ message: 'Customer added successfully', customer });
    }
    
    // AI Agent conversation
    if (path === 'agent/chat') {
      const { message, language } = body;
      
      // Call Emergent LLM for intent recognition
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMERGENT_LLM_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are Bharat Biz-Agent, an AI assistant for Indian small businesses. You understand Hindi, Hinglish, and English. Extract the intent and parameters from user messages.
              
Possible intents:
              - create_invoice: Create an invoice
              - check_stats: Check business stats
              - send_reminder: Send payment reminder
              - list_invoices: List all invoices
              - check_pending: Check pending payments
              
Respond in JSON format with: {"intent": "intent_name", "params": {}, "message": "response_in_same_language", "needsConfirmation": boolean}`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7
        })
      });
      
      const aiResult = await aiResponse.json();
      let parsedResponse;
      
      try {
        if (aiResult.error) {
          throw new Error(aiResult.error.message || 'AI API error');
        }
        
        if (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message) {
          parsedResponse = JSON.parse(aiResult.choices[0].message.content);
        } else {
          throw new Error('Invalid AI response format');
        }
      } catch (e) {
        console.error('AI parsing error:', e);
        parsedResponse = {
          intent: 'unknown',
          message: `I understand you said: "${message}". Let me help you with that.`,
          needsConfirmation: false
        };
      }
      
      // Execute intent
      let actionResult = null;
      
      if (parsedResponse.intent === 'check_stats') {
        const invoices = await db.collection('invoices').find({ userId: user.userId }).toArray();
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const pendingPayments = invoices.filter(inv => inv.status === 'pending').length;
        
        actionResult = {
          totalRevenue,
          totalInvoices: invoices.length,
          pendingPayments
        };
      } else if (parsedResponse.intent === 'list_invoices') {
        const invoices = await db.collection('invoices')
          .find({ userId: user.userId })
          .limit(5)
          .sort({ createdAt: -1 })
          .toArray();
        
        actionResult = { invoices };
      }
      
      return Response.json({
        ...parsedResponse,
        actionResult
      });
    }
    
    // Send WhatsApp reminder
    if (path.startsWith('payments/') && path.endsWith('/remind')) {
      const invoiceId = path.split('/')[1];
      
      const invoice = await db.collection('invoices').findOne({
        id: invoiceId,
        userId: user.userId
      });
      
      if (!invoice) {
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      // Send WhatsApp message via Twilio
      if (TWILIO_AUTH_TOKEN && TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token_here') {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const whatsappBody = new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: `whatsapp:${invoice.customer_phone}`,
          Body: `नमस्ते ${invoice.customer_name},\n\nYour payment of ₹${invoice.amount} for Invoice #${invoice.id} is pending.\n\nकृपया जल्द से जल्द भुगतान करें।\n\nThank you!\n- ${user.businessName || 'Bharat Biz'}`
        });
        
        try {
          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: whatsappBody
          });
          
          if (twilioResponse.ok) {
            return Response.json({ message: 'Reminder sent successfully via WhatsApp' });
          } else {
            const error = await twilioResponse.text();
            console.error('Twilio error:', error);
            return Response.json({ message: 'Reminder logged (WhatsApp not configured)' });
          }
        } catch (error) {
          console.error('WhatsApp send error:', error);
          return Response.json({ message: 'Reminder logged (WhatsApp error)' });
        }
      } else {
        // Log reminder without sending
        await db.collection('reminders').insertOne({
          invoiceId: invoice.id,
          customerId: invoice.customer_phone,
          sentAt: new Date().toISOString(),
          method: 'whatsapp',
          status: 'pending'
        });
        
        return Response.json({ message: 'Reminder logged (Configure Twilio to send)' });
      }
    }
    
    // Voice to text with Whisper
    if (path === 'voice/transcribe') {
      try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        
        if (!audioFile) {
          return Response.json({ error: 'No audio file provided' }, { status: 400 });
        }
        
        // Convert to blob for OpenAI Whisper API
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
        
        // Create form data for Whisper API
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioBlob, 'audio.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('language', 'hi'); // Hindi but also understands Hinglish
        
        // Call OpenAI Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: whisperFormData
        });
        
        if (!whisperResponse.ok) {
          const error = await whisperResponse.text();
          console.error('Whisper API error:', error);
          return Response.json({ error: 'Transcription failed' }, { status: 500 });
        }
        
        const transcription = await whisperResponse.json();
        return Response.json({ text: transcription.text });
        
      } catch (error) {
        console.error('Voice transcription error:', error);
        return Response.json({ error: error.message }, { status: 500 });
      }
    }
    
    return Response.json({ error: 'Route not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const user = verifyToken(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await connectToDatabase();
    const body = await request.json();
    
    // Update invoice status
    if (path.startsWith('invoices/')) {
      const invoiceId = path.split('/')[1];
      
      const result = await db.collection('invoices').updateOne(
        { id: invoiceId, userId: user.userId },
        { $set: { status: body.status, updatedAt: new Date().toISOString() } }
      );
      
      if (result.matchedCount === 0) {
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      return Response.json({ message: 'Invoice updated successfully' });
    }
    
    return Response.json({ error: 'Route not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  
  try {
    const user = verifyToken(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await connectToDatabase();
    
    // Delete invoice
    if (path.startsWith('invoices/')) {
      const invoiceId = path.split('/')[1];
      
      const result = await db.collection('invoices').deleteOne({
        id: invoiceId,
        userId: user.userId
      });
      
      if (result.deletedCount === 0) {
        return Response.json({ error: 'Invoice not found' }, { status: 404 });
      }
      
      return Response.json({ message: 'Invoice deleted successfully' });
    }
    
    return Response.json({ error: 'Route not found' }, { status: 404 });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}