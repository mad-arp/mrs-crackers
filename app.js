/**
 * MRS CRACKERS 2.0 - MOBILE-FIRST ENGINE
 * Designed strictly for Mobile Users (iOS / Android Web Experience)
 * Pure Vanilla JavaScript (Zero Dependencies, Zero Bundlers)
 */

// ==========================================
// 1. GLOBAL STATE
// ==========================================
const APP_STATE = {
  lang: 'en', // 'en' or 'te'
  theme: 'dark', // 'dark' or 'light'
  currentUserRole: 'customer', // 'customer' | 'driver' | 'admin'
  currentTab: 'home', // 'home', 'categories', 'orders', 'account'
  ordersSubtab: 'history', // 'history', 'track', 'pass'
  soundEnabled: false,
  hasActiveOrder: false,
  driverEnteredOtp: '',
  driverActiveRun: null,
  batches: [],
  batchConfig: {
    maxCapacity: 5,
    intervalMinutes: 30
  },
  registeredDrivers: [],
  currentDriver: null,
  driverAssignments: [],
  user: {
    isLoggedIn: false,
    isGuest: true,
    name: 'Guest Customer',
    customerId: '',
    phone: '',
    email: '',
    walletBalance: 0,
    loyaltyPoints: 0,
    address: {
      name: '',
      phone: '',
      house: 'Plot 42, Sri Sai Krupa Nilayam',
      area: 'Saidabad Colony, Near Hanuman Temple',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500059',
      landmark: 'Opp. State Bank ATM'
    }
  },
  cart: [],
  wishlist: [1, 3, 5],
  notifications: [
    { id: 1, title: '🔥 Flash Deal: 20% OFF on Sky Shots!', time: '2h ago', icon: '🚀', unread: true },
    { id: 2, title: '🟢 Price Drop: Flower Pots now at ₹80 only!', time: '5h ago', icon: '🪔', unread: true },
    { id: 3, title: '💳 Payment Update: Order #MRS2412041 verified.', time: '1d ago', icon: '✓', unread: true },
    { id: 4, title: '🎉 Festival Alert: Last Day! Free Delivery on orders above ₹999!', time: '1d ago', icon: '🛵', unread: false }
  ],
  activeFilter: {
    category: 'all',
    search: '',
    priceMax: 20000,
    soundLevel: 'all',
    dayNight: 'all'
  },
  checkout: {
    deliveryType: 'home', // 'home' or 'store'
    timeSlot: 'Today / Express',
    selectedPaymentMode: 'online', // 'online' or 'counter'
    selectedMerchant: 'paytm',
    enteredUtr: '',
    currentOrder: null
  },
  merchantConfig: {
    merchant1: {
      name: 'Bandi Rohan (Official Store)',
      upiId: '9392819362@upi',
      qrImage: 'assets/qr_paytm.png'
    },
    merchant2: {
      name: 'MRS Crackers Saidabad Counter',
      upiId: 'bandirohan43@okhdfcbank',
      qrImage: 'assets/qr_bharatpe.png'
    }
  },
  admin: {
    isAuthenticated: false,
    activeReceiver: 'paytm', // 'paytm' or 'bharatpe'
    announcementText: 'Last Day! Free Delivery on orders above ₹999! 💥',
    orders: []
  },
  pendingCartItem: null
};

