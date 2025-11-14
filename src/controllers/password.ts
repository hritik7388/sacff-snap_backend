import { Response } from "express";
import { Request } from "express";
import { PasswordServices } from "../services/passwordServices";
import { chnagePasswordSchema, forgotPasswordSchema, resetPasswordSchema, verifyOTPSchema } from "../schemas/passwordSchema";
import { AuthenticatedRequest } from "../types/index";
const password = new PasswordServices();

export class PasswordController { 
     async changePassword(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = chnagePasswordSchema.parse(req.body);
      const result = await password.changePasswordService(data, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }

  }

    async forgotPassword(req: Request, res: Response, next: Function) {
    try { 
        const data=forgotPasswordSchema.parse(req.body);
      const result = await password.forgotPasswordServices(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
    
  }

      async resendOTP(req: Request, res: Response, next: Function) {
    try { 
        const data=forgotPasswordSchema.parse(req.body);
      const result = await password.resendOTPServices(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
    
  }

  async verifyOTP(req: Request, res: Response, next: Function) {
    try { 
        const data=verifyOTPSchema.parse(req.body);
      const result = await password.verifyOTPService(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
}

     async resetPassword(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = resetPasswordSchema.parse(req.body);
      const result = await password.resetPasswordService(data, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
}
}