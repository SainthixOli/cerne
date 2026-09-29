const SESSION_COOKIE = 'cerne_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api',
        maxAge: SESSION_MAX_AGE_MS
    };
}

function readCookie(req, name) {
    const header = req.get('Cookie');
    if (!header) return null;
    for (const part of header.split(';')) {
        const separator = part.indexOf('=');
        if (separator < 0) continue;
        const key = part.slice(0, separator).trim();
        if (key !== name) continue;
        try {
            return decodeURIComponent(part.slice(separator + 1));
        } catch {
            return null;
        }
    }
    return null;
}

function getSessionToken(req) {
    return readCookie(req, SESSION_COOKIE);
}

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, cookieOptions());
}

function clearSessionCookie(res) {
    const { maxAge: _maxAge, ...options } = cookieOptions();
    res.clearCookie(SESSION_COOKIE, options);
}

module.exports = {
    SESSION_COOKIE,
    getSessionToken,
    setSessionCookie,
    clearSessionCookie
};
