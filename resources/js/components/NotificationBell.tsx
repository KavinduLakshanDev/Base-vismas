import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell({ unreadNotifications = [], unreadCount = 0 }: { unreadNotifications?: any[], unreadCount?: number }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const markAsRead = (id: string) => {
        router.post(route('notifications.mark-as-read', id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const markAllAsRead = () => {
        router.post(route('notifications.mark-all-read'), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border border-gray-200">
                    <Bell className="h-[1.15rem] w-[1.15rem] text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                    <DropdownMenuLabel className="p-0 font-semibold">{t('Notifications')}</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>
                            {t('Mark all as read')}
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                
                <ScrollArea className="h-[300px]">
                    {unreadNotifications.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                            <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">{t('No new notifications')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {unreadNotifications.map((notification) => (
                                <div key={notification.id} className="relative flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border last:border-0">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-tight">
                                            {notification.data.message || t('New Notification')}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        {notification.data.url && (
                                            <Link href={notification.data.url} className="text-xs font-semibold text-primary hover:underline" onClick={() => { markAsRead(notification.id); setIsOpen(false); }}>
                                                {t('View')}
                                            </Link>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full text-muted-foreground hover:bg-green-100 hover:text-green-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            title={t('Mark as read')}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
