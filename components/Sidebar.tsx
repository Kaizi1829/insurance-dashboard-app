"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Route } from "next"
import {
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
  Target,
  type LucideIcon,
} from "lucide-react"

type MenuItem = {
  label: string
  href: Route
  icon: LucideIcon
}

type MenuGroup = {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: "Análisis",
    items: [
      {
        label: "Panel principal",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        label: "Evolución anual",
        href: "/medofis",
        icon: TrendingUp,
      },
      {
        label: "Seguimiento de objetivos",
        href: "/seguimiento" as Route,
        icon: Target,
      },
    ],
  },
  {
    title: "Registro",
    items: [
      {
        label: "ARGOS",
        href: "/argos" as Route,
        icon: ClipboardList,
      },
      {
        label: "Objetivos",
        href: "/objetivos",
        icon: Target,
      },
    ],
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
      <nav className="flex flex-col gap-8">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {group.title}
            </p>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t text-xs text-slate-400">
        <p>Panel comercial</p>
        <p>Agencia AXA</p>
      </div>
    </div>
  )
}
