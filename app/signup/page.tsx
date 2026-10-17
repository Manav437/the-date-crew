import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-2 bg-gray-950 bg-[url('/signup-bg.jpg')] bg-cover bg-center">
            <Link
                href="/"
                aria-label="Back to home"
                className="fixed top-4 left-4 flex items-center text-md text-white border bg-white/20 border-white/30 px-3 py-3 [corner-shape:squircle] rounded-[50px] hover:bg-white/30"
            >
                <ArrowLeft size={16} />
            </Link>

            <div className="max-w-md w-full p-6 space-y-6 ring bg-white/10 backdrop-blur-lg ring-white/20 shadow-xl">
                <h2 className="text-2xl font-bold text-center text-white">
                    Internal <span className="text-rose-400">staff access</span>
                </h2>
                <div className="space-y-4 text-sm text-gray-200 text-center">
                    <p>
                        TheDateCrew dashboard is for internal matchmaking staff. Public registration
                        is not available.
                    </p>
                    <p>
                        This MVP uses a shared, synthetic demo account-not a real staff account. No
                        account is created and no registration details are collected.
                    </p>
                    <p>For real staff access, contact your team administrator.</p>
                </div>
                <Link
                    href="/login"
                    className="block w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-center transition"
                >
                    Go to demo login
                </Link>
            </div>
        </div>
    );
}
