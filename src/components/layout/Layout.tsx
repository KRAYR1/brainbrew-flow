import { Sidebar } from "./Sidebar";
import { MotivationalQuote } from "../MotivationalQuote";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="relative p-6 lg:p-8">
          {children}
        </div>
      </main>
      <MotivationalQuote />
    </div>
  );
}