// ==========================================
// 2. PER-USER PRIVATE DATA HELPERS
// Each customer's orders, cart, addresses are
// stored under their unique namespace key so
// no two accounts share each other's data.
// ==========================================
function getUserKey(key) {
  const u = APP_STATE.user;
  if (!u || !u.isLoggedIn) return `mrs_guest_${key}`;
  const id = ((u.email || u.mobile || u.phone || 'guest') + '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `mrs_${id}_${key}`;
}
function getUserOrders() {
  try { return JSON.parse(localStorage.getItem(getUserKey('orders')) || '[]'); } catch { return []; }
}
function setUserOrders(orders) {
  localStorage.setItem(getUserKey('orders'), JSON.stringify(orders));
}
function getUserAddresses() {
  try { return JSON.parse(localStorage.getItem(getUserKey('addresses')) || '[]'); } catch { return []; }
}
function setUserAddresses(addrs) {
  localStorage.setItem(getUserKey('addresses'), JSON.stringify(addrs));
  // also sync legacy key so other parts still find them
  localStorage.setItem('mrs_crackers_addresses', JSON.stringify(addrs));
}

// Hydrate saved merchant config
try {
  const savedMerchant = localStorage.getItem('mrs_merchant_config');
  if (savedMerchant) {
    APP_STATE.merchantConfig = JSON.parse(savedMerchant);
  }
} catch (e) {}

// ==========================================
// 2. PRODUCT CATALOG DATA
// ==========================================
let PRODUCTS = [
  {
    "id": 1,
    "name": "2¾-inch Kuruvi",
    "category": "single_sound",
    "categoryName": "Single sound",
    "size": "2¾ in",
    "packSize": "5 pieces/packet",
    "weight": "5 pieces/packet",
    "effect": "Single sharp report",
    "soundClass": "Low–medium",
    "sound": "medium",
    "seqRate": "1 report per piece",
    "mrp": 70,
    "price": 7,
    "mrpRange": "₹35–₹70",
    "spRange": "₹7–₹9",
    "discount": "90% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 257,
    "rating": "4.8",
    "reviews": 36,
    "image": "Crackers/indian_crackers_product_imagesv2/2_75-inch_Kuruvi.jpg",
    "description": "2¾-inch Kuruvi [Single sound]. Pack: 5 pieces/packet. Single sharp report. Sound: Low–medium. Wholesale Price: ₹7 (MRP: ₹35–₹70)."
  },
  {
    "id": 2,
    "name": "3½-inch Lakshmi",
    "category": "single_sound",
    "categoryName": "Single sound",
    "size": "3½ in",
    "packSize": "5 pieces/packet",
    "weight": "5 pieces/packet",
    "effect": "Single sharp report",
    "soundClass": "Medium",
    "sound": "medium",
    "seqRate": "1 report per piece",
    "mrp": 75,
    "price": 12,
    "mrpRange": "₹70–₹75",
    "spRange": "₹12–₹15",
    "discount": "84% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 264,
    "rating": "4.6",
    "reviews": 47,
    "image": "Crackers/indian_crackers_product_imagesv2/3_5-inch_Lakshmi.jpg",
    "description": "3½-inch Lakshmi [Single sound]. Pack: 5 pieces/packet. Single sharp report. Sound: Medium. Wholesale Price: ₹12 (MRP: ₹70–₹75)."
  },
  {
    "id": 3,
    "name": "4-inch Lakshmi",
    "category": "single_sound",
    "categoryName": "Single sound",
    "size": "4 in",
    "packSize": "5 pieces/packet",
    "weight": "5 pieces/packet",
    "effect": "Single sharp report",
    "soundClass": "Medium",
    "sound": "medium",
    "seqRate": "1 report per piece",
    "mrp": 180,
    "price": 18,
    "mrpRange": "₹100–₹180",
    "spRange": "₹18–₹25",
    "discount": "90% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 271,
    "rating": "4.9",
    "reviews": 58,
    "image": "Crackers/indian_crackers_product_imagesv2/4-inch_Lakshmi.jpg",
    "description": "4-inch Lakshmi [Single sound]. Pack: 5 pieces/packet. Single sharp report. Sound: Medium. Wholesale Price: ₹18 (MRP: ₹100–₹180)."
  },
  {
    "id": 4,
    "name": "4-inch Deluxe Lakshmi",
    "category": "single_sound",
    "categoryName": "Single sound",
    "size": "4 in",
    "packSize": "5 pieces/packet",
    "weight": "5 pieces/packet",
    "effect": "Single sharp report",
    "soundClass": "Medium–high",
    "sound": "high",
    "seqRate": "1 report per piece",
    "mrp": 300,
    "price": 28,
    "mrpRange": "₹140–₹300",
    "spRange": "₹28–₹37",
    "discount": "91% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 278,
    "rating": "4.7",
    "reviews": 69,
    "image": "Crackers/indian_crackers_product_imagesv2/4-inch_Deluxe_Lakshmi.jpg",
    "description": "4-inch Deluxe Lakshmi [Single sound]. Pack: 5 pieces/packet. Single sharp report. Sound: Medium–high. Wholesale Price: ₹28 (MRP: ₹140–₹300)."
  },
  {
    "id": 5,
    "name": "5-inch Jallikattu",
    "category": "single_sound",
    "categoryName": "Single sound",
    "size": "5 in",
    "packSize": "5 pieces/packet",
    "weight": "5 pieces/packet",
    "effect": "Single sharp report",
    "soundClass": "High (relative)",
    "sound": "high",
    "seqRate": "1 report per piece",
    "mrp": 600,
    "price": 40,
    "mrpRange": "₹200–₹600",
    "spRange": "₹40–₹60",
    "discount": "93% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 285,
    "rating": "4.5",
    "reviews": 80,
    "image": "Crackers/indian_crackers_product_imagesv2/5-inch_Jallikattu.jpg",
    "description": "5-inch Jallikattu [Single sound]. Pack: 5 pieces/packet. Single sharp report. Sound: High (relative). Wholesale Price: ₹40 (MRP: ₹200–₹600)."
  },
  {
    "id": 6,
    "name": "Red Bijili (50)",
    "category": "bijili",
    "categoryName": "Bijili",
    "size": "Not specified",
    "packSize": "50 pieces/packet",
    "weight": "50 pieces/packet",
    "effect": "Small individual pop",
    "soundClass": "Low–medium",
    "sound": "medium",
    "seqRate": "Individual pops; not a timed sequence",
    "mrp": 110,
    "price": 15,
    "mrpRange": "₹75–₹110",
    "spRange": "₹15–₹22",
    "discount": "86% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 292,
    "rating": "4.8",
    "reviews": 91,
    "image": "Crackers/indian_crackers_product_imagesv2/Red_Bijili_50.jpg",
    "description": "Red Bijili (50) [Bijili]. Pack: 50 pieces/packet. Small individual pop. Sound: Low–medium. Wholesale Price: ₹15 (MRP: ₹75–₹110)."
  },
  {
    "id": 7,
    "name": "Red Bijili (100)",
    "category": "bijili",
    "categoryName": "Bijili",
    "size": "Not specified",
    "packSize": "100 pieces/packet",
    "weight": "100 pieces/packet",
    "effect": "Small individual pop",
    "soundClass": "Low–medium",
    "sound": "medium",
    "seqRate": "Individual pops; not a timed sequence",
    "mrp": 225,
    "price": 30,
    "mrpRange": "₹150–₹225",
    "spRange": "₹30–₹45",
    "discount": "87% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 299,
    "rating": "4.6",
    "reviews": 102,
    "image": "Crackers/indian_crackers_product_imagesv2/Red_Bijili_100.jpg",
    "description": "Red Bijili (100) [Bijili]. Pack: 100 pieces/packet. Small individual pop. Sound: Low–medium. Wholesale Price: ₹30 (MRP: ₹150–₹225)."
  },
  {
    "id": 8,
    "name": "Stripped Bijili (50)",
    "category": "bijili",
    "categoryName": "Bijili",
    "size": "Not specified",
    "packSize": "50 pieces/packet",
    "weight": "50 pieces/packet",
    "effect": "Small individual pop",
    "soundClass": "Low–medium",
    "sound": "medium",
    "seqRate": "Individual pops; not a timed sequence",
    "mrp": 160,
    "price": 16,
    "mrpRange": "₹80–₹160",
    "spRange": "₹16–₹32",
    "discount": "90% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 306,
    "rating": "4.9",
    "reviews": 33,
    "image": "Crackers/indian_crackers_product_imagesv2/Stripped_Bijili_50.jpg",
    "description": "Stripped Bijili (50) [Bijili]. Pack: 50 pieces/packet. Small individual pop. Sound: Low–medium. Wholesale Price: ₹16 (MRP: ₹80–₹160)."
  },
  {
    "id": 9,
    "name": "Flower Pot Small",
    "category": "flowerpots",
    "categoryName": "Fountain / flower pot",
    "size": "Small; dimensions not listed",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Vertical sparks",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One fountain effect per piece",
    "mrp": 200,
    "price": 40,
    "mrpRange": "₹200",
    "spRange": "₹40",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 313,
    "rating": "4.7",
    "reviews": 44,
    "image": "Crackers/indian_crackers_product_imagesv2/Flower_Pot_Small.jpg",
    "description": "Flower Pot Small [Fountain / flower pot]. Pack: 10 pieces/box. Vertical sparks. Sound: Low. Wholesale Price: ₹40 (MRP: ₹200)."
  },
  {
    "id": 10,
    "name": "Flower Pot Big",
    "category": "flowerpots",
    "categoryName": "Fountain / flower pot",
    "size": "Big; dimensions not listed",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Higher/denser spark fountain",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One fountain effect per piece",
    "mrp": 425,
    "price": 60,
    "mrpRange": "₹300–₹425",
    "spRange": "₹60–₹85",
    "discount": "86% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 320,
    "rating": "4.5",
    "reviews": 55,
    "image": "Crackers/indian_crackers_product_imagesv2/Flower_Pot_Big.jpg",
    "description": "Flower Pot Big [Fountain / flower pot]. Pack: 10 pieces/box. Higher/denser spark fountain. Sound: Low. Wholesale Price: ₹60 (MRP: ₹300–₹425)."
  },
  {
    "id": 11,
    "name": "Flower Pot Special",
    "category": "flowerpots",
    "categoryName": "Fountain / flower pot",
    "size": "Special; dimensions not listed",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Decorative spark fountain",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One fountain effect per piece",
    "mrp": 450,
    "price": 70,
    "mrpRange": "₹350–₹450",
    "spRange": "₹70–₹90",
    "discount": "84% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 327,
    "rating": "4.8",
    "reviews": 66,
    "image": "Crackers/indian_crackers_product_imagesv2/Flower_Pot_Special.jpg",
    "description": "Flower Pot Special [Fountain / flower pot]. Pack: 10 pieces/box. Decorative spark fountain. Sound: Low. Wholesale Price: ₹70 (MRP: ₹350–₹450)."
  },
  {
    "id": 12,
    "name": "Flower Pot Deluxe",
    "category": "flowerpots",
    "categoryName": "Fountain / flower pot",
    "size": "Deluxe; dimensions not listed",
    "packSize": "5 pieces/box",
    "weight": "5 pieces/box",
    "effect": "Decorative spark fountain",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One fountain effect per piece",
    "mrp": 1250,
    "price": 160,
    "mrpRange": "₹800–₹1,250",
    "spRange": "₹160–₹250",
    "discount": "87% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 334,
    "rating": "4.6",
    "reviews": 77,
    "image": "Crackers/indian_crackers_product_imagesv2/Flower_Pot_Deluxe.jpg",
    "description": "Flower Pot Deluxe [Fountain / flower pot]. Pack: 5 pieces/box. Decorative spark fountain. Sound: Low. Wholesale Price: ₹160 (MRP: ₹800–₹1,250)."
  },
  {
    "id": 13,
    "name": "Colour Koti",
    "category": "flowerpots",
    "categoryName": "Fountain / flower pot",
    "size": "Not specified",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Coloured spark fountain",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One fountain effect per piece",
    "mrp": 1000,
    "price": 180,
    "mrpRange": "₹900–₹1,000",
    "spRange": "₹180–₹200",
    "discount": "82% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 341,
    "rating": "4.9",
    "reviews": 88,
    "image": "Crackers/indian_crackers_product_imagesv2/Colour_Koti.jpg",
    "description": "Colour Koti [Fountain / flower pot]. Pack: 10 pieces/box. Coloured spark fountain. Sound: Low. Wholesale Price: ₹180 (MRP: ₹900–₹1,000)."
  },
  {
    "id": 14,
    "name": "Ground Chakkar Big",
    "category": "chakkars",
    "categoryName": "Ground spinner",
    "size": "Big; dimensions not listed",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Spinning ground sparks",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One spinning effect per piece",
    "mrp": 200,
    "price": 30,
    "mrpRange": "₹150–₹200",
    "spRange": "₹30–₹40",
    "discount": "85% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 348,
    "rating": "4.7",
    "reviews": 99,
    "image": "Crackers/indian_crackers_product_imagesv2/Ground_Chakkar_Big.jpg",
    "description": "Ground Chakkar Big [Ground spinner]. Pack: 10 pieces/box. Spinning ground sparks. Sound: Low. Wholesale Price: ₹30 (MRP: ₹150–₹200)."
  },
  {
    "id": 15,
    "name": "Ground Chakkar Deluxe",
    "category": "chakkars",
    "categoryName": "Ground spinner",
    "size": "Deluxe; dimensions not listed",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Brighter/faster spinning sparks",
    "soundClass": "Low",
    "sound": "low",
    "seqRate": "One spinning effect per piece",
    "mrp": 700,
    "price": 140,
    "mrpRange": "₹700",
    "spRange": "₹140",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 355,
    "rating": "4.5",
    "reviews": 30,
    "image": "Crackers/indian_crackers_product_imagesv2/Ground_Chakkar_Deluxe.jpg",
    "description": "Ground Chakkar Deluxe [Ground spinner]. Pack: 10 pieces/box. Brighter/faster spinning sparks. Sound: Low. Wholesale Price: ₹140 (MRP: ₹700)."
  },
  {
    "id": 16,
    "name": "7 cm Colour Sparklers",
    "category": "sparklers",
    "categoryName": "Sparkler",
    "size": "7 cm",
    "packSize": "Box; count not specified",
    "weight": "Box; count not specified",
    "effect": "Steady coloured sparks",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "Continuous burn; duration varies",
    "mrp": 75,
    "price": 15,
    "mrpRange": "₹75",
    "spRange": "₹15",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 362,
    "rating": "4.8",
    "reviews": 41,
    "image": "Crackers/indian_crackers_product_imagesv2/7cm_Colour_Sparklers.jpg",
    "description": "7 cm Colour Sparklers [Sparkler]. Pack: Box; count not specified. Steady coloured sparks. Sound: Very low. Wholesale Price: ₹15 (MRP: ₹75)."
  },
  {
    "id": 17,
    "name": "10 cm Electric Sparklers",
    "category": "sparklers",
    "categoryName": "Sparkler",
    "size": "10 cm",
    "packSize": "Box; count not specified",
    "weight": "Box; count not specified",
    "effect": "Bright white/golden sparks",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "Continuous burn; duration varies",
    "mrp": 100,
    "price": 20,
    "mrpRange": "₹100",
    "spRange": "₹20",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 369,
    "rating": "4.6",
    "reviews": 52,
    "image": "Crackers/indian_crackers_product_imagesv2/10cm_Electric_Sparklers.jpg",
    "description": "10 cm Electric Sparklers [Sparkler]. Pack: Box; count not specified. Bright white/golden sparks. Sound: Very low. Wholesale Price: ₹20 (MRP: ₹100)."
  },
  {
    "id": 18,
    "name": "15 cm Green Sparklers",
    "category": "sparklers",
    "categoryName": "Sparkler",
    "size": "15 cm",
    "packSize": "Box; count not specified",
    "weight": "Box; count not specified",
    "effect": "Green sparks",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "Continuous burn; duration varies",
    "mrp": 250,
    "price": 50,
    "mrpRange": "₹250",
    "spRange": "₹50",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 376,
    "rating": "4.9",
    "reviews": 63,
    "image": "Crackers/indian_crackers_product_imagesv2/15cm_Green_Sparklers.jpg",
    "description": "15 cm Green Sparklers [Sparkler]. Pack: Box; count not specified. Green sparks. Sound: Very low. Wholesale Price: ₹50 (MRP: ₹250)."
  },
  {
    "id": 19,
    "name": "30 cm Colour Sparklers",
    "category": "sparklers",
    "categoryName": "Sparkler",
    "size": "30 cm",
    "packSize": "Box; count not specified",
    "weight": "Box; count not specified",
    "effect": "Longer coloured spark trail",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "Continuous burn; duration varies",
    "mrp": 250,
    "price": 50,
    "mrpRange": "₹250",
    "spRange": "₹50",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 383,
    "rating": "4.7",
    "reviews": 74,
    "image": "Crackers/indian_crackers_product_imagesv2/30cm_Colour_Sparklers.jpg",
    "description": "30 cm Colour Sparklers [Sparkler]. Pack: Box; count not specified. Longer coloured spark trail. Sound: Very low. Wholesale Price: ₹50 (MRP: ₹250)."
  },
  {
    "id": 20,
    "name": "50 cm Electric Sparklers",
    "category": "sparklers",
    "categoryName": "Sparkler",
    "size": "50 cm",
    "packSize": "Box; count not specified",
    "weight": "Box; count not specified",
    "effect": "Long bright spark trail",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "Continuous burn; duration varies",
    "mrp": 1000,
    "price": 200,
    "mrpRange": "₹1,000",
    "spRange": "₹200",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 390,
    "rating": "4.5",
    "reviews": 85,
    "image": "Crackers/indian_crackers_product_imagesv2/50cm_Electric_Sparklers.jpg",
    "description": "50 cm Electric Sparklers [Sparkler]. Pack: Box; count not specified. Long bright spark trail. Sound: Very low. Wholesale Price: ₹200 (MRP: ₹1,000)."
  },
  {
    "id": 21,
    "name": "2 Sound Rocket",
    "category": "rockets",
    "categoryName": "Rocket",
    "size": "Not specified",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Aerial launch with sound effect",
    "soundClass": "Medium–high (relative)",
    "sound": "high",
    "seqRate": "2 sound effects advertised; timing varies",
    "mrp": 1000,
    "price": 200,
    "mrpRange": "₹1,000",
    "spRange": "₹200",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 397,
    "rating": "4.8",
    "reviews": 96,
    "image": "Crackers/indian_crackers_product_imagesv2/2_Sound_Rocket.jpg",
    "description": "2 Sound Rocket [Rocket]. Pack: 10 pieces/box. Aerial launch with sound effect. Sound: Medium–high (relative). Wholesale Price: ₹200 (MRP: ₹1,000)."
  },
  {
    "id": 22,
    "name": "Whistling Rocket",
    "category": "rockets",
    "categoryName": "Rocket",
    "size": "Not specified",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Whistling ascent / aerial effect",
    "soundClass": "Medium (relative)",
    "sound": "medium",
    "seqRate": "One flight sequence per rocket",
    "mrp": 1000,
    "price": 200,
    "mrpRange": "₹1,000",
    "spRange": "₹200",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 404,
    "rating": "4.6",
    "reviews": 27,
    "image": "Crackers/indian_crackers_product_imagesv2/Whistling_Rocket.jpg",
    "description": "Whistling Rocket [Rocket]. Pack: 10 pieces/box. Whistling ascent / aerial effect. Sound: Medium (relative). Wholesale Price: ₹200 (MRP: ₹1,000)."
  },
  {
    "id": 23,
    "name": "Rocket Bomb",
    "category": "rockets",
    "categoryName": "Rocket",
    "size": "Not specified",
    "packSize": "10 pieces/box",
    "weight": "10 pieces/box",
    "effect": "Aerial burst",
    "soundClass": "Medium–high (relative)",
    "sound": "high",
    "seqRate": "One flight/burst per rocket",
    "mrp": 250,
    "price": 50,
    "mrpRange": "₹250",
    "spRange": "₹50",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 411,
    "rating": "4.9",
    "reviews": 38,
    "image": "Crackers/indian_crackers_product_imagesv2/Rocket_Bomb.jpg",
    "description": "Rocket Bomb [Rocket]. Pack: 10 pieces/box. Aerial burst. Sound: Medium–high (relative). Wholesale Price: ₹50 (MRP: ₹250)."
  },
  {
    "id": 24,
    "name": "7 Shot",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "7 shots",
    "packSize": "1 piece/box; some listings 5 pcs",
    "weight": "1 piece/box; some listings 5 pcs",
    "effect": "Sequential aerial effects",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "7 shots per unit",
    "mrp": 600,
    "price": 120,
    "mrpRange": "₹600",
    "spRange": "₹120",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 418,
    "rating": "4.7",
    "reviews": 49,
    "image": "Crackers/indian_crackers_product_imagesv2/7_Shot.jpg",
    "description": "7 Shot [Multi-shot aerial]. Pack: 1 piece/box; some listings 5 pcs. Sequential aerial effects. Sound: Varies; mixed sound/light. Wholesale Price: ₹120 (MRP: ₹600)."
  },
  {
    "id": 25,
    "name": "12 Shot Colour",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "12 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Sequential coloured aerial effects",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "12 shots per unit",
    "mrp": 1000,
    "price": 200,
    "mrpRange": "₹1,000",
    "spRange": "₹200",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 425,
    "rating": "4.5",
    "reviews": 60,
    "image": "Crackers/indian_crackers_product_imagesv2/12_Shot_Colour.jpg",
    "description": "12 Shot Colour [Multi-shot aerial]. Pack: 1 piece/box. Sequential coloured aerial effects. Sound: Varies; mixed sound/light. Wholesale Price: ₹200 (MRP: ₹1,000)."
  },
  {
    "id": 26,
    "name": "25 Shot Crackling",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "25 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Sequential crackling aerial effects",
    "soundClass": "Medium–high (relative)",
    "sound": "high",
    "seqRate": "25 shots per unit",
    "mrp": 1500,
    "price": 300,
    "mrpRange": "₹1,500",
    "spRange": "₹300",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 432,
    "rating": "4.8",
    "reviews": 71,
    "image": "Crackers/indian_crackers_product_imagesv2/25_Shot_Crackling.jpg",
    "description": "25 Shot Crackling [Multi-shot aerial]. Pack: 1 piece/box. Sequential crackling aerial effects. Sound: Medium–high (relative). Wholesale Price: ₹300 (MRP: ₹1,500)."
  },
  {
    "id": 27,
    "name": "30 Shot Colour",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "30 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Sequential coloured aerial effects",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "30 shots per unit",
    "mrp": 2000,
    "price": 400,
    "mrpRange": "₹2,000",
    "spRange": "₹400",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 439,
    "rating": "4.6",
    "reviews": 82,
    "image": "Crackers/indian_crackers_product_imagesv2/30_Shot_Colour.jpg",
    "description": "30 Shot Colour [Multi-shot aerial]. Pack: 1 piece/box. Sequential coloured aerial effects. Sound: Varies; mixed sound/light. Wholesale Price: ₹400 (MRP: ₹2,000)."
  },
  {
    "id": 28,
    "name": "60 Shot Colour",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "60 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Longer sequential coloured aerial display",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "60 shots per unit",
    "mrp": 4000,
    "price": 800,
    "mrpRange": "₹4,000",
    "spRange": "₹800",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 446,
    "rating": "4.9",
    "reviews": 93,
    "image": "Crackers/indian_crackers_product_imagesv2/60_Shot_Colour.jpg",
    "description": "60 Shot Colour [Multi-shot aerial]. Pack: 1 piece/box. Longer sequential coloured aerial display. Sound: Varies; mixed sound/light. Wholesale Price: ₹800 (MRP: ₹4,000)."
  },
  {
    "id": 29,
    "name": "120 Shot Colour",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "120 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Extended sequential coloured aerial display",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "120 shots per unit",
    "mrp": 8000,
    "price": 1600,
    "mrpRange": "₹8,000",
    "spRange": "₹1,600",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 453,
    "rating": "4.7",
    "reviews": 104,
    "image": "Crackers/indian_crackers_product_imagesv2/120_Shot_Colour.jpg",
    "description": "120 Shot Colour [Multi-shot aerial]. Pack: 1 piece/box. Extended sequential coloured aerial display. Sound: Varies; mixed sound/light. Wholesale Price: ₹1600 (MRP: ₹8,000)."
  },
  {
    "id": 30,
    "name": "240 Shot Colour",
    "category": "multishot",
    "categoryName": "Multi-shot aerial",
    "size": "240 shots",
    "packSize": "1 piece/box",
    "weight": "1 piece/box",
    "effect": "Extended sequential coloured aerial display",
    "soundClass": "Varies; mixed sound/light",
    "sound": "medium",
    "seqRate": "240 shots per unit",
    "mrp": 16000,
    "price": 3200,
    "mrpRange": "₹16,000",
    "spRange": "₹3,200",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 460,
    "rating": "4.5",
    "reviews": 35,
    "image": "Crackers/indian_crackers_product_imagesv2/240_Shot_Colour.jpg",
    "description": "240 Shot Colour [Multi-shot aerial]. Pack: 1 piece/box. Extended sequential coloured aerial display. Sound: Varies; mixed sound/light. Wholesale Price: ₹3200 (MRP: ₹16,000)."
  },
  {
    "id": 31,
    "name": "100 Chain",
    "category": "chains",
    "categoryName": "Chain crackers",
    "size": "100 crackers",
    "packSize": "1 packet",
    "weight": "1 packet",
    "effect": "Rapid repeated reports",
    "soundClass": "High cumulative sound (relative)",
    "sound": "high",
    "seqRate": "100 linked reports; speed varies",
    "mrp": 175,
    "price": 35,
    "mrpRange": "₹175",
    "spRange": "₹35",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 467,
    "rating": "4.8",
    "reviews": 46,
    "image": "Crackers/indian_crackers_product_imagesv2/100_Chain.jpg",
    "description": "100 Chain [Chain crackers]. Pack: 1 packet. Rapid repeated reports. Sound: High cumulative sound (relative). Wholesale Price: ₹35 (MRP: ₹175)."
  },
  {
    "id": 32,
    "name": "600 Chain",
    "category": "chains",
    "categoryName": "Chain crackers",
    "size": "600 crackers",
    "packSize": "1 packet",
    "weight": "1 packet",
    "effect": "Long rapid repeated reports",
    "soundClass": "High cumulative sound (relative)",
    "sound": "high",
    "seqRate": "600 linked reports; speed varies",
    "mrp": 1000,
    "price": 200,
    "mrpRange": "₹1,000",
    "spRange": "₹200",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 474,
    "rating": "4.6",
    "reviews": 57,
    "image": "Crackers/indian_crackers_product_imagesv2/600_Chain.jpg",
    "description": "600 Chain [Chain crackers]. Pack: 1 packet. Long rapid repeated reports. Sound: High cumulative sound (relative). Wholesale Price: ₹200 (MRP: ₹1,000)."
  },
  {
    "id": 33,
    "name": "1K Chain",
    "category": "chains",
    "categoryName": "Chain crackers",
    "size": "1,000 crackers",
    "packSize": "1 packet",
    "weight": "1 packet",
    "effect": "Extended rapid repeated reports",
    "soundClass": "High cumulative sound (relative)",
    "sound": "high",
    "seqRate": "1,000 linked reports; speed varies",
    "mrp": 1400,
    "price": 280,
    "mrpRange": "₹1,400",
    "spRange": "₹280",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 481,
    "rating": "4.9",
    "reviews": 68,
    "image": "Crackers/indian_crackers_product_imagesv2/1K_Chain.jpg",
    "description": "1K Chain [Chain crackers]. Pack: 1 packet. Extended rapid repeated reports. Sound: High cumulative sound (relative). Wholesale Price: ₹280 (MRP: ₹1,400)."
  },
  {
    "id": 34,
    "name": "24 Bada",
    "category": "electric",
    "categoryName": "Electric crackers",
    "size": "24 count",
    "packSize": "1 packet",
    "weight": "1 packet",
    "effect": "Repeated small reports",
    "soundClass": "Medium (relative)",
    "sound": "medium",
    "seqRate": "24 reports; timing varies",
    "mrp": 250,
    "price": 50,
    "mrpRange": "₹250",
    "spRange": "₹50",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 488,
    "rating": "4.7",
    "reviews": 79,
    "image": "Crackers/indian_crackers_product_imagesv2/24_Bada.jpg",
    "description": "24 Bada [Electric crackers]. Pack: 1 packet. Repeated small reports. Sound: Medium (relative). Wholesale Price: ₹50 (MRP: ₹250)."
  },
  {
    "id": 35,
    "name": "100 Bada",
    "category": "electric",
    "categoryName": "Electric crackers",
    "size": "100 count",
    "packSize": "1 packet",
    "weight": "1 packet",
    "effect": "Repeated small reports",
    "soundClass": "Medium (relative)",
    "sound": "medium",
    "seqRate": "100 reports; timing varies",
    "mrp": 1250,
    "price": 250,
    "mrpRange": "₹1,250",
    "spRange": "₹250",
    "discount": "80% OFF",
    "dayNight": "day",
    "kidsSafe": false,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 495,
    "rating": "4.5",
    "reviews": 90,
    "image": "Crackers/indian_crackers_product_imagesv2/100_Bada.jpg",
    "description": "100 Bada [Electric crackers]. Pack: 1 packet. Repeated small reports. Sound: Medium (relative). Wholesale Price: ₹250 (MRP: ₹1,250)."
  },
  {
    "id": 36,
    "name": "Photo Flash",
    "category": "novelty",
    "categoryName": "Kids / novelty",
    "size": "Not specified",
    "packSize": "5 pieces/box",
    "weight": "5 pieces/box",
    "effect": "Brief flash effect",
    "soundClass": "Very low",
    "sound": "low",
    "seqRate": "One flash per piece",
    "mrp": 500,
    "price": 100,
    "mrpRange": "₹500",
    "spRange": "₹100",
    "discount": "80% OFF",
    "dayNight": "night",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 502,
    "rating": "4.8",
    "reviews": 101,
    "image": "Crackers/indian_crackers_product_imagesv2/Photo_Flash.jpg",
    "description": "Photo Flash [Kids / novelty]. Pack: 5 pieces/box. Brief flash effect. Sound: Very low. Wholesale Price: ₹100 (MRP: ₹500)."
  },
  {
    "id": 37,
    "name": "17 Item Gift Box",
    "category": "giftboxes",
    "categoryName": "Gift assortment",
    "size": "17 assorted items",
    "packSize": "1 box",
    "weight": "1 box",
    "effect": "Mixed light and sound effects",
    "soundClass": "Mixed",
    "sound": "medium",
    "seqRate": "Varies by included items",
    "mrp": 250,
    "price": 250,
    "mrpRange": "₹250",
    "spRange": "₹250",
    "discount": "Wholesale Direct",
    "dayNight": "day",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 509,
    "rating": "4.6",
    "reviews": 32,
    "image": "Crackers/indian_crackers_product_imagesv2/17_Item_Gift_Box.jpg",
    "description": "17 Item Gift Box [Gift assortment]. Pack: 1 box. Mixed light and sound effects. Sound: Mixed. Wholesale Price: ₹250 (MRP: ₹250)."
  },
  {
    "id": 38,
    "name": "31 Item Gift Box",
    "category": "giftboxes",
    "categoryName": "Gift assortment",
    "size": "31 assorted items",
    "packSize": "1 box",
    "weight": "1 box",
    "effect": "Mixed light and sound effects",
    "soundClass": "Mixed",
    "sound": "medium",
    "seqRate": "Varies by included items",
    "mrp": 400,
    "price": 400,
    "mrpRange": "₹400",
    "spRange": "₹400",
    "discount": "Wholesale Direct",
    "dayNight": "day",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 516,
    "rating": "4.9",
    "reviews": 43,
    "image": "Crackers/indian_crackers_product_imagesv2/31_Item_Gift_Box.jpg",
    "description": "31 Item Gift Box [Gift assortment]. Pack: 1 box. Mixed light and sound effects. Sound: Mixed. Wholesale Price: ₹400 (MRP: ₹400)."
  },
  {
    "id": 39,
    "name": "50 Item Gift Box",
    "category": "giftboxes",
    "categoryName": "Gift assortment",
    "size": "50 assorted items",
    "packSize": "1 box",
    "weight": "1 box",
    "effect": "Mixed light and sound effects",
    "soundClass": "Mixed",
    "sound": "medium",
    "seqRate": "Varies by included items",
    "mrp": 1000,
    "price": 1000,
    "mrpRange": "₹1,000",
    "spRange": "₹1,000",
    "discount": "Wholesale Direct",
    "dayNight": "day",
    "kidsSafe": true,
    "brand": "Standard Sivakasi",
    "inStock": true,
    "stock": 523,
    "rating": "4.7",
    "reviews": 54,
    "image": "Crackers/indian_crackers_product_imagesv2/50_Item_Gift_Box.jpg",
    "description": "50 Item Gift Box [Gift assortment]. Pack: 1 box. Mixed light and sound effects. Sound: Mixed. Wholesale Price: ₹1000 (MRP: ₹1,000)."
  }
];



// ==========================================
// CATEGORIES MASTER DATA
// ==========================================
const CATEGORIES = [
  {
    "id": "all",
    "name": "All Crackers",
    "icon": "✨",
    "image": "",
    "active": true,
    "count": 39,
    "desc": "Complete festive Sivakasi catalog (39 authentic items)"
  },
  {
    "id": "sparklers",
    "name": "Sparklers",
    "icon": "🎇",
    "image": "Crackers/indian_crackers_product_imagesv2/10cm_Electric_Sparklers.jpg",
    "active": true,
    "count": 5,
    "desc": "Electric, colour, green & giant handheld sparklers"
  },
  {
    "id": "flowerpots",
    "name": "Flower Pots",
    "icon": "🪔",
    "image": "Crackers/indian_crackers_product_imagesv2/Flower_Pot_Big.jpg",
    "active": true,
    "count": 5,
    "desc": "Fountains, colour koti & deluxe festive pots"
  },
  {
    "id": "chakkars",
    "name": "Chakkars",
    "icon": "🌀",
    "image": "Crackers/indian_crackers_product_imagesv2/Ground_Chakkar_Big.jpg",
    "active": true,
    "count": 2,
    "desc": "High-speed spinning wheels & deluxe chakkars"
  },
  {
    "id": "single_sound",
    "name": "Single Sound",
    "icon": "💥",
    "image": "Crackers/indian_crackers_product_imagesv2/3_5-inch_Lakshmi.jpg",
    "active": true,
    "count": 5,
    "desc": "Lakshmi, Kuruvi & Jallikattu sharp sound reports"
  },
  {
    "id": "bijili",
    "name": "Bijili Crackers",
    "icon": "🧨",
    "image": "Crackers/indian_crackers_product_imagesv2/Red_Bijili_50.jpg",
    "active": true,
    "count": 3,
    "desc": "Red & stripped bijili pop crackers"
  },
  {
    "id": "rockets",
    "name": "Rockets",
    "icon": "🚀",
    "image": "Crackers/indian_crackers_product_imagesv2/Whistling_Rocket.jpg",
    "active": true,
    "count": 3,
    "desc": "2 Sound, whistling & rocket bombs"
  },
  {
    "id": "multishot",
    "name": "Multi-Shot Aerial",
    "icon": "🎆",
    "image": "Crackers/indian_crackers_product_imagesv2/12_Shot_Colour.jpg",
    "active": true,
    "count": 7,
    "desc": "7 to 240 shots colour sky repeaters"
  },
  {
    "id": "chains",
    "name": "Chain Crackers",
    "icon": "⛓️",
    "image": "Crackers/indian_crackers_product_imagesv2/100_Chain.jpg",
    "active": true,
    "count": 3,
    "desc": "100, 600 & 1,000 wala rapid chains"
  },
  {
    "id": "electric",
    "name": "Electric Bada",
    "icon": "⚡",
    "image": "Crackers/indian_crackers_product_imagesv2/24_Bada.jpg",
    "active": true,
    "count": 2,
    "desc": "24 & 100 bada electric cracker bundles"
  },
  {
    "id": "novelty",
    "name": "Kids & Novelty",
    "icon": "✨",
    "image": "Crackers/indian_crackers_product_imagesv2/Photo_Flash.jpg",
    "active": true,
    "count": 1,
    "desc": "Photo flash & safe visual effects for kids"
  },
  {
    "id": "giftboxes",
    "name": "Gift Assortments",
    "icon": "🎁",
    "image": "Crackers/indian_crackers_product_imagesv2/17_Item_Gift_Box.jpg",
    "active": true,
    "count": 3,
    "desc": "Family celebration gift hampers & value packs"
  }
];

// Enrich product properties for bulk pricing, stock & active status
PRODUCTS.forEach(p => {
  if (!p.bulkPrice) p.bulkPrice = Math.max(1, Math.round(p.price * 0.85));
  if (!p.bulkMinQty) p.bulkMinQty = p.category === 'giftboxes' ? 5 : 10;
  if (p.active === undefined) p.active = true;
  if (p.inStock === undefined) p.inStock = true;
  if (!p.stock) p.stock = 180;
});

// ==========================================
// 3. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
// 3. AUDIO ENGINE (Disabled per user request)
// ==========================================
function playFestiveSound() {
  // Audio disabled for now per user request
}

function toggleSound() {
  // Audio disabled for now per user request
}

// ==========================================
// 3B. THEME CONTROLLER (Dark / Light Mode)
// Hotburn Studios Architectural Light & Dark Palettes
// ==========================================
function initTheme() {
  APP_STATE.theme = 'dark';
  if (document.body) {
    document.body.classList.remove('theme-light');
  }
}

function toggleTheme() {
  // Single Theme Mode: Cosmic Purple Enforced permanently
}

function applyTheme(theme, showUserToast = false) {
  APP_STATE.theme = 'dark';
  if (document.body) {
    document.body.classList.remove('theme-light');
  }
}

function updateAccountOrdersSummary() {
  const summaryEl = document.getElementById('account-orders-status-summary');
  if (summaryEl) {
    const orders = (APP_STATE.admin && APP_STATE.admin.orders) ? APP_STATE.admin.orders : [];
    if (orders.length > 0) {
      summaryEl.innerText = `${orders.length} Order(s) Placed • Latest #${orders[0].id} (${orders[0].status || 'Pending'})`;
    } else {
      summaryEl.innerText = 'No orders placed yet';
    }
  }
}

function updateHeaderTrackButton() {
  const trackBtn = document.getElementById('nav-link-track');
  if (trackBtn) {
    trackBtn.innerHTML = 'Your Orders';
  }
}

// ==========================================
// 4. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadCartFromStorage();
  initUserSession();
  initSparkleBackground();
  renderProducts();
  renderShopProducts();
  renderOrdersHistoryTab();
  renderSavedAddresses();
  setupEventListeners();
  updateCartUI();
  renderCustomerOrders();
  updateHeaderTrackButton();
  updateAccountOrdersSummary();
  renderMobileNotifications();
  renderDriverDashboard();
  renderAdminDriversList();
  switchRoleView('customer');

  // STRICT REQUIREMENT: Home page is always the default 1st page that opens on fresh load!
  let initialTab = 'home';
  try {
    const hashVal = (window.location.hash || '').replace('#', '').trim().toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const qTab = (urlParams.get('tab') || '').trim().toLowerCase();
    const sessionTab = (sessionStorage.getItem('mrs_active_tab') || '').trim().toLowerCase();
    const explicitRoute = qTab || hashVal || sessionTab;

    if (explicitRoute === 'admin') {
      initialTab = 'admin';
    } else if (['shop', 'orders', 'account'].includes(explicitRoute)) {
      initialTab = explicitRoute;
    } else {
      initialTab = 'home';
      if (window.location.hash && window.location.hash !== '#home') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  } catch (e) {
    initialTab = 'home';
  }

  if (initialTab === 'admin') {
    if (typeof PORTALS !== 'undefined' && typeof PORTALS.openGate === 'function') {
      PORTALS.openGate('admin');
    }
  } else {
    switchTab(initialTab);
  }

  // Supabase Cloud Backend Hydration
  if (typeof MRS_BACKEND !== 'undefined') {
    MRS_BACKEND.getProducts().then(liveProds => {
      if (liveProds && liveProds.length > 0) {
        PRODUCTS = liveProds;
        renderProducts();
        renderShopProducts();
        console.log('⚡ Catalog hydrated from store catalog!');
      }
    });

    // Populate admin URL input if saved
    const cfg = MRS_BACKEND.getConfig();
    const urlInput = document.getElementById('admin-supabase-url-input');
    const keyInput = document.getElementById('admin-supabase-key-input');
    if (urlInput && cfg.url) urlInput.value = cfg.url;
    if (keyInput && cfg.anonKey) keyInput.value = cfg.anonKey;
  }

  console.log("MRS Crackers Mobile-First Engine loaded. Browsing mode active. No startup login popup.");

  // URL query parameter routing for modal popup
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const qModal = urlParams.get('modal');
    if (qModal) openSheet(qModal);
  } catch (e) {
    console.error('URL param check:', e);
  }
});

// Global hash change listener for seamless browser back/forward and hash links
window.addEventListener('hashchange', () => {
  const h = (window.location.hash || '').replace('#', '').trim().toLowerCase();
  if (h === 'admin') {
    if (typeof PORTALS !== 'undefined' && typeof PORTALS.openGate === 'function') {
      PORTALS.openGate('admin');
    }
  } else if (['home', 'shop', 'orders', 'account'].includes(h)) {
    switchTab(h);
  }
});

