import { matchPool, type Profile } from './profiles';

export interface CompatibleMatch extends Profile {
    matchScore: number;
    /** Deterministic, fact-based explanation; no external AI service is called. */
    aiRationale: string;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const normalized = (value: unknown): string => text(value).toLowerCase();
const known = (value: unknown): boolean => {
    const key = normalized(value);
    return (
        Boolean(key) &&
        ![
            'unknown',
            'unspecified',
            'not specified',
            'not provided',
            'n/a',
            'undefined',
            'null',
        ].includes(key)
    );
};
const same = (a: unknown, b: unknown): boolean =>
    known(a) && known(b) && normalized(a) === normalized(b);
const number = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;
const children = (value: unknown): boolean => ['yes', 'no', 'maybe'].includes(normalized(value));

function heightInInches(height: unknown): number | undefined {
    const parts = text(height).match(/^([4-7])\s*'\s*(\d{1,2})\s*"?$/);
    if (!parts || Number(parts[2]) > 11) return undefined;
    return Number(parts[1]) * 12 + Number(parts[2]);
}

function maleEligible(customer: Profile, candidate: Profile): boolean {
    const customerHeight = heightInInches(customer.height);
    const candidateHeight = heightInInches(candidate.height);
    return (
        number(customer.age) &&
        customer.age >= 18 &&
        number(candidate.age) &&
        candidate.age >= 18 &&
        candidate.age < customer.age &&
        number(customer.income) &&
        number(candidate.income) &&
        candidate.income < customer.income &&
        customerHeight !== undefined &&
        candidateHeight !== undefined &&
        candidateHeight < customerHeight &&
        children(customer.wantKids) &&
        children(candidate.wantKids) &&
        same(customer.wantKids, candidate.wantKids)
    );
}

function scoreMatch(customer: Profile, candidate: Profile): CompatibleMatch {
    let score = 0;
    const facts: string[] = [];
    const award = (points: number, fact: string) => {
        score += points;
        facts.push(fact);
    };
    const male = customer.gender === 'Male';

    // Male eligibility is worth 60; the same shared-trait budget adds up to 40.
    // Female weights: profession 20, values 15, relocation 20, children 25, lifestyle 20.
    if (male) {
        award(
            60,
            `Meets all four required criteria: younger (${candidate.age} vs ${customer.age}), lower annual income (INR ${candidate.income} vs ${customer.income}), shorter (${candidate.height} vs ${customer.height}), and the same children preference (${text(candidate.wantKids)}).`,
        );
    } else {
        if (same(customer.designation, candidate.designation)) {
            award(20, `Both list their profession as ${text(candidate.designation)}.`);
        } else if (known(customer.designation) && known(candidate.designation)) {
            const ignored = ['senior', 'junior', 'principal', 'lead', 'head'];
            const terms = normalized(customer.designation)
                .split(/\W+/)
                .filter((term) => term.length >= 4 && !ignored.includes(term));
            const shared = normalized(candidate.designation)
                .split(/\W+/)
                .find((term) => terms.includes(term));
            if (shared)
                award(
                    10,
                    `Their stated roles share the work term "${shared}": ${text(customer.designation)} and ${text(candidate.designation)}.`,
                );
        }
        if (
            children(customer.wantKids) &&
            children(candidate.wantKids) &&
            same(customer.wantKids, candidate.wantKids)
        ) {
            award(25, `Both state the same children preference (${text(candidate.wantKids)}).`);
        }
    }

    if (same(customer.familyValues, candidate.familyValues)) {
        award(
            male ? 10 : 15,
            `Both describe their family values as ${text(candidate.familyValues)}.`,
        );
    }
    const relocationWeight = male ? 10 : 20;
    if (same(customer.country, candidate.country) && same(customer.city, candidate.city)) {
        award(
            relocationWeight,
            `Both currently live in ${text(candidate.city)}, ${text(candidate.country)}.`,
        );
    } else if (
        known(customer.country) &&
        known(candidate.country) &&
        known(customer.city) &&
        known(candidate.city) &&
        ['yes', 'no'].includes(normalized(customer.openToRelocate)) &&
        ['yes', 'no'].includes(normalized(candidate.openToRelocate))
    ) {
        if (normalized(candidate.openToRelocate) === 'yes') {
            award(
                relocationWeight * 0.6,
                `${text(candidate.firstName) || 'The candidate'} is open to relocation; current locations are ${text(candidate.city)}, ${text(candidate.country)} and ${text(customer.city)}, ${text(customer.country)}.`,
            );
        } else if (normalized(customer.openToRelocate) === 'yes') {
            award(
                relocationWeight * 0.4,
                `You are open to relocation; current locations are ${text(customer.city)}, ${text(customer.country)} and ${text(candidate.city)}, ${text(candidate.country)}.`,
            );
        }
    }

    const lifestyle: [keyof Profile, number, string, string[]][] = [
        ['diet', 8, 'diet', ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian']],
        ['smoking', 6, 'smoking preference', ['yes', 'no']],
        ['drinking', 4, 'drinking preference', ['yes', 'no', 'occasionally']],
        ['openToPets', 2, 'openness to pets', ['yes', 'no']],
    ];
    for (const [key, weight, label, allowed] of lifestyle) {
        if (allowed.includes(normalized(customer[key])) && same(customer[key], candidate[key])) {
            award(weight, `Shared ${label}: ${text(candidate[key])}.`);
        }
    }

    return {
        ...candidate,
        matchScore: Math.min(100, Math.max(0, Math.round(score))),
        aiRationale: `Verified opposite-gender profile. ${facts.length ? facts.join(' ') : 'No scored alignment is established by the available preferences.'}`,
    };
}

/** Scores stated traits only, not caste, religion, mother tongue, wealth or employer prestige. */
export function getCompatibleMatches(
    customer: Profile,
    pool: Profile[] = matchPool,
): CompatibleMatch[] {
    const opposite =
        customer.gender === 'Male' ? 'Female' : customer.gender === 'Female' ? 'Male' : undefined;
    if (!opposite) return [];
    return pool
        .filter(
            (candidate) =>
                candidate.id !== customer.id &&
                candidate.verified === true &&
                candidate.gender === opposite &&
                (customer.gender !== 'Male' || maleEligible(customer, candidate)),
        )
        .map((candidate) => scoreMatch(customer, candidate))
        .sort((a, b) => b.matchScore - a.matchScore || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .slice(0, 5);
}

/** A factual draft for human review, not a claim of contact, consent or guaranteed compatibility. */
export function buildIntro(customer: Profile, match: CompatibleMatch): string {
    const name =
        [text(match.firstName), text(match.lastName)].filter(Boolean).join(' ') || 'this candidate';
    const details: string[] = [];
    if (number(match.age) && match.age >= 18) details.push(`Age: ${match.age}.`);
    if (known(match.designation)) details.push(`Profession: ${text(match.designation)}.`);
    if (known(match.city))
        details.push(
            `Based in ${text(match.city)}${known(match.country) ? `, ${text(match.country)}` : ''}.`,
        );
    if (children(match.wantKids))
        details.push(`Stated children preference: ${text(match.wantKids)}.`);
    return [
        'Subject: A potential introduction for your review',
        '',
        `Hi ${text(customer.firstName) || 'there'},`,
        '',
        `Please consider ${name}. ${details.join(' ')}`.trim(),
        `Profile-based compatibility score: ${match.matchScore}/100.`,
        text(match.aiRationale),
        '',
        'This is a draft based on fictional profile data, not a guarantee of compatibility. Would you like to explore an introduction?',
        '',
        'Warmly,',
        text(customer.assignedMatchmaker) || 'Your matchmaker',
    ].join('\n');
}
