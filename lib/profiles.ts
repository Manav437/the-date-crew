import assignedData from '../data/profiles.json';
import poolData from '../data/match-pool.json';

/** All records are fictional assignment fixtures, not contactable people. */
export interface Profile {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'Male' | 'Female';
    dob: string;
    age: number;
    country: string;
    city: string;
    height: string;
    email: string;
    phone: string;
    college: string;
    degree: string;
    /** Annual income in INR. */
    income: number;
    currentCompany: string;
    designation: string;
    maritalStatus: string;
    languagesKnown: string[];
    siblings: number;
    caste: string;
    religion: string;
    wantKids: 'Yes' | 'No' | 'Maybe';
    openToRelocate: 'Yes' | 'No' | 'Maybe';
    openToPets: 'Yes' | 'No' | 'Maybe';
    statusTag: string;
    assignedMatchmaker: string;
    diet: string;
    familyValues: string;
    motherTongue: string;
    smoking: 'Yes' | 'No';
    drinking: 'Yes' | 'No' | 'Occasionally';
    verified: boolean;
}

export const profiles: Profile[] = assignedData as Profile[];
export const matchPool: Profile[] = poolData as Profile[];

export function getCustomer(id: string): Profile | undefined {
    return profiles.find((profile) => profile.id === id);
}

export function getAssignedCustomers(matchmakerName: string): Profile[] {
    return profiles.filter((profile) => profile.assignedMatchmaker === matchmakerName);
}
