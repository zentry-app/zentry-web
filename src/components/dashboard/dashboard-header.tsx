"use client"

import Link from "next/link"
import Image from "next/image"
import { UserNav } from "./user-nav"
import { ModeToggle } from "../mode-toggle"
import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"

interface DashboardHeaderProps {
  heading?: string
}

export function DashboardHeader({ heading }: DashboardHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mr-2 md:hidden">
            <MenuIcon className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <Link href="/" className="hidden items-center space-x-2 md:flex">
            <Image
              src="/assets/logo/ZentryLogo.png"
              alt="Zentry Logo"
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          {heading && (
            <div className="hidden md:ml-6 md:flex">
              <h1 className="text-lg font-semibold">{heading}</h1>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader 