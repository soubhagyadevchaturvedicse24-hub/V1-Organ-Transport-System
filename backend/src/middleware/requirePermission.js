const ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: [
    'auth:login', 'auth:refresh', 'hospital:create', 'hospital:view', 
    'donor:view', 'mission:view', 'audit:view'
  ],
  NOTTO_OFFICER: [
    'auth:login', 'auth:refresh', 'hospital:create', 'hospital:view', 
    'mission:view', 'audit:view'
  ],
  ROTTO_SOTTO_OFFICER: [
    'auth:login', 'auth:refresh', 'hospital:view', 'mission:view', 
    'audit:view'
  ],
  HOSPITAL_COORDINATOR: [
    'auth:login', 'auth:refresh', 'hospital:view', 'donor:create', 
    'donor:view', 'mission:view'
  ],
  TRANSPLANT_SURGEON: [
    'auth:login', 'auth:refresh', 'hospital:view', 'donor:create', 
    'donor:view', 'mission:view', 'organ:match'
  ],
  TRANSPORT_COORDINATOR: [
    'auth:login', 'auth:refresh', 'mission:view', 'transport:start', 
    'transport:complete'
  ],
  COURIER: [
    'auth:login', 'auth:refresh', 'mission:view', 'transport:start', 
    'transport:complete'
  ],
  AUDITOR: [
    'auth:login', 'auth:refresh', 'audit:view'
  ]
};

export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next({ code: 'AUTH_003', message: 'Access denied. Role not found.', status: 403 });
    }

    const permissions = ROLE_PERMISSIONS[req.user.role] || [];
    
    if (!permissions.includes(requiredPermission)) {
      return next({ code: 'AUTH_003', message: 'Access denied. Insufficient permissions.', status: 403 });
    }

    next();
  };
};
