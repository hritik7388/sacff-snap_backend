// src/services/faqServices.ts
import { v4 as uuidv4 } from "uuid";
import { CreateFAQDTO, UpdateFAQDTO } from "../schemas/faqSchema";
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";

class FAQServices {
  // Create FAQ
  async createFAQService(data: CreateFAQDTO,) {
    try {
      const faq = await prisma.fAQ.create({
        data: {
          uuid: uuidv4(),
          question: data.question,
          answer: data.answer,
          status: data.status ?? "ACTIVE",
          sortOrder: data.sortOrder ?? 0, 
        },
      });

      return {
        message: "FAQ created successfully",
        data: {
          ...faq,
          id: faq.id.toString(), 
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to create FAQ", 500, error.message);
    }
  }

  // Get all FAQs for SuperAdmin
 async getAllFAQsService(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const [faqs, total] = await Promise.all([
      prisma.fAQ.findMany({
        skip,
        take: limit,
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
      }),

      prisma.fAQ.count(),
    ]);

    return {
      message: "FAQs fetched successfully",
      data: faqs.map((faq) => ({
        ...faq,
        id: faq.id.toString(), 
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;

    throw new CustomError("Failed to fetch FAQs", 500, error.message);
  }
}

  // Get particular FAQ
  async getFAQByIdService(id: bigint) {
    try {
      const faq = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!faq) {
        throw new CustomError("FAQ not found", 404, "Invalid FAQ ID");
      }

      return {
        message: "FAQ fetched successfully",
        data: {
          ...faq,
          id: faq.id.toString(), 
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to fetch FAQ", 500, error.message);
    }
  }

  // Update FAQ
  async updateFAQService(id: bigint, data: UpdateFAQDTO) {
    try {
      const existingFAQ = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!existingFAQ) {
        throw new CustomError("FAQ not found", 404, "Invalid FAQ ID");
      }

      const faq = await prisma.fAQ.update({
        where: { id },
        data,
      });

      return {
        message: "FAQ updated successfully",
        data: {
          ...faq,
          id: faq.id.toString(), 
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to update FAQ", 500, error.message);
    }
  }

  // Permanently delete FAQ
  async deleteFAQService(id: bigint) {
    try {
      const existingFAQ = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!existingFAQ) {
        throw new CustomError("FAQ not found", 404, "Invalid FAQ ID");
      }

      await prisma.fAQ.delete({
        where: { id },
      });

      return {
        message: "FAQ deleted permanently",
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to delete FAQ", 500, error.message);
    }
  }

  // Public landing page: active FAQs only
  async getActiveFAQsService() {
    try {
      const faqs = await prisma.fAQ.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          uuid: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      });

      return {
        message: "FAQs fetched successfully",
        data: faqs,
      };
    } catch (error: any) {
      throw new CustomError(
        "Failed to fetch landing page FAQs",
        500,
        error.message,
      );
    }
  }
}

export default new FAQServices();