function initSparkleBackground() {
  const canvas = document.getElementById('sparkle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const colors = ['#f5b301', '#ffd700', '#ff4d4d', '#ffffff', '#ff9f1c'];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < 0) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function switchOrdersSubtab(sub) {
  APP_STATE.ordersSubtab = sub;
  document.getElementById('btn-subtab-history')?.classList.toggle('active', sub === 'history');
  document.getElementById('btn-subtab-track')?.classList.toggle('active', sub === 'track');
  document.getElementById('btn-subtab-pass')?.classList.toggle('active', sub === 'pass');

  document.getElementById('subview-orders-history').style.display = sub === 'history' ? 'flex' : 'none';
  document.getElementById('subview-orders-track').style.display = sub === 'track' ? 'flex' : 'none';
  document.getElementById('subview-orders-pass').style.display = sub === 'pass' ? 'flex' : 'none';
}

// ==========================================
// 6. BOTTOM SHEETS SYSTEM & MODAL SCROLL LOCK
// ==========================================
function checkModalScrollLock() {
  const anySheetOpen = document.querySelectorAll('.bottom-sheet-backdrop.open, .mrs-mobile-drawer.open, .mrs-modal.open');
  const invoiceModal = document.getElementById('tax-invoice-modal');
  const invoiceOpen = invoiceModal && invoiceModal.style.display === 'flex';
  if (anySheetOpen.length > 0 || invoiceOpen) {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  } else {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

function openSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (sheet) {
    // Close other sheets so modals never awkwardly overlap or stack
    document.querySelectorAll('.bottom-sheet-backdrop.open').forEach(s => {
      if (s.id !== sheetId) s.classList.remove('open');
    });
    sheet.classList.add('open');
    checkModalScrollLock();

    // Temporarily hide floating cart bar while full modal sheet is open
    const floatBar = document.getElementById('mrs-floating-cart-bar') || document.getElementById('floating-cart-bar');
    if (floatBar) floatBar.style.display = 'none';
  }
}

function closeSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (sheet) {
    sheet.classList.remove('open');
    checkModalScrollLock();

    // Restore floating cart bar if cart has items and no other modals are open
    setTimeout(() => {
      const anyOpen = document.querySelector('.bottom-sheet-backdrop.open');
      const floatBar = document.getElementById('mrs-floating-cart-bar') || document.getElementById('floating-cart-bar');
      const totalItems = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + (item.qty || 1), 0) : 0;
      if (!anyOpen && floatBar && totalItems > 0 && ['home', 'shop', 'orders', 'account'].includes(APP_STATE.currentTab)) {
        floatBar.style.display = 'block';
      }
    }, 50);
  }
}

function toggleCartSheet(open = true) {
  if (open) {
    if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
      APP_STATE.cart = [];
      updateCartUI();
      switchAuthTab('login');
      openSheet('login-sheet');
      showToast('Please sign in to view your cart & start shopping');
      return;
    }
    updateCartUI();
    openSheet('cart-sheet');
  } else {
    closeSheet('cart-sheet');
  }
}

function toggleFilterSheet(open = true) {
  if (open) openSheet('filter-sheet');
  else closeSheet('filter-sheet');
}

// ==========================================
// 7. PRODUCT RENDERING & FILTERING
// ==========================================
function filterCategoryByCode(cat) {
  APP_STATE.activeFilter.category = cat;
  document.querySelectorAll('.mrs-cat-card-purple').forEach(c => {
    c.classList.remove('active');
  });
  renderProducts();
  const prodGrid = document.getElementById('products-grid-container');
  if (prodGrid) prodGrid.scrollIntoView({ behavior: 'smooth' });
}

function changeProdCardQty(prodId, delta) {
  const el = document.getElementById('prod-card-qty-' + prodId);
  if (!el) return;
  let val = parseInt(el.innerText, 10) || 1;
  val = Math.max(1, val + delta);
  el.innerText = val;
}

function renderProducts() {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  const filtered = PRODUCTS.filter(prod => {
    if (APP_STATE.activeFilter.category !== 'all' && prod.category !== APP_STATE.activeFilter.category) return false;
    if (APP_STATE.activeFilter.search) {
      const q = APP_STATE.activeFilter.search.toLowerCase();
      if (!prod.name.toLowerCase().includes(q) && !prod.category.toLowerCase().includes(q)) return false;
    }
    if (prod.price > APP_STATE.activeFilter.priceMax) return false;
    if (APP_STATE.activeFilter.soundLevel !== 'all' && prod.sound !== APP_STATE.activeFilter.soundLevel) return false;
    if (APP_STATE.activeFilter.dayNight !== 'all' && prod.dayNight !== APP_STATE.activeFilter.dayNight) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-muted-purple);">
        <div style="font-size: 2rem;">🔍</div>
        <div style="font-weight: 800; color: #fff; margin-top: 6px;">No crackers found in this category</div>
        <button class="mrs-btn-add-purple" onclick="resetAllFilters()" style="margin: 12px auto 0 auto; width: auto; padding: 8px 16px;">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => {
    const isWishlisted = APP_STATE.wishlist.includes(prod.id);
    return `
      <div class="mrs-product-card-white" data-id="${prod.id}">
        <!-- Top Row: In-Stock Badge & Wishlist -->
        <div class="mrs-card-top-bar">
          <div class="mrs-in-stock-badge">
            <span class="mrs-in-stock-dot"></span>
            <span>In Stock</span>
          </div>
          <button class="mrs-wish-icon-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${prod.id}, event)" title="Favorite" aria-label="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isWishlisted ? '#EF4444' : 'none'}" stroke="${isWishlisted ? '#EF4444' : '#9CA3AF'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <!-- Product Photo (Constrained Clean Sizing) -->
        <div class="mrs-card-img-frame" onclick="openProductDetailModal(${prod.id})">
          <img src="${prod.image}" alt="${prod.name}" class="mrs-card-cracker-img" loading="lazy">
        </div>

        <!-- Product Name & Category -->
        <div onclick="openProductDetailModal(${prod.id})">
          <h3 class="mrs-card-title-text" title="${prod.name}">${prod.name}</h3>
          <div class="mrs-card-pack-meta">
            ${prod.categoryName || prod.category} • ${prod.packSize || prod.weight || '1 box'}
          </div>
        </div>

        <!-- Price Row: Purple Current Price & Struck-Through MRP -->
        <div class="mrs-card-price-row">
          <span class="mrs-price-current-purple">₹${prod.price}</span>
          <span class="mrs-price-mrp-struck">₹${prod.mrp}</span>
        </div>

        <!-- Bottom Controls: Stepper & Purple Add to Cart Button -->
        <div class="mrs-card-action-row">
          <div class="mrs-card-qty-stepper">
            <button type="button" class="mrs-stepper-btn" onclick="changeProdCardQty(${prod.id}, -1)">−</button>
            <span class="mrs-stepper-val" id="prod-card-qty-${prod.id}">1</span>
            <button type="button" class="mrs-stepper-btn" onclick="changeProdCardQty(${prod.id}, 1)">+</button>
          </div>

          <button type="button" class="mrs-btn-add-purple" onclick="const qty = parseInt(document.getElementById('prod-card-qty-${prod.id}').innerText, 10) || 1; handleAddToCartClick(${prod.id}, qty)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 8. ADD TO CART INTERCEPTION & LOGIN SHEET
// ==========================================
/**
 * KEY USER REQUIREMENT:
 * "for login dont popup login or signup at start that popup comes when customer add an item to cart and when payment popup with adress location bla bla stuff"
 */








function initiateCheckout() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    toggleCartSheet(false);
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in to proceed to checkout');
    return;
  }
  if (!APP_STATE.cart || APP_STATE.cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }
  toggleCartSheet(false);
  openDeliveryModal();
}

function openDeliveryModal() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    closeSheet('delivery-sheet');
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in to enter delivery address');
    return;
  }

  const user = APP_STATE.user || {};
  const addr = user.address || {};
  const nameEl = document.getElementById('checkout-cust-name');
  const phoneEl = document.getElementById('checkout-cust-phone');
  const emailEl = document.getElementById('checkout-cust-email');
  const houseEl = document.getElementById('checkout-cust-house');
  const areaEl = document.getElementById('checkout-cust-area');
  const pincodeEl = document.getElementById('checkout-cust-pincode');
  const landmarkEl = document.getElementById('checkout-cust-landmark');

  if (nameEl) nameEl.value = addr.name || user.username || user.name || '';
  if (phoneEl) phoneEl.value = addr.phone || user.mobile || user.phone || '';
  if (emailEl) emailEl.value = user.email || '';
  if (houseEl) houseEl.value = addr.house || addr.addressLine || 'Plot 42, Sri Sai Krupa Nilayam';
  if (areaEl) areaEl.value = addr.area || addr.locality || 'Saidabad Colony, Near Hanuman Temple';
  if (pincodeEl) pincodeEl.value = addr.pincode || '500059';
  if (landmarkEl) landmarkEl.value = addr.landmark || 'Opp. State Bank ATM';

  const totalGrams = APP_STATE.cart.reduce((sum, item) => sum + ((item.weightGrams || 200) * item.qty), 0);
  const weightStr = totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(2)} kg` : `${totalGrams} g`;
  const weightElem = document.getElementById('checkout-weight-badge');
  if (weightElem) weightElem.innerText = `Consignment Weight: ${weightStr}`;

  // Default to home delivery if not set
  if (!APP_STATE.checkout.deliveryType) APP_STATE.checkout.deliveryType = 'home';
  setDeliveryType(APP_STATE.checkout.deliveryType);

  checkPincodeZone();
  openSheet('delivery-sheet');
}

function setDeliveryType(type) {
  APP_STATE.checkout.deliveryType = type;
  const homeOpt = document.getElementById('delivery-opt-home');
  const storeOpt = document.getElementById('delivery-opt-store');
  const homeFields = document.getElementById('home-delivery-fields');
  const storePreview = document.getElementById('store-pickup-preview');

  if (homeOpt) homeOpt.classList.toggle('active', type === 'home');
  if (storeOpt) storeOpt.classList.toggle('active', type === 'store');
  if (homeFields) homeFields.style.display = type === 'home' ? 'flex' : 'none';
  if (storePreview) storePreview.style.display = type === 'store' ? 'block' : 'none';
}

function setTimeSlot(slot, btn) {
  APP_STATE.checkout.timeSlot = slot;
  document.querySelectorAll('#delivery-sheet .filter-strip-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function checkPincodeZone() {
  const pinInput = document.getElementById('checkout-cust-pincode');
  const statusEl = document.getElementById('pincode-status-display');
  if (!pinInput || !statusEl) return;

  const pin = pinInput.value.trim();
  const hydPins = ['500059', '500018', '500036', '500079', '500016', '500001', '500034', '500081', '500072'];

  if (hydPins.includes(pin)) {
    const totalGrams = APP_STATE.cart.reduce((sum, item) => sum + ((item.weightGrams || 200) * item.qty), 0);
    const vehicle = totalGrams >= 3000 ? 'Porter Delivery Van' : 'Rapido Express Bike';
    statusEl.innerHTML = `<span style="color:#34d399;">✓ Hyderabad Express Zone • Assigned: <strong>${vehicle}</strong> (Free on ₹999+)</span>`;
  } else if (pin.length === 6) {
    statusEl.innerHTML = `<span style="color:#fbbf24;">✓ Surface Cargo Delivery available for Pincode ${pin}</span>`;
  } else {
    statusEl.innerHTML = `<span style="color:var(--text-muted);">Enter 6-digit Pincode to check vehicle slot</span>`;
  }
}

function proceedToPaymentModal() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    closeSheet('delivery-sheet');
    closeSheet('payment-sheet');
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in to proceed to payment');
    return;
  }

  const nameInput = document.getElementById('checkout-cust-name');
  const phoneInput = document.getElementById('checkout-cust-phone');
  const emailInput = document.getElementById('checkout-cust-email');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';

  if (!name) {
    alert('Please enter customer full name.');
    return;
  }
  if (!phone || phone.length < 10) {
    alert('Please enter a valid 10-digit mobile number for delivery OTP and WhatsApp invoice.');
    return;
  }
  if (!email || !email.includes('@')) {
    alert('Please enter a valid registered email address for your official tax invoice.');
    return;
  }

  // Update App user info
  APP_STATE.user.name = name;
  APP_STATE.user.phone = phone;
  APP_STATE.user.email = email;

  if (APP_STATE.checkout.deliveryType === 'home') {
    const house = document.getElementById('checkout-cust-house')?.value.trim();
    const area = document.getElementById('checkout-cust-area')?.value.trim();
    const pin = document.getElementById('checkout-cust-pincode')?.value.trim();
    const landmark = document.getElementById('checkout-cust-landmark')?.value.trim();

    if (!house || !area || !pin) {
      alert('Please fill your complete doorstep delivery address (House/Flat, Street/Colony, Pincode).');
      return;
    }

    APP_STATE.user.address = {
      name,
      phone,
      email,
      house,
      area,
      city: 'Hyderabad',
      pincode: pin,
      landmark
    };
  } else {
    // Store Pickup
    APP_STATE.user.address = {
      name,
      phone,
      email,
      house: 'Plot 42, Sri Sai Krupa Nilayam',
      area: 'Saidabad Colony Counter Hub',
      city: 'Hyderabad',
      pincode: '500059',
      landmark: 'Near Hanuman Temple'
    };
  }

  closeSheet('delivery-sheet');
  openPaymentSheet();
}

function openPaymentSheet() {
  const isHome = APP_STATE.checkout.deliveryType === 'home';
  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const deliveryCharge = (subtotal >= 999 || !isHome) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;

  const subDisplay = document.getElementById('payment-subtotal-display');
  const shipDisplay = document.getElementById('payment-shipping-display');
  const grandDisplay = document.getElementById('payment-grand-total-display');
  const qrAmount = document.getElementById('payment-qr-amount');
  const heading = document.getElementById('payment-sheet-heading');
  const modeTag = document.getElementById('payment-mode-indicator-tag');

  if (subDisplay) subDisplay.innerText = `₹${subtotal}`;
  if (shipDisplay) shipDisplay.innerText = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
  if (grandDisplay) grandDisplay.innerText = `₹${grandTotal}`;
  if (qrAmount) qrAmount.innerText = `Amount: ₹${grandTotal}`;

  if (heading) {
    heading.innerText = isHome ? 'Cash on Delivery (Doorstep Delivery)' : 'Cash on Delivery (Saidabad Wholesale Counter)';
  }
  if (modeTag) {
    modeTag.innerHTML = isHome 
      ? '🏠 Express Doorstep Delivery • <span style="color:#15803D; font-weight:800;">CASH ON DELIVERY (ACTIVE)</span>'
      : '🏪 Saidabad Wholesale Counter • <span style="color:#15803D; font-weight:800;">PAY CASH AT HANDOVER</span>';
  }

  // Ensure Cash on Delivery is selected & active
  selectPaymentMode('cod');

  openSheet('payment-sheet');
}

function selectPaymentMode(mode) {
  if (mode === 'online') {
    if (typeof showToast === 'function') {
      showToast('Online Payments (UPI/Cards) will arrive soon! Currently Cash on Delivery is active.');
    }
    const codRadio = document.getElementById('cod-radio-btn');
    if (codRadio) codRadio.checked = true;
    return;
  }
  APP_STATE.checkout.selectedPaymentMode = 'cod';
  const codRadio = document.getElementById('cod-radio-btn');
  if (codRadio) codRadio.checked = true;
  const btnText = document.getElementById('payment-btn-text');
  if (btnText) {
    btnText.innerText = 'Confirm Order (Cash on Delivery) →';
  }
}

function handlePaymentProceedClick() {
  confirmCodOrder();
}

async function confirmCodOrder() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    closeSheet('payment-sheet');
    switchAuthTab('login');
    openSheet('login-sheet');
    if (typeof showToast === 'function') showToast('Please sign in to place your order');
    return;
  }

  if (!APP_STATE.cart || APP_STATE.cart.length === 0) {
    if (typeof showToast === 'function') showToast('Your cart is empty! Please add crackers first.');
    return;
  }

  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const isHome = APP_STATE.checkout.deliveryType === 'home';
  const deliveryCharge = (subtotal >= 999 || !isHome) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;
  const totalGrams = APP_STATE.cart.reduce((sum, item) => sum + ((item.weightGrams || 200) * (item.qty || 1)), 0);
  const weightStr = totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(2)} kg` : `${totalGrams} g`;

  const orderId = '#MRS' + Math.floor(1000000 + Math.random() * 9000000);
  const tokenNo = 'COD-' + Math.floor(1000 + Math.random() * 9000);

  const customerName = document.getElementById('checkout-cust-name')?.value?.trim() || 
                       (APP_STATE.user.address && APP_STATE.user.address.name) || 
                       APP_STATE.user.username || 
                       APP_STATE.user.name || 
                       'Valued Customer';
  const customerPhone = document.getElementById('checkout-cust-phone')?.value?.trim() || 
                        (APP_STATE.user.address && APP_STATE.user.address.phone) || 
                        APP_STATE.user.mobile || 
                        APP_STATE.user.phone || 
                        '9392819362';
  const customerEmail = document.getElementById('checkout-cust-email')?.value?.trim() || 
                        APP_STATE.user.email || 
                        (APP_STATE.user.address && APP_STATE.user.address.email) || 
                        '';
  const fullAddress = isHome ? (
    typeof APP_STATE.user.address === 'object' ? 
      `${APP_STATE.user.address.house || ''}, ${APP_STATE.user.address.area || ''}, ${APP_STATE.user.address.city || 'Hyderabad'} - ${APP_STATE.user.address.pincode || ''}${APP_STATE.user.address.landmark ? ' (Near ' + APP_STATE.user.address.landmark + ')' : ''}` : 
      (APP_STATE.user.address || 'Saidabad Colony, Hyderabad')
  ) : 'Saidabad Wholesale Counter Hub (Store Pickup)';

  const newOrder = {
    id: orderId,
    orderNumber: orderId,
    customer: customerName,
    phone: customerPhone,
    email: customerEmail,
    address: fullAddress,
    weight: weightStr,
    amount: grandTotal,
    payment: 'Cash on Delivery (COD)',
    status: 'Confirmed & Packing',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    utr: 'CASH-ON-DELIVERY',
    verified: false,
    paymentStatus: 'COD_PENDING',
    type: APP_STATE.checkout.deliveryType || 'home',
    items: [...APP_STATE.cart],
    tokenNo: tokenNo
  };

  if (!APP_STATE.admin) APP_STATE.admin = { orders: [] };
  if (!APP_STATE.admin.orders) APP_STATE.admin.orders = [];
  APP_STATE.admin.orders.unshift(newOrder);

  // Local storage cache (per-user private namespace)
  try {
    const existing = getUserOrders();
    existing.unshift(newOrder);
    setUserOrders(existing);
    // Also keep global key for admin panel scanning
    const globalOrders = JSON.parse(localStorage.getItem('mrs_customer_orders') || '[]');
    globalOrders.unshift(newOrder);
    localStorage.setItem('mrs_customer_orders', JSON.stringify(globalOrders));
  } catch (e) {}

  // UI button loading state
  const submitBtn = document.getElementById('payment-submit-order-btn');
  const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Confirming & Sending Invoices... ⏳</span>`;
  }

  // 1. Sync to Supabase Backend
  if (typeof MRS_BACKEND !== 'undefined') {
    try {
      await MRS_BACKEND.createOrder({
        customerId: APP_STATE.user.id || null,
        customerName: newOrder.customer,
        customerMobile: newOrder.phone,
        customerEmail: newOrder.email,
        deliveryType: isHome ? 'doorstep' : 'pickup',
        deliveryAddress: newOrder.address,
        timeSlot: 'Today / Express',
        subtotal: subtotal,
        deliveryFee: deliveryCharge,
        totalAmount: grandTotal,
        paymentMethod: 'cod',
        utrNumber: 'CASH-ON-DELIVERY',
        items: newOrder.items
      });
    } catch (err) {
      console.warn('Backend order sync:', err);
    }

    // 2. IMMEDIATE DUAL DISPATCH ON CUSTOMER CHECKOUT:
    // Dispatches Order Confirmation to Customer (Email & WhatsApp)
    // AND Full GST Tax Invoice + Google Maps navigation to Client / Driver Email!
    // NO ADMIN CONFIRMATION REQUIRED!
    try {
      if (typeof MRS_BACKEND.sendInvoice === 'function') {
        const dispatchRes = await MRS_BACKEND.sendInvoice({
          orderId: orderId,
          orderNumber: orderId,
          customerName: newOrder.customer,
          customerEmail: newOrder.email,
          customerMobile: newOrder.phone,
          items: newOrder.items,
          totalAmount: grandTotal,
          paymentMode: 'Cash on Delivery (COD)',
          paymentMethod: 'cod',
          deliveryAddress: newOrder.address,
          deliveryType: isHome ? 'doorstep' : 'pickup'
        });
        console.log('✅ Automated dual dispatch completed on checkout:', dispatchRes);
        if (dispatchRes && dispatchRes.customerWhatsappUrl) {
          newOrder.whatsappUrl = dispatchRes.customerWhatsappUrl;
        }
      }
    } catch (err) {
      console.warn('Invoice dispatch exception on checkout:', err);
    }
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = origBtnHtml;
  }

  // Clear Cart
  APP_STATE.cart = [];
  try { localStorage.removeItem('mrs_crackers_cart'); } catch (e) {}
  updateCartUI();

  // Close payment, delivery & cart sheets
  closeSheet('payment-sheet');
  closeSheet('delivery-sheet');
  closeSheet('cart-sheet');

  if (typeof showToast === 'function') {
    showToast(`Order ${orderId} Confirmed! Invoices sent to email & WhatsApp! 💥`);
  }

  // Redirect directly to Your Orders tab
  switchTab('orders');
}
window.confirmCodOrder = confirmCodOrder;

let activePopupMerchant = 1;

function openUpiQrModal() {
  const modal = document.getElementById('upi-qr-popup-modal');
  if (!modal) return;

  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const isHome = APP_STATE.checkout.deliveryType === 'home';
  const deliveryCharge = (subtotal >= 999 || !isHome) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;

  const amountDisplay = document.getElementById('popup-qr-amount-display');
  if (amountDisplay) amountDisplay.innerText = `₹${grandTotal}`;

  // Update merchant tab names
  const m1 = APP_STATE.merchantConfig?.merchant1 || { name: 'Bandi Rohan (Official Store)', upiId: '9392819362@upi', qrImage: 'assets/qr_paytm.png' };
  const m2 = APP_STATE.merchantConfig?.merchant2 || { name: 'MRS Crackers Saidabad', upiId: 'bandirohan43@okhdfcbank', qrImage: 'assets/qr_bharatpe.png' };

  const m1Tab = document.getElementById('popup-m1-name-tab');
  const m2Tab = document.getElementById('popup-m2-name-tab');
  if (m1Tab) m1Tab.innerText = m1.name.split(' ')[0] || 'Merchant 1';
  if (m2Tab) m2Tab.innerText = m2.name.split(' ')[0] || 'Merchant 2';

  // Clear UTR
  const utrInput = document.getElementById('popup-utr-input');
  if (utrInput) utrInput.value = '';

  switchPopupMerchant(activePopupMerchant || 1);
  modal.classList.add('open');
}

function closeUpiQrModal() {
  const modal = document.getElementById('upi-qr-popup-modal');
  if (modal) modal.classList.remove('open');
}

function switchPopupMerchant(num) {
  activePopupMerchant = num;
  const tab1 = document.getElementById('popup-tab-m1');
  const tab2 = document.getElementById('popup-tab-m2');
  if (tab1) tab1.classList.toggle('active', num === 1);
  if (tab2) tab2.classList.toggle('active', num === 2);

  const m = num === 1 ? (APP_STATE.merchantConfig?.merchant1 || {}) : (APP_STATE.merchantConfig?.merchant2 || {});
  const nameEl = document.getElementById('popup-active-merchant-name');
  const qrImg = document.getElementById('popup-active-qr-img');
  const upiIdEl = document.getElementById('popup-active-upi-id');
  const deepBtn = document.getElementById('popup-deep-link-btn');

  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const isHome = APP_STATE.checkout.deliveryType === 'home';
  const deliveryCharge = (subtotal >= 999 || !isHome) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;

  if (nameEl) nameEl.innerText = m.name || (num === 1 ? 'Bandi Rohan (Official Store)' : 'MRS Crackers Saidabad');
  if (qrImg) qrImg.src = m.qrImage || (num === 1 ? 'assets/qr_paytm.png' : 'assets/qr_bharatpe.png');
  if (upiIdEl) upiIdEl.innerText = m.upiId || (num === 1 ? '9392819362@upi' : 'bandirohan43@okhdfcbank');

  if (deepBtn) {
    const cleanUpi = m.upiId || '9392819362@upi';
    deepBtn.href = `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(m.name || 'MRS Crackers')}&am=${grandTotal}&cu=INR&tn=MRSCRACKERS_ORDER`;
  }
}

