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
    location: Joi.object({
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional()
  })
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    image: Joi.string().uri().optional(),
    mode: Joi.string().valid('In-person', 'Online').required(),
    category: Joi.string().valid(
      'music', 'culture', 'education', 'sports', 'art', 'business', 
      'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
      'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference'
    ).required(),
    location: Joi.object({
      address: Joi.string().max(200).required(),
      city: Joi.string().max(50).required(),
      country: Joi.string().max(50).required(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      }).required()
    }).required(),
    date: Joi.date().min('now').required(),
    time: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).required(),
    featured: Joi.boolean().optional(),
    capacity: Joi.number().min(1).max(100000).optional(),
    price: Joi.number().min(0).optional(),
    organizerName: Joi.string().min(2).max(100).required(),
    importantInfo: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    image: Joi.string().uri().optional(),
    mode: Joi.string().valid('In-person', 'Online').optional(),
    category: Joi.string().valid(
      'music', 'culture', 'education', 'sports', 'art', 'business', 
      'food', 'technology', 'health', 'fashion', 'travel', 'photography', 
      'gaming', 'automotive', 'charity', 'networking', 'workshop', 'conference'
    ).optional(),
    location: Joi.object({
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      country: Joi.string().max(50).optional(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    date: Joi.date().min('now').optional(),
    time: Joi.string().pattern(/^(0[1-9]|1[0-2]):[0-5][0-9] ?(AM|PM)$/i).optional(),
    featured: Joi.boolean().optional(),
    capacity: Joi.number().min(1).max(100000).optional(),
    price: Joi.number().min(0).optional(),
    organizerName: Joi.string().min(2).max(100).optional(),
    importantInfo: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string().max(30)).max(10).optional()
  })
};

module.exports = {
  validate,
  organizerSchemas,
  eventSchemas
};
