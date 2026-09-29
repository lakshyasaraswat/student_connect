import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt.ts';
import { db } from '../config/db.ts';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { walletBalance?: number };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }

  const userDoc = db.users.find(u => u.id === payload.userId);
  if (!userDoc) {
    return res.status(401).json({ success: false, message: 'User account not found.' });
  }

  req.user = {
    ...payload,
    walletBalance: userDoc.walletBalance
  };

  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const userDoc = db.users.find(u => u.id === payload.userId);
      if (userDoc) {
        req.user = {
          ...payload,
          walletBalance: userDoc.walletBalance
        };
      }
    }
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' lacks sufficient privileges for this action.`
      });
    }
    next();
  };
}
