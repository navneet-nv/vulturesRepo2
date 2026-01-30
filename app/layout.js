import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Bharat Biz-Agent | AI-Powered Business Assistant',
  description: 'AI-powered business assistant for Indian SMBs. Manage invoices, payments, and customers with voice support in Hindi, Hinglish, and English.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}