import { Suspense } from 'react';
import { requireMatchmaker } from '@/lib/auth';
import { getAssignedCustomers, matchPool } from '@/lib/profiles';
import DashboardClient from './dashboard-client';

async function AssignedCustomers() {
    const matchmaker = await requireMatchmaker();
    return (
        <DashboardClient
            matchmaker={matchmaker}
            profiles={getAssignedCustomers(matchmaker.name)}
            poolSize={matchPool.length}
        />
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="p-8 text-white/60"
                >
                    Loading assigned customers…
                </p>
            }
        >
            <AssignedCustomers />
        </Suspense>
    );
}
