import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

export type Matchmaker = { name: string; email: string };

const DEMO_MATCHMAKER: Matchmaker = { name: 'Manav', email: 'manav@thedatecrew.com' };
const DEMO_PASSWORD = 'TdcDemo2026!';
const COOKIE_NAME = 'tdc_demo_session';
const SESSION_SECONDS = 8 * 60 * 60;

function authSecret(): string {
    const secret = process.env.AUTH_SECRET;
    if (secret && Buffer.byteLength(secret) >= 32) return secret;
    if (!secret && process.env.NODE_ENV === 'development') {
        // Public, stable fallback exclusively for local development, never production.
        return 'tdc-demo-development-only-secret-not-for-production';
    }
    throw new Error('AUTH_SECRET must contain at least 32 bytes (required outside development).');
}

function equalCredential(actual: string, expected: string): boolean {
    return timingSafeEqual(
        createHash('sha256').update(actual).digest(),
        createHash('sha256').update(expected).digest(),
    );
}

function signature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('base64url');
}

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
});

/** Synthetic demo account only; no registration or real staff credentials. */
export async function createMatchmakerSession(email: string, password: string): Promise<boolean> {
    const secret = authSecret();
    if (email.length > 254 || password.length > 256) return false;
    const emailMatches = equalCredential(email.trim().toLowerCase(), DEMO_MATCHMAKER.email);
    const passwordMatches = equalCredential(password, DEMO_PASSWORD);
    if (!emailMatches || !passwordMatches) return false;

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + SESSION_SECONDS;
    const payload = Buffer.from(
        JSON.stringify({
            version: 1,
            email: DEMO_MATCHMAKER.email,
            issuedAt,
            expiresAt,
        }),
    ).toString('base64url');

    (await cookies()).set(COOKIE_NAME, `${payload}.${signature(payload, secret)}`, {
        ...cookieOptions(),
        expires: new Date(expiresAt * 1000),
        maxAge: SESSION_SECONDS,
    });
    return true;
}

export async function deleteMatchmakerSession(): Promise<void> {
    (await cookies()).set(COOKIE_NAME, '', {
        ...cookieOptions(),
        expires: new Date(0),
        maxAge: 0,
    });
}

// Intentionally uncached: both the cookie and token expiry are request-dependent.
export async function getMatchmaker(): Promise<Matchmaker | null> {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token || token.length > 1024) return null;
    // Expiry must use real request time, never a prerender or prefetch snapshot.
    await connection();
    const secret = authSecret();

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, suppliedSignature] = parts;
    if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature)) {
        return null;
    }
    if (!timingSafeEqual(Buffer.from(suppliedSignature), Buffer.from(signature(payload, secret)))) {
        return null;
    }

    try {
        const session: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!session || typeof session !== 'object') return null;
        const { version, email, issuedAt, expiresAt } = session as Record<string, unknown>;
        const now = Math.floor(Date.now() / 1000);
        if (
            version !== 1 ||
            email !== DEMO_MATCHMAKER.email ||
            typeof issuedAt !== 'number' ||
            !Number.isSafeInteger(issuedAt) ||
            typeof expiresAt !== 'number' ||
            !Number.isSafeInteger(expiresAt) ||
            issuedAt > now ||
            issuedAt < 0 ||
            expiresAt <= now ||
            expiresAt - issuedAt !== SESSION_SECONDS
        )
            return null;
        return { ...DEMO_MATCHMAKER };
    } catch {
        return null;
    }
}

export async function requireMatchmaker(): Promise<Matchmaker> {
    const matchmaker = await getMatchmaker();
    if (!matchmaker) redirect('/login');
    return matchmaker;
}
