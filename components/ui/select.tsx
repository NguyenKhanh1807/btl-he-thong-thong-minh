import React, { ReactNode } from "react";


type Item = { value: string; label: ReactNode };


export function Select({ value, onValueChange, children, className }: {
    value?: string;
    onValueChange?: (v: string) => void;
    children: ReactNode;
    className?: string;
}) {
// Collect <SelectItem> within <SelectContent>
const items: Item[] = [];
const walk = (node: any) => {
React.Children.forEach(node?.props?.children, (n: any) => {
        if (!n) return;
        if (n.type && (n.type as any).displayName === "SelectItem") {
            items.push({ value: n.props.value, label: n.props.children });
        } else if (n.props?.children) {
            walk(n);
        }
    });
};

React.Children.forEach(children as any, (ch: any) => walk(ch));


return (
<select
    className={(className ?? "") + " border rounded-md px-2 py-1 bg-background"}
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
>
{items.map((it) => (
<option key={it.value} value={it.value}>
{typeof it.label === "string" ? it.label : it.value}
</option>
))}
</select>
);
}


export function SelectTrigger({ children, className }: { children?: ReactNode; className?: string }) {
return <div className={className}>{children}</div>;
}
export function SelectValue(_props: { placeholder?: string }) { return null; }
export function SelectContent({ children }: { children: ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
return <>{children}</>;
}
(SelectItem as any).displayName = "SelectItem";