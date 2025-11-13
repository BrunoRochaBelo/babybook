import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Bell, Calendar, Syringe, Heart, Gift, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
const notificationIcons = {
    vaccine: Syringe,
    milestone: Heart,
    memory: Calendar,
    celebration: Gift,
    general: Bell
};
const notificationColors = {
    vaccine: 'text-red-500 bg-red-50 dark:bg-red-950/20',
    milestone: 'text-primary bg-primary/10',
    memory: 'text-accent bg-accent/10',
    celebration: 'text-secondary-foreground bg-secondary',
    general: 'text-muted-foreground bg-muted'
};
export function NotificationCenter({ notifications, onMarkAsRead, onMarkAllAsRead }) {
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.action) {
            notification.action.onClick();
            setOpen(false);
        }
    };
    return (_jsxs(Sheet, { open: open, onOpenChange: setOpen, children: [_jsx(SheetTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", className: "relative rounded-full h-10 w-10", children: [_jsx(Bell, { className: "w-5 h-5" }), unreadCount > 0 && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-[10px] text-white", children: unreadCount > 9 ? '9+' : unreadCount }) }))] }) }), _jsxs(SheetContent, { className: "w-full sm:max-w-md", children: [_jsxs(SheetHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(SheetTitle, { className: "text-2xl", children: "Notifica\u00E7\u00F5es" }), unreadCount > 0 && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: onMarkAllAsRead, className: "h-8 text-xs", children: [_jsx(CheckCheck, { className: "w-4 h-4 mr-1" }), "Marcar todas como lidas"] }))] }), _jsx(SheetDescription, { children: unreadCount > 0
                                    ? `Você tem ${unreadCount} ${unreadCount === 1 ? 'notificação nova' : 'notificações novas'}`
                                    : 'Você está em dia com todas as notificações' })] }), _jsx("div", { className: "mt-6 space-y-3", children: notifications.length === 0 ? (_jsxs(Card, { className: "p-8 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Nenhuma notifica\u00E7\u00E3o no momento" })] })) : (notifications.map((notification, index) => {
                            const Icon = notificationIcons[notification.type];
                            const colorClass = notificationColors[notification.type];
                            return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.2, delay: index * 0.03 }, children: [_jsx(Card, { className: `p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${!notification.isRead
                                            ? 'border-primary/30 bg-primary/5'
                                            : 'hover:border-border/80'}`, onClick: () => handleNotificationClick(notification), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [_jsx("h4", { className: `text-sm ${!notification.isRead ? '' : 'text-muted-foreground'}`, children: notification.title }), !notification.isRead && (_jsx("div", { className: "w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" }))] }), _jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mb-2", children: notification.message }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: notification.time }), notification.action && (_jsx(Button, { variant: "link", size: "sm", className: "h-auto p-0 text-xs text-primary", onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        handleNotificationClick(notification);
                                                                    }, children: notification.action.label }))] })] })] }) }), index < notifications.length - 1 && (_jsx(Separator, { className: "my-2" }))] }, notification.id));
                        })) })] })] }));
}
