import { expect, test } from '@playwright/test';

async function mockSession(page, role, status = 200) {
    await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/auth/session', (route) => route.fulfill({
        status,
        contentType: 'application/json',
        body: status === 200 ? JSON.stringify({ user: { id: `${role}-id`, name: 'Teste', role, status: 'ativo' } }) :
            JSON.stringify({ error: 'Não autenticado', code: 'UNAUTHENTICATED' })
    }));
}

for (const scenario of [
    { role: 'professor', target: '/admin', expected: '/member' },
    { role: 'admin', target: '/system', expected: '/admin' },
    { role: 'super_admin', target: '/admin', expected: '/admin' },
    { role: 'system_manager', target: '/member', expected: '/system' }
]) {
    test(`${scenario.role} respeita o guard de navegação`, async ({ page }) => {
        await mockSession(page, scenario.role);
        await page.goto(scenario.target);
        await expect(page).toHaveURL(new RegExp(`${scenario.expected}$`));
    });
}

test('sessão expirada redireciona ao login', async ({ page }) => {
    await mockSession(page, 'professor', 401);
    await page.goto('/member');
    await expect(page).toHaveURL(/\/login$/);
});
