import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PageProps {
    flash?: {
        success?: string;
        error?: string;
        [key: string]: any;
    };
    errors?: Record<string, string>;
    [key: string]: any;
}

export default function FlashMessages() {
    const { flash, errors } = usePage<PageProps>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }

        // Show validation errors as toasts
        if (errors) {
            Object.values(errors).forEach((error) => {
                toast.error(error);
            });
        }
    }, [flash, errors]);

    return null;
}