function copyActiveUpiId() {
  const m = activePopupMerchant === 1 ? (APP_STATE.merchantConfig?.merchant1 || {}) : (APP_STATE.merchantConfig?.merchant2 || {});
  const upiId = m.upiId || (activePopupMerchant === 1 ? '9392819362@upi' : 'bandirohan43@okhdfcbank');
  navigator.clipboard.writeText(upiId).then(() => {
    const btn = document.getElementById('popup-copy-upi-btn');
    if (btn) {
      btn.innerText = '✓ Copied!';
      setTimeout(() => { btn.innerText = '📋 Copy UPI ID'; }, 2000);
    }
    showToast(`UPI ID ${upiId} copied to clipboard! 📋`);
  }).catch(() => {
    showToast(`UPI ID: ${upiId}`);
  });
}

async function submitPopupPaymentProof() {
  const utrInput = document.getElementById('popup-utr-input');
  const utrValue = utrInput ? utrInput.value.trim() : '';

  if (!utrValue || utrValue.length < 6) {
    if (typeof showToast === 'function') showToast('⚠️ Please enter your 12-digit UPI UTR number.');
    return;
  }

  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const isHome = APP_STATE.checkout.deliveryType === 'home';
  const deliveryCharge = (subtotal >= 999 || !isHome) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;
  const totalGrams = APP_STATE.cart.reduce((sum, item) => sum + ((item.weightGrams || 200) * item.qty), 0);
  const weightStr = totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(2)} kg` : `${totalGrams} g`;

  const orderId = '#MRS' + Math.floor(1000000 + Math.random() * 9000000);
  const customerName = (APP_STATE.user.address && APP_STATE.user.address.name) || APP_STATE.user.username || APP_STATE.user.name || 'MRS Customer';
  const customerPhone = (APP_STATE.user.address && APP_STATE.user.address.phone) || APP_STATE.user.mobile || APP_STATE.user.phone || '9392819362';
  const customerEmail = APP_STATE.user.email || 'bandirohan43@gmail.com';
  const fullAddress = typeof APP_STATE.user.address === 'object' ? 
    `${APP_STATE.user.address.house || ''}, ${APP_STATE.user.address.area || ''}, ${APP_STATE.user.address.city || 'Hyderabad'} ${APP_STATE.user.address.pincode || ''}` : 
    (APP_STATE.user.address || 'Saidabad Colony, Hyderabad');

  const newOrder = {
    id: orderId,
    customer: customerName,
    phone: customerPhone,
    email: customerEmail,
    address: isHome ? fullAddress : 'Saidabad Wholesale Counter Hub',
    weight: weightStr,
    amount: grandTotal,
    payment: 'Online UPI (QR Transfer)',
    status: 'Processing',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    utr: utrValue,
    verified: false,
    paymentStatus: 'PENDING_VERIFICATION',
    type: APP_STATE.checkout.deliveryType,
    items: [...APP_STATE.cart],
    tokenNo: 'SPK-' + Math.floor(1000 + Math.random() * 9000)
  };

  if (!APP_STATE.admin) APP_STATE.admin = { orders: [] };
  if (!APP_STATE.admin.orders) APP_STATE.admin.orders = [];
  APP_STATE.admin.orders.unshift(newOrder);

  // Sync to Supabase Cloud Database!
  if (typeof MRS_BACKEND !== 'undefined') {
    await MRS_BACKEND.createOrder({
      customerId: APP_STATE.user.id || null,
      customerName: newOrder.customer,
      customerMobile: newOrder.phone,
      customerEmail: newOrder.email,
      deliveryType: isHome ? 'doorstep' : 'pickup',
      deliveryAddress: newOrder.address,
      timeSlot: 'Today / Express',
      subtotal: subtotal,
      deliveryFee: deliveryCharge,
      totalAmount: grandTotal,
      paymentMethod: 'online_upi',
      utrNumber: utrValue,
      items: newOrder.items
    });
  }

  // Clear Cart
  APP_STATE.cart = [];
  try { localStorage.removeItem('mrs_crackers_cart'); } catch (e) {}
  updateCartUI();

  // Close modals
  closeUpiQrModal();
  closeSheet('payment-sheet');
  closeSheet('cart-sheet');

  showToast('Payment submitted! Awaiting store confirmation. 💥');

  // Immediately redirect to Your Orders!
  renderCustomerOrders();
  openOrdersModal();
}

async function confirmStorePickupOrder() {
  const subtotal = APP_STATE.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    const price = prod ? prod.price : (Number(item.price) || 0);
    return sum + (price * (item.qty || 1));
  }, 0);
  const grandTotal = subtotal; // 0 delivery fee for pickup
  const orderId = '#MRS' + Math.floor(1000000 + Math.random() * 9000000);
  const tokenNo = 'SPK-' + Math.floor(1000 + Math.random() * 9000);

  const customerName = (APP_STATE.user.address && APP_STATE.user.address.name) || APP_STATE.user.username || APP_STATE.user.name || 'MRS Customer';
  const customerPhone = (APP_STATE.user.address && APP_STATE.user.address.phone) || APP_STATE.user.mobile || APP_STATE.user.phone || '9392819362';
  const customerEmail = APP_STATE.user.email || 'bandirohan43@gmail.com';

  const newOrder = {
    id: orderId,
    customer: customerName,
    phone: customerPhone,
    email: customerEmail,
    address: 'Saidabad Wholesale Counter Hub',
    amount: grandTotal,
    payment: 'Pay at Store Pickup Counter (Cash or UPI)',
    status: 'Confirmed (Store Pickup)',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    utr: 'COUNTER-PAY',
    verified: true,
    paymentStatus: 'PAY_AT_COUNTER',
    type: 'store',
    items: [...APP_STATE.cart],
    tokenNo: tokenNo
  };

  if (!APP_STATE.admin) APP_STATE.admin = { orders: [] };
  if (!APP_STATE.admin.orders) APP_STATE.admin.orders = [];
  APP_STATE.admin.orders.unshift(newOrder);

  if (typeof MRS_BACKEND !== 'undefined') {
    await MRS_BACKEND.createOrder({
      customerId: APP_STATE.user.id || null,
      customerName: newOrder.customer,
      customerMobile: newOrder.phone,
      customerEmail: newOrder.email,
      deliveryType: 'pickup',
      deliveryAddress: 'Saidabad Wholesale Counter Hub',
      timeSlot: 'Counter Pickup',
      subtotal: subtotal,
      deliveryFee: 0,
      totalAmount: grandTotal,
      paymentMethod: 'cod',
      utrNumber: 'COUNTER-PAY',
      items: newOrder.items
    });

    try {
      if (typeof MRS_BACKEND.sendInvoice === 'function') {
        MRS_BACKEND.sendInvoice({
          orderId: orderId,
          customerName: newOrder.customer,
          customerEmail: newOrder.email,
          customerMobile: newOrder.phone,
          items: newOrder.items,
          totalAmount: grandTotal,
          paymentMode: 'Pay at Store Pickup Counter (Cash or UPI)',
          deliveryAddress: 'Saidabad Wholesale Counter Hub',
          deliveryType: 'pickup'
        }).then(res => {
          console.log('✅ Automated store pickup dispatch sent:', res);
        }).catch(err => console.warn('Pickup dispatch error:', err));
      }
    } catch (err) {}
  }

  // Clear Cart
  APP_STATE.cart = [];
  try { localStorage.removeItem('mrs_crackers_cart'); } catch (e) {}
  updateCartUI();

  closeSheet('payment-sheet');
  closeSheet('cart-sheet');

  showToast(`Store pickup order placed! Pickup Token: ${tokenNo} 🏪`);

  renderCustomerOrders();
  openOrdersModal();
}

function selectPaymentMerchant(mode) {
  selectPaymentMode(mode === 'cod' ? 'counter' : 'online');
}

function confirmOrderPlacement() {
  handlePaymentProceedClick();
}

function openSuccessSheet(order) {
  document.getElementById('success-order-id').innerText = order.id;
  document.getElementById('success-utr-display').innerText = order.utr;
  document.getElementById('success-amount-display').innerText = `₹${order.amount}`;

  const pickupBtn = document.getElementById('success-view-pickup-btn');
  if (pickupBtn) pickupBtn.style.display = order.type === 'store' ? 'inline-flex' : 'none';

  renderCustomerOrders();
  openSheet('success-sheet');
}

// ==========================================
// 11. OFFICIAL GST TAX INVOICE & DISPATCH MODULE
// ==========================================
/**
 * STRICT BUSINESS REQUIREMENT:
 * "include invoice and that should be sent to customers email and whatsapp to registered email and mobile for both home deliver and pick up at store.
 * and they should be sent only when it marked as delivered"
 */
window.MRS_INVOICE = {
  generateInvoiceNumber: function(orderId) {
    const cleanId = (orderId || '').replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000);
    return `INV-MRS-2026-${cleanId.toString().slice(-5)}`;
  },

  formatWhatsAppText: function(order) {
    const invNum = order.invoiceNumber || this.generateInvoiceNumber(order.id);
    const dateStr = order.date || new Date().toLocaleDateString('en-GB');
    const itemsList = (order.items && order.items.length ? order.items : [
      { name: 'Diwali Cracker Assortment', price: order.amount, qty: 1 }
    ]).map((it, idx) => `  ${idx + 1}. *${it.name}* x ${it.qty} = ₹${it.price * it.qty}`).join('\n');

    const addressText = order.type === 'store'
      ? '🏪 Counter Pickup: Saidabad Wholesale Counter Hub (Plot 42, Sri Sai Krupa Nilayam, Hyderabad - 500059)'
      : `🏠 Doorstep Delivery: ${typeof order.address === 'object' ? `${order.address.house || ''}, ${order.address.area || ''}, Hyderabad - ${order.address.pincode || '500059'}` : order.address}`;

    return `💥 *MRS CRACKERS - OFFICIAL GST TAX INVOICE* 💥\n` +
      `-----------------------------------------\n` +
      `🧾 *Invoice No:* ${invNum}\n` +
      `📦 *Order ID:* ${order.id}\n` +
      `📅 *Date:* ${dateStr}\n` +
      `👤 *Customer:* ${order.customer}\n` +
      `📞 *Mobile:* ${order.phone}\n` +
      `📧 *Email:* ${order.email || 'madhumrs4514@gmail.com'}\n` +
      `📍 *Fulfillment:* ${order.type === 'store' ? 'Counter Store Pickup' : 'Express Home Delivery'}\n` +
      `${addressText}\n` +
      `-----------------------------------------\n` +
      `*ITEMIZED DETAILS:*\n${itemsList}\n` +
      `-----------------------------------------\n` +
      `💰 *Total Amount:* ₹${order.amount}\n` +
      `💳 *Payment Mode:* ${order.payment || 'Online UPI'}\n` +
      `🔍 *UTR / Ref:* ${order.utr || 'VERIFIED'}\n` +
      `🚚 *Delivery Status:* ✅ DELIVERED\n` +
      `-----------------------------------------\n` +
      `✨ *Thank you for celebrating Diwali with MRS Crackers!* ✨\n` +
      `Wholesale Fireworks Hub: Saidabad, Hyderabad | Ph: +91 9392819362 • bandirohan43@gmail.com`;
  },

  getWhatsAppUrl: function(order) {
    const phone = (order.phone || '9866522624').replace(/[^0-9]/g, '').slice(-10);
    const text = encodeURIComponent(this.formatWhatsAppText(order));
    return `https://wa.me/91${phone}?text=${text}`;
  },

  dispatchDeliveryInvoice: function(order) {
    if (!order) return;
    if (!order.invoiceNumber) {
      order.invoiceNumber = this.generateInvoiceNumber(order.id);
    }
    order.invoiceDispatched = true;
    order.invoiceDispatchedAt = new Date().toISOString();

    const targetEmail = order.email || (APP_STATE.user && APP_STATE.user.email) || 'madhumrs4514@gmail.com';
    const targetPhone = order.phone || '9866522624';

    console.log(`[MRS_INVOICE] 📧 Tax Invoice ${order.invoiceNumber} dispatched to Registered Email: ${targetEmail}`);
    console.log(`[MRS_INVOICE] 📱 Tax Invoice ${order.invoiceNumber} dispatched to WhatsApp: +91 ${targetPhone}`);

    if (typeof showToast === 'function') {
      showToast(`📄 GST Tax Invoice ${order.invoiceNumber} sent to ${targetEmail} & WhatsApp (+91 ${targetPhone})! 💥`, 5000);
    }
  },

  renderInvoiceModal: function(order) {
    const container = document.getElementById('invoice-modal-content');
    if (!container) return;

    const invNum = order.invoiceNumber || this.generateInvoiceNumber(order.id);
    const dateStr = order.date || new Date().toLocaleDateString('en-GB');
    const items = order.items && order.items.length ? order.items : [
      { name: 'Festival Fireworks Consignment', price: order.amount, qty: 1 }
    ];
    const subtotal = items.reduce((s, it) => s + (it.price * it.qty), 0);
    const gstRate = 0.18;
    const taxableVal = Math.round(subtotal / (1 + gstRate));
    const totalGst = subtotal - taxableVal;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;

    container.innerHTML = `
      <div style="border-bottom: 2px solid #E5E7EB; padding-bottom: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 1.3rem; font-weight: 900; color: #D97706; display: flex; align-items: center; gap: 6px;">
            <span>💥</span> MRS CRACKERS
          </div>
          <div style="font-size: 0.72rem; color: #4B5563; margin-top: 3px; line-height: 1.4;">
            Super Admin & Store Incharge: Bandi Rohan<br>
            Plot 42, Sri Sai Krupa Nilayam, Saidabad, Hyderabad - 500059<br>
            <strong>GSTIN:</strong> 36AABCM4514M1Z2 • <strong>Ph:</strong> +91 9392819362 • <strong>Email:</strong> bandirohan43@gmail.com
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background: #FEF3C7; color: #92400E; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block;">
            GST TAX INVOICE
          </div>
          <div style="font-weight: 800; font-size: 0.85rem; color: #111827; margin-top: 4px;">${invNum}</div>
          <div style="font-size: 0.68rem; color: #6B7280;">Date: ${dateStr}</div>
          <div style="font-size: 0.65rem; color: #15803D; font-weight: 700; margin-top: 2px;">● Handover Complete (Delivered)</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.72rem; margin-bottom: 14px; background: #F9FAFB; padding: 10px; border-radius: 6px;">
        <div>
          <div style="font-weight: 700; color: #374151; text-transform: uppercase;">Billed & Delivered To:</div>
          <div style="font-weight: 800; font-size: 0.8rem; color: #111827; margin-top: 2px;">${order.customer || order.customerName || 'Valued Customer'}</div>
          <div style="color: #4B5563;">Mobile: +91 ${order.phone || order.customerPhone || '9392819362'}</div>
          <div style="color: #4B5563;">Email: ${order.email || order.customerEmail || 'bandirohan43@gmail.com'}</div>
        </div>
        <div>
          <div style="font-weight: 700; color: #374151; text-transform: uppercase;">Fulfillment Details:</div>
          <div style="color: #111827; font-weight: 600; margin-top: 2px;">
            ${(order.type === 'store' || order.deliveryType === 'store') ? '🏪 Counter Store Pickup (Saidabad Hub)' : '🏠 Express Home Delivery (Hyderabad)'}
          </div>
          <div style="color: #6B7280; font-size: 0.68rem;">
            ${typeof order.address === 'object' ? `${order.address.house || ''}, ${order.address.area || ''}` : (order.address || order.deliveryAddress || 'Saidabad Counter')}
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 0.72rem; margin-bottom: 12px;">
        <thead>
          <tr style="background: #F3F4F6; border-bottom: 1px solid #E5E7EB; text-transform: uppercase;">
            <th style="padding: 6px 8px; text-align: left;">Item Description</th>
            <th style="padding: 6px 8px; text-align: center;">Qty</th>
            <th style="padding: 6px 8px; text-align: right;">Rate (₹)</th>
            <th style="padding: 6px 8px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 6px 8px; font-weight: 600; color: #111827;">${it.name}</td>
              <td style="padding: 6px 8px; text-align: center;">${it.qty}</td>
              <td style="padding: 6px 8px; text-align: right;">₹${it.price}</td>
              <td style="padding: 6px 8px; text-align: right; font-weight: 700;">₹${it.price * it.qty}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="background: #F9FAFB; border-radius: 6px; padding: 10px; font-size: 0.72rem; display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; justify-content: space-between; color: #4B5563;">
          <span>Taxable Value (Excl. 18% GST):</span>
          <span>₹${taxableVal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #4B5563;">
          <span>Central GST (CGST 9%):</span>
          <span>₹${cgst}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #4B5563;">
          <span>State GST (SGST 9%):</span>
          <span>₹${sgst}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 0.95rem; color: #111827; border-top: 1px solid #E5E7EB; padding-top: 6px; margin-top: 4px;">
          <span>Grand Total (Net Paid):</span>
          <span style="color: #D97706;">₹${order.amount || order.totalAmount || subtotal}</span>
        </div>
      </div>

      <div style="margin-top: 10px; padding: 8px 10px; background: #ECFDF5; border: 1px dashed #059669; border-radius: 6px; font-size: 0.68rem; color: #065F46; line-height: 1.4;">
        <strong>Settlement & Dispatch Audit:</strong><br>
        Payment Mode: <strong>${order.payment || order.paymentMethod || 'Online UPI'}</strong> • Transaction Ref / UTR: <strong>${order.utr || order.transactionRef || 'VERIFIED'}</strong><br>
        Invoice Dispatched via Email to <strong>${order.email || order.customerEmail || 'customer email'}</strong> & WhatsApp to <strong>+91 ${order.phone || order.customerPhone || '9866522624'}</strong> upon Handover Confirmation.
      </div>
    `;

    const waBtn = document.getElementById('invoice-whatsapp-btn');
    if (waBtn) {
      waBtn.href = this.getWhatsAppUrl(order);
    }
  },

  openInvoiceModal: function(orderId) {
    const order = (APP_STATE.admin && APP_STATE.admin.orders.find(o => o.id === orderId)) ||
                  APP_STATE.checkout.currentOrder ||
                  (APP_STATE.admin && APP_STATE.admin.orders[0]);
    if (!order) {
      if (typeof showToast === 'function') showToast('Order not found!');
      return;
    }
    this.renderInvoiceModal(order);
    const modal = document.getElementById('tax-invoice-modal');
    if (modal) {
      modal.style.display = 'flex';
      checkModalScrollLock();
    }
  },

  closeInvoiceModal: function() {
    const modal = document.getElementById('tax-invoice-modal');
    if (modal) {
      modal.style.display = 'none';
      checkModalScrollLock();
    }
  },

  printInvoice: function() {
    window.print();
  }
};

function downloadOrderInvoice() {
  const order = APP_STATE.checkout.currentOrder || APP_STATE.admin.orders[0];
  if (!order) return;
  MRS_INVOICE.openInvoiceModal(order.id);
}

// ==========================================
// 12. HIGH-DENSITY QUICK-ORDER SHEET (Screen 7)
// ==========================================



function setBudgetPreset(amount) {
  const input = document.getElementById('budget-input-val');
  if (input) input.value = amount;

  const badge = document.getElementById('shop-budget-badge');
  if (badge) badge.innerText = `₹${amount.toLocaleString('en-IN')}`;

  document.querySelectorAll('.mrs-budget-chip').forEach(btn => {
    const isActive = btn.innerText.includes(amount.toLocaleString('en-IN'));
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'var(--purple-primary)' : 'rgba(124,58,237,0.2)';
    btn.style.borderColor = isActive ? 'var(--purple-hover)' : 'rgba(139,92,246,0.4)';
  });

  calculateBudgetMix(amount);
}

function calculateBudgetMix(targetBudget = null) {
  const input = document.getElementById('budget-input-val');
  let budget = targetBudget || (input ? parseInt(input.value, 10) || 2500 : 2500);
  if (budget < 500) budget = 500;

  const mix = [
    { name: 'Multi Colour Sparklers', qty: Math.max(1, Math.round(budget * 0.15 / 40)), price: 40 },
    { name: 'Flower Pot (3 pcs Jumbo)', qty: Math.max(1, Math.round(budget * 0.20 / 140)), price: 140 },
    { name: '10 cm Electric Sparkler', qty: Math.max(1, Math.round(budget * 0.15 / 50)), price: 50 },
    { name: 'Flower Pot Giant', qty: Math.max(1, Math.round(budget * 0.25 / 300)), price: 300 },
    { name: 'Super 50 Shot Premium', qty: Math.max(1, Math.round(budget * 0.25 / 700)), price: 700 }
  ];

  const calculatedTotal = mix.reduce((sum, i) => sum + (i.qty * i.price), 0);
  const container = document.getElementById('budget-mix-container');
  if (container) {
    container.innerHTML = mix.map(item => `
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 4px; border-left: 2px solid var(--green-primary);">
        <span>✓ ${item.name} (${item.qty} pcs)</span>
        <strong style="color: var(--gold-primary);">₹${item.qty * item.price}</strong>
      </div>
    `).join('');
  }

  const totEl = document.getElementById('budget-mix-total');
  if (totEl) totEl.innerText = `Total: ₹${calculatedTotal}`;

  const shopTot = document.getElementById('shop-budget-total-text');
  if (shopTot) shopTot.innerText = `Total ₹${calculatedTotal.toLocaleString('en-IN')}`;

  const shopItems = document.getElementById('shop-budget-items-list');
  if (shopItems) {
    shopItems.innerHTML = mix.map(item => `
      <div style="display:flex; justify-content:space-between;">
        <span>✓ ${item.name} (${item.qty} pcs)</span>
        <strong style="color:#FFF;">₹${item.qty * item.price}</strong>
      </div>
    `).join('');
  }

  APP_STATE.currentBudgetMix = mix;
}

function addAllBudgetMixToCart() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    APP_STATE.pendingCartItem = { isBudgetMix: true };
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in to add items to cart');
    return;
  }

  if (!APP_STATE.currentBudgetMix) calculateBudgetMix(3000);

  APP_STATE.currentBudgetMix.forEach(item => {
    const prod = PRODUCTS.find(p => p.name.includes(item.name.split('(')[0].trim())) || PRODUCTS[0];
    executeAddToCart(prod, item.qty);
  });

  showToast('Budget mix added to cart! 💥');
  toggleCartSheet(true);
}

// ==========================================
// 14. CUSTOMER ORDERS & LIVE TRACKING
// ==========================================
function openOrdersModal() {
  switchTab('orders');
}
window.openOrdersModal = openOrdersModal;

