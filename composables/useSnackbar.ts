import { useSnackbarStore } from '~/store/snackbar';

/**
 * Composable for showing snackbar notifications
 * Provides a convenient API for displaying different types of notifications
 */
export function useSnackbar() {
  const snackbarStore = useSnackbarStore();

  return {
    /**
     * Show a success notification
     * @param message - Main message to display
     * @param subtitle - Optional subtitle
     * @param timeout - Auto-hide timeout in milliseconds (default: 4000)
     */
    success: (message: string, subtitle?: string, timeout?: number) => {
      return snackbarStore.showSuccess(message, subtitle, timeout);
    },

    /**
     * Show an error notification
     * @param message - Main message to display
     * @param subtitle - Optional subtitle
     * @param timeout - Auto-hide timeout in milliseconds (default: 6000)
     */
    error: (message: string, subtitle?: string, timeout?: number) => {
      return snackbarStore.showError(message, subtitle, timeout);
    },

    /**
     * Show an info notification
     * @param message - Main message to display
     * @param subtitle - Optional subtitle
     * @param timeout - Auto-hide timeout in milliseconds (default: 4000)
     */
    info: (message: string, subtitle?: string, timeout?: number) => {
      return snackbarStore.showInfo(message, subtitle, timeout);
    },

    /**
     * Show a warning notification
     * @param message - Main message to display
     * @param subtitle - Optional subtitle
     * @param timeout - Auto-hide timeout in milliseconds (default: 5000)
     */
    warning: (message: string, subtitle?: string, timeout?: number) => {
      return snackbarStore.showWarning(message, subtitle, timeout);
    },

    /**
     * Show a custom notification
     * @param options - Notification options
     */
    show: (options: {
      message: string;
      subtitle?: string;
      type?: 'success' | 'error' | 'info' | 'warning';
      timeout?: number;
    }) => {
      return snackbarStore.showSnackbar(options);
    },

    /**
     * Hide a specific notification by ID
     * @param id - Notification ID
     */
    hide: (id: number) => {
      return snackbarStore.hideSnackbar(id);
    },

    /**
     * Hide all notifications
     */
    hideAll: () => {
      return snackbarStore.hideAllSnackbars();
    },
  };
}
