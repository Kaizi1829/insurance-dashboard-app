import "./globals.css"
import Sidebar from "@/components/Sidebar"

export const metadata = {
  title: "Dashboard AXA",
  description: "Panel comercial agencia AXA"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-100">

        <div className="flex h-screen">

          {/* SIDEBAR */}
          <Sidebar />

          {/* CONTENIDO */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}