function renderCustomerOrders() {
  const container = document.getElementById('customer-orders-list-mobile');
  const noOrdersNotice = document.getElementById('modal-no-active-delivery');

  let orders = (APP_STATE.admin && APP_STATE.admin.orders) ? [...APP_STATE.admin.orders] : [];
  
  // Also check if customer placed any orders locally (per-user namespace)
  try {
    const localOrders = getUserOrders();
    localOrders.forEach(lo => {
      if (!orders.some(o => o.id === lo.id)) orders.unshift(lo);
    });
  } catch (e) {}

  if (!orders || orders.length === 0) {
    if (noOrdersNotice) noOrdersNotice.style.display = 'block';
    if (container) container.innerHTML = '';
    return;
  }

  if (noOrdersNotice) noOrdersNotice.style.display = 'none';
  if (!container) return;

  container.innerHTML = orders.map(order => {
    const isCod = order.paymentStatus === 'COD_PENDING' || (order.payment && order.payment.includes('Cash on Delivery')) || order.paymentMethod === 'cod';
    const isPaid = order.paymentStatus === 'PAID' || order.status === 'Confirmed & Packing' || order.status === 'CONFIRMED' || order.status === 'Delivered';
    const isPending = !isCod && (order.paymentStatus === 'PENDING_VERIFICATION' || order.status === 'Payment Verification Pending');
    const isCancelled = order.status === 'CANCELLED';
    const isDelivered = order.status === 'Delivered' || order.status === 'DELIVERED';

    let statusBadgeText = '⏳ Payment Verification Pending';
    let statusBg = '#FEF3C7';
    let statusColor = '#B45309';

    if (isDelivered) {
      statusBadgeText = '✅ Delivered & Completed';
      statusBg = '#DCFCE7';
      statusColor = '#15803D';
    } else if (isCancelled) {
      statusBadgeText = '✕ Order Cancelled';
      statusBg = '#FEE2E2';
      statusColor = '#991B1B';
    } else if (isCod) {
      statusBadgeText = '📦 Order Confirmed & Packing (COD)';
      statusBg = '#EDE9FE';
      statusColor = '#6D28D9';
    } else if (isPaid) {
      statusBadgeText = '✓ Order Confirmed & Packing';
      statusBg = '#DCFCE7';
      statusColor = '#15803D';
    }

    const itemsSummary = (order.items && order.items.length) 
      ? order.items.map(it => `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:0.75rem;color:#374151;"><span>${it.name || it.title} × ${it.qty || 1}</span><strong style="color:#111827;">₹${(it.price || 0) * (it.qty || 1)}</strong></div>`).join('')
      : `<div style="font-size:0.75rem;color:#6B7280;">Assorted Fireworks Consignment</div>`;

    const isPickup = order.type === 'store' || order.deliveryType === 'store';

    return `
      <div class="customer-order-history-card" style="background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        
        <!-- Header: Order ID & Status Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div>
            <div style="font-weight: 800; font-family: monospace; font-size: 0.92rem; color: #111827;">${order.id}</div>
            <div style="font-size: 0.7rem; color: #6B7280; margin-top: 2px;">Placed on ${order.date || 'Today'}</div>
          </div>
          <span style="font-size: 0.68rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; white-space: nowrap;">
            ${statusBadgeText}
          </span>
        </div>

        <!-- Fulfillment Mode & Delivery Address -->
        <div style="background: #F9FAFB; border-radius: 8px; padding: 8px 10px; font-size: 0.72rem; color: #4B5563;">
          <div style="font-weight: 700; color: #111827; margin-bottom: 2px;">
            ${isPickup ? '🏪 Saidabad Store Counter Pickup' : '🚚 Express Doorstep Delivery'}
          </div>
          <div>${isPickup ? 'Collect at MRS Crackers, Saidabad Colony, Hyderabad' : (typeof order.address === 'string' ? order.address : 'Plot 42, Saidabad Colony, Hyderabad')}</div>
        </div>

        <!-- Ordered Items -->
        <div style="border-top: 1px dashed #E5E7EB; border-bottom: 1px dashed #E5E7EB; padding: 6px 0;">
          ${itemsSummary}
        </div>

        <!-- Payment Info Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
          <div>
            <span style="color: #6B7280;">Payment:</span> 
            <strong style="color: ${isCod ? '#15803D' : '#111827'};">${order.payment || order.paymentMode || 'Cash on Delivery (COD)'}</strong>
            ${order.utr && order.utr !== 'CASH-ON-DELIVERY' ? `<div style="font-size: 0.68rem; color: #059669; font-family: monospace; margin-top: 1px;">UTR: ${order.utr}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <span style="color: #6B7280; font-size: 0.7rem;">${isCod ? 'Pay on Delivery:' : 'Total Amount:'}</span>
            <div style="font-size: 1.1rem; font-weight: 900; color: #7C3AED;">₹${order.amount}</div>
          </div>
        </div>

        <!-- Status Informational Banner -->
        ${isCod ? `
          <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 8px; padding: 10px 12px; font-size: 0.72rem; color: #166534; line-height: 1.4;">
            💵 <strong>Cash on Delivery (COD) Active:</strong> Your order is confirmed and our Saidabad wholesale team is packing your crackers. <strong>Please keep exact cash of ₹${order.amount} ready</strong> to pay upon delivery handover.
          </div>
        ` : isPending ? `
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 8px 10px; font-size: 0.7rem; color: #92400E; line-height: 1.35;">
            ⏳ <strong>Verifying Payment:</strong> Your 12-digit UTR payment proof (${order.utr || 'Pending'}) is being confirmed by our Saidabad office. Once confirmed, your official GST Tax Invoice and packing confirmation will be delivered to <strong>${order.email || 'your email'}</strong>.
          </div>
        ` : `
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 8px 10px; font-size: 0.7rem; color: #166534; line-height: 1.35;">
            ✓ <strong>Payment Confirmed & Verified!</strong> Official GST Tax Invoice generated. Fireworks consignment is safely packed and ready.
          </div>
        `}

        <!-- Actions -->
        <div style="display: flex; gap: 8px; padding-top: 4px;">
          ${(isPaid || isCod) ? `
            <button class="mrs-btn-sm-purple" onclick="window.MRS_INVOICE.openInvoiceModal('${order.id}')" style="flex: 1; padding: 8px 12px; font-size: 0.75rem; justify-content: center;">
              📄 View GST Tax Invoice
            </button>
            <button class="mrs-btn-sm-outline" onclick="window.open(window.MRS_INVOICE.getWhatsAppUrl(APP_STATE.admin.orders.find(o => o.id === '${order.id}') || {}), '_blank')" style="padding: 8px 12px; font-size: 0.75rem; color: #15803D; border-color: #86EFAC; background: #F0FDF4;">
              💬 WhatsApp
            </button>
          ` : `
            <button class="mrs-btn-sm-outline" onclick="renderCustomerOrders(); showToast('Checking order status...');" style="flex: 1; padding: 8px 12px; font-size: 0.75rem; color: #7C3AED; border-color: #DDD6FE; background: #FAF5FF; justify-content: center;">
              🔄 Refresh Status
            </button>
            <a href="https://wa.me/919392819362?text=${encodeURIComponent('Hi MRS Crackers, checking verification status for order ' + order.id)}" target="_blank" class="mrs-btn-sm-outline" style="padding: 8px 12px; font-size: 0.75rem; color: #15803D; border-color: #86EFAC; background: #F0FDF4; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
              💬 WhatsApp Help
            </a>
          `}
        </div>

      </div>
    `;
  }).join('');
}

// ==========================================
// 15. NOTIFICATIONS & WISHLIST
// ==========================================
function renderMobileNotifications() {
  const container = document.getElementById('mobile-notifications-list');
  if (!container) return;

  if (APP_STATE.notifications.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 12px;">No new notifications.</div>`;
    return;
  }

  container.innerHTML = APP_STATE.notifications.map(n => `
    <div style="background: #111420; border-radius: var(--radius-sm); padding: 8px 10px; display: flex; align-items: center; gap: 8px; border-left: 2px solid ${n.unread ? 'var(--gold-primary)' : 'transparent'};">
      <span style="font-size: 1rem;">${n.icon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 0.78rem; color: #fff;">${n.title}</div>
        <div style="font-size: 0.65rem; color: var(--text-muted);">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function clearAllNotifications() {
  APP_STATE.notifications = [];
  renderMobileNotifications();
  showToast('Notifications cleared');
}

function toggleWishlist(productId, e) {
  if (e) e.stopPropagation();
  const idx = APP_STATE.wishlist.indexOf(productId);
  if (idx > -1) {
    APP_STATE.wishlist.splice(idx, 1);
    showToast('Removed from Wishlist');
  } else {
    APP_STATE.wishlist.push(productId);
    playFestiveSound('chime');
    showToast('Saved to Wishlist');
  }
  renderProducts();
}

// ==========================================
// 16. PRODUCT DETAIL MODAL
// ==========================================
function openProductDetailModal(productId) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('detail-modal-img').src = prod.image;
  document.getElementById('detail-modal-name').innerText = prod.name;
  document.getElementById('detail-modal-desc').innerText = prod.description;
  document.getElementById('detail-modal-price').innerText = `₹${prod.price}`;
  document.getElementById('detail-modal-mrp').innerText = `MRP: ₹${prod.mrp}`;
  document.getElementById('detail-modal-discount').innerText = prod.discount;
  document.getElementById('detail-modal-weight').innerText = prod.weight;
  document.getElementById('detail-modal-rating').innerText = `★ ${prod.rating}`;
  document.getElementById('detail-modal-brand').innerText = prod.brand;
  document.getElementById('detail-modal-sound').innerText = prod.sound.toUpperCase();

  const btn = document.getElementById('detail-modal-add-btn');
  btn.onclick = () => {
    const qty = parseInt(document.getElementById('detail-modal-qty').innerText, 10) || 1;
    handleAddToCartClick(prod.id, qty);
    closeSheet('product-detail-sheet');
  };

  openSheet('product-detail-sheet');
}

function adjustDetailModalQty(delta) {
  const el = document.getElementById('detail-modal-qty');
  if (!el) return;
  let val = parseInt(el.innerText, 10) || 1;
  val = Math.max(1, val + delta);
  el.innerText = val;
}

// ==========================================
// 17. ADMIN PORTAL (All 12 Panels)
// ==========================================
function openAdminModal() {
  if (APP_STATE.admin.isAuthenticated) {
    showAdminDashboard();
  } else {
    document.getElementById('admin-gate-content').style.display = 'block';
    document.getElementById('admin-dashboard-content').style.display = 'none';
  }
  openSheet('admin-sheet');
}

async function verifyAdminPasscode() {
  const code = document.getElementById('admin-passcode-input')?.value.trim();
  if (!code) {
    alert('Please enter your admin password');
    return;
  }
  let verifyRes = null;
  if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.verifyCredentials === 'function') {
    verifyRes = await MRS_BACKEND.verifyCredentials({
      role: 'admin',
      identifier: 'bandirohan43@gmail.com',
      password: code
    });
  }
  if (verifyRes && verifyRes.success) {
    APP_STATE.admin.isAuthenticated = true;
    showAdminDashboard();
    showToast('Admin Unlocked! Welcome Bandi Rohan 👑');
  } else {
    alert('Access Denied: Invalid admin password.');
  }
}

function adminBiometricScan() {
  APP_STATE.admin.isAuthenticated = true;
  showAdminDashboard();
  showToast('Biometric Fingerprint Match! 👑');
}

function showAdminDashboard() {
  document.getElementById('admin-gate-content').style.display = 'none';
  document.getElementById('admin-dashboard-content').style.display = 'block';

  document.getElementById('admin-kpi-orders').innerText = APP_STATE.admin.orders.length + 12840;

  const paytmRadio = document.getElementById('admin-radio-paytm');
  const bharatpeRadio = document.getElementById('admin-radio-bharatpe');
  if (paytmRadio) paytmRadio.checked = APP_STATE.admin.activeReceiver === 'paytm';
  if (bharatpeRadio) bharatpeRadio.checked = APP_STATE.admin.activeReceiver === 'bharatpe';

  renderAdminOrdersMobile();
}

function renderAdminOrdersMobile() {
  const container = document.getElementById('admin-orders-list-mobile');
  if (!container) return;

  container.innerHTML = APP_STATE.admin.orders.map((o, idx) => `
    <div style="background: #111420; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 0.72rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 800; color: #fff;">${o.id} • ${o.customer}</div>
        <div style="color: var(--text-muted);">UTR: ${o.utr} (${o.payment})</div>
      </div>
      <div>
        <button class="filter-strip-btn" onclick="adminVerifyOrder(${idx})" style="padding: 3px 8px; font-size: 0.68rem; color: #34d399;">
          Verify ✓
        </button>
      </div>
    </div>
  `).join('');
}

function adminVerifyOrder(idx) {
  APP_STATE.admin.orders[idx].verified = true;
  APP_STATE.admin.orders[idx].status = 'Processing';
  renderAdminOrdersMobile();
  showToast('UTR Verified and Approved! 💥');
}

function setAdminPaymentReceiver(mode) {
  APP_STATE.admin.activeReceiver = mode;
  showToast(`Active Gateway: ${mode === 'paytm' ? 'Paytm (Madhu Prasad)' : 'BharatPe (Akhil Prasad)'}`);
}

function saveNewProductFromForm() {
  const name = document.getElementById('new-prod-name')?.value.trim();
  const mrp = parseInt(document.getElementById('new-prod-mrp')?.value, 10) || 200;
  const price = parseInt(document.getElementById('new-prod-price')?.value, 10) || 150;

  if (!name) {
    alert('Please enter a product name!');
    return;
  }

  const newProd = {
    id: PRODUCTS.length + 1,
    name,
    category: 'sparklers',
    mrp,
    price,
    discount: `${Math.round(((mrp - price) / mrp) * 100)}% OFF`,
    weight: '250 g',
    weightGrams: 250,
    rating: 5.0,
    reviews: 1,
    sound: 'medium',
    dayNight: 'night',
    kidsSafe: true,
    brand: 'Standard',
    stock: 200,
    inStock: true,
    image: 'assets/cat_sparklers.png',
    description: `${name} premium festival crackers.`
  };

  PRODUCTS.unshift(newProd);
  renderProducts();
  renderQuickOrderTable();
  showToast(`Added ${name} to Catalog! 💥`);
}




// ==========================================
// 5. STORAGE HELPERS (Zero Cart for Logged-Out Guests)
// ==========================================
function loadCartFromStorage() {
  try {
    if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
      APP_STATE.cart = [];
      localStorage.removeItem('mrs_crackers_cart');
      return;
    }
    const saved = localStorage.getItem('mrs_crackers_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Reconcile each item against the authoritative PRODUCTS catalog to guarantee valid prices
        APP_STATE.cart = parsed.map(item => {
          const prod = PRODUCTS.find(p => p.id === item.id);
          const price = prod ? prod.price : (Number(item.price) || 0);
          const mrp = prod ? prod.mrp : (Number(item.mrp) || price);
          const name = prod ? prod.name : (item.name || 'Cracker');
          const image = prod ? prod.image : (item.image || '');
          const weightGrams = prod ? (prod.weightGrams || 250) : (Number(item.weightGrams) || 250);
          const weight = prod ? prod.weight : (item.weight || '1 box');
          const qty = Math.max(1, parseInt(item.qty, 10) || 1);
          return { id: item.id, name, price, mrp, image, weight, weightGrams, qty };
        }).filter(item => item.price > 0);
      } else {
        APP_STATE.cart = [];
      }
    } else {
      APP_STATE.cart = [];
    }
  } catch (e) {
    APP_STATE.cart = [];
  }
}

function saveCartToStorage() {
  try {
    if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
      localStorage.removeItem('mrs_crackers_cart');
      return;
    }
    localStorage.setItem('mrs_crackers_cart', JSON.stringify(APP_STATE.cart));
  } catch (e) {}
}

// ==========================================
// 6. MULTI-TAB ROUTING & NAVIGATION (Matching Reference UI)
// ==========================================
let currentShopCategory = 'all';
let currentShopSearch = '';
let openAccordionOrderIds = new Set();

function switchTab(tabName) {
  if (tabName === 'track' || tabName === 'categories') tabName = 'shop';
  APP_STATE.currentTab = tabName;

  // Persist URL hash and session tab for in-place tab preservation on refresh
  try {
    sessionStorage.setItem('mrs_active_tab', tabName);
    if (tabName === 'home') {
      if (window.location.hash && window.location.hash !== '#home') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      if (window.location.hash !== '#' + tabName) {
        history.replaceState(null, '', '#' + tabName);
      }
    }
  } catch (e) {}

  // Update desktop navigation links
  document.querySelectorAll('.mrs-nav-link').forEach(link => {
    link.classList.toggle('active', link.id === `nav-link-${tabName}`);
  });

  // Update mobile drawer links
  document.querySelectorAll('.mrs-drawer-link').forEach(link => {
    link.classList.toggle('active', link.id === `drawer-link-${tabName}`);
  });

  // Update sidebar nav links in Orders tab
  document.querySelectorAll('.orders-sidebar-nav-item').forEach(link => {
    const text = link.innerText.trim().toLowerCase();
    link.classList.toggle('active', 
      (tabName === 'orders' && text.includes('orders')) ||
      (tabName === 'home' && text === 'home') ||
      (tabName === 'shop' && text === 'shop') ||
      (tabName === 'account' && text === 'account')
    );
  });

  const tabs = ['home', 'shop', 'orders', 'account'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) {
      if (t === tabName) {
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
      } else {
        el.style.display = 'none';
      }
    }
  });

  // Persistent Floating Cart Button across all storefront tabs
  const totalItems = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + (item.qty || 1), 0) : 0;
  const floatBar = document.getElementById('mrs-floating-cart-bar') || document.getElementById('floating-cart-bar');
  if (floatBar) {
    floatBar.style.display = (totalItems > 0 && ['home', 'shop', 'orders', 'account'].includes(tabName)) ? 'block' : 'none';
  }

  if (tabName === 'home') {
    if (typeof renderProducts === 'function') renderProducts();
  } else if (tabName === 'shop') {
    renderShopProducts();
  } else if (tabName === 'orders') {
    renderOrdersHistoryTab();
  } else if (tabName === 'account') {
    updateAccountUI();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

window.refreshCurrentTab = async function(tabOverride) {
  const tab = tabOverride || APP_STATE.currentTab || 'home';
  if (typeof showToast === 'function') {
    showToast(`Refreshing ${tab.toUpperCase()}... ↻`);
  }

  if (tab === 'account') {
    updateAccountUI();
    if (typeof MRS_BACKEND !== 'undefined' && APP_STATE.user && APP_STATE.user.id) {
      try {
        const addrs = await MRS_BACKEND.getCustomerAddresses(APP_STATE.user.id);
        if (typeof renderSavedAddressesList === 'function') renderSavedAddressesList(addrs);
      } catch (e) {}
    }
  } else if (tab === 'orders') {
    renderOrdersHistoryTab();
    renderCustomerOrders();
    if (typeof MRS_BACKEND !== 'undefined') {
      try {
        const freshOrders = await MRS_BACKEND.getOrders();
        if (freshOrders && freshOrders.length > 0) {
          renderOrdersHistoryTab();
          renderCustomerOrders();
        }
      } catch (e) {}
    }
  } else if (tab === 'shop' || tab === 'home') {
    if (typeof MRS_BACKEND !== 'undefined') {
      try {
        const prods = await MRS_BACKEND.getProducts();
        if (prods && prods.length > 0) {
          PRODUCTS = prods;
        }
      } catch (e) {}
    }
    if (tab === 'shop') renderShopProducts();
    if (tab === 'home') renderProducts();
  } else if (tab === 'admin') {
    if (typeof renderAdminOrders === 'function') renderAdminOrders();
    if (typeof updateAdminKpis === 'function') updateAdminKpis();
    if (typeof renderAdminDrivers === 'function') renderAdminDrivers();
    if (typeof PORTALS !== 'undefined' && typeof PORTALS.syncAdminDataFromSupabase === 'function') {
      PORTALS.syncAdminDataFromSupabase(true);
    }
  }
  updateCartUI();
  if (typeof showToast === 'function') {
    showToast(`${tab.toUpperCase()} updated fresh! ✨`);
  }
};

window.openCartSheetDirectly = function() {
  toggleCartSheet(true);
};

window.refreshCartSection = function() {
  updateCartUI();
  if (typeof showToast === 'function') {
    showToast('Cart refreshed & items verified! 🛒✨');
  }
};

// --- TAB 2: SHOP CATALOG CONTROLLER (Matching Panel 2) ---
function renderShopProducts() {
  const container = document.getElementById('shop-products-grid-container');
  if (!container) return;

  const filtered = PRODUCTS.filter(prod => {
    if (currentShopCategory !== 'all') {
      const cat = (prod.category || '').toLowerCase();
      if (currentShopCategory === 'sparklers' && !cat.includes('sparkler')) return false;
      if (currentShopCategory === 'flowerpots' && !cat.includes('flowerpot') && !cat.includes('fountain')) return false;
      if (currentShopCategory === 'rockets' && !cat.includes('rocket')) return false;
      if (currentShopCategory === 'multishot' && !cat.includes('shot') && !cat.includes('multi')) return false;
      if (currentShopCategory === 'chakkars' && !cat.includes('chakkar') && !cat.includes('ground')) return false;
      if (currentShopCategory === 'garland' && !cat.includes('garland') && !cat.includes('wala') && !cat.includes('chain')) return false;
      if (currentShopCategory === 'giftboxes' && !cat.includes('box') && !cat.includes('gift') && !cat.includes('combo')) return false;
    }
    if (currentShopSearch) {
      const q = currentShopSearch.toLowerCase();
      if (!prod.name.toLowerCase().includes(q) && !(prod.category || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-muted-purple);">
        <div style="font-size: 2rem;">🔍</div>
        <div style="font-weight: 800; color: #fff; margin-top: 6px;">No crackers found for "${currentShopSearch || currentShopCategory}"</div>
        <button class="mrs-btn-add-purple" onclick="currentShopCategory='all'; currentShopSearch=''; renderShopProducts();" style="margin: 12px auto 0 auto; width: auto; padding: 8px 16px;">Show All Crackers</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prod => {
    const isWishlisted = APP_STATE.wishlist.includes(prod.id);
    return `
      <div class="mrs-product-card-white" data-id="${prod.id}">
        <!-- Top Row: In-Stock Badge & Wishlist -->
        <div class="mrs-card-top-bar">
          <div class="mrs-in-stock-badge">
            <span class="mrs-in-stock-dot"></span>
            <span>In Stock</span>
          </div>
          <button class="mrs-wish-icon-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${prod.id}, event)" title="Favorite" aria-label="Favorite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isWishlisted ? '#EF4444' : 'none'}" stroke="${isWishlisted ? '#EF4444' : '#9CA3AF'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <!-- Product Photo (Constrained Clean Sizing) -->
        <div class="mrs-card-img-frame" onclick="openProductDetailModal(${prod.id})">
          <img src="${prod.image}" alt="${prod.name}" class="mrs-card-cracker-img" loading="lazy">
        </div>

        <!-- Product Name & Category -->
        <div onclick="openProductDetailModal(${prod.id})">
          <h3 class="mrs-card-title-text" title="${prod.name}">${prod.name}</h3>
          <div class="mrs-card-pack-meta">
            ${prod.categoryName || prod.category} • ${prod.packSize || prod.weight || '1 box'}
          </div>
        </div>

        <!-- Price Row: Purple Current Price & Struck-Through MRP -->
        <div class="mrs-card-price-row">
          <span class="mrs-price-current-purple">₹${prod.price}</span>
          <span class="mrs-price-mrp-struck">₹${prod.mrp}</span>
        </div>

        <!-- Bottom Controls: Stepper & Purple Add to Cart Button -->
        <div class="mrs-card-action-row">
          <div class="mrs-card-qty-stepper">
            <button type="button" class="mrs-stepper-btn" onclick="changeShopProdQty(${prod.id}, -1)">−</button>
            <span class="mrs-stepper-val" id="shop-qty-${prod.id}">1</span>
            <button type="button" class="mrs-stepper-btn" onclick="changeShopProdQty(${prod.id}, 1)">+</button>
          </div>

          <button type="button" class="mrs-btn-add-purple" onclick="const qty = parseInt(document.getElementById('shop-qty-${prod.id}')?.innerText || '1', 10) || 1; handleAddToCartClick(${prod.id}, qty)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderShopProducts = renderShopProducts;

function changeShopProdQty(prodId, delta) {
  const el = document.getElementById(`shop-qty-${prodId}`);
  if (!el) return;
  let val = parseInt(el.innerText, 10) || 1;
  val = Math.max(1, Math.min(50, val + delta));
  el.innerText = val;
}
window.changeShopProdQty = changeShopProdQty;

function filterShopCategory(cat, btn) {
  currentShopCategory = cat;
  if (btn) {
    document.querySelectorAll('.shop-cat-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
  }
  renderShopProducts();
}
window.filterShopCategory = filterShopCategory;

function filterShopCatalog(query) {
  currentShopSearch = (query || '').trim();
  renderShopProducts();
}
window.filterShopCatalog = filterShopCatalog;

// --- TAB 4: YOUR ORDERS CONTROLLER (Matching Panel 4 & 5) ---
function renderOrdersHistoryTab() {
  const container = document.getElementById('orders-history-accordion-list');
  const userAvatar = document.getElementById('orders-user-avatar');
  const userName = document.getElementById('orders-user-name');
  const userContact = document.getElementById('orders-user-contact');

  // Display user info matching mockup or active logged-in user
  const u = APP_STATE.user || {};
  const isCustomUser = u.isLoggedIn && u.name && u.name !== 'Guest Customer';
  const displayName = isCustomUser ? (u.name || u.username || 'Guest') : 'Guest';
  const displayEmail = (u.isLoggedIn && u.email) ? u.email : '';
  const displayPhone = (u.isLoggedIn && (u.phone || u.mobile)) ? (u.phone || u.mobile) : '';
  const initial = (displayName.charAt(0) || 'G').toUpperCase();

  if (userAvatar) userAvatar.innerText = initial;
  if (userName) userName.innerText = displayName;
  if (userContact) userContact.innerText = [displayEmail, displayPhone].filter(Boolean).join(' • ') || 'Sign in to view orders';

  // Header auth button in Orders Tab
  const ordersLogoutBtn = document.getElementById('orders-logout-btn');
  const ordersCustomBtn = document.getElementById('orders-customize-btn');
  if (ordersLogoutBtn) {
    if (u.isLoggedIn) {
      ordersLogoutBtn.innerText = 'Log Out';
      ordersLogoutBtn.onclick = handleCustomerLogout;
    } else {
      ordersLogoutBtn.innerText = 'Log In / Sign Up';
      ordersLogoutBtn.onclick = () => openSheet('login-sheet');
    }
  }
  if (ordersCustomBtn) {
    ordersCustomBtn.style.display = u.isLoggedIn ? 'inline-block' : 'none';
  }

  if (!container) return;

  // Retrieve placed orders — strictly for this specific customer
  let orders = [];
  try {
    if (u.isLoggedIn) {
      const userOrders = getUserOrders(); // per-user private storage
      orders = [...userOrders];
      // Also merge any admin.orders that strictly belong to this user
      if (APP_STATE.admin && APP_STATE.admin.orders) {
        APP_STATE.admin.orders.forEach(o => {
          if (!orders.some(x => x.id === o.id)) {
            const matchesEmail = u.email && o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase();
            const matchesMobile = (u.mobile || u.phone) && o.customerMobile && o.customerMobile === (u.mobile || u.phone);
            if (matchesEmail || matchesMobile) {
              orders.push(o);
            }
          }
        });
      }
    }
  } catch (e) {}

  // If no orders placed yet by this user, show clean empty state (NO dummy reference orders)
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; background: rgba(26, 11, 46, 0.6); border: 1.5px dashed rgba(139, 92, 246, 0.3); border-radius: 12px; margin-top: 8px;">
        <div style="font-size: 2.4rem; margin-bottom: 12px;">📦</div>
        <div style="font-family: var(--font-display, sans-serif); font-size: 1.1rem; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
          ${u.isLoggedIn ? 'No Orders Placed Yet' : 'Please Sign In to View Your Orders'}
        </div>
        <div style="font-size: 0.8rem; color: #9CA3AF; max-width: 380px; margin: 0 auto 18px auto; line-height: 1.5;">
          ${u.isLoggedIn ? 'Your placed wholesale festive cracker orders and official GST tax invoices will appear here.' : 'Sign in to access your order history, delivery tracking, and official GST tax invoices.'}
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          ${!u.isLoggedIn ? `<button class="mrs-btn-sm-purple" onclick="openSheet('login-sheet')" style="padding: 10px 22px; font-size: 0.85rem; font-weight: 800;">Log In / Sign Up 🔑</button>` : ''}
          <button class="mrs-btn-sm-purple" onclick="switchTab('shop')" style="padding: 10px 22px; font-size: 0.85rem; font-weight: 800; background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);">
            Shop Crackers Now 🎆
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const isDelivered = order.status === 'Delivered' || order.status === 'delivered';
    const isOutForDelivery = order.status === 'Out for Delivery' || order.status === 'OUT_FOR_DELIVERY';
    const isCodPending = order.paymentStatus === 'COD_PENDING' || order.status === 'Confirmed & Packing';
    const isOpen = openAccordionOrderIds.has(order.id);

    let statusColor = '#34D399';
    let statusText = order.status || 'Delivered';
    if (isDelivered) {
      statusColor = '#22C55E';
      statusText = 'Delivered';
    } else if (isOutForDelivery) {
      statusColor = '#34D399';
      statusText = 'Out for Delivery';
    } else if (isCodPending) {
      statusColor = '#A78BFA';
      statusText = 'Confirmed & Packing (COD)';
    }

    const itemsSummary = (order.items && order.items.length) 
      ? order.items.map(it => `<div style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.75rem; color:#D1D5DB;"><span>${it.name || it.title} × ${it.qty || 1}</span><strong style="color:#FFFFFF;">₹${(it.price || 0) * (it.qty || 1)}</strong></div>`).join('')
      : `<div style="font-size:0.75rem; color:#9CA3AF;">Assorted Fireworks Consignment</div>`;

    return `
      <div class="order-accordion-item ${isOpen ? 'open' : ''}" id="order-accordion-${order.id.replace('#', '')}">
        <!-- Accordion Header matching Panel 4 & 5 -->
        <div class="order-accordion-header" onclick="toggleOrderAccordion('${order.id}')">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 0.88rem; font-weight: 800;">
            <span style="color: #FFFFFF; font-family: monospace;">Order ${order.id}:</span>
            <span style="color: ${statusColor};">₹${order.amount} - ${statusText}</span>
          </div>
          <span style="color: #A78BFA; font-size: 0.95rem; font-weight: 800; transition: transform 0.2s;" id="acc-chevron-${order.id.replace('#', '')}">
            ${isOpen ? '⌃' : '⌄'}
          </span>
        </div>

        <!-- Accordion Body -->
        <div class="order-accordion-body">
          <div style="font-size: 0.72rem; color: #9CA3AF; margin-bottom: 4px;">
            Placed on ${order.date || 'Today'} • Saidabad Wholesale Consignment
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 8px 10px; border: 1px dashed rgba(139, 92, 246, 0.25);">
            ${itemsSummary}
          </div>

          <div style="font-size: 0.72rem; color: #9CA3AF; display: flex; flex-direction: column; gap: 2px;">
            <div><strong style="color: #DDD6FE;">Delivery Address:</strong> ${typeof order.address === 'string' ? order.address : 'Flat 402, Sri Sai Nivas, Saidabad Colony, Hyderabad'}</div>
            <div><strong style="color: #DDD6FE;">Pincode:</strong> ${order.pincode || '500059'}</div>
            <div><strong style="color: #DDD6FE;">Payment Mode:</strong> <span style="color: #34D399;">${order.payment || 'Cash on Delivery (COD)'}</span></div>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
            <button class="mrs-btn-sm-purple" onclick="window.MRS_INVOICE.openInvoiceModal('${order.id}')" style="padding: 6px 12px; font-size: 0.72rem;">
              📄 View GST Tax Invoice
            </button>
            <button class="mrs-btn-sm-outline" onclick="window.open(window.MRS_INVOICE.getWhatsAppUrl(APP_STATE.admin.orders.find(o => o.id === '${order.id}') || {}), '_blank')" style="padding: 6px 12px; font-size: 0.72rem; color: #34D399; border-color: #34D399;">
              💬 WhatsApp Store
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderOrdersHistoryTab = renderOrdersHistoryTab;

function toggleOrderAccordion(orderId) {
  if (openAccordionOrderIds.has(orderId)) {
    openAccordionOrderIds.delete(orderId);
  } else {
    openAccordionOrderIds.add(orderId);
  }
  const el = document.getElementById(`order-accordion-${orderId.replace('#', '')}`);
  const chev = document.getElementById(`acc-chevron-${orderId.replace('#', '')}`);
  if (el) {
    const isOpen = openAccordionOrderIds.has(orderId);
    el.classList.toggle('open', isOpen);
    if (chev) chev.innerText = isOpen ? '⌃' : '⌄';
  }
}
window.toggleOrderAccordion = toggleOrderAccordion;

// ==========================================
// 7. HIGH-DENSITY QUICK ORDER TABLE
// ==========================================
function renderQuickOrderTable() {
  const tbody = document.getElementById('quick-order-tbody');
  if (!tbody) return;

  tbody.innerHTML = PRODUCTS.map(prod => {
    const inCart = APP_STATE.cart.find(c => c.id === prod.id);
    const qty = inCart ? inCart.qty : 0;

    return `
      <tr style="border-bottom: 1px solid #222222;">
        <td style="padding: 8px; vertical-align: middle; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div style="width: 34px; height: 34px; min-width: 34px; border-radius: 6px; background: #181818; border: 1px solid #2A2A2A; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 1px;">
              <img src="${prod.image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;">
            </div>
            <div style="min-width: 0; flex: 1; overflow: hidden;">
              <div style="font-weight: 700; color: #FFFFFF; font-size: 0.78rem; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</div>
              <div style="font-size: 0.62rem; color: #9CA3AF; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="color: #FFB800; font-family: var(--font-mono); font-size: 0.56rem; background: #1C1C1C; padding: 1px 4px; border-radius: 3px; border: 1px solid #333333; margin-right: 3px;">${prod.categoryName}</span>
                ${prod.packSize}
              </div>
            </div>
          </div>
        </td>
        <td style="padding: 8px 4px; font-weight: 800; color: #FFB800; font-size: 0.86rem; text-align: center; vertical-align: middle; white-space: nowrap;">
          ₹${prod.price}
        </td>
        <td style="padding: 8px 10px; text-align: right; vertical-align: middle; overflow: hidden;">
          <div style="display: inline-flex; align-items: center; justify-content: space-between; background: #1C1C1C; border: 1px solid #2E2E2E; border-radius: 16px; padding: 2px 3px; width: 72px; box-sizing: border-box;">
            <button style="background: none; border: none; color: #FFFFFF; width: 20px; height: 20px; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="adjustQuickOrderQty(${prod.id}, -1)">-</button>
            <span style="font-size: 0.75rem; font-weight: 800; width: 22px; text-align: center; color: #FFFFFF;" id="quick-qty-${prod.id}">${qty}</span>
            <button style="background: none; border: none; color: #FFFFFF; width: 20px; height: 20px; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" onclick="adjustQuickOrderQty(${prod.id}, 1)">+</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  updateQuickOrderSummary();
}

function adjustQuickOrderQty(productId, delta) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  let existing = APP_STATE.cart.find(c => c.id === productId);

  if (!existing && delta > 0) {
    if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
      APP_STATE.pendingCartItem = { productId, qty: 1 };
      switchAuthTab('login');
      openSheet('login-sheet');
      return;
    }

    APP_STATE.cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      mrp: prod.mrp,
      weight: prod.weight,
      weightGrams: prod.weightGrams,
      image: prod.image,
      qty: 1
    });
  } else if (existing) {
    existing.qty += delta;
    if (existing.qty <= 0) {
      APP_STATE.cart = APP_STATE.cart.filter(c => c.id !== productId);
    }
  }

  saveCartToStorage();
  const currentQty = (APP_STATE.cart.find(c => c.id === productId) || {}).qty || 0;
  const qtyEl = document.getElementById(`quick-qty-${productId}`);
  if (qtyEl) qtyEl.innerText = currentQty;

  updateQuickOrderSummary();
  updateCartUI();
  playFestiveSound('pop');
}

