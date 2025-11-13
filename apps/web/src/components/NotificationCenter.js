import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Bell, Calendar, Syringe, Heart, Gift, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
const notificationIcons = {
    vaccine: Syringe,
    milestone: Heart,
    memory: Calendar,
    celebration: Gift,
    general: Bell,
};
const notificationColors = {
    vaccine: "text-red-500 bg-red-50 dark:bg-red-950/20",
    milestone: "text-primary bg-primary/10",
    memory: "text-accent bg-accent/10",
    celebration: "text-secondary-foreground bg-secondary",
    general: "text-muted-foreground bg-muted",
};
export function NotificationCenter({ notifications, onMarkAsRead, onMarkAllAsRead, }) {
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.action) {
            notification.action.onClick();
            setOpen(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("button", { className: "relative rounded-full h-10 w-10 hover:bg-muted flex items-center justify-center text-foreground", onClick: () => setOpen(!open), children: [_jsx(Bell, { className: "w-5 h-5" }), unreadCount > 0 && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-[10px] text-white", children: unreadCount > 9 ? "9+" : unreadCount }) }))] }), open && (_jsxs("div", { className: "fixed right-4 top-16 w-80 max-h-96 bg-card rounded-3xl border border-border shadow-2xl overflow-hidden z-40", children: [_jsxs("div", { className: "p-6 border-b border-border", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h2", { className: "text-2xl font-serif font-semibold", children: "Notifica\u00E7\u00F5es" }), unreadCount > 0 && (_jsxs("button", { onClick: onMarkAllAsRead, className: "px-3 py-1 text-xs hover:bg-muted rounded-full flex items-center gap-1 transition-colors", children: [_jsx(CheckCheck, { className: "w-4 h-4" }), "Marcar todas"] }))] }), _jsx("p", { className: "text-sm text-muted-foreground", children: unreadCount > 0
                                    ? `${unreadCount} ${unreadCount === 1 ? "novidade para você" : "novidades para você"}`
                                    : "Tudo em dia" })] }), _jsx("div", { className: "overflow-y-auto max-h-64", children: notifications.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Sem notifica\u00E7\u00F5es no momento" })] })) : (notifications.map((notification, index) => {
                            const Icon = notificationIcons[notification.type];
                            const colorClass = notificationColors[notification.type];
                            return (_jsx(motion.button, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.2, delay: index * 0.03 }, className: `w-full p-4 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors ${!notification.isRead ? "bg-primary/5" : ""}`, onClick: () => handleNotificationClick(notification), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [_jsx("h4", { className: "text-sm font-medium", children: notification.title }), !notification.isRead && (_jsx("div", { className: "w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" }))] }), _jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mb-2", children: notification.message }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: notification.time }), notification.action && (_jsx("button", { className: "text-xs text-primary hover:underline", children: notification.action.label }))] })] })] }) }, notification.id));
                        })) })] }))] }));
}
