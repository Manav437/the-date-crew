'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { login, type LoginState } from '@/app/actions/auth';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [state, formAction, pending] = useActionState<LoginState, FormData>(
        async (_previousState, formData) => login(formData),
        null,
    );

    useEffect(() => {
        const bgImg = new Image();
        bgImg.src = '/signup-bg.jpg';
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center px-2 bg-gray-950 bg-[url('/signup-bg.jpg')] bg-cover bg-center">
            <Link
                href="/"
                aria-label="Back to home"
                className="fixed top-4 left-4 flex items-center text-md text-white border bg-white/20 border-white/30 px-3 py-3 [corner-shape:squircle] rounded-[50px] hover:bg-white/30"
            >
                <ArrowLeft size={16} />
            </Link>

            <div className="max-w-md w-full p-6 space-y-6 ring bg-white/20 backdrop-blur-lg ring-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-center text-white">
                    Log in to <span className=" text-rose-400">TheDateCrew</span>
                </h2>

                <form
                    className="space-y-4"
                    action={formAction}
                    aria-busy={pending}
                >
                    <div className="relative mt-1">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="username"
                            maxLength={254}
                            aria-describedby={state?.error ? 'login-error' : undefined}
                            placeholder=" "
                            className="peer w-full px-4 pt-5 pb-2 border border-white/50 bg-transparent focus:outline-none focus:border-white/80 focus:bg-white/5 text-white text-sm placeholder-transparent"
                            required
                        />
                        <label
                            htmlFor="email"
                            className="absolute left-4 top-3.5 text-white/60 text-sm cursor-text transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-white peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-white pointer-events-none"
                        >
                            E-mail
                        </label>
                    </div>

                    <div className="relative mt-1">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            maxLength={256}
                            aria-describedby={state?.error ? 'login-error' : undefined}
                            placeholder=" "
                            className="peer w-full px-4 pt-5 pb-2 border border-white/50 bg-transparent focus:outline-none focus:border-white/80 focus:bg-white/5 text-white text-sm placeholder-transparent"
                            required
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-4 top-3.5 text-white/60 text-sm cursor-text transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-white peer-not-placeholder-shown:top-1.5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-white pointer-events-none"
                        >
                            Password
                        </label>
                    </div>

                    <div className="mx-auto flex justify-center gap-2 text-sm text-gray-200 pt-1">
                        <p>Need staff access?</p>
                        <Link
                            className="text-white font-medium underline-offset-2 hover:underline hover:text-rose-400 transition duration-200"
                            href="/signup"
                        >
                            Access information
                        </Link>
                    </div>

                    {state?.error && (
                        <p
                            id="login-error"
                            role="alert"
                            className="text-sm text-rose-200"
                        >
                            {state.error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="cursor-pointer mt-2 w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium transition disabled:cursor-wait disabled:opacity-60"
                    >
                        {pending ? 'Logging in…' : 'Log In'}
                    </button>
                </form>

                <div className="space-y-2 border-t border-white/20 pt-4 text-sm text-gray-200">
                    <p className="font-medium text-white">Synthetic demo credentials</p>
                    <p>
                        Email: <code className="break-all">manav@thedatecrew.com</code>
                    </p>
                    <p>
                        Password: <code>TdcDemo2026!</code>
                    </p>
                    <p className="text-xs text-white/60">
                        Shared demo access only. Do not enter real staff credentials.
                    </p>
                </div>
            </div>
        </div>
    );
}