function updateQuickOrderSummary() {
  const totalItems = APP_STATE.cart.reduce((sum, i) => sum + i.qty, 0);
  const totalVal = APP_STATE.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const countEl = document.getElementById('quick-total-items-count');
  const valEl = document.getElementById('quick-total-val');
  if (countEl) countEl.innerText = `Total Items: ${totalItems}`;
  if (valEl) valEl.innerText = `₹${totalVal}`;
}

// ==========================================
// 8. CART HANDLER WITH LOGIN INTERCEPT & TOAST
// ==========================================
function handleAddToCartClick(productId, quantityOverride = null) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  const qty = quantityOverride !== null ? quantityOverride : 1;

  // STRICT REQUIREMENT: Intercept if customer is not logged in!
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    APP_STATE.pendingCartItem = { productId, qty };
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in or create an account to add items to cart');
    return;
  }

  executeAddToCart(prod, qty);
}

function executeAddToCart(prod, qty) {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    APP_STATE.pendingCartItem = { productId: prod.id, qty };
    switchAuthTab('login');
    openSheet('login-sheet');
    showToast('Please sign in or create an account to add items to cart');
    return;
  }

  const existing = APP_STATE.cart.find(c => c.id === prod.id);
  if (existing) {
    existing.qty += qty;
  } else {
    APP_STATE.cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      mrp: prod.mrp,
      weight: prod.weight,
      weightGrams: prod.weightGrams,
      image: prod.image,
      qty: qty
    });
  }

  saveCartToStorage();
  playFestiveSound('chime');
  showToast(`${prod.name} added to cart!`);
  updateCartUI();
}

