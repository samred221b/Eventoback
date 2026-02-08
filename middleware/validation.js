const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errorMessage,
        details: error.details
      });
    }
    
    next();
  };
};

// Organizer validation schemas
const organizerSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    bio: Joi.string().max(500).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    location: Joi.object({
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    bio: Joi.string().max(500).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    profileImage: Joi.string().optional().allow(''), // Accept both URLs and file URIs
    organization: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional().allow(''),
    // Accept individual location fields for easier frontend integration
    address: Joi.string().max(200).optional().allow(''),
    city: Joi.string().max(50).optional().allow(''),
    country: Joi.string().max(50).optional().allow(''),
    // Also accept nested location object for backward compatibility
    location: Joi.object({
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional()
  }).unknown(true) // Allow unknown fields to prevent validation errors
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    image: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    mode: Joi.string().valid('In-person', 'Online').required(),
    category: Joi.string().valid(
      'music', 'culture', 'education', 'sports', 'art', 'business', 
      'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
      'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference', 'religious'
    ).required(),
    location: Joi.object({
      address: Joi.string().max(200).required(),
      city: Joi.string().max(50).required(),
      country: Joi.string().max(50).required(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      }).required(),
      geo: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).required()
      }).required()
    }).required(),
    date: Joi.date().min('now').required(),
    endDate: Joi.date().min(Joi.ref('date')).optional(),
    time: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).required(),
    endTime: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).optional(),
    featured: Joi.boolean().optional(),
    capacity: Joi.number().min(1).max(100000).optional(),
    price: Joi.number().min(0).optional(),
    vipTitle: Joi.string().max(40).allow('').optional(),
    vipPrice: Joi.number().min(0).optional(),
    vvipTitle: Joi.string().max(40).allow('').optional(),
    vvipPrice: Joi.number().min(0).optional(),
    onDoorTitle: Joi.string().max(40).allow('').optional(),
    onDoorPrice: Joi.number().min(0).optional(),
    earlyBirdTitle: Joi.string().max(40).allow('').optional(),
    earlyBirdPrice: Joi.number().min(0).optional(),
    extra1Title: Joi.string().max(40).allow('').optional(),
    extra1Price: Joi.number().min(0).optional(),
    extra2Title: Joi.string().max(40).allow('').optional(),
    extra2Price: Joi.number().min(0).optional(),
    extra3Title: Joi.string().max(40).allow('').optional(),
    extra3Price: Joi.number().min(0).optional(),
    organizerName: Joi.string().min(2).max(100).required(),
    importantInfo: Joi.string().max(500).optional(),
    ticketsAvailableAt: Joi.string().max(200).optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    image: Joi.string().uri().optional(),
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    mode: Joi.string().valid('In-person', 'Online').optional(),
    category: Joi.string().valid(
      'music', 'culture', 'education', 'sports', 'art', 'business', 
      'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
      'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference', 'religious'
    ).optional(),
    location: Joi.object({
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional(),
      geo: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array().items(Joi.number()).length(2).optional()
      }).optional()
    }).optional(),
    date: Joi.date().min('now').optional(),
    endDate: Joi.date().when('date', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('date')),
      otherwise: Joi.date().min('now')
    }).optional(),
    time: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).optional(),
    endTime: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).optional(),
    featured: Joi.boolean().optional(),
    capacity: Joi.number().min(1).max(100000).optional(),
    price: Joi.number().min(0).optional(),
    vipTitle: Joi.string().max(40).allow('').optional(),
    vipPrice: Joi.number().min(0).optional(),
    vvipTitle: Joi.string().max(40).allow('').optional(),
    vvipPrice: Joi.number().min(0).optional(),
    onDoorTitle: Joi.string().max(40).allow('').optional(),
    onDoorPrice: Joi.number().min(0).optional(),
    earlyBirdTitle: Joi.string().max(40).allow('').optional(),
    earlyBirdPrice: Joi.number().min(0).optional(),
    extra1Title: Joi.string().max(40).allow('').optional(),
    extra1Price: Joi.number().min(0).optional(),
    extra2Title: Joi.string().max(40).allow('').optional(),
    extra2Price: Joi.number().min(0).optional(),
    extra3Title: Joi.string().max(40).allow('').optional(),
    extra3Price: Joi.number().min(0).optional(),
    additionalPricingTiers: Joi.array().items(Joi.object({
      title: Joi.string().max(40).allow('').optional(),
      price: Joi.number().min(0).optional()
    })).optional(),
    organizerName: Joi.string().min(2).max(100).optional(),
    status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional(),
    importantInfo: Joi.string().max(500).optional(),
    ticketsAvailableAt: Joi.string().max(200).optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
  })
};

module.exports = {
  validate,
  organizerSchemas,
  eventSchemas
};
