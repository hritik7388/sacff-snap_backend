// src/controllers/tradesManController.ts
import { Response } from "express";
import { Request } from "express";
import { tradesManServices } from "../services/tradesManServices";
import { tradesManRegisterSchema, tradesManLoginSchema, tradesManCraftSchema, updateProfileSchema, seacrchJobSchema, requestScaffOldSchema, updateScaffOldSRequestchema, jobApplicationSchema, searchScaffHold, deleteRequest, requestSacffHold, GetTradesManDetailsSchema, scaffHoldDetailsById, getrequestSacffHold, searchFilter, getAllQuestionnairesForTradesmanSchema, getQuestionnaireByIdSchema, getCurrentQuestionSchema, startQuizSchema, videoProgressSchema, submitAnswerSchema, } from "../schemas/tradesManSchema";
import { AuthenticatedRequest } from "../types/index";
import prisma from "../config/prismaClient";
const tradesMan = new tradesManServices();

export class tradesManController {

  async dashboard(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.dashboard(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async tradesManRegister(req: Request, res: Response, next: Function) {
    try {
      const data = tradesManRegisterSchema.parse(req.body);
      const user = await tradesMan.registerTradesManServices(data);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async tradesManLogin(req: Request, res: Response, next: Function) {
    try {
      const data = tradesManLoginSchema.parse(req.body);
      const user = await tradesMan.tradesmanloginServices(data);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

async getAllQuestionnairesForTradesman(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query = getAllQuestionnairesForTradesmanSchema.parse(
      req.query,
    );

    // Get the actual TradesMan profile ID using the authenticated user ID.
    const tradesman = await prisma.tradesMan.findUnique({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
      },
    });

    if (!tradesman) {
      return res.status(404).json({
        success: false,
        message: "Tradesman profile not found",
      });
    }

    const result =
      await tradesMan.getAllQuestionnairesForTradesmanServices(
        tradesman.id,
        query.filter,
        query.page,
        query.limit,
      );

    return res.status(200).json(result);
  } catch (err) {
    console.error("GET QUESTIONNAIRES ERROR:", err);
    next(err);
  }
}

async getQuestionnaireByIdForTradesman(
  req: Request,
  res: Response,
  next: Function,
) {
  try {
    const { id } = getQuestionnaireByIdSchema.parse(req.params);

    const result =
      await tradesMan.getQuestionnaireByIdForTradesmanServices(id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async saveVideoProgress(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    const userId = req.user?.id;

    const { id } = getQuestionnaireByIdSchema.parse(req.params);
    const { watchedPercent } = videoProgressSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const tradesman = await prisma.tradesMan.findUnique({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
      },
    });

    if (!tradesman) {
      return res.status(404).json({
        success: false,
        message: "Tradesman profile not found",
      });
    }

    // Correct order: tradesmanId, questionnaireId, watchedPercent
    const result = await tradesMan.saveVideoProgressService(
      tradesman.id,
      BigInt(id),
      watchedPercent,
    );

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


  // 2. Start Quiz
  async startQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: Function,
  ) {
    try {
      const { id } = startQuizSchema.parse(req.params);
      const tradesmanId = req.user?.id;

      if (!tradesmanId) {
        return res.status(401).json({
          success: false,
          message: "Tradesman authentication required",
        });
      }

      const result = await tradesMan.startQuizService(
        BigInt(id),
        BigInt(tradesmanId),
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  // 3. Get Current Question
  async getCurrentQuestion(
    req: AuthenticatedRequest,
    res: Response,
    next: Function,
  ) {
    try {
      const { attemptId } = getCurrentQuestionSchema.parse(req.params);
      const tradesmanId = req.user?.id;

      if (!tradesmanId) {
        return res.status(401).json({
          success: false,
          message: "Tradesman authentication required",
        });
      }

      const result = await tradesMan.getCurrentQuestionService(
        BigInt(attemptId),
        BigInt(tradesmanId),
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  // 4. Submit Answer
  async submitAnswer(
    req: AuthenticatedRequest,
    res: Response,
    next: Function,
  ) {
    try {
      const { attemptId } = getCurrentQuestionSchema.parse(req.params);
      const { selectedOptionId } = submitAnswerSchema.parse(req.body);
      const tradesmanId = req.user?.id;

      if (!tradesmanId) {
        return res.status(401).json({
          success: false,
          message: "Tradesman authentication required",
        });
      }

      const result = await tradesMan.submitAnswerService(
        BigInt(attemptId),
        BigInt(tradesmanId),
        selectedOptionId == null ? null : BigInt(selectedOptionId),
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  // 5. Get Certificates
 
async getCertificates(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Tradesman authentication required",
      });
    }

    const tradesman = await prisma.tradesMan.findFirst({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
      },
    });

    if (!tradesman) {
      return res.status(404).json({
        success: false,
        message: "Tradesman not found",
      });
    }

    const result = await tradesMan.getCertificatesService(
      tradesman.id,
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}


async getCertificateById(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    const userId = req.user?.id;
    const { certificateId } = req.params;

    if (typeof certificateId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate ID",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Tradesman authentication required",
      });
    }

    
    const tradesman = await prisma.tradesMan.findFirst({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
      },
    });

    if (!tradesman) {
      return res.status(404).json({
        success: false,
        message: "Tradesman not found",
      });
    }

    const result = await tradesMan.getCertificateByIdService(
      BigInt(certificateId),
      tradesman.id,
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
  async getTradesManDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.getTradesManDetails(id);

      res.status(200).json(result);

    } catch (err) {
      next(err);
    }

  }

  async getCraftManList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await tradesMan.getCraftListServices();

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTradesManCraftList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const craftName = tradesManCraftSchema.parse(req.query)

      const result = await tradesMan.getTradesManCraftListServices(craftName);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: Function) {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await tradesMan.updateTradesManProfile(data,);

      // Send response
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  }

 

  async requestScaffhold(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = requestScaffOldSchema.parse(req.body);
      const result = await tradesMan.requestProjectScaffHoldServices(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateScaffHoldRequestController(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = updateScaffOldSRequestchema.parse(req.body);
      const result = await tradesMan.updateProjectScaffHoldRequest(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTrademanRequestList(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const id= req.user!.id;
      const data = searchFilter.parse(req.query);
      const result = await tradesMan.getTrademanRequestListServices(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async joinProject(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = jobApplicationSchema.parse(req.body);
      const result = await tradesMan.joinProjectServices(id, data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }

  }

  async getJoinedScaffholds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const id = req.user!.id;
      const result = await tradesMan.getJoinedProjects(id, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async filterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchScaffHold.parse(req.query);
      const result = await tradesMan.filterProjects(data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteScaffHoldRequest(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const data = deleteRequest.parse(req.body);
      const result = await tradesMan.deleteProjectScaffHoldRequest(data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getScaffholdRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = requestSacffHold.parse(req.query);
      const result = await tradesMan.getRequestScaffHoldById(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getModifiedRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = getrequestSacffHold.parse(req.query);
      const result = await tradesMan.getModifiedRequestsByParentId(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
  async getAllModifiedRequestDetails(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id=req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.query);


      const result = await tradesMan.getAllModifiedRequestsByParentId(id,data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTradesManScaffHoldDetailsById(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const data = scaffHoldDetailsById.parse(req.query);
      const scaffHoldData = await tradesMan.getTradesManScaffHoldDetailsById(id, data);
      res.status(200).json(scaffHoldData);
    } catch (err) {
      next(err);
    }

  }


  async getSearchFilterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const data = searchFilter.parse(req.body);
      const result = await tradesMan.getProjectRequestFilterData(data, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }



async getFilterScaffHolds(req: AuthenticatedRequest, res: Response, next: Function) {
  try {
    const page = Number(req.body.page) || 1;
    const limit = Number(req.body.limit) || 10;

    // ✅ GET PROJECT ID FROM PARAMS (NOT USER)
  const projectId = Number(req.query.projectId);

   

    const data = searchFilter.parse(req.body);

    const result = await tradesMan.getFilteredProjectRequestsByProjectId(
      projectId,
      data,
      page,
      limit
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

  async delteTradesManAccount(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const id = req.user!.id;
      const result = await tradesMan.deleteTradesman(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }

  }
}