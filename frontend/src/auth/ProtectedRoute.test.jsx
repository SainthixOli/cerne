import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from './authContext';
import ProtectedRoute from './ProtectedRoute';

function renderGuard({ status = 'authenticated', role = 'professor', roles = ['professor'] } = {}) {
    const value = { status, user: status === 'authenticated' ? { id: 'user', role } : null };
    render(
        <AuthContext.Provider value={value}>
            <MemoryRouter initialEntries={['/private']}>
                <Routes>
                    <Route path="/login" element={<p>Login</p>} />
                    <Route path="/member" element={<p>Member home</p>} />
                    <Route path="/admin" element={<p>Admin home</p>} />
                    <Route element={<ProtectedRoute roles={roles} />}>
                        <Route path="/private" element={<p>Private content</p>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

describe('ProtectedRoute', () => {
    it('redireciona sessão anônima ao login', () => {
        renderGuard({ status: 'anonymous' });
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('permite somente funções declaradas', () => {
        renderGuard({ role: 'professor', roles: ['professor'] });
        expect(screen.getByText('Private content')).toBeInTheDocument();
    });

    it('redireciona função sem permissão sem conceder acesso', () => {
        renderGuard({ role: 'professor', roles: ['admin'] });
        expect(screen.getByText('Member home')).toBeInTheDocument();
        expect(screen.queryByText('Private content')).not.toBeInTheDocument();
    });
});
