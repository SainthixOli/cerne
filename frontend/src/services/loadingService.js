const subscribers = new Set();
let requestCount = 0;
let startTime = 0;
const minDuration = 800; // 0.8s minimum display

export const loadingService = {
    subscribe: (callback) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    },

    start: () => {
        if (requestCount === 0) {
            startTime = Date.now();
            subscribers.forEach(callback => callback(true));
        }
        requestCount++;
    },

    stop: () => {
        if (requestCount > 0) {
            requestCount--;
        }

        if (requestCount === 0) {
            const elapsed = Date.now() - startTime;
            const remaining = minDuration - elapsed;

            if (remaining > 0) {
                setTimeout(() => {
                    // Double check if still 0 requests (user didn't trigger another load)
                    if (requestCount === 0) {
                        subscribers.forEach(callback => callback(false));
                    }
                }, remaining);
            } else {
                subscribers.forEach(callback => callback(false));
            }
        }
    }
};
