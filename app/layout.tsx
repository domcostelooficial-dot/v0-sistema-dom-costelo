import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Dom Costelo PRO - Sistema de Gestão',
  description: 'Sistema de gestão para restaurante com controle de estoque, produção e financeiro',
  generator: 'v0.app',
  icons: {
    icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1_20260424_133557_0000-df20aL2H0s0hc4p0RXFd0STSUMJ4s8.png',
    apple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1_20260424_133557_0000-df20aL2H0s0hc4p0RXFd0STSUMJ4s8.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
