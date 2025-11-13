import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export function Card({ title, description, className, children }) {
    return (_jsxs("article", { className: clsx("rounded-2xl border border-slate-100 bg-white p-6 shadow-sm", className), children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: description }), _jsx("h2", { className: "text-xl font-semibold text-slate-900", children: title })] }), _jsx("div", { className: "mt-4", children: children })] }));
}
