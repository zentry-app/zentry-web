interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          {/* Aquí irá el componente de navegación */}
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <div className="container grid gap-12 py-6">
          {children}
        </div>
      </main>
    </div>
  );
} 