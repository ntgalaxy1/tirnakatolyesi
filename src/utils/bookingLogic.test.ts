import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TIME_SLOTS,
  filterDesignsByCategory,
  getSlotAvailability,
  isValidMobileNumber,
  normalizeIranMobile,
  validateReservationPayload,
} from './bookingLogic';
import { SiteDesignItem } from '../types';

const mockDesigns: SiteDesignItem[] = [
  {
    id: 'd1',
    code: 'TA-101',
    titleFa: 'فرنچ مرواریدی سرخابی',
    titleTr: 'İnci Ahududu French',
    category: 'french',
    priceToman: 680000,
    priceTl: 850,
    durationMin: 60,
    imageUrl: '/test1.jpg',
    primaryColorHex: '#D42663',
    secondaryColorHex: '#FAF0E6',
    defaultShape: 'almond',
    promptDescription: 'Pearl French tip',
  },
  {
    id: 'd2',
    code: 'TA-102',
    titleFa: 'آمبره ارغوانی',
    titleTr: 'Mürdüm Ombre',
    category: 'ombre',
    priceToman: 790000,
    priceTl: 950,
    durationMin: 75,
    imageUrl: '/test2.jpg',
    primaryColorHex: '#7B2869',
    secondaryColorHex: '#F7AD93',
    defaultShape: 'coffin',
    promptDescription: 'Mulberry ombre',
  },
];

test('filterDesignsByCategory filters correctly and returns all for "all"', () => {
  assert.equal(filterDesignsByCategory(mockDesigns, 'all').length, 2);
  assert.equal(filterDesignsByCategory(mockDesigns, 'french').length, 1);
  assert.equal(filterDesignsByCategory(mockDesigns, 'french')[0].code, 'TA-101');
  assert.equal(filterDesignsByCategory(mockDesigns, 'pedicure').length, 0);
});

test('normalizeIranMobile and isValidMobileNumber validate Iranian phone formats', () => {
  assert.equal(normalizeIranMobile('09123456789'), '09123456789');
  assert.equal(normalizeIranMobile('+98 912 345 6789'), '09123456789');
  assert.equal(isValidMobileNumber('09123456789'), true);
  assert.equal(isValidMobileNumber('12345'), false);
});

test('getSlotAvailability prevents double-booking and respects blocked slots', () => {
  const availability = getSlotAvailability(
    '1405-09-05',
    DEFAULT_TIME_SLOTS,
    [{ date: '1405-09-05', timeSlot: '11:30', status: 'confirmed' }],
    [{ date: '1405-09-05', time: '15:00', reason: 'Break' }]
  );

  const slot10 = availability.find((s) => s.time === '10:00');
  const slot1130 = availability.find((s) => s.time === '11:30');
  const slot15 = availability.find((s) => s.time === '15:00');

  assert.equal(slot10?.available, true);
  assert.equal(slot1130?.available, false);
  assert.equal(slot1130?.reason, 'booked');
  assert.equal(slot15?.available, false);
  assert.equal(slot15?.reason, 'blocked');
});

test('validateReservationPayload catches double-booked slots and invalid inputs', () => {
  const existing = [{ date: '1405-09-06', timeSlot: '13:00' }];
  const blocked = [{ date: '1405-09-06', time: '16:30' }];

  const conflictRes = validateReservationPayload({
    customerName: 'سارا محمدی',
    customerMobile: '09121112233',
    serviceType: 'gelish',
    date: '1405-09-06',
    timeSlot: '13:00',
    existingReservations: existing,
    blockedSlots: blocked,
  });
  assert.equal(conflictRes.valid, false);
  assert.equal(conflictRes.errorKey, 'slot_already_booked');

  const validRes = validateReservationPayload({
    customerName: 'سارا محمدی',
    customerMobile: '09121112233',
    serviceType: 'gelish',
    date: '1405-09-06',
    timeSlot: '10:00',
    existingReservations: existing,
    blockedSlots: blocked,
  });
  assert.equal(validRes.valid, true);
});
