import React, { useState } from 'react';
import { User } from '../types';
import { Store, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [code, setCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Por favor ingresa tu código.');
      return;
    }

    const user = users.find((u) => u.code.toUpperCase() === cleanCode);
    if (!user) {
      setErrorMessage(`El código "${cleanCode}" no existe en el sistema.`);
      return;
    }

    // Check if user is active
    if (!user.active) {
      setErrorMessage(`Acceso denegado: el usuario "${user.name}" ha sido dado de baja.`);
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo de la empresa */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-2xl shadow-emerald-950/80 mb-4 border border-emerald-400/30">
            <Store className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">
            Tienda Inés
          </h1>
        </div>

        {/* Formulario que solo pide el código */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="CÓDIGO DE ACCESO"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (errorMessage) setErrorMessage('');
              }}
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3.5 text-center font-mono text-lg font-extrabold text-white tracking-widest placeholder-slate-600 focus:outline-none transition-all shadow-inner"
              autoFocus
              required
            />

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-center gap-2 text-center animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
