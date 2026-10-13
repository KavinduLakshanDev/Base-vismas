import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

export function RequireOpenShiftModal({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const active_shift = usePage<any>().props.auth.user?.active_shift;
    const [openForm, setOpenForm] = useState({ opening_amount: '', notes: '' });

    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('cash-register.store'), openForm as any, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOpenForm({ opening_amount: '', notes: '' });
            }
        });
    };

    if (active_shift) {
        return <>{children}</>;
    }

    return (
        <div className="relative h-full w-full">
            {/* The underlying POS UI, blurred and disabled */}
            <div className="pointer-events-none blur-sm opacity-50 select-none">
                {children}
            </div>

            {/* The forced open shift dialog */}
            <Dialog open={true} onOpenChange={(open) => {
                if (!open) {
                    window.history.back();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center justify-center mb-4">
                            <DollarSign className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <DialogTitle className="text-center text-xl">{t('Register Opened')}</DialogTitle>
                        <DialogDescription className="text-center">
                            {t('You can now access the POS terminal. Enter the opening cash amount below.')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOpenShift}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{t('Opening Balance')}</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={openForm.opening_amount} 
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    onChange={e => setOpenForm({...openForm, opening_amount: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('Notes (Optional)')}</Label>
                                <Textarea 
                                    value={openForm.notes} 
                                    onChange={e => setOpenForm({...openForm, notes: e.target.value})}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full">{t('Open Shift Now')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
