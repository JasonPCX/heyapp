import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import React from 'react'

function Friends() {
  const isMobile = useIsMobile()
  return (
    <SidebarInset>
      <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-lg font-semibold">HeyApp</h1>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Your Friends</h2>
            <p className="text-muted-foreground">Manage your friends and send friend requests</p>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}

export default Friends