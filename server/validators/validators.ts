import { SUPPORTED_CAMPUSES } from '../config/constants.ts';

export function validateCollegeEmail(email: string): { valid: boolean; campus?: typeof SUPPORTED_CAMPUSES[0]; error?: string } {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { valid: false, error: 'A valid email address is required.' };
  }

  const domain = email.toLowerCase().split('@')[1];

  // Check known campuses first
  const matchedCampus = SUPPORTED_CAMPUSES.find(c => c.domain === domain);
  if (matchedCampus) {
    return { valid: true, campus: matchedCampus };
  }

  // Check generic .edu or .ac.in or .ac.uk
  if (domain.endsWith('.edu') || domain.endsWith('.ac.in') || domain.endsWith('.ac.uk')) {
    const institutionName = domain.split('.')[0].toUpperCase() + ' University';
    return {
      valid: true,
      campus: {
        id: `campus_${domain.replace(/[^a-z0-9]/g, '_')}`,
        name: institutionName,
        domain: domain,
        city: 'Campus City',
        state: 'State',
        centerCoordinates: { lat: 37.7749, lng: -122.4194 }
      }
    };
  }

  return {
    valid: false,
    error: 'Campus Lock Requires Verified College Email. Must use an official institutional email ending in .edu or .ac.in (e.g. name@stanford.edu, student@mit.edu, etc.)'
  };
}

export function validateRideInput(data: any): string | null {
  if (!data.source?.trim()) return 'Starting pickup location is required.';
  if (!data.destination?.trim()) return 'Destination is required.';
  if (!data.date) return 'Ride date is required.';
  if (!data.time) return 'Ride departure time is required.';
  if (!data.seatsTotal || Number(data.seatsTotal) < 1) return 'Must provide at least 1 passenger seat.';
  if (data.pricePerSeat === undefined || Number(data.pricePerSeat) < 0) return 'Price per seat must be 0 or positive.';
  return null;
}

export function validateNoteInput(data: any): string | null {
  if (!data.title?.trim()) return 'Note title is required.';
  if (!data.subject?.trim()) return 'Subject / Course code is required.';
  if (!data.semester?.trim()) return 'Semester is required.';
  if (!data.isFree && (data.price === undefined || Number(data.price) <= 0)) {
    return 'Paid notes must have a price greater than ₹0.';
  }
  return null;
}

export function validateEquipmentInput(data: any): string | null {
  if (!data.name?.trim()) return 'Equipment name is required.';
  if (!data.category?.trim()) return 'Equipment category is required.';
  if (data.pricePerDay !== undefined && Number(data.pricePerDay) < 0) {
    return 'Rental price per day cannot be negative (set to 0 for free borrowing).';
  }
  if (data.deposit !== undefined && Number(data.deposit) < 0) {
    return 'Security deposit cannot be negative (set to 0 for no deposit).';
  }
  if (data.buyPrice !== undefined && Number(data.buyPrice) < 0) {
    return 'Purchase price cannot be negative (set to 0 for free giveaway).';
  }
  return null;
}
