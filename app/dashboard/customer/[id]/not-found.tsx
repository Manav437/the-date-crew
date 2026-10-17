import Link from 'next/link';

export default function CustomerNotFound() {
    return (
        <main className="max-w-lg mx-auto px-6 py-24 text-center">
            <h1 className="text-2xl font-semibold">Customer not found</h1>

            <p className="text-white/50 mt-3 mb-6">
                This profile doesn’t exist or isn’t assigned to you.
            </p>

            <Link
                href="/dashboard"
                className="inline-block px-5 py-3 bg-rose-600 hover:bg-rose-700 text-sm"
            >
                Back to your customers
            </Link>
        </main>
    );
}
