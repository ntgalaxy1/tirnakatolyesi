import {
  BlockedSlotRecord,
  NailCategory,
  ReservationItem,
  SiteDesignItem,
  TimeSlotConfig,
} from '../types';

export const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { time: '10:00', isDefaultOpen: true },
  { time: '11:30', isDefaultOpen: true },
  { time: '13:00', isDefaultOpen: true },
  { time: '15:00', isDefaultOpen: true },
  { time: '16:30', isDefaultOpen: true },
  { time: '18:00', isDefaultOpen: true },
  { time: '19:30', isDefaultOpen: true },
];

export function filterDesignsByCategory(
  designs: SiteDesignItem[],
  category: NailCategory
): SiteDesignItem[] {
  if (category === 'all') {
    return designs;
  }
  return designs.filter((d) => d.category === category);
}

export function normalizeIranMobile(mobile: string): string {
  const digits = mobile.replace(/[^0-9]/g, '');
  if (digits.startsWith('989') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('9') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

export function isValidMobileNumber(mobile: string): boolean {
  const normalized = normalizeIranMobile(mobile);
  return /^09\d{9}$/.test(normalized) || /^\d{10,13}$/.test(normalized);
}

export function getSlotAvailability(
  date: string,
  allSlots: TimeSlotConfig[],
  reservations: Pick<ReservationItem, 'date' | 'timeSlot' | 'status'>[],
  blockedSlots: BlockedSlotRecord[]
): Array<{ time: string; available: boolean; reason: 'open' | 'booked' | 'blocked' }> {
  return allSlots.map((slot) => {
    const isBlocked =
      !slot.isDefaultOpen ||
      blockedSlots.some((b) => b.date === date && b.time === slot.time);

    if (isBlocked) {
      return { time: slot.time, available: false, reason: 'blocked' as const };
    }

    const isBooked = reservations.some(
      (r) => r.date === date && r.timeSlot === slot.time
    );

    if (isBooked) {
      return { time: slot.time, available: false, reason: 'booked' as const };
    }

    return { time: slot.time, available: true, reason: 'open' as const };
  });
}

export function validateReservationPayload(input: {
  customerName: string;
  customerMobile: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  existingReservations: Pick<ReservationItem, 'date' | 'timeSlot'>[];
  blockedSlots: BlockedSlotRecord[];
}): { valid: boolean; errorKey?: string } {
  if (!input.customerName || input.customerName.trim().length < 2) {
    return { valid: false, errorKey: 'invalid_name' };
  }
  if (!isValidMobileNumber(input.customerMobile)) {
    return { valid: false, errorKey: 'invalid_mobile' };
  }
  if (!input.serviceType) {
    return { valid: false, errorKey: 'invalid_service' };
  }
  if (!input.date || !input.timeSlot) {
    return { valid: false, errorKey: 'invalid_datetime' };
  }
  const isBlocked = input.blockedSlots.some(
    (b) => b.date === input.date && b.time === input.timeSlot
  );
  if (isBlocked) {
    return { valid: false, errorKey: 'slot_blocked' };
  }
  const isDoubleBooked = input.existingReservations.some(
    (r) => r.date === input.date && r.timeSlot === input.timeSlot
  );
  if (isDoubleBooked) {
    return { valid: false, errorKey: 'slot_already_booked' };
  }

  return { valid: true };
}

export function generateTrackingCode(seedIndex: number): string {
  const num = (1040 + seedIndex).toString();
  return `TA-${num}`;
}

export function formatToman(amount: number, lang: 'fa' | 'tr'): string {
  if (lang === 'fa') {
    return `${amount.toLocaleString('fa-IR')} تومان`;
  }
  return `${amount.toLocaleString('en-US')} Toman`;
}
