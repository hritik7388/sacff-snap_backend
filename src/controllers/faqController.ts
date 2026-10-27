// src/controllers/faqController.ts
import { Request, Response, NextFunction } from "express"; 
import { AuthenticatedRequest } from "../types";
import { createFAQSchema, updateFAQSchema } from "../schemas/faqSchema";
import faqServices from "../services/faqServices";

class FAQController {
  // Create FAQ
  async createFAQ(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try { 

      const data = createFAQSchema.parse(req.body);

     

      const result = await faqServices.createFAQService(
        data, 
      );

      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all FAQs for SuperAdmin
  async getAllFAQs(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
         const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10),
    );
      const result = await faqServices.getAllFAQsService(page, limit);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get FAQ by ID
  async getFAQById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

     
      const result = await faqServices.getFAQByIdService(
        BigInt(id),
      );
 
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update FAQ
  async updateFAQ(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const parsed = updateFAQSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid FAQ data",
          errors: parsed.error.flatten(),
        });
      }

      const result = await faqServices.updateFAQService(
        BigInt(id),
        parsed.data,
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Permanently delete FAQ
  async deleteFAQ(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const result = await faqServices.deleteFAQService( BigInt(id)
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Public landing page FAQs
  async getActiveFAQs(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await faqServices.getActiveFAQsService();

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new FAQController();