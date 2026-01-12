'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface NavLinkProps {
  href: string
  icon: ReactNode
  label: string
  exact?: boolean
}

export default function NavLink({ href, icon, label, exact = false }: NavLinkProps) {
  const pathname = usePathname()

  // Check if this link is active
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400 -ml-1 pl-3'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <span className="w-6 h-6 flex-shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}
