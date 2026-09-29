const UNAUTHORIZED_EVENT = 'cerne:unauthorized';
const FORBIDDEN_EVENT = 'cerne:forbidden';

export function notifyUnauthorized() {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}

export function notifyForbidden(detail) {
    window.dispatchEvent(new CustomEvent(FORBIDDEN_EVENT, { detail }));
}

export function subscribeToUnauthorized(listener) {
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, listener);
}

export function subscribeToForbidden(listener) {
    window.addEventListener(FORBIDDEN_EVENT, listener);
    return () => window.removeEventListener(FORBIDDEN_EVENT, listener);
}
