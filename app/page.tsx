import Link from 'next/link';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
            <div className="max-w-xs w-full space-y-8 text-center">
                <h1 className="font-instrument text-6xl tracking-tight text-white flex flex-col items-center gap-1">
                    The Date Crew
                    <span className="font-geist text-2xl tracking-normal text-rose-400 font-normal">
                        Matchmaker Portal
                    </span>
                </h1>
                <p className="text-gray-300 text-md">Internal tool for smart matchmaking</p>

                <div className="flex flex-row justify-center items-center gap-3 w-full">
                    <Link
                        href="/signup"
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-300 text-gray-800 font-medium shadow-sm transition duration-200 text-center"
                    >
                        Staff Access
                    </Link>
                    <Link
                        href="/login"
                        className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium shadow transition duration-200 text-center"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        </main>
    );
}
