import * as React from "react";


export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
requiredMark?: boolean;
};


export function Label({ className = "", requiredMark, children, ...rest }: LabelProps) {
return (
    <label
        className={
        "text-sm font-medium leading-none text-foreground/90 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 " +
        className
        }
        {...rest}
        >
        {children}
        {requiredMark ? <span className="ml-0.5 text-destructive">*</span> : null}
    </label>
    );
}