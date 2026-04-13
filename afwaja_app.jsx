import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
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
const fallbackConfig = {
  apiKey: "AIzaSyAVcnZldDUR53E9jibUmv0z12I3zAZUo8k",
  authDomain: "afwaja-car-rental.firebaseapp.com",
  projectId: "afwaja-car-rental",
  storageBucket: "afwaja-car-rental.firebasestorage.app",
  messagingSenderId: "646120573637",
  appId: "1:646120573637:web:82f91fff224e7bf7b77eac",
  measurementId: "G-2T6TF6T344"
};
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : fallbackConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'afwaja-car-rental-app';

// --- DATA KENDARAAN (MOCK DATA) ---
const INITIAL_CARS = [
  { id: 1, name: 'Perodua Axia (New)', category: 'Compact', priceLocal: 135, priceTourist: 160, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-sky-400 to-cyan-500', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKWYYY464W0Y8R13A38NSE9R.png' },
  { id: 2, name: 'Perodua Axia (Old)', category: 'Compact', priceLocal: 120, priceTourist: 145, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2019, color: 'from-slate-400 to-slate-600', image: 'https://platform-bcl.bsb-cdn.com/media/2026/04/01KN3CJ7HC79QPZVYHBY70C1K0.png' },
  { id: 3, name: 'Perodua Myvi', category: 'Compact', priceLocal: 160, priceTourist: 190, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-cyan-500 to-teal-600', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKWZJG900QSQ5EYS55YN89G3.png' },
  { id: 4, name: 'Perodua Bezza', category: 'Sedan', priceLocal: 160, priceTourist: 190, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-blue-500 to-blue-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKWYYV66KVSR5N9F1HJCE4AB.png' },
  { id: 5, name: 'Perodua Ativa', category: 'SUV', priceLocal: 230, priceTourist: 275, depositLocal: 100, depositTourist: 200, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-red-500 to-red-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX072973PBJTX8HP6PPYB8D.png' },
  { id: 6, name: 'Toyota Yaris', category: 'Compact', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-green-500 to-emerald-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX0MMR29TEHHNPFD5YJ5W40.png' },
  { id: 7, name: 'Honda City Hatchback', category: 'Compact', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-gray-700 to-gray-900', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX151H50FK6SNJPM3N3XMF1.png' },
  { id: 8, name: 'Toyota Vios (3rd Gen)', category: 'Sedan', priceLocal: 200, priceTourist: 240, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2019, color: 'from-slate-500 to-slate-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX33KNKB5BC1N7YE2R5QPBK.png' },
  { id: 9, name: 'Toyota Vios (4th Gen)', category: 'Sedan', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-red-600 to-rose-800', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX33MEZV13X1DMJMSHTV6QS.png' },
  { id: 10, name: 'Honda City Sedan', category: 'Sedan', priceLocal: 250, priceTourist: 300, depositLocal: 200, depositTourist: 400, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-slate-800 to-black', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKX33JX62ETJ8Y2KK36H3N7R.png' },
  { id: 11, name: 'Perodua Aruz', category: 'SUV', priceLocal: 280, priceTourist: 335, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-teal-600 to-teal-800', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8ZPC5QE8PXWPHZH4T2M1.png' },
  { id: 12, name: 'Proton X50', category: 'SUV', priceLocal: 300, priceTourist: 360, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-orange-500 to-red-600', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8YZAWNJG1SSXPQG1BS93.png' },
  { id: 13, name: 'Honda HRV', category: 'SUV', priceLocal: 400, priceTourist: 480, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-gray-800 to-gray-900', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC90N57WTHVTVK6E1RTPNN.png' },
  { id: 14, name: 'Perodua Alza', category: 'MPV', priceLocal: 250, priceTourist: 300, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-indigo-500 to-indigo-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8Y7EBYTG228GS535B4H1.png' },
  { id: 15, name: 'Nissan Serena', category: 'MPV', priceLocal: 480, priceTourist: 575, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Hybrid', year: 2023, color: 'from-slate-700 to-slate-800', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8WGPF7VCSQRAG17YJNFB.png' },
  { id: 16, name: 'Mitsubishi Xpander', category: 'MPV', priceLocal: 300, priceTourist: 360, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-gray-600 to-gray-800', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8TYHE82E369TD1R5YV4D.png' },
  { id: 17, name: 'Proton X70', category: 'SUV', priceLocal: 350, priceTourist: 420, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-slate-600 to-slate-700', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8VRH35HS1DKGP9W4GA2V.png' },
  { id: 18, name: 'Honda CRV', category: 'SUV', priceLocal: 450, priceTourist: 540, depositLocal: 300, depositTourist: 600, seats: 5, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-slate-800 to-black', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8SEWFWM9X8JC4EF4E5TS.png' },
  { id: 19, name: 'Toyota Innova Zenix', category: 'MPV', priceLocal: 550, priceTourist: 660, depositLocal: 300, depositTourist: 600, seats: 7, transmission: 'Auto', fuel: 'Hybrid', year: 2023, color: 'from-cyan-700 to-cyan-900', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZC8T7344GVPKANFVM7F704.png' },
  { id: 20, name: 'Toyota Vellfire (3rd Gen)', category: 'MPV', priceLocal: 700, priceTourist: 840, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2020, color: 'from-slate-800 to-black', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZCAFC7J7YSC13V3WCX81J5.png' },
  { id: 21, name: 'Toyota Vellfire (4th Gen)', category: 'MPV', priceLocal: 1200, priceTourist: 1440, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Petrol', year: 2023, color: 'from-gray-900 to-black', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZCAEYJWD3N27BBWYGEP483.png' },
  { id: 22, name: 'Hyundai Staria', category: 'MPV', priceLocal: 600, priceTourist: 720, depositLocal: 400, depositTourist: 800, seats: 7, transmission: 'Auto', fuel: 'Diesel', year: 2023, color: 'from-blue-800 to-blue-950', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZCAE5QM4KX3RD60QMAZ9PN.png' },
  { id: 23, name: 'Hyundai Starex', category: 'MPV', priceLocal: 500, priceTourist: 600, depositLocal: 400, depositTourist: 800, seats: 11, transmission: 'Auto', fuel: 'Diesel', year: 2021, color: 'from-slate-700 to-slate-900', image: 'https://platform-bcl.bsb-cdn.com/media/2026/03/01KKZCADDG95R03GHZJ22TR8PD.png' }
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

// --- UTILITAS WATERMARK GAMBAR ---
const processImageWithWatermark = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
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
        
        ctx.font = `bold ${fontSize/2}px 'Space Grotesk', sans-serif`;
        ctx.fillText(new Date().toLocaleDateString('en-MY') + " " + new Date().toLocaleTimeString('en-MY'), 0, fontSize);
        
        ctx.restore();

        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve(null); 
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null); 
    reader.readAsDataURL(file);
  });
};

// --- FUNGSI UPLOAD KE STORAGE ---
const uploadFileToStorage = async (base64, path) => {
  if (!base64) return null;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64, 'data_url');
  return await getDownloadURL(storageRef);
};

export default function App() {
  // ==========================================
  // STATE UTAMA APP
  // ==========================================
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [cars, setCars] = useState(INITIAL_CARS);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fleetPricingMode, setFleetPricingMode] = useState('local');
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    name: '', email: '', phone: '', startDate: '', endDate: '', pickupLocation: '', returnLocation: '', destination: '', bankName: '', bankAccount: '', pickupFee: 0, returnFee: 0, totalDays: 0, totalPrice: 0, deposit: 0, grandTotal: 0, customerType: 'local', paymentMethod: 'fpx'
  });
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [searchTrackId, setSearchTrackId] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [activeGateway, setActiveGateway] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({ ic: null, license: null, bill: null });
  const [vcrDocs, setVcrDocs] = useState({ front: null, back: null, left: null, right: null });
  const [vcrUploading, setVcrUploading] = useState(false);
  const [returnVcrDocs, setReturnVcrDocs] = useState({ front: null, back: null, left: null, right: null }); 
  const [returnVcrUploading, setReturnVcrUploading] = useState(false);
  const sigCanvas = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [managingBooking, setManagingBooking] = useState(null);
  const [verifyingKyc, setVerifyingKyc] = useState(null); 
  const [viewingVcr, setViewingVcr] = useState(null);
  const [viewingReturnVcr, setViewingReturnVcr] = useState(null);
  const [fulfillmentType, setFulfillmentType] = useState('supplier'); 
  const [supplierDetails, setSupplierDetails] = useState({ name: '', cost: '' });
  const [notifications, setNotifications] = useState([]);
  const [kycType, setKycType] = useState('local');

  const trackedBooking = searchTrackId ? bookings.find(b => b.id === searchTrackId) : null;

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000); 
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diff = new Date(end) - new Date(start);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // --- USE EFFECTS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
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
    const params = new URLSearchParams(window.location.search);
    
    const status = params.get('status'); // Parameter dari Stripe
    const toyyibStatus = params.get('status_id'); // Parameter dari ToyyibPay (1=Success, 2=Pending, 3=Failed)
    
    const bookingId = params.get('bookingId') || params.get('order_id');

    // Kalau Stripe success ATAU Toyyibpay success (1) / pending (2)
    if ((status === 'success' || toyyibStatus === '1' || toyyibStatus === '2') && bookingId) {
      setCurrentBookingId(bookingId);
      setSearchTrackId(bookingId);
      setCurrentView('thank-you'); // Terus buka Thank You Page
      // Buang parameter dari URL supaya nampak kemas
      window.history.replaceState(null, '', window.location.pathname);
    } else if (status === 'cancelled' || toyyibStatus === '3') {
      showNotification('Payment cancelled or failed.', 'error');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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

  // --- HANDLERS ---
  const handleBookNow = (car) => {
    setSelectedCar(car);
    setBookingDetails({ ...bookingDetails, startDate: '', endDate: '', pickupLocation: '', returnLocation: '', destination: '', bankName: '', bankAccount: '', pickupFee: 0, returnFee: 0, totalDays: 0, totalPrice: 0, deposit: 0, grandTotal: 0, customerType: fleetPricingMode, paymentMethod: fleetPricingMode === 'local' ? 'fpx' : 'card' });
    setCurrentView('booking');
    window.scrollTo(0, 0);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const days = calculateDays(bookingDetails.startDate, bookingDetails.endDate);
    const now = new Date();
    const pickupDateTime = new Date(bookingDetails.startDate);
    const diffHours = (pickupDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      showNotification('Tempahan urgent tidak dibenarkan. Sila tempah sekurang-kurangnya 24 jam awal.', 'error');
      return;
    }
    if (days <= 0) {
      showNotification('Sila pilih tarikh yang sah.', 'error');
      return;
    }
    if (days < 2) {
      showNotification('Minimum sewaan adalah 2 Hari. Kami tak terima sewaan 1 hari.', 'error');
      return;
    }

    const isTourist = bookingDetails.customerType === 'international';
    const activeLocations = isTourist ? TOURIST_LOCATIONS : LOCATIONS;

    const pickupLoc = activeLocations.find(loc => loc.name === bookingDetails.pickupLocation);
    const returnLoc = activeLocations.find(loc => loc.name === bookingDetails.returnLocation);
    const pickupFee = pickupLoc ? pickupLoc.fee : 0;
    const returnFee = returnLoc ? returnLoc.fee : 0;
    const dailyPrice = isTourist ? selectedCar.priceTourist : selectedCar.priceLocal;
    const deposit = isTourist ? selectedCar.depositTourist : selectedCar.depositLocal;
    const rentalTotal = days * dailyPrice;
    const grandTotal = rentalTotal + pickupFee + returnFee + deposit;
    
    setBookingDetails({ 
      ...bookingDetails, pickupFee, returnFee, totalDays: days, totalPrice: rentalTotal, deposit: deposit, grandTotal: grandTotal 
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
      status: 'Paid_Pending',
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

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `HTTP Error: ${response.status}`);

        if (data.success && data.paymentUrl) {
           setPaymentUrl(data.paymentUrl);
           setPaymentProcessing(false);
           setSearchTrackId(customId);
           setCurrentView('request-success');
           window.scrollTo(0,0);
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

  const handleConfirmSupplier = async (e) => {
    e.preventDefault();
    if (!user || !managingBooking) return;

    let finalCost = 0;
    let finalSupplierName = 'Afwaja (Own Fleet)';
    const totalRevenue = managingBooking.customer.totalPrice + managingBooking.customer.pickupFee + managingBooking.customer.returnFee;
    let finalProfit = totalRevenue; 

    if (fulfillmentType === 'supplier') {
      finalCost = parseFloat(supplierDetails.cost);
      finalSupplierName = supplierDetails.name;
      finalProfit = totalRevenue - finalCost;
    }

    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', managingBooking.docId);
      await updateDoc(bookingRef, {
        status: 'Completed', 
        supplier: { name: finalSupplierName, cost: finalCost, type: fulfillmentType },
        profit: finalProfit
      });
      setManagingBooking(null);
      setSupplierDetails({ name: '', cost: '' });
      showNotification('Kenderaan Berjaya Di-assign!');
    } catch(err) { console.error(err); }
  };

  const handleRejectBooking = async (bookingToReject) => {
    if (!user || !bookingToReject) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingToReject.docId);
      await updateDoc(bookingRef, { status: 'Refunded' });
      setManagingBooking(null);
      showNotification(`Tempahan ditolak. Refund telah direkodkan.`, 'error');
    } catch (err) { console.error(err); }
  };

  const handleApproveReturnAndRefund = async (bookingToReturn) => {
    if (!user || !bookingToReturn) return;
    try {
      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingToReturn.docId);
      await updateDoc(bookingRef, { status: 'Returned' });
      setViewingReturnVcr(null); 
      showNotification('Pemeriksaan Lulus! Deposit dipulangkan.', 'success');
    } catch (err) { console.error(err); showNotification('Ralat semasa update.', 'error'); }
  };

  const handleVerifyKyc = async (bookingId, status) => {
     try {
       const booking = bookings.find(b => b.id === bookingId);
       const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', booking.docId);
       await updateDoc(bookingRef, { 'documents.status': status });
       setVerifyingKyc(null);
       showNotification(`Dokumen KYC ${status === 'verified' ? 'Disahkan' : 'Ditolak'}.`, status === 'verified' ? 'success' : 'error');
     } catch (err) { console.error(err); }
  };

  const handleViewSupplierVoucher = (bookingId) => {
    setCurrentBookingId(bookingId);
    setCurrentView('supplier-voucher');
    window.scrollTo(0,0);
  };

  const handleCopyBroadcast = (booking) => {
    const msg = `NEW BOOKING AFWAJA RENTAL\nID: ${booking.id}\nCar: ${booking.car.name}\nCustomer: ${booking.customer.name}\nPickup: ${booking.customer.startDate} @ ${booking.customer.pickupLocation}\nReturn: ${booking.customer.endDate} @ ${booking.customer.returnLocation}`;
    navigator.clipboard.writeText(msg);
    showNotification('Mesej disalin ke clipboard!', 'info');
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
      return showNotification('Mohon unggah semua 3 dokumen wajib.', 'error');
    }
    setKycUploading(true);
    try {
      const icUrl = await uploadFileToStorage(uploadedDocs.ic, `kyc/${trackedBooking.id}/ic.jpg`);
      const licenseUrl = await uploadFileToStorage(uploadedDocs.license, `kyc/${trackedBooking.id}/license.jpg`);
      const billUrl = await uploadFileToStorage(uploadedDocs.bill, `kyc/${trackedBooking.id}/bill.jpg`);

      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      await updateDoc(bookingRef, {
        'documents.ic': icUrl,
        'documents.license': licenseUrl,
        'documents.bill': billUrl,
        'documents.status': 'submitted'
      });
      showNotification('Dokumen dikirim untuk ditinjau oleh Admin.', 'success');
    } catch (err) { 
      console.error(err);
      showNotification('Terjadi kesalahan unggah.', 'error'); 
    }
    setKycUploading(false);
  };

  const handleVcrFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    showNotification(`Memproses tampilan ${type}...`, 'info');
    const watermarkedBase64 = await processImageWithWatermark(file);
    if (watermarkedBase64) {
      setVcrDocs(prev => ({ ...prev, [type]: watermarkedBase64 }));
    } else {
      showNotification('Gagal memproses file.', 'error');
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
    if (!file) return;
    showNotification(`Processing return view for ${type}...`, 'info');
    const watermarkedBase64 = await processImageWithWatermark(file);
    if (watermarkedBase64) {
      setReturnVcrDocs(prev => ({ ...prev, [type]: watermarkedBase64 }));
    } else {
      showNotification('Failed to process file.', 'error');
    }
    e.target.value = null; 
  };

  const submitReturnVcr = async () => {
    if (!trackedBooking) return;
    if (!returnVcrDocs.front || !returnVcrDocs.back || !returnVcrDocs.left || !returnVcrDocs.right) {
      return showNotification('Please upload all 4 vehicle corner views for return validation.', 'error');
    }
    setReturnVcrUploading(true);
    try {
      const frontUrl = await uploadFileToStorage(returnVcrDocs.front, `returnVcr/${trackedBooking.id}/front.jpg`);
      const backUrl = await uploadFileToStorage(returnVcrDocs.back, `returnVcr/${trackedBooking.id}/back.jpg`);
      const leftUrl = await uploadFileToStorage(returnVcrDocs.left, `returnVcr/${trackedBooking.id}/left.jpg`);
      const rightUrl = await uploadFileToStorage(returnVcrDocs.right, `returnVcr/${trackedBooking.id}/right.jpg`);

      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      await updateDoc(bookingRef, {
        'returnVcr.front': frontUrl,
        'returnVcr.back': backUrl,
        'returnVcr.left': leftUrl,
        'returnVcr.right': rightUrl,
        'returnVcr.status': 'submitted',
        status: 'Return_Pending' 
      });
      showNotification('Return VCR Submitted Successfully!', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error saving return report.', 'error');
    }
    setReturnVcrUploading(false);
  };

  const submitVcr = async () => {
    if (!trackedBooking) return;
    if (!vcrDocs.front || !vcrDocs.back || !vcrDocs.left || !vcrDocs.right) {
      return showNotification('Please upload all 4 vehicle corner views.', 'error');
    }
    setVcrUploading(true);
    try {
      const frontUrl = await uploadFileToStorage(vcrDocs.front, `vcr/${trackedBooking.id}/front.jpg`);
      const backUrl = await uploadFileToStorage(vcrDocs.back, `vcr/${trackedBooking.id}/back.jpg`);
      const leftUrl = await uploadFileToStorage(vcrDocs.left, `vcr/${trackedBooking.id}/left.jpg`);
      const rightUrl = await uploadFileToStorage(vcrDocs.right, `vcr/${trackedBooking.id}/right.jpg`);
      
      const canvas = sigCanvas.current;
      const signatureBase64 = canvas ? canvas.toDataURL('image/png') : null;
      const sigUrl = await uploadFileToStorage(signatureBase64, `vcr/${trackedBooking.id}/signature.png`);

      const bookingRef = doc(db, 'artifacts', appId, 'public', 'data', 'bookings', trackedBooking.docId);
      await updateDoc(bookingRef, {
        'vcr.front': frontUrl,
        'vcr.back': backUrl,
        'vcr.left': leftUrl,
        'vcr.right': rightUrl,
        'vcr.signature': sigUrl,
        'vcr.status': 'completed',
        status: 'Active' 
      });
      showNotification('VCR and Agreement successfully recorded.', 'success');
    } catch (err) {
      console.error(err);
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
            <img src="logo afwaja 4.png" alt="Afwaja Logo" className="h-10 sm:h-12 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}/>
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

    return (
      <div className="animate-fadeIn font-dm pt-20 sm:pt-24">
        <section className="min-h-[85vh] flex items-center relative overflow-hidden px-4 py-12 sm:py-0">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 rounded-full filter blur-[100px]"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300 rounded-full filter blur-[100px]"></div>
          </div>
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            <div className="fade-in">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span> 
                <span className="text-teal-700 text-sm font-bold tracking-wide">Explore Malaysia With Ease</span>
              </div>
              <h1 className="brand text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-slate-900">
                Seamless <br/>
                <span className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">Car Rental</span> Experience
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-xl leading-relaxed">
                Choose from over 300+ well-maintained vehicles. Enjoy transparent pricing, free delivery to selected areas, and 24/7 roadside assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => document.getElementById('fleet').scrollIntoView({behavior: 'smooth'})} className="btn-primary px-8 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30">
                  <Car className="w-5 h-5" /> View Our Fleet
                </button>
              </div>
            </div>
            <div className="relative float-animation hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-3xl transform rotate-6"></div>
                <div className="absolute inset-0 glass-card rounded-3xl flex flex-col items-center justify-center border border-white/50">
                  <img src="logo afwaja 4.png" alt="Afwaja Logo" className="w-56 h-auto mb-4 drop-shadow-xl" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}/>
                  <div className="text-center font-bold text-2xl brand text-slate-800 mt-4">Afwaja Fleet</div>
                  <div className="text-teal-600 font-medium">300+ Vehicles Available</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1000" alt="About Us" className="rounded-3xl shadow-2xl object-cover h-96 w-full" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span className="text-teal-700 text-sm font-bold tracking-wide">About Afwaja Rental</span>
                </div>
                <h2 className="brand text-3xl sm:text-4xl font-bold mb-6 text-slate-900">Your Trusted Travel Partner in Malaysia</h2>
                <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                  We started with a simple vision: to provide a transparent, fast, and reliable car rental service for international and domestic travelers. With a combined inventory of our own fleet and strategic partners, we ensure you get a comfortable car, delivered right on time.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><Award className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">Guaranteed Quality</h4><p className="text-sm text-slate-500">Regularly serviced & sanitized.</p></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0"><Clock className="text-cyan-600"/></div>
                    <div><h4 className="font-bold text-slate-900">24/7 Support</h4><p className="text-sm text-slate-500">We're here whenever you need us.</p></div>
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
                { step: '01', title: 'Select Vehicle', desc: 'Choose your car and rental dates. Enjoy transparent Local & International pricing.', icon: Car },
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
              
              <div className="inline-flex bg-slate-100 p-1.5 rounded-full border border-slate-200 mb-6 mx-auto">
                 <button onClick={() => setFleetPricingMode('local')} className={`px-6 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${fleetPricingMode === 'local' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                   🇲🇾 Malaysian
                 </button>
                 <button onClick={() => setFleetPricingMode('international')} className={`px-6 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all flex items-center gap-2 ${fleetPricingMode === 'international' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                   🌍 International
                 </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[{ id: 'all', label: 'All Models' }, { id: 'Compact', label: 'Compact' }, { id: 'Sedan', label: 'Sedan' }, { id: 'SUV', label: 'SUV' }, { id: 'MPV', label: 'MPV' }].map(cat => (
                <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-6 py-2.5 rounded-full font-bold transition-all ${filter === cat.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'glass-card text-slate-700 hover:bg-white/80 border border-slate-200'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map(car => (
                <div key={car.id} className="car-card group glass-card rounded-3xl overflow-hidden transition-all duration-500 border border-slate-200/60 shadow-lg hover:shadow-cyan-500/20 flex flex-col bg-white/90">
                  <div className={`h-52 w-full bg-gradient-to-br ${car.color} flex items-center justify-center relative overflow-hidden p-6`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                    {car.image ? (
                      <img src={car.image} alt={car.name} className="w-full h-full object-contain drop-shadow-2xl opacity-95 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 relative z-10" />
                    ) : (
                      <Car size={100} className="text-white drop-shadow-2xl opacity-90 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 relative z-10" strokeWidth={1} />
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="absolute -top-5 right-5 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100">
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 px-3 py-1 rounded-lg font-bold uppercase tracking-wider">{car.category}</span>
                    </div>
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <h3 className="brand font-bold text-xl text-slate-900 group-hover:text-cyan-700 transition-colors">{car.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 mb-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <span className="flex items-center gap-1.5"><Users size={16} className="text-cyan-600"/>{car.seats} Seats</span>
                      <span className="flex items-center gap-1.5"><Settings size={16} className="text-cyan-600"/>{car.transmission}</span>
                      <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-cyan-600"/>Dep. MYR {fleetPricingMode === 'local' ? car.depositLocal : car.depositTourist}</span>
                    </div>
                    <div className="mt-auto flex justify-between items-end pt-4 border-t border-slate-200">
                      <div>
                        <span className="brand text-3xl font-bold text-cyan-600">MYR {fleetPricingMode === 'local' ? car.priceLocal : car.priceTourist}</span>
                        <span className="text-slate-500 text-sm font-medium">/day</span>
                      </div>
                      <button onClick={() => handleBookNow(car)} className="btn-primary text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-md">
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                { name: "Sarah Lee", role: "Corporate Executive", text: "Very fast deposit refund system. I returned the car without any scratches, and received my deposit back within 24 hours. Trusted service!", stars: 5 },
                { name: "Ramesh Raj", role: "Frequent Traveler", text: "Great variety of cars. Needed an MPV for a family trip and they provided a clean, well-maintained vehicle. Very reasonable pricing.", stars: 5 }
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
                <Car className="text-cyan-500 w-8 h-8" />
                <span className="brand text-2xl font-bold text-white">Afwaja Rental</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-sm leading-relaxed">
                Malaysia's leading smart car rental provider. Connecting you to your destinations safely and comfortably.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-cyan-600 transition-colors"><MessageCircle size={18}/></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-cyan-600 transition-colors"><Globe size={18}/></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-cyan-600 transition-colors"><Mail size={18}/></a>
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
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact Us</a></li>
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
    const currentDeposit = isTourist ? selectedCar.depositTourist : selectedCar.depositLocal;
    const activeLocations = isTourist ? TOURIST_LOCATIONS : LOCATIONS;
    
    const currentPickupFee = activeLocations.find(l => l.name === bookingDetails.pickupLocation)?.fee || 0;
    const currentReturnFee = activeLocations.find(l => l.name === bookingDetails.returnLocation)?.fee || 0;

    return (
      <div className="max-w-5xl mx-auto px-4 py-24 animate-fadeIn font-dm">
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
              </div>
            </div>
            
            <div className="relative z-10 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/20 pt-6 sm:pt-0 sm:pl-10 w-full sm:w-auto">
              <p className="text-sm font-medium text-white/80 mb-1 uppercase tracking-widest">Estimated Daily Rate</p>
              <p className="brand text-5xl sm:text-6xl font-bold">MYR {currentDailyPrice} <span className="text-lg font-normal font-dm">/day</span></p>
            </div>
          </div>

          <div className="w-full p-8 sm:p-10 lg:p-12">
            <form onSubmit={handleBookingSubmit}>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <label className={`flex-1 flex justify-center py-4 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${bookingDetails.customerType === 'local' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <input type="radio" className="hidden" checked={bookingDetails.customerType === 'local'} onChange={() => setBookingDetails({...bookingDetails, customerType: 'local', paymentMethod: 'fpx', pickupLocation: '', returnLocation: ''})} />
                  Malaysian Citizen
                </label>
                <label className={`flex-1 flex justify-center py-4 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all ${bookingDetails.customerType === 'international' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <input type="radio" className="hidden" checked={bookingDetails.customerType === 'international'} onChange={() => setBookingDetails({...bookingDetails, customerType: 'international', paymentMethod: 'card', pickupLocation: '', returnLocation: ''})} />
                  International Tourist
                </label>
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
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone No.</label>
                      <input required type="tel" placeholder="0123456789" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                        value={bookingDetails.phone} onChange={e => setBookingDetails({...bookingDetails, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                      <input required type="email" placeholder="ali@email.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                        value={bookingDetails.email} onChange={e => setBookingDetails({...bookingDetails, email: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Calendar size={20} className="text-cyan-600"/> Date/Time & Destination</h3>
                  <p className="text-xs text-orange-600 font-bold mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="flex items-center"><Clock size={14} className="mr-1"/> Note: Minimum 24-hours advance booking required.</span>
                    <span className="hidden sm:inline">|</span>
                    <span>Minimum rental period is strictly 2 Days.</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Pickup Date & Time</label>
                    <input required type="datetime-local" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium uppercase" 
                      value={bookingDetails.startDate} onChange={e => setBookingDetails({...bookingDetails, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Date & Time</label>
                    <input required type="datetime-local" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium uppercase" 
                      value={bookingDetails.endDate} onChange={e => setBookingDetails({...bookingDetails, endDate: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Destination</label>
                    <input required type="text" placeholder="E.g.: Cameron / KLIA" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" 
                      value={bookingDetails.destination} onChange={e => setBookingDetails({...bookingDetails, destination: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <div className="mb-5 border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><MapPin size={20} className="text-cyan-600"/> {isTourist ? 'Pickup & Return' : 'Delivery & Pickup'}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1.5 italic">
                    * Note: {isTourist ? 'Fixed rates apply for tourist transit hubs and city areas.' : 'Delivery distance is calculated from Afwaja Car Rental HQ, Cyberjaya.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">{isTourist ? 'Pickup Location' : 'Delivery Location'}</label>
                    <select required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700" 
                      value={bookingDetails.pickupLocation} onChange={e => setBookingDetails({...bookingDetails, pickupLocation: e.target.value})}>
                      <option value="">Select Location</option>
                      {activeLocations.map(l => <option key={l.name} value={l.name}>{l.pickupLabel}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Location</label>
                    <select required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium text-slate-700" 
                      value={bookingDetails.returnLocation} onChange={e => setBookingDetails({...bookingDetails, returnLocation: e.target.value})}>
                      <option value="">Select Location</option>
                      {activeLocations.map(l => <option key={l.name} value={l.name}>{l.returnLabel}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {bookingDetails.startDate && bookingDetails.endDate && calculateDays(bookingDetails.startDate, bookingDetails.endDate) > 0 && (
                <div className="bg-cyan-50 p-6 sm:p-8 rounded-2xl mt-8 border border-cyan-200 shadow-inner animate-fadeIn">
                  <p className="text-base font-bold text-cyan-900 mb-4 border-b border-cyan-200 pb-3 flex items-center gap-2">
                    <FileText size={20}/> Booking Summary ({calculateDays(bookingDetails.startDate, bookingDetails.endDate)} Days)
                  </p>
                  <div className="flex justify-between items-center mb-2 text-sm font-bold text-slate-700">
                    <span>Rental Rate:</span>
                    <span>MYR {calculateDays(bookingDetails.startDate, bookingDetails.endDate) * currentDailyPrice}</span>
                  </div>
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
                      MYR {
                        (calculateDays(bookingDetails.startDate, bookingDetails.endDate) * currentDailyPrice) + 
                        currentPickupFee +
                        currentReturnFee +
                        currentDeposit
                      }
                    </span>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full btn-primary text-white font-bold text-xl py-5 rounded-2xl mt-10 flex justify-center items-center gap-3 shadow-lg shadow-cyan-500/40 hover:scale-[1.01] transition-transform">
                Proceed to Payment <CreditCard size={24} />
              </button>
            </form>
          </div>
        </div>
      </div>
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
              <p className="text-sm font-medium text-blue-600">{bookingDetails.totalDays} Days</p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-5 mb-8 text-sm font-medium text-slate-600 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Payment Breakdown</p>
            
            <div className="flex justify-between mb-2">
              <span>Vehicle Rental ({bookingDetails.totalDays} Days)</span>
              <span className="font-bold text-slate-800">MYR {bookingDetails.totalPrice}</span>
            </div>
            
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
        <button onClick={() => { setSearchTrackId(currentBookingId); setCurrentView('track'); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">
          Complete Identity Verification (KYC)
        </button>
      </div>
    </div>
  );

  const CustomerTrackView = () => {
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
                 setVcrDocs({ front: null, back: null, left: null, right: null });
                 setReturnVcrDocs({ front: null, back: null, left: null, right: null });
              }}
            />
          </div>
        </div>

        {trackedBooking && (
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
                {trackedBooking.status === 'Refunded' && <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm"><XCircle size={14} className="mr-1.5"/> Cancelled</span>}
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
                <div>
                  <p className="font-bold text-slate-900 text-xl">{trackedBooking.car.name}</p>
                  <p className="text-slate-600">{trackedBooking.customer.startDate} → {trackedBooking.customer.endDate} ({trackedBooking.customer.totalDays} Days)</p>
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

              {(trackedBooking.status === 'Completed' || trackedBooking.status === 'Active' || trackedBooking.status === 'Returned') && (
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

                      <button onClick={() => submitKycDocs()} disabled={kycUploading} className="w-full btn-primary text-white py-3 rounded-xl font-bold flex justify-center items-center">
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
                    <p className="text-sm text-blue-800 mb-6 font-medium">Please capture images of the vehicle from 4 angles before starting your trip. This acts as physical evidence for the E-Agreement.</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[{key: 'front', label: 'Front'}, {key: 'back', label: 'Rear'}, {key: 'left', label: 'Left'}, {key: 'right', label: 'Right'}].map((docType) => (
                        <div key={docType.key} className="border-2 border-dashed border-blue-300 rounded-xl p-3 text-center hover:bg-white transition-colors relative overflow-hidden group h-24 flex flex-col items-center justify-center bg-white/50">
                          {vcrDocs[docType.key] ? (
                            <div className="absolute inset-0">
                              <img src={vcrDocs[docType.key]} className="w-full h-full object-cover opacity-80" alt={docType.key} />
                              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm"><CheckCircle className="text-white w-6 h-6" /></div>
                            </div>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-blue-400 mb-1 group-hover:text-blue-600 transition-colors" />
                              <p className="text-[10px] font-bold text-blue-800 uppercase">{docType.label}</p>
                            </>
                          )}
                          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleVcrFileChange(e, docType.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
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

                    <button onClick={() => submitVcr()} disabled={vcrUploading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center shadow-lg hover:bg-slate-800 transition-all">
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
                    <p className="text-sm text-orange-800 mb-6 font-medium">When you are ready to return the vehicle, park it at the designated drop-off location and capture 4 photos of the vehicle condition. This is required for your Security Deposit refund.</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[{key: 'front', label: 'Front'}, {key: 'back', label: 'Rear'}, {key: 'left', label: 'Left'}, {key: 'right', label: 'Right'}].map((docType) => (
                        <div key={docType.key} className="border-2 border-dashed border-orange-300 rounded-xl p-3 text-center hover:bg-white transition-colors relative overflow-hidden group h-24 flex flex-col items-center justify-center bg-white/50">
                          {returnVcrDocs[docType.key] ? (
                            <div className="absolute inset-0">
                              <img src={returnVcrDocs[docType.key]} className="w-full h-full object-cover opacity-80" alt={docType.key} />
                              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm"><CheckCircle className="text-white w-6 h-6" /></div>
                            </div>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-orange-400 mb-1 group-hover:text-orange-600 transition-colors" />
                              <p className="text-[10px] font-bold text-orange-800 uppercase">{docType.label}</p>
                            </>
                          )}
                          <input type="file" accept="image/*" capture="environment" onChange={(e) => handleReturnVcrFileChange(e, docType.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        </div>
                      ))}
                    </div>

                    <button onClick={() => submitReturnVcr()} disabled={returnVcrUploading} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold flex justify-center items-center shadow-lg hover:bg-orange-700 transition-all">
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
                <img src="logo afwaja 4.png" alt="Afwaja Logo" className="h-14 w-auto object-contain mb-2" onError={(e) => { e.target.style.display='none'; }}/>
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
                <p className="font-medium text-slate-600 mb-1">Pickup: <span className="font-bold text-slate-900">{new Date(booking.customer.startDate).toLocaleString()}</span></p>
                <p className="font-medium text-slate-600 mb-1">Drop-off: <span className="font-bold text-slate-900">{new Date(booking.customer.endDate).toLocaleString()}</span></p>
                <p className="font-medium text-slate-600 mb-1">Location: <span className="font-bold text-slate-900">{booking.customer.pickupLocation.split(' (')[0]} → {booking.customer.returnLocation.split(' (')[0]}</span></p>
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
                      <p className="text-slate-500 font-medium text-sm">Vehicle Rental Fee</p>
                    </td>
                    <td className="py-5 px-6 text-center font-medium text-slate-700">{booking.customer.totalDays} Days</td>
                    <td className="py-5 px-6 text-right font-bold text-lg text-slate-900">MYR {booking.customer.totalPrice}</td>
                  </tr>
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
                <img src="logo afwaja 4.png" alt="Afwaja Logo" className="h-14 w-auto object-contain mb-2" onError={(e) => { e.target.style.display='none'; }}/>
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
                <p className="font-medium text-slate-600 mb-1">Dates: <span className="font-bold text-slate-900">{booking.customer.startDate} to {booking.customer.endDate}</span></p>
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
    const pendingReqs = bookings.filter(b => b.status === 'Paid_Pending').length;
    const pendingKyc = bookings.filter(b => b?.documents?.status === 'submitted').length;
    const successfulBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Active' || b.status === 'Return_Pending' || b.status === 'Returned');
    const totalSales = successfulBookings.reduce((sum, b) => sum + b.customer.totalPrice + b.customer.pickupFee + b.customer.returnFee, 0); 

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-fadeIn font-dm">
        <div className="mb-10">
          <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 flex items-center">
            <LayoutDashboard className="mr-3 text-cyan-600 w-8 h-8"/> Admin Portal
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-yellow-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-yellow-700 font-bold text-sm">Assign Car</h3><Bell size={18} className="text-yellow-600"/></div>
            <p className="brand text-4xl font-bold text-slate-900">{pendingReqs}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-purple-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-purple-700 font-bold text-sm">Pending KYC</h3><FileCheck size={18} className="text-purple-600"/></div>
            <p className="brand text-4xl font-bold text-purple-900">{pendingKyc}</p>
          </div>
          <div className="glass-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-2"><h3 className="text-slate-500 font-bold text-sm">Gross Revenue</h3><Wallet size={18} className="text-blue-600"/></div>
            <p className="brand text-2xl font-bold text-slate-900">MYR {totalSales}</p>
          </div>
          <div className="glass-card bg-gradient-to-br from-cyan-600 to-teal-600 p-6 rounded-2xl shadow-md border border-cyan-400 text-white">
            <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-cyan-100 text-sm">Net Profit</h3><TrendingUp size={18}/></div>
            <p className="brand text-3xl font-bold">MYR {successfulBookings.reduce((sum, b) => sum + b.profit, 0)}</p>
          </div>
        </div>

        <div className="glass-card bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="brand text-2xl font-bold text-slate-900">Booking & Action Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-medium text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5">Job ID</th>
                  <th className="px-6 py-5">Customer</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">KYC Status</th>
                  <th className="px-6 py-5">Supplier / Cost</th>
                  <th className="px-6 py-5">Net Profit</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-16 text-center text-slate-400">No records found.</td></tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4"><span className="font-bold text-slate-700 font-mono">{booking.id}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{booking.customer.name}</p>
                            {booking.customer.customerType === 'international' ? (
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center border border-blue-200" title="International Tourist"><Globe size={10} className="mr-1"/> Tourist</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200">Local</span>
                            )}
                          </div>
                          <p className="font-bold text-cyan-600">{booking.car.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {booking.status === 'Paid_Pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Needs Car</span>}
                        {booking.status === 'Completed' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Confirmed</span>}
                        {booking.status === 'Active' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><Car size={12} className="mr-1"/> Active</span>}
                        {booking.status === 'Return_Pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><Clock size={12} className="mr-1"/> Return Review</span>}
                        {booking.status === 'Returned' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Refunded Dep.</span>}
                        {booking.status === 'Refunded' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Cancelled</span>}
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
                            {booking.supplier.type === 'supplier' && <p className="text-xs text-slate-500">Cost: MYR {booking.supplier.cost}</p>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-lg text-emerald-600">
                        {(booking.status === 'Completed' || booking.status === 'Active' || booking.status === 'Return_Pending' || booking.status === 'Returned') ? `MYR ${booking.profit}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center flex flex-col items-center gap-2">
                        
                        {booking.status === 'Paid_Pending' && (
                          <button onClick={() => { setManagingBooking(booking); setFulfillmentType('supplier'); }} className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-cyan-700 w-full shadow-sm">
                            Assign Car
                          </button>
                        )}
                        
                        {booking.status === 'Completed' && booking.documents?.status === 'submitted' && (
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

  const TermsView = () => (
    <div className="max-w-4xl mx-auto px-4 py-24 animate-fadeIn font-dm">
      <button onClick={() => setCurrentView('home')} className="text-cyan-600 font-bold mb-8 flex items-center hover:underline bg-white/50 px-4 py-2 rounded-lg inline-flex">
        &larr; Back to Home
      </button>
      
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 p-8 sm:p-12">
        <h1 className="brand text-3xl sm:text-4xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-6">Terms & Conditions of Rental</h1>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck className="text-cyan-600"/> 1. Introduction and General Policy</h3>
            <p>These terms set out the rules for utilizing Afwaja Rental services. By proceeding with a booking, the customer fully agrees to the terms below. The rented vehicle may only be driven within permitted areas in Peninsular Malaysia.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard className="text-cyan-600"/> 2. Payment and Security Deposit</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Full payment (rental rate + logistics + security deposit) must be cleared before the vehicle is handed over.</li>
              <li>The Security Deposit will be refunded within <strong>1-3 business days</strong> after the vehicle is returned in good condition, without damages, traffic fines, or fuel shortages.</li>
              <li>In the event of cancellation due to vehicle unavailability on our end, a 100% full refund will be issued.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><FileCheck className="text-cyan-600"/> 3. Driver Requirements & KYC Documents</h3>
            <p>Drivers must be 21 years of age or older and possess a valid Malaysian Driving License (Class D) or a recognized <strong>International Driving Permit (IDP)</strong>. Customers are required to upload their Passport/ID, Driving License, and Flight/Hotel Itinerary to our portal for insurance verification and KYC tracking.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="text-cyan-600"/> 4. Damages, Accidents, and Fines</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>The renter is fully responsible for any traffic summons, tolls, or parking violations incurred during the rental period. These costs will be deducted from the Security Deposit.</li>
              <li>In the event of an accident caused by the renter's negligence (including tire punctures/blowouts), the renter is liable for the repair cost (Excess) as per the vehicle's insurance policy terms.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg font-sans text-slate-800 selection:bg-cyan-200">
      <Navbar />
      
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

      <main className="h-full">
        {currentView === 'home' && HomeView()}
        {currentView === 'booking' && BookingView()}
        {currentView === 'request-success' && RequestSuccessView()}
        {currentView === 'track' && CustomerTrackView()}
        {currentView === 'payment' && PaymentView()}
        {currentView === 'invoice' && InvoiceView()}
        {currentView === 'admin' && AdminDashboard()}
        {currentView === 'supplier-voucher' && SupplierVoucherView()}
        {currentView === 'terms' && TermsView()}
      </main>

      {/* POPUP UNTUK ADMIN ASSIGNMENT / REVIEW */}
      {managingBooking && !verifyingKyc && !viewingVcr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">Supplier Name</label>
                        <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 font-medium" value={supplierDetails.name} onChange={e => setSupplierDetails({...supplierDetails, name: e.target.value})} placeholder="E.g. Din Rental"/>
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
                    <XCircle size={20} className="mr-1"/> Reject & Refund
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {verifyingKyc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-purple-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="brand text-xl font-bold flex items-center"><FileCheck className="mr-2"/> Identity Verification Review</h3>
              <button onClick={() => setVerifyingKyc(null)} className="text-purple-300 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                 <div>
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
                 <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-bold border border-yellow-200 text-sm">Awaiting Review</div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { key: 'ic', label: verifyingKyc.customer.customerType === 'international' ? 'Passport / ID' : 'MyKad (Front)' },
                  { key: 'license', label: verifyingKyc.customer.customerType === 'international' ? 'Driving License / IDP' : 'Driving License' },
                  { key: 'bill', label: verifyingKyc.customer.customerType === 'international' ? 'Flight / Hotel Booking' : 'Utility Bill' }
                ].map(doc => (
                  <div key={doc.key} className="border border-slate-200 p-2 rounded-xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden relative group">
                      <img src={verifyingKyc.documents?.[doc.key]} alt={doc.key} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => handleVerifyKyc(verifyingKyc.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center items-center shadow-md hover:bg-emerald-700 transition-colors">
                  <CheckCircle size={20} className="mr-2"/> Approve Documents
                </button>
                <button onClick={() => handleVerifyKyc(verifyingKyc.id, 'rejected')} className="px-8 bg-red-100 text-red-700 py-4 rounded-xl font-bold hover:bg-red-200 transition-colors flex justify-center items-center">
                  <XCircle size={20} className="mr-2"/> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingVcr && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="brand text-xl font-bold flex items-center"><Camera className="mr-2"/> Initial VCR & E-Agreement</h3>
              <button onClick={() => setViewingVcr(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <p className="font-bold text-lg text-slate-900">{viewingVcr.car.name}</p>
                   <p className="text-slate-500 text-sm">Customer: {viewingVcr.customer.name}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { key: 'front', label: 'Front' },
                  { key: 'back', label: 'Rear' },
                  { key: 'left', label: 'Left' },
                  { key: 'right', label: 'Right' }
                ].map(doc => (
                  <div key={doc.key} className="border border-slate-200 p-2 rounded-xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden">
                      <img src={viewingVcr.vcr?.[doc.key]} alt={doc.key} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex items-center justify-between mb-8">
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
      )}

      {viewingReturnVcr && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-900 p-6 flex justify-between items-center text-white sticky top-0 z-10">
              <h3 className="brand text-xl font-bold flex items-center"><Undo2 className="mr-2"/> Return VCR Inspection</h3>
              <button onClick={() => setViewingReturnVcr(null)} className="text-orange-300 hover:text-white"><X size={24}/></button>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <p className="font-bold text-lg text-slate-900">{viewingReturnVcr.car.name}</p>
                   <p className="text-slate-500 text-sm">Customer: {viewingReturnVcr.customer.name}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-bold text-slate-500">Deposit to Refund</p>
                   <p className="brand text-2xl font-bold text-emerald-600">MYR {viewingReturnVcr.customer.deposit}</p>
                 </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                <p className="text-sm text-orange-800 font-medium"><AlertTriangle className="inline w-4 h-4 mr-1"/> Please review the 4 return photos below. Verify there are no new damages before refunding the deposit.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { key: 'front', label: 'Front' },
                  { key: 'back', label: 'Rear' },
                  { key: 'left', label: 'Left' },
                  { key: 'right', label: 'Right' }
                ].map(doc => (
                  <div key={doc.key} className="border border-slate-200 p-2 rounded-xl bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{doc.label}</p>
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg overflow-hidden">
                      <img src={viewingReturnVcr.returnVcr?.[doc.key]} alt={doc.key} className="w-full h-full object-cover" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => handleApproveReturnAndRefund(viewingReturnVcr)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center shadow-md">
                  <CheckCircle size={20} className="mr-2"/> Approve & Refund
                </button>
                <button onClick={() => setViewingReturnVcr(null)} className="px-8 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors flex justify-center items-center">
                  Close
                </button>
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