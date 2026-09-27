"use client"

import { LayoutGrid, FileText, Receipt, HelpCircle, Info } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Services', url: '/#services', icon: LayoutGrid },
    { name: 'Documents', url: '/#documents', icon: FileText },
    { name: 'How it works', url: '/#how-it-works', icon: Receipt },
    { name: 'FAQ', url: '/#faq', icon: HelpCircle },
    { name: 'Pricing', url: '/#pricing', icon: Info },
  ]

  return <NavBar items={navItems} />
}
