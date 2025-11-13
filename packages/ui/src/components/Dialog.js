import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as RadixDialog from "@radix-ui/react-dialog";
import clsx from "clsx";
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export function DialogContent({ children }) {
    return (_jsxs(RadixDialog.Portal, { children: [_jsx(RadixDialog.Overlay, { className: "fixed inset-0 bg-slate-900/40 backdrop-blur-sm" }), _jsx(RadixDialog.Content, { className: "fixed left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl", children: children })] }));
}
export function DialogTitle({ children, className }) {
    return (_jsx(RadixDialog.Title, { className: clsx("text-2xl font-semibold text-slate-900", className), children: children }));
}
