import { getMatchmaker } from '@/lib/auth';
import { generateIntro } from '@/lib/ai-intro';
import { getCompatibleMatches } from '@/lib/matching';
import { getCustomer } from '@/lib/profiles';

const MAX_BODY_BYTES = 2048;
const WINDOW_MS = 60_000;
const MAX_GENERATIONS = 5;

const generations = new Map<string, number[]>();

function reserveGeneration(email: string): number {
    const now = Date.now();
    for (const [key, times] of generations) {
        const current = times.filter((time) => time > now - WINDOW_MS);
        if (current.length) generations.set(key, current);
        else generations.delete(key);
    }
    const times = generations.get(email) ?? [];
    if (times.length >= MAX_GENERATIONS)
        return Math.max(1, Math.ceil((times[0] + WINDOW_MS - now) / 1000));
    generations.set(email, [...times, now]);
    return 0;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export async function POST(request: Request): Promise<Response> {
    const matchmaker = await getMatchmaker();
    if (!matchmaker) return json({ error: 'Authentication required.' }, 401);

    const origin = request.headers.get('origin');
    if (origin !== null) {
        const url = new URL(request.url);

        const expectedOrigin =
            process.env.APP_ORIGIN?.trim() ||
            `${url.protocol}//${request.headers.get('host') ?? url.host}`;
        if (origin !== expectedOrigin) {
            return json({ error: 'Cross-origin requests are not allowed.' }, 403);
        }
    }

    const length = request.headers.get('content-length');
    if (length !== null) {
        if (!/^\d+$/.test(length)) return json({ error: 'Invalid Content-Length.' }, 400);
        if (Number(length) > MAX_BODY_BYTES)
            return json({ error: 'Request body exceeds 2 KB.' }, 413);
    }

    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'A JSON body is required.' }, 400);
    let text = '';
    let bytes = 0;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_BODY_BYTES) {
                void reader.cancel().catch(() => { });
                return json({ error: 'Request body exceeds 2 KB.' }, 413);
            }
            text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
    } catch {
        return json({ error: 'Invalid request body.' }, 400);
    } finally {
        reader.releaseLock();
    }

    let body: unknown;
    try {
        body = JSON.parse(text);
    } catch {
        return json({ error: 'Invalid JSON.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json({ error: 'customerId and matchId are required.' }, 400);
    }
    const { customerId, matchId } = body as Record<string, unknown>;
    const validId = (id: unknown): id is string =>
        typeof id === 'string' && id.length > 0 && id.length <= 128 && id.trim() === id;
    if (!validId(customerId) || !validId(matchId)) {
        return json({ error: 'customerId and matchId must be nonempty ID strings.' }, 400);
    }

    const customer = getCustomer(customerId);
    if (!customer || customer.assignedMatchmaker !== matchmaker.name) {
        return json({ error: 'Customer not found.' }, 404);
    }
    const match = getCompatibleMatches(customer).find((candidate) => candidate.id === matchId);
    if (!match) return json({ error: 'Suggested match not found.' }, 404);

    const apiKey = process.env.OPENAI_API_KEY?.trim() || '';
    if (apiKey) {
        const retryAfter = reserveGeneration(matchmaker.email);
        if (retryAfter)
            return json({ error: 'AI generation limit reached. Please try again shortly.' }, 429, {
                'Retry-After': String(retryAfter),
            });
    }
    return json(await generateIntro(customer, match, { apiKey }));
}
