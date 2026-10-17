'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CircleUserRound, LogOut, ChevronDown, Search } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import type { Profile } from '@/lib/profiles';
import type { Matchmaker } from '@/lib/auth';
import { JOURNEY_STATUSES, useDemoWorkspace } from '@/lib/demo-workspace';

export default function DashboardClient({
    profiles,
    matchmaker,
    poolSize,
}: {
    profiles: Profile[];
    matchmaker: Matchmaker;
    poolSize: number;
}) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { activities } = useDemoWorkspace();

    useEffect(() => {
        function close(event: MouseEvent) {
            if (event.target instanceof Node && !dropdownRef.current?.contains(event.target))
                setIsDropdownOpen(false);
        }
        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsDropdownOpen(false);
        }
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', escape);
        };
    }, []);

    const filtered = profiles.filter((profile) => {
        const term = search.trim().toLowerCase();
        const status = activities[profile.id]?.status ?? profile.statusTag;
        return (
            `${profile.firstName} ${profile.lastName} ${profile.city}`
                .toLowerCase()
                .includes(term) &&
            (statusFilter === 'All' || status === statusFilter)
        );
    });

    return (
        <div className="min-h-screen text-white bg-white/5">
            <header className="border-b border-white/20 px-4 sm:px-8 lg:px-28 py-4 flex justify-between items-center gap-4">
                <Link href="/dashboard">
                    <h1 className="text-xl font-bold">The Date Crew</h1>
                    <span className="text-rose-400 text-sm">Matchmaker Dashboard</span>
                </Link>
                <div
                    className="relative"
                    ref={dropdownRef}
                >
                    <button
                        aria-expanded={isDropdownOpen}
                        aria-label="Account menu"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="cursor-pointer flex items-center gap-2 text-sm bg-white/10 border border-white/30 px-2 py-1.5 hover:bg-white/20"
                    >
                        {/*<CircleUserRound size={22} />*/}
                        <Image src="/user-icon.png" width={24} height={24} alt="user icon" />
                        {matchmaker.name}
                        <ChevronDown size={14} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-zinc-950 border border-white/20 p-3 z-50 shadow-xl">
                            <p className="text-xs text-white/50">Signed in as · Demo staff</p>
                            <p className="text-sm py-2 break-all">{matchmaker.email}</p>
                            <form action={logout}>
                                <button className="cursor-pointer flex w-full items-center gap-2 border-t border-white/20 pt-3 text-sm text-rose-400">
                                    <LogOut size={16} />
                                    Log out
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        ['Assigned clients', profiles.length],
                        ['Matchmaking pool', poolSize],
                        [
                            'Mock introductions',
                            Object.values(activities).reduce(
                                (count, a) => count + a.sentMatches.length,
                                0,
                            ),
                        ],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="p-5 border border-white/15 bg-white/5"
                        >
                            <p className="text-xs text-white/50 uppercase tracking-wider">
                                {label}
                            </p>
                            <p className="text-3xl mt-2 font-semibold">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Your customers</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search
                                className="absolute top-3 left-3 text-white/40"
                                size={16}
                            />
                            <input
                                aria-label="Search customers by name or city"
                                placeholder="Name or city…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 border border-white/30 bg-black/50 focus:border-white/60 focus:outline-none text-sm w-full"
                            />
                        </div>
                        <div className="relative">
                            <select
                                aria-label="Filter by journey status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none px-3 pr-8 py-2 border border-white/30 bg-black text-sm focus:outline-none field-sizing-fixed text-white cursor-pointer"
                            >
                                <option value="All">All statuses</option>
                                {JOURNEY_STATUSES.map((status) => (
                                    <option key={status}>{status}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/20 overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <caption className="sr-only">
                            Customers assigned to {matchmaker.name}
                        </caption>
                        <thead>
                            <tr className="border-b border-white/20 text-xs text-white/60 uppercase tracking-wider">
                                {[
                                    'Name',
                                    'Age / Gender',
                                    'City',
                                    'Profession',
                                    'Marital status',
                                    'Journey',
                                    'Action',
                                ].map((label) => (
                                    <th
                                        key={label}
                                        scope="col"
                                        className="py-4 px-5"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-sm">
                            {filtered.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-white/5"
                                >
                                    <td className="py-4 px-5 font-medium">
                                        <Link
                                            className="hover:text-rose-300"
                                            href={`/dashboard/customer/${customer.id}`}
                                        >
                                            {customer.firstName} {customer.lastName}
                                        </Link>
                                        <span className="block text-xs text-emerald-400 mt-1">
                                            Verified demo profile
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 text-white/70">
                                        {customer.age} / {customer.gender}
                                    </td>
                                    <td className="py-4 px-5 text-white/70">{customer.city}</td>
                                    <td className="py-4 px-5 text-white/70">
                                        {customer.designation}
                                    </td>
                                    <td className="py-4 px-5 text-white/70">
                                        {customer.maritalStatus}
                                    </td>
                                    <td className="py-4 px-5">
                                        <span className="text-xs bg-rose-400/10 text-rose-200 border border-rose-400/20 px-2 py-1">
                                            {activities[customer.id]?.status ?? customer.statusTag}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5">
                                        <Link
                                            href={`/dashboard/customer/${customer.id}`}
                                            className="inline-block px-3 py-2 bg-rose-500 hover:bg-rose-600 text-xs font-medium"
                                        >
                                            View profile & matches
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-white/50"
                                    >
                                        No customers match your search. Try another name, city, or
                                        status.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
