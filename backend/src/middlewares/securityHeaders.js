/**
 * Security Headers Middleware
 * Implementa headers avançados de segurança: CSP, HSTS, X-Frame-Options, etc.
 */

module.exports = (req, res, next) => {
    // Content Security Policy (CSP) - Previne XSS e injeção de recursos
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://api.github.com; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
    );

    // HSTS (HTTP Strict Transport Security) - Force HTTPS
    res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    // X-Content-Type-Options - Previne MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options - Previne clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection - Legacy XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy - Controla informação de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy (Feature-Policy) - Controla APIs do navegador
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
    );

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Remove Server header
    res.removeHeader('Server');

    next();
};
