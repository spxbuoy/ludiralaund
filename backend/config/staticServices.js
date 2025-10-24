const STATIC_SERVICES = [
  // Wash & Fold Services
  {
    _id: "service_wash_fold_basic",
    name: "Basic Wash & Fold",
    description: "Professional washing, drying, and folding service for your everyday clothes",
    category: "wash-fold",
    basePrice: 15.0,
    price: 15.0, // Add price field for frontend compatibility
    estimatedTime: "24-48 hours",
    requirements: "Separate by color and fabric type",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_wash_fold_premium",
    name: "Premium Wash & Fold",
    description: "Premium wash and fold with fabric softener and eco-friendly detergents",
    category: "wash-fold",
    basePrice: 25.0,
    price: 25.0,
    estimatedTime: "24-48 hours",
    requirements: "Premium detergents and fabric care",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_wash_fold_express",
    name: "Express Wash & Fold",
    description: "Same-day wash and fold service for urgent needs",
    category: "wash-fold",
    basePrice: 35.0,
    price: 35.0,
    estimatedTime: "Same day",
    requirements: "Drop off by 10 AM for same-day service",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },

  // Dry Cleaning Services
  {
    _id: "service_dry_clean_standard",
    name: "Standard Dry Cleaning",
    description: "Professional dry cleaning for suits, dresses, and delicate fabrics",
    category: "dry-cleaning",
    basePrice: 20.0,
    price: 20.0,
    estimatedTime: "2-3 days",
    requirements: "Check garment care labels",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_dry_clean_premium",
    name: "Premium Dry Cleaning",
    description: "Luxury dry cleaning with specialized care for high-end garments",
    category: "dry-cleaning",
    basePrice: 40.0,
    price: 40.0,
    estimatedTime: "3-5 days",
    requirements: "Luxury garment specialist handling",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_dry_clean_express",
    name: "Express Dry Cleaning",
    description: "Fast dry cleaning service for urgent needs",
    category: "dry-cleaning",
    basePrice: 30.0,
    price: 30.0,
    estimatedTime: "24 hours",
    requirements: "Express service surcharge applies",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },

  // Ironing Services
  {
    _id: "service_ironing_basic",
    name: "Basic Ironing",
    description: "Professional ironing and pressing for everyday clothes",
    category: "ironing",
    basePrice: 10.0,
    price: 10.0,
    estimatedTime: "24 hours",
    requirements: "Clean clothes only",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },
  {
    _id: "service_ironing_premium",
    name: "Premium Ironing",
    description: "Expert pressing with steam treatment for crisp, professional results",
    category: "ironing",
    basePrice: 18.0,
    price: 18.0,
    estimatedTime: "24-48 hours",
    requirements: "Professional steam pressing equipment",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },
  {
    _id: "service_ironing_shirts",
    name: "Shirt Pressing",
    description: "Specialized shirt pressing for business and formal shirts",
    category: "ironing",
    basePrice: 8.0,
    price: 8.0,
    estimatedTime: "Same day",
    requirements: "Business shirt specialist service",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/ironing.webp"
  },

  // Stain Removal Services
  {
    _id: "service_stain_removal_basic",
    name: "Basic Stain Removal",
    description: "Treatment for common stains like food, drinks, and dirt",
    category: "stain-removal",
    basePrice: 15.0,
    price: 15.0,
    estimatedTime: "2-3 days",
    requirements: "Fresh stains work best",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },
  {
    _id: "service_stain_removal_advanced",
    name: "Advanced Stain Treatment",
    description: "Specialized treatment for tough stains like oil, blood, and ink",
    category: "stain-removal",
    basePrice: 25.0,
    price: 25.0,
    estimatedTime: "3-5 days",
    requirements: "Specify stain type and age",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },
  {
    _id: "service_stain_removal_restoration",
    name: "Garment Restoration",
    description: "Professional restoration for vintage or damaged garments",
    category: "stain-removal",
    basePrice: 50.0,
    price: 50.0,
    estimatedTime: "1-2 weeks",
    requirements: "Assessment required before treatment",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/stain removal.jpg"
  },

  // Specialty Services
  {
    _id: "service_specialty_comforter",
    name: "Comforter & Bedding",
    description: "Deep cleaning for comforters, quilts, and bulky bedding",
    category: "specialty",
    basePrice: 40.0,
    price: 40.0,
    estimatedTime: "3-5 days",
    requirements: "Check care labels first",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/wash and fold.jpg"
  },
  {
    _id: "service_specialty_curtains",
    name: "Curtain Cleaning",
    description: "Professional cleaning for curtains and drapes",
    category: "specialty",
    basePrice: 35.0,
    price: 35.0,
    estimatedTime: "5-7 days",
    requirements: "Take down and rehang service available",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  },
  {
    _id: "service_specialty_leather",
    name: "Leather Care",
    description: "Specialized cleaning and conditioning for leather garments",
    category: "specialty",
    basePrice: 60.0,
    price: 60.0,
    estimatedTime: "1-2 weeks",
    requirements: "Leather specialist treatment",
    isActive: true,
    isAvailable: true,
    imageUrl: "/image/drycleaning.webp"
  }
];

module.exports = { STATIC_SERVICES };