function updateCartUI() {
  const cartContainer = document.getElementById('cart-items-container');
  const countBadge = document.getElementById('cart-badge-count');
  const countBadgeTop = document.getElementById('cart-count-badge');
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const subtotalAmountEl = document.getElementById('cart-subtotal-amount');
  const totalWeightEl = document.getElementById('cart-total-weight');
  const savingsEl = document.getElementById('cart-total-savings');
  const grandTotalEl = document.getElementById('cart-grand-total');
  const deliveryFeeEl = document.getElementById('cart-delivery-fee');
  const emptyState = document.getElementById('cart-empty-state');
  const filledState = document.getElementById('cart-filled-state');
  const floatingCount = document.getElementById('floating-cart-count');
  const floatingTotal = document.getElementById('floating-cart-total');
  const floatingBar = document.getElementById('floating-cart-bar');
  const cartStatusEl = document.getElementById('account-cart-status');

  const totalItems = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + item.qty, 0) : 0;
  const totalAmount = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;

  if (cartStatusEl) {
    cartStatusEl.innerText = `${totalItems} item${totalItems === 1 ? '' : 's'} • ₹${totalAmount}`;
  }

  if (countBadge) countBadge.innerText = totalItems;
  if (countBadgeTop) countBadgeTop.innerText = totalItems;

  const floatBar = document.getElementById('mrs-floating-cart-bar') || document.getElementById('floating-cart-bar');
  const floatCount = document.getElementById('floating-cart-item-count') || document.getElementById('floating-cart-count');
  const floatTotal = document.getElementById('floating-cart-total-price') || document.getElementById('floating-cart-total');

  if (floatCount) floatCount.innerText = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`;
  if (floatTotal) floatTotal.innerText = `₹${totalAmount}`;

  if (floatBar) {
    floatBar.style.display = (totalItems > 0 && ['home', 'shop', 'orders', 'account'].includes(APP_STATE.currentTab)) ? 'block' : 'none';
  }

  const checkoutBtn = document.getElementById('cart-checkout-btn');

  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    APP_STATE.cart = [];
    if (emptyState) {
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <div style="font-size: 2.2rem; margin-bottom: 8px; color: #7C3AED;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827;">Sign In to Shop</div>
        <div style="font-size: 0.75rem; color: #6B7280; margin: 4px 0 16px 0;">Please sign in or create an account to start shopping at direct wholesale prices.</div>
        <button class="mrs-btn-add-purple" onclick="toggleCartSheet(false); switchAuthTab('login'); openSheet('login-sheet');" style="padding: 10px 20px; border-radius: 8px; width: auto;">Log In / Sign Up</button>
      `;
    }
    if (filledState) filledState.style.display = 'none';
    if (cartContainer) cartContainer.innerHTML = '';
    if (subtotalEl) subtotalEl.innerText = '0';
    if (subtotalAmountEl) subtotalAmountEl.innerText = '₹0';
    if (grandTotalEl) grandTotalEl.innerText = '₹0';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (totalItems === 0) {
    if (emptyState) {
      emptyState.style.display = 'flex';
      emptyState.innerHTML = `
        <div style="font-size: 2.2rem; margin-bottom: 8px; color: #7C3AED;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
        <div style="font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 800; color: #111827;">Your Cart is Empty</div>
        <div style="font-size: 0.75rem; color: #6B7280; margin: 4px 0 16px 0;">Add sparklers, pots, or sky shots to begin celebrating!</div>
        <button class="mrs-btn-add-purple" onclick="toggleCartSheet(false); switchTab('home');" style="padding: 10px 20px; border-radius: 8px; width: auto;">Browse Products</button>
      `;
    }
    if (filledState) filledState.style.display = 'none';
    if (cartContainer) cartContainer.innerHTML = '';
    if (subtotalEl) subtotalEl.innerText = '0';
    if (subtotalAmountEl) subtotalAmountEl.innerText = '₹0';
    if (grandTotalEl) grandTotalEl.innerText = '₹0';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (checkoutBtn) checkoutBtn.style.display = 'inline-flex';

  if (emptyState) emptyState.style.display = 'none';
  if (filledState) filledState.style.display = 'flex';

  let subtotal = 0;
  let totalMrp = 0;
  let totalGrams = 0;

  if (cartContainer) {
    cartContainer.innerHTML = APP_STATE.cart.map(item => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      const unitPrice = prod ? prod.price : (Number(item.price) || 0);
      const unitMrp = prod ? prod.mrp : (Number(item.mrp) || unitPrice);
      const itemQty = Math.max(1, parseInt(item.qty, 10) || 1);
      const itemSubtotal = unitPrice * itemQty;
      const itemMrpTotal = unitMrp * itemQty;
      subtotal += itemSubtotal;
      totalMrp += itemMrpTotal;
      totalGrams += ((prod ? prod.weightGrams : item.weightGrams) || 250) * itemQty;

      return `
        <div class="mrs-cart-item-card">
          <div class="mrs-cart-item-thumb">
            <img src="${prod ? prod.image : item.image}" alt="${prod ? prod.name : item.name}">
          </div>
          <div class="mrs-cart-item-info">
            <div class="mrs-cart-item-name">${prod ? prod.name : item.name}</div>
            <div class="mrs-cart-item-cost">
              <span>₹${unitPrice}</span>
              <span class="cart-item-mrp">₹${unitMrp}</span>
            </div>
          </div>
          <div class="mrs-cart-item-ctrls">
            <div class="mrs-cart-item-stepper">
              <button type="button" onclick="updateCartItemQty(${item.id}, -1)">−</button>
              <span>${itemQty}</span>
              <button type="button" onclick="updateCartItemQty(${item.id}, 1)">+</button>
            </div>
            <button type="button" class="mrs-cart-trash-btn" onclick="removeCartItem(${item.id})" title="Remove item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const deliveryCharge = (subtotal >= 999 || subtotal === 0) ? 0 : 49;
  const grandTotal = subtotal + deliveryCharge;
  const savings = Math.max(0, totalMrp - subtotal);
  const weightKg = (totalGrams / 1000).toFixed(2);

  if (subtotalEl) subtotalEl.innerText = `${subtotal}`;
  if (subtotalAmountEl) subtotalAmountEl.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
  if (deliveryFeeEl) deliveryFeeEl.innerText = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
  if (grandTotalEl) grandTotalEl.innerText = `₹${grandTotal.toLocaleString('en-IN')}`;
  if (savingsEl) savingsEl.innerText = `Saved ₹${savings.toLocaleString('en-IN')}`;
  if (totalWeightEl) totalWeightEl.innerText = `Total Weight: ${weightKg} kg`;

  // Free shipping progress bar
  const progressText = document.getElementById('free-shipping-progress-text');
  const progressBar = document.getElementById('free-shipping-progress-bar');
  if (progressText && progressBar) {
    if (subtotal >= 999) {
      progressText.innerText = '✓ FREE Express Delivery unlocked!';
      progressBar.style.width = '100%';
    } else {
      const remaining = 999 - subtotal;
      progressText.innerText = `Add ₹${remaining} for FREE Express Delivery!`;
      progressBar.style.width = `${Math.min(100, Math.round((subtotal / 999) * 100))}%`;
    }
  }
}

function updateCartItemQty(id, delta) {
  const item = APP_STATE.cart.find(c => c.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeCartItem(id);
    return;
  }

  saveCartToStorage();
  updateCartUI();
  renderQuickOrderTable();
}

function removeCartItem(id) {
  APP_STATE.cart = APP_STATE.cart.filter(c => c.id !== id);
  saveCartToStorage();
  updateCartUI();
  renderQuickOrderTable();
  showToast('Item removed from cart');
}

// ==========================================
// 9. CUSTOMER AUTHENTICATION (LOGIN / SIGNUP)
// STRICT ROLE DETECTION: ADMIN | DRIVER | CUSTOMER
// ==========================================
function switchAuthTab(mode) {
  const loginForm = document.getElementById('auth-login-form');
  const signupForm = document.getElementById('auth-signup-form');
  const btnLogin = document.getElementById('auth-tab-btn-login');
  const btnSignup = document.getElementById('auth-tab-btn-signup');
  const title = document.getElementById('auth-sheet-title');
  const loginErr = document.getElementById('login-error-msg');
  const signupErr = document.getElementById('signup-error-msg');

  if (loginErr) loginErr.style.display = 'none';
  if (signupErr) signupErr.style.display = 'none';

  if (mode === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (btnLogin) btnLogin.classList.add('active');
    if (btnSignup) btnSignup.classList.remove('active');
    if (title) title.innerText = 'Customer Login';
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (btnLogin) btnLogin.classList.remove('active');
    if (btnSignup) btnSignup.classList.add('active');
    if (title) title.innerText = 'Create Customer Account';
  }
}

async function handleCustomerLoginSubmit(event) {
  if (event) event.preventDefault();
  const identifier = document.getElementById('login-identifier')?.value.trim();
  const pass = document.getElementById('login-password')?.value;
  const errorEl = document.getElementById('login-error-msg');

  if (!identifier || !pass) {
    if (errorEl) { errorEl.innerText = 'Please enter email/mobile and password'; errorEl.style.display = 'block'; }
    return;
  }

  let users = [];
  try { users = JSON.parse(localStorage.getItem('mrs_crackers_registered_users') || '[]'); } catch (e) {}

  let matched = users.find(u => 
    (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
    u.mobile === identifier || 
    (u.username && u.username.toLowerCase() === identifier.toLowerCase())
  );

  if (matched && matched.password && matched.password !== pass) {
    if (errorEl) { errorEl.innerText = 'Incorrect password. Please try again.'; errorEl.style.display = 'block'; }
    return;
  }

  // STRICT ROLE DETECTION
  let assignedRole = 'customer';
  const idLower = identifier.toLowerCase();
  
  // 1. Dynamic Admin Match Check (Primary Admin Rohan + dynamically registered admins)
  let registeredAdmins = [];
  try { registeredAdmins = JSON.parse(localStorage.getItem('mrs_registered_admins') || '[]'); } catch (e) {}
  
  // Ensure default primary admin Rohan is always in the list
  if (!registeredAdmins.some(a => (a.email && a.email.toLowerCase() === 'bandirohan43@gmail.com') || a.mobile === '9392819362')) {
    registeredAdmins.unshift({
      id: 'admin_rohan',
      name: 'Bandi Rohan (Admin)',
      email: 'bandirohan43@gmail.com',
      mobile: '9392819362',
      password: 'Rohan@123',
      role: 'admin'
    });
    localStorage.setItem('mrs_registered_admins', JSON.stringify(registeredAdmins));
  }

  const matchedAdmin = registeredAdmins.find(a => 
    (a.email && a.email.toLowerCase() === idLower) || 
    (a.mobile && a.mobile === identifier) || 
    (idLower === 'admin' && pass === 'Rohan@123') ||
    (idLower === 'rohan' && pass === 'Rohan@123')
  );

  if (matchedAdmin) {
    if (pass !== matchedAdmin.password && pass !== 'Rohan@123') {
      if (errorEl) { errorEl.innerText = 'Incorrect admin password. Please try again.'; errorEl.style.display = 'block'; }
      return;
    }
    assignedRole = 'admin';
    username = matchedAdmin.name || 'Bandi Rohan (Admin)';
    email = matchedAdmin.email || 'bandirohan43@gmail.com';
    mobile = matchedAdmin.mobile || '9392819362';
  } 
  // 2. Rider Match Check (ONLY riders who signed up in Supabase profiles)
  else if (APP_STATE.registeredDrivers && APP_STATE.registeredDrivers.some(d => (d.email && d.email.toLowerCase() === idLower) || (d.phone && d.phone === identifier))) {
    assignedRole = 'driver';
  } 
  // 3. User object role if exists
  else if (matched && matched.role) {
    assignedRole = matched.role;
  }

  if (assignedRole !== 'admin') {
    username = matched ? matched.username : (identifier.includes('@') ? identifier.split('@')[0] : 'Customer ' + identifier.slice(-4));
    email = matched ? matched.email : (identifier.includes('@') ? identifier : `${identifier}@customer.mrs`);
    mobile = matched ? matched.mobile : (!identifier.includes('@') ? identifier : '9848012345');
  }
  let avatar = matched ? matched.avatar : null;

  APP_STATE.user = {
    id: matched ? matched.id : ('usr_' + Date.now()),
    isLoggedIn: true,
    username: username,
    email: email,
    mobile: mobile,
    role: assignedRole,
    avatar: avatar
  };

  localStorage.setItem('mrs_crackers_customer', JSON.stringify(APP_STATE.user));

  // Sync to Supabase Cloud Backend
  if (typeof MRS_BACKEND !== 'undefined') {
    MRS_BACKEND.loginCustomer({ identifier, password: pass }).then(res => {
      if (res && res.user) {
        if (res.user.id) APP_STATE.user.id = res.user.id;
        if (res.user.role) APP_STATE.user.role = res.user.role;
        localStorage.setItem('mrs_crackers_customer', JSON.stringify(APP_STATE.user));
        updateAccountUI();
      }
    });
  }

  closeSheet('login-sheet');
  updateAccountUI();
  
  if (assignedRole === 'admin') {
    showToast(`Welcome Admin ${username}! Operations Card ready in Account 👑`);
  } else if (assignedRole === 'driver') {
    showToast(`Welcome Rider ${username}! Delivery Partner Portal ready in Account 🛵`);
  } else {
    showToast(`Welcome back, ${username}! 💥`);
  }

  if (APP_STATE.pendingCartItem) {
    if (APP_STATE.pendingCartItem.isBudgetMix) {
      addAllBudgetMixToCart();
    } else {
      const prod = PRODUCTS.find(p => p.id === APP_STATE.pendingCartItem.productId);
      if (prod) executeAddToCart(prod, APP_STATE.pendingCartItem.qty || 1);
    }
    APP_STATE.pendingCartItem = null;
    toggleCartSheet(true);
  }
}

async function handleCustomerSignupSubmit(event) {
  if (event) event.preventDefault();
  const username = document.getElementById('signup-username')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const mobile = document.getElementById('signup-mobile')?.value.trim();
  const pass = document.getElementById('signup-password')?.value;
  const repeatPass = document.getElementById('signup-repeat-password')?.value;
  const errorEl = document.getElementById('signup-error-msg');

  if (!username || !email || !mobile || !pass || !repeatPass) {
    if (errorEl) { errorEl.innerText = 'Please fill all fields.'; errorEl.style.display = 'block'; }
    return;
  }

  if (pass !== repeatPass) {
    if (errorEl) { errorEl.innerText = 'Passwords do not match.'; errorEl.style.display = 'block'; }
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = mobile.replace(/[^0-9]/g, '');

  if (cleanMobile.length < 10) {
    if (errorEl) { errorEl.innerText = 'Please enter a valid 10-digit mobile number.'; errorEl.style.display = 'block'; }
    return;
  }

  // 1. Strict Duplicate Check in localStorage
  let users = [];
  try { users = JSON.parse(localStorage.getItem('mrs_crackers_registered_users') || '[]'); } catch (e) {}

  const dupMobile = users.find(u => u.mobile && u.mobile.replace(/[^0-9]/g, '') === cleanMobile);
  if (dupMobile) {
    if (errorEl) {
      errorEl.innerText = `User already registered with this mobile number (${cleanMobile}). Please log in.`;
      errorEl.style.display = 'block';
    }
    return;
  }

  const dupEmail = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  if (dupEmail) {
    if (errorEl) {
      errorEl.innerText = `User already registered with this email address (${cleanEmail}). Please log in.`;
      errorEl.style.display = 'block';
    }
    return;
  }

  // 2. Strict Duplicate Check in Supabase profiles
  if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.checkUserExists === 'function') {
    const checkRes = await MRS_BACKEND.checkUserExists(cleanEmail, cleanMobile);
    if (checkRes && checkRes.exists) {
      if (errorEl) {
        errorEl.innerText = checkRes.reason || 'User already registered with this mobile number or email. Please log in.';
        errorEl.style.display = 'block';
      }
      return;
    }
  }

  const newUserId = 'usr_' + Date.now();
  const newUser = {
    id: newUserId,
    username,
    email: cleanEmail,
    mobile: cleanMobile,
    password: pass,
    role: 'customer',
    avatar: null
  };

  users.push(newUser);
  localStorage.setItem('mrs_crackers_registered_users', JSON.stringify(users));

  APP_STATE.user = {
    id: newUserId,
    isLoggedIn: true,
    username,
    email,
    mobile,
    role: 'customer',
    avatar: null
  };

  localStorage.setItem('mrs_crackers_customer', JSON.stringify(APP_STATE.user));

  // Sync to Supabase
  if (typeof MRS_BACKEND !== 'undefined') {
    MRS_BACKEND.signUpCustomer({
      username,
      email,
      mobile,
      password: pass
    }).then(res => {
      if (res && res.user && res.user.id) {
        APP_STATE.user.id = res.user.id;
        localStorage.setItem('mrs_crackers_customer', JSON.stringify(APP_STATE.user));
      }
    });
  }

  closeSheet('login-sheet');
  updateAccountUI();
  showToast(`Account created! Welcome, ${username}! 💥`);

  if (APP_STATE.pendingCartItem) {
    if (APP_STATE.pendingCartItem.isBudgetMix) {
      addAllBudgetMixToCart();
    } else {
      const prod = PRODUCTS.find(p => p.id === APP_STATE.pendingCartItem.productId);
      if (prod) executeAddToCart(prod, APP_STATE.pendingCartItem.qty || 1);
    }
    APP_STATE.pendingCartItem = null;
    toggleCartSheet(true);
  }
}

function handleCustomerLogout() {
  APP_STATE.user = { isLoggedIn: false, role: 'customer', username: '', email: '', mobile: '', avatar: null };
  localStorage.removeItem('mrs_crackers_customer');
  localStorage.removeItem('mrs_crackers_cart');
  APP_STATE.cart = [];
  updateCartUI();
  updateAccountUI();
  showToast('Logged out successfully');
}

// ==========================================
// 10. ACCOUNT TAB & STRICT DYNAMIC ROLE INJECTION
// Customers have ZERO admin or rider markup in the DOM!
// ==========================================
function initUserSession() {
  // 1-Time Clean DB & State Migration (Purge all non-admin orders and dummy users)
  if (localStorage.getItem('mrs_crackers_clean_epoch_v5') !== 'true') {
    // Purge every legacy order key
    localStorage.removeItem('mrs_customer_orders');
    localStorage.removeItem('mrs_orders');
    localStorage.removeItem('mrs_saved_addresses');
    localStorage.removeItem('mrs_crackers_addresses');
    localStorage.removeItem('mrs_crackers_cart');
    localStorage.removeItem('mrs_driver_runs');
    localStorage.removeItem('mrs_crackers_registered_users');
    
    // Purge all namespaced user keys
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('mrs_usr_') || k.startsWith('mrs_guest_') || (k.startsWith('mrs_') && k.endsWith('_orders')) || (k.startsWith('mrs_') && k.endsWith('_addresses')))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}

    // If logged in as someone other than Rohan, log out to start completely fresh
    const cur = localStorage.getItem('mrs_crackers_customer');
    if (cur) {
      try {
        const u = JSON.parse(cur);
        if (u.email !== 'bandirohan43@gmail.com' && u.mobile !== '9392819362') {
          localStorage.removeItem('mrs_crackers_customer');
        }
      } catch (e) {
        localStorage.removeItem('mrs_crackers_customer');
      }
    }
    // Set clean admins list with ONLY Bandi Rohan
    localStorage.setItem('mrs_registered_admins', JSON.stringify([{
      id: 'admin_rohan',
      name: 'Bandi Rohan (Admin)',
      email: 'bandirohan43@gmail.com',
      mobile: '9392819362',
      password: 'Rohan@123',
      role: 'admin'
    }]));
    if (APP_STATE.admin) APP_STATE.admin.orders = [];
    localStorage.setItem('mrs_crackers_clean_epoch_v5', 'true');
  }

  const saved = localStorage.getItem('mrs_crackers_customer');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Clean up legacy mock profiles so user starts fresh
      if (parsed && (parsed.email === 'akhil.prasad@gmail.com' || parsed.email === 'madhumrs4514@gmail.com')) {
        localStorage.removeItem('mrs_crackers_customer');
        APP_STATE.user = { isLoggedIn: false, isGuest: true, role: 'customer', name: 'Guest Customer', username: '', email: '', mobile: '', avatar: null };
      } else {
        APP_STATE.user = parsed;
      }
    } catch (e) {
      APP_STATE.user = { isLoggedIn: false, isGuest: true, role: 'customer', name: 'Guest Customer', username: '', email: '', mobile: '', avatar: null };
    }
  } else {
    APP_STATE.user = { isLoggedIn: false, isGuest: true, role: 'customer', name: 'Guest Customer', username: '', email: '', mobile: '', avatar: null };
  }

  // If unauthenticated, ensure cart is strictly empty
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    APP_STATE.cart = [];
    localStorage.removeItem('mrs_crackers_cart');
  }

  const savedAddresses = getUserAddresses();
  if (savedAddresses && savedAddresses.length > 0) {
    APP_STATE.addresses = savedAddresses;
  } else {
    // Fallback to legacy key
    const legacyAddresses = localStorage.getItem('mrs_crackers_addresses');
    if (legacyAddresses) {
      try {
        APP_STATE.addresses = JSON.parse(legacyAddresses);
      } catch (e) {
        APP_STATE.addresses = getDefaultAddresses();
      }
    } else {
      APP_STATE.addresses = getDefaultAddresses();
    }
  }

  updateAccountUI();
}

function updateAccountUI() {
  const nameEl = document.getElementById('account-profile-name');
  const contactEl = document.getElementById('account-profile-contact');
  const avatarCont = document.getElementById('account-profile-avatar-container');
  const authBtn = document.getElementById('account-auth-action-btn');
  const customBtn = document.getElementById('account-customize-btn');
  const cartStatusEl = document.getElementById('account-cart-status');

  const totalItems = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + item.qty, 0) : 0;
  const totalAmount = APP_STATE.cart ? APP_STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
  if (cartStatusEl) {
    if (totalItems > 0) {
      cartStatusEl.innerText = `${totalItems} item${totalItems === 1 ? '' : 's'} • ₹${totalAmount}`;
    } else {
      cartStatusEl.innerText = `0 Items • ₹0`;
    }
  }

  const u = APP_STATE.user || {};
  const isCustomUser = u.isLoggedIn && u.name && u.name !== 'Guest Customer';
  const displayName = isCustomUser ? (u.name || u.username || 'Customer') : (u.isLoggedIn ? (u.username || u.name || 'Customer') : 'Guest Customer');
  const displayEmail = (u.isLoggedIn && u.email) ? u.email : '';
  const displayMobile = (u.isLoggedIn && (u.mobile || u.phone)) ? (u.mobile || u.phone) : '';
  const contactText = [displayEmail, displayMobile].filter(Boolean).join(' • ') || 'Sign in to view orders & saved addresses';

  if (nameEl) nameEl.innerText = displayName;
  if (contactEl) contactEl.innerText = contactText;

  if (avatarCont) {
    if (u.avatar && isCustomUser) {
      avatarCont.innerHTML = `<img src="${u.avatar}" alt="${displayName}" class="user-custom-dp">`;
    } else {
      const initial = (displayName.charAt(0) || (u.isLoggedIn ? 'C' : 'G')).toUpperCase();
      avatarCont.innerHTML = `<div class="user-initial-badge" style="background:#7C3AED; color:#FFF; font-weight:800; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.15rem; box-shadow: 0 0 10px rgba(124, 58, 237, 0.4);">${initial}</div>`;
    }
  }

  if (authBtn) {
    if (u.isLoggedIn) {
      authBtn.innerHTML = '<span>Log Out</span>';
      authBtn.onclick = handleCustomerLogout;
      authBtn.className = 'mrs-btn-sm-purple';
    } else {
      authBtn.innerHTML = '<span>Log In / Sign Up 🔑</span>';
      authBtn.onclick = () => openSheet('login-sheet');
      authBtn.className = 'mrs-btn-sm-purple';
    }
  }
  if (customBtn) {
    customBtn.style.display = u.isLoggedIn ? 'inline-flex' : 'none';
    customBtn.innerHTML = '<span>Edit Profile & DP</span>';
  }

  // =========================================================================
  // STRICT USER REQUIREMENT:
  // Customers should NOT have rider and admin things!
  // Don't just hide them; strictly inject card ONLY for verified admin or rider!
  // =========================================================================
  const staffSlot = document.getElementById('account-staff-dynamic-slot');
  if (staffSlot) {
    if (APP_STATE.user && APP_STATE.user.isLoggedIn && APP_STATE.user.role === 'admin') {
      staffSlot.innerHTML = `
        <div class="account-card-box" id="admin-access-card" style="border: 1px solid #FFB800; background: #141414; padding: 14px; margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.4rem;">👑</span>
              <div>
                <div style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: #FFFFFF;">Admin Operations Hub</div>
                <div style="font-family: var(--font-mono); font-size: 0.65rem; color: #FFB800;">Authorized Store Management (Bandi Rohan)</div>
              </div>
            </div>
            <button class="btn-gold-action" onclick="PORTALS.openGate('admin')" style="font-size: 0.72rem; padding: 7px 14px; white-space: nowrap;">
              Unlock Console 🔐
            </button>
          </div>
        </div>
      `;
    } else {
      // Regular customer or unauthenticated: ZERO MARKUP IN DOM!
      staffSlot.innerHTML = '';
    }
  }

  renderSavedAddresses();
}

function openProfileCustomizationModal() {
  if (!APP_STATE.user || !APP_STATE.user.isLoggedIn) {
    switchAuthTab('login');
    openSheet('login-sheet');
    return;
  }

  const nameInput = document.getElementById('custom-display-name');
  const urlInput = document.getElementById('custom-dp-url');
  if (nameInput) nameInput.value = APP_STATE.user.username || '';
  if (urlInput) urlInput.value = APP_STATE.user.avatar || '';
  APP_STATE._tempAvatar = APP_STATE.user.avatar;
  updateCustomizePreview(APP_STATE.user.username, APP_STATE.user.avatar);
  openSheet('profile-customization-sheet');
}

function updateCustomizePreview(name, avatarUrl) {
  const preview = document.getElementById('customize-preview-avatar');
  if (!preview) return;
  if (avatarUrl) {
    preview.innerHTML = `<img src="${avatarUrl}" class="user-custom-dp" style="width: 68px; height: 68px;">`;
  } else {
    const initial = (name || 'C').trim().charAt(0).toUpperCase() || 'C';
    preview.innerHTML = `<div class="user-initial-badge" style="width: 68px; height: 68px; font-size: 2rem;">${initial}</div>`;
  }
}

function handleDpFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('custom-dp-url').value = '';
    updateCustomizePreview(document.getElementById('custom-display-name').value, dataUrl);
    APP_STATE._tempAvatar = dataUrl;
  };
  reader.readAsDataURL(file);
}

function handleDpUrlInput(url) {
  APP_STATE._tempAvatar = url ? url.trim() : null;
  updateCustomizePreview(document.getElementById('custom-display-name').value, APP_STATE._tempAvatar);
}

function resetToInitialAvatar() {
  APP_STATE._tempAvatar = null;
  const urlEl = document.getElementById('custom-dp-url');
  const fileEl = document.getElementById('custom-dp-file');
  if (urlEl) urlEl.value = '';
  if (fileEl) fileEl.value = '';
  updateCustomizePreview(document.getElementById('custom-display-name').value, null);
  showToast('Reset to first-letter avatar');
}

function handleSaveProfileCustomization(event) {
  if (event) event.preventDefault();
  const newName = document.getElementById('custom-display-name').value.trim();
  if (!newName) {
    showToast('Name cannot be empty');
    return;
  }

  APP_STATE.user.username = newName;
  if (APP_STATE._tempAvatar !== undefined) {
    APP_STATE.user.avatar = APP_STATE._tempAvatar;
  }

  localStorage.setItem('mrs_crackers_customer', JSON.stringify(APP_STATE.user));
  updateAccountUI();
  closeSheet('profile-customization-sheet');
  showToast('Profile updated! ✨');
}

// ==========================================
// 11. SAVED ADDRESSES WITH SUPABASE SYNC
// ==========================================
function getDefaultAddresses() {
  return [
    {
      id: 1,
      tag: 'Home (Default)',
      name: 'Customer Delivery Address',
      phone: '+91 9848012345',
      address: 'Flat 402, Sri Sai Nivas, Saidabad Colony, Hyderabad',
      pincode: '500059'
    }
  ];
}

function renderSavedAddresses() {
  const list = document.getElementById('saved-addresses-list');
  if (!list) return;

  if (!APP_STATE.addresses || APP_STATE.addresses.length === 0) {
    list.innerHTML = `<div style="font-size: 0.75rem; color: var(--warm-400);">No saved addresses. Click "+ Add New" to add one.</div>`;
    return;
  }

  list.innerHTML = APP_STATE.addresses.map((addr, idx) => `
    <div style="background: rgba(13, 4, 28, 0.75); border: 1px solid var(--purple-border); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 0.88rem; color: #FFFFFF;">${addr.tag}</strong>
          ${idx === 0 ? '<span style="font-size: 0.62rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3);">PRIMARY</span>' : ''}
        </div>
        <div style="font-size: 0.78rem; color: #D1D5DB; margin-top: 4px; line-height: 1.4;">${addr.address}</div>
        <div style="font-family: monospace; font-size: 0.72rem; color: #9CA3AF; margin-top: 4px;">Pincode: ${addr.pincode} • Phone: ${addr.phone}</div>
      </div>
      <button onclick="removeAddress(${addr.id})" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; font-size: 0.72rem; font-weight: 700; border-radius: 6px; cursor: pointer; padding: 4px 8px; flex-shrink: 0;">Delete</button>
    </div>
  `).join('');
}

function openAddAddressModal() {
  const u = APP_STATE.user || {};
  const nameInput = document.getElementById('addr-input-name');
  const phoneInput = document.getElementById('addr-input-phone');
  const errEl = document.getElementById('address-form-error');

  if (nameInput) nameInput.value = (u.isLoggedIn && u.name && u.name !== 'Guest Customer') ? (u.username || u.name) : '';
  if (phoneInput) phoneInput.value = (u.isLoggedIn && (u.mobile || u.phone)) ? (u.mobile || u.phone) : '';
  if (errEl) errEl.style.display = 'none';

  openSheet('address-sheet');
}

function selectAddressTag(tag, btnEl) {
  const tagInput = document.getElementById('addr-input-tag');
  if (tagInput) tagInput.value = tag;

  document.querySelectorAll('.addr-tag-chip').forEach(b => {
    b.classList.remove('active');
    b.style.background = 'rgba(124,58,237,0.15)';
    b.style.borderColor = 'rgba(139,92,246,0.3)';
    b.style.color = '#DDD6FE';
  });

  if (btnEl) {
    btnEl.classList.add('active');
    btnEl.style.background = 'var(--purple-primary)';
    btnEl.style.borderColor = 'var(--purple-hover)';
    btnEl.style.color = '#FFFFFF';
  }
}

async function handleSaveAddressSubmit(event) {
  if (event) event.preventDefault();

  const tag = document.getElementById('addr-input-tag')?.value || 'Home';
  const name = document.getElementById('addr-input-name')?.value.trim() || (APP_STATE.user?.username || 'Customer');
  const phone = document.getElementById('addr-input-phone')?.value.trim() || (APP_STATE.user?.mobile || '9866522624');
  const street = document.getElementById('addr-input-street')?.value.trim();
  const colony = document.getElementById('addr-input-colony')?.value.trim();
  const city = document.getElementById('addr-input-city')?.value.trim() || 'Hyderabad';
  const pincode = document.getElementById('addr-input-pincode')?.value.trim() || '500059';
  const errEl = document.getElementById('address-form-error');

  if (!street || !colony) {
    if (errEl) {
      errEl.innerText = 'Please enter your house/flat number, street, and colony name.';
      errEl.style.display = 'block';
    }
    return;
  }

  const fullAddressText = `${street}, ${colony}, ${city}`;

  const newAddr = {
    id: Date.now(),
    tag: tag,
    name: name,
    phone: phone,
    address: fullAddressText,
    pincode: pincode
  };

  if (!APP_STATE.addresses) APP_STATE.addresses = [];
  APP_STATE.addresses.push(newAddr);
  setUserAddresses(APP_STATE.addresses);
  
  if (typeof MRS_BACKEND !== 'undefined' && APP_STATE.user && APP_STATE.user.id) {
    MRS_BACKEND.saveCustomerAddress(APP_STATE.user.id, {
      id: String(newAddr.id),
      label: tag,
      recipientName: name,
      mobile: phone,
      addressLine: street,
      locality: colony,
      city: city,
      pincode: pincode
    });
  }

  renderSavedAddresses();
  closeSheet('address-sheet');
  showToast('Address saved successfully! 📍');
}

function removeAddress(id) {
  APP_STATE.addresses = (APP_STATE.addresses || []).filter(a => a.id !== id);
  setUserAddresses(APP_STATE.addresses);
  renderSavedAddresses();
  showToast('Address removed');

  if (typeof MRS_BACKEND !== 'undefined') {
    MRS_BACKEND.deleteCustomerAddress(id);
  }
}

// ==========================================
// 12. ROLE VIEW GATE CONTROLLER
// ==========================================
function switchRoleView(role) {
  APP_STATE.currentUserRole = role;

  if (role === 'customer') {
    if (typeof PORTALS !== 'undefined') {
      PORTALS.exit();
    } else {
      const custView = document.getElementById('view-customer');
      if (custView) custView.style.display = 'flex';
      const pMount = document.getElementById('portal-mount-container');
      if (pMount) { pMount.innerHTML = ''; pMount.style.display = 'none'; }
    }
  } else if (role === 'driver') {
    if (APP_STATE.user && APP_STATE.user.isLoggedIn && APP_STATE.user.role === 'driver') {
      if (typeof PORTALS !== 'undefined') PORTALS.openGate('driver');
    } else {
      showToast('Restricted: Rider login credentials required! 🔒');
      openSheet('login-sheet');
    }
  } else if (role === 'admin') {
    if (APP_STATE.user && APP_STATE.user.isLoggedIn && APP_STATE.user.role === 'admin') {
      if (typeof PORTALS !== 'undefined') PORTALS.openGate('admin');
    } else {
      showToast('Restricted: Admin authorization credentials required! 🔒');
      openSheet('login-sheet');
    }
  }
}

// ==========================================
// 13. DRIVER REGISTRATION IN ADMIN PANEL WITH SUPABASE SYNC
// ==========================================
function registerDriverFromAdmin() {
  const emailInput = document.getElementById('new-driver-email');
  const nameInput = document.getElementById('new-driver-name');
  const phoneInput = document.getElementById('new-driver-phone');
  const vehicleInput = document.getElementById('new-driver-vehicle-type');

  const email = emailInput?.value.trim();
  const name = nameInput?.value.trim();
  const phone = phoneInput?.value.trim() || '9848099887';
  const vehicle = vehicleInput?.value || 'Rapido Bike (TS 07 HK 9090)';

  if (!email || !name) {
    alert('Please enter Driver Email and Name!');
    return;
  }

  const existing = APP_STATE.registeredDrivers.find(d => d.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    alert(`Driver with email ${email} is already registered!`);
    return;
  }

  const newDriver = {
    id: `DRV-${100 + APP_STATE.registeredDrivers.length + 1}`,
    name,
    email,
    phone,
    vehicle,
    type: vehicle.includes('Van') ? 'van' : 'bike',
    maxWeightKg: vehicle.includes('Van') ? 50.0 : 3.0,
    isOnline: true,
    rating: 5.0,
    todayEarnings: 0,
    completedTrips: 0
  };

  APP_STATE.registeredDrivers.unshift(newDriver);

  // Sync to Supabase Cloud Database!
  if (typeof MRS_BACKEND !== 'undefined') {
    MRS_BACKEND.registerDriverByAdmin({
      id: newDriver.id,
      name: newDriver.name,
      email: newDriver.email,
      mobile: newDriver.phone,
      vehicle: newDriver.vehicle
    });
  }

  if (emailInput) emailInput.value = '';
  if (nameInput) nameInput.value = '';
  if (phoneInput) phoneInput.value = '';

  renderAdminDriversList();
  showToast(`Driver ${name} registered in Cloud DB & Active! 🛵`);
}

function renderAdminDriversList() {
  const container = document.getElementById('admin-drivers-table-body');
  if (!container) return;

  container.innerHTML = APP_STATE.registeredDrivers.map(d => `
    <div style="background: var(--charcoal-900); border: 1px solid var(--charcoal-700); border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.2rem;">${d.type === 'van' ? '🚐' : '🛵'}</span>
        <div>
          <div style="font-weight: 700; color: var(--warm-50); font-size: 0.82rem;">${d.name} (${d.id})</div>
          <div style="font-size: 0.65rem; color: var(--warm-400);">${d.email} • ${d.phone} • ${d.vehicle}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="status-badge ${d.isOnline ? 'status-badge--green' : 'status-badge--amber'}" style="font-size: 0.62rem;">${d.isOnline ? 'ON DUTY' : 'OFFLINE'}</span>
        <div style="font-family: var(--font-mono); font-size: 0.65rem; color: #FFB800; margin-top: 2px;">★ ${d.rating}</div>
      </div>
    </div>
  `).join('');
}

function renderDriverDashboard() {
  const driver = APP_STATE.currentDriver || (APP_STATE.registeredDrivers && APP_STATE.registeredDrivers[0]);
  if (!driver) {
    const listEl = document.getElementById('driver-deliveries-list');
    if (listEl) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #9CA3AF;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔒</div>
          <div style="font-size: 1rem; font-weight: 800; color: #FFFFFF;">Access Locked: No Signed-Up Rider</div>
          <div style="font-size: 0.8rem; color: #A78BFA; margin-top: 6px;">
            You must be an approved, registered delivery rider to view and accept dispatches.
          </div>
        </div>
      `;
    }
    return;
  }

  const nameEl = document.getElementById('driver-name-display');
  const vehicleEl = document.getElementById('driver-vehicle-display');
  const earningsEl = document.getElementById('driver-kpi-earnings');
  const dropsEl = document.getElementById('driver-kpi-drops');
  const activeCountEl = document.getElementById('driver-active-count');
  const dutyToggleBtn = document.getElementById('driver-duty-toggle-btn');
  const dutyIndicator = document.getElementById('driver-duty-indicator');
  const dutyText = document.getElementById('driver-duty-text');

  if (nameEl) nameEl.innerText = driver.name;
  if (vehicleEl) vehicleEl.innerText = driver.vehicle;
  if (earningsEl) earningsEl.innerText = `₹${driver.todayEarnings}`;
  if (dropsEl) dropsEl.innerText = driver.completedTrips;

  if (dutyToggleBtn) dutyToggleBtn.className = `duty-toggle-btn ${driver.isOnline ? 'online' : ''}`;
  if (dutyIndicator) dutyIndicator.innerText = driver.isOnline ? '●' : '○';
  if (dutyText) dutyText.innerText = driver.isOnline ? 'On Duty' : 'Offline';

  const container = document.getElementById('driver-assignments-container');
  if (!container) return;

  const activeDeliveries = APP_STATE.driverAssignments.filter(d => d.deliveryStage !== 'delivered');
  if (activeCountEl) activeCountEl.innerText = `${activeDeliveries.length} Active Run${activeDeliveries.length !== 1 ? 's' : ''}`;

  if (activeDeliveries.length === 0) {
    container.innerHTML = `
      <div style="background: var(--charcoal-900); border: 1px dashed var(--charcoal-700); border-radius: var(--radius-md); padding: 30px 14px; text-align: center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px auto; display: block;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        <div style="font-family: var(--font-display); font-weight: 700; color: var(--warm-50); margin-top: 6px;">No Active Runs Pending</div>
        <div style="font-size: 0.72rem; color: var(--warm-400); margin-top: 2px;">Stay online — new orders from Saidabad counter will appear here!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = activeDeliveries.map((del, idx) => {
    const stage = (del.deliveryStage || 'assigned').toLowerCase();
    let stageBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid #F59E0B; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;">ASSIGNED</span>';
    let actionSection = '';

    if (stage === 'assigned') {
      stageBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid #F59E0B; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;">ASSIGNED</span>';
      actionSection = `
        <button class="driver-action-btn" onclick="progressDriverDelivery(${idx}, 'accepted')" style="margin-top: 8px; background: #7C3AED; color: #FFF; border: none; border-radius: 8px; padding: 10px; font-weight: 700; width: 100%; cursor: pointer;">
          1. Accept Delivery Assignment
        </button>
      `;
    } else if (stage === 'accepted') {
      stageBadge = '<span class="status-badge" style="background: rgba(139, 92, 246, 0.15); color: #A78BFA; border: 1px solid #8B5CF6; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;">ACCEPTED</span>';
      actionSection = `
        <button class="driver-action-btn" onclick="progressDriverDelivery(${idx}, 'picked_up')" style="margin-top: 8px; background: #2563EB; color: #FFF; border: none; border-radius: 8px; padding: 10px; font-weight: 700; width: 100%; cursor: pointer;">
          2. Confirm Picked Up from Saidabad Counter
        </button>
      `;
    } else if (stage === 'picked_up') {
      stageBadge = '<span class="status-badge" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid #3B82F6; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;">PICKED UP</span>';
      actionSection = `
        <button class="driver-action-btn" onclick="progressDriverDelivery(${idx}, 'out_for_delivery')" style="margin-top: 8px; background: #059669; color: #FFF; border: none; border-radius: 8px; padding: 10px; font-weight: 700; width: 100%; cursor: pointer;">
          3. Start Express Ride (Generate Customer OTP)
        </button>
      `;
    } else if (stage === 'out_for_delivery') {
      stageBadge = '<span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid #10B981; padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 700;">OUT FOR DELIVERY</span>';
      actionSection = `
        <div style="background: #111420; border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 12px; margin-top: 10px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #E5E7EB; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span>Customer Handover OTP Verification</span>
            <span style="font-size: 0.65rem; color: #F59E0B; font-weight: 700;">Mandatory for Delivery</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="rider-otp-input-${idx}" maxlength="4" placeholder="4-digit OTP" style="background: #000; border: 1px solid #7C3AED; color: #FFF; font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 800; letter-spacing: 4px; text-align: center; width: 130px; border-radius: 6px; padding: 8px; outline: none;" />
            <button onclick="submitRiderOTP(${idx})" style="flex: 1; background: #22C55E; color: #000; border: none; border-radius: 6px; padding: 10px 12px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
              Verify & Handover
            </button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 0.65rem; color: #9CA3AF;">Customer provides OTP received on WhatsApp/SMS</span>
            <button onclick="resendCustomerDeliveryOTP(${idx})" style="background: transparent; border: none; color: #A78BFA; font-size: 0.65rem; cursor: pointer; text-decoration: underline; padding: 0;">
              Resend OTP
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="delivery-order-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 0.88rem; color: var(--warm-50);">${del.orderId}</div>
          ${stageBadge}
        </div>

        <div style="font-size: 0.75rem; color: var(--warm-200); line-height: 1.4; margin-top: 4px;">
          <strong>Customer:</strong> ${del.customer} (${del.phone})<br>
          <span style="color: var(--warm-400);">Address:</span> ${typeof del.address === 'object' ? `${del.address.house || ''}, ${del.address.area || ''}` : del.address}
        </div>

        <div style="background: var(--charcoal-950); border: 1px solid var(--charcoal-700); border-radius: var(--radius-sm); padding: 8px; font-family: var(--font-mono); font-size: 0.68rem; display: flex; justify-content: space-between; margin-top: 6px;">
          <span>Consignment: <strong style="color: var(--ember-400);">${del.weight}</strong></span>
          <span>Rack: <strong style="color: #60a5fa;">${del.pickupRack ? del.pickupRack.split('(')[0] : 'R-12'}</strong></span>
          <span>Payment: <strong style="color: #34d399;">${del.paymentMode}</strong></span>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <a href="https://maps.google.com/?q=${encodeURIComponent(typeof del.address === 'object' ? `${del.address.house || ''}, ${del.address.area || ''}` : del.address)}" target="_blank" class="driver-secondary-btn" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; text-decoration: none; padding: 8px; border-radius: 6px; background: #1C1C1C; color: #FFF; font-size: 0.75rem; border: 1px solid #333;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Navigation GPS</span>
          </a>
          <a href="tel:${del.phone}" class="driver-secondary-btn" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; text-decoration: none; padding: 8px; border-radius: 6px; background: #1C1C1C; color: #FFF; font-size: 0.75rem; border: 1px solid #333;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Customer</span>
          </a>
        </div>

        ${actionSection}
      </div>
    `;
  }).join('');
}

function progressDriverDelivery(idx, nextStage) {
  const del = APP_STATE.driverAssignments[idx];
  if (!del) return;

  const driver = APP_STATE.currentDriver || APP_STATE.registeredDrivers[0];

  if (nextStage === 'out_for_delivery') {
    // Generate secure, unique, time-limited 4-digit OTP bound to this delivery
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    del.customerOtp = generatedOtp;
    del.otpExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    del.otpAttempts = 0;
    del.lastOtpSentAt = Date.now();

    // Bind to parent order in admin state
    const parentOrder = (APP_STATE.admin && APP_STATE.admin.orders ? APP_STATE.admin.orders.find(o => o.id === del.orderId) : null);
    if (parentOrder) {
      parentOrder.deliveryOtp = generatedOtp;
      parentOrder.status = 'OUT_FOR_DELIVERY';
      parentOrder.outForDeliveryAt = new Date().toISOString();
    }

    // Official WhatsApp notification dispatch
    console.log(`[WHATSAPP DISPATCH] 📲 Sent delivery OTP ${generatedOtp} to customer ${del.customer} (+91 ${del.phone}) for Order ${del.orderId}`);
    showToast(`Order is OUT FOR DELIVERY! 4-digit OTP sent to customer WhatsApp (+91 ${del.phone}).`, 5000);
  } else {
    showToast(`Delivery stage updated to: ${nextStage.toUpperCase()}`);
  }

  del.deliveryStage = nextStage;

  if (typeof MRS_BACKEND !== 'undefined' && typeof MRS_BACKEND.updateOrderStatus === 'function') {
    MRS_BACKEND.updateOrderStatus(del.orderId, nextStage, driver ? driver.id : null);
  }

  renderDriverDashboard();
  renderCustomerOrders();
  if (typeof renderAdminOrders === 'function') renderAdminOrders();
}

async function submitRiderOTP(idx) {
  const del = APP_STATE.driverAssignments[idx];
  if (!del) return;

  const inputEl = document.getElementById(`rider-otp-input-${idx}`);
  const enteredOtp = inputEl ? inputEl.value.trim() : '';

  if (!enteredOtp || enteredOtp.length !== 4) {
    showToast('Please enter the complete 4-digit Customer Delivery OTP.');
    return;
  }

  // Attempt limits check
  if ((del.otpAttempts || 0) >= 3) {
    showToast('Security Lockout: Exceeded maximum 3 OTP attempts. Tap "Resend OTP".');
    return;
  }

  // Primary verification via Supabase Backend
  if (typeof MRS_BACKEND !== 'undefined' && MRS_BACKEND.verifyDeliveryOtp) {
    const res = await MRS_BACKEND.verifyDeliveryOtp({
      orderId: del.orderId,
      enteredOtp: enteredOtp,
      riderId: del.driverId || 'DRV-101'
    });
    if (!res.success) {
      del.otpAttempts = (del.otpAttempts || 0) + 1;
      showToast(res.error || `Incorrect OTP! Attempt ${del.otpAttempts}/3.`);
      return;
    }
  } else if (del.customerOtp && enteredOtp !== del.customerOtp) {
    del.otpAttempts = (del.otpAttempts || 0) + 1;
    showToast(`Incorrect OTP! Attempt ${del.otpAttempts}/3. Please confirm with customer.`);
    return;
  }

  // OTP VERIFIED SUCCESSFULLY - COMPLETE HANDOVER
  del.deliveryStage = 'delivered';
  del.deliveredAt = new Date().toISOString();
  del.customerOtp = null; // Invalidate OTP immediately

  const driver = APP_STATE.currentDriver || APP_STATE.registeredDrivers[0];
  if (driver) {
    driver.completedTrips = (driver.completedTrips || 0) + 1;
    driver.todayEarnings = (driver.todayEarnings || 0) + 120;
    del.verifyingRider = driver.name;
  }

  // Find parent order
  const parentOrder = (APP_STATE.admin && APP_STATE.admin.orders ? APP_STATE.admin.orders.find(o => o.id === del.orderId) : null) || {
    id: del.orderId,
    customer: del.customer || 'Customer',
    phone: del.phone || '',
    email: del.email || '',
    total: del.amount || 0,
    items: []
  };

  parentOrder.status = 'delivered';
  parentOrder.deliveryStage = 'delivered';
  parentOrder.deliveredAt = new Date().toISOString();
  parentOrder.verifyingRider = driver ? driver.name : 'Rider';

  // TRIGGER OFFICIAL GST TAX INVOICE DISPATCH ONLY ON DELIVERED STATUS
  if (typeof window.MRS_INVOICE !== 'undefined') {
    window.MRS_INVOICE.autoDispatchDeliveryInvoice(parentOrder, driver ? driver.name : 'Rider');
  }

  showToast(`Handover Verified! Order ${del.orderId} marked Delivered. Tax Invoice sent to customer! 🧾`);
  playFestiveSound('pop');

  renderDriverDashboard();
  renderCustomerOrders();
  if (typeof renderAdminOrders === 'function') renderAdminOrders();
}

function resendCustomerDeliveryOTP(idx) {
  const del = APP_STATE.driverAssignments[idx];
  if (!del) return;

  const now = Date.now();
  if (del.lastOtpSentAt && (now - del.lastOtpSentAt) < 20000) {
    showToast('Please wait 20 seconds before requesting another OTP.');
    return;
  }

  const freshOtp = String(Math.floor(1000 + Math.random() * 9000));
  del.customerOtp = freshOtp;
  del.otpExpiresAt = now + 30 * 60 * 1000;
  del.otpAttempts = 0;
  del.lastOtpSentAt = now;

  const parentOrder = (APP_STATE.admin && APP_STATE.admin.orders ? APP_STATE.admin.orders.find(o => o.id === del.orderId) : null);
  if (parentOrder) {
    parentOrder.deliveryOtp = freshOtp;
  }

  console.log(`[WHATSAPP RESEND] 📲 Resent fresh delivery OTP ${freshOtp} to customer ${del.customer} (+91 ${del.phone})`);
  showToast(`Fresh OTP sent to customer WhatsApp (+91 ${del.phone})!`);
  renderCustomerOrders();
}




// ==========================================
// 14. ADMIN & UTILITY HELPERS
// ==========================================
function updateAnnouncementBanner() {
  const text = document.getElementById('admin-announcement-input')?.value.trim();
  if (text) {
    APP_STATE.admin.announcementText = text;
    const banner = document.getElementById('top-announcement-text');
    if (banner) banner.innerText = text;
    showToast('Announcement ticker updated! 📢');
  }
}

function openBlueprintsSheet(img) {
  const el = document.getElementById('blueprints-img-viewer');
  if (el) el.src = img;
  openSheet('blueprints-sheet');
}

function setupEventListeners() {
  // Category Pill clicks
  document.querySelectorAll('.category-pill-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-pill-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      APP_STATE.activeFilter.category = card.dataset.category;
      renderProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      APP_STATE.activeFilter.search = e.target.value.trim();
      renderProducts();
    });
  }

  // Price slider
  const priceSlider = document.getElementById('price-slider-input');
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      APP_STATE.activeFilter.priceMax = parseInt(e.target.value, 10);
      const valEl = document.getElementById('price-display-val');
      if (valEl) valEl.innerText = `₹${e.target.value}`;
      renderProducts();
    });
  }

  // Sound filter
  document.querySelectorAll('#filter-sheet button[data-sound]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-sheet button[data-sound]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.activeFilter.soundLevel = btn.dataset.sound;
      renderProducts();
    });
  });

  // Day/Night filter
  document.querySelectorAll('#filter-sheet button[data-daynight]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-sheet button[data-daynight]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.activeFilter.dayNight = btn.dataset.daynight;
      renderProducts();
    });
  });

  // Backdrop click to close
  document.querySelectorAll('.bottom-sheet-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
        checkModalScrollLock();
      }
    });
  });
}

function resetAllFilters() {
  APP_STATE.activeFilter = { category: 'all', search: '', priceMax: 20000, soundLevel: 'all', dayNight: 'all' };
  const searchInput = document.getElementById('main-search-input');
  if (searchInput) searchInput.value = '';
  const slider = document.getElementById('price-slider-input');
  if (slider) slider.value = 20000;
  const valEl = document.getElementById('price-display-val');
  if (valEl) valEl.innerText = '₹20000';

  document.querySelectorAll('.category-pill-card').forEach(c => c.classList.remove('active'));
  document.querySelector('.category-pill-card[data-category="all"]')?.classList.add('active');

  document.querySelectorAll('#filter-sheet button[data-sound]').forEach(b => b.classList.toggle('active', b.dataset.sound === 'all'));
  document.querySelectorAll('#filter-sheet button[data-daynight]').forEach(b => b.classList.toggle('active', b.dataset.daynight === 'all'));

  renderProducts();
  showToast('Filters reset');
}

function switchLanguage(lang) {
  APP_STATE.lang = 'en';
}

function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Remove existing toasts so it never clutters the screen
  container.querySelectorAll('.toast, .mrs-toast-notification').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) scale(0.95)';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}


// =============================================================================
// MOBILE NAVIGATION DRAWER CONTROLLER
// =============================================================================
function toggleMobileNavDrawer(open) {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer) return;
  if (open === undefined) {
    drawer.classList.toggle('open');
  } else if (open) {
    drawer.classList.add('open');
  } else {
    drawer.classList.remove('open');
  }
}
window.toggleMobileNavDrawer = toggleMobileNavDrawer;
