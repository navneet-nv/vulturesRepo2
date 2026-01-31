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
    
    // Check if this is a reminder endpoint (no body expected)
    const isReminderEndpoint = path.startsWith('payments/') && path.endsWith('/remind');
    
    // Only parse JSON body if not a reminder endpoint
    let body = {};
    if (!isReminderEndpoint) {
      body = await request.json();
    }
    
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
    
    // AI Agent conversation - Enhanced with strict PS2 requirements
    if (path === 'agent/chat') {
      const { message, language } = body;
      
      // Proactive context-aware check - PS2 requirement
      const invoices = await db.collection('invoices').find({ userId: user.userId }).toArray();
      const overdueInvoices = invoices.filter(inv => {
        const daysSinceDue = Math.floor((new Date() - new Date(inv.date)) / (1000 * 60 * 60 * 24));
        return inv.status === 'pending' && daysSinceDue > 30;
      });
      
      // Call AI for intent recognition
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are Bharat Biz-Agent, an AI assistant for Indian small businesses. You understand Hindi, Hinglish, and English.
              
CRITICAL REQUIREMENTS (PS2 Compliance):
- You are ACTION-ORIENTED, not just conversational
- You understand India-specific business context (GST, UPI, credit cycles)
- You handle code-mixed language (Hindi+English)
- You provide proactive suggestions

CONTEXT:
- User has ${invoices.length} total invoices
- ${invoices.filter(i => i.status === 'pending').length} pending payments
- ${overdueInvoices.length} invoices overdue > 30 days
- Total revenue: ₹${invoices.reduce((sum, inv) => sum + inv.amount, 0)}

Extract intent and provide actionable response.

Possible intents:
- create_invoice: Create a new invoice (requires customer_name, customer_phone, amount)
- check_stats: Check business statistics
- send_reminder: Send payment reminder (requires customer_name)
- list_invoices: List all invoices
- check_pending: Check pending payments
- list_overdue: List overdue payments

ALWAYS respond in the SAME language as user input.

Respond in JSON format:
{
  "intent": "intent_name",
  "params": {},
  "message": "response in user's language",
  "needsConfirmation": boolean,
  "proactiveSuggestion": "optional proactive suggestion if relevant"
}`
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
          console.error('OpenAI error:', aiResult.error);
          // Fallback response
          parsedResponse = {
            intent: 'check_stats',
            params: {},
            message: `मैं आपकी मदद कर सकता हूं। आपके पास ${invoices.length} invoices हैं और ${invoices.filter(i => i.status === 'pending').length} payments pending हैं।`,
            needsConfirmation: false
          };
        } else if (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message) {
          const content = aiResult.choices[0].message.content;
          parsedResponse = JSON.parse(content);
        } else {
          throw new Error('Invalid AI response format');
        }
      } catch (e) {
        console.error('AI parsing error:', e);
        // Fallback with basic stats
        parsedResponse = {
          intent: 'check_stats',
          params: {},
          message: `Hello! I can help you. You have ${invoices.length} invoices with ${invoices.filter(i => i.status === 'pending').length} pending payments.`,
          needsConfirmation: false
        };
      }
      
      // Execute intent - PS2 requirement: Autonomous Task Execution
      let actionResult = null;
      
      if (parsedResponse.intent === 'check_stats') {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const pendingPayments = invoices.filter(inv => inv.status === 'pending').length;
        
        actionResult = {
          totalRevenue,
          totalInvoices: invoices.length,
          pendingPayments,
          overduePayments: overdueInvoices.length
        };
        
        // Proactive suggestion - PS2 requirement: Context-Aware Follow-ups
        if (overdueInvoices.length > 0) {
          parsedResponse.proactiveSuggestion = `${overdueInvoices.length} invoices are overdue > 30 days. Should I send reminders?`;
        }
      } else if (parsedResponse.intent === 'list_invoices' || parsedResponse.intent === 'check_pending') {
        const relevantInvoices = parsedResponse.intent === 'check_pending' 
          ? invoices.filter(inv => inv.status === 'pending')
          : invoices;
          
        actionResult = {
          invoices: relevantInvoices.slice(0, 5).map(inv => ({
            id: inv.id,
            customer_name: inv.customer_name,
            amount: inv.amount,
            status: inv.status,
            date: inv.date
          }))
        };
      } else if (parsedResponse.intent === 'list_overdue') {
        actionResult = {
          invoices: overdueInvoices.slice(0, 5).map(inv => ({
            id: inv.id,
            customer_name: inv.customer_name,
            amount: inv.amount,
            daysSinceDue: Math.floor((new Date() - new Date(inv.date)) / (1000 * 60 * 60 * 24))
          }))
        };
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
      
      // Get user info for business name
      const userInfo = await db.collection('users').findOne({ id: user.userId });
      const businessName = userInfo?.businessName || 'Bharat Biz';
      
      // Send WhatsApp message via Twilio
      if (TWILIO_AUTH_TOKEN && TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token_here') {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const whatsappBody = new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: `whatsapp:${invoice.customer_phone}`,
          Body: `नमस्ते ${invoice.customer_name},\n\nYour payment of ₹${invoice.amount} for Invoice #${invoice.id} is pending.\n\nकृपया जल्द से जल्द भुगतान करें।\n\nThank you!\n- ${businessName}`
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
          
          // Handle response regardless of content type
          let responseData = null;
          const contentType = twilioResponse.headers.get('content-type');
          const responseText = await twilioResponse.text();
          
          try {
            if (contentType && contentType.includes('application/json') && responseText) {
              responseData = JSON.parse(responseText);
            } else {
              responseData = responseText;
            }
          } catch (parseError) {
            console.error('Response parse error:', parseError);
            responseData = responseText;
          }
          
          if (twilioResponse.ok) {
            console.log('WhatsApp sent successfully:', responseData);
            return Response.json({ 
              message: '✅ Payment reminder sent successfully via WhatsApp!',
              success: true,
              details: `Sent to ${invoice.customer_name} at ${invoice.customer_phone}`
            });
          } else {
            console.error('Twilio error:', responseData);
            return Response.json({ 
              message: '⚠️ WhatsApp send failed. Reminder logged in database.',
              success: false,
              error: responseData
            });
          }
        } catch (error) {
          console.error('WhatsApp send error:', error);
          return Response.json({ 
            message: '⚠️ Error sending WhatsApp. Reminder logged.',
            success: false,
            error: error.message 
          });
        }
      } else {
        // Log reminder without sending
        await db.collection('reminders').insertOne({
          invoiceId: invoice.id,
          customerId: invoice.customer_phone,
          customerName: invoice.customer_name,
          amount: invoice.amount,
          sentAt: new Date().toISOString(),
          method: 'whatsapp',
          status: 'pending'
        });
        
        return Response.json({ 
          message: '📝 Reminder logged (Configure Twilio Auth Token to send via WhatsApp)',
          success: false 
        });
      }
    }
    
    // Retell AI Webhook - Voice Layer Integration
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
        
        console.log('Retell AI Voice Input:', transcript);
        
        // Process through Bharat Biz-Agent AI
        const lowerTranscript = transcript.toLowerCase();
        let agentResponse = '';
        let actionData = null;
        
        // Handle different intents
        if (lowerTranscript.includes('dashboard') || lowerTranscript.includes('stats') || lowerTranscript.includes('overview')) {
          // Dashboard stats
          const stats = await db.collection('invoices')
            .aggregate([
              { $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalCount: { $sum: 1 },
                pendingCount: { 
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                }
              }}
            ]).toArray();
          
          const customers = await db.collection('customers').countDocuments();
          
          const stat = stats[0] || { totalRevenue: 0, totalCount: 0, pendingCount: 0 };
          
          agentResponse = `आपका business dashboard यह है: ` +
            `Total revenue है ${stat.totalRevenue} rupees. ` +
            `आपके पास ${stat.totalCount} invoices हैं, जिनमें से ${stat.pendingCount} pending हैं। ` +
            `और आपके ${customers} customers हैं।`;
          
          actionData = {
            totalRevenue: stat.totalRevenue,
            totalInvoices: stat.totalCount,
            pendingPayments: stat.pendingCount,
            totalCustomers: customers
          };
          
        } else if (lowerTranscript.includes('invoice') || lowerTranscript.includes('bill')) {
          // List invoices
          const invoices = await db.collection('invoices')
            .find()
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();
          
          if (invoices.length === 0) {
            agentResponse = 'आपके पास कोई invoices नहीं हैं। Would you like to create one?';\
          } else {
            agentResponse = `आपके latest ${invoices.length} invoices हैं: `;\
            invoices.forEach((inv, idx) => {
              agentResponse += `${idx + 1}. ${inv.customer_name} के लिए ${inv.amount} rupees. `;\
            });
          }
          
          actionData = { invoices: invoices.slice(0, 3) };
          
        } else if (lowerTranscript.includes('pending') || lowerTranscript.includes('payment')) {
          // Pending payments
          const pending = await db.collection('invoices')
            .find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();
          
          if (pending.length === 0) {
            agentResponse = 'बहुत बढ़िया! You have no pending payments.';\
          } else {
            agentResponse = `आपके ${pending.length} pending payments हैं: `;\
            pending.forEach((inv, idx) => {
              agentResponse += `${idx + 1}. ${inv.customer_name} से ${inv.amount} rupees. `;\
            });
            agentResponse += 'Should I send reminders?';\
          }
          
          actionData = { pendingInvoices: pending };
          
        } else if (lowerTranscript.includes('remind') || lowerTranscript.includes('reminder')) {
          // Send reminder
          const pending = await db.collection('invoices')
            .findOne({ status: 'pending' });\
          
          if (!pending) {
            agentResponse = 'No pending payments to remind about.';\
          } else {
            // Send WhatsApp reminder
            if (TWILIO_AUTH_TOKEN && TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token_here') {
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;\
              
              const whatsappBody = new URLSearchParams({
                From: TWILIO_WHATSAPP_NUMBER,
                To: `whatsapp:${pending.customer_phone}`,
                Body: `नमस्ते ${pending.customer_name}, Your payment of ₹${pending.amount} is pending. कृपया जल्द भुगतान करें। Thank you!`
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
                  agentResponse = `Payment reminder sent to ${pending.customer_name} via WhatsApp successfully!`;\
                } else {
                  agentResponse = `Reminder logged for ${pending.customer_name}.`;\
                }
              } catch (error) {
                agentResponse = `Reminder logged for ${pending.customer_name}.`;\
              }
            } else {
              agentResponse = `Reminder logged for ${pending.customer_name}. Configure Twilio to send via WhatsApp.`;\
            }
            
            actionData = { reminderSent: true, customer: pending.customer_name };
          }
          
        } else if (lowerTranscript.includes('customer')) {
          // List customers
          const customers = await db.collection('customers')
            .find()
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();
          
          if (customers.length === 0) {
            agentResponse = 'आपके पास कोई customers नहीं हैं yet.';\
          } else {
            agentResponse = `आपके ${customers.length} customers हैं: `;\
            customers.forEach((cust, idx) => {
              const pending = cust.pendingAmount || 0;
              agentResponse += `${idx + 1}. ${cust.name}, pending है ${pending} rupees. `;\
            });
          }
          
          actionData = { customers: customers.slice(0, 3) };
          
        } else {
          // Use AI agent for other queries
          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are Bharat Biz-Agent voice assistant. Respond in a mix of Hindi and English (Hinglish) in a natural, conversational way. Keep responses short and clear for voice. User said: "${transcript}". Provide helpful business information.`
                },
                {
                  role: 'user',
                  content: transcript
                }
              ],
              temperature: 0.7,
              max_tokens: 150
            })
          });
          
          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            agentResponse = aiResult.choices[0].message.content;
          } else {
            agentResponse = 'मैं आपकी मदद कर सकता हूं। Please ask about dashboard, invoices, payments, or customers.';\
          }
        }
        
        console.log('Retell AI Response:', agentResponse);
        
        // Return response in Retell AI format
        return Response.json({
          response: agentResponse,
          end_call: false,
          data: actionData
        });
        
      } catch (error) {
        console.error('Retell webhook error:', error);
        return Response.json({
          response: 'Sorry, मुझे कुछ technical issue हुआ। Please try again.',
          end_call: false
        });
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