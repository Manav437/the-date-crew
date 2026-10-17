'use server';

import { redirect } from 'next/navigation';
import { createMatchmakerSession, deleteMatchmakerSession } from '@/lib/auth';

export type LoginState = { error: string } | null;

export async function login(formData: FormData): Promise<LoginState> {
    const email = formData.get('email');
    const password = formData.get('password');
    if (typeof email !== 'string' || typeof password !== 'string') {
        return { error: 'Enter your demo email and password.' };
    }
    if (!(await createMatchmakerSession(email, password))) {
        return { error: 'Invalid email or password. Use the synthetic demo credentials below.' };
    }
    redirect('/dashboard');
}

export async function logout(): Promise<never> {
    await deleteMatchmakerSession();
    redirect('/login');
}
