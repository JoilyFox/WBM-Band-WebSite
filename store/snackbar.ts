import { defineStore } from "pinia";

export interface Snackbar {
  id: number;
  message: string;
  subtitle?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timeout: number;
  show: boolean;
  timerId?: NodeJS.Timeout;
  startTime?: number;
  remainingTime?: number;
  isPaused?: boolean;
}

export const useSnackbarStore = defineStore("snackbar", {
  state: () => ({
    snackbars: [] as Snackbar[],
    nextId: 1,
  }),

  getters: {
    visibleSnackbars: (state) => state.snackbars.filter(snackbar => snackbar.show),
  },

  actions: {
    /**
     * Displays a snackbar with a message and optional settings.
     * Multiple snackbars can be shown simultaneously.
     * @param {object} options - The snackbar options.
     * @param {string} options.message - The message to display.
     * @param {string} [options.subtitle] - An optional subtitle.
     * @param {'success' | 'error' | 'info' | 'warning'} [options.type='info'] - The notification type.
     * @param {number} [options.timeout=4000] - The duration in milliseconds before the snackbar auto-hides.
     */
    showSnackbar({ 
      message, 
      subtitle, 
      type = 'info', 
      timeout = 4000 
    }: {
      message: string;
      subtitle?: string;
      type?: 'success' | 'error' | 'info' | 'warning';
      timeout?: number;
    }) {
      const id = this.nextId++;
      const snackbar: Snackbar = {
        id,
        message,
        subtitle,
        type,
        timeout,
        show: true,
        timerId: undefined,
        startTime: Date.now(),
        remainingTime: timeout,
        isPaused: false,
      };

      this.snackbars.push(snackbar);

      // Set up auto-hide timer
      if (timeout > 0) {
        this.startTimer(snackbar);
      }

      return id;
    },

    /**
     * Starts or restarts the timer for a snackbar
     */
    startTimer(snackbar: Snackbar) {
      if (snackbar.timerId) {
        clearTimeout(snackbar.timerId);
      }
      
      const timeToUse = snackbar.remainingTime || snackbar.timeout;
      snackbar.startTime = Date.now();
      snackbar.timerId = setTimeout(() => {
        this.hideSnackbar(snackbar.id);
      }, timeToUse);
    },

    /**
     * Pauses the timer for a snackbar
     */
    pauseTimer(id: number) {
      const snackbar = this.snackbars.find(s => s.id === id);
      if (snackbar && snackbar.timerId && !snackbar.isPaused) {
        clearTimeout(snackbar.timerId);
        const elapsed = Date.now() - (snackbar.startTime || Date.now());
        snackbar.remainingTime = Math.max(0, (snackbar.remainingTime || snackbar.timeout) - elapsed);
        snackbar.isPaused = true;
      }
    },

    /**
     * Resumes the timer for a snackbar
     */
    resumeTimer(id: number) {
      const snackbar = this.snackbars.find(s => s.id === id);
      if (snackbar && snackbar.isPaused && snackbar.remainingTime && snackbar.remainingTime > 0) {
        snackbar.isPaused = false;
        this.startTimer(snackbar);
      }
    },

    /**
     * Hides a specific snackbar by its ID.
     * @param {number} id - The ID of the snackbar to hide.
     */
    hideSnackbar(id: number) {
      const snackbar = this.snackbars.find(s => s.id === id);
      if (snackbar) {
        snackbar.show = false;
        if (snackbar.timerId) {
          clearTimeout(snackbar.timerId);
        }
        
        // Remove from array after animation completes
        setTimeout(() => {
          const index = this.snackbars.findIndex(s => s.id === id);
          if (index !== -1) {
            this.snackbars.splice(index, 1);
          }
        }, 500); // Match animation duration
      }
    },

    /**
     * Hides all snackbars immediately.
     */
    hideAllSnackbars() {
      this.snackbars.forEach((snackbar) => {
        snackbar.show = false;
        if (snackbar.timerId) {
          clearTimeout(snackbar.timerId);
        }
      });
      
      // Clear array after animation
      setTimeout(() => {
        this.snackbars = [];
      }, 500);
    },

    /**
     * Convenience methods for different notification types
     */
    showSuccess(message: string, subtitle?: string, timeout?: number) {
      return this.showSnackbar({ message, subtitle, type: 'success', timeout });
    },

    showError(message: string, subtitle?: string, timeout?: number) {
      return this.showSnackbar({ message, subtitle, type: 'error', timeout: timeout || 6000 });
    },

    showInfo(message: string, subtitle?: string, timeout?: number) {
      return this.showSnackbar({ message, subtitle, type: 'info', timeout });
    },

    showWarning(message: string, subtitle?: string, timeout?: number) {
      return this.showSnackbar({ message, subtitle, type: 'warning', timeout: timeout || 5000 });
    },
  },
});
