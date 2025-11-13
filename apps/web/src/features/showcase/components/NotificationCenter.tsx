import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Bell, Calendar, Syringe, Heart, Gift, CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Notification {
  id: string;
  type: 'vaccine' | 'milestone' | 'memory' | 'celebration' | 'general';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

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

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-10 w-10"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
            >
              <span className="text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl">Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <SheetDescription>
            {unreadCount > 0 
              ? `Você tem ${unreadCount} ${unreadCount === 1 ? 'notificação nova' : 'notificações novas'}`
              : 'Você está em dia com todas as notificações'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação no momento
              </p>
            </Card>
          ) : (
            notifications.map((notification, index) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      !notification.isRead 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'hover:border-border/80'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {notification.time}
                          </span>
                          {notification.action && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
