export function homeForRole(role) {
    if (role === 'system_manager') return '/system';
    if (role === 'admin' || role === 'super_admin') return '/admin';
    return '/member';
}
