import { Suspense, type ReactNode } from 'react';
import { requireMatchmaker } from '@/lib/auth';

async function AuthenticatedDashboard({ children }: { children: ReactNode }) {
    await requireMatchmaker();
    return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="p-6 text-center text-white/70"
                >
                    Checking staff access…
                </p>
            }
        >
            <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
        </Suspense>
    );
}
