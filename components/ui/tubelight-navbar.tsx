"use client"
import BrandMark from "@/components/brand/BrandMark";

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/85 border border-white/40 backdrop-blur-xl shadow-sm rounded-3xl px-6 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <BrandMark className="h-8" />
          <span className="font-bold text-lg text-[var(--foreground)]">Voyenta</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {items.map((item) => {
            const isActive = activeTab === item.name
            return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-xl transition-colors",
                  "text-slate-700 hover:text-[var(--primary)]",
                  isActive && "bg-[var(--primary)]/10 text-[var(--primary)]",
                )}
              >
                <span className="whitespace-nowrap">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-[var(--primary)]/10 rounded-xl -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--primary)] rounded-t-full">
                      <div className="absolute w-12 h-6 bg-[var(--primary)]/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-[var(--primary)]/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-[var(--primary)]/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right side: CTA + mobile icons */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:inline-flex text-sm font-medium text-slate-700 hover:text-[var(--primary)]">
            Log in
          </Link>
          <Link href="/signup" className="hidden sm:inline-flex">
            <span className="inline-flex items-center whitespace-nowrap btn-glow rounded-lg px-4 py-2 text-sm font-semibold md:px-5 md:py-2.5">
              Start free
            </span>
          </Link>

          {/* Mobile icons row */}
          <div className="flex md:hidden items-center gap-2">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name
              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "relative p-2 rounded-xl transition-colors",
                    "text-slate-700",
                    isActive && "bg-[var(--primary)]/10 text-[var(--primary)]",
                  )}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {isActive && (
                    <motion.div
                      layoutId="lamp-mobile"
                      className="absolute inset-0 w-full bg-[var(--primary)]/10 rounded-xl -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
