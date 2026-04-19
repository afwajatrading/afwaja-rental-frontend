import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, setDoc, doc, onSnapshot, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Car, Calendar, CreditCard, FileText, LayoutDashboard, 
  CheckCircle, Bell, User, LogOut, ChevronRight, Printer, 
  Search, ShieldCheck, Clock, Check, MapPin, Users, Award,
  Wallet, Sparkles, Truck, RefreshCw, Star, Fuel, Settings, Send,
  AlertTriangle, Phone, Mail, MessageCircle, Copy, X, TrendingUp, 
  XCircle, FilePlus, SearchCode, Undo2, UploadCloud, FileCheck, 
  Eye, Shield, ThumbsUp, Quote, PenTool, Trash2, Camera, Menu, 
  Globe, Landmark
} from 'lucide-react';

// ============================================================================
// KONFIGURASI PENTING
// ============================================================================
const BACKEND_API_URL = 'https://createpaymentintent-shqyg6ge4q-uc.a.run.app'; 

// --- INISIALISASI FIREBASE ---
const runtimeFirebaseConfig =
  typeof globalThis.__firebase_config !== 'undefined' && globalThis.__firebase_config
    ? JSON.parse(globalThis.__firebase_config)
    : null;

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseConfig = runtimeFirebaseConfig || envFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const appId =
  typeof globalThis.__app_id !== 'undefined'
    ? globalThis.__app_id
    : import.meta.env.VITE_APP_ID || 'afwaja-car-rental-app';
const MOBILE_IMAGE_ACCEPT = 'image/jpeg,image/png';
const EMPTY_VCR_DOCS = { front: null, back: null, left: null, right: null, odometer: null };
const GOOGLE_MAPS_API_KEY =
  typeof globalThis.__google_maps_api_key !== 'undefined'
    ? globalThis.__google_maps_api_key
    : import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const AFWAJA_HQ = {
  name: 'Afwaja Car Rental HQ (Cyberjaya)',
  address: 'Afwaja Car Rental HQ, Cyberjaya, Selangor, Malaysia',
  lat: 2.9227,
  lng: 101.6559,
};
const DELIVERY_RATE_PER_KM = 2.5;

let googleMapsScriptPromise = null;

const loadGoogleMapsScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser.'));
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key is missing.'));
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&libraries=places,routes`;
      script.onload = () => {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps loaded, but the API is unavailable.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
};

const formatDistanceLabel = (distanceKm) => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 'At HQ';
  return `${distanceKm.toFixed(1).replace(/\.0$/, '')} km from HQ`;
};

const createLocationMeta = ({ placeId, name, address, lat, lng, distanceKm, fee }) => ({
  placeId,
  name,
  address,
  lat,
  lng,
  distanceKm,
  fee,
  distanceLabel: formatDistanceLabel(distanceKm),
});

const HQ_LOCATION_META = createLocationMeta({
  placeId: 'afwaja-hq',
  name: AFWAJA_HQ.name,
  address: AFWAJA_HQ.address,
  lat: AFWAJA_HQ.lat,
  lng: AFWAJA_HQ.lng,
  distanceKm: 0,
  fee: 0,
});

const TIME_OPTIONS = Array.from({ length: ((23 - 8) * 2) + 1 }, (_, index) => {
  const totalMinutes = (8 * 60) + (index * 30);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const meridiem = hour >= 12 ? 'pm' : 'am';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  const label = `${twelveHour}${minute === 0 ? '' : '.30'}${meridiem}`;
  return { value, label };
});

const MALAYSIAN_BANK_OPTIONS = [
  'Affin Bank',
  'Agrobank',
  'Al Rajhi Bank',
  'Alliance Bank',
  'AmBank',
  'Ambank Islamic',
  'Bank Islam',
  'Bank Muamalat',
  'Bank Rakyat',
  'BSN',
  'CIMB Bank',
  'CIMB Islamic',
  'Citibank',
  'Hong Leong Bank',
  'Hong Leong Islamic Bank',
  'HSBC Bank',
  'Kuwait Finance House (KFH)',
  'Maybank',
  'Maybank Islamic',
  'MBSB Bank',
  'OCBC Al-Amin',
  'OCBC Bank',
  'Public Islamic Bank',
  'Public Bank',
  'RHB Bank',
  'RHB Islamic Bank',
  'Standard Chartered',
  'UOB',
  'UOB Malaysia',
];

const HERO_PROMO_SLIDES = [
  {
    tag: '3+ Days Discount',
    title: 'Save 10% on 3 days or more',
    description: 'Book at least 3 days and the discounted daily rate will be applied automatically before checkout.',
    highlight: '10% OFF',
  },
  {
    tag: 'Weekly Rental',
    title: 'Enjoy 20% off for weekly trips',
    description: 'Perfect for longer plans around Klang Valley, Cyberjaya, Putrajaya, or airport stays.',
    highlight: '20% OFF',
  },
  {
    tag: 'Monthly Rental',
    title: 'Unlock 45% off for 30+ days',
    description: 'Our best-value tier for long-term use, project stays, or extended travel in Malaysia.',
    highlight: '45% OFF',
  },
  {
    tag: 'Wide Vehicle Selection',
    title: 'More cars to match every plan',
    description: 'Choose from compact cars, sedans, SUVs, MPVs, and premium people movers for business trips, family holidays, or airport transfers.',
    highlight: '23 MODELS',
  },
  {
    tag: 'Guaranteed Deposit Return',
    title: 'Fast and transparent deposit handling',
    description: 'Complete the return inspection and we will process your refundable deposit with a clear digital trail, status update, and confirmation email.',
    highlight: 'CLEAR PROCESS',
  },
];

const EMPTY_COUPON_FORM = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  active: true,
  validFrom: '',
  validUntil: '',
  minimumRentalDays: '',
  minimumSpend: '',
  customerType: 'both',
  applicableScope: 'all',
  applicableCategory: 'all',
  applicableCarId: 'all',
  usageLimit: '',
  onePerCustomer: false,
  firstBookingOnly: false,
};

const EMPTY_PROMO_POPUP_FORM = {
  badge: '',
  title: '',
  subtitle: '',
  urgencyText: '',
  couponCode: '',
  ctaLabel: '',
  ctaAction: 'copy_coupon',
  active: true,
  startDate: '',
  endDate: '',
  audience: 'all',
  theme: 'ocean',
  priority: '100',
  dismissible: true,
};

const EMPTY_SEASONAL_FORM = {
  name: '',
  note: '',
  active: true,
  startDate: '',
  endDate: '',
  customerType: 'both',
  scope: 'all',
  category: 'all',
  carId: 'all',
  pricingMode: 'markup_percentage',
  value: '',
  priority: '100',
};

// --- DATA KENDARAAN (MOCK DATA) ---
const INITIAL_CARS = [
  { id: 1, name: 'Perodua Axia (New)', category: 'Compact', priceLocal: 135, priceTourist: 160, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2KRRG31583SYNP78CEK0XS.png' },
  { id: 2, name: 'Perodua Axia (Old)', category: 'Compact', priceLocal: 120, priceTourist: 145, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2019, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBPFBV38BFRPQ26N1YF6G.png' },
  { id: 3, name: 'Perodua Myvi', category: 'Compact', priceLocal: 160, priceTourist: 190, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PZ2F2FX5K3FV79TBZ0VRK.png' },
  { id: 4, name: 'Perodua Bezza', category: 'Sedan', priceLocal: 160, priceTourist: 190, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBQA2YBK2WEXG2S996C8P.png' },
  { id: 5, name: 'Perodua Ativa', category: 'SUV', priceLocal: 230, priceTourist: 275, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBPXB7QDQK77S89SC316P.png' },
  { id: 6, name: 'Toyota Yaris', category: 'Compact', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY3W1F1P5309YJ6N0KF8W.png' },
  { id: 7, name: 'Honda City Hatchback', category: 'Compact', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NCSS8QBVKBTRRK4SN8P12.png' },
  { id: 8, name: 'Toyota Vios (3rd Gen)', category: 'Sedan', priceLocal: 200, priceTourist: 240, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2019, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY15JFRHXTY20R1FGAZJT.png' },
  { id: 9, name: 'Toyota Vios (4th Gen)', category: 'Sedan', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY23S26W22ATMH2RMY4FM.png' },
  { id: 10, name: 'Honda City Sedan', category: 'Sedan', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NCS662MEVPY7YBA73JZVX.png' },
  { id: 11, name: 'Perodua Aruz', category: 'SUV', priceLocal: 280, priceTourist: 335, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBNM56ZB8SFR079M76GAR.png' },
  { id: 12, name: 'Proton X50', category: 'SUV', priceLocal: 300, priceTourist: 360, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY2JDHK54NMSY88V8WDSZ.png' },
  { id: 13, name: 'Honda HRV', category: 'SUV', priceLocal: 400, priceTourist: 480, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NCT6G5J5KTSV9VJBGJGW3.png' },
  { id: 14, name: 'Perodua Alza', category: 'MPV', priceLocal: 250, priceTourist: 300, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBP1TS612Y5JDK3HWTXY7.png' },
  { id: 15, name: 'Nissan Serena', category: 'MPV', priceLocal: 480, priceTourist: 575, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Hybrid', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PZ3S9DWW3B66GNEAQZ2ZC.png' },
  { id: 16, name: 'Mitsubishi Xpander', category: 'MPV', priceLocal: 300, priceTourist: 360, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY2ZSQF6XAK9FCFRRDVFD.png' },
  { id: 17, name: 'Proton X70', category: 'SUV', priceLocal: 350, priceTourist: 420, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY3D8FPKQV1JTS3A34K27.png' },
  { id: 18, name: 'Honda CRV', category: 'SUV', priceLocal: 450, priceTourist: 540, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NCTQVT8TEJQ92W1RMC8AP.png' },
  { id: 19, name: 'Toyota Innova Zenix', category: 'MPV', priceLocal: 550, priceTourist: 660, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Hybrid', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PZ2YH481ZY4XJJYZWMN1Q.png' },
  { id: 20, name: 'Toyota Vellfire (3rd Gen)', category: 'MPV', priceLocal: 700, priceTourist: 840, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2020, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBMRMK1DBAAZ9JC6GJJDS.png' },
  { id: 21, name: 'Toyota Vellfire (4th Gen)', category: 'MPV', priceLocal: 1200, priceTourist: 1440, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2NBN72PZMHH0DSWHR8NMMR.png' },
  { id: 22, name: 'Hyundai Staria', category: 'MPV', priceLocal: 600, priceTourist: 720, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Diesel', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PY1ND0V1BWT3KYE7E8BKA.png' },
  { id: 23, name: 'Hyundai Starex', category: 'MPV', priceLocal: 500, priceTourist: 600, depositLocal: 400, depositTourist: 800, seats: 11, transmission: 'Auto', fuel: 'Diesel', year: 2021, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2PZ3C702T0MXM8WSTKG0YA.png' }
];

const LOCATIONS = [
  { name: 'HQ (Cyberjaya)', pickupLabel: 'Self Pickup (HQ) - MYR 0', returnLabel: 'Self Return (HQ) - MYR 0', fee: 0 },
  { name: 'Zone A (< 10 km)', pickupLabel: 'Delivery: Zone A (< 10 km) - MYR 30', returnLabel: 'Pickup: Zone A (< 10 km) - MYR 30', fee: 30 },
  { name: 'Zone B (10 km - 25 km)', pickupLabel: 'Delivery: Zone B (10 - 25 km) - MYR 50', returnLabel: 'Pickup: Zone B (10 - 25 km) - MYR 50', fee: 50 },
  { name: 'Zone C (26 km - 40 km)', pickupLabel: 'Delivery: Zone C (26 - 40 km) - MYR 80', returnLabel: 'Pickup: Zone C (26 - 40 km) - MYR 80', fee: 80 },
  { name: 'Airport / KLIA', pickupLabel: 'Delivery: Airport / KLIA - MYR 100', returnLabel: 'Pickup: Airport / KLIA - MYR 100', fee: 100 }
];

const TOURIST_LOCATIONS = [
  { name: 'KLIA / KLIA 2', pickupLabel: 'Pickup: KLIA / KLIA 2 - MYR 100', returnLabel: 'Return: KLIA / KLIA 2 - MYR 100', fee: 100 },
  { name: 'KL Sentral', pickupLabel: 'Pickup: KL Sentral - MYR 70', returnLabel: 'Return: KL Sentral - MYR 70', fee: 70 },
  { name: 'Terminal Bersepadu Selatan (TBS)', pickupLabel: 'Pickup: TBS - MYR 70', returnLabel: 'Return: TBS - MYR 70', fee: 70 },
  { name: 'KL City Centre (KLCC Area)', pickupLabel: 'Pickup: KL City Centre - MYR 100', returnLabel: 'Return: KL City Centre - MYR 100', fee: 100 },
  { name: 'HQ (Cyberjaya)', pickupLabel: 'Self Pickup (HQ) - MYR 0', returnLabel: 'Self Return (HQ) - MYR 0', fee: 0 }
];

const INITIAL_AGREEMENT_TERMS = [
  {
    title: '1. Booking & Cancellation Policy',
    bullets: [
      'Online bookings will be confirmed via email within one (1) hour. If the vehicle is unavailable, a full refund will be issued.',
      'Cancellation: 24 hours before pickup = Full Refund. Less than 24 hours or No Show = Strictly No Refund.',
      'Date changes or rescheduling are subject to vehicle availability.',
      'Vehicle images shown are for illustration only. The assigned vehicle may differ in color or minor specifications, but the same car model will be provided.',
    ],
  },
  {
    title: '2. Driver Requirements & Licenses',
    bullets: [
      'Drivers must be between 21 to 65 years old. Probationary (P) licenses are strictly not allowed.',
      'Foreigners with a valid driving license in English are permitted to drive in Malaysia for a maximum of 3 months.',
      'Additional drivers are subject to RM10/day and must be registered. Unregistered drivers found driving the vehicle will incur a RM500 penalty.',
    ],
  },
  {
    title: '3. Verification & Pickup (KYC)',
    bullets: [
      'Only the individual who made the booking is allowed to collect the vehicle.',
      'Required documents include IC/Passport, Driving License, and Utility Bill/Business Card or travel support documents for tourists.',
      'Renters must inspect the vehicle (VCR) upon collection. Any damages not reported immediately will be considered the renter\'s responsibility.',
    ],
  },
  {
    title: '4. Payment Channels, Security Deposit & Refunds',
    bullets: [
      'Malaysian citizens must complete payments via FPX (Online Banking). International tourists must complete payments via Credit/Debit Card.',
      'A security deposit of RM100 to RM400 is required before handover depending on the car category.',
      'Deposits for Malaysian citizens are refunded via online bank transfer within 3 to 14 working days after the vehicle is returned.',
      'Deposits for international tourists are refunded to the Credit/Debit Card used during booking, subject to the bank\'s policy.',
      'All refunds are subject to the vehicle being returned in good condition and clear of any traffic summons.',
    ],
  },
  {
    title: '5. Time, Mileage & Delivery',
    bullets: [
      'No refunds will be provided for returning the vehicle earlier than the agreed rental period.',
      'Late return is charged at 10% of the daily rate per extra hour. If the extra charges exceed the daily rate, a full 1-day charge will apply.',
      'Rentals include 300 km per day. Excess mileage is charged at RM1 per km.',
      'Delivery and pickup fees depend on the selected zone or tourist transit hub.',
    ],
  },
  {
    title: '6. Insurance & Accident Excess',
    bullets: [
      'All vehicles are insured. However, the renter is responsible for the non-waivable excess according to the vehicle group.',
      'A police report must be lodged within 24 hours for any accident.',
      'Insurance does not cover negligence, tire punctures, wrong fuel, dead batteries due to negligence, undercarriage, glass, or roof damages.',
    ],
  },
  {
    title: '7. Penalties & Additional Charges',
    bullets: [
      'Vehicles must be returned at the same fuel level or a charge of up to RM300 may apply.',
      'Extremely dirty vehicles will be charged RM300.',
      'Smoking, vaping, and carrying pets are strictly prohibited and may incur a RM500 penalty.',
      'Renters are fully responsible for PDRM, JPJ, and local council fines.',
    ],
  },
  {
    title: '8. Personal Data & Privacy',
    bullets: [
      'By proceeding with the rental, the renter agrees to these Terms & Conditions.',
      'Personal data provided may be shared with relevant agencies for security and debt collection purposes in the event of payment default.',
    ],
  },
];

// --- UTILITAS WATERMARK GAMBAR ---
const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const processImageWithWatermark = async (file) => {
  const sourceDataUrl = await readFileAsDataUrl(file);
  if (!sourceDataUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Use a smaller maximum dimension for mobile stability during VCR capture and upload.
        const MAX_DIMENSION = 240;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height >= width && height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sourceDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 4);

        const fontSize = Math.floor(width / 15);
        ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;

        ctx.fillText("FOR AFWAJA RENTAL ONLY", 0, 0);

        ctx.font = `bold ${fontSize / 2}px 'Space Grotesk', sans-serif`;
        ctx.fillText(new Date().toLocaleDateString('en-MY') + " " + new Date().toLocaleTimeString('en-MY'), 0, fontSize);

        ctx.restore();

        // Use more aggressive JPEG compression to reduce memory pressure on mobile devices.
        resolve(canvas.toDataURL('image/jpeg', 0.2));
      } catch (error) {
        console.warn('Watermark processing fallback applied for image upload.', error);
        resolve(sourceDataUrl);
      }
    };
    img.onerror = () => {
      console.warn('Image format could not be processed with watermark. Falling back to original file.');
      resolve(sourceDataUrl);
    };
    img.src = sourceDataUrl;
  });
};

const formatCurrency = (amount) => `MYR ${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';

  const localDateTimeMatch = String(dateStr).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second = '00'] = localDateTimeMatch;
    const utcDate = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );

    return utcDate.toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  }

  try {
    return new Date(dateStr).toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur',
    });
  } catch (error) {
    return dateStr;
  }
};

const getDatePart = (dateTimeValue) => {
  if (!dateTimeValue) return '';
  const match = String(dateTimeValue).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
};

const getTimePart = (dateTimeValue) => {
  if (!dateTimeValue) return '';
  const match = String(dateTimeValue).match(/T(\d{2}:\d{2})/);
  return match ? match[1] : '';
};

const formatDateForInputDisplay = (dateValue) => {
  if (!dateValue) return 'dd/mm/yyyy';
  const [year, month, day] = String(dateValue).split('-');
  if (!year || !month || !day) return 'dd/mm/yyyy';
  return `${day}/${month}/${year}`;
};

const maskAccountNumber = (value = '') => {
  const raw = String(value).replace(/\s+/g, '');
  if (!raw) return '-';
  if (raw.length <= 4) return raw;
  return `${'*'.repeat(Math.max(0, raw.length - 4))}${raw.slice(-4)}`;
};

const getRefundDetailsLabel = (customer = {}) => {
  if (customer.customerType === 'local') {
    const bankName = customer.bankName || 'Bank transfer';
    const accountNumber = customer.bankAccount || 'account pending';
    return `${bankName} - ${accountNumber}`;
  }

  return 'Original payment card';
};

const combineDateAndTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return '';
  return `${dateValue}T${timeValue}`;
};

const getImageFormatForPdf = (source) => (source?.startsWith('data:image/png') ? 'PNG' : 'JPEG');

const fetchImageAsDataUrl = async (source) => {
  if (!source) return null;
  if (source.startsWith('data:')) return source;

  try {
    const response = await fetch(source);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Unable to fetch image for agreement PDF.', error);
    return null;
  }
};

const buildAgreementEmailContent = ({ bookingId, customerName, pdfUrl }) => ({
  subject: `Your Rental Agreement Copy - ${bookingId}`,
  text: [
    `Dear ${customerName || 'Customer'},`,
    '',
    'Your initial VCR and rental agreement have been recorded successfully.',
    `Booking ID: ${bookingId}`,
    '',
    `Download your agreement copy here: ${pdfUrl}`,
    '',
    'Thank you,',
    'Afwaja Rental',
  ].join('\n'),
  html: `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#0f172a 0%,#155e75 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;">AFWAJA RENTAL</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">Your Rental Agreement Copy Is Ready</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#cffafe;">
            Your initial VCR and agreement have been recorded successfully for booking ${bookingId}.
          </p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334155;">
            Dear ${customerName || 'Customer'},<br/><br/>
            Please use the button below to download your agreement copy.
          </p>
          <a href="${pdfUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;">
            Download Agreement Copy
          </a>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
            If the button above does not work, copy this link into your browser:<br/>
            <a href="${pdfUrl}" style="color:#0891b2;word-break:break-all;">${pdfUrl}</a>
          </p>
        </div>
      </div>
    </div>
  `,
});

