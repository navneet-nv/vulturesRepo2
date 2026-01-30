'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, CreditCard, Users, BarChart3, Settings, LogOut, Bell, Plus, Send, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({ totalRevenue: 0, totalInvoices: 0, pendingPayments: 0, totalCustomers: 0 });
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_phone: '',
    items: [{ description: '', quantity: 1, price: 0 }]
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    fetchData(storedToken);
  }, []);

  const fetchData = async (authToken) => {
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      
      // Fetch stats
      const statsRes = await fetch('/api/dashboard/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Fetch recent invoices
      const invoicesRes = await fetch('/api/invoices?limit=5', { headers });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAllInvoices = async () => {
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = field === 'description' ? value : Number(value);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const createInvoice = async () => {
    try {
      const total = calculateTotal();
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...invoiceForm,
          amount: total
        })
      });
      
      if (res.ok) {
        toast.success('Invoice created successfully!');
        setShowInvoiceModal(false);
        setInvoiceForm({
          customer_name: '',
          customer_phone: '',
          items: [{ description: '', quantity: 1, price: 0 }]
        });
        fetchData(token);
        if (currentPage === 'invoices') {
          fetchAllInvoices();
        }
      } else {
        toast.error('Failed to create invoice');
      }
    } catch (error) {
      toast.error('Error creating invoice');
    }
  };

  const sendReminder = async (invoiceId) => {
    try {
      const res = await fetch(`/api/payments/${invoiceId}/remind`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      } else {
        toast.error('Failed to send reminder');
      }
    } catch (error) {
      toast.error('Error sending reminder');
    }
  };

  const handleAIChat = async () => {
    if (!aiMessage.trim()) return;
    
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: aiMessage, language: 'hinglish' })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
        if (data.actionResult) {
          fetchData(token);
        }
      } else {
        toast.error('AI agent error');
      }
    } catch (error) {
      toast.error('Failed to communicate with AI agent');
    }
  };

  useEffect(() => {
    if (currentPage === 'invoices' && token) {
      fetchAllInvoices();
    } else if (currentPage === 'customers' && token) {
      fetchCustomers();
    } else if (currentPage === 'analytics' && token) {
      fetchAnalytics();
    }
  }, [currentPage, token]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Bharat Biz</h1>
          <p className="text-sm text-gray-600 mt-1">AI-Powered Agent</p>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            onClick={() => setShowAIChat(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Mic className="mr-2" size={18} />
            AI Agent Chat
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Welcome back, {user?.name}!</h2>
              <p className="text-sm text-gray-600">{user?.businessName}</p>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentPage === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
                    <FileText className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Invoices</CardTitle>
                  <Button onClick={() => setCurrentPage('invoices')} variant="link">View all</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.customer_name}</p>
                          <p className="text-sm text-gray-600">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-semibold">₹{invoice.amount.toLocaleString()}</p>
                            <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          {invoice.status !== 'paid' && (
                            <Button
                              size="sm"
                              onClick={() => sendReminder(invoice.id)}
                              variant="outline"
                            >
                              <Send size={14} className="mr-1" />
                              Remind
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setShowInvoiceModal(true)}
                      className="h-24 text-lg"
                      variant="outline"
                    >
                      <Plus className="mr-2" /> Create Invoice
                    </Button>
                    <Button
                      onClick={() => setShowAIChat(true)}
                      className="h-24 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Mic className="mr-2" /> Ask AI Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Invoices</h1>
                  <p className="text-gray-600">Manage all your invoices</p>
                </div>
                <Button onClick={() => setShowInvoiceModal(true)}>
                  <Plus size={20} className="mr-2" />
                  New Invoice
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{invoice.id}</td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium">{invoice.customer_name}</div>
                              <div className="text-sm text-gray-500">{invoice.customer_phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{format(new Date(invoice.date), 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{invoice.amount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                                {invoice.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {invoice.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  onClick={() => sendReminder(invoice.id)}
                                  variant="outline"
                                >
                                  <Send size={14} className="mr-1" />
                                  Remind
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Customers</h1>
                  <p className="text-gray-600">Manage your customer database</p>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Invoices</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                            <td className="px-6 py-4 text-sm">{customer.phone}</td>
                            <td className="px-6 py-4 text-sm">{customer.totalInvoices || 0}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{(customer.totalAmount || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-orange-600 font-medium">₹{(customer.pendingAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-gray-600">Business insights and trends</p>
              </div>

              {analytics && (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-600 font-medium">Paid Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.paid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-orange-600 font-medium">Pending Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-600 font-medium">Overdue Invoices</span>
                          <span className="text-2xl font-bold">{analytics.statusBreakdown.overdue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-600">
                        ₹{analytics.totalRevenue.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={user?.businessName} readOnly />
                  </div>
                  <div>
                    <Label>Owner Name</Label>
                    <Input value={user?.name} readOnly />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={user?.phone} readOnly />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={invoiceForm.customer_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={invoiceForm.customer_phone}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Items</Label>
                <Button onClick={addInvoiceItem} size="sm" variant="outline">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3">
                    <Input
                      className="col-span-6"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                    <Input
                      className="col-span-2"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      value={item.price}
                      onChange={(e) => updateInvoiceItem(index, 'price', e.target.value)}
                      placeholder="Price"
                    />
                    <Button
                      className="col-span-1"
                      onClick={() => removeInvoiceItem(index)}
                      variant="destructive"
                      size="icon"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowInvoiceModal(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={createInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chat Modal */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🤖 Bharat Biz AI Agent</DialogTitle>
            <p className="text-sm text-gray-600">Ask me anything in Hindi, Hinglish, or English!</p>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="Try: 'Rahul ko 500 rupees ka bill bhejo' or 'Kitne pending payments hain?'"
              rows={4}
            />

            <Button onClick={handleAIChat} className="w-full">
              <Send className="mr-2" size={18} />
              Send Message
            </Button>

            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">AI Response:</p>
                <p className="text-gray-700 mt-2">{aiResponse.message}</p>
                {aiResponse.needsConfirmation && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">Confirm</Button>
                    <Button size="sm" variant="outline">Cancel</Button>
                  </div>
                )}
                {aiResponse.actionResult && (
                  <pre className="mt-3 p-2 bg-white rounded text-xs overflow-auto">
                    {JSON.stringify(aiResponse.actionResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}