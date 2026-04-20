import React, { useState } from 'react';
import api from '../services/api';
import { Building2, Eye, EyeOff, Shield, Mail, Lock, CircuitBoard, Activity, Headphones } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';

interface LoginProps {
    onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { setRole } = useRole();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data;
            const { token } = userData;

            if (userData.role !== 'admin' && userData.role !== 'superadmin') {
                setError('Access denied. Admin privileges required.');
                setLoading(false);
                return;
            }

            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(userData));
            setRole(userData.role);
            onLoginSuccess();
        } catch (err: any) {
            console.error('Login Error:', err);
            if (err.response) {
                setError(err.response.data?.message || `Login failed: Server responded with status ${err.response.status}`);
            } else if (err.request) {
                setError('Login failed: No response from server. Check your internet connection.');
            } else {
                setError(`Login failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* LEFT SIDE - LOGIN FORM */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 lg:p-16 bg-white">
                <div className="w-full max-w-md space-y-6 sm:space-y-8">
                    {/* Brand Header */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="rounded-lg bg-[#57cf85] p-2">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold leading-none text-[#57cf85]">UrbanEase</h1>
                            <span className="text-lg font-bold leading-none text-[#57cf85]">Admin</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="text-gray-500">Please sign in to your admin account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 mt-8">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-gray-600 font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="admin@urbanease.com"
                                        value={email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        required
                                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 outline-none transition-all focus:border-[#57cf85] focus:bg-white focus:ring-[#57cf85]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-gray-600 font-medium">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 outline-none transition-all focus:border-[#57cf85] focus:bg-white focus:ring-[#57cf85]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#57cf85] accent-[#57cf85] focus:ring-[#57cf85]"
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <a href="#" className="self-start text-sm font-medium text-[#57cf85] transition-colors hover:text-[#47b772] sm:self-auto">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#57cf85] text-lg font-semibold text-white shadow-lg shadow-[#57cf85]/30 transition-all hover:bg-[#4fc57a] hover:shadow-[#57cf85]/45"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                    Signing In...
                                </>
                            ) : 'Sign In'}
                        </button>


                    </form>


                </div>
            </div>

            {/* RIGHT SIDE - BRIEFING / BRANDING */}
            <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#57cf85] p-12 text-white shadow-lg lg:flex">
                {/* Decorative background curve */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-white/5 opacity-50" style={{ clipPath: 'ellipse(70% 50% at 50% 100%)' }}></div>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-white/10 opacity-30" style={{ clipPath: 'ellipse(60% 60% at 50% 100%)' }}></div>

                <div className="relative z-10 text-center max-w-lg">
                    <div className="mx-auto w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/30">
                        <Shield className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-4xl font-bold mb-6">Secure Admin Access</h2>
                    <p className="text-lg text-white/90 mb-10 leading-relaxed">
                        Manage your community with confidence. Access powerful tools designed for efficient administration.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-medium">Advanced Security</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                            <Headphones className="w-4 h-4" />
                            <span className="text-sm font-medium">24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
