import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastOptions {
  description?: string;
  duration?: number;
}

export function showToast(type: ToastType, message: string, options?: ToastOptions) {
  const { description, duration = 2000 } = options || {};

  switch (type) {
    case 'success':
      sonnerToast.success(message, { description, duration });
      break;
    case 'error':
      sonnerToast.error(message, { description, duration });
      break;
    case 'info':
      sonnerToast.info(message, { description, duration });
      break;
    case 'warning':
      sonnerToast.warning(message, { description, duration });
      break;
    case 'loading':
      sonnerToast.loading(message, { description });
      break;
  }
}

// Convenience methods
export const toast = {
  success: (message: string, description?: string) => showToast('success', message, { description }),
  error: (message: string, description?: string) => showToast('error', message, { description }),
  info: (message: string, description?: string) => showToast('info', message, { description }),
  warning: (message: string, description?: string) => showToast('warning', message, { description }),
  loading: (message: string) => showToast('loading', message),
  dismiss: () => sonnerToast.dismiss(),
};
