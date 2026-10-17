import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMatchmaker } from '@/lib/auth';
import LoginForm from './login-form';

async function LoginAccess() {
    const matchmaker = await getMatchmaker();
    if (matchmaker) redirect('/dashboard');
    return <LoginForm />;
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="p-6 text-center text-white/70"
                >
                    Checking your session…
                </p>
            }
        >
            <LoginAccess />
        </Suspense>
    );
}
