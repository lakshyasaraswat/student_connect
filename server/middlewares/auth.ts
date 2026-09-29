import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../config/jwt.ts';
import { UserModel } from '../models/schemas.ts';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { walletBalance?: number };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
    return;
  }

  const userDoc = await UserModel.findOne({ id: payload.userId }).lean();
  if (!userDoc) {
    res.status(401).json({ success: false, message: 'User account not found.' });
    return;
  }

  req.user = {
    ...payload,
    walletBalance: userDoc.walletBalance,
  };

  next();
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const userDoc = await UserModel.findOne({ id: payload.userId }).lean();
      if (userDoc) {
        req.user = {
          ...payload,
          walletBalance: userDoc.walletBalance,
        };
      }
    }
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' lacks sufficient privileges for this action.`,
      });
      return;
    }
    next();
  };
}