const createInitialAgreementPdf = async ({ booking, vcrImages, signatureBase64 }) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  let y = margin;

  const ensureSpace = (spaceNeeded = 50) => {
    if (y + spaceNeeded > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const addWrappedText = (text, options = {}) => {
    const fontSize = options.fontSize || 10;
    const color = options.color || '#334155';
    const indent = options.indent || 0;
    const gapAfter = options.gapAfter ?? 8;
    const maxWidth = options.maxWidth || contentWidth - indent;
    const lines = pdf.splitTextToSize(text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    ensureSpace(blockHeight + gapAfter);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    pdf.text(lines, margin + indent, y);
    y += blockHeight + gapAfter;
  };

  const addSectionTitle = (title) => {
    ensureSpace(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor('#0f172a');
    pdf.text(title, margin, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
  };

  const addImageBlock = async ({ title, source, maxHeight = 180, maxWidth = 340 }) => {
    const dataUrl = await fetchImageAsDataUrl(source);
    if (!dataUrl) return;

    const image = new Image();
    const loaded = await new Promise((resolve) => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = dataUrl;
    });
    if (!loaded || !image.width || !image.height) return;

    const naturalWidthInPdf = image.width * 0.75;
    const naturalHeightInPdf = image.height * 0.75;
    const widthScale = Math.min(1, maxWidth / naturalWidthInPdf, contentWidth / naturalWidthInPdf);
    const heightScale = Math.min(1, maxHeight / naturalHeightInPdf);
    const scale = Math.min(widthScale, heightScale);
    const imageWidth = naturalWidthInPdf * scale;
    const imageHeight = naturalHeightInPdf * scale;
    const imageX = margin + ((contentWidth - imageWidth) / 2);

    ensureSpace(imageHeight + 46);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor('#0f172a');
    pdf.text(title, margin, y);
    y += 12;
    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(imageX - 6, y - 6, imageWidth + 12, imageHeight + 12, 12, 12, 'FD');
    pdf.addImage(dataUrl, getImageFormatForPdf(dataUrl), imageX, y, imageWidth, imageHeight);
    y += imageHeight + 22;
    pdf.setFont('helvetica', 'normal');
  };

  const customer = booking.customer || {};
  const car = booking.car || {};
  const bookingId = booking.id || 'AFW-UNKNOWN';
  const pickupDate = formatDateTime(customer.startDate);
  const returnDate = formatDateTime(customer.endDate);
  const summaryRows = [
    ['Booking ID', bookingId],
    ['Customer Name', customer.name || '-'],
    ['Email', customer.email || '-'],
    ['Phone / WhatsApp', customer.phone || '-'],
    ['Customer Type', customer.customerType || '-'],
    ['Vehicle', car.name || '-'],
    ['Pickup', pickupDate],
    ['Return', returnDate],
    ['Pickup Location', customer.pickupLocation || '-'],
    ['Return Location', customer.returnLocation || '-'],
    ['Destination', customer.destination || '-'],
    ['Grand Total', formatCurrency(customer.grandTotal)],
  ];

  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 88, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor('#ffffff');
  pdf.text('Afwaja Rental Agreement', margin, 42);
  pdf.setFontSize(11);
  pdf.setTextColor('#cffafe');
  pdf.text(`Initial VCR Copy | ${bookingId}`, margin, 64);
  y = 112;

  addSectionTitle('Booking Summary');
  summaryRows.forEach(([label, value]) => {
    addWrappedText(`${label}: ${value}`, { fontSize: 10, gapAfter: 6 });
  });

  y += 4;
  addSectionTitle('Terms & Conditions');
  INITIAL_AGREEMENT_TERMS.forEach((section) => {
    addWrappedText(section.title, { fontSize: 11, color: '#0f172a', gapAfter: 6 });
    section.bullets.forEach((bullet) => {
      addWrappedText(`- ${bullet}`, { fontSize: 10, indent: 8, gapAfter: 4 });
    });
    y += 4;
  });

  addSectionTitle('KYC Documents');
  await addImageBlock({ title: 'ID / Passport', source: booking.documents?.ic });
  await addImageBlock({ title: 'Driving License / IDP', source: booking.documents?.license });
  await addImageBlock({ title: 'Supporting Document', source: booking.documents?.bill });

  addSectionTitle('Initial Vehicle Condition Report');
  await addImageBlock({ title: 'Front View', source: vcrImages.front });
  await addImageBlock({ title: 'Rear View', source: vcrImages.back });
  await addImageBlock({ title: 'Left View', source: vcrImages.left });
  await addImageBlock({ title: 'Right View', source: vcrImages.right });
  await addImageBlock({ title: 'Dashboard / Odometer', source: vcrImages.odometer });

  addSectionTitle('Customer Digital Signature');
  await addImageBlock({ title: 'Signature', source: signatureBase64, maxHeight: 70, maxWidth: 220 });
  addWrappedText(`Signed by: ${customer.name || '-'}`, { fontSize: 10, color: '#475569', gapAfter: 10 });

  ensureSpace(40);
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor('#64748b');
  pdf.text(`Generated on ${new Date().toLocaleString('en-MY')}`, margin, y);

  return pdf.output('datauristring');
};

// --- FUNGSI UPLOAD KE STORAGE ---
const uploadFileToStorage = async (base64, path) => {
  if (!base64) return null;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64, 'data_url');
  return await getDownloadURL(storageRef);
};

const uploadBinaryToStorage = async (binary, path, contentType) => {
  if (!binary) return null;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, binary, {
    contentType: contentType || binary.type || 'application/octet-stream',
  });
  return await getDownloadURL(storageRef);
};

const getGatewayReturnState = () => {
  if (typeof window === 'undefined') {
    return { initialView: 'home', bookingId: '', prefillTrackId: '', openAdminLogin: false };
  }

  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('view');
  const status = params.get('status');
  const toyyibStatus = params.get('status_id');
  const bookingId = params.get('bookingId') || params.get('order_id') || '';
  const isPaymentSuccess =
    Boolean(bookingId) && (status === 'success' || toyyibStatus === '1');

  let initialView = 'home';
  let openAdminLogin = false;

  if (requestedView === 'track' && bookingId) {
    initialView = 'track';
  } else if (requestedView === 'invoice' && bookingId) {
    initialView = 'invoice';
  } else if (requestedView === 'admin') {
    initialView = 'home';
    openAdminLogin = true;
  }

  return {
    initialView: isPaymentSuccess ? 'thank-you' : initialView,
    bookingId,
    prefillTrackId: isPaymentSuccess || requestedView === 'track' || requestedView === 'invoice' ? bookingId : '',
    openAdminLogin,
  };
};

const normalizeCouponCode = (value = '') =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');

const getCouponDocId = (code = '') => normalizeCouponCode(code);

const getCouponCollectionPath = (appIdValue) => ['artifacts', appIdValue, 'public', 'data', 'coupons'];

const getCouponStatus = (coupon) => {
  const now = new Date();
  const validFrom = coupon.validFrom ? new Date(`${coupon.validFrom}T00:00:00`) : null;
  const validUntil = coupon.validUntil ? new Date(`${coupon.validUntil}T23:59:59`) : null;
  const usageLimit = Number(coupon.usageLimit || 0);
  const usedCount = Number(coupon.usedCount || 0);

  if (!coupon.active) return { label: 'Disabled', tone: 'slate' };
  if (validFrom && validFrom > now) return { label: 'Scheduled', tone: 'blue' };
  if (validUntil && validUntil < now) return { label: 'Expired', tone: 'red' };
  if (usageLimit > 0 && usedCount >= usageLimit) return { label: 'Usage Limit Reached', tone: 'amber' };
  return { label: 'Active', tone: 'emerald' };
};

const getCouponStatusClass = (tone) => {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'blue':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'amber':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'red':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const summarizeCouponValue = (coupon) =>
  coupon.type === 'fixed_amount'
    ? `MYR ${Number(coupon.value || 0)} OFF`
    : `${Number(coupon.value || 0)}% OFF`;

const getPromoPopupCollectionPath = (appIdValue) => ['artifacts', appIdValue, 'public', 'data', 'promoPopups'];

const getPromoPopupStatus = (popup) => {
  const now = new Date();
  const startDate = popup.startDate ? new Date(`${popup.startDate}T00:00:00`) : null;
  const endDate = popup.endDate ? new Date(`${popup.endDate}T23:59:59`) : null;

  if (!popup.active) return { label: 'Disabled', tone: 'slate' };
  if (startDate && startDate > now) return { label: 'Scheduled', tone: 'blue' };
  if (endDate && endDate < now) return { label: 'Expired', tone: 'red' };
  return { label: 'Active', tone: 'emerald' };
};

const getPromoPopupThemeClasses = (theme = 'ocean') => {
  switch (theme) {
    case 'sunset':
      return {
        shell: 'border-orange-200/80 bg-white/95 shadow-[0_30px_70px_rgba(124,45,18,0.18)]',
        hero: 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500',
        badgeText: 'text-orange-100',
        codeWrap: 'border-orange-200 bg-orange-50',
        codeText: 'text-orange-900',
        chip: 'bg-white text-orange-700',
      };
    case 'midnight':
      return {
        shell: 'border-slate-700/70 bg-slate-950/95 shadow-[0_30px_70px_rgba(15,23,42,0.45)]',
        hero: 'bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-700',
        badgeText: 'text-cyan-100',
        codeWrap: 'border-slate-700 bg-slate-900/80',
        codeText: 'text-cyan-100',
        chip: 'bg-white/10 text-cyan-100',
      };
    default:
      return {
        shell: 'border-cyan-200/80 bg-white/95 shadow-[0_30px_70px_rgba(8,47,73,0.22)]',
        hero: 'bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500',
        badgeText: 'text-cyan-100',
        codeWrap: 'border-emerald-200 bg-emerald-50',
        codeText: 'text-emerald-900',
        chip: 'bg-white text-emerald-700',
      };
  }
};

const getPromoPopupAudienceLabel = (audience = 'all') => {
  switch (audience) {
    case 'local':
      return 'Local only';
    case 'international':
      return 'Tourist only';
    default:
      return 'All visitors';
  }
};

const getSeasonalCollectionPath = (appIdValue) => ['artifacts', appIdValue, 'public', 'data', 'seasonalPricing'];

const getSeasonalPricingStatus = (season) => {
  const now = new Date();
  const startDate = season.startDate ? new Date(`${season.startDate}T00:00:00`) : null;
  const endDate = season.endDate ? new Date(`${season.endDate}T23:59:59`) : null;

  if (!season.active) return { label: 'Disabled', tone: 'slate' };
  if (startDate && startDate > now) return { label: 'Scheduled', tone: 'blue' };
  if (endDate && endDate < now) return { label: 'Expired', tone: 'red' };
  return { label: 'Active', tone: 'emerald' };
};

const getSeasonalScopeLabel = (season) => {
  if (season.scope === 'category') return `Category: ${season.category}`;
  if (season.scope === 'car') return `Vehicle ID: ${season.carId}`;
  return 'All vehicles';
};

const summarizeSeasonalAdjustment = (season) => {
  switch (season.pricingMode) {
    case 'override_price':
      return `Override to MYR ${Number(season.value || 0)}/day`;
    case 'markdown_percentage':
      return `${Number(season.value || 0)}% discount`;
    case 'fixed_adjustment':
      return `${Number(season.value || 0) >= 0 ? '+' : '-'}MYR ${Math.abs(Number(season.value || 0))}/day`;
    default:
      return `${Number(season.value || 0)}% markup`;
  }
};

const getBaseDailyPriceForCustomerType = (car, customerType) =>
  customerType === 'international' ? car.priceTourist : car.priceLocal;

const getSeasonScopeRank = (scope = 'all') => {
  if (scope === 'car') return 3;
  if (scope === 'category') return 2;
  return 1;
};

const bookingOverlapsSeason = (season, startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const bookingStart = new Date(startDate);
  const bookingEnd = new Date(endDate);
  const seasonStart = season.startDate ? new Date(`${season.startDate}T00:00:00`) : null;
  const seasonEnd = season.endDate ? new Date(`${season.endDate}T23:59:59`) : null;

  if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false;
  if (seasonStart && bookingEnd < seasonStart) return false;
  if (seasonEnd && bookingStart > seasonEnd) return false;
  return true;
};

const emptySeasonalPricing = () => ({
  seasonalDocId: '',
  name: '',
  note: '',
  pricingMode: '',
  value: 0,
  priority: 0,
  originalBaseRate: 0,
  adjustedBaseRate: 0,
});

const getSeasonalPricingOutcome = (seasonalPricings, {
  car,
  customerType,
  startDate,
  endDate,
  baseDailyRate,
}) => {
  if (!car || !startDate || !endDate) {
    return { adjustedBaseRate: baseDailyRate, seasonalPricing: emptySeasonalPricing() };
  }

  const matchedSeason = [...seasonalPricings]
    .filter((season) => {
      if (!season.active) return false;
      if (!bookingOverlapsSeason(season, startDate, endDate)) return false;
      if (season.customerType && season.customerType !== 'both' && season.customerType !== customerType) return false;
      if (season.scope === 'category' && season.category && season.category !== 'all' && season.category !== car.category) return false;
      if (season.scope === 'car' && season.carId && season.carId !== 'all' && String(season.carId) !== String(car.id)) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      const scopeDiff = getSeasonScopeRank(b.scope) - getSeasonScopeRank(a.scope);
      if (scopeDiff !== 0) return scopeDiff;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    })[0];

  if (!matchedSeason) {
    return { adjustedBaseRate: baseDailyRate, seasonalPricing: emptySeasonalPricing() };
  }

  const seasonValue = Number(matchedSeason.value || 0);
  let adjustedBaseRate = Number(baseDailyRate || 0);

  switch (matchedSeason.pricingMode) {
    case 'override_price':
      adjustedBaseRate = Math.max(0, Math.round(seasonValue));
      break;
    case 'markdown_percentage':
      adjustedBaseRate = Math.max(0, Math.round(baseDailyRate * (1 - seasonValue / 100)));
      break;
    case 'fixed_adjustment':
      adjustedBaseRate = Math.max(0, Math.round(baseDailyRate + seasonValue));
      break;
    default:
      adjustedBaseRate = Math.max(0, Math.round(baseDailyRate * (1 + seasonValue / 100)));
      break;
  }

  return {
    adjustedBaseRate,
    seasonalPricing: {
      seasonalDocId: matchedSeason.docId || '',
      name: matchedSeason.name || '',
      note: matchedSeason.note || '',
      pricingMode: matchedSeason.pricingMode || 'markup_percentage',
      value: seasonValue,
      priority: Number(matchedSeason.priority || 0),
      originalBaseRate: Number(baseDailyRate || 0),
      adjustedBaseRate,
    },
  };
};

const emptyAppliedCoupon = () => ({
  code: '',
  description: '',
  type: '',
  value: 0,
  discountAmount: 0,
  originalRentalTotal: 0,
  finalRentalTotal: 0,
  couponDocId: '',
});

export default function App() {
  // ==========================================
  // STATE UTAMA APP
  // ==========================================
  const gatewayReturnState = getGatewayReturnState();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState(gatewayReturnState.initialView);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(gatewayReturnState.openAdminLogin);
  const [adminPin, setAdminPin] = useState('');
  const [cars, setCars] = useState(INITIAL_CARS);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [promoPopups, setPromoPopups] = useState([]);
  const [seasonalPricings, setSeasonalPricings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fleetPricingMode, setFleetPricingMode] = useState('local');
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    pickupLocation: '',
    returnLocation: '',
    pickupLocationMeta: null,
    returnLocationMeta: null,
    returnAtDifferentLocation: false,
    destination: '',
    accountHolderName: '',
    bankName: '',
    bankAccount: '',
    pickupFee: 0,
    returnFee: 0,
    totalDays: 0,
    extraHours: 0,
    extraHoursFee: 0,
    rentalSubtotal: 0,
    totalPrice: 0,
    appliedDailyRate: 0,
    discountTier: 'Normal',
    discountPercentage: 0,
    seasonalPricing: emptySeasonalPricing(),
    coupon: emptyAppliedCoupon(),
    deposit: 0,
    grandTotal: 0,
    customerType: 'local',
    paymentMethod: 'fpx'
  });
  const [currentBookingId, setCurrentBookingId] = useState(gatewayReturnState.bookingId || null);
  const [searchTrackId, setSearchTrackId] = useState(gatewayReturnState.prefillTrackId || '');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [activeGateway, setActiveGateway] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({ ic: null, license: null, bill: null });
  const [vcrDocs, setVcrDocs] = useState(EMPTY_VCR_DOCS);
  const [vcrUploading, setVcrUploading] = useState(false);
  const [returnVcrDocs, setReturnVcrDocs] = useState(EMPTY_VCR_DOCS); 
  const [returnVcrUploading, setReturnVcrUploading] = useState(false);
  const sigCanvas = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [managingBooking, setManagingBooking] = useState(null);
  const [verifyingKyc, setVerifyingKyc] = useState(null); 
  const [selectedKycPreview, setSelectedKycPreview] = useState(null);
  const [viewingVcr, setViewingVcr] = useState(null);
  const [viewingReturnVcr, setViewingReturnVcr] = useState(null);
  const [fulfillmentType, setFulfillmentType] = useState('supplier'); 
  const [supplierDetails, setSupplierDetails] = useState({ name: '', cost: '', phone: '' });
  const [notifications, setNotifications] = useState([]);
  const [kycType, setKycType] = useState('local');
  const [contactSending, setContactSending] = useState(false);
  const [adminFilters, setAdminFilters] = useState({
    bookingDateFrom: '',
    bookingDateTo: '',
    pickupDateFrom: '',
    pickupDateTo: '',
    supplier: 'all',
  });
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState({ type: '', message: '' });
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON_FORM);
  const [seasonalModalOpen, setSeasonalModalOpen] = useState(false);
  const [editingSeasonalPricing, setEditingSeasonalPricing] = useState(null);
  const [seasonalForm, setSeasonalForm] = useState(EMPTY_SEASONAL_FORM);
  const [promoPopupModalOpen, setPromoPopupModalOpen] = useState(false);
  const [editingPromoPopup, setEditingPromoPopup] = useState(null);
  const [promoPopupForm, setPromoPopupForm] = useState(EMPTY_PROMO_POPUP_FORM);
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [locationModal, setLocationModal] = useState({ open: false, field: 'pickup' });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [heroPromoIndex, setHeroPromoIndex] = useState(0);
  const locationSearchTokenRef = useRef(null);
  const latestLocationRequestIdRef = useRef(0);
  const pickupDateInputRef = useRef(null);
  const returnDateInputRef = useRef(null);
  const bookingPickupDateInputRef = useRef(null);
  const bookingReturnDateInputRef = useRef(null);
  
  // FIX: Memindahkan state ini dari BookingView ke parent (App) 
  // agar urutan hooks React (Rules of Hooks) tetap konsisten.
  const [readingDoc, setReadingDoc] = useState(null);

  const trackedBooking = searchTrackId ? bookings.find(b => b.id === searchTrackId) : null;
  const activePromoPopup = [...promoPopups]
    .filter((popup) => {
      const popupStatus = getPromoPopupStatus(popup);
      const audienceMatch =
        popup.audience === 'all' ||
        (popup.audience === 'local' && fleetPricingMode === 'local') ||
        (popup.audience === 'international' && fleetPricingMode === 'international');
      return popupStatus.label === 'Active' && audienceMatch;
    })
    .sort((a, b) => {
      const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    })[0] || null;
  const activePromoPopupCoupon = activePromoPopup?.couponCode
    ? coupons.find((coupon) => normalizeCouponCode(coupon.code) === normalizeCouponCode(activePromoPopup.couponCode))
    : null;
  const promoPopupDismissKey = activePromoPopup
    ? `afwaja:promo-popup:${activePromoPopup.docId}:${activePromoPopup.updatedAt || activePromoPopup.createdAt || ''}`
    : '';

  const getDateKey = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isWithinDateRange = (value, from, to) => {
    const dateKey = getDateKey(value);
    if (!dateKey) return !from && !to;
    if (from && dateKey < from) return false;
    if (to && dateKey > to) return false;
    return true;
  };

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000); 
  };

  const calculateCouponOutcome = (coupon, {
    rentalTotal,
    totalDays,
    customerType,
    car,
    customerEmail,
  }) => {
    if (!coupon) {
      return { valid: false, message: 'Coupon not found.' };
    }

    const now = new Date();
    const validFrom = coupon.validFrom ? new Date(`${coupon.validFrom}T00:00:00`) : null;
    const validUntil = coupon.validUntil ? new Date(`${coupon.validUntil}T23:59:59`) : null;
    const usageLimit = Number(coupon.usageLimit || 0);
    const usedCount = Number(coupon.usedCount || 0);
    const minimumRentalDays = Number(coupon.minimumRentalDays || 0);
    const minimumSpend = Number(coupon.minimumSpend || 0);
    const couponValue = Number(coupon.value || 0);
    const emailKey = String(customerEmail || '').trim().toLowerCase();

    if (!coupon.active) {
      return { valid: false, message: 'This coupon is currently disabled.' };
    }

    if (validFrom && validFrom > now) {
      return { valid: false, message: `This coupon is only valid from ${formatDateForInputDisplay(coupon.validFrom)}.` };
    }

    if (validUntil && validUntil < now) {
      return { valid: false, message: 'This coupon has expired.' };
    }

    if (usageLimit > 0 && usedCount >= usageLimit) {
      return { valid: false, message: 'This coupon has reached its usage limit.' };
    }

    if (coupon.customerType && coupon.customerType !== 'both' && coupon.customerType !== customerType) {
      return { valid: false, message: 'This coupon is not applicable for the selected customer type.' };
    }

    if (minimumRentalDays > 0 && Number(totalDays || 0) < minimumRentalDays) {
      return { valid: false, message: `This coupon requires a minimum rental of ${minimumRentalDays} days.` };
    }

    if (minimumSpend > 0 && Number(rentalTotal || 0) < minimumSpend) {
      return { valid: false, message: `This coupon requires a rental subtotal of at least MYR ${minimumSpend}.` };
    }

    if (coupon.applicableScope === 'category' && coupon.applicableCategory && coupon.applicableCategory !== 'all' && coupon.applicableCategory !== car?.category) {
      return { valid: false, message: 'This coupon is not valid for the selected vehicle category.' };
    }

    if (coupon.applicableScope === 'car' && coupon.applicableCarId && coupon.applicableCarId !== 'all' && String(coupon.applicableCarId) !== String(car?.id)) {
      return { valid: false, message: 'This coupon is not valid for the selected vehicle.' };
    }

    if ((coupon.onePerCustomer || coupon.firstBookingOnly) && !emailKey) {
      return { valid: false, message: 'Please enter your email address before applying this coupon.' };
    }

    const successfulCustomerBookings = bookings.filter((booking) => {
      const bookingEmail = String(booking.customer?.email || '').trim().toLowerCase();
      return bookingEmail && bookingEmail === emailKey && booking.payment?.status === 'success';
    });

    if (coupon.firstBookingOnly && successfulCustomerBookings.length > 0) {
      return { valid: false, message: 'This coupon is only valid for first-time customers.' };
    }

    if (coupon.onePerCustomer) {
      const alreadyUsed = successfulCustomerBookings.some(
        (booking) => normalizeCouponCode(booking.customer?.coupon?.code) === normalizeCouponCode(coupon.code)
      );
      if (alreadyUsed) {
        return { valid: false, message: 'This coupon has already been used with this email address.' };
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(Number(rentalTotal || 0), couponValue);
    } else {
      discountAmount = Math.round(Number(rentalTotal || 0) * (couponValue / 100));
    }

    if (discountAmount <= 0) {
      return { valid: false, message: 'This coupon does not produce a valid discount for the current booking.' };
    }

    return {
      valid: true,
      discountAmount,
      finalRentalTotal: Math.max(0, Number(rentalTotal || 0) - discountAmount),
      summary: {
        code: normalizeCouponCode(coupon.code),
        description: coupon.description || '',
        type: coupon.type,
        value: couponValue,
        discountAmount,
        originalRentalTotal: Number(rentalTotal || 0),
        finalRentalTotal: Math.max(0, Number(rentalTotal || 0) - discountAmount),
        couponDocId: coupon.docId || getCouponDocId(coupon.code),
      },
    };
  };

  const resetCouponState = () => {
    setCouponInput('');
    setCouponFeedback({ type: '', message: '' });
    return emptyAppliedCoupon();
  };

  const upsertBookingCoupon = (couponSummary) => {
    setBookingDetails((prev) => ({ ...prev, coupon: couponSummary }));
  };

  const applyCouponCode = (rawCode) => {
    if (!selectedCar) {
      setCouponFeedback({ type: 'error', message: 'Please choose a vehicle first.' });
      return false;
    }

    const couponCode = normalizeCouponCode(rawCode || couponInput);
    if (!couponCode) {
      setCouponFeedback({ type: 'error', message: 'Please enter a coupon code.' });
      return false;
    }

    const isTourist = bookingDetails.customerType === 'international';
    const baseDailyPrice = isTourist ? selectedCar.priceTourist : selectedCar.priceLocal;
    const { adjustedBaseRate } = getSeasonalPricingOutcome(seasonalPricings, {
      car: selectedCar,
      customerType: bookingDetails.customerType,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      baseDailyRate,
    });
    const liveRental = getRentalDurationAndCost(bookingDetails.startDate, bookingDetails.endDate, adjustedBaseRate);

    if (liveRental.totalHours < 48) {
      setCouponFeedback({ type: 'error', message: 'Coupons can only be applied after a valid 48-hour rental is selected.' });
      return false;
    }

    const matchedCoupon = coupons.find((coupon) => normalizeCouponCode(coupon.code) === couponCode);
    const outcome = calculateCouponOutcome(matchedCoupon, {
      rentalTotal: liveRental.rentalTotal,
      totalDays: liveRental.days,
      customerType: bookingDetails.customerType,
      car: selectedCar,
      customerEmail: bookingDetails.email,
    });

    if (!outcome.valid) {
      upsertBookingCoupon(emptyAppliedCoupon());
      setCouponFeedback({ type: 'error', message: outcome.message });
      return false;
    }

    upsertBookingCoupon(outcome.summary);
    setCouponInput(outcome.summary.code);
    setCouponFeedback({
      type: 'success',
      message: `${outcome.summary.code} applied successfully. You saved MYR ${outcome.summary.discountAmount}.`,
    });
    return true;
  };

  const removeCouponCode = () => {
    upsertBookingCoupon(emptyAppliedCoupon());
    setCouponInput('');
    setCouponFeedback({ type: '', message: '' });
  };

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    setCouponForm(EMPTY_COUPON_FORM);
    setCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      value: coupon.value ?? '',
      active: coupon.active !== false,
      validFrom: coupon.validFrom || '',
      validUntil: coupon.validUntil || '',
      minimumRentalDays: coupon.minimumRentalDays ?? '',
      minimumSpend: coupon.minimumSpend ?? '',
      customerType: coupon.customerType || 'both',
      applicableScope: coupon.applicableScope || 'all',
      applicableCategory: coupon.applicableCategory || 'all',
      applicableCarId: coupon.applicableCarId || 'all',
      usageLimit: coupon.usageLimit ?? '',
      onePerCustomer: Boolean(coupon.onePerCustomer),
      firstBookingOnly: Boolean(coupon.firstBookingOnly),
    });
    setCouponModalOpen(true);
  };

  const openLocationPicker = (field) => {
    const existingAddress =
      field === 'pickup'
        ? bookingDetails.pickupLocationMeta?.address || bookingDetails.pickupLocation
        : bookingDetails.returnLocationMeta?.address || bookingDetails.returnLocation;

    locationSearchTokenRef.current = null;
    setLocationModal({ open: true, field });
    setLocationQuery(existingAddress || '');
    setLocationSuggestions([]);
    setLocationSearchError('');
  };

  const closeLocationPicker = () => {
    locationSearchTokenRef.current = null;
    setLocationModal({ open: false, field: 'pickup' });
    setLocationQuery('');
    setLocationSuggestions([]);
    setLocationSearchError('');
  };

  const estimateLocationFee = async (location) => {
    await loadGoogleMapsScript();
    const { DistanceMatrixService } = await window.google.maps.importLibrary('routes');

    const service = new DistanceMatrixService();
    const response = await service.getDistanceMatrix({
      origins: [{ lat: AFWAJA_HQ.lat, lng: AFWAJA_HQ.lng }],
      destinations: [{ lat: location.lat, lng: location.lng }],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
    });

    const matrixResult = response.rows?.[0]?.elements?.[0];
    if (!matrixResult || matrixResult.status !== 'OK') {
      throw new Error('Unable to calculate delivery distance for this location.');
    }

    const distanceMeters = matrixResult.distance?.value || 0;
    const distanceKm = distanceMeters < 500 ? 0 : Math.ceil((distanceMeters / 1000) * 10) / 10;
    const fee = Math.round(distanceKm * DELIVERY_RATE_PER_KM);

    return createLocationMeta({
      ...location,
      distanceKm,
      fee,
    });
  };

  const applyLocationSelection = (field, locationMeta) => {
    setBookingDetails(prev => {
      const nextState = {
        ...prev,
        [`${field}Location`]: locationMeta.address,
        [`${field}LocationMeta`]: locationMeta,
        [`${field}Fee`]: locationMeta.fee,
      };

      if (field === 'pickup' && !prev.returnAtDifferentLocation) {
        nextState.returnLocation = locationMeta.address;
        nextState.returnLocationMeta = locationMeta;
        nextState.returnFee = locationMeta.fee;
      }

      return nextState;
    });
  };

  const handleSelectHqLocation = () => {
    applyLocationSelection(locationModal.field, HQ_LOCATION_META);
    closeLocationPicker();
  };

  const updateHomepageDateTime = (field, part, value, useFallbackTime = true) => {
    setBookingDetails(prev => {
      const currentValue = field === 'startDate' ? prev.startDate : prev.endDate;
      const nextDate = part === 'date' ? value : getDatePart(currentValue);
      const fallbackTime = useFallbackTime ? (field === 'startDate' ? '08:00' : '10:00') : '';
      const nextTime = part === 'time' ? value : (getTimePart(currentValue) || fallbackTime);
      const nextValue = nextDate && nextTime ? combineDateAndTime(nextDate, nextTime) : (nextDate || '');

      const nextState = {
        ...prev,
        [field]: nextValue,
      };

      if (field === 'startDate' && prev.endDate) {
        const currentEndDate = getDatePart(prev.endDate);
        if (currentEndDate && nextDate && currentEndDate < nextDate) {
          const currentEndTime = getTimePart(prev.endDate) || (useFallbackTime ? '10:00' : '');
          nextState.endDate = currentEndTime ? combineDateAndTime(nextDate, currentEndTime) : nextDate;
        }
      }

      return nextState;
    });
  };

  const handleSelectSuggestedLocation = async (suggestion) => {
    try {
      setLocationSearchLoading(true);
      setLocationSearchError('');

      await loadGoogleMapsScript();
      const placeDetails = await new Promise((resolve, reject) => {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails(
          {
            placeId: suggestion.place_id,
            fields: ['name', 'formatted_address', 'geometry'],
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
              return;
            }
            reject(new Error('Selected place details are unavailable.'));
          },
        );
      });

      if (!placeDetails.geometry?.location) {
        throw new Error('Selected place has no map coordinates.');
      }

      const locationMeta = await estimateLocationFee({
        placeId: suggestion.place_id || '',
        name: placeDetails.name || suggestion.structured_formatting?.main_text || suggestion.description || 'Selected location',
        address: placeDetails.formatted_address || suggestion.description || '',
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng(),
      });

      applyLocationSelection(locationModal.field, locationMeta);
      closeLocationPicker();
    } catch (error) {
      console.error('Location selection failed:', error);
      setLocationSearchError(error.message || 'Unable to use this location.');
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleHomepageSearch = () => {
    if (!bookingDetails.startDate || !bookingDetails.endDate) {
      showNotification('Please set both pickup and return date/time first.', 'error');
      return;
    }

    if (!getTimePart(bookingDetails.startDate) || !getTimePart(bookingDetails.endDate)) {
      showNotification('Please choose both pickup and return times first.', 'error');
      return;
    }

    if (!bookingDetails.pickupLocation) {
      showNotification('Please choose your pickup location first.', 'error');
      return;
    }

    if (!bookingDetails.returnLocation) {
      showNotification('Please choose your return location first.', 'error');
      return;
    }

    const pickupDateTime = new Date(bookingDetails.startDate);
    const returnDateTime = new Date(bookingDetails.endDate);
    const diffHours = (pickupDateTime - new Date()) / (1000 * 60 * 60);
    const rentalHours = (returnDateTime - pickupDateTime) / (1000 * 60 * 60);

    if (returnDateTime <= pickupDateTime) {
      showNotification('Return date/time must be after pickup date/time.', 'error');
      return;
    }

    if (diffHours < 24) {
      showNotification('No urgent booking. Please book at least 24 hours in advance.', 'error');
      return;
    }

    if (rentalHours < 48) {
      showNotification('Minimum rental period is 48 hours (2 days).', 'error');
      return;
    }

    const fleetSection = document.getElementById('fleet');
    if (fleetSection) {
      fleetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- LOGIK HARGA & DISKAUN AUTOTMATIK ---
  const getRentalDurationAndCost = (start, end, baseDailyRate) => {
    if (!start || !end) return { days: 0, extraHours: 0, extraHoursFee: 0, rentalTotal: 0, totalHours: 0, appliedDailyRate: baseDailyRate, discountTier: 'Normal', discountPercentage: 0 };
    const diff = new Date(end) - new Date(start);
    if (diff <= 0) return { days: 0, extraHours: 0, extraHoursFee: 0, rentalTotal: 0, totalHours: 0, appliedDailyRate: baseDailyRate, discountTier: 'Normal', discountPercentage: 0 };

    const totalHours = diff / (1000 * 60 * 60);
    let days = Math.floor(totalHours / 24);
    let extraHours = Math.ceil(totalHours % 24);

    let multiplier = 1.0;
    let discountTier = 'Normal Rate';
    let discountPercentage = 0;

    // Sistem Diskaun Afwaja
    if (days >= 30) {
      multiplier = 0.55; // 45% Diskaun (Bulanan)
      discountTier = 'Monthly Rate';
      discountPercentage = 45;
    } else if (days >= 7) {
      multiplier = 0.80; // 20% Diskaun (Mingguan)
      discountTier = 'Weekly Rate';
      discountPercentage = 20;
    } else if (days >= 3) {
      multiplier = 0.90; // 10% Diskaun (3 Hari Ke Atas)
      discountTier = '3+ Days Rate';
      discountPercentage = 10;
    }

    const appliedDailyRate = Math.round(baseDailyRate * multiplier);

    // Cas tambahan: 10% dari harga harian SEMASA (selepas diskaun) untuk setiap jam.
    const hourlyRate = Math.round(appliedDailyRate / 10);
    let extraHoursFee = extraHours * hourlyRate;

    // Kalau cas lebih masa sama atau lebih dari harga sehari, terus kira sebagai 1 hari penuh.
    if (extraHoursFee >= appliedDailyRate) {
      days += 1;
      extraHours = 0;
      extraHoursFee = 0;
    }

    const rentalTotal = (days * appliedDailyRate) + extraHoursFee;
    return { days, extraHours, extraHoursFee, rentalTotal, totalHours, appliedDailyRate, discountTier, discountPercentage };
  };

  // --- USE EFFECTS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof globalThis.__initial_auth_token !== 'undefined' && globalThis.__initial_auth_token) {
          await signInWithCustomToken(auth, globalThis.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- TANGKAP URL DARI TOYYIBPAY & STRIPE ---
  useEffect(() => {
    if (!user) return;

    const syncGatewayReturn = async () => {
      const findBookingDocByBookingId = async (bookingId) => {
        if (!bookingId) return null;
        const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
        const bookingQuery = query(bookingsRef, where('id', '==', bookingId));
        const bookingSnapshot = await getDocs(bookingQuery);
        return bookingSnapshot.docs[0] || null;
      };

      const syncPaymentStatusFromGatewayReturn = async (bookingId, nextStatus) => {
        const bookingDoc = await findBookingDocByBookingId(bookingId);
        if (!bookingDoc) return false;

        const currentBooking = bookingDoc.data();
        const currentStatus = currentBooking.payment?.status;
        if (currentStatus === nextStatus) return true;

        const updatedPayment = {
          ...(currentBooking.payment || {}),
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          lastResult:
            nextStatus === 'success' ? 'gateway_confirmed' : 'gateway_failed_or_cancelled',
        };

        if (nextStatus === 'success') {
          updatedPayment.confirmedAt = new Date().toISOString();
          updatedPayment.failureReason = null;
        } else {
          updatedPayment.failureReason = 'cancelled_or_failed';
        }

        const updatedFields = {
          payment: updatedPayment,
        };

        if (nextStatus === 'success') {
          updatedFields.status = 'Paid_Pending';
        } else if (
          !['Completed', 'Active', 'Return_Pending', 'Returned', 'Refunded', 'Cancelled'].includes(currentBooking.status)
        ) {
          updatedFields.status = 'Payment_Failed';
        }

        await updateDoc(bookingDoc.ref, updatedFields);

        return true;
      };

      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const toyyibStatus = params.get('status_id');
      const bookingId = params.get('bookingId') || params.get('order_id');

      if (!status && !toyyibStatus) return;

      try {
        if ((status === 'success' || toyyibStatus === '1') && bookingId) {
          setCurrentBookingId(bookingId);
          setSearchTrackId(bookingId);
          setCurrentView('thank-you');
          await syncPaymentStatusFromGatewayReturn(bookingId, 'success');
        } else if (toyyibStatus === '2' && bookingId) {
          setCurrentBookingId(bookingId);
          setCurrentView('home');
          showNotification('Payment is still pending confirmation.', 'info');
        } else if ((status === 'cancelled' || toyyibStatus === '3') && bookingId) {
          setCurrentBookingId(bookingId);
          setCurrentView('home');
          await syncPaymentStatusFromGatewayReturn(bookingId, 'failed');
          showNotification('Payment cancelled or failed.', 'error');
        } else if (status === 'cancelled' || toyyibStatus === '3') {
          showNotification('Payment cancelled or failed.', 'error');
        }
      } catch (error) {
        console.error('Failed to sync payment status from gateway return:', error);
        showNotification('Unable to sync payment status automatically.', 'error');
      } finally {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    syncGatewayReturn();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
    const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
      const fetchedBookings = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      fetchedBookings.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBookings(fetchedBookings);
    }, (error) => {
      console.error("Error fetching:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const couponsRef = collection(db, ...getCouponCollectionPath(appId));
    const unsubscribe = onSnapshot(couponsRef, (snapshot) => {
      const fetchedCoupons = snapshot.docs.map((couponDoc) => ({
        docId: couponDoc.id,
        ...couponDoc.data(),
      }));
      fetchedCoupons.sort((a, b) => normalizeCouponCode(a.code).localeCompare(normalizeCouponCode(b.code)));
      setCoupons(fetchedCoupons);
    }, (error) => {
      console.error('Error fetching coupons:', error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const seasonalRef = collection(db, ...getSeasonalCollectionPath(appId));
    const unsubscribe = onSnapshot(seasonalRef, (snapshot) => {
      const fetchedSeasons = snapshot.docs.map((seasonDoc) => ({
        docId: seasonDoc.id,
        ...seasonDoc.data(),
      }));
      fetchedSeasons.sort((a, b) => {
        const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });
      setSeasonalPricings(fetchedSeasons);
    }, (error) => {
      console.error('Error fetching seasonal pricing:', error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const promoPopupsRef = collection(db, ...getPromoPopupCollectionPath(appId));
    const unsubscribe = onSnapshot(promoPopupsRef, (snapshot) => {
      const fetchedPromoPopups = snapshot.docs.map((promoDoc) => ({
        docId: promoDoc.id,
        ...promoDoc.data(),
      }));
      fetchedPromoPopups.sort((a, b) => {
        const priorityDiff = Number(b.priority || 0) - Number(a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });
      setPromoPopups(fetchedPromoPopups);
    }, (error) => {
      console.error('Error fetching promo popups:', error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!bookingDetails.coupon?.code || !selectedCar) return;

    const isTourist = bookingDetails.customerType === 'international';
    const baseDailyPrice = isTourist ? selectedCar.priceTourist : selectedCar.priceLocal;
    const { adjustedBaseRate } = getSeasonalPricingOutcome(seasonalPricings, {
      car: selectedCar,
      customerType: bookingDetails.customerType,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      baseDailyRate,
    });
    const liveRental = getRentalDurationAndCost(bookingDetails.startDate, bookingDetails.endDate, adjustedBaseRate);
    const matchedCoupon = coupons.find(
      (coupon) => normalizeCouponCode(coupon.code) === normalizeCouponCode(bookingDetails.coupon.code)
    );

    const outcome = calculateCouponOutcome(matchedCoupon, {
      rentalTotal: liveRental.rentalTotal,
      totalDays: liveRental.days,
      customerType: bookingDetails.customerType,
      car: selectedCar,
      customerEmail: bookingDetails.email,
    });

    if (!outcome.valid) {
      upsertBookingCoupon(emptyAppliedCoupon());
      if (couponInput) {
        setCouponFeedback({ type: 'error', message: outcome.message });
      }
      return;
    }

    const currentDiscount = Number(bookingDetails.coupon.discountAmount || 0);
    if (
      currentDiscount !== outcome.summary.discountAmount ||
      Number(bookingDetails.coupon.originalRentalTotal || 0) !== outcome.summary.originalRentalTotal
    ) {
      upsertBookingCoupon(outcome.summary);
      setCouponFeedback({
        type: 'success',
        message: `${outcome.summary.code} applied successfully. You saved MYR ${outcome.summary.discountAmount}.`,
      });
    }
  }, [
    coupons,
    seasonalPricings,
    selectedCar,
    bookingDetails.startDate,
    bookingDetails.endDate,
    bookingDetails.customerType,
    bookingDetails.email,
    bookingDetails.coupon?.code,
  ]);

  useEffect(() => {
    if (sigCanvas.current && trackedBooking?.documents?.status === 'verified' && trackedBooking?.vcr?.status !== 'completed') {
       const canvas = sigCanvas.current;
       canvas.width = canvas.offsetWidth;
       canvas.height = canvas.offsetHeight;
       const ctx = canvas.getContext('2d');
       ctx.strokeStyle = '#0f172a';
       ctx.lineWidth = 3;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
    }
  }, [trackedBooking?.documents?.status, trackedBooking?.vcr?.status, currentView]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroPromoIndex(prev => (prev + 1) % HERO_PROMO_SLIDES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (currentView !== 'home') {
      setShowPromoPopup(false);
      return;
    }

    if (!activePromoPopup || typeof window === 'undefined') {
      setShowPromoPopup(false);
      return;
    }

    try {
      const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!isLocalPreview && promoPopupDismissKey && window.localStorage.getItem(promoPopupDismissKey) === 'dismissed') {
        setShowPromoPopup(false);
        return;
      }
    } catch (error) {
      console.error('Unable to read popup dismissal state:', error);
    }

    const timeoutId = window.setTimeout(() => {
      setShowPromoPopup(true);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [currentView, activePromoPopup?.docId, promoPopupDismissKey, fleetPricingMode]);

  useEffect(() => {
    if (!locationModal.open) return;

    const query = locationQuery.trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setLocationSearchError('');
      setLocationSearchLoading(false);
      return;
    }

    const requestId = latestLocationRequestIdRef.current + 1;
    latestLocationRequestIdRef.current = requestId;
    const timeoutId = setTimeout(async () => {
      try {
        setLocationSearchLoading(true);
        setLocationSearchError('');
        await loadGoogleMapsScript();

        if (!window.google?.maps?.places?.AutocompleteService) {
          throw new Error('Places Autocomplete service is unavailable.');
        }

        if (!locationSearchTokenRef.current) {
          locationSearchTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }

        const service = new window.google.maps.places.AutocompleteService();
        const suggestions = await new Promise((resolve, reject) => {
          service.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: 'my' },
              sessionToken: locationSearchTokenRef.current,
            },
            (predictions, status) => {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK ||
                status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                resolve(predictions || []);
                return;
              }
              reject(new Error('Location suggestions are unavailable right now.'));
            },
          );
        });

        if (latestLocationRequestIdRef.current !== requestId) return;
        setLocationSuggestions(suggestions || []);
      } catch (error) {
        console.error('Location search failed:', error);
        if (latestLocationRequestIdRef.current !== requestId) return;
        setLocationSuggestions([]);
        setLocationSearchError(
          GOOGLE_MAPS_API_KEY
            ? 'Location suggestions are unavailable right now.'
            : 'Google Maps API key is not configured yet.',
        );
      } finally {
        if (latestLocationRequestIdRef.current === requestId) {
          setLocationSearchLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [locationModal.open, locationQuery]);

  useEffect(() => {
    if (bookingDetails.returnAtDifferentLocation) return;
    if (!bookingDetails.pickupLocationMeta) return;

    setBookingDetails(prev => {
      if (prev.returnAtDifferentLocation) return prev;
      return {
        ...prev,
        returnLocation: prev.pickupLocation,
        returnLocationMeta: prev.pickupLocationMeta,
        returnFee: prev.pickupFee,
      };
    });
  }, [bookingDetails.returnAtDifferentLocation, bookingDetails.pickupLocation, bookingDetails.pickupLocationMeta, bookingDetails.pickupFee]);

  // --- HANDLERS ---
  const handleBookNow = (car) => {
    setSelectedCar(car);
    resetCouponState();
    setBookingDetails(prev => ({
      ...prev,
      name: '',
      email: '',
      phone: '',
      accountHolderName: '',
      bankName: '',
      bankAccount: '',
      totalDays: 0,
      extraHours: 0,
      extraHoursFee: 0,
      rentalSubtotal: 0,
      totalPrice: 0,
      appliedDailyRate: 0,
      discountTier: 'Normal',
      discountPercentage: 0,
      seasonalPricing: emptySeasonalPricing(),
      coupon: emptyAppliedCoupon(),
      deposit: 0,
      grandTotal: 0,
      customerType: fleetPricingMode,
      paymentMethod: fleetPricingMode === 'local' ? 'fpx' : 'card',
    }));
    setCurrentView('booking');
    window.scrollTo(0, 0);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    
    const isTourist = bookingDetails.customerType === 'international';
    const phoneValue = bookingDetails.phone.trim();
    const baseDailyPrice = isTourist ? selectedCar.priceTourist : selectedCar.priceLocal;
    const { adjustedBaseRate, seasonalPricing } = getSeasonalPricingOutcome(seasonalPricings, {
      car: selectedCar,
      customerType: bookingDetails.customerType,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      baseDailyRate,
    });
    
    const { days, extraHours, extraHoursFee, rentalTotal, totalHours, appliedDailyRate, discountTier, discountPercentage } = getRentalDurationAndCost(bookingDetails.startDate, bookingDetails.endDate, adjustedBaseRate);
    
    if (isTourist && !/^\+\d{7,15}$/.test(phoneValue.replace(/\s+/g, ''))) {
      showNotification('Please enter a valid WhatsApp number with country code.', 'error');
      return;
    }

    const now = new Date();
    const pickupDateTime = new Date(bookingDetails.startDate);
    const diffHours = (pickupDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      showNotification('Urgent bookings are not allowed. Please book at least 24 hours in advance.', 'error');
      return;
    }

    if (totalHours <= 0) {
      showNotification('Please select valid dates.', 'error');
      return;
    }

    if (totalHours < 48) {
      showNotification('Minimum rental period is 48 Hours (2 Days). We do not accept 1-day rentals.', 'error');
      return;
    }

    let appliedCoupon = emptyAppliedCoupon();
    if (couponInput || bookingDetails.coupon?.code) {
      const couponApplied = applyCouponCode(couponInput || bookingDetails.coupon?.code);
      if (!couponApplied) {
        return;
      }

      const matchedCoupon = coupons.find(
        (coupon) => normalizeCouponCode(coupon.code) === normalizeCouponCode(couponInput || bookingDetails.coupon?.code)
      );
      const couponOutcome = calculateCouponOutcome(matchedCoupon, {
        rentalTotal,
        totalDays: days,
        customerType: bookingDetails.customerType,
        car: selectedCar,
        customerEmail: bookingDetails.email,
      });

      if (!couponOutcome.valid) {
        setCouponFeedback({ type: 'error', message: couponOutcome.message });
        return;
      }

      appliedCoupon = couponOutcome.summary;
    }

    const pickupFee = bookingDetails.pickupLocationMeta?.fee ?? bookingDetails.pickupFee ?? 0;
    const returnFee = bookingDetails.returnLocationMeta?.fee ?? bookingDetails.returnFee ?? 0;
    
    const deposit = isTourist ? selectedCar.depositTourist : selectedCar.depositLocal;
    const finalRentalTotal = appliedCoupon.discountAmount > 0 ? appliedCoupon.finalRentalTotal : rentalTotal;
    const grandTotal = finalRentalTotal + pickupFee + returnFee + deposit;
    
    setBookingDetails({ 
      ...bookingDetails,
      pickupFee,
      returnFee,
      totalDays: days,
      extraHours,
      extraHoursFee,
      rentalSubtotal: rentalTotal,
      totalPrice: finalRentalTotal,
      appliedDailyRate,
      discountTier,
      discountPercentage,
      seasonalPricing,
      coupon: appliedCoupon,
      deposit,
      grandTotal
    });
    setCurrentView('payment');
    window.scrollTo(0, 0);
  };

  const handleFinalPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return showNotification('System is loading...', 'error');

    const isLocal = bookingDetails.customerType === 'local';
    setActiveGateway(isLocal ? 'ToyyibPay (FPX)' : 'Stripe Checkout');
    setPaymentProcessing(true); 

    const cleanPhone = bookingDetails.phone.replace(/\D/g, '');
    const customId = `AFW-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: customId,
      car: selectedCar,
      customer: { ...bookingDetails, phone: cleanPhone }, 
      date: new Date().toISOString(),
      status: 'Payment_Pending',
      payment: {
        status: 'pending',
        gateway: isLocal ? 'toyyibpay' : 'stripe',
        method: bookingDetails.paymentMethod,
        amount: bookingDetails.grandTotal,
        initiatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastResult: 'initiated',
        confirmedAt: null,
        failureReason: null,
      },
      supplier: { name: '-', cost: 0, type: 'pending' },
      profit: 0,
      documents: { ic: null, license: null, bill: null, status: 'pending' },
      vcr: { front: null, back: null, left: null, right: null, signature: null, status: 'pending' }, 
      returnVcr: { front: null, back: null, left: null, right: null, status: 'pending' } 
    };
    
    try {
      const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
      await addDoc(bookingsRef, newBooking);
      setCurrentBookingId(customId);
      
      try {
        const response = await fetch(BACKEND_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             orderID: customId,
             totalAmount: bookingDetails.grandTotal,
             custName: bookingDetails.name,
             custEmail: bookingDetails.email,
             custPhone: cleanPhone, 
             carName: selectedCar.name,
             gatewayType: isLocal ? 'toyyibpay' : 'stripe'
          })
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Gateway Raw Error:", responseText);
            throw new Error(`Server blocked request (Status: ${response.status}). Check Cloud Run Permissions.`);
        }

        if (!response.ok) throw new Error(data.message || `HTTP Error: ${response.status}`);

        if (data.success && data.paymentUrl) {
           setPaymentUrl(data.paymentUrl);
           setCurrentView('request-success');
           setPaymentProcessing(false);
           window.scrollTo(0, 0);
        } else {
           showNotification('Gateway Error: ' + (data.message || 'Please try again'), 'error');
           setPaymentProcessing(false);
        }
      } catch (fetchErr) {
        showNotification('System Error: ' + fetchErr.message, 'error');
        setPaymentProcessing(false);
      }

    } catch (err) {
      console.error("Database Error:", err);
      showNotification('Failed to connect to the database.', 'error');
      setPaymentProcessing(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!user) return;

    const normalizedCode = normalizeCouponCode(couponForm.code);
    if (!normalizedCode) {
      showNotification('Please enter a valid coupon code.', 'error');
      return;
    }

    const numericValue = Number(couponForm.value || 0);
    if (numericValue <= 0) {
      showNotification('Coupon value must be greater than 0.', 'error');
      return;
    }

    if (couponForm.type === 'percentage' && numericValue > 100) {
      showNotification('Percentage coupons cannot exceed 100%.', 'error');
      return;
    }

    if (couponForm.validFrom && couponForm.validUntil && couponForm.validFrom > couponForm.validUntil) {
      showNotification('Valid until date cannot be earlier than valid from date.', 'error');
      return;
    }

    const existingCoupon = coupons.find(
      (coupon) => normalizeCouponCode(coupon.code) === normalizedCode && coupon.docId !== editingCoupon?.docId
    );
    if (existingCoupon) {
      showNotification('This coupon code already exists.', 'error');
      return;
    }

    const couponDocId = editingCoupon?.docId || getCouponDocId(normalizedCode);
    const couponRef = doc(db, ...getCouponCollectionPath(appId), couponDocId);

    const payload = {
      code: normalizedCode,
      description: couponForm.description.trim(),
      type: couponForm.type,
      value: numericValue,
      active: couponForm.active,
      validFrom: couponForm.validFrom || '',
      validUntil: couponForm.validUntil || '',
      minimumRentalDays: Number(couponForm.minimumRentalDays || 0),
      minimumSpend: Number(couponForm.minimumSpend || 0),
      customerType: couponForm.customerType,
      applicableScope: couponForm.applicableScope,
      applicableCategory: couponForm.applicableScope === 'category' ? couponForm.applicableCategory : 'all',
      applicableCarId: couponForm.applicableScope === 'car' ? String(couponForm.applicableCarId) : 'all',
      usageLimit: Number(couponForm.usageLimit || 0),
      usedCount: Number(editingCoupon?.usedCount || 0),
      onePerCustomer: couponForm.onePerCustomer,
      firstBookingOnly: couponForm.firstBookingOnly,
      createdAt: editingCoupon?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(couponRef, payload, { merge: true });
      setCouponModalOpen(false);
      setEditingCoupon(null);
      setCouponForm(EMPTY_COUPON_FORM);
      showNotification(`Coupon ${normalizedCode} saved successfully.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Unable to save coupon right now.', 'error');
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    if (!user || !coupon?.docId) return;
    try {
      const couponRef = doc(db, ...getCouponCollectionPath(appId), coupon.docId);
      await updateDoc(couponRef, {
        active: !coupon.active,
        updatedAt: new Date().toISOString(),
      });
      showNotification(
        `${coupon.code} ${coupon.active ? 'disabled' : 'activated'} successfully.`,
        coupon.active ? 'info' : 'success'
      );
    } catch (error) {
      console.error(error);
      showNotification('Unable to update coupon status right now.', 'error');
    }
  };

  const openCreateSeasonalModal = () => {
    setEditingSeasonalPricing(null);
    setSeasonalForm(EMPTY_SEASONAL_FORM);
    setSeasonalModalOpen(true);
  };

  const openEditSeasonalModal = (season) => {
    setEditingSeasonalPricing(season);
    setSeasonalForm({
      name: season.name || '',
      note: season.note || '',
      active: season.active !== false,
      startDate: season.startDate || '',
      endDate: season.endDate || '',
      customerType: season.customerType || 'both',
      scope: season.scope || 'all',
      category: season.category || 'all',
      carId: season.carId || 'all',
      pricingMode: season.pricingMode || 'markup_percentage',
      value: season.value != null ? String(season.value) : '',
      priority: season.priority != null ? String(season.priority) : '100',
    });
    setSeasonalModalOpen(true);
  };

  const handleSaveSeasonalPricing = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!seasonalForm.name.trim()) {
      showNotification('Please enter a seasonal pricing name.', 'error');
      return;
    }

    if (!seasonalForm.startDate || !seasonalForm.endDate) {
      showNotification('Please choose the seasonal start and end dates.', 'error');
      return;
    }

    if (seasonalForm.startDate > seasonalForm.endDate) {
      showNotification('End date cannot be earlier than start date.', 'error');
      return;
    }

    const numericValue = Number(seasonalForm.value || 0);
    if (seasonalForm.value === '' || Number.isNaN(numericValue)) {
      showNotification('Please enter a valid seasonal pricing value.', 'error');
      return;
    }

    if (['markup_percentage', 'markdown_percentage'].includes(seasonalForm.pricingMode) && numericValue < 0) {
      showNotification('Percentage adjustments cannot be negative.', 'error');
      return;
    }

    const seasonDocId = editingSeasonalPricing?.docId || `${seasonalForm.startDate}_${seasonalForm.endDate}_${seasonalForm.name}`.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const seasonRef = doc(db, ...getSeasonalCollectionPath(appId), seasonDocId);

    const payload = {
      name: seasonalForm.name.trim(),
      note: seasonalForm.note.trim(),
      active: seasonalForm.active,
      startDate: seasonalForm.startDate,
      endDate: seasonalForm.endDate,
      customerType: seasonalForm.customerType,
      scope: seasonalForm.scope,
      category: seasonalForm.scope === 'category' ? seasonalForm.category : 'all',
      carId: seasonalForm.scope === 'car' ? String(seasonalForm.carId) : 'all',
      pricingMode: seasonalForm.pricingMode,
      value: numericValue,
      priority: Number(seasonalForm.priority || 0),
      createdAt: editingSeasonalPricing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(seasonRef, payload, { merge: true });
      setSeasonalModalOpen(false);
      setEditingSeasonalPricing(null);
      setSeasonalForm(EMPTY_SEASONAL_FORM);
      showNotification(`Seasonal pricing ${editingSeasonalPricing ? 'updated' : 'created'} successfully.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Unable to save seasonal pricing right now.', 'error');
    }
  };

  const handleToggleSeasonalStatus = async (season) => {
    if (!user || !season?.docId) return;
    try {
      const seasonRef = doc(db, ...getSeasonalCollectionPath(appId), season.docId);
      await updateDoc(seasonRef, {
        active: !season.active,
        updatedAt: new Date().toISOString(),
      });
      showNotification(`Seasonal pricing ${season.active ? 'disabled' : 'activated'}.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Unable to update seasonal pricing status.', 'error');
    }
  };

  const handleConfirmSupplier = async (e) => {
    e.preventDefault();
    if (!user || !managingBooking) return;

    let finalCost = 0;
    let finalSupplierName = 'Afwaja (Own Fleet)';
    let finalSupplierPhone = '';
    const totalRevenue = managingBooking.customer.totalPrice + managingBooking.customer.pickupFee + managingBooking.customer.returnFee;
    let finalProfit = totalRevenue; 

    if (fulfillmentType === 'supplier') {
      finalCost = parseFloat(supplierDetails.cost);
      finalSupplierName = supplierDetails.name;
      finalSupplierPhone = supplierDetails.phone;
      finalProfit = totalRevenue - finalCost;
    }

    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', managingBooking.docId);
      await updateDoc(bookingRef, {
        status: 'Completed', 
        supplier: { name: finalSupplierName, cost: finalCost, phone: finalSupplierPhone, type: fulfillmentType },
        profit: finalProfit
      });
      setManagingBooking(null);
      setSupplierDetails({ name: '', cost: '', phone: '' });
      showNotification('Vehicle assigned successfully!');
    } catch(err) { console.error(err); }
  };

  const handleRejectBooking = async (bookingToReject) => {
    if (!user || !bookingToReject) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingToReject.docId);
      await updateDoc(bookingRef, { status: 'Cancelled' });
      setManagingBooking(null);
      showNotification(`Booking rejected. Full refund can now be processed from Booking & Action Logs.`, 'error');
    } catch (err) { console.error(err); }
  };

  const handleFullRefund = async (bookingToRefund) => {
    if (!user || !bookingToRefund) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingToRefund.docId);
      await updateDoc(bookingRef, { status: 'Refunded' });
      showNotification('Full refund recorded successfully.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error while processing full refund.', 'error');
    }
  };

  const handleApproveReturnAndRefund = async (bookingToReturn) => {
    if (!user || !bookingToReturn) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingToReturn.docId);
      await updateDoc(bookingRef, { status: 'Returned' });
      setViewingReturnVcr(null); 
      showNotification('Inspection passed! Deposit refunded.', 'success');
    } catch (err) { console.error(err); showNotification('Error during update.', 'error'); }
  };

  const handleVerifyKyc = async (bookingId, status) => {
     try {
       const booking = bookings.find(b => b.id === bookingId);
       const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', booking.docId);
       await updateDoc(bookingRef, { 'documents.status': status });
       setVerifyingKyc(null);
       showNotification(`KYC Documents ${status === 'verified' ? 'Verified' : 'Rejected'}.`, status === 'verified' ? 'success' : 'error');
     } catch (err) { console.error(err); }
  };

  const handleViewSupplierVoucher = (bookingId) => {
    setCurrentBookingId(bookingId);
    setCurrentView('supplier-voucher');
    window.scrollTo(0,0);
  };

  const handleCopyBroadcast = (booking) => {
    const msg = [
      'AFWAJA CAR RENTAL-JOB CONFIRMED',
      `ID: ${booking.id}`,
      `Car Model: ${booking.car.name}`,
      `Pickup: ${formatDateTime(booking.customer.startDate)}, ${booking.customer.pickupLocation}`,
      `Return: ${formatDateTime(booking.customer.endDate)}, ${booking.customer.returnLocation}`,
      'Please PM with pictures & total price if available',
      'Thank you',
    ].join('\n');
    navigator.clipboard.writeText(msg);
    showNotification('Message copied to clipboard!', 'info');
  };

  const handleAdminLogin = async () => {
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'admin');
      const configSnap = await getDoc(configRef);
      const validPin = configSnap.exists() ? configSnap.data().pin : '888888';

      if (adminPin === validPin) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPin('');
        setCurrentView('admin');
        showNotification('Welcome back, Admin!', 'success');
      } else {
        showNotification('Invalid PIN!', 'error');
        setAdminPin('');
      }
    } catch (error) {
      console.error(error);
      showNotification('Error checking PIN.', 'error');
    }
  };

  const handleDismissPromoPopup = () => {
    if (typeof window !== 'undefined' && promoPopupDismissKey) {
      try {
        window.localStorage.setItem(promoPopupDismissKey, 'dismissed');
      } catch (error) {
        console.error('Unable to persist popup dismissal state:', error);
      }
    }
    setShowPromoPopup(false);
  };

  const handlePromoPopupPrimaryAction = async () => {
    if (!activePromoPopup) return;

    if (activePromoPopup.ctaAction === 'scroll_fleet') {
      const fleetSection = document.getElementById('fleet');
      if (fleetSection) {
        fleetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      handleDismissPromoPopup();
      return;
    }

    if (activePromoPopup.ctaAction === 'copy_coupon' && activePromoPopup.couponCode) {
      try {
        await navigator.clipboard.writeText(activePromoPopup.couponCode);
        showNotification(`Coupon code ${activePromoPopup.couponCode} copied. Use it at checkout.`, 'success');
      } catch (error) {
        console.error(error);
        showNotification(`Your promo code is ${activePromoPopup.couponCode}.`, 'info');
      }
      handleDismissPromoPopup();
      return;
    }

    handleDismissPromoPopup();
  };

  const openCreatePromoPopupModal = () => {
    setEditingPromoPopup(null);
    setPromoPopupForm(EMPTY_PROMO_POPUP_FORM);
    setPromoPopupModalOpen(true);
  };

  const openEditPromoPopupModal = (popup) => {
    setEditingPromoPopup(popup);
    setPromoPopupForm({
      badge: popup.badge || '',
      title: popup.title || '',
      subtitle: popup.subtitle || '',
      urgencyText: popup.urgencyText || '',
      couponCode: popup.couponCode || '',
      ctaLabel: popup.ctaLabel || '',
      ctaAction: popup.ctaAction || 'copy_coupon',
      active: popup.active !== false,
      startDate: popup.startDate || '',
      endDate: popup.endDate || '',
      audience: popup.audience || 'all',
      theme: popup.theme || 'ocean',
      priority: popup.priority != null ? String(popup.priority) : '100',
      dismissible: popup.dismissible !== false,
    });
    setPromoPopupModalOpen(true);
  };

  const handleSavePromoPopup = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!promoPopupForm.title.trim()) {
      showNotification('Please enter a popup title.', 'error');
      return;
    }

    if (!promoPopupForm.ctaLabel.trim()) {
      showNotification('Please enter a CTA label.', 'error');
      return;
    }

    if (promoPopupForm.ctaAction === 'copy_coupon' && !promoPopupForm.couponCode.trim()) {
      showNotification('Please link a coupon code for the copy coupon action.', 'error');
      return;
    }

    if (promoPopupForm.couponCode && !coupons.some((coupon) => normalizeCouponCode(coupon.code) === normalizeCouponCode(promoPopupForm.couponCode))) {
      showNotification('The selected coupon code does not exist yet.', 'error');
      return;
    }

    const payload = {
      badge: promoPopupForm.badge.trim(),
      title: promoPopupForm.title.trim(),
      subtitle: promoPopupForm.subtitle.trim(),
      urgencyText: promoPopupForm.urgencyText.trim(),
      couponCode: normalizeCouponCode(promoPopupForm.couponCode),
      ctaLabel: promoPopupForm.ctaLabel.trim(),
      ctaAction: promoPopupForm.ctaAction,
      active: promoPopupForm.active,
      startDate: promoPopupForm.startDate || '',
      endDate: promoPopupForm.endDate || '',
      audience: promoPopupForm.audience,
      theme: promoPopupForm.theme,
      priority: Number(promoPopupForm.priority || 0),
      dismissible: promoPopupForm.dismissible,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingPromoPopup?.docId) {
        const popupRef = doc(db, ...getPromoPopupCollectionPath(appId), editingPromoPopup.docId);
        await setDoc(popupRef, payload, { merge: true });
      } else {
        await addDoc(collection(db, ...getPromoPopupCollectionPath(appId)), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      setPromoPopupModalOpen(false);
      setEditingPromoPopup(null);
      setPromoPopupForm(EMPTY_PROMO_POPUP_FORM);
      showNotification(`Promo popup ${editingPromoPopup ? 'updated' : 'created'} successfully.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Unable to save promo popup right now.', 'error');
    }
  };

  const handleTogglePromoPopupStatus = async (popup) => {
    if (!user || !popup?.docId) return;
    try {
      const popupRef = doc(db, ...getPromoPopupCollectionPath(appId), popup.docId);
      await updateDoc(popupRef, {
        active: !popup.active,
        updatedAt: new Date().toISOString(),
      });
      showNotification(`Promo popup ${popup.active ? 'disabled' : 'activated'}.`, 'success');
    } catch (error) {
      console.error(error);
      showNotification('Unable to update promo popup status.', 'error');
    }
  };

  const handleInjectDummyData = async () => {
    if (!user) return;
    const pendingId = `AFW-PENDING-${Math.floor(1000 + Math.random() * 9000)}`;
    const refundedId = `AFW-REFUNDED-${Math.floor(1000 + Math.random() * 9000)}`;
    const placeholderVcr = "https://via.placeholder.com/400x300.png?text=VCR+Photo";
    const placeholderDoc = "https://via.placeholder.com/400x300.png?text=KYC+Document";

    const baseCustomer = {
      email: 'dummy@test.com',
      phone: '0123456789',
      startDate: new Date(Date.now() - 86400000 * 2).toISOString(), 
      endDate: new Date(Date.now() - 3600000).toISOString(), 
      pickupLocation: 'HQ (Cyberjaya)',
      returnLocation: 'HQ (Cyberjaya)',
      destination: 'Kuala Lumpur',
      pickupFee: 0,
      returnFee: 0,
      totalDays: 2,
      extraHours: 0,
      extraHoursFee: 0,
      totalPrice: 270,
      appliedDailyRate: 135,
      discountTier: 'Normal',
      discountPercentage: 0,
      deposit: 100,
      grandTotal: 370,
      customerType: 'local',
      paymentMethod: 'fpx'
    };

    const dummyPending = {
      id: pendingId,
      car: INITIAL_CARS[0], 
      customer: { ...baseCustomer, name: 'Ahmad (Test Return)' },
      date: new Date(Date.now() - 86400000 * 3).toISOString(), 
      status: 'Return_Pending', 
      supplier: { name: 'Afwaja (Own Fleet)', cost: 0, type: 'self' },
      profit: 270,
      documents: { ic: placeholderDoc, license: placeholderDoc, bill: placeholderDoc, status: 'verified' },
      vcr: { front: placeholderVcr, back: placeholderVcr, left: placeholderVcr, right: placeholderVcr, odometer: placeholderVcr, signature: placeholderVcr, status: 'completed' },
      returnVcr: { front: placeholderVcr, back: placeholderVcr, left: placeholderVcr, right: placeholderVcr, odometer: placeholderVcr, status: 'submitted' }
    };

    const dummyRefunded = {
      id: refundedId,
      car: INITIAL_CARS[2], 
      customer: { ...baseCustomer, name: 'Siti (Test Refunded)', deposit: 100, grandTotal: 420, totalPrice: 320, appliedDailyRate: 160 },
      date: new Date(Date.now() - 86400000 * 4).toISOString(), 
      status: 'Returned', 
      supplier: { name: 'Afwaja (Own Fleet)', cost: 0, type: 'self' },
      profit: 320,
      documents: { ic: placeholderDoc, license: placeholderDoc, bill: placeholderDoc, status: 'verified' },
      vcr: { front: placeholderVcr, back: placeholderVcr, left: placeholderVcr, right: placeholderVcr, odometer: placeholderVcr, signature: placeholderVcr, status: 'completed' },
      returnVcr: { front: placeholderVcr, back: placeholderVcr, left: placeholderVcr, right: placeholderVcr, odometer: placeholderVcr, status: 'submitted' }
    };

    try {
      const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bookings');
      await addDoc(bookingsRef, dummyPending);
      await addDoc(bookingsRef, dummyRefunded);
      showNotification('Dummy data injected successfully!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to inject dummy data', 'error');
    }
  };

  const handleKycFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    showNotification(`Processing watermark for ${type}...`, 'info');
    const watermarkedBase64 = await processImageWithWatermark(file);
    if (watermarkedBase64) {
      setUploadedDocs(prev => ({ ...prev, [type]: watermarkedBase64 }));
    } else {
      showNotification('Failed to process file.', 'error');
    }
    e.target.value = null; 
  };

  const submitKycDocs = async () => {
    if (!trackedBooking) return;
    if (!uploadedDocs.ic || !uploadedDocs.license || !uploadedDocs.bill) {
      return showNotification('Please upload all 3 mandatory documents.', 'error');
    }
    setKycUploading(true);
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      await updateDoc(bookingRef, {
        'documents.ic': uploadedDocs.ic,
        'documents.license': uploadedDocs.license,
        'documents.bill': uploadedDocs.bill,
        'documents.status': 'submitted'
      });
      showNotification('Documents submitted for Admin review.', 'success');
    } catch (err) { 
      console.error("KYC Upload Error:", err);
      showNotification('An error occurred during upload.', 'error'); 
    }
    setKycUploading(false);
  };

  const handleVcrFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !trackedBooking) return;
    showNotification(`Processing and uploading ${type} view...`, 'info');
    const uploadedUrl = await uploadBinaryToStorage(file, `vcr/${trackedBooking.id}/draft-initial/${type}.jpg`, file.type || 'image/jpeg');
    if (uploadedUrl) {
      setVcrDocs(prev => ({ ...prev, [type]: uploadedUrl }));
      showNotification(`${type} view uploaded successfully.`, 'success');
    } else {
      showNotification('Failed to upload file.', 'error');
    }
    e.target.value = null; 
  };

  const startDrawing = (nativeEvent) => {
    if (!sigCanvas.current) return;
    const canvas = sigCanvas.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = nativeEvent.clientX;
    let clientY = nativeEvent.clientY;
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (nativeEvent) => {
    if (!isDrawing || !sigCanvas.current) return;
    const canvas = sigCanvas.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = nativeEvent.clientX;
    let clientY = nativeEvent.clientY;
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  
  const clearSignature = () => {
    const canvas = sigCanvas.current;
    if(canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleReturnVcrFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !trackedBooking) return;
    showNotification(`Processing and uploading return ${type} view...`, 'info');
    const uploadedUrl = await uploadBinaryToStorage(file, `vcr/${trackedBooking.id}/draft-return/${type}.jpg`, file.type || 'image/jpeg');
    if (uploadedUrl) {
      setReturnVcrDocs(prev => ({ ...prev, [type]: uploadedUrl }));
      showNotification(`Return ${type} view uploaded successfully.`, 'success');
    } else {
      showNotification('Failed to upload file.', 'error');
    }
    e.target.value = null; 
  };

  const submitReturnVcr = async () => {
    if (!trackedBooking) return;
    if (!returnVcrDocs.front || !returnVcrDocs.back || !returnVcrDocs.left || !returnVcrDocs.right || !returnVcrDocs.odometer) {
      return showNotification('Please upload all 5 required vehicle photos for return validation.', 'error');
    }
    setReturnVcrUploading(true);
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      await updateDoc(bookingRef, {
        'returnVcr.front': returnVcrDocs.front,
        'returnVcr.back': returnVcrDocs.back,
        'returnVcr.left': returnVcrDocs.left,
        'returnVcr.right': returnVcrDocs.right,
        'returnVcr.odometer': returnVcrDocs.odometer,
        'returnVcr.status': 'submitted',
        status: 'Return_Pending' 
      });
      setReturnVcrDocs(EMPTY_VCR_DOCS);
      showNotification('Return VCR Submitted Successfully!', 'success');
    } catch (err) {
      console.error("Return VCR Upload Error:", err);
      showNotification('Error saving return report.', 'error');
    }
    setReturnVcrUploading(false);
  };

  const submitVcr = async () => {
    if (!trackedBooking) return;
    if (!vcrDocs.front || !vcrDocs.back || !vcrDocs.left || !vcrDocs.right || !vcrDocs.odometer) {
      return showNotification('Please upload all 5 required vehicle photos.', 'error');
    }
    setVcrUploading(true);
    try {
      const canvas = sigCanvas.current;
      const signatureBlob = canvas
        ? await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
        : null;

      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      const signatureUrl = await uploadBinaryToStorage(signatureBlob, `vcr/${trackedBooking.id}/initial/signature.png`, 'image/png');

      await updateDoc(bookingRef, {
        'vcr.front': vcrDocs.front,
        'vcr.back': vcrDocs.back,
        'vcr.left': vcrDocs.left,
        'vcr.right': vcrDocs.right,
        'vcr.odometer': vcrDocs.odometer,
        'vcr.signature': signatureUrl,
        'vcr.status': 'completed',
        'agreement.status': 'pending_generation',
        status: 'Active' 
      });
      setVcrDocs(EMPTY_VCR_DOCS);
      clearSignature();
      showNotification('VCR recorded successfully. Your agreement copy will be emailed shortly.', 'success');
    } catch (err) {
      console.error("VCR Upload Error:", err);
      showNotification('Error saving VCR.', 'error');
    }
    setVcrUploading(false);
  };

  // ==========================================
  // VIEW RENDERERS (KOMPONEN UI)
  // ==========================================
  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center cursor-pointer" onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }}>
            <img src="https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2KFY3QZ342VQBTS02D1K8E.png" alt="Afwaja Logo" className="h-14 sm:h-16 w-auto object-contain transform scale-125 origin-left ml-2" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}/>
            <div style={{display: 'none'}} className="items-center gap-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center pulse-glow">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="brand text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">Afwaja Rental</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 font-dm">
            <button onClick={() => setCurrentView('home')} className={`nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors ${currentView === 'home' ? 'active' : ''}`}>Home</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'}), 100); }} className="nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors">About Us</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('how-to-book')?.scrollIntoView({behavior: 'smooth'}), 100); }} className="nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors">How to Book</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('fleet')?.scrollIntoView({behavior: 'smooth'}), 100); }} className="nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors">Our Fleet</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('testimonials')?.scrollIntoView({behavior: 'smooth'}), 100); }} className="nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors">Testimonials</button>
            <button onClick={() => setCurrentView('track')} className={`nav-link text-slate-700 hover:text-cyan-600 font-medium transition-colors flex items-center gap-1 ${currentView === 'track' ? 'active' : ''}`}>
              <SearchCode size={18}/> Track Booking
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => {
                if (isAdmin) {
                  setIsAdmin(false);
                  setCurrentView('home');
                } else {
                  setShowAdminLogin(true);
                }
                setIsMobileMenuOpen(false);
              }} 
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-cyan-700 transition-colors shadow-md"
            >
              {isAdmin ? <><LogOut size={16} className="sm:mr-2"/><span className="hidden sm:inline">Exit Admin</span></> : <><ShieldCheck size={16} className="sm:mr-2"/><span className="hidden sm:inline">Admin</span></>}
            </button>
            
            <button className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl animate-fadeIn">
          <div className="flex flex-col px-4 py-6 space-y-4 font-dm">
            <button onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-700 hover:text-cyan-600 text-lg">Home</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'}), 100); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-700 hover:text-cyan-600 text-lg">About Us</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('how-to-book')?.scrollIntoView({behavior: 'smooth'}), 100); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-700 hover:text-cyan-600 text-lg">How to Book</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('fleet')?.scrollIntoView({behavior: 'smooth'}), 100); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-700 hover:text-cyan-600 text-lg">Our Fleet</button>
            <button onClick={() => { setCurrentView('home'); setTimeout(() => document.getElementById('testimonials')?.scrollIntoView({behavior: 'smooth'}), 100); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-700 hover:text-cyan-600 text-lg">Testimonials</button>
            <div className="h-px bg-slate-200 my-2"></div>
            <button onClick={() => { setCurrentView('track'); setIsMobileMenuOpen(false); }} className="flex items-center text-left font-bold text-cyan-600 text-lg">
              <SearchCode size={20} className="mr-2"/> Track Booking
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  const HomeView = () => {
    const filteredCars = filter === 'all' ? cars : cars.filter(c => c.category === filter);
    const pickupDateValue = getDatePart(bookingDetails.startDate);
    const pickupTimeValue = getTimePart(bookingDetails.startDate);
    const returnDateValue = getDatePart(bookingDetails.endDate);
    const returnTimeValue = getTimePart(bookingDetails.endDate);

    return (
      <div className="animate-fadeIn font-dm pt-20 sm:pt-24">
        <section className="relative overflow-hidden px-4 pt-8 pb-16 sm:pt-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_34%),radial-gradient(circle_at_85%_15%,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(135deg,_#06111d_0%,_#0b1c2f_42%,_#12344d_100%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(8,47,73,0.18)_100%)]"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="min-h-[78vh] flex items-center justify-center">
              <div className="w-full max-w-4xl rounded-[32px] border border-cyan-300/15 bg-slate-950/45 backdrop-blur-xl shadow-2xl shadow-sky-950/35 p-6 sm:p-8 lg:p-10">
                <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-300/20 rounded-full px-4 py-2 mb-5">
                  <span className="w-2 h-2 bg-sky-300 rounded-full animate-pulse"></span>
                  <span className="text-cyan-100 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase">Book With Confidence</span>
                </div>
                <h1 className="brand text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
                  Premium Car Rental,
                  <span className="block text-sky-300">Delivered to You.</span>
                </h1>
                <p className="text-slate-200/80 mb-6 leading-relaxed max-w-2xl">
                  Experience a hassle-free car rental process. Plan your journey with ease.
                </p>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFleetPricingMode('local');
                        setBookingDetails(prev => ({
                          ...prev,
                          customerType: 'local',
                          paymentMethod: 'fpx',
                        }));
                      }}
                      className={`rounded-2xl border-2 px-5 py-4 font-bold text-sm sm:text-base transition-all ${
                        fleetPricingMode === 'local'
                          ? 'border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 text-cyan-900 shadow-lg shadow-sky-500/10'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Malaysian Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFleetPricingMode('international');
                        setBookingDetails(prev => ({
                          ...prev,
                          customerType: 'international',
                          paymentMethod: 'card',
                        }));
                      }}
                      className={`rounded-2xl border-2 px-5 py-4 font-bold text-sm sm:text-base transition-all ${
                        fleetPricingMode === 'international'
                          ? 'border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 text-cyan-900 shadow-lg shadow-sky-500/10'
                          : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      International Tourist
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openLocationPicker('pickup')}
                    className="w-full bg-white text-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 shadow-lg shadow-black/10 hover:-translate-y-0.5 transition"
                  >
                    <span className="flex items-center gap-3 text-left">
                      <MapPin className="text-cyan-600 flex-shrink-0" size={20} />
                      <span className="font-medium">
                        {bookingDetails.pickupLocation || 'Select pickup location'}
                      </span>
                    </span>
                    <Search size={18} className="text-slate-500 flex-shrink-0" />
                  </button>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200 font-bold mb-3">Pickup</p>
                      <div className="grid sm:grid-cols-[1.3fr_0.9fr] gap-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => pickupDateInputRef.current?.showPicker?.()}
                            className="w-full bg-white text-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 shadow-lg shadow-black/10 text-left"
                          >
                            <span className="flex items-center gap-3">
                              <Calendar className="text-cyan-600 flex-shrink-0" size={20} />
                              <span className="font-medium">{formatDateForInputDisplay(pickupDateValue)}</span>
                            </span>
                          </button>
                          <input
                            ref={pickupDateInputRef}
                            type="date"
                            value={pickupDateValue}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => updateHomepageDateTime('startDate', 'date', e.target.value, false)}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                            tabIndex={-1}
                          />
                        </div>
                        <label className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg shadow-black/10">
                          <Clock className="text-cyan-600 flex-shrink-0" size={20} />
                          <select
                            value={pickupTimeValue}
                            onChange={(e) => updateHomepageDateTime('startDate', 'time', e.target.value, false)}
                            className="w-full bg-transparent outline-none text-slate-900 font-medium"
                          >
                            <option value="">Select time</option>
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200 font-bold mb-3">Return</p>
                      <div className="grid sm:grid-cols-[1.3fr_0.9fr] gap-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => returnDateInputRef.current?.showPicker?.()}
                            className="w-full bg-white text-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 shadow-lg shadow-black/10 text-left"
                          >
                            <span className="flex items-center gap-3">
                              <Calendar className="text-cyan-600 flex-shrink-0" size={20} />
                              <span className="font-medium">{formatDateForInputDisplay(returnDateValue)}</span>
                            </span>
                          </button>
                          <input
                            ref={returnDateInputRef}
                            type="date"
                            value={returnDateValue}
                            min={pickupDateValue || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => updateHomepageDateTime('endDate', 'date', e.target.value, false)}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                            tabIndex={-1}
                          />
                        </div>
                        <label className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg shadow-black/10">
                          <Clock className="text-cyan-600 flex-shrink-0" size={20} />
                          <select
                            value={returnTimeValue}
                            onChange={(e) => updateHomepageDateTime('endDate', 'time', e.target.value, false)}
                            className="w-full bg-transparent outline-none text-slate-900 font-medium"
                          >
                            <option value="">Select time</option>
                            {TIME_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-white/85 font-medium">
                    <input
                      type="checkbox"
                      checked={bookingDetails.returnAtDifferentLocation}
                      onChange={(e) =>
                        setBookingDetails(prev => ({
                          ...prev,
                          returnAtDifferentLocation: e.target.checked,
                          ...(e.target.checked
                            ? {}
                            : {
                                returnLocation: prev.pickupLocation,
                                returnLocationMeta: prev.pickupLocationMeta,
                                returnFee: prev.pickupFee,
                              }),
                        }))
                      }
                      className="w-4 h-4 rounded border-white/30 bg-transparent text-cyan-500 focus:ring-cyan-400"
                    />
                    Return car at a different location
                  </label>

                  {bookingDetails.returnAtDifferentLocation ? (
                    <button
                      type="button"
                      onClick={() => openLocationPicker('return')}
                      className="w-full bg-white text-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 shadow-lg shadow-black/10 hover:-translate-y-0.5 transition"
                    >
                      <span className="flex items-center gap-3 text-left">
                        <MapPin className="text-cyan-600 flex-shrink-0" size={20} />
                        <span className="font-medium">
                          {bookingDetails.returnLocation || 'Select return location'}
                        </span>
                      </span>
                      <Search size={18} className="text-slate-500 flex-shrink-0" />
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/85">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 mb-1 font-bold">Return Location</p>
                      <p className="font-medium">{bookingDetails.returnLocation || bookingDetails.pickupLocation || 'Same as pickup location'}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white">
                    <div className="flex items-center justify-between text-sm">
                      <span>Pickup fee</span>
                      <span className="font-bold">MYR {bookingDetails.pickupLocationMeta?.fee ?? bookingDetails.pickupFee ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span>Return fee</span>
                      <span className="font-bold">MYR {bookingDetails.returnLocationMeta?.fee ?? bookingDetails.returnFee ?? 0}</span>
                    </div>
                    <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between">
                      <span className="text-cyan-200 font-bold">Estimated logistics total</span>
                      <span className="brand text-2xl text-white font-bold">
                        MYR {(bookingDetails.pickupLocationMeta?.fee ?? bookingDetails.pickupFee ?? 0) + (bookingDetails.returnLocationMeta?.fee ?? bookingDetails.returnFee ?? 0)}
                      </span>
                    </div>
                    {bookingDetails.pickupLocationMeta && (
                      <p className="text-xs text-white/65 mt-2">
                        Pickup: {bookingDetails.pickupLocationMeta.distanceLabel}
                        {bookingDetails.returnLocationMeta ? ` - Return: ${bookingDetails.returnLocationMeta.distanceLabel}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50">
                    <p className="font-bold uppercase tracking-[0.18em] text-cyan-200 mb-2">Booking Rules</p>
                    <ul className="space-y-1.5">
                      <li>No urgent booking.</li>
                      <li>Minimum rental period is 48 hours.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleHomepageSearch}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white py-4 font-bold text-lg shadow-xl shadow-cyan-500/30 transition"
                  >
                    Search Available Cars
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 px-4 -mt-8 sm:-mt-10 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${heroPromoIndex * 100}%)` }}
              >
                {HERO_PROMO_SLIDES.map((slide) => (
                  <div key={slide.tag} className="min-w-full px-1 sm:px-2">
                    <div className="rounded-[26px] border border-cyan-100 bg-white p-5 sm:p-7 shadow-[0_20px_60px_rgba(14,116,144,0.14)]">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-cyan-600 font-bold mb-2">
                            {slide.tag}
                          </p>
                          <h3 className="brand text-xl sm:text-3xl font-bold text-slate-900 leading-tight">
                            {slide.title}
                          </h3>
                        </div>
                        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white px-3 py-2.5 sm:px-4 sm:py-3 text-right shadow-lg shadow-cyan-200">
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-cyan-100 font-bold mb-1">
                            Discount
                          </p>
                          <p className="brand text-xl sm:text-2xl font-bold leading-none">{slide.highlight}</p>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {slide.description}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4">
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-sky-700 font-bold mb-1">
                            How it works
                          </p>
                          <p className="text-sm text-slate-700">
                            Set your dates in the hero form and we will calculate the best tier automatically.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4">
                          <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-cyan-700 font-bold mb-1">
                            Good to know
                          </p>
                          <p className="text-sm text-slate-700">
                            Minimum booking remains 48 hours, and discounts stack into the live rental total instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {HERO_PROMO_SLIDES.map((slide, index) => (
                <button
                  key={slide.tag}
                  type="button"
                  onClick={() => setHeroPromoIndex(index)}
                  aria-label={`Show ${slide.tag}`}
                  className={`h-2.5 rounded-full transition-all ${
                    heroPromoIndex === index ? 'w-9 bg-cyan-500' : 'w-2.5 bg-cyan-200 hover:bg-cyan-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <img src="https://platform-bcl.bsb-cdn.com/media/2026/04/01KNYN7W4E9NRN01Q1T27DJDFZ.png" alt="Proton S70 - About Us" className="rounded-3xl shadow-2xl object-cover h-96 w-full" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span className="text-teal-700 text-sm font-bold tracking-wide">About Afwaja Rental</span>
                </div>
                <h2 className="brand text-3xl sm:text-4xl font-bold mb-6 text-slate-900">Redefining Mobility: Your Premier Car Rental Partner</h2>
                <div className="text-slate-600 text-lg mb-8 space-y-4 leading-relaxed">
                  <p>
                    Afwaja Car Rental was established with a singular commitment: to deliver a seamless, transparent, and premium transportation experience for both corporate clients and leisure travelers. We bridge the gap between affordability and reliability, ensuring every journey begins with absolute peace of mind.
                  </p>
                  <p>
                    Operating from our strategic hub in Cyberjaya, we leverage a dynamic fleet management system, combining our proprietary vehicles with an extensive network of verified strategic partners. This unique hybrid model guarantees unparalleled vehicle availability, flexible delivery options, and highly competitive pricing without any hidden fees.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><ShieldCheck className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">Impeccable Quality</h4><p className="text-sm text-slate-500">Meticulously maintained and sanitized fleet.</p></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><CreditCard className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">Transparent Pricing</h4><p className="text-sm text-slate-500">Zero hidden fees with automated deposit refunds.</p></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><Sparkles className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">Digital-First Approach</h4><p className="text-sm text-slate-500">Seamless online booking & automated e-KYC.</p></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><Clock className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">24/7 Dedicated Support</h4><p className="text-sm text-slate-500">Round-the-clock roadside assistance.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-to-book" className="py-24 px-4 bg-slate-50/80 border-y border-slate-200/60 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span className="text-cyan-700 text-sm font-bold tracking-wide">Simple Process</span>
              </div>
              <h2 className="brand text-3xl sm:text-4xl font-bold mb-4 text-slate-900">How It Works</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">A seamless, fully digital 4-step booking experience designed for your convenience and security.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[10%] w-[80%] h-1 bg-gradient-to-r from-cyan-100 via-teal-200 to-cyan-100 -translate-y-1/2 z-0"></div>

              {[
                { step: '01', title: 'Plan Your Trip', desc: 'Select your booking type, set pickup and return details, choose your location, and review the automatic delivery fee before browsing available cars.', icon: Car },
                { step: '02', title: 'Secure Payment', desc: 'Fill your details and pay the rental fee + refundable deposit securely via FPX or Card.', icon: CreditCard },
                { step: '03', title: 'Digital Verification', desc: 'Upload your ID securely (KYC) and sign the E-Agreement directly from your phone.', icon: ShieldCheck },
                { step: '04', title: 'Drive & Return', desc: 'Perform your VCR inspection, enjoy the ride, and get an automated deposit refund!', icon: Award }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-cyan-100 mb-6 group-hover:-translate-y-2 group-hover:border-cyan-400 transition-all duration-300 relative">
                    <div className="absolute -top-3 -right-3 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border border-slate-700">
                      {item.step}
                    </div>
                    <item.icon className="w-10 h-10 text-cyan-600 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed px-2">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
               <button onClick={() => document.getElementById('fleet').scrollIntoView({behavior: 'smooth'})} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg inline-flex items-center gap-2">
                 Ready? Browse Fleet <ChevronRight size={18} />
               </button>
            </div>
          </div>
        </section>

        <section id="fleet" className="py-20 px-4 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="brand text-3xl sm:text-4xl font-bold mb-6 text-slate-900">Popular Vehicles</h2>
              
              <p className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2 text-sm font-bold text-cyan-800 mb-6">
                Showing {fleetPricingMode === 'local' ? 'Malaysian Citizen' : 'International Tourist'} pricing
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[{ id: 'all', label: 'All Models' }, { id: 'Compact', label: 'Compact' }, { id: 'Sedan', label: 'Sedan' }, { id: 'SUV', label: 'SUV' }, { id: 'MPV', label: 'MPV' }].map(cat => (
                <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-6 py-2.5 rounded-full font-bold transition-all ${filter === cat.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'glass-card text-slate-700 hover:bg-white/80 border border-slate-200'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map(car => {
                const regularDailyRate = fleetPricingMode === 'local' ? car.priceLocal : car.priceTourist;
                const seasonalOutcome = getSeasonalPricingOutcome(seasonalPricings, {
                  car,
                  customerType: fleetPricingMode,
                  startDate: bookingDetails.startDate,
                  endDate: bookingDetails.endDate,
                  baseDailyRate: regularDailyRate,
                });
                const displayDailyRate = seasonalOutcome.adjustedBaseRate || regularDailyRate;
                const hasSeasonalRate = Boolean(seasonalOutcome.seasonalPricing.seasonalDocId);
                // LOGIK ZOOM KHAS: Kereta yang ada banyak padding lutsinar kita zoom lebih sikit
                const isSmallImage = [2, 20, 23].includes(car.id); // 2: Axia Old, 20: Vellfire 3rd Gen, 23: Starex
                const scaleClasses = isSmallImage ? "scale-125 group-hover:scale-[1.4]" : "scale-110 group-hover:scale-125";

                return (
                <div key={car.id} className="car-card group glass-card rounded-3xl overflow-hidden transition-all duration-500 border border-slate-200/60 shadow-lg hover:shadow-cyan-500/20 flex flex-col bg-white/90">
                  <div className={`h-52 w-full bg-gradient-to-br ${car.color} flex items-center justify-center relative overflow-hidden p-2`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                    
                    {/* LOGO AFWAJA (WATERMARK UNTUK SEMUA KERETA) */}
                    <img 
                      src="https://platform-bcl.bsb-cdn.com/media/2026/04/01KP2KFY3QZ342VQBTS02D1K8E.png" 
                      alt="Afwaja Logo" 
                      className="absolute top-4 left-4 h-6 sm:h-8 w-auto z-20 opacity-90 drop-shadow-md group-hover:scale-110 transition-transform origin-top-left" 
                    />

                    {car.image ? (
                      <img src={car.image} alt={car.name} className={`w-full h-full object-contain drop-shadow-2xl opacity-95 transform ${scaleClasses} group-hover:-translate-y-2 transition-all duration-500 relative z-10`} />
                    ) : (
                      <Car size={100} className={`text-white drop-shadow-2xl opacity-90 transform ${scaleClasses} group-hover:-translate-y-2 transition-all duration-500 relative z-10`} strokeWidth={1} />
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="absolute -top-5 right-5 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100">
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">{car.category}</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div>
                        <h3 className="brand font-bold text-xl text-slate-900 group-hover:text-cyan-700 transition-colors">{car.name}</h3>
                        {hasSeasonalRate && (
                          <p className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-800">
                            Seasonal Rate Applied
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 mb-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1.5"><Users size={16} className="text-cyan-600"/>{car.seats} Seats</span>
                      <span className="flex items-center gap-1.5"><Settings size={16} className="text-cyan-600"/>{car.transmission}</span>
                      <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-cyan-600"/>Dep. MYR {fleetPricingMode === 'local' ? car.depositLocal : car.depositTourist}</span>
                    </div>
                    <div className="mt-auto flex justify-between items-end pt-4 border-t border-slate-200">
                      <div>
                        {hasSeasonalRate && (
                          <p className="text-sm font-bold text-slate-400 line-through">MYR {regularDailyRate}</p>
                        )}
                        <span className={`brand text-3xl font-bold ${hasSeasonalRate ? 'text-amber-600' : 'text-cyan-600'}`}>MYR {displayDailyRate}</span>
                        <span className="text-slate-500 text-sm font-medium">/day</span>
                        {hasSeasonalRate && (
                          <p className="mt-1 text-xs font-bold text-amber-700">{seasonalOutcome.seasonalPricing.name}</p>
                        )}
                      </div>
                      <button onClick={() => handleBookNow(car)} className="btn-primary text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-md">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="brand text-3xl sm:text-4xl font-bold mb-4 text-slate-900">What Our Clients Say</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Thousands of successful trips completed with Afwaja. Here's what international and local travelers think.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "John Davidson", role: "Tourist from UK", text: "The booking process was incredibly smooth. They delivered the car right to KLIA terminal as soon as I landed. Highly recommended for tourists!", stars: 5 },
                { name: "Ahmad Faizal", role: "Pelanggan Tempatan", text: "Sewa Alza untuk balik kampung. Kereta memang tip-top, bersih dan wangi. Sistem booking pun senang gila tak payah wasap panjang-panjang. Terbaik Afwaja!", stars: 5 },
                { name: "Sarah Lee", role: "Corporate Executive", text: "Very fast deposit refund system. I returned the car without any scratches, and received my deposit back within 24 hours. Trusted service!", stars: 5 },
                { name: "Nurul Huda", role: "Pelanggan Tempatan", text: "First time jumpa sistem sewa kereta yang telus macam ni. Harga dah tunjuk awal-awal siap ada diskaun. Ambil kereta kat HQ diorang kat Cyberjaya memang smooth.", stars: 5 },
                { name: "Ramesh Raj", role: "Family Trip", text: "Great variety of cars. Needed an MPV for a family trip to Penang and they provided a well-maintained vehicle. Very reasonable pricing for the weekend.", stars: 5 },
                { name: "Michael Chen", role: "Expat in Malaysia", text: "Rented a vehicle for a whole month. The 45% long-term discount is a massive saver. Love the digital VCR and E-agreement process. Highly secure.", stars: 5 }
              ].map((testi, i) => (
                <div key={i} className="glass-card bg-white/80 p-8 rounded-3xl shadow-sm border border-slate-200 relative">
                  <Quote className="absolute top-6 right-6 text-slate-200 w-12 h-12" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testi.stars)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-slate-600 mb-6 relative z-10 font-medium leading-relaxed">"{testi.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {testi.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{testi.name}</p>
                      <p className="text-xs text-slate-500">{testi.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 text-slate-300 py-12 px-4 mt-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="brand text-2xl font-bold text-white">Afwaja Car Rental</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-sm leading-relaxed">
                Malaysia's leading smart car rental provider. Connecting you to your destinations safely and comfortably.
              </p>
              <div className="flex gap-4">
                <button onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-600 transition-colors" title="Contact Us"><MessageCircle size={18}/></button>
                <a href="tel:0338530080" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-600 transition-colors" title="Call Us"><Phone size={18}/></a>
                <a href="mailto:afwajatrading@gmail.com" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-cyan-600 transition-colors" title="Email Us"><Mail size={18}/></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => { window.scrollTo(0,0); }} className="hover:text-cyan-400 transition-colors">Home</button></li>
                <li><button onClick={() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-cyan-400 transition-colors">About Us</button></li>
                <li><button onClick={() => document.getElementById('fleet')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-cyan-400 transition-colors">Our Fleet</button></li>
                <li><button onClick={() => setCurrentView('track')} className="hover:text-cyan-400 transition-colors">Track Booking</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => { setCurrentView('terms'); window.scrollTo(0,0); }} className="hover:text-cyan-400 transition-colors">Terms & Conditions</button></li>
                <li><button onClick={() => { setCurrentView('privacy'); window.scrollTo(0,0); }} className="hover:text-cyan-400 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => { setCurrentView('faq'); window.scrollTo(0,0); }} className="hover:text-cyan-400 transition-colors">FAQ</button></li>
                <li><button onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }} className="hover:text-cyan-400 transition-colors">Contact Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Follow Us</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="https://instagram.com/carrentalcyber" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">Instagram</a></li>
                <li><a href="https://tiktok.com/@afwajacarrental" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">TikTok</a></li>
                <li><a href="https://facebook.com/afwajatrading" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Afwaja Car Rental. All Rights Reserved.
          </div>
        </footer>
      </div>
    );
  };

  const BookingView = () => {
    const isTourist = bookingDetails.customerType === 'international';
    const currentDailyPrice = isTourist ? selectedCar.priceTourist : selectedCar.priceLocal;
    const seasonalOutcome = getSeasonalPricingOutcome(seasonalPricings, {
      car: selectedCar,
      customerType: bookingDetails.customerType,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      baseDailyRate: currentDailyPrice,
    });
    const effectiveDailyPrice = seasonalOutcome.adjustedBaseRate || currentDailyPrice;
    const currentDeposit = isTourist ? selectedCar.depositTourist : selectedCar.depositLocal;
    const currentPickupFee = bookingDetails.pickupLocationMeta?.fee ?? bookingDetails.pickupFee ?? 0;
    const currentReturnFee = bookingDetails.returnLocationMeta?.fee ?? bookingDetails.returnFee ?? 0;

    const liveRental = getRentalDurationAndCost(bookingDetails.startDate, bookingDetails.endDate, effectiveDailyPrice);
    const activeCoupon = bookingDetails.coupon?.code
      ? coupons.find((coupon) => normalizeCouponCode(coupon.code) === normalizeCouponCode(bookingDetails.coupon.code))
      : null;
    const liveCouponOutcome = activeCoupon
      ? calculateCouponOutcome(activeCoupon, {
          rentalTotal: liveRental.rentalTotal,
          totalDays: liveRental.days,
          customerType: bookingDetails.customerType,
          car: selectedCar,
          customerEmail: bookingDetails.email,
        })
      : null;
    const liveCouponDiscount = liveCouponOutcome?.valid
      ? liveCouponOutcome.summary.discountAmount
      : Number(bookingDetails.coupon?.discountAmount || 0);
    const liveRentalAfterCoupon = Math.max(0, liveRental.rentalTotal - liveCouponDiscount);
    const liveGrandTotal = liveRentalAfterCoupon + currentPickupFee + currentReturnFee + currentDeposit;

    return (
      <>
      <div className={`max-w-5xl mx-auto px-4 py-24 animate-fadeIn font-dm ${readingDoc ? 'hidden' : 'block'}`}>
        <button onClick={() => setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
          &larr; Back to Home
        </button>
        
        <div className="glass-card rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200/60 bg-white/80 backdrop-blur-xl">
          <div className={`w-full bg-gradient-to-br ${selectedCar.color} p-8 sm:p-10 text-white flex flex-col sm:flex-row justify-between items-center sm:items-end relative overflow-hidden`}>
            <div className="relative z-10 text-center sm:text-left mb-6 sm:mb-0 w-full sm:w-auto flex-1">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 inline-block">{selectedCar.category}</span>
              <h2 className="brand text-3xl sm:text-5xl font-bold mb-2">{selectedCar.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                <span className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                  <ShieldCheck size={18}/> Refundable Deposit: MYR {currentDeposit}
                </span>
                {seasonalOutcome.seasonalPricing.seasonalDocId && (
                  <span className="bg-amber-400/90 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Sparkles size={16}/> {seasonalOutcome.seasonalPricing.name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative z-10 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/20 pt-6 sm:pt-0 sm:pl-10 w-full sm:w-auto">
              <p className="text-sm font-medium text-white/80 mb-1 uppercase tracking-widest">
                {liveRental?.discountPercentage > 0 ? 'Discounted Daily Rate' : 'Estimated Daily Rate'}
              </p>
              <div className="flex flex-col sm:items-end items-center">
                {liveRental?.discountPercentage > 0 && (
                  <p className="text-white/60 line-through text-lg font-bold mb-[-5px]">MYR {currentDailyPrice}</p>
                )}
                {seasonalOutcome.seasonalPricing.seasonalDocId && liveRental?.discountPercentage === 0 && (
                  <p className="text-white/60 line-through text-lg font-bold mb-[-5px]">MYR {currentDailyPrice}</p>
                )}
                <p className="brand text-5xl sm:text-6xl font-bold text-white">MYR {liveRental?.totalHours > 0 ? liveRental.appliedDailyRate : currentDailyPrice} <span className="text-lg font-normal font-dm">/day</span></p>
                {liveRental?.discountPercentage > 0 && (
                  <div className="inline-flex mt-2 items-center bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                    <Sparkles size={12} className="mr-1"/> {liveRental.discountPercentage}% OFF ({liveRental.discountTier})
                  </div>
                )}
                {seasonalOutcome.seasonalPricing.seasonalDocId && (
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                    {summarizeSeasonalAdjustment(seasonalOutcome.seasonalPricing)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full p-8 sm:p-10 lg:p-12">
            <form onSubmit={handleBookingSubmit}>
              <div className="mb-8 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 font-bold mb-1">Booking Type</p>
                  <p className="text-base font-bold text-slate-900">
                    {bookingDetails.customerType === 'international' ? 'International Tourist' : 'Malaysian Citizen'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm font-bold text-cyan-700 hover:text-cyan-800"
                >
                  Change on homepage
                </button>
              </div>

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-5 border-b border-slate-200 pb-3 flex items-center gap-2"><User size={20} className="text-cyan-600"/> Renter Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                    <input required type="text" placeholder="As per ID/Passport" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                      value={bookingDetails.name} onChange={e => setBookingDetails({...bookingDetails, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        {isTourist ? 'Phone No. / WhatsApp' : 'Phone No.'}
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder={isTourist ? '+6281234567890' : '0123456789'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                        value={bookingDetails.phone}
                        onChange={e => setBookingDetails({...bookingDetails, phone: e.target.value})}
                      />
                      <p className="text-xs text-orange-600 font-bold mt-1.5">
                        {isTourist
                          ? 'Note: Please include your country code and use a WhatsApp number only.'
                          : 'Note: Please enter a phone number with WhatsApp only.'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                      <input required type="email" placeholder="ali@email.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                        value={bookingDetails.email} onChange={e => setBookingDetails({...bookingDetails, email: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {!isTourist && (
                <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                  <div className="mb-5 border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Wallet size={20} className="text-cyan-600"/> Deposit Refund Account Details</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1.5">Your refundable deposit will be transferred to this account within 3 to 14 working days after vehicle return.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Holder Name</label>
                      <input required type="text" placeholder="As per bank account" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                        value={bookingDetails.accountHolderName} onChange={e => setBookingDetails({...bookingDetails, accountHolderName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Number</label>
                      <input required type="text" inputMode="numeric" placeholder="Bank account number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                        value={bookingDetails.bankAccount} onChange={e => setBookingDetails({...bookingDetails, bankAccount: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Bank Name</label>
                      <select
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium text-slate-900"
                        value={bookingDetails.bankName}
                        onChange={e => setBookingDetails({...bookingDetails, bankName: e.target.value})}
                      >
                        <option value="">Select your bank</option>
                        {MALAYSIAN_BANK_OPTIONS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar size={20} className="text-cyan-600"/> Date/Time & Destination</h3>
                    <span className="bg-cyan-100 text-cyan-800 text-[10px] uppercase font-bold px-2 py-1 rounded-md hidden sm:block">Longer Rentals = Cheaper Rates</span>
                  </div>
                  <p className="text-xs text-orange-600 font-bold mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="flex items-center"><Clock size={14} className="mr-1"/> Note: Minimum 24-hours advance booking required.</span>
                    <span className="hidden sm:inline">|</span>
                    <span>Minimum rental period is strictly 2 Days.</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Pickup Date & Time</label>
                    <div className="grid sm:grid-cols-[1.3fr_0.9fr] gap-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => bookingPickupDateInputRef.current?.showPicker?.()}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium flex items-center gap-3 text-left"
                        >
                          <Calendar className="text-cyan-600 flex-shrink-0" size={18} />
                          <span>{formatDateForInputDisplay(getDatePart(bookingDetails.startDate))}</span>
                        </button>
                        <input
                          ref={bookingPickupDateInputRef}
                          required
                          type="date"
                          value={getDatePart(bookingDetails.startDate)}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={e => updateHomepageDateTime('startDate', 'date', e.target.value)}
                          className="absolute inset-0 opacity-0 pointer-events-none"
                          tabIndex={-1}
                        />
                      </div>
                      <label className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                        <Clock className="text-cyan-600 flex-shrink-0" size={18} />
                        <select
                          value={getTimePart(bookingDetails.startDate) || '08:00'}
                          onChange={e => updateHomepageDateTime('startDate', 'time', e.target.value)}
                          className="w-full bg-transparent outline-none text-slate-900 font-medium"
                        >
                          {TIME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Date & Time</label>
                    <div className="grid sm:grid-cols-[1.3fr_0.9fr] gap-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => bookingReturnDateInputRef.current?.showPicker?.()}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium flex items-center gap-3 text-left"
                        >
                          <Calendar className="text-cyan-600 flex-shrink-0" size={18} />
                          <span>{formatDateForInputDisplay(getDatePart(bookingDetails.endDate))}</span>
                        </button>
                        <input
                          ref={bookingReturnDateInputRef}
                          required
                          type="date"
                          value={getDatePart(bookingDetails.endDate)}
                          min={getDatePart(bookingDetails.startDate) || new Date().toISOString().slice(0, 10)}
                          onChange={e => updateHomepageDateTime('endDate', 'date', e.target.value)}
                          className="absolute inset-0 opacity-0 pointer-events-none"
                          tabIndex={-1}
                        />
                      </div>
                      <label className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                        <Clock className="text-cyan-600 flex-shrink-0" size={18} />
                        <select
                          value={getTimePart(bookingDetails.endDate) || '10:00'}
                          onChange={e => updateHomepageDateTime('endDate', 'time', e.target.value)}
                          className="w-full bg-transparent outline-none text-slate-900 font-medium"
                        >
                          {TIME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Destination</label>
                    <input required type="text" placeholder="E.g.: Cameron / KLIA" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                      value={bookingDetails.destination} onChange={e => setBookingDetails({...bookingDetails, destination: e.target.value})} />
                    <p className="text-xs text-slate-500 font-medium mt-1.5">Note: Where you want to go.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><MapPin size={20} className="text-cyan-600"/> {isTourist ? 'Pickup & Return' : 'Delivery & Pickup'}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1.5 italic">
* Note: Delivery and return fees are calculated automatically from Afwaja Car Rental HQ, Cyberjaya, at RM2.5 per km.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{isTourist ? 'Pickup Location' : 'Delivery Location'}</label>
                    <button
                      type="button"
                      onClick={() => openLocationPicker('pickup')}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700 text-left flex items-center justify-between gap-3 hover:border-cyan-300 transition"
                    >
                      <span className="flex-1">
                        {bookingDetails.pickupLocation || 'Search pickup location'}
                      </span>
                      <Search size={18} className="text-cyan-600 flex-shrink-0" />
                    </button>
                    {bookingDetails.pickupLocationMeta && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {bookingDetails.pickupLocationMeta.distanceLabel} - Delivery fee MYR {currentPickupFee}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Location</label>
                    <button
                      type="button"
                      onClick={() => openLocationPicker('return')}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700 text-left flex items-center justify-between gap-3 hover:border-cyan-300 transition"
                    >
                      <span className="flex-1">
                        {bookingDetails.returnLocation || 'Search return location'}
                      </span>
                      <Search size={18} className="text-cyan-600 flex-shrink-0" />
                    </button>
                    {bookingDetails.returnLocationMeta && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {bookingDetails.returnLocationMeta.distanceLabel} - Return fee MYR {currentReturnFee}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Sparkles size={20} className="text-cyan-600"/> Promo Code</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1.5">Coupons apply to the rental amount only. Security deposit and logistics fees remain unchanged.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(normalizeCouponCode(e.target.value));
                      if (couponFeedback.message) {
                        setCouponFeedback({ type: '', message: '' });
                      }
                    }}
                    placeholder="Enter coupon code"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => applyCouponCode(couponInput)}
                    className="px-5 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={removeCouponCode}
                    className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {couponFeedback.message && (
                  <p className={`mt-3 text-sm font-bold ${couponFeedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
                {bookingDetails.coupon?.code && liveCouponDiscount > 0 && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Applied Coupon</p>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-emerald-900">
                      <p className="font-bold">{bookingDetails.coupon.code} {bookingDetails.coupon.description ? `- ${bookingDetails.coupon.description}` : ''}</p>
                      <p>You save MYR {liveCouponDiscount} on the rental subtotal.</p>
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                if (bookingDetails.startDate && bookingDetails.endDate && liveRental.totalHours > 0) {
                  return (
                    <div className="bg-cyan-50 p-6 sm:p-8 rounded-2xl mt-8 border border-cyan-200 shadow-inner animate-fadeIn">
                      <p className="text-base font-bold text-cyan-900 mb-4 border-b border-cyan-200 pb-3 flex items-center gap-2">
                        <FileText size={20}/> Booking Summary ({liveRental.days} Days {liveRental.extraHours > 0 ? `+ ${liveRental.extraHours} Hours` : ''})
                      </p>
                      <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
                        <span>Rental Rate ({liveRental.days} Days @ MYR {liveRental.appliedDailyRate}/day):</span>
                        <span>MYR {liveRental.days * liveRental.appliedDailyRate}</span>
                      </div>
                      {seasonalOutcome.seasonalPricing.seasonalDocId && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-amber-700">
                          <span>Seasonal Pricing ({seasonalOutcome.seasonalPricing.name}):</span>
                          <span>{summarizeSeasonalAdjustment(seasonalOutcome.seasonalPricing)}</span>
                        </div>
                      )}
                      {liveRental.extraHours > 0 && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
                          <span>Extra Hours Fee ({liveRental.extraHours} Hours):</span>
                          <span>MYR {liveRental.extraHoursFee}</span>
                        </div>
                      )}
                      {liveCouponDiscount > 0 && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-emerald-700">
                          <span>Coupon Discount ({bookingDetails.coupon.code}):</span>
                          <span>- MYR {liveCouponDiscount}</span>
                        </div>
                      )}
                      {bookingDetails.pickupLocation && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
                          <span>{isTourist ? 'Pickup Fee' : 'Delivery Fee'}:</span>
                          <span>MYR {currentPickupFee}</span>
                        </div>
                      )}
                      {bookingDetails.returnLocation && (
                        <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
                          <span>Return Fee:</span>
                          <span>MYR {currentReturnFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-700">
                        <span>Security Deposit (Fully Refundable):</span>
                        <span>MYR {currentDeposit}</span>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-cyan-200 border-dashed pt-4 mt-2">
                        <span className="font-bold text-cyan-900 text-lg">Grand Total:</span>
                        <span className="brand text-3xl font-bold text-teal-700">
                          MYR {liveGrandTotal}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-10 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start gap-4 hover:border-cyan-300 transition-colors shadow-sm">
                <input 
                  type="checkbox" 
                  id="agreeTerms" 
                  required 
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="agreeTerms" className="text-sm text-slate-600 font-medium cursor-pointer leading-relaxed">
                  I have read, understood, and agree to the <button type="button" onClick={() => { setReadingDoc('terms'); window.scrollTo(0,0); }} className="text-cyan-600 font-bold hover:underline">Terms & Conditions</button> and <button type="button" onClick={() => { setReadingDoc('privacy'); window.scrollTo(0,0); }} className="text-cyan-600 font-bold hover:underline">Privacy Policy</button>, including the security deposit, cancellation policy, and accident excess clauses.
                </label>
              </div>

              <button type="submit" className="w-full btn-primary text-white font-bold text-xl py-5 rounded-2xl mt-6 flex justify-center items-center gap-3 shadow-lg shadow-cyan-500/40 hover:scale-[1.01] transition-transform">
                Proceed to Payment <CreditCard size={24} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* OVERLAY DOKUMEN (FULL SCREEN MODAL) */}
      {readingDoc === 'terms' && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fadeIn">
          {TermsView({ onBack: () => setReadingDoc(null) })}
        </div>
      )}
      {readingDoc === 'privacy' && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fadeIn">
          {PrivacyPolicyView({ onBack: () => setReadingDoc(null) })}
        </div>
      )}
      </>
    );
  };

  const PaymentView = () => {
    if (!selectedCar) return null;

    return (
      <div className="max-w-xl mx-auto px-4 py-24 animate-fadeIn font-dm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="brand text-3xl font-bold text-slate-900">Secure Checkout</h2>
        </div>

        <div className="glass-card rounded-3xl shadow-xl overflow-hidden border border-slate-200/60 p-8 bg-white/80">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200 border-dashed">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Total Amount Payable</p>
              <p className="brand text-4xl font-bold text-slate-900">MYR {bookingDetails.grandTotal}</p>
            </div>
            <div className="text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-900">{selectedCar.name}</p>
              <p className="text-sm font-medium text-blue-600">{bookingDetails.totalDays} Days {bookingDetails.extraHours > 0 ? `+ ${bookingDetails.extraHours} Hours` : ''}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-5 mb-8 text-sm font-medium text-slate-600 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Payment Breakdown</p>
            
            <div className="flex justify-between mb-2">
              <span>Vehicle Rental ({bookingDetails.totalDays} Days @ MYR {bookingDetails.appliedDailyRate})</span>
              <span className="font-bold text-slate-800">MYR {(bookingDetails.rentalSubtotal || bookingDetails.totalPrice) - (bookingDetails.extraHoursFee || 0)}</span>
            </div>

            {bookingDetails.extraHours > 0 && (
              <div className="flex justify-between mb-2">
                <span>Extra Hours ({bookingDetails.extraHours} Hours)</span>
                <span className="font-bold text-slate-800">MYR {bookingDetails.extraHoursFee}</span>
              </div>
            )}

            {bookingDetails.seasonalPricing?.seasonalDocId && (
              <div className="flex justify-between mb-2 text-amber-700">
                <span>Seasonal Pricing ({bookingDetails.seasonalPricing.name})</span>
                <span className="font-bold">{summarizeSeasonalAdjustment(bookingDetails.seasonalPricing)}</span>
              </div>
            )}

            {bookingDetails.coupon?.discountAmount > 0 && (
              <div className="flex justify-between mb-2 text-emerald-700">
                <span>Coupon Discount ({bookingDetails.coupon.code})</span>
                <span className="font-bold">- MYR {bookingDetails.coupon.discountAmount}</span>
              </div>
            )}
            
            {bookingDetails.pickupFee > 0 && (
              <div className="flex justify-between mb-2">
                <span>Delivery: {bookingDetails.pickupLocation.split(' (')[0]}</span>
                <span className="font-bold text-slate-800">MYR {bookingDetails.pickupFee}</span>
              </div>
            )}
            
            {bookingDetails.returnFee > 0 && (
              <div className="flex justify-between mb-2">
                <span>Return: {bookingDetails.returnLocation.split(' (')[0]}</span>
                <span className="font-bold text-slate-800">MYR {bookingDetails.returnFee}</span>
              </div>
            )}
            
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-200 text-emerald-700 font-bold">
              <span>Security Deposit (Refundable)</span>
              <span>+ MYR {bookingDetails.deposit}</span>
            </div>
          </div>

          <form onSubmit={handleFinalPaymentSubmit} className="space-y-5">
            {bookingDetails.customerType === 'local' ? (
               <div className="mb-6 bg-cyan-50 border border-cyan-200 p-4 rounded-xl flex items-start gap-3 animate-fadeIn">
                 <Landmark className="text-cyan-600 w-6 h-6 flex-shrink-0 mt-0.5" />
                 <div>
                   <p className="font-bold text-cyan-900 text-sm">Payment Method: FPX (Online Banking)</p>
                   <p className="text-xs text-cyan-700 mt-1">You will be redirected to ToyyibPay's secure gateway to select your preferred bank and complete the payment.</p>
                 </div>
               </div>
            ) : (
               <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                 <Globe className="text-blue-500 w-6 h-6 flex-shrink-0 mt-0.5" />
                 <div>
                   <p className="font-bold text-blue-900 text-sm">International Tourist Payment</p>
                   <p className="text-xs text-blue-700 mt-1">To ensure a smooth & fast return of your Security Deposit across borders, payment is strictly via Credit/Debit Card. Refunds will be credited directly back to your card.</p>
                 </div>
               </div>
            )}

            <button type="submit" disabled={paymentProcessing} className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 transition-all flex justify-center items-center shadow-lg disabled:bg-slate-700 disabled:cursor-not-allowed">
              {paymentProcessing ? <RefreshCw className="animate-spin mr-2" size={20}/> : <ShieldCheck size={20} className="mr-2"/>}
              {paymentProcessing ? `Connecting to ${activeGateway}...` : `Pay MYR ${bookingDetails.grandTotal} Now`}
            </button>
          </form>
        </div>

        {paymentProcessing && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl flex flex-col items-center max-w-sm w-full text-center animate-fadeIn shadow-2xl">
              <div className="w-16 h-16 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin mb-6"></div>
              <h3 className="brand text-xl font-bold text-slate-900 mb-2">Secure Connection</h3>
              <p className="text-slate-500 font-medium text-sm">Establishing a secure link to the payment gateway...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RequestSuccessView = () => (
    <div className="max-w-2xl mx-auto px-4 py-24 animate-fadeIn font-dm text-center">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-emerald-600" />
      </div>
      <h2 className="brand text-4xl font-bold text-slate-900 mb-4">Booking Successfully Recorded!</h2>
      <p className="text-lg text-slate-600 mb-6 max-w-lg mx-auto">
        Your booking reference ID is: <span className="font-mono font-bold text-2xl text-cyan-700 block mt-2 mb-4">{currentBookingId}</span>
      </p>

      {/* BUTANG BAYAR MANUAL - KALIS POPUP BLOCKER */}
      {paymentUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-8 max-w-lg mx-auto transform transition-all animate-fadeIn">
           <p className="font-bold text-blue-900 text-lg mb-2">Final Step!</p>
           <p className="text-blue-700 text-sm mb-6">Please click the button below to complete your rental and deposit payment securely.</p>
           <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex justify-center items-center text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform w-full sm:w-auto">
             Proceed to Payment <ChevronRight className="ml-2"/>
           </a>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-8 pt-8 border-t border-slate-200">
        <button onClick={() => { setCurrentView('home'); window.scrollTo(0,0); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">
          Back to Home
        </button>
      </div>
    </div>
  );

  const ThankYouView = () => (
    <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-emerald-500 p-8 sm:p-12 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
           
           <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
           </div>
           <h2 className="brand text-4xl sm:text-5xl font-bold mb-4 relative z-10">Thank You!</h2>
           <p className="text-emerald-50 text-lg relative z-10">Your booking payment has been successfully received.</p>
           <div className="mt-6 inline-block bg-emerald-600 border border-emerald-400 px-6 py-3 rounded-xl shadow-inner">
             <span className="text-emerald-100 text-xs uppercase tracking-widest font-bold block mb-1">Your Booking ID</span>
             <span className="font-mono text-2xl font-bold">{currentBookingId || 'AFW-XXXX'}</span>
           </div>
        </div>
        
        <div className="p-8 sm:p-12 bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <CheckCircle className="text-cyan-600"/> What You Need to Do Next
          </h3>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 relative overflow-hidden border-l-4 border-l-cyan-500">
               <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg mt-1">1</div>
               <div>
                 <h4 className="font-bold text-slate-900 text-lg mb-1">Check Your Email Inbox</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">Your Official Receipt and booking details will be sent to your email (Please check your Spam/Junk folder if it is not in your Inbox).</p>
               </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
               <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg mt-1">2</div>
               <div>
                 <h4 className="font-bold text-slate-900 text-lg mb-1">Track Your Booking Status</h4>
                 <p className="text-slate-600 text-sm leading-relaxed">Our team will review your payment and assign a vehicle shortly. Use your Booking ID to track the status in real-time.</p>
               </div>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-slate-200 text-center">
            <button onClick={() => { setSearchTrackId(currentBookingId || ''); setCurrentView('track'); window.scrollTo(0,0); }} className="btn-primary w-full sm:w-auto px-10 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:scale-105 transition-transform mx-auto">
              Track Booking Status <ChevronRight size={20}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomerTrackView = () => {
    const isTrackableBooking =
      trackedBooking &&
      trackedBooking.payment?.status === 'success' &&
      trackedBooking.status !== 'Payment_Pending' &&
      trackedBooking.status !== 'Payment_Failed';

    return (
      <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
        <div className="text-center mb-10">
          <h2 className="brand text-3xl font-bold text-slate-900">Track Booking Status</h2>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm border border-slate-200/60 max-w-lg mx-auto mb-10">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Booking ID (e.g. AFW-1234)" 
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-bold uppercase" 
              value={searchTrackId} 
              onChange={(e) => {
                 setSearchTrackId(e.target.value.toUpperCase());
                 setUploadedDocs({ ic: null, license: null, bill: null });
                 setVcrDocs(EMPTY_VCR_DOCS);
                 setReturnVcrDocs(EMPTY_VCR_DOCS);
              }}
            />
          </div>
        </div>

        {trackedBooking && !isTrackableBooking && (
          <div className="bg-white rounded-3xl shadow-xl border border-red-200 overflow-hidden animate-fadeIn max-w-2xl mx-auto">
            <div className="bg-red-50 p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="brand text-2xl font-bold text-slate-900 mb-2">Tracking Not Available Yet</h3>
              <p className="text-slate-600 mb-3">
                This booking cannot be tracked because payment has not been completed successfully.
              </p>
              <p className="text-sm font-bold text-red-700">
                Current payment status: {trackedBooking.payment?.status === 'failed' ? 'Failed / Cancelled' : 'Pending'}
              </p>
            </div>
          </div>
        )}

        {isTrackableBooking && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 p-8 sm:p-10 pb-12">
              <div className="flex items-center justify-between relative max-w-lg mx-auto">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-800 rounded-full"></div>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-1000 ${
                  trackedBooking.status === 'Paid_Pending' ? 'w-0' :
                  trackedBooking.status === 'Completed' ? 'w-1/3' :
                  (trackedBooking.status === 'Active' || trackedBooking.status === 'Return_Pending') ? 'w-2/3' :
                  trackedBooking.status === 'Returned' ? 'w-full' : 'w-0'
                }`}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-500 ${['Paid_Pending', 'Completed', 'Active', 'Return_Pending', 'Returned'].includes(trackedBooking.status) ? 'bg-cyan-500 border-slate-900 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-slate-900 text-slate-500'}`}><CreditCard size={16}/></div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-300 mt-3 absolute -bottom-7 whitespace-nowrap">Paid</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-500 ${['Completed', 'Active', 'Return_Pending', 'Returned'].includes(trackedBooking.status) ? 'bg-cyan-500 border-slate-900 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-slate-900 text-slate-500'}`}><Car size={16}/></div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-300 mt-3 absolute -bottom-7 whitespace-nowrap">Confirmed</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-500 ${['Active', 'Return_Pending', 'Returned'].includes(trackedBooking.status) ? 'bg-cyan-500 border-slate-900 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 border-slate-900 text-slate-500'}`}><PenTool size={16}/></div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-300 mt-3 absolute -bottom-7 whitespace-nowrap">Active</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-500 ${['Returned'].includes(trackedBooking.status) ? 'bg-emerald-500 border-slate-900 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border-slate-900 text-slate-500'}`}><CheckCircle size={16}/></div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-300 mt-3 absolute -bottom-7 whitespace-nowrap">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">Booking ID</p>
                <p className="font-mono font-bold text-slate-700 text-xl">{trackedBooking.id}</p>
              </div>
              <div className="text-right">
                {trackedBooking.status === 'Paid_Pending' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"><RefreshCw size={14} className="mr-1.5 animate-spin"/> Processing</span>}
                {trackedBooking.status === 'Completed' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"><Check size={14} className="mr-1.5"/> Ready for Pickup</span>}
                {trackedBooking.status === 'Active' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm"><Car size={14} className="mr-1.5"/> Currently Rented</span>}
                {trackedBooking.status === 'Return_Pending' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-orange-100 text-orange-800 border border-orange-200 shadow-sm"><Clock size={14} className="mr-1.5"/> Return Inspection</span>}
                {trackedBooking.status === 'Returned' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-200 text-slate-800 border border-slate-300 shadow-sm"><Award size={14} className="mr-1.5"/> Deposit Refunded</span>}
                {trackedBooking.status === 'Cancelled' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm"><XCircle size={14} className="mr-1.5"/> Cancelled</span>}
                {trackedBooking.status === 'Refunded' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm"><Wallet size={14} className="mr-1.5"/> Full Refund Processed</span>}
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
                <div>
                  <p className="font-bold text-slate-900 text-xl">{trackedBooking.car.name}</p>
                  <p className="text-slate-600">{formatDateTime(trackedBooking.customer.startDate)} - {formatDateTime(trackedBooking.customer.endDate)} ({trackedBooking.customer.totalDays} Days {trackedBooking.customer.extraHours > 0 ? `+ ${trackedBooking.customer.extraHours} Hours` : ''})</p>
                  <p className="text-slate-600 mt-2 text-sm"><MapPin size={14} className="inline mr-1"/> Pickup: {trackedBooking.customer.pickupLocation}</p>
                  <p className="text-slate-600 mt-1 text-sm"><MapPin size={14} className="inline mr-1"/> Drop-off: {trackedBooking.customer.returnLocation}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-bold text-slate-400">Total Paid</p>
                  <p className="brand text-4xl font-bold text-slate-900">MYR {trackedBooking.customer.grandTotal}</p>
                  <div className="mt-2 text-xs font-medium text-slate-500 flex flex-col md:items-end gap-1">
                    <span>Rental & Delivery: MYR {trackedBooking.customer.totalPrice + trackedBooking.customer.pickupFee + trackedBooking.customer.returnFee}</span>
                    <span className="text-emerald-600 font-bold">Security Deposit: MYR {trackedBooking.customer.deposit}</span>
                  </div>
                </div>
              </div>

              {(trackedBooking.status === 'Paid_Pending' || trackedBooking.status === 'Completed' || trackedBooking.status === 'Active' || trackedBooking.status === 'Returned') && (
                <div className="mt-8 border-t border-slate-200 pt-8">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center"><ShieldCheck className="mr-2 text-cyan-600"/> Identity Verification (KYC)</h3>
                  
                  {(!trackedBooking.documents || trackedBooking.documents.status === 'pending' || trackedBooking.documents.status === 'rejected') && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <p className="text-sm text-slate-600 mb-6">Please upload your official documents for insurance and security purposes. <br/><b>Note: All uploaded documents will be securely watermarked.</b></p>
                      {trackedBooking.documents?.status === 'rejected' && (
                         <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-bold border border-red-200 flex items-center">
                           <AlertTriangle size={16} className="mr-2"/> Previous documents rejected. Please upload clear, readable images.
                         </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <label className={`flex-1 flex justify-center py-3 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${kycType === 'local' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                          <input type="radio" className="hidden" checked={kycType === 'local'} onChange={() => setKycType('local')} />
                          Malaysian Citizen
                        </label>
                        <label className={`flex-1 flex justify-center py-3 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${kycType === 'international' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                          <input type="radio" className="hidden" checked={kycType === 'international'} onChange={() => setKycType('international')} />
                          International Tourist
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3 mb-6">
                        {[
                          { key: 'ic', label: kycType === 'local' ? 'MyKad (Front)' : 'Passport' },
                          { key: 'license', label: kycType === 'local' ? 'Driving License' : 'Valid License / IDP' },
                          { key: 'bill', label: kycType === 'local' ? 'Latest Utility Bill' : 'Flight / Hotel Info' }
                        ].map((docType) => (
                          <div key={docType.key} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-white transition-colors relative overflow-hidden group h-32 flex flex-col items-center justify-center">
                            {uploadedDocs[docType.key] ? (
                              <div className="absolute inset-0">
                                <img src={uploadedDocs[docType.key]} className="w-full h-full object-cover opacity-80" alt={docType.key} />
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm"><CheckCircle className="text-white w-8 h-8" /></div>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="h-8 w-8 text-slate-400 mb-2 group-hover:text-cyan-500 transition-colors" />
                                <p className="text-xs font-bold text-slate-700 uppercase">{docType.label}</p>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, docType.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          </div>
                        ))}
                      </div>

                      <button onClick={submitKycDocs} disabled={kycUploading} className="w-full btn-primary text-white py-3 rounded-xl font-bold flex justify-center items-center">
                        {kycUploading ? <RefreshCw className="animate-spin mr-2" size={18}/> : <Send className="mr-2" size={18}/>}
                        {kycUploading ? 'Uploading...' : 'Submit Documents for Review'}
                      </button>
                    </div>
                  )}

                  {trackedBooking.documents?.status === 'submitted' && (
                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 text-center">
                      <Clock size={40} className="text-yellow-500 mx-auto mb-3" />
                      <h4 className="font-bold text-yellow-900 mb-1">Documents Under Review</h4>
                      <p className="text-sm text-yellow-800">Our admins are currently verifying your documents. Please wait.</p>
                    </div>
                  )}

                  {trackedBooking.documents?.status === 'verified' && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center mb-6">
                      <FileCheck size={24} className="text-emerald-500 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm">Documents Verified</h4>
                        <p className="text-xs text-emerald-800">Your identity has been successfully verified.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {trackedBooking.status === 'Completed' && trackedBooking.documents?.status === 'verified' && trackedBooking.vcr?.status !== 'completed' && (
                <div className="mt-8 border-t border-slate-200 pt-8 animate-fadeIn">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center"><Camera className="mr-2 text-cyan-600"/> Vehicle Condition Report (VCR)</h3>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2 font-medium">Please upload images of the vehicle from 4 angles and the dashboard (odometer & fuel level) before starting your trip. This acts as physical evidence for the E-Agreement.</p>
                    <p className="text-xs text-blue-700 mb-6">Tip: If your phone camera is unstable, take the photo first and upload it from your gallery.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {[{key: 'front', label: 'Front'}, {key: 'back', label: 'Rear'}, {key: 'left', label: 'Left'}, {key: 'right', label: 'Right'}, {key: 'odometer', label: 'Dashboard/Fuel'}].map((docType) => (
                        <div key={docType.key} className="border-2 border-dashed border-blue-300 rounded-xl p-3 text-center hover:bg-white transition-colors relative overflow-hidden group h-24 flex flex-col items-center justify-center bg-white/50">
                          {vcrDocs[docType.key] ? (
                            <div className="absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center gap-1">
                              <CheckCircle className="text-emerald-600 w-6 h-6" />
                              <p className="text-[10px] font-bold text-emerald-700 uppercase">{docType.label}</p>
                            </div>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-blue-400 mb-1 group-hover:text-blue-600 transition-colors" />
                              <p className="text-[10px] font-bold text-blue-800 uppercase">{docType.label}</p>
                            </>
                          )}
                          <input
                            type="file"
                            accept={MOBILE_IMAGE_ACCEPT}
                            multiple={false}
                            onClick={(e) => { e.currentTarget.value = null; }}
                            onChange={(e) => handleVcrFileChange(e, docType.key)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                        </div>
                      ))}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center"><PenTool className="mr-2 w-4 h-4"/> Digital Signature (E-Sign)</h4>
                    <div className="border-2 border-slate-300 rounded-xl bg-white overflow-hidden mb-6 relative">
                      <canvas 
                        ref={sigCanvas}
                        className="w-full h-40 touch-none cursor-crosshair"
                        style={{ touchAction: 'none' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      ></canvas>
                      <div className="absolute top-2 left-3 text-xs font-bold text-slate-300 pointer-events-none uppercase tracking-widest">Sign Here</div>
                      <button type="button" onClick={clearSignature} className="absolute bottom-2 right-2 bg-slate-100 p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                        <Trash2 size={16}/>
                      </button>
                    </div>

                    <button onClick={submitVcr} disabled={vcrUploading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center shadow-lg hover:bg-slate-800 transition-all">
                      {vcrUploading ? <RefreshCw className="animate-spin mr-2" size={18}/> : <FileText className="mr-2" size={18}/>}
                      {vcrUploading ? 'Saving Record...' : 'Agree & Start Rental'}
                    </button>
                  </div>
                </div>
              )}

              {trackedBooking.status === 'Active' && trackedBooking.vcr?.status === 'completed' && (
                <div className="mt-8 border-t border-slate-200 pt-8 animate-fadeIn">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center"><Undo2 className="mr-2 text-orange-600"/> Vehicle Return (Return VCR)</h3>
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                    <p className="text-sm text-orange-800 mb-2 font-medium">When you are ready to return the vehicle, park it at the designated drop-off location and upload 5 photos of the vehicle condition (including dashboard). This is required for your Security Deposit refund.</p>
                    <p className="text-xs text-orange-700 mb-6">Tip: If your phone camera is unstable, take the photo first and upload it from your gallery.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {[{key: 'front', label: 'Front'}, {key: 'back', label: 'Rear'}, {key: 'left', label: 'Left'}, {key: 'right', label: 'Right'}, {key: 'odometer', label: 'Dashboard/Fuel'}].map((docType) => (
                        <div key={docType.key} className="border-2 border-dashed border-orange-300 rounded-xl p-3 text-center hover:bg-white transition-colors relative overflow-hidden group h-24 flex flex-col items-center justify-center bg-white/50">
                          {returnVcrDocs[docType.key] ? (
                            <div className="absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center gap-1">
                              <CheckCircle className="text-emerald-600 w-6 h-6" />
                              <p className="text-[10px] font-bold text-emerald-700 uppercase">{docType.label}</p>
                            </div>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-orange-400 mb-1 group-hover:text-orange-600 transition-colors" />
                              <p className="text-[10px] font-bold text-orange-800 uppercase">{docType.label}</p>
                            </>
                          )}
                          <input
                            type="file"
                            accept={MOBILE_IMAGE_ACCEPT}
                            multiple={false}
                            onClick={(e) => { e.currentTarget.value = null; }}
                            onChange={(e) => handleReturnVcrFileChange(e, docType.key)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                        </div>
                      ))}
                    </div>

                    <button onClick={submitReturnVcr} disabled={returnVcrUploading} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold flex justify-center items-center shadow-lg hover:bg-orange-700 transition-all">
                      {returnVcrUploading ? <RefreshCw className="animate-spin mr-2" size={18}/> : <Undo2 className="mr-2" size={18}/>}
                      {returnVcrUploading ? 'Submitting Report...' : 'Confirm Vehicle Return'}
                    </button>
                  </div>
                </div>
              )}

              {trackedBooking.status === 'Return_Pending' && (
                <div className="mt-8 border-t border-slate-200 pt-8 animate-fadeIn">
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 flex flex-col items-center text-center">
                    <Clock size={48} className="text-orange-500 mb-3" />
                    <h3 className="font-bold text-orange-900 text-lg mb-1">Return Inspection in Progress</h3>
                    <p className="text-sm text-orange-800">Your return report has been submitted. Our admin is verifying the vehicle condition to process your MYR {trackedBooking.customer.deposit} Security Deposit refund.</p>
                  </div>
                </div>
              )}

              {trackedBooking.status === 'Returned' && trackedBooking.vcr?.status === 'completed' && (
                <div className="mt-8 border-t border-slate-200 pt-8 animate-fadeIn">
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 flex flex-col items-center text-center">
                    <ShieldCheck size={48} className="text-emerald-500 mb-3" />
                    <h3 className="font-bold text-emerald-900 text-lg mb-1">Rental Completed Successfully</h3>
                    <p className="text-sm text-emerald-800 mb-4">Your rental agreement has concluded. The MYR {trackedBooking.customer.deposit} Security Deposit has been refunded.</p>
                    <button onClick={() => { setCurrentBookingId(trackedBooking.id); setCurrentView('invoice'); window.scrollTo(0,0); }} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors inline-flex items-center text-sm">
                      <FileText size={16} className="mr-2"/> View Official Invoice
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const InvoiceView = () => {
    const booking = bookings.find(b => b.id === currentBookingId);
    if (!booking) return null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
        <button onClick={() => setCurrentView('track')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex print:hidden">
          &larr; Back
        </button>
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative" id="printable-invoice">
          <div className="h-4 w-full bg-gradient-to-r from-cyan-500 to-teal-500"></div>

          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
              <div>
                <img src="https://platform-bcl.bsb-cdn.com/media/2026/03/01KKK1QDM602YYPNC4MPN4YSB1.png" alt="Afwaja Logo" className="h-14 w-auto object-contain mb-2" onError={(e) => { e.target.style.display='none'; }}/>
                <p className="text-slate-500 font-medium">Official Invoice / Receipt</p>
              </div>
              <div className="sm:text-right">
                <h2 className="brand text-4xl font-bold uppercase tracking-wider text-slate-200 mb-2">INVOICE</h2>
                <div className="inline-block bg-cyan-50 text-cyan-700 px-4 py-1.5 rounded-lg font-bold font-mono text-lg border border-cyan-100">
                  {booking.id}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-y border-slate-100 py-6 mb-8 gap-4">
              <div className="flex items-center text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl font-bold border border-emerald-100">
                <CheckCircle size={20} className="mr-2"/> PAYMENT & BOOKING CONFIRMED
              </div>
              <div className="text-slate-600 font-medium sm:text-right">
                <p>Issue Date: <span className="font-bold text-slate-900">{new Date(booking.date).toLocaleDateString('en-MY')}</span></p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-10 mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
                <p className="brand text-xl font-bold text-slate-900 mb-1">{booking.customer.name}</p>
                <p className="text-slate-600 font-medium flex items-center gap-2 mb-1"><Mail size={14}/> {booking.customer.email || 'N/A'}</p>
                <p className="text-slate-600 font-medium flex items-center gap-2"><Phone size={14}/> {booking.customer.phone}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Rental Details</p>
                <p className="font-medium text-slate-600 mb-1">Pickup: <span className="font-bold text-slate-900">{formatDateTime(booking.customer.startDate)}</span></p>
                <p className="font-medium text-slate-600 mb-1">Drop-off: <span className="font-bold text-slate-900">{formatDateTime(booking.customer.endDate)}</span></p>
                <p className="font-medium text-slate-600 mb-1">Location: <span className="font-bold text-slate-900">{booking.customer.pickupLocation.split(' (')[0]} - {booking.customer.returnLocation.split(' (')[0]}</span></p>
                <p className="font-medium text-slate-600 mb-2">Dest: <span className="font-bold text-slate-900">{booking.customer.destination}</span></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 font-bold text-slate-700">Description</th>
                    <th className="py-4 px-6 font-bold text-slate-700 text-center">Qty / Days</th>
                    <th className="py-4 px-6 font-bold text-slate-700 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="py-5 px-6">
                      <p className="brand font-bold text-lg text-slate-900">{booking.car.name}</p>
                      <p className="text-slate-500 font-medium text-sm">Vehicle Rental Fee (MYR {booking.customer.appliedDailyRate || Math.round((booking.customer.totalPrice - (booking.customer.extraHoursFee || 0))/booking.customer.totalDays)}/day)</p>
                    </td>
                    <td className="py-5 px-6 text-center font-medium text-slate-700">{booking.customer.totalDays} Days</td>
                    <td className="py-5 px-6 text-right font-bold text-lg text-slate-900">MYR {booking.customer.totalPrice - (booking.customer.extraHoursFee || 0)}</td>
                  </tr>
                  {(booking.customer.extraHours > 0) && (
                    <tr className="bg-white">
                      <td className="py-5 px-6">
                        <p className="font-bold text-slate-900">Extra Hours Charge</p>
                        <p className="text-slate-500 font-medium text-sm">Late return / hourly excess</p>
                      </td>
                      <td className="py-5 px-6 text-center font-medium text-slate-700">{booking.customer.extraHours} Hours</td>
                      <td className="py-5 px-6 text-right font-bold text-lg text-slate-900">MYR {booking.customer.extraHoursFee}</td>
                    </tr>
                  )}
                  {(booking.customer.pickupFee > 0 || booking.customer.returnFee > 0) && (
                    <tr className="bg-white">
                      <td className="py-5 px-6">
                        <p className="font-bold text-slate-900">Logistics & Delivery</p>
                        <p className="text-slate-500 font-medium text-sm">Pickup and drop-off delivery fees</p>
                      </td>
                      <td className="py-5 px-6 text-center font-medium text-slate-700">-</td>
                      <td className="py-5 px-6 text-right font-bold text-lg text-slate-900">MYR {booking.customer.pickupFee + booking.customer.returnFee}</td>
                    </tr>
                  )}
                  <tr className="bg-white">
                    <td className="py-5 px-6">
                      <p className="font-bold text-emerald-700">Security Deposit</p>
                      <p className="text-emerald-600 font-medium text-sm">Fully refundable upon vehicle return without damages.</p>
                    </td>
                    <td className="py-5 px-6 text-center font-medium text-slate-700">-</td>
                    <td className="py-5 px-6 text-right font-bold text-lg text-emerald-700">MYR {booking.customer.deposit}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-900">Net Amount Paid</span>
                  <span className="brand text-3xl font-bold text-teal-600">MYR {booking.customer.grandTotal}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-100 text-center font-medium text-slate-400 text-sm">
              <p>Thank you for choosing Afwaja Car Rental.</p>
              <p className="text-xs mt-1">This is a computer-generated document. No physical signature is required.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex justify-center items-center shadow-sm">
            <Printer size={20} className="mr-2"/> Print / Save PDF
          </button>
        </div>
      </div>
    );
  };

  const SupplierVoucherView = () => {
    const booking = bookings.find(b => b.id === currentBookingId);
    if (!booking || booking.supplier.type !== 'supplier') return null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
        <button onClick={() => setCurrentView('admin')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex print:hidden">
          &larr; Back to Dashboard
        </button>
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative" id="printable-voucher">
          <div className="h-4 w-full bg-gradient-to-r from-slate-700 to-slate-900"></div>
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
              <div>
                <img src="https://platform-bcl.bsb-cdn.com/media/2026/03/01KKK1QDM602YYPNC4MPN4YSB1.png" alt="Afwaja Logo" className="h-14 w-auto object-contain mb-2" onError={(e) => { e.target.style.display='none'; }}/>
                <p className="text-slate-500 font-bold">INTERNAL USE ONLY</p>
              </div>
              <div className="sm:text-right">
                <h2 className="brand text-3xl font-bold uppercase tracking-wider text-slate-800 mb-2">SUPPLIER VOUCHER</h2>
                <div className="inline-block bg-slate-100 text-slate-700 px-4 py-1.5 rounded-lg font-bold font-mono text-lg border border-slate-200">
                  PO-{booking.id}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-10 mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Payable To (Supplier)</p>
                <p className="brand text-xl font-bold text-slate-900 mb-1">{booking.supplier.name}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Booking Reference</p>
                <p className="font-medium text-slate-600 mb-1">Customer: <span className="font-bold text-slate-900">{booking.customer.name}</span></p>
                <p className="font-medium text-slate-600 mb-1">Dates: <span className="font-bold text-slate-900">{formatDateTime(booking.customer.startDate)} to {formatDateTime(booking.customer.endDate)}</span></p>
                <p className="font-medium text-slate-600 mb-1">Duration: <span className="font-bold text-slate-900">{booking.customer.totalDays} Days {booking.customer.extraHours > 0 ? `+ ${booking.customer.extraHours} Hours` : ''}</span></p>
                <p className="font-medium text-slate-600 mb-1">Pickup: <span className="font-bold text-slate-900">{booking.customer.pickupLocation.split(' (')[0]}</span></p>
                <p className="font-medium text-slate-600 mb-1">Drop-off: <span className="font-bold text-slate-900">{booking.customer.returnLocation.split(' (')[0]}</span></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 font-bold text-slate-700">Description</th>
                    <th className="py-4 px-6 font-bold text-slate-700 text-right">Amount Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="py-5 px-6">
                      <p className="brand font-bold text-lg text-slate-900">{booking.car.name}</p>
                      <p className="text-slate-500 font-medium text-sm">Rental + Delivery Logistics.</p>
                    </td>
                    <td className="py-5 px-6 text-right brand font-bold text-2xl text-slate-900">MYR {booking.supplier.cost}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
              <div className="text-center"><div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div><p className="font-bold text-slate-600">Prepared By (Afwaja)</p></div>
              <div className="text-center"><div className="border-b-2 border-slate-300 w-48 mx-auto mb-2"></div><p className="font-bold text-slate-600">Received By (Supplier)</p></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center print:hidden">
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg">
            <Printer size={20}/> Print Voucher / Save PDF
          </button>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const pendingReqs = bookings.filter(b => b.status === 'Paid_Pending' && b?.documents?.status === 'verified').length;
    const pendingKyc = bookings.filter(b => b?.documents?.status === 'submitted').length;
    const successfulBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Active' || b.status === 'Return_Pending' || b.status === 'Returned');
    const totalSales = successfulBookings.reduce((sum, b) => sum + b.customer.totalPrice + b.customer.pickupFee + b.customer.returnFee, 0);
    const totalNetProfit = successfulBookings.reduce((sum, b) => sum + Number(b.profit || 0), 0);
    const activeSeasonalPricings = seasonalPricings.filter((season) => getSeasonalPricingStatus(season).label === 'Active');
    const scheduledSeasonalPricings = seasonalPricings.filter((season) => getSeasonalPricingStatus(season).label === 'Scheduled');
    const activeCoupons = coupons.filter((coupon) => getCouponStatus(coupon).label === 'Active');
    const scheduledCoupons = coupons.filter((coupon) => getCouponStatus(coupon).label === 'Scheduled');
    const activePromoPopups = promoPopups.filter((popup) => getPromoPopupStatus(popup).label === 'Active');
    const scheduledPromoPopups = promoPopups.filter((popup) => getPromoPopupStatus(popup).label === 'Scheduled');
    const supplierFilterOptions = [
      { value: 'all', label: 'All Suppliers' },
      { value: 'self', label: 'Own Fleet' },
      ...Array.from(
        new Set(
          bookings
            .filter(b => b.supplier?.type === 'supplier' && b.supplier?.name)
            .map(b => b.supplier.name)
        )
      ).map(name => ({ value: `supplier:${name}`, label: name }))
    ];
    const filteredBookings = [...bookings]
      .filter((booking) => {
        const matchesBookingDate = isWithinDateRange(
          booking.date,
          adminFilters.bookingDateFrom,
          adminFilters.bookingDateTo
        );
        const matchesPickupDate = isWithinDateRange(
          booking.customer?.startDate,
          adminFilters.pickupDateFrom,
          adminFilters.pickupDateTo
        );
        const matchesSupplier =
          adminFilters.supplier === 'all' ||
          (adminFilters.supplier === 'self' && booking.supplier?.type === 'self') ||
          (adminFilters.supplier.startsWith('supplier:') && booking.supplier?.name === adminFilters.supplier.replace('supplier:', ''));

        return matchesBookingDate && matchesPickupDate && matchesSupplier;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-fadeIn font-dm">
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 flex items-center">
            <LayoutDashboard className="mr-3 text-cyan-600 w-8 h-8"/> Admin Portal
          </h1>
          <button onClick={handleInjectDummyData} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all">
            <Sparkles size={16} className="mr-2"/> Inject Dummy Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-yellow-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-yellow-700 font-bold text-sm">Ready To Assign</h3><Bell size={18} className="text-yellow-600"/></div>
            <p className="brand text-4xl font-bold text-slate-900">{pendingReqs}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-purple-700 font-bold text-sm">Pending KYC Review</h3><FileCheck size={18} className="text-purple-600"/></div>
            <p className="brand text-4xl font-bold text-purple-900">{pendingKyc}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-slate-500 font-bold text-sm">Gross Revenue</h3><Wallet size={18} className="text-blue-600"/></div>
            <p className="brand text-2xl font-bold text-slate-900">MYR {totalSales}</p>
          </div>
          <div className="glass-card bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-6 rounded-2xl shadow-md border border-emerald-300">
            <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-emerald-600 text-sm">Net Profit</h3><TrendingUp size={18} className="text-emerald-600"/></div>
            <p className="brand text-3xl font-bold text-emerald-600">MYR {totalNetProfit}</p>
          </div>
        </div>

        <div className="glass-card bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 mb-10">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="brand text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-cyan-600" size={24} /> Seasonal Pricing
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Manage peak season, holiday surcharges, and limited-time seasonal markdowns without deploying new code.</p>
            </div>
            <button
              type="button"
              onClick={openCreateSeasonalModal}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
            >
              <Calendar size={16} className="mr-2" /> Create Season
            </button>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-8 py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Active</p>
              <p className="brand mt-2 text-3xl font-bold text-emerald-700">{activeSeasonalPricings.length}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Scheduled</p>
              <p className="brand mt-2 text-3xl font-bold text-blue-700">{scheduledSeasonalPricings.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Total Seasons</p>
              <p className="brand mt-2 text-3xl font-bold text-slate-900">{seasonalPricings.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full min-w-[980px] text-left text-sm font-medium">
              <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Season</th>
                  <th className="px-6 py-4">Applies To</th>
                  <th className="px-6 py-4">Adjustment</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seasonalPricings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No seasonal pricing rules yet. Create a season and test it with your booking dates.
                    </td>
                  </tr>
                ) : (
                  seasonalPricings.map((season) => {
                    const seasonStatus = getSeasonalPricingStatus(season);
                    return (
                      <tr key={season.docId} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-slate-900">{season.name}</p>
                          <p className="mt-1 max-w-[260px] text-xs text-slate-500">{season.note || 'No internal note'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">{season.customerType === 'both' ? 'Local & Tourist' : season.customerType === 'local' ? 'Local only' : 'Tourist only'}</p>
                          <p className="mt-1 text-xs text-slate-500">{getSeasonalScopeLabel(season)}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-slate-900">{summarizeSeasonalAdjustment(season)}</p>
                          <p className="mt-1 text-xs text-slate-500 capitalize">{season.pricingMode.replace(/_/g, ' ')}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">{formatDateForInputDisplay(season.startDate)}</p>
                          <p className="mt-1 text-xs text-slate-500">to {formatDateForInputDisplay(season.endDate)}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-slate-700">{Number(season.priority || 0)}</td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getCouponStatusClass(seasonStatus.tone)}`}>
                            {seasonStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditSeasonalModal(season)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSeasonalStatus(season)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold ${season.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {season.active ? 'Disable' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 mb-10">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="brand text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-cyan-600" size={24} /> Coupons & Promo Codes
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Create, edit, and disable coupons without deploying new code.</p>
            </div>
            <button
              type="button"
              onClick={openCreateCouponModal}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-cyan-700"
            >
              <Sparkles size={16} className="mr-2" /> Create Coupon
            </button>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-8 py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Active</p>
              <p className="brand mt-2 text-3xl font-bold text-emerald-700">{activeCoupons.length}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Scheduled</p>
              <p className="brand mt-2 text-3xl font-bold text-blue-700">{scheduledCoupons.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Total Coupons</p>
              <p className="brand mt-2 text-3xl font-bold text-slate-900">{coupons.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full min-w-[980px] text-left text-sm font-medium">
              <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Eligibility</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Used / Limit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No coupons yet. Create your first promo code to start.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const couponStatus = getCouponStatus(coupon);
                    return (
                      <tr key={coupon.docId} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 align-top">
                          <p className="font-mono font-bold text-slate-900">{coupon.code}</p>
                          <p className="mt-1 max-w-[240px] text-xs text-slate-500">{coupon.description || 'No internal note'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-slate-900">{summarizeCouponValue(coupon)}</p>
                          <p className="mt-1 text-xs text-slate-500">{coupon.type === 'fixed_amount' ? 'Fixed amount discount' : 'Percentage discount'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">
                            {coupon.customerType === 'both' ? 'Local & Tourist' : coupon.customerType === 'local' ? 'Local only' : 'Tourist only'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {coupon.applicableScope === 'all'
                              ? 'All vehicles'
                              : coupon.applicableScope === 'category'
                                ? `Category: ${coupon.applicableCategory}`
                                : `Vehicle ID: ${coupon.applicableCarId}`}
                          </p>
                          {(Number(coupon.minimumRentalDays || 0) > 0 || Number(coupon.minimumSpend || 0) > 0) && (
                            <p className="mt-1 text-xs text-slate-500">
                              {Number(coupon.minimumRentalDays || 0) > 0 ? `Min ${coupon.minimumRentalDays} day(s)` : 'No min days'}
                              {Number(coupon.minimumSpend || 0) > 0 ? ` | Min MYR ${coupon.minimumSpend}` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">{coupon.validFrom ? formatDateForInputDisplay(coupon.validFrom) : 'Immediate'}</p>
                          <p className="mt-1 text-xs text-slate-500">to {coupon.validUntil ? formatDateForInputDisplay(coupon.validUntil) : 'No expiry'}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-slate-700">
                          {Number(coupon.usedCount || 0)} / {Number(coupon.usageLimit || 0) > 0 ? coupon.usageLimit : 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getCouponStatusClass(couponStatus.tone)}`}>
                            {couponStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditCouponModal(coupon)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleCouponStatus(coupon)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold ${coupon.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {coupon.active ? 'Disable' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 mb-10">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="brand text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="text-cyan-600" size={24} /> Homepage Promo Popups
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Create limited-time homepage popups without touching code again.</p>
            </div>
            <button
              type="button"
              onClick={openCreatePromoPopupModal}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
            >
              <Bell size={16} className="mr-2" /> Create Popup
            </button>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-8 py-5 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Active</p>
              <p className="brand mt-2 text-3xl font-bold text-emerald-700">{activePromoPopups.length}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Scheduled</p>
              <p className="brand mt-2 text-3xl font-bold text-blue-700">{scheduledPromoPopups.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Total Popups</p>
              <p className="brand mt-2 text-3xl font-bold text-slate-900">{promoPopups.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full min-w-[980px] text-left text-sm font-medium">
              <thead className="border-b border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Popup</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Coupon / CTA</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promoPopups.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No promo popups yet. Create one and it will appear on the homepage automatically.
                    </td>
                  </tr>
                ) : (
                  promoPopups.map((popup) => {
                    const popupStatus = getPromoPopupStatus(popup);
                    return (
                      <tr key={popup.docId} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-slate-900">{popup.title}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">{popup.badge || 'No badge'}</p>
                          <p className="mt-1 max-w-[260px] text-xs text-slate-500">{popup.subtitle || 'No subtitle provided.'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">{getPromoPopupAudienceLabel(popup.audience)}</p>
                          <p className="mt-1 text-xs text-slate-500 capitalize">{popup.theme || 'ocean'} theme</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-mono text-slate-900">{popup.couponCode || 'No coupon linked'}</p>
                          <p className="mt-1 text-xs text-slate-500">{popup.ctaLabel || 'No CTA label'} - {popup.ctaAction === 'copy_coupon' ? 'Copy coupon' : popup.ctaAction === 'scroll_fleet' ? 'Scroll to fleet' : 'Dismiss'}</p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-slate-700">{popup.startDate ? formatDateForInputDisplay(popup.startDate) : 'Immediate'}</p>
                          <p className="mt-1 text-xs text-slate-500">to {popup.endDate ? formatDateForInputDisplay(popup.endDate) : 'No expiry'}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-slate-700">{Number(popup.priority || 0)}</td>
                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getCouponStatusClass(popupStatus.tone)}`}>
                            {popupStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditPromoPopupModal(popup)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePromoPopupStatus(popup)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold ${popup.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {popup.active ? 'Disable' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {couponModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="max-h-[calc(100vh-7rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-8rem)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Coupon Manager</p>
                  <h3 className="brand mt-1 text-2xl font-bold">{editingCoupon ? `Edit ${editingCoupon.code}` : 'Create Coupon'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCouponModalOpen(false);
                    setEditingCoupon(null);
                    setCouponForm(EMPTY_COUPON_FORM);
                  }}
                  className="rounded-full border border-white/20 bg-white/10 p-2 hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-8 p-6 sm:p-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Coupon Code</label>
                    <input
                      required
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, code: normalizeCouponCode(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium uppercase focus:ring-2 focus:ring-cyan-500"
                      placeholder="AFWAJA10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Internal Note</label>
                    <input
                      type="text"
                      value={couponForm.description}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Hari Raya / VIP / Partner Campaign"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Discount Type</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">{couponForm.type === 'fixed_amount' ? 'Discount Value (MYR)' : 'Discount Value (%)'}</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step={couponForm.type === 'fixed_amount' ? '1' : '0.1'}
                      value={couponForm.value}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, value: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Status</label>
                    <select
                      value={couponForm.active ? 'active' : 'disabled'}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, active: e.target.value === 'active' }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Valid From</label>
                    <input
                      type="date"
                      value={couponForm.validFrom}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Valid Until</label>
                    <input
                      type="date"
                      value={couponForm.validUntil}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Customer Type</label>
                    <select
                      value={couponForm.customerType}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, customerType: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="both">Local & Tourist</option>
                      <option value="local">Local only</option>
                      <option value="international">Tourist only</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Minimum Rental Days</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minimumRentalDays}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, minimumRentalDays: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Minimum Rental Subtotal (MYR)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minimumSpend}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, minimumSpend: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Applies To</label>
                    <select
                      value={couponForm.applicableScope}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, applicableScope: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All Vehicles</option>
                      <option value="category">By Category</option>
                      <option value="car">Specific Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Vehicle Category</label>
                    <select
                      value={couponForm.applicableCategory}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, applicableCategory: e.target.value }))}
                      disabled={couponForm.applicableScope !== 'category'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100"
                    >
                      <option value="all">Any Category</option>
                      {Array.from(new Set(INITIAL_CARS.map((car) => car.category))).sort().map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Specific Vehicle</label>
                    <select
                      value={couponForm.applicableCarId}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, applicableCarId: e.target.value }))}
                      disabled={couponForm.applicableScope !== 'car'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100"
                    >
                      <option value="all">Any Vehicle</option>
                      {INITIAL_CARS.map((car) => (
                        <option key={car.id} value={car.id}>{car.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Usage Limit</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.usageLimit}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="0 = Unlimited"
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={couponForm.onePerCustomer}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, onePerCustomer: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    One use per customer
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={couponForm.firstBookingOnly}
                      onChange={(e) => setCouponForm((prev) => ({ ...prev, firstBookingOnly: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    First booking only
                  </label>
                </div>

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Preview</p>
                  <p className="mt-2 font-mono text-lg font-bold text-slate-900">{normalizeCouponCode(couponForm.code) || 'CODE'}</p>
                  <p className="mt-1 text-sm text-slate-600">{summarizeCouponValue({ type: couponForm.type, value: couponForm.value || 0 })} on rental subtotal</p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCouponModalOpen(false);
                      setEditingCoupon(null);
                      setCouponForm(EMPTY_COUPON_FORM);
                    }}
                    className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white shadow-md hover:bg-cyan-700"
                  >
                    Save Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {seasonalModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="max-h-[calc(100vh-7rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-8rem)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Seasonal Pricing Manager</p>
                  <h3 className="brand mt-1 text-2xl font-bold">{editingSeasonalPricing ? 'Edit Seasonal Rule' : 'Create Seasonal Rule'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSeasonalModalOpen(false);
                    setEditingSeasonalPricing(null);
                    setSeasonalForm(EMPTY_SEASONAL_FORM);
                  }}
                  className="rounded-full border border-white/20 bg-white/10 p-2 hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSeasonalPricing} className="space-y-8 p-6 sm:p-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Season Name</label>
                    <input
                      required
                      type="text"
                      value={seasonalForm.name}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Hari Raya Peak 2026"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Status</label>
                    <select
                      value={seasonalForm.active ? 'active' : 'disabled'}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, active: e.target.value === 'active' }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Internal Note</label>
                  <textarea
                    rows="3"
                    value={seasonalForm.note}
                    onChange={(e) => setSeasonalForm((prev) => ({ ...prev, note: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    placeholder="Optional note for admin use"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Start Date</label>
                    <input
                      required
                      type="date"
                      value={seasonalForm.startDate}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">End Date</label>
                    <input
                      required
                      type="date"
                      value={seasonalForm.endDate}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Customer Type</label>
                    <select
                      value={seasonalForm.customerType}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, customerType: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="both">Local & Tourist</option>
                      <option value="local">Local only</option>
                      <option value="international">Tourist only</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Scope</label>
                    <select
                      value={seasonalForm.scope}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, scope: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All Vehicles</option>
                      <option value="category">By Category</option>
                      <option value="car">Specific Vehicle</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Priority</label>
                    <input
                      type="number"
                      min="0"
                      value={seasonalForm.priority}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Vehicle Category</label>
                    <select
                      value={seasonalForm.category}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, category: e.target.value }))}
                      disabled={seasonalForm.scope !== 'category'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100"
                    >
                      <option value="all">Any Category</option>
                      {Array.from(new Set(INITIAL_CARS.map((car) => car.category))).sort().map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Specific Vehicle</label>
                    <select
                      value={seasonalForm.carId}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, carId: e.target.value }))}
                      disabled={seasonalForm.scope !== 'car'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100"
                    >
                      <option value="all">Any Vehicle</option>
                      {INITIAL_CARS.map((car) => (
                        <option key={car.id} value={car.id}>{car.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Pricing Mode</label>
                    <select
                      value={seasonalForm.pricingMode}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, pricingMode: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="markup_percentage">Markup Percentage</option>
                      <option value="markdown_percentage">Markdown Percentage</option>
                      <option value="override_price">Override Daily Price</option>
                      <option value="fixed_adjustment">Fixed Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">
                      {seasonalForm.pricingMode === 'override_price'
                        ? 'New Daily Price (MYR)'
                        : seasonalForm.pricingMode === 'fixed_adjustment'
                          ? 'Adjustment Amount (MYR)'
                          : 'Percentage Value (%)'}
                    </label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={seasonalForm.value}
                      onChange={(e) => setSeasonalForm((prev) => ({ ...prev, value: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Preview</p>
                  <p className="mt-2 font-bold text-slate-900">{seasonalForm.name || 'Seasonal rule name'}</p>
                  <p className="mt-1 text-sm text-slate-600">{summarizeSeasonalAdjustment({ pricingMode: seasonalForm.pricingMode, value: seasonalForm.value })}</p>
                  <p className="mt-1 text-xs text-slate-500">{getSeasonalScopeLabel({ scope: seasonalForm.scope, category: seasonalForm.category, carId: seasonalForm.carId })}</p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSeasonalModalOpen(false);
                      setEditingSeasonalPricing(null);
                      setSeasonalForm(EMPTY_SEASONAL_FORM);
                    }}
                    className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-md hover:bg-slate-800"
                  >
                    Save Seasonal Pricing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {promoPopupModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="max-h-[calc(100vh-7rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-8rem)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Promo Popup Manager</p>
                  <h3 className="brand mt-1 text-2xl font-bold">{editingPromoPopup ? 'Edit Promo Popup' : 'Create Promo Popup'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPromoPopupModalOpen(false);
                    setEditingPromoPopup(null);
                    setPromoPopupForm(EMPTY_PROMO_POPUP_FORM);
                  }}
                  className="rounded-full border border-white/20 bg-white/10 p-2 hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePromoPopup} className="space-y-8 p-6 sm:p-8">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Badge / Tag</label>
                    <input
                      required
                      type="text"
                      value={promoPopupForm.badge}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, badge: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Limited Time Only"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Theme</label>
                    <select
                      value={promoPopupForm.theme}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, theme: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="ocean">Ocean</option>
                      <option value="sunset">Sunset</option>
                      <option value="midnight">Midnight</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Title</label>
                    <input
                      required
                      type="text"
                      value={promoPopupForm.title}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="First booking gets 10% OFF"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Urgency Text</label>
                    <input
                      type="text"
                      value={promoPopupForm.urgencyText}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, urgencyText: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Ends this weekend"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Subtitle</label>
                  <textarea
                    rows="3"
                    value={promoPopupForm.subtitle}
                    onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    placeholder="Explain the offer in one concise sentence."
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Coupon Code</label>
                    <input
                      type="text"
                      value={promoPopupForm.couponCode}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, couponCode: normalizeCouponCode(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium uppercase focus:ring-2 focus:ring-cyan-500"
                      placeholder="FIRST10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">CTA Label</label>
                    <input
                      required
                      type="text"
                      value={promoPopupForm.ctaLabel}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                      placeholder="Copy Offer Code"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">CTA Action</label>
                    <select
                      value={promoPopupForm.ctaAction}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, ctaAction: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="copy_coupon">Copy Coupon</option>
                      <option value="scroll_fleet">Scroll to Fleet</option>
                      <option value="dismiss">Dismiss Popup</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Audience</label>
                    <select
                      value={promoPopupForm.audience}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, audience: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All visitors</option>
                      <option value="local">Local pricing mode</option>
                      <option value="international">Tourist pricing mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Priority</label>
                    <input
                      type="number"
                      min="0"
                      value={promoPopupForm.priority}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Status</label>
                    <select
                      value={promoPopupForm.active ? 'active' : 'disabled'}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, active: e.target.value === 'active' }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={promoPopupForm.startDate}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-700">End Date</label>
                    <input
                      type="date"
                      value={promoPopupForm.endDate}
                      onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={promoPopupForm.dismissible}
                    onChange={(e) => setPromoPopupForm((prev) => ({ ...prev, dismissible: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Allow visitor to dismiss this popup
                </label>

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Preview Summary</p>
                  <p className="mt-2 font-bold text-slate-900">{promoPopupForm.title || 'Promo title'}</p>
                  <p className="mt-1 text-sm text-slate-600">{promoPopupForm.subtitle || 'Promo subtitle preview appears here.'}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {getPromoPopupAudienceLabel(promoPopupForm.audience)} · {promoPopupForm.ctaLabel || 'CTA'} · Priority {Number(promoPopupForm.priority || 0)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPromoPopupModalOpen(false);
                      setEditingPromoPopup(null);
                      setPromoPopupForm(EMPTY_PROMO_POPUP_FORM);
                    }}
                    className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-md hover:bg-slate-800"
                  >
                    Save Promo Popup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {managingBooking && !verifyingKyc && !viewingVcr && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="brand text-xl font-bold">Fulfillment Assignment</h3>
                <button onClick={() => setManagingBooking(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-8">
                <div className="bg-cyan-50 p-4 rounded-xl mb-6">
                  <p className="font-bold text-slate-900 text-lg">{managingBooking.car.name}</p>
                  <button onClick={() => handleCopyBroadcast(managingBooking)} className="mt-3 w-full bg-white border border-cyan-200 text-cyan-700 py-2.5 rounded-lg font-bold flex justify-center items-center">
                    <MessageCircle size={18} className="mr-2"/> Copy WhatsApp Blast Message
                  </button>
                </div>

                <div className="flex gap-4 mb-6">
                  <label className={`flex-1 flex justify-center py-3 rounded-xl border-2 cursor-pointer font-bold ${fulfillmentType === 'self' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'}`}>
                    <input type="radio" className="hidden" checked={fulfillmentType === 'self'} onChange={() => setFulfillmentType('self')} /> Own Fleet
                  </label>
                  <label className={`flex-1 flex justify-center py-3 rounded-xl border-2 cursor-pointer font-bold ${fulfillmentType === 'supplier' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'}`}>
                    <input type="radio" className="hidden" checked={fulfillmentType === 'supplier'} onChange={() => setFulfillmentType('supplier')} /> Sub-Supplier
                  </label>
                </div>

                <form onSubmit={handleConfirmSupplier}>
                  {fulfillmentType === 'supplier' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-1">Supplier Name</label>
                          <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" value={supplierDetails.name} onChange={e => setSupplierDetails({...supplierDetails, name: e.target.value})} placeholder="E.g. Din Rental"/>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-1">Phone No.</label>
                          <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" value={supplierDetails.phone} onChange={e => setSupplierDetails({...supplierDetails, phone: e.target.value})} placeholder="E.g. 0123456789"/>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-1">Net Cost (MYR)</label>
                          <input required type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" value={supplierDetails.cost} onChange={e => setSupplierDetails({...supplierDetails, cost: e.target.value})} placeholder="E.g. 150"/>
                        </div>
                      </div>
                      {supplierDetails.cost && (
                        <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                          <p className="font-bold text-emerald-800">Your Profit Margin:</p>
                          <p className="brand text-2xl font-bold text-emerald-600">MYR {(managingBooking.customer.totalPrice + managingBooking.customer.pickupFee + managingBooking.customer.returnFee) - parseFloat(supplierDetails.cost || 0)}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-emerald-800">Using Own Inventory</p>
                        <p className="text-sm text-emerald-600 font-medium">100% Profit Margin</p>
                      </div>
                      <p className="brand text-2xl font-bold text-emerald-600">MYR {managingBooking.customer.totalPrice + managingBooking.customer.pickupFee + managingBooking.customer.returnFee}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 btn-primary text-white py-3.5 rounded-xl font-bold flex justify-center items-center shadow-md">
                      <CheckCircle size={20} className="mr-2"/> Confirm Vehicle
                    </button>
                    <button type="button" onClick={() => handleRejectBooking(managingBooking)} className="px-6 bg-red-100 text-red-700 py-3.5 rounded-xl font-bold hover:bg-red-200 transition-colors flex justify-center items-center">
                      <XCircle size={20} className="mr-1"/> Reject Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {verifyingKyc && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/80 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[calc(100vh-7rem)] overflow-y-auto sm:max-h-[calc(100vh-8rem)]">
              <div className="bg-purple-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="brand text-xl font-bold flex items-center"><FileCheck className="mr-2"/> Identity Verification Review</h3>
                <button onClick={() => setVerifyingKyc(null)} className="text-purple-300 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_320px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-500">Uploaded Documents</p>
                        <h4 className="brand text-2xl font-bold text-slate-900 mt-1">Preview & Verify</h4>
                      </div>
                      <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-bold border border-yellow-200 text-sm">Awaiting Review</div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { key: 'ic', label: verifyingKyc.customer.customerType === 'international' ? 'Passport / ID' : 'MyKad (Front)' },
                        { key: 'license', label: verifyingKyc.customer.customerType === 'international' ? 'Driving License / IDP' : 'Driving License' },
                        { key: 'bill', label: verifyingKyc.customer.customerType === 'international' ? 'Flight / Hotel Booking' : 'Utility Bill' }
                      ].map(doc => (
                        <div key={doc.key} className="border border-slate-200 p-3 rounded-xl bg-slate-50">
                          <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                          <button
                            type="button"
                            onClick={() => setSelectedKycPreview({ src: verifyingKyc.documents?.[doc.key], label: doc.label })}
                            className="w-full text-left"
                          >
                            <div className="aspect-[4/5] bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm p-2 flex items-center justify-center transition hover:border-cyan-300 hover:shadow-md">
                              <img src={verifyingKyc.documents?.[doc.key]} alt={doc.key} className="w-full h-full object-contain" />
                            </div>
                            <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-wider text-cyan-700">Click to enlarge</p>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 lg:sticky lg:top-28 self-start">
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-slate-900">{verifyingKyc.customer.name}</p>
                        {verifyingKyc.customer.customerType === 'international' ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-md font-bold flex items-center border border-blue-200"><Globe size={12} className="mr-1"/> Tourist</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-bold border border-slate-200">Local</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm mt-1">ID: {verifyingKyc.id}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button onClick={() => handleVerifyKyc(verifyingKyc.id, 'verified')} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center items-center shadow-md hover:bg-emerald-700 transition-colors">
                        <CheckCircle size={20} className="mr-2"/> Approve Documents
                      </button>
                      <button onClick={() => handleVerifyKyc(verifyingKyc.id, 'rejected')} className="w-full bg-red-100 text-red-700 py-4 rounded-xl font-bold hover:bg-red-200 transition-colors flex justify-center items-center">
                        <XCircle size={20} className="mr-2"/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedKycPreview && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">KYC Preview</p>
                  <h3 className="brand text-2xl font-bold">{selectedKycPreview.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKycPreview(null)}
                  className="w-11 h-11 rounded-full border border-white/20 bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6">
                <div className="bg-slate-100 rounded-2xl border border-slate-200 min-h-[60vh] flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedKycPreview.src}
                    alt={selectedKycPreview.label}
                    className="max-w-full max-h-[75vh] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingVcr && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/80 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[calc(100vh-7rem)] overflow-y-auto sm:max-h-[calc(100vh-8rem)]">
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="brand text-xl font-bold flex items-center"><Camera className="mr-2"/> Initial VCR & E-Agreement</h3>
                <button onClick={() => setViewingVcr(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_320px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">Vehicle Photos</p>
                        <h4 className="brand text-2xl font-bold text-slate-900 mt-1">Initial VCR Preview</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'front', label: 'Front' },
                        { key: 'back', label: 'Rear' },
                        { key: 'left', label: 'Left' },
                        { key: 'right', label: 'Right' },
                        { key: 'odometer', label: 'Dashboard/Fuel' }
                      ].map(doc => (
                        <div key={doc.key} className="border border-slate-200 p-2 rounded-xl bg-slate-50">
                          <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                          <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden">
                            <img src={viewingVcr.vcr?.[doc.key]} alt={doc.key} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 lg:sticky lg:top-28 self-start">
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-5">
                      <p className="font-bold text-lg text-slate-900">{viewingVcr.car.name}</p>
                      <p className="text-slate-500 text-sm">Customer: {viewingVcr.customer.name}</p>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex items-center justify-between">
                      <div>
                         <p className="text-xs font-bold text-slate-500 uppercase mb-2">Customer Digital Signature</p>
                         <div className="bg-white border border-slate-200 rounded-lg p-2 inline-block">
                            {viewingVcr.vcr?.signature ? (
                               <img src={viewingVcr.vcr.signature} alt="Signature" className="h-20 object-contain" />
                            ) : <span className="text-sm text-slate-400">No Signature</span>}
                         </div>
                      </div>
                      <CheckCircle size={40} className="text-emerald-500 opacity-20" />
                    </div>

                    <button onClick={() => setViewingVcr(null)} className="w-full bg-slate-200 text-slate-800 py-4 rounded-xl font-bold hover:bg-slate-300 transition-colors">
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingReturnVcr && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/80 p-4 pt-24 pb-6 backdrop-blur-sm sm:pt-28">
            <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden max-h-[calc(100vh-7rem)] overflow-y-auto sm:max-h-[calc(100vh-8rem)]">
              <div className="bg-orange-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
                <h3 className="brand text-xl font-bold flex items-center"><Undo2 className="mr-2"/> Return VCR Inspection</h3>
                <button onClick={() => setViewingReturnVcr(null)} className="text-orange-300 hover:text-white"><X size={24}/></button>
              </div>
              <div className="p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_320px]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Return Photos</p>
                        <h4 className="brand text-2xl font-bold text-slate-900 mt-1">Review Before Refund</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { key: 'front', label: 'Front' },
                        { key: 'back', label: 'Rear' },
                        { key: 'left', label: 'Left' },
                        { key: 'right', label: 'Right' },
                        { key: 'odometer', label: 'Dashboard/Fuel' }
                      ].map(doc => (
                        <div key={doc.key} className="border border-slate-200 p-2 rounded-xl bg-slate-50">
                          <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                          <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden">
                            <img src={viewingReturnVcr.returnVcr?.[doc.key]} alt={doc.key} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 lg:sticky lg:top-28 self-start">
                    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-5">
                      <p className="font-bold text-lg text-slate-900">{viewingReturnVcr.car.name}</p>
                      <p className="text-slate-500 text-sm">Customer: {viewingReturnVcr.customer.name}</p>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-500">Deposit to Refund</p>
                        <p className="brand text-2xl font-bold text-emerald-600">MYR {viewingReturnVcr.customer.deposit}</p>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                      <p className="text-sm text-orange-800 font-medium"><AlertTriangle className="inline w-4 h-4 mr-1"/> Please review the return photos below. Verify there are no new damages before refunding the deposit.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button onClick={() => handleApproveReturnAndRefund(viewingReturnVcr)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center shadow-md">
                        <CheckCircle size={20} className="mr-2"/> Approve & Refund
                      </button>
                      <button onClick={() => setViewingReturnVcr(null)} className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors flex justify-center items-center">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="brand text-2xl font-bold text-slate-900">Booking & Action Logs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Booking Date</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={adminFilters.bookingDateFrom}
                    onChange={(e) => setAdminFilters(prev => ({ ...prev, bookingDateFrom: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                  <input
                    type="date"
                    value={adminFilters.bookingDateTo}
                    onChange={(e) => setAdminFilters(prev => ({ ...prev, bookingDateTo: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>From</span>
                  <span>To</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Pickup Date</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={adminFilters.pickupDateFrom}
                    onChange={(e) => setAdminFilters(prev => ({ ...prev, pickupDateFrom: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                  <input
                    type="date"
                    value={adminFilters.pickupDateTo}
                    onChange={(e) => setAdminFilters(prev => ({ ...prev, pickupDateTo: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>From</span>
                  <span>To</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Supplier</label>
                <select
                  value={adminFilters.supplier}
                  onChange={(e) => setAdminFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  {supplierFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[1640px] table-fixed text-left font-medium text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 w-20">No.</th>
                  <th className="px-6 py-5 w-24">Job ID</th>
                  <th className="px-6 py-5 w-[360px]">Customer</th>
                  <th className="px-6 py-5 w-36">Booking Date</th>
                  <th className="px-6 py-5 w-36">Pickup Date</th>
                  <th className="px-6 py-5 w-36">Return Date</th>
                  <th className="px-6 py-5 w-32">Status</th>
                  <th className="px-6 py-5 w-32">KYC Status</th>
                  <th className="px-6 py-5 w-36">Supplier / Cost</th>
                  <th className="px-6 py-5 w-28">Net Profit</th>
                  <th className="px-6 py-5 w-40 text-center sticky right-0 z-10 bg-slate-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan="11" className="px-8 py-16 text-center text-slate-400">No records found.</td></tr>
                ) : (
                  filteredBookings.map((booking, index) => (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="font-bold text-slate-700 font-mono">{booking.id}</span></td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex max-w-[360px] flex-col items-start gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{booking.customer.name}</p>
                            {booking.customer.customerType === 'international' ? (
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-blue-200" title="International Tourist"><Globe size={10} className="mr-1"/> Tourist</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200">Local</span>
                            )}
                          </div>
                          <p className="font-bold text-cyan-600">{booking.car.name}</p>
                          {booking.customer.coupon?.code && booking.customer.coupon?.discountAmount > 0 && (
                            <p className="text-xs font-bold text-emerald-600">
                              Coupon: {booking.customer.coupon.code} (- MYR {booking.customer.coupon.discountAmount})
                            </p>
                          )}
                          <div className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-bold">Refund Details</p>
                            <p className="text-xs text-slate-700 font-semibold mt-1">
                              {booking.customer.customerType === 'local' ? 'Online bank transfer' : 'Credit / Debit card reversal'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 break-all">{getRefundDetailsLabel(booking.customer)}</p>
                            {booking.customer.customerType === 'local' && booking.customer.accountHolderName && (
                              <p className="text-xs text-slate-500 mt-0.5 break-words">Holder: {booking.customer.accountHolderName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{formatDateTime(booking.date)}</span>
                          <span className="text-xs text-slate-500">Created</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{formatDateTime(booking.customer.startDate)}</span>
                          <span className="text-xs text-slate-500">Pickup</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{formatDateTime(booking.customer.endDate)}</span>
                          <span className="text-xs text-slate-500">Return</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {booking.status === 'Payment_Pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Payment Pending</span>}
                        {booking.status === 'Payment_Failed' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Payment Failed</span>}
                        {booking.status === 'Paid_Pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Pending Fulfillment</span>}
                        {booking.status === 'Completed' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Confirmed</span>}
                        {booking.status === 'Active' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><Car size={12} className="mr-1"/> Active</span>}
                        {booking.status === 'Return_Pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><Clock size={12} className="mr-1"/> Return Review</span>}
                        {booking.status === 'Returned' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Refunded Dep.</span>}
                        {booking.status === 'Cancelled' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Cancelled</span>}
                        {booking.status === 'Refunded' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Full Refund</span>}
                      </td>
                      <td className="px-6 py-4">
                         {(!booking.documents || booking.documents.status === 'pending') && <span className="text-slate-400 text-xs font-bold">Not Uploaded</span>}
                         {booking.documents?.status === 'submitted' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"><Clock size={12} className="mr-1"/> Needs Review</span>}
                         {booking.documents?.status === 'verified' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle size={12} className="mr-1"/> Verified</span>}
                         {booking.documents?.status === 'rejected' && <span className="text-red-500 text-xs font-bold">Rejected</span>}
                      </td>
                      <td className="px-6 py-4">
                        {(booking.status === 'Completed' || booking.status === 'Active' || booking.status === 'Return_Pending' || booking.status === 'Returned') ? (
                          <div>
                            <p className="text-xs font-bold text-slate-600">{booking.supplier.type === 'self' ? 'Own Fleet' : booking.supplier.name}</p>
                            {booking.supplier.type === 'supplier' && booking.supplier.phone && <p className="text-xs text-slate-500">Phone: {booking.supplier.phone}</p>}
                            {booking.supplier.type === 'supplier' && <p className="text-xs text-slate-500">Cost: MYR {booking.supplier.cost}</p>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-lg text-emerald-600">
                        {(booking.status === 'Completed' || booking.status === 'Active' || booking.status === 'Return_Pending' || booking.status === 'Returned') ? `MYR ${booking.profit}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center sticky right-0 z-10 bg-white">
                        <div className="flex flex-col items-center gap-2 min-w-[120px]">
                        
                        {booking.status === 'Paid_Pending' && booking.documents?.status === 'verified' && (
                          <button onClick={() => { setManagingBooking(booking); setFulfillmentType('supplier'); }} className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-cyan-700 w-full shadow-sm">
                            Assign Car
                          </button>
                        )}
                        
                        {(booking.status === 'Paid_Pending' || booking.status === 'Completed') && booking.documents?.status === 'submitted' && (
                          <button onClick={() => setVerifyingKyc(booking)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-purple-700 w-full shadow-sm flex justify-center items-center">
                            <FileCheck size={14} className="mr-1"/> Review KYC
                          </button>
                        )}

                        {(booking.status === 'Active' || booking.status === 'Return_Pending') && booking.vcr?.status === 'completed' && (
                          <>
                            <button onClick={() => setViewingVcr(booking)} className="bg-slate-800 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center w-full">
                              <Camera size={14} className="mr-1"/> View Initial VCR
                            </button>
                          </>
                        )}

                        {booking.status === 'Cancelled' && (
                          <button onClick={() => handleFullRefund(booking)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center w-full mt-1">
                            <Wallet size={14} className="mr-1"/> Full Refund
                          </button>
                        )}

                        {booking.status === 'Return_Pending' && booking.returnVcr?.status === 'submitted' && (
                          <button onClick={() => setViewingReturnVcr(booking)} className="bg-orange-100 text-orange-800 border border-orange-300 px-3 py-2 rounded-lg font-bold text-xs hover:bg-orange-200 transition-colors shadow-sm flex items-center justify-center w-full mt-1">
                            <Undo2 size={14} className="mr-1"/> Review Return
                          </button>
                        )}
                        
                        {(booking.status === 'Completed' || booking.status === 'Active' || booking.status === 'Return_Pending' || booking.status === 'Returned') && booking.supplier.type === 'supplier' && (
                           <button onClick={() => handleViewSupplierVoucher(booking.id)} className="flex items-center text-slate-600 hover:text-cyan-700 text-xs font-bold bg-slate-100 hover:bg-cyan-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors mt-1 w-full justify-center">
                             <FilePlus size={14} className="mr-1"/> Supplier PO
                           </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const TermsView = ({ onBack } = {}) => (
    <div className="max-w-4xl mx-auto px-4 py-24 animate-fadeIn font-dm">
      <button onClick={() => onBack ? onBack() : setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
        &larr; {onBack ? 'Back to Booking Form' : 'Back to Home'}
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 sm:p-12">
        <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-6">Terms & Conditions of Rental</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="text-cyan-600"/> 1. Booking & Cancellation Policy</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Online bookings will be confirmed via email within one (1) hour. If the vehicle is unavailable, a full refund will be issued.</li>
              <li><strong>Cancellation:</strong> 24 hours before pickup = Full Refund. Less than 24 hours or No Show = Strictly No Refund.</li>
              <li>Date changes or rescheduling are subject to vehicle availability.</li>
              <li><strong>Vehicle Allocation & Display:</strong> Images shown on the website are for illustration and reference purposes only. The actual vehicle assigned may differ in color and minor specifications, but we guarantee the same car model will be provided.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><User className="text-cyan-600"/> 2. Driver Requirements & Licenses</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Drivers must be between <strong>21 to 65 years old</strong>. Probationary (P) licenses are strictly not allowed.</li>
              <li>Foreigners with a valid driving license in English are permitted to drive in Malaysia for a maximum of 3 months.</li>
              <li><strong>Additional Drivers:</strong> Subject to a charge of RM10/day. All additional drivers must be registered. Unregistered drivers found driving the vehicle will incur a <strong>RM500 penalty</strong>.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><FileCheck className="text-cyan-600"/> 3. Verification & Pickup (KYC)</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Only the individual who made the booking is allowed to collect the vehicle. Required documents: IC/Passport, Driving License, and Utility Bill/Business Card.</li>
              <li>Renters <strong>must inspect the vehicle (VCR)</strong> upon collection. Any damages not reported immediately will be considered the renter's responsibility.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck className="text-cyan-600"/> 4. Payment Channels, Security Deposit & Refunds</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Payment Channels:</strong> Malaysian citizens must complete payments securely via <strong>FPX (Online Banking)</strong>. International tourists must complete payments via <strong>Credit/Debit Card</strong> to facilitate seamless international deposit refunds.</li>
              <li>A security deposit of RM100 to RM400 (depending on the car category) is required before handover.</li>
              <li><strong>For Malaysian Citizens:</strong> The deposit will be refunded via online bank transfer within <strong>3 to 14 working days</strong> after the vehicle is returned.</li>
              <li><strong>For International Tourists:</strong> The deposit will be refunded/reversed directly to the <strong>Credit/Debit Card</strong> used during booking. The processing time is subject to your respective bank's policy (usually 3-14 days).</li>
              <li>All refunds are strictly subject to the vehicle being returned in good condition, free from new damages, and clear of any traffic summons.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Clock className="text-cyan-600"/> 5. Time, Mileage & Delivery</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Early Return:</strong> No refunds will be provided for returning the vehicle earlier than the agreed rental period.</li>
              <li><strong>Late Return:</strong> An extra hour charge of <strong>10% of the daily rate</strong> applies per hour. If the extra charges exceed the daily rate, a full 1-day charge will apply.</li>
              <li><strong>Mileage Limit:</strong> Rentals include a limit of 300 km per day. Excess mileage is charged at RM1 per km.</li>
                  <li><strong>Delivery & Pickup Fees:</strong>
                    <ul className="list-[circle] pl-5 mt-1 space-y-1">
                      <li>Delivery and return fees are calculated automatically based on the distance between your selected location and <strong>Afwaja Car Rental HQ, Cyberjaya</strong>.</li>
                      <li>The current rate is <strong>RM2.5 per km</strong> for each trip.</li>
                      <li>If you choose a different return location, the return fee will be calculated separately based on the selected drop-off point.</li>
                      <li>The estimated delivery and return fees will be shown before you proceed with your booking.</li>
                    </ul>
                  </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="text-cyan-600"/> 6. Insurance & Accident Excess</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>All vehicles are insured. However, in the event of an accident, the renter is responsible for the Non-Waivable Excess according to the vehicle group:
                <ul className="list-[circle] pl-5 mt-2 space-y-1 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <li><strong>Group A (Max RM4,000):</strong> Perodua Axia, Myvi, Bezza, Ativa</li>
                  <li><strong>Group B (Max RM6,000):</strong> Toyota Yaris, Vios, Honda City (Hatchback/Sedan)</li>
                  <li><strong>Group C (Max RM10,000):</strong> Perodua Aruz, Alza, Proton X50, X70, Honda HRV, CRV, Nissan Serena, Mitsubishi Xpander, Toyota Innova Zenix</li>
                  <li><strong>Group D (Max RM20,000):</strong> Toyota Vellfire, Hyundai Staria, Starex</li>
                </ul>
              </li>
              <li>A police report must be lodged within 24 hours. An Accident Management Fee (RM1,000 - RM5,000) applies for insurance claims, communication, and loss of income.</li>
              <li><strong>Exceptions:</strong> Insurance DOES NOT cover negligence, tire punctures, wrong fuel, dead batteries due to negligence, undercarriage, glass, or roof damages. Insurance only covers moving collisions between two vehicles.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><XCircle className="text-cyan-600"/> 7. Penalties & Additional Charges</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Fuel & Cleanliness:</strong> Must be returned at the same fuel level (or face up to RM300 charge). Extremely dirty vehicles will be charged RM300.</li>
              <li><strong>Prohibited Items:</strong> Smoking, vaping, and carrying pets are strictly prohibited (RM500 penalty applies).</li>
              <li><strong>Traffic Fines:</strong> Renters are fully responsible for PDRM, JPJ, and local council fines. A RM300 penalty applies for late settlements.</li>
              <li>Any use of the vehicle for criminal activities makes the renter liable for the full value of the vehicle.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Shield className="text-cyan-600"/> 8. Personal Data & Privacy</h3>
            <p>By proceeding with the rental, the renter officially agrees to all Terms and Conditions stated above. Personal data provided may be shared with relevant agencies for security and debt collection purposes in the event of payment default.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm font-medium text-slate-500">
          &copy; {new Date().getFullYear()} Afwaja Car Rental. These Terms & Conditions are subject to amendment from time to time without prior notice.
        </div>
      </div>
    </div>
  );

  const PrivacyPolicyView = ({ onBack } = {}) => (
    <div className="max-w-4xl mx-auto px-4 py-24 animate-fadeIn font-dm">
      <button onClick={() => onBack ? onBack() : setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
        &larr; {onBack ? 'Back to Booking Form' : 'Back to Home'}
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 sm:p-12">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 font-medium">In compliance with the Personal Data Protection Act 2010 (PDPA) Malaysia.</p>
        </div>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Shield className="text-cyan-600 w-5 h-5"/> Introduction</h3>
            <p>Afwaja Car Rental ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, process, and protect your personal data when you use our website, mobile application, or rental services.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><FileText className="text-cyan-600 w-5 h-5"/> Information We Collect</h3>
            <p className="mb-2">To provide you with secure and reliable rental services, we collect the following (KYC - Know Your Customer) data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity Information:</strong> Name, National ID (MyKad), Passport details, Date of Birth.</li>
              <li><strong>Contact Information:</strong> Email address, Phone number, Residential address.</li>
              <li><strong>Driving Records:</strong> Driving license details (Local or International).</li>
              <li><strong>Financial Data:</strong> Bank account details (for deposit refunds). Payment card details are handled securely by our payment gateways (ToyyibPay/Stripe) and are NOT stored on our servers.</li>
              <li><strong>Other:</strong> Utility bills or travel itineraries for residential verification.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Settings className="text-cyan-600 w-5 h-5"/> How We Use Your Data</h3>
            <p>Your personal data is strictly used for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Processing your car rental bookings and agreements.</li>
              <li>Verifying your identity for insurance coverage and fraud prevention.</li>
              <li>Processing security deposit refunds.</li>
              <li>Communicating with you regarding your booking status or emergencies.</li>
              <li>Complying with legal obligations (e.g., PDRM or JPJ traffic summons).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Users className="text-cyan-600 w-5 h-5"/> Data Sharing & Disclosure</h3>
            <p>We do not sell your personal data. We only share your data with trusted third parties under the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Authorities:</strong> Police (PDRM) or road transport departments (JPJ) in the event of accidents, criminal investigations, or unpaid traffic summons.</li>
              <li><strong>Insurance Providers:</strong> For processing claims in the event of an accident.</li>
              <li><strong>Payment Gateways:</strong> To facilitate secure online transactions.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><CheckCircle className="text-cyan-600 w-5 h-5"/> Data Security</h3>
            <p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, or disclosure. All uploaded KYC documents are securely stored in our cloud storage and automatically watermarked to prevent misuse.</p>
          </section>

          <section>
            <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
              If you have any questions regarding your personal data or wish to request data deletion after your rental is fully completed, please contact us at <strong>afwajatrading@gmail.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );

  const FaqView = () => {
    const faqs = [
      {
        q: "What documents do I need to rent a car?",
        a: "For Malaysians: MyKad, a valid Class D Driving License, and a latest utility bill. For International Tourists: Passport, valid Driving License / International Driving Permit (IDP), and Flight/Hotel itinerary."
      },
      {
        q: "Do I need to pay a security deposit?",
        a: "Yes, a refundable security deposit between RM100 to RM400 is required depending on the vehicle group. It will be fully refunded within 3-14 working days after the vehicle is returned without damages or summons."
      },
      {
        q: "Do you provide car delivery to the airport or hotel?",
        a: "Absolutely! We deliver to KLIA/KLIA2, KL Sentral, TBS, and various zones within the Klang Valley. Delivery fees vary based on the distance from our Cyberjaya HQ."
      },
      {
        q: "Can I drive the rental car out of Malaysia?",
        a: "No, our rental vehicles are strictly permitted to be driven within Peninsular Malaysia only. Driving into Thailand or Singapore is prohibited."
      },
      {
        q: "What happens if I return the car late?",
        a: "A late return fee of 10% of your daily rental rate is charged per hour. If the accumulated hourly charges exceed the daily rate, you will be charged for a full day."
      },
      {
        q: "What should I do in case of an accident or breakdown?",
        a: "Please ensure your safety first. Then, contact our 24/7 support team immediately. For accidents, you must lodge a police report within 24 hours to proceed with insurance claims."
      }
    ];

    return (
      <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
        <button onClick={() => setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
          &larr; Back to Home
        </button>
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-cyan-600" />
          </div>
          <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-600 text-lg">Everything you need to know about renting with Afwaja.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:border-cyan-300 transition-colors">
              <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-start gap-3">
                <span className="text-cyan-500 font-bold text-xl leading-none">Q.</span> {faq.q}
              </h3>
              <div className="pl-7 text-slate-600 leading-relaxed">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-slate-900 text-white rounded-3xl p-8 text-center shadow-xl">
          <h3 className="brand text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="text-slate-400 mb-6">Our support team is ready to help you 24/7.</p>
          <button onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-colors">
            Contact Us
          </button>
        </div>
      </div>
    );
  };

  const ContactView = () => (
    <div className="max-w-3xl mx-auto px-4 py-24 animate-fadeIn font-dm">
      <button onClick={() => setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
        &larr; Back to Home
      </button>

      <div className="text-center mb-12">
        <h1 className="brand text-4xl sm:text-5xl font-bold text-slate-900 mb-4">Get in Touch</h1>
        <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto">
          Whether you need help with your booking, have a special request, or require roadside assistance, our team is always here for you.
        </p>
      </div>

      <div className="space-y-6 max-w-xl mx-auto">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-cyan-300 transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="text-cyan-600 w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xl mb-1">Phone / WhatsApp</h4>
            <p className="text-slate-600 mb-2">Mon-Sun: 24/7 Support</p>
            <a href="tel:0338530080" className="brand text-3xl font-bold text-cyan-600 hover:underline">03-38530080</a>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-cyan-300 transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="text-cyan-600 w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xl mb-1">Email Address</h4>
            <p className="text-slate-600 mb-2">Drop us a line anytime.</p>
            <a href="mailto:afwajatrading@gmail.com" className="brand text-xl font-bold text-cyan-600 hover:underline">afwajatrading@gmail.com</a>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-cyan-300 transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="text-cyan-600 w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xl mb-1">HQ Location</h4>
            <p className="text-slate-600 leading-relaxed text-lg">
              Cyberjaya,<br />
              Selangor Darul Ehsan,<br />
              Malaysia
            </p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:border-cyan-300 transition-all hover:-translate-y-1">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Globe className="text-cyan-600 w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xl mb-1">Social Media</h4>
            <p className="text-slate-600 mb-3 text-lg">Follow us for latest updates & promos.</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                  <a href="https://instagram.com/carrentalcyber" target="_blank" rel="noopener noreferrer" className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg brand font-bold text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200 transition-colors">Instagram</a>
                  <a href="https://tiktok.com/@afwajacarrental" target="_blank" rel="noopener noreferrer" className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg brand font-bold text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200 transition-colors">TikTok</a>
                  <a href="https://facebook.com/afwajatrading" target="_blank" rel="noopener noreferrer" className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg brand font-bold text-cyan-600 hover:bg-cyan-50 hover:border-cyan-200 transition-colors">Facebook</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg font-sans text-slate-800 selection:bg-cyan-200">
      {Navbar()}
      
      <div className="fixed bottom-6 right-6 z-50 space-y-3 font-dm">
        {notifications.map(note => (
          <div key={note.id} className={`flex items-center p-4 pr-6 rounded-2xl shadow-xl text-white animate-slideInRight border ${
            note.type === 'error' ? 'bg-red-600 border-red-500' : 
            note.type === 'info' ? 'bg-cyan-600 border-cyan-500' : 'bg-emerald-600 border-emerald-500'
          }`}>
            <Bell size={20} className="mr-3"/>
            <p className="font-bold tracking-wide">{note.message}</p>
          </div>
        ))}
      </div>

      {locationModal.open && (
        <div className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-sm flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300 font-bold">Location Search</p>
                <h3 className="brand text-2xl font-bold mt-1">
                  {locationModal.field === 'pickup' ? 'Choose Pickup Location' : 'Choose Return Location'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeLocationPicker}
                className="w-11 h-11 rounded-full border border-white/15 bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <button
                type="button"
                onClick={handleSelectHqLocation}
                className="w-full rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-left hover:border-cyan-400 transition"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 font-bold mb-1">Quick Option</p>
                <p className="font-bold text-slate-900">Use Afwaja Car Rental HQ (Cyberjaya)</p>
                <p className="text-sm text-slate-500 mt-1">Self pickup / return at HQ - MYR 0</p>
              </button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-cyan-500">
                <Search size={18} className="text-cyan-600 flex-shrink-0" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Type address, hotel, airport, or landmark"
                  className="w-full bg-transparent outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Recommended Locations</p>
                  {locationSearchLoading && <RefreshCw size={16} className="text-cyan-600 animate-spin" />}
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {locationSearchError ? (
                    <div className="px-5 py-6 text-sm text-red-600 font-medium">{locationSearchError}</div>
                  ) : locationSuggestions.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-slate-500 font-medium">
                      {locationQuery.trim().length < 3
                        ? 'Start typing at least 3 characters to see location suggestions.'
                        : 'No matching locations found. Try a more complete address or landmark.'}
                    </div>
                  ) : (
                    locationSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.place_id || suggestion.description || 'loc'}-${index}`}
                        type="button"
                        onClick={() => handleSelectSuggestedLocation(suggestion)}
                        className="w-full px-5 py-4 text-left border-b border-slate-100 last:border-b-0 hover:bg-cyan-50 transition"
                      >
                        <p className="font-bold text-slate-900">
                          {suggestion.structured_formatting?.main_text || suggestion.description || 'Suggested location'}
                        </p>
                        {suggestion.structured_formatting?.secondary_text && (
                          <p className="text-sm text-slate-500 mt-1">{suggestion.structured_formatting.secondary_text}</p>
                        )}
                        <p className="text-sm text-slate-500 mt-1">
                          Delivery / return fee will be calculated automatically from Cyberjaya HQ.
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="h-full">
        {currentView === 'home' && HomeView()}
        {currentView === 'booking' && BookingView()}
        {currentView === 'request-success' && RequestSuccessView()}
        {currentView === 'thank-you' && ThankYouView()} 
        {currentView === 'track' && CustomerTrackView()}
        {currentView === 'payment' && PaymentView()}
        {currentView === 'invoice' && InvoiceView()}
        {currentView === 'admin' && AdminDashboard()}
        {currentView === 'supplier-voucher' && SupplierVoucherView()}
        {currentView === 'terms' && TermsView()}
        {currentView === 'privacy' && PrivacyPolicyView()}
        {currentView === 'faq' && FaqView()}
        {currentView === 'contact' && ContactView()}
      </main>

      {showPromoPopup && activePromoPopup && currentView === 'home' && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] sm:inset-x-auto sm:right-6 sm:bottom-6">
          <div className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-[28px] border backdrop-blur-xl ${getPromoPopupThemeClasses(activePromoPopup.theme).shell}`}>
            <div className={`${getPromoPopupThemeClasses(activePromoPopup.theme).hero} px-5 py-4 text-white`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${getPromoPopupThemeClasses(activePromoPopup.theme).badgeText}`}>
                    {activePromoPopup.badge || 'Special Offer'}
                  </p>
                  <h3 className="brand mt-2 text-2xl font-bold leading-tight">{activePromoPopup.title}</h3>
                </div>
                {activePromoPopup.dismissible !== false && (
                  <button
                    type="button"
                    onClick={handleDismissPromoPopup}
                    className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    aria-label="Close promo popup"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <p className="text-sm leading-relaxed text-slate-600">{activePromoPopup.subtitle}</p>
              {activePromoPopup.urgencyText && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {activePromoPopup.urgencyText}
                </p>
              )}
              {activePromoPopup.couponCode && (
                <div className={`rounded-2xl border px-4 py-3 ${getPromoPopupThemeClasses(activePromoPopup.theme).codeWrap}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Use Coupon Code</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className={`font-mono text-lg font-bold ${getPromoPopupThemeClasses(activePromoPopup.theme).codeText}`}>
                      {activePromoPopup.couponCode}
                    </span>
                    {activePromoPopupCoupon && (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getPromoPopupThemeClasses(activePromoPopup.theme).chip}`}>
                        {summarizeCouponValue(activePromoPopupCoupon)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePromoPopupPrimaryAction}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {activePromoPopup.ctaAction === 'copy_coupon' ? <Copy size={16} className="mr-2" /> : <ChevronRight size={16} className="mr-2" />}
                  {activePromoPopup.ctaLabel}
                </button>
                {activePromoPopup.dismissible !== false && (
                  <button
                    type="button"
                    onClick={handleDismissPromoPopup}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Maybe later
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP LOGIN ADMIN KETIKA BUTANG ADMIN DITEKAN */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl flex flex-col items-center max-w-sm w-full text-center shadow-2xl relative">
            <button onClick={() => { setShowAdminLogin(false); setAdminPin(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20}/>
            </button>
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="brand text-xl font-bold text-slate-900 mb-2">Admin Access</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">Enter your security PIN to access the dashboard.</p>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-bold text-center tracking-widest text-lg mb-4"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdminLogin();
              }}
            />
            <button onClick={handleAdminLogin} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md">
              Unlock Dashboard
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap');
        * { scroll-behavior: smooth; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        .brand { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; }
        .gradient-bg { background: linear-gradient(135deg, #f8fafc 0%, #ecfeff 50%, #f8fafc 100%); }
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .btn-primary { background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(8, 145, 178, 0.4); }
        .car-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px -10px rgba(8, 145, 178, 0.15); }
        .nav-link { position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: linear-gradient(90deg, #0891b2, #0d9488); transition: width 0.3s ease; }
        .nav-link:hover::after, .nav-link.active::after { width: 100%; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(8, 145, 178, 0.3); } 50% { box-shadow: 0 0 35px rgba(13, 148, 136, 0.6); } }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .float-animation { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
        @media print {
          body * { visibility: hidden; background: white !important; }
          #printable-voucher, #printable-voucher *, #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-voucher, #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; margin: 0; padding: 0; }
        }
      `}} />
    </div>
  );
}
