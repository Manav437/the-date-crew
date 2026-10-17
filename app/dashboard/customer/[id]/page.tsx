import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireMatchmaker } from '@/lib/auth';
import { getCustomer, matchPool } from '@/lib/profiles';
import { buildIntro, getCompatibleMatches } from '@/lib/matching';
import CustomerDetail from './customer-detail';

async function CustomerProfile({ params }: PageProps<'/dashboard/customer/[id]'>) {
    const matchmaker = await requireMatchmaker();
    const { id } = await params;
    const customer = getCustomer(id);
    if (!customer || customer.assignedMatchmaker !== matchmaker.name) notFound();
    const matches = getCompatibleMatches(customer).map((match) => ({
        ...match,
        introDraft: buildIntro(customer, match),
    }));
    return (
        <CustomerDetail
            key={customer.id}
            customer={customer}
            matches={matches}
            poolCount={matchPool.filter((p) => p.gender !== customer.gender).length}
            aiEnabled={Boolean(process.env.OPENAI_API_KEY?.trim())}
        />
    );
}

export default function CustomerDetailPage(props: PageProps<'/dashboard/customer/[id]'>) {
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="min-h-screen p-8 text-white/60"
                >
                    Loading customer profile…
                </p>
            }
        >
            <CustomerProfile {...props} />
        </Suspense>
    );
}
