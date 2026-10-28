// src/controllers/tradesManController.ts
import { Response } from "express";
import { Request } from "express";
import { tradesManServices } from "../services/tradesManServices";
import { tradesManRegisterSchema, tradesManLoginSchema, tradesManCraftSchema, updateProfileSchema, seacrchJobSchema, requestScaffOldSchema, updateScaffOldSRequestchema, jobApplicationSchema, searchScaffHold, deleteRequest, requestSacffHold, GetTradesManDetailsSchema, scaffHoldDetailsById, getrequestSacffHold, searchFilter, getAllQuestionnairesForTradesmanSchema, getQuestionnaireByIdSchema, getCurrentQuestionSchema, startQuizSchema,   submitAllAnswersSchema, } from "../schemas/tradesManSchema";
import { AuthenticatedRequest } from "../types/index";
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
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

    // Resolve actual TradesMan ID from Bearer Token User ID
    const tradesman = await prisma.tradesMan.findUnique({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
        userId: true,
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
        tradesman.userId,
        query.filter,
        query.page,
        query.limit,
        query.search,
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
    const { id } = getQuestionnaireByIdSchema.parse(req.query);

    const result =
      await tradesMan.getQuestionnaireByIdForTradesmanServices(id);

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
      const { id } = startQuizSchema.parse(req.body);
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
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(
        "Unauthorized",
        401,
        "User not authenticated",
      );
    }

    // Read attemptId from query params
    const { attemptId } = getCurrentQuestionSchema.parse(req.query);

    // Verify TradesMan using User ID from Bearer Token
    const tradesman = await prisma.tradesMan.findUnique({
      where: {
        userId: BigInt(userId),
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!tradesman) {
      throw new CustomError(
        "Tradesman not found",
        404,
        "Tradesman profile does not exist",
      );
    }

    // Pass User ID because enrollment uses TradesMan.userId
    const result = await tradesMan.getCurrentQuestionService(
      attemptId,
      tradesman.userId,
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

  // 4. Submit Answer
async submitAnswer(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    // Validate complete request body
    const { attemptId, answers } =
      submitAllAnswersSchema.parse(req.body);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Tradesman authentication required",
      });
    }

  

    // Submit all answers together
    const result = await tradesMan.submitAllAnswersService(
      BigInt(attemptId),
      BigInt(userId),
      answers.map((answer) => ({
        questionId: BigInt(answer.questionId),
        selectedOptionId: BigInt(answer.selectedOptionId),
      })),
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
  const certificateId = req.query.certificateId;

    if (
      typeof certificateId !== "string" ||
      !/^[1-9]\d*$/.test(certificateId)
    ) {
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


async enrollQuestionnaire(
  req: AuthenticatedRequest,
  res: Response,
  next: Function,
) {
  try {
    // 1. Get User ID from Bearer Token
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 2. Get Questionnaire ID from request body
    const { questionnaireId } = req.body;

    if (
      questionnaireId === undefined ||
      questionnaireId === null ||
      !/^[1-9]\d*$/.test(String(questionnaireId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid questionnaireId is required",
      });
    }

    

    // 4. Enroll using actual TradesMan ID
    const result = await tradesMan.enrollQuestionnaireService( 
      BigInt(questionnaireId),  BigInt(userId),
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("ENROLL QUESTIONNAIRE ERROR:", error);
    next(error);
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