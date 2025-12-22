class LoadingService {
    constructor() {
        this.listeners = [];
        this.isLoading = false;
        this.requestCount = 0;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.isLoading));
    }

    start() {
        this.requestCount++;
        if (!this.isLoading) {
            this.isLoading = true;
            this.notify();
        }
    }

    stop() {
        if (this.requestCount > 0) {
            this.requestCount--;
        }

        if (this.requestCount === 0 && this.isLoading) {
            this.isLoading = false;
            this.notify();
        }
    }
}

export const loadingService = new LoadingService();
