'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Mic, Paperclip, Menu, LogOut, User, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function WhatsAppDashboard() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    const userData = JSON.parse(storedUser);
    setUser(userData);
    
    // Welcome message
    setMessages([
      {
        id: 1,
        type: 'assistant',
        text: `नमस्ते ${userData.name}! 👋\n\nWelcome to Bharat Biz-Agent. I'm your AI business assistant.\n\nYou can ask me:\n• "Show my dashboard"\n• "Kitne invoices hain?"\n• "Create new invoice"\n• "Pending payments dikhao"\n• "Send payment reminder"\n\nType or 🎤 speak your command!`,
        timestamp: new Date()
      }
    ]);
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Check for specific commands
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('dashboard') || lowerMsg.includes('stats') || lowerMsg.includes('overview')) {
        await handleDashboardCommand();
      } else if (lowerMsg.includes('invoice') && (lowerMsg.includes('create') || lowerMsg.includes('new') || lowerMsg.includes('banao'))) {
        await handleCreateInvoiceCommand();
      } else if (lowerMsg.includes('invoice') || lowerMsg.includes('bill')) {
        await handleInvoicesCommand();
      } else if (lowerMsg.includes('customer')) {
        await handleCustomersCommand();
      } else if (lowerMsg.includes('payment') || lowerMsg.includes('pending')) {
        await handlePaymentsCommand();
      } else if (lowerMsg.includes('reminder') || lowerMsg.includes('remind')) {
        await handleReminderCommand();
      } else {
        // Use AI agent for other queries
        await handleAIQuery(message);
      }
    } catch (error) {
      addAssistantMessage('Sorry, something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDashboardCommand = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const stats = await res.json();
        const responseText = `📊 *Business Dashboard*\n\n` +
          `💰 Total Revenue: *₹${stats.totalRevenue.toLocaleString()}*\n` +
          `📄 Total Invoices: *${stats.totalInvoices}*\n` +
          `⏳ Pending Payments: *${stats.pendingPayments}*\n` +
          `👥 Total Customers: *${stats.totalCustomers}*\n\n` +
          `What would you like to do next?`;
        
        addAssistantMessage(responseText);
      }
    } catch (error) {
      addAssistantMessage('Unable to fetch dashboard stats.');
    }
  };

  const handleInvoicesCommand = async () => {
    try {
      const res = await fetch('/api/invoices?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const invoices = await res.json();
        
        if (invoices.length === 0) {
          addAssistantMessage('You have no invoices yet. Type "create new invoice" to get started!');
          return;
        }
        
        let responseText = `📄 *Recent Invoices*\n\n`;
        invoices.forEach((inv, idx) => {
          const status = inv.status === 'paid' ? '✅' : '⏳';
          responseText += `${idx + 1}. ${status} *${inv.customer_name}*\n`;
          responseText += `   ₹${inv.amount.toLocaleString()} | ${format(new Date(inv.date), 'MMM dd, yyyy')}\n`;
          responseText += `   ID: ${inv.id}\n\n`;
        });
        
        responseText += `Type "send reminder [customer name]" to send payment reminder.`;
        addAssistantMessage(responseText);
      }
    } catch (error) {
      addAssistantMessage('Unable to fetch invoices.');
    }
  };

  const handleCustomersCommand = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const customers = await res.json();
        
        if (customers.length === 0) {
          addAssistantMessage('You have no customers yet. Create an invoice to add customers!');
          return;
        }
        
        let responseText = `👥 *Customers*\n\n`;
        customers.forEach((cust, idx) => {
          responseText += `${idx + 1}. *${cust.name}*\n`;
          responseText += `   📱 ${cust.phone}\n`;
          responseText += `   💰 Total: ₹${(cust.totalAmount || 0).toLocaleString()}\n`;
          responseText += `   ⏳ Pending: ₹${(cust.pendingAmount || 0).toLocaleString()}\n\n`;
        });
        
        addAssistantMessage(responseText);
      }
    } catch (error) {
      addAssistantMessage('Unable to fetch customers.');
    }
  };

  const handlePaymentsCommand = async () => {
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const invoices = await res.json();
        const pending = invoices.filter(inv => inv.status === 'pending');
        
        if (pending.length === 0) {
          addAssistantMessage('🎉 Great! You have no pending payments.');
          return;
        }
        
        let responseText = `⏳ *Pending Payments* (${pending.length})\n\n`;
        pending.forEach((inv, idx) => {
          responseText += `${idx + 1}. *${inv.customer_name}*\n`;
          responseText += `   ₹${inv.amount.toLocaleString()}\n`;
          responseText += `   Invoice: ${inv.id}\n`;
          responseText += `   Date: ${format(new Date(inv.date), 'MMM dd, yyyy')}\n\n`;
        });
        
        responseText += `Type "send reminder" to send WhatsApp reminders.`;
        addAssistantMessage(responseText);
      }
    } catch (error) {
      addAssistantMessage('Unable to fetch pending payments.');
    }
  };

  const handleReminderCommand = async () => {
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const invoices = await res.json();
        const pending = invoices.filter(inv => inv.status === 'pending');
        
        if (pending.length === 0) {
          addAssistantMessage('No pending payments to remind about!');
          return;
        }
        
        // Send reminder for first pending invoice
        const invoice = pending[0];
        const reminderRes = await fetch(`/api/payments/${invoice.id}/remind`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (reminderRes.ok) {
          const data = await reminderRes.json();
          addAssistantMessage(`✅ ${data.message}\n\nSent to: *${invoice.customer_name}*\nAmount: *₹${invoice.amount.toLocaleString()}*`);
        } else {
          addAssistantMessage('Failed to send reminder. Please try again.');
        }
      }
    } catch (error) {
      addAssistantMessage('Unable to send reminder.');
    }
  };

  const handleCreateInvoiceCommand = () => {
    addAssistantMessage(
      `📝 *Create New Invoice*\n\n` +
      `Please provide the following details:\n\n` +
      `Format: create invoice\n` +
      `Customer: [Name]\n` +
      `Phone: [+91XXXXXXXXXX]\n` +
      `Items: [Description] x [Quantity] @ ₹[Price]\n\n` +
      `Example:\n` +
      `"Create invoice for Rahul, phone +919876543210, Cotton Fabric x 10 @ ₹500"\n\n` +
      `Or type "quick invoice" for a simpler flow!`
    );
  };

  const handleAIQuery = async (query) => {
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: query, language: 'hinglish' })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        let responseText = data.message;
        
        if (data.actionResult) {
          if (data.actionResult.totalRevenue !== undefined) {
            responseText += `\n\n📊 *Stats:*\n`;
            responseText += `💰 Revenue: ₹${data.actionResult.totalRevenue.toLocaleString()}\n`;
            responseText += `📄 Invoices: ${data.actionResult.totalInvoices}\n`;
            responseText += `⏳ Pending: ${data.actionResult.pendingPayments}`;
          } else if (data.actionResult.invoices) {
            responseText += `\n\n📄 *Invoices:*\n`;
            data.actionResult.invoices.forEach((inv, idx) => {
              responseText += `\n${idx + 1}. ${inv.customer_name} - ₹${inv.amount.toLocaleString()}`;
            });
          }
        }
        
        if (data.proactiveSuggestion) {
          responseText += `\n\n💡 *Suggestion:*\n${data.proactiveSuggestion}`;
        }
        
        addAssistantMessage(responseText);
      }
    } catch (error) {
      addAssistantMessage('I understand your message. Let me help you with that.');
    }
  };

  const addAssistantMessage = (text) => {
    const assistantMessage = {
      id: Date.now(),
      type: 'assistant',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Your browser does not support voice recording.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('🎤 Recording... Speak now!');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        toast.error('🚫 Microphone access denied! Please allow microphone access.');
      } else {
        toast.error('❌ Unable to access microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.text);
        toast.success('✅ Transcription complete!');
      } else {
        toast.error('Transcription failed');
      }
    } catch (error) {
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1014]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884] mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a1014]">
      {/* WhatsApp-style Header */}
      <header className="bg-[#1f2c33] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-white font-medium">Bharat Biz-Agent</h1>
            <p className="text-xs text-gray-400">{user.businessName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-[#2a3942] rounded-full text-gray-400"
          >
            <MoreVertical size={20} />
          </button>
        </div>
        
        {showMenu && (
          <div className="absolute right-4 top-16 bg-[#1f2c33] rounded-lg shadow-lg border border-[#2a3942] py-2 min-w-[200px] z-50">
            <button
              onClick={() => {
                setShowMenu(false);
                setMessages([{
                  id: Date.now(),
                  type: 'assistant',
                  text: '👤 *Profile*\n\nName: ' + user.name + '\nBusiness: ' + user.businessName + '\nPhone: ' + user.phone,
                  timestamp: new Date()
                }]);
              }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#2a3942] flex items-center gap-3"
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2a3942] flex items-center gap-3"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </header>

      {/* WhatsApp-style Chat Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          backgroundImage: `url('data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h100v100H0z" fill="%230a1014"/%3E%3Cpath d="M20 20l5 5-5 5m15-10l5 5-5 5m15-10l5 5-5 5m15-10l5 5-5 5" stroke="%231a2329" stroke-width="1" fill="none" opacity=".3"/%3E%3C/svg%3E')`,
          backgroundSize: '100px 100px'
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.type === 'user'
                  ? 'bg-[#005c4b] text-white rounded-br-none'
                  : 'bg-[#1f2c33] text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              <p className="text-[10px] mt-1 opacity-60 text-right">
                {format(msg.timestamp, 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1f2c33] rounded-lg rounded-bl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input Bar */}
      <div className="bg-[#1f2c33] px-4 py-3 border-t border-[#2a3942]">
        {isTranscribing && (
          <div className="text-center text-sm text-gray-400 mb-2">
            🎤 Transcribing your voice...
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#2a3942] rounded-full text-gray-400">
            <Paperclip size={22} />
          </button>
          
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              disabled={isTyping || isRecording}
            />
          </div>

          {message.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={isTyping}
              className="p-2 bg-[#00a884] hover:bg-[#00916e] rounded-full text-white disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-[#00a884] hover:bg-[#00916e]'
              } text-white`}
              disabled={isTranscribing}
            >
              <Mic size={20} />
            </button>
          )}
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-500">
            🎤 Voice | 💬 Chat | 🇮🇳 Hindi/Hinglish/English
          </p>
        </div>
      </div>
    </div>
  );
}