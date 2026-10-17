'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

export const JOURNEY_STATUSES = [
    'Active Lead',
    'Met Once',
    'Shortlisted',
    'Introduction Sent',
    'On Hold',
] as const;
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];
export type Note = { id: string; text: string; createdAt: string; author: string };
export type SentMatch = {
    id: string;
    matchId: string;
    name: string;
    createdAt: string;
    intro: string;
    source: 'template' | 'openai' | 'groq';
};
export type Activity = { status?: JourneyStatus; notes: Note[]; sentMatches: SentMatch[] };
type Workspace = Record<string, Activity>;
const KEY = 'tdc-demo-workspace-v1';
const EVENT = 'tdc-workspace-change';
const empty: Activity = { notes: [], sentMatches: [] };

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener(EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(EVENT, callback);
    };
}
function snapshot() {
    try {
        return window.localStorage.getItem(KEY) ?? '';
    } catch {
        return '';
    }
}
function parse(raw: string): Workspace {
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
        const result: Workspace = {};
        for (const [id, activity] of Object.entries(data)) {
            if (!activity || typeof activity !== 'object') continue;
            const record = activity as Partial<Activity>;
            result[id] = {
                status: JOURNEY_STATUSES.includes(record.status as JourneyStatus)
                    ? record.status
                    : undefined,
                notes: Array.isArray(record.notes)
                    ? record.notes.filter(
                        (n) =>
                            n &&
                            typeof n.id === 'string' &&
                            typeof n.text === 'string' &&
                            typeof n.author === 'string' &&
                            typeof n.createdAt === 'string',
                    )
                    : [],
                sentMatches: Array.isArray(record.sentMatches)
                    ? record.sentMatches.filter(
                        (m) =>
                            m &&
                            typeof m.id === 'string' &&
                            typeof m.matchId === 'string' &&
                            typeof m.name === 'string' &&
                            typeof m.createdAt === 'string' &&
                            typeof m.intro === 'string' &&
                            ['template', 'openai', 'groq'].includes(m.source),
                    )
                    : [],
            };
        }
        return result;
    } catch {
        return {};
    }
}

/** Browser-local synthetic demo data only, never a shared customer database. */
export function useDemoWorkspace() {
    const raw = useSyncExternalStore(subscribe, snapshot, () => '');
    const activities = useMemo(() => parse(raw), [raw]);
    const [storageError, setStorageError] = useState('');
    function update(customerId: string, change: (activity: Activity) => Activity) {
        try {
            const latest = parse(snapshot());
            const next = change(latest[customerId] ?? empty);
            window.localStorage.setItem(KEY, JSON.stringify({ ...latest, [customerId]: next }));
            window.dispatchEvent(new Event(EVENT));
            setStorageError('');
            return true;
        } catch {
            setStorageError('Browser storage is unavailable or full. Your change was not saved.');
            return false;
        }
    }
    return { activities, update, storageError };
}
