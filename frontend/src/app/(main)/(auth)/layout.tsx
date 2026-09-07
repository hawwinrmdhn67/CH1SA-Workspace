import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl bg-primary lg:flex">
          <img
            src="/logo_login_page.png"
            alt=""
            className="pointer-events-none absolute inset-x-0 bottom-12 top-0 m-auto h-[80%] w-[80%] object-contain opacity-100"
          />
          <div className="absolute top-8 z-10 flex items-center gap-4 px-10 text-primary-foreground">
            <div>
              <img src="/logo_putih.png" alt="Logo" className="size-14 shrink-0 object-contain block dark:hidden" />
              <img
                src="/logo_hitam.png"
                alt="Logo"
                className="size-14 shrink-0 object-contain hidden dark:block"
              />
            </div>
            <div className="space-y-1">
              <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
              <p className="text-sm">Your space. Your workflow.</p>
            </div>
          </div>

          <div className="absolute bottom-12 z-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Everything in one place.</h2>
              <p className="text-sm">
                Keep your tasks, notes, calendar, and files organized in one focused personal workspace.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Stay organized.</h2>
              <p className="text-sm">Plan your day, manage your work, and keep everything you need within reach.</p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
