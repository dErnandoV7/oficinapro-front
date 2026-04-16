import type { Metadata } from 'next'
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const appSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-app-sans',
  display: 'swap',
})

const appMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-app-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OficinaPRO - Sistema de Gestão para Oficinas',
  description: 'Sistema completo de gestão para oficinas mecânicas',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${appSans.variable} ${appMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
