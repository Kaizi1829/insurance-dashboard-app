import "./globals.css"

import Sidebar from "@/components/Sidebar"



export const metadata = {
title: "Dashboard AXA",
description: "Panel comercial agencia AXA"
}



export default function RootLayout({
children,
}:{
children: React.ReactNode
}) {

return (

<html lang="es">

<body className="bg-slate-100">

<div className="flex min-h-screen">

  {/* SIDEBAR */}
  <div className="w-64">
    <Sidebar />
  </div>

  {/* CONTENIDO */}
  <main className="flex-1 p-8">
    {children}
  </main>

</div>

</body>

</html>

)

}
