"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  Building2,
  Target
} from "lucide-react"

const menu = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  },
  {
    label: "Registro ARGOS",
    href: "/registro",
    icon: Database
  },
  {
    label: "Medofis",
    href: "/medofis",
    icon: Building2
  },
  {
    label: "Objetivos",
    href: "/objetivos",
    icon: Target
  }
]

export default function Sidebar() {

  const pathname = usePathname()

  return (
    <div className="w-64 flex flex-col h-screen p-6 bg-white border-r">

      {/* LOGO */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#003A8F]">
          AXA Dashboard
        </h2>

        <p className="text-xs text-slate-400">
          Control comercial
        </p>
      </div>

      {/* MENU */}
      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition w-full
              ${
                active
                  ? "bg-[#003A8F] text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t text-xs text-slate-400">
        <p>Panel comercial</p>
        <p>Agencia AXA</p>
      </div>

    </div>
  )
}