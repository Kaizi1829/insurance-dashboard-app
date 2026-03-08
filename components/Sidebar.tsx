"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Route } from "next"
import {
  LayoutDashboard,
  Database,
  Building2,
  Target,
  type LucideIcon
} from "lucide-react"

type MenuItem = {
  label: string
  href: Route
  icon: LucideIcon
}

const menu: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Registro ARGOS",
    href: "/registro",
    icon: Database,
  },
  {
    label: "Medofis",
    href: "/medofis",
    icon: Building2,
  },
  {
    label: "Objetivos",
    href: "/objetivos",
    icon: Target,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen bg-white border-r p-6 flex flex-col">
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#003A8F]">AXA Dashboard</h2>
        <p className="text-xs text-slate-400">Control comercial</p>
      </div>

      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition w-full ${
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

      <div className="mt-auto pt-6 border-t text-xs text-slate-400">
        <p>Panel comercial</p>
        <p>Agencia AXA</p>
      </div>
    </div>
  )
}