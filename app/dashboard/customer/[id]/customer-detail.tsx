'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/lib/profiles';
import type { CompatibleMatch } from '@/lib/matching';
import { useDemoWorkspace } from '@/lib/demo-workspace';

type SuggestedMatch = CompatibleMatch & { introDraft: string };
type Preview = {
    match: SuggestedMatch;
    intro: string;
    source: 'template' | 'groq';
    notice: string;
};
function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-white/45 text-xs mb-1">{label}</dt>
            <dd className="text-white/85 wrap-break-word">{children}</dd>
        </div>
    );
}
function activityId() {
    return (
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
}
function dateTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
}

export default function CustomerDetail({
    customer,
    matches,
    poolCount,
    aiEnabled,
}: {
    customer: Profile;
    matches: SuggestedMatch[];
    poolCount: number;
    aiEnabled: boolean;
}) {
    const [notes, setNotes] = useState('');
    const [preview, setPreview] = useState<Preview | null>(null);
    const [generating, setGenerating] = useState(false);
    const [toast, setToast] = useState('');
    const { activities, update, storageError } = useDemoWorkspace();
    const activity = activities[customer.id];
    const status = activity?.status ?? customer.statusTag;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const requestRef = useRef<AbortController | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (preview) dialogRef.current?.showModal();
        else dialogRef.current?.close();
    }, [preview]);

    useEffect(() => () => requestRef.current?.abort(), []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    function addNote(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const text = notes.trim();
        if (!text) return;
        if (
            update(customer.id, (current) => ({
                ...current,
                notes: [
                    {
                        id: activityId(),
                        text,
                        author: customer.assignedMatchmaker,
                        createdAt: new Date().toISOString(),
                    },
                    ...current.notes,
                ],
            }))
        )
            setNotes('');
    }

    function closePreview() {
        requestRef.current?.abort();
        setGenerating(false);
        setPreview(null);
        triggerRef.current?.focus();
    }

    function openPreview(match: SuggestedMatch, trigger: HTMLButtonElement) {
        requestRef.current?.abort();
        triggerRef.current = trigger;
        setGenerating(false);
        setPreview({
            match,
            intro: match.introDraft,
            source: 'template',
            notice: aiEnabled
                ? 'Rule-based draft. Generate an AI version if you would like.'
                : 'AI is not configured. This is a rule-based draft, not AI output.',
        });
    }

    async function generateIntro() {
        if (!preview || generating) return;
        const controller = new AbortController();
        requestRef.current?.abort();
        requestRef.current = controller;
        setGenerating(true);
        try {
            const response = await fetch('/api/intro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, matchId: preview.match.id }),
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(
                    response.status === 429
                        ? 'Too many AI requests. Please wait a minute and try again.'
                        : response.status === 401
                            ? 'Your session expired. Log in again to generate an intro.'
                            : response.status === 403
                                ? 'Request origin does not match APP_ORIGIN. Use localhost in local settings and your hosted URL in deployment settings.'
                                : 'Could not generate an intro. The rule-based draft is still available.',
                );
            const result = await response.json();
            if (typeof result.intro !== 'string' || !['template', 'groq'].includes(result.source))
                throw new Error('Unexpected AI response. Please use the rule-based draft.');
            if (!controller.signal.aborted)
                setPreview((current) =>
                    current
                        ? {
                            ...current,
                            intro: result.intro,
                            source: result.source,
                            notice: result.notice,
                        }
                        : current,
                );
        } catch (error) {
            if (!controller.signal.aborted)
                setPreview((current) =>
                    current
                        ? {
                            ...current,
                            notice:
                                error instanceof Error
                                    ? error.message
                                    : 'Generation failed. You can still use the rule-based draft.',
                        }
                        : current,
                );
        } finally {
            if (!controller.signal.aborted) setGenerating(false);
        }
    }

    function sendMock() {
        if (!preview || generating) return;
        if (
            update(customer.id, (current) => ({
                ...current,
                status: 'Introduction Sent',
                sentMatches: [
                    {
                        id: activityId(),
                        matchId: preview.match.id,
                        name: `${preview.match.firstName} ${preview.match.lastName}`,
                        intro: preview.intro,
                        source: preview.source,
                        createdAt: new Date().toISOString(),
                    },
                    ...current.sentMatches,
                ],
            }))
        ) {
            closePreview();
            setToast('Mock introduction recorded. No real email was sent.');
        }
    }

    return (
        <div className="min-h-screen text-white bg-white/5 pb-12">
            <header className="w-full sticky top-0 z-40 backdrop-blur-md border-b border-white/20 px-4 sm:px-8 lg:px-28 py-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        aria-label="Back to dashboard"
                        className="mr-2 flex items-center text-md text-white border bg-white/20 border-white/30 px-3 py-3 [corner-shape:squircle] rounded-[50px] hover:bg-white/30"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Client Profile</h1>
                        <span className="text-sm text-rose-400">Matchmaking View</span>
                    </div>
                </div>
                <div className="text-xs text-white/50 flex items-center gap-2">
                    <span>Journey status</span>
                    <span className="border border-white/25 bg-white/40 text-white text-xs px-3 py-2">
                        {status}
                    </span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                <p className="text-xs text-white/50">
                    Fictional assignment data · Changes are stored only in this browser · No real
                    emails are sent.
                </p>
                {storageError && (
                    <p
                        role="alert"
                        className="border border-red-400/40 bg-red-400/10 p-3 text-red-200 text-sm"
                    >
                        {storageError}
                    </p>
                )}
                <section className="bg-white/5 border border-white/20 p-5 sm:p-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-start border-b border-white/20 pb-6 mb-6 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold">
                                {customer.firstName} {customer.lastName}
                            </h2>
                            <p className="text-white/60 text-sm mt-2">
                                {customer.gender} · {customer.age} years · {customer.city},{' '}
                                {customer.country}
                            </p>
                            <span className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-300">
                                <CheckCircle2 size={14} />
                                Verified demo profile
                            </span>
                        </div>
                        <div className="flex flex-col items-end bg-rose-200 p-3 text-zinc-900">
                            <span className="text-xs block opacity-60 border-b pb-1 border-black/50">Assigned matchmaker</span>
                            <span className="font-semibold">{customer.assignedMatchmaker}</span>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div className="bg-black/20 border border-white/10 p-4">
                            <h3 className="font-semibold border-b border-white/10 pb-3 mb-4">
                                Personal & contact
                            </h3>
                            <dl className="space-y-4">
                                <Field label="Email">{customer.email}</Field>
                                <Field label="Phone">{customer.phone}</Field>
                                <Field label="Date of birth">{customer.dob}</Field>
                                <Field label="Height">{customer.height}</Field>
                                <Field label="Marital status">{customer.maritalStatus}</Field>
                                <Field label="Languages known">
                                    {customer.languagesKnown.join(', ')}
                                </Field>
                                <Field label="Mother tongue">{customer.motherTongue}</Field>
                            </dl>
                        </div>
                        <div className="bg-black/20 border border-white/10 p-4">
                            <h3 className="font-semibold border-b border-white/10 pb-3 mb-4">
                                Education & career
                            </h3>
                            <dl className="space-y-4">
                                <Field label="Undergraduate college">{customer.college}</Field>
                                <Field label="Degree">{customer.degree}</Field>
                                <Field label="Company">{customer.currentCompany}</Field>
                                <Field label="Designation">{customer.designation}</Field>
                                <Field label="Annual income">
                                    ₹{customer.income.toLocaleString('en-IN')} (
                                    {(customer.income / 100000).toFixed(1)} LPA)
                                </Field>
                                <Field label="Country / city">
                                    {customer.country} / {customer.city}
                                </Field>
                            </dl>
                        </div>
                        <div className="bg-black/20 border border-white/10 p-4">
                            <h3 className="font-semibold border-b border-white/10 pb-3 mb-4">
                                Family & lifestyle
                            </h3>
                            <dl className="grid grid-cols-2 gap-4">
                                <Field label="Siblings">{customer.siblings}</Field>
                                <Field label="Family values">{customer.familyValues}</Field>
                                <Field label="Religion">{customer.religion}</Field>
                                <Field label="Caste">{customer.caste}</Field>
                                <Field label="Wants children">{customer.wantKids}</Field>
                                <Field label="Open to relocate">{customer.openToRelocate}</Field>
                                <Field label="Open to pets">{customer.openToPets}</Field>
                                <Field label="Diet">{customer.diet}</Field>
                                <Field label="Smoking">{customer.smoking}</Field>
                                <Field label="Drinking">{customer.drinking}</Field>
                            </dl>
                        </div>
                    </div>
                </section>
                <section className="bg-white/5 border border-white/20 p-5 sm:p-8">
                    <div className="border-b border-white/20 pb-5 mb-6">
                        <h3 className="text-2xl font-bold">Potential matches</h3>
                        <p className="text-sm mt-2 text-white/50">
                            Top {matches.length} from {poolCount} opposite-gender demo profiles
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {matches.map((match) => {
                            const sent = activity?.sentMatches.some(
                                (item) => item.matchId === match.id,
                            );
                            return (
                                <article
                                    key={match.id}
                                    className="border border-white/15 p-5 flex flex-col bg-black/25"
                                >
                                    <div className="flex justify-between gap-3">
                                        <h4 className="font-bold text-lg">
                                            {match.firstName} {match.lastName}
                                        </h4>
                                        <span className="shrink-0 text-sm text-rose-200 bg-rose-400/10 px-2 py-1 self-start">
                                            {match.matchScore}/100
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/60 mt-2">
                                        {match.age} years · {match.city} · {match.designation}
                                    </p>
                                    <p className="text-xs text-white/45 mt-2">
                                        {match.height} · {match.diet} · Children: {match.wantKids}
                                    </p>
                                    <p className="text-sm text-white/70 bg-white/5 p-3 mt-4 mb-5 leading-relaxed flex-1">
                                        {match.aiRationale}
                                    </p>
                                    <button
                                        onClick={(e) => openPreview(match, e.currentTarget)}
                                        className="cursor-pointer w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-sm font-medium"
                                    >
                                        {sent
                                            ? 'Review / send again (mock)'
                                            : 'Send Match · Preview Intro'}
                                    </button>
                                    {sent && (
                                        <p className="text-xs text-emerald-300 mt-2">
                                            Previously recorded as a mock introduction
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                    {matches.length === 0 && (
                        <p className="text-white/50 py-8 text-center">
                            No eligible matches meet the required criteria. No criteria have been
                            relaxed.
                        </p>
                    )}
                </section>
                <section className="bg-white/5 border border-white/20 p-5 sm:p-8">
                    <h3 className="text-2xl font-bold mb-2">Matchmaker session notes</h3>
                    {/*<p className="text-xs text-white/45 mb-5">
                        Private to this browser. Don’t enter real personal information in this demo.
                    </p>*/}
                    <form
                        onSubmit={addNote}
                        className="flex flex-col mt-3 sm:flex-row gap-3 mb-6"
                    >
                        <label
                            className="sr-only"
                            htmlFor="session-note"
                        >
                            Meeting or call note
                        </label>
                        <textarea
                            id="session-note"
                            rows={3}
                            maxLength={2000}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Record a meeting, call, or follow-up…"
                            className="flex-1 p-3 border border-white/30 text-sm bg-black/40 focus:outline-none focus:border-rose-300"
                        />
                        <button
                            disabled={!notes.trim()}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 self-end px-5 py-3 bg-white text-black text-sm font-medium"
                        >
                            Save note
                        </button>
                    </form>
                    <div className="space-y-3">
                        {activity?.notes.map((note) => (
                            <article
                                key={note.id}
                                className="p-4 bg-black/20 border border-white/10"
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {note.text}
                                </p>
                                <p className="text-xs text-white/40 mt-3">
                                    {note.author} ·{' '}
                                    <time dateTime={note.createdAt}>
                                        {dateTime(note.createdAt)}
                                    </time>
                                </p>
                            </article>
                        ))}
                        {!activity?.notes.length && (
                            <p className="text-sm text-white/40">
                                No notes yet. Add the first update after a call or meeting.
                            </p>
                        )}
                    </div>
                </section>
                <section className="bg-white/5 border border-white/20 p-5 sm:p-8">
                    <h3 className="text-2xl font-bold mb-5">Mock introduction history</h3>
                    <div className="space-y-3">
                        {activity?.sentMatches.map((sent) => (
                            <details
                                key={sent.id}
                                className="bg-black/20 border border-white/10 p-4"
                            >
                                <summary className="cursor-pointer text-sm">
                                    {sent.name} ·{' '}
                                    {sent.source === 'template' ? 'Rule-based' : 'AI-assisted'} draft{' '}
                                    <span className="block text-xs text-white/40 mt-1">
                                        {dateTime(sent.createdAt)} · No email sent
                                    </span>
                                </summary>
                                <p className="whitespace-pre-wrap text-sm text-white/70 mt-4 break-words">
                                    {sent.intro}
                                </p>
                            </details>
                        ))}
                        {!activity?.sentMatches.length && (
                            <p className="text-sm text-white/40">
                                No introductions recorded yet. Preview a match to start.
                            </p>
                        )}
                    </div>
                </section>
            </main>

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-5 left-4 right-4 sm:left-auto sm:max-w-md z-50 bg-emerald-950 text-emerald-100 border border-emerald-400/40 px-4 py-3 shadow-xl"
                >
                    {toast}
                </div>
            )}
            <dialog
                ref={dialogRef}
                onCancel={(e) => {
                    e.preventDefault();
                    closePreview();
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) closePreview();
                }}
                aria-labelledby="intro-heading"
                className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-950 text-white border border-white/25 p-5 sm:p-7 backdrop:bg-black/75"
            >
                {preview && (
                    <>
                        <div className="flex justify-between items-start gap-4">
                            <h3
                                id="intro-heading"
                                className="text-xl font-bold"
                            >
                                Introduction preview
                            </h3>
                            <button
                                onClick={closePreview}
                                aria-label="Close preview"
                                className="cursor-pointer p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-white/50 mt-2">
                            To {customer.firstName} · {customer.email}
                        </p>
                        <p
                            role="status"
                            className="text-xs text-rose-200 bg-rose-400/10 p-3 my-4"
                        >
                            {preview.notice}
                        </p>
                        <label
                            htmlFor="intro-draft"
                            className="text-xs text-white/50"
                        >
                            Review and edit before recording the mock send
                        </label>
                        <textarea
                            id="intro-draft"
                            rows={12}
                            maxLength={6000}
                            disabled={generating}
                            value={preview.intro}
                            onChange={(e) =>
                                setPreview((current) =>
                                    current ? { ...current, intro: e.target.value } : current,
                                )
                            }
                            className="w-full mt-2 p-3 bg-white/5 border border-white/20 text-sm leading-relaxed focus:outline-none focus:border-rose-300"
                        />
                        <p className="text-xs text-white/40 mt-3">
                            {aiEnabled
                                ? 'AI generation sends a minimal fictional profile summary to Groq. Free-tier limits or API charges may apply. Contact details, income, religion, and caste are excluded.'
                                : 'Set GROQ_API_KEY on the server to enable real AI generation. No API request is made in template mode.'}
                        </p>
                        {storageError && (
                            <p
                                role="alert"
                                className="text-red-300 text-sm mt-3"
                            >
                                {storageError}
                            </p>
                        )}
                        <div className="flex flex-wrap justify-end gap-3 mt-5">
                            <button
                                onClick={generateIntro}
                                disabled={!aiEnabled || generating}
                                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-white/30 px-3 py-2 text-sm"
                            >
                                {generating ? 'Generating…' : 'Generate AI intro'}
                            </button>
                            <button
                                onClick={sendMock}
                                disabled={generating || !preview.intro.trim()}
                                className="cursor-pointer disabled:opacity-40 bg-rose-600 hover:bg-rose-700 px-4 py-2 text-sm"
                            >
                                Confirm mock send
                            </button>
                        </div>
                    </>
                )}
            </dialog>
        </div>
    );
}
