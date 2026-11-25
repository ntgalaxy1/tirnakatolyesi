export type Language = 'fa' | 'tr';

export type NailCategory =
  | 'all'
  | 'gelish'
  | 'minimal'
  | 'french'
  | 'manicure'
  | 'pedicure'
  | 'ombre';

export type NailShape = 'almond' | 'coffin' | 'square' | 'round';

export type ServiceType =
  | 'manicure'
  | 'pedicure'
  | 'gelish'
  | 'extension'
  | 'repair'
  | 'vip_design';

export type ReservationStatus = 'pending' | 'confirmed' | 'completed';

export interface SiteDesignItem {
  id: string;
  code: string;
  titleFa: string;
  titleTr: string;
  category: Exclude<NailCategory, 'all'>;
  priceToman: number;
  priceTl: number;
  durationMin: number;
  imageUrl: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  defaultShape: NailShape;
  promptDescription: string;
}

export interface CustomerGalleryItem {
  id: string;
  customerFirstName: string;
  serviceType: ServiceType;
  serviceLabelFa: string;
  serviceLabelTr: string;
  dateFa: string;
  dateIso: string;
  imageUrl: string;
  designCode?: string;
  commentFa?: string;
  commentTr?: string;
  reservationId?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  mobile: string;
  role: 'customer' | 'admin';
  username?: string;
  createdAt: string;
}

export interface ReservationItem {
  id: string;
  trackingCode: string;
  userId: string;
  customerName: string;
  customerMobile: string;
  serviceType: ServiceType;
  date: string;
  timeSlot: string;
  notes: string;
  selectedDesignId?: string;
  selectedDesignCode?: string;
  selectedDesignTitle?: string;
  nailShape: NailShape;
  nailColorHex: string;
  handImage?: string; // Upload Box 1 original hand photo
  aiFinalImage?: string; // Upload Box 1 final AI-generated hand photo («نمونه نهایی جهت اجرا»)
  customerReferenceImage?: string; // Upload Box 2 independent customer reference design photo
  status: ReservationStatus;
  publishedToCustomerGallery: boolean;
  createdAt: string;
}

export interface TimeSlotConfig {
  time: string;
  isDefaultOpen: boolean;
}

export interface BlockedSlotRecord {
  date: string;
  time: string;
  reason?: string;
}
