import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { register, login } from './auth';
export default function AuthPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setInfo('');
        try {
            if (mode === 'register') {
                await register(email, password);
                setInfo('Registered! Check your email to confirm, then log in.');
                setMode('login');
            }
            else {
                const token = await login(email, password);
                onLogin(token);
            }
        }
        catch (err) {
            setError(err.message ?? 'Something went wrong');
        }
    }
    return (_jsxs("div", { style: { maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }, children: [_jsx("h2", { children: "\uD83D\uDCCD Nearby Friends" }), _jsx("h3", { children: mode === 'login' ? 'Sign In' : 'Register' }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "email", placeholder: "Email", value: email, required: true, onChange: (e) => setEmail(e.target.value), style: { display: 'block', width: '100%', marginBottom: 8, padding: 8 } }), _jsx("input", { type: "password", placeholder: "Password", value: password, required: true, onChange: (e) => setPassword(e.target.value), style: { display: 'block', width: '100%', marginBottom: 8, padding: 8 } }), _jsx("button", { type: "submit", style: { width: '100%', padding: 10 }, children: mode === 'login' ? 'Sign In' : 'Register' })] }), error && _jsx("p", { style: { color: 'red' }, children: error }), info && _jsx("p", { style: { color: 'green' }, children: info }), _jsxs("p", { children: [mode === 'login' ? "Don't have an account? " : 'Already have an account? ', _jsx("button", { onClick: () => setMode(mode === 'login' ? 'register' : 'login'), style: { background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }, children: mode === 'login' ? 'Register' : 'Sign In' })] })] }));
}
