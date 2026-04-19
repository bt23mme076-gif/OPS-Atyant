import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { StoreProvider } from '@/components/common/StoreProvider'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Atyant OPS', template: '%s — Atyant OPS' },
  description: 'Internal operations dashboard for the Atyant team.',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={{ duration: 4000, style: { borderRadius: '8px', fontSize: '13px' } }} />
        </StoreProvider>
      </body>
    </html>
  )
}
