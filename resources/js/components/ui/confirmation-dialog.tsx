import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    variant = 'default'
}: ConfirmationDialogProps) {
    const { t } = useTranslation();
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        // Find all buttons in the dialog
                        const buttons = Array.from(document.querySelectorAll('[role="alertdialog"] button')) as HTMLElement[];
                        const currentIndex = buttons.findIndex(b => b === document.activeElement);
                        
                        if (currentIndex !== -1 && buttons.length > 1) {
                            e.preventDefault();
                            const nextIndex = e.key === 'ArrowRight' 
                                ? (currentIndex + 1) % buttons.length 
                                : (currentIndex - 1 + buttons.length) % buttons.length;
                            buttons[nextIndex].focus();
                        }
                    } else if (e.key === 'Enter') {
                        // If no button is specifically focused, default to confirm
                        const buttons = Array.from(document.querySelectorAll('[role="alertdialog"] button')) as HTMLElement[];
                        const isAnyButtonFocused = buttons.some(b => b === document.activeElement);
                        if (!isAnyButtonFocused) {
                            e.preventDefault();
                            onConfirm();
                        }
                    }
                }}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || t('Confirm Action')}</AlertDialogTitle>
                    <AlertDialogDescription>{message || t('Are you sure you want to proceed?')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText || t('Cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                    >
                        {confirmText || t('Confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}