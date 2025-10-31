import * as React from "react";

type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsCtx = React.createContext<TabsContextType | null>(null);

export function Tabs({ defaultValue, className = "", children }: { defaultValue: string; className?: string; children: React.ReactNode }) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-2 text-sm rounded-md border ${active ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-900"}`}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
