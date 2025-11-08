import * as React from "react";

/* ---------------- Types ---------------- */
type ActivationMode = "automatic" | "manual";
type Orientation = "horizontal" | "vertical";

type TabsContextType = {
  value: string | undefined;
  setValue: (v: string) => void;
  orientation: Orientation;
  activationMode: ActivationMode;
  idBase: string;
};

const TabsCtx = React.createContext<TabsContextType | null>(null);

/* ---------------- Root ---------------- */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className = "",
  children,
  orientation = "horizontal",
  activationMode = "automatic",
  idBase: idBaseProp,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
  orientation?: Orientation;
  activationMode?: ActivationMode;
  /** Optional ID prefix for aria-controls/id linking */
  idBase?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const cur = isControlled ? value : uncontrolled;

  const setValue = (v: string) => {
    if (isControlled) onValueChange?.(v);
    else setUncontrolled(v);
  };

  const idBase = React.useId().replace(/:/g, "");
  const ctx: TabsContextType = {
    value: cur,
    setValue,
    orientation,
    activationMode,
    idBase: idBaseProp ?? `tabs-${idBase}`,
  };

  return (
    <TabsCtx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

/* ---------------- List ---------------- */
export function TabsList({
  className = "",
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const ctx = React.useContext(TabsCtx)!;
  const ref = React.useRef<HTMLDivElement>(null);

  // Keyboard navigation between tab buttons
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>("[role=tab]:not([aria-disabled=true])"));
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex((el) => el === document.activeElement);
    const horizontal = ctx.orientation === "horizontal";

    const keyPrev = horizontal ? "ArrowLeft" : "ArrowUp";
    const keyNext = horizontal ? "ArrowRight" : "ArrowDown";

    let targetIndex = currentIndex;

    if (e.key === keyPrev) {
      targetIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
      e.preventDefault();
    } else if (e.key === keyNext) {
      targetIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      e.preventDefault();
    } else if (e.key === "Home") {
      targetIndex = 0;
      e.preventDefault();
    } else if (e.key === "End") {
      targetIndex = tabs.length - 1;
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      // In manual mode, Enter/Space activates the focused tab
      const btn = document.activeElement as HTMLButtonElement | null;
      if (btn && ctx.activationMode === "manual") {
        btn.click();
        e.preventDefault();
      }
      return;
    } else {
      return;
    }

    const target = tabs[targetIndex];
    target?.focus();
    if (ctx.activationMode === "automatic") {
      target?.click();
    }
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={ctx.orientation}
      aria-label={ariaLabel}
      className={`flex ${ctx.orientation === "horizontal" ? "flex-row" : "flex-col"} gap-2 ${className}`}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

/* ---------------- Trigger ---------------- */
export function TabsTrigger({
  value,
  children,
  className = "",
  disabled = false,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  const idTab = `${ctx.idBase}-tab-${value}`;
  const idPanel = `${ctx.idBase}-panel-${value}`;

  return (
    <button
      id={idTab}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={idPanel}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={active ? 0 : -1}
      onClick={() => !disabled && ctx.setValue(value)}
      className={`px-3 py-2 text-sm rounded-md border transition
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      ${active ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-900"} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Content ---------------- */
export function TabsContent({
  value,
  className = "",
  children,
  keepMounted = false,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
  /** Nếu true, vẫn giữ DOM khi tab không active (ẩn bằng CSS) */
  keepMounted?: boolean;
}) {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  const idPanel = `${ctx.idBase}-panel-${value}`;
  const idTab = `${ctx.idBase}-tab-${value}`;

  if (!keepMounted && !active) return null;

  return (
    <div
      id={idPanel}
      role="tabpanel"
      aria-labelledby={idTab}
      hidden={!active}
      className={className}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
