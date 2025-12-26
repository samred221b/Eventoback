const isAdmin = (req, res, next) => {
  if (req.user?.email?.toLowerCase() === 'samred221b@gmail.com') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access denied',
    message: 'Admin privileges required'
  });
};

const optionalAdmin = (req, res, next) => {
  // If no user, continue without admin
  if (!req.user) {
    req.isAdmin = false;
    return next();
  }
  
  // Check if user is admin
  req.isAdmin = req.user?.email?.toLowerCase() === 'samred221b@gmail.com';
  next();
};

module.exports = {
  isAdmin,
  optionalAdmin
};
