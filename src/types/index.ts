import { Request } from 'express';






export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    user_uuid: string;
    id:number,
    user_type:string
    // Add other properties if needed
  };
}
