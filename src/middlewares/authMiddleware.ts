import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

interface TokenPayload extends JwtPayload {
  user_id: number;
  user_uuid: string;
  id: number
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = (jwt.verify(token, process.env.JWT_SECRET!)) as TokenPayload;
      req.user = {
        user_id: decoded.user_id as number,
        user_uuid: decoded.user_uuid as string,
        id: decoded.id as number,
        user_type: (decoded as any).user_type as string
      };
      next();
    } catch (error) {
      res.status(500).json({ message: 'Invalid or expired token' });
    }
  } else {
    res.status(500).json({ message: 'Authorization header missing or malformed' });
  }
};

export const isSUperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'SUPER_ADMIN') {
    return res.status(500).json({ message: 'Access denied: Not a super admin' });
  }
  next();
}

export const isSubAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'COMPANY') {
    return res.status(500).json({ message: 'Access denied: Not a sub admin' });
  }
  next();
}

export const isTradesMan = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'TRADESMAN') {
    return res.status(500).json({ message: 'Access denied: Not a tradesman' });
  }
  next();
}

export const isProjectManager = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'PROJECT_MANAGER') {
    return res.status(500).json({ message: 'Access denied: Not a project manager' });
  }
  next();
}

export const isCompetentPerson = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'COMPETENT_PERSON') {
    return res.status(500).json({ message: 'Access denied: Not a competent person' });
  }
  next();
}

export const clientAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = req.headers["x-client-key"] || req.headers["client-secret"];

  if (!clientKey) {
    return res.status(500).json({ message: "Client key missing in headers" });
  }

  if (clientKey !== process.env.CLIENT_SECRET) {
    return res.status(500).json({ message: "Invalid client key" });
  }

  next();
};
