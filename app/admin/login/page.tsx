'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenInput }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha no login.');
      }

      // Se o login foi bem-sucedido, redireciona para o dashboard
      router.push('/admin/dashboard');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Login do Administrador</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="jwt" className="block text-sm font-medium text-gray-700">
              Chave de Acesso
            </label>
            <input
              id="jwt"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="form-input mt-1"
              placeholder="Insira sua chave de acesso"
              disabled={isLoading}
            />
          </div>
          {error && <p className="form-message">{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}