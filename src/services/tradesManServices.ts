// src/services/tradesManServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import {
  generateReadUrl,
  generateToken,
  pushNotificationDelhi,
  reqscaffHoldIdGenerator,
  scaffHoldIdGenerator,
} from "../helpers/utils";
import {
  RegisterTradesManDTO,
  LoginTradesManDTO,
  TradesManCraftDTO,
  UpadateProfileDTO,
  joinCraftTradesManDTO,
  GetTradesManDetailsDTO,
  seacrchJobDTO,
  requestScaffOldDTO,
  updateScaffOldSRequestchemaDTO,
  jobApplicationDTO,
  SearchScaffHoldDTO,
  scaffHoldIdDTO,
  requestSacffHoldDTO,
  ScaffHoldDetailsDTO,
  getparentSacffHoldDTO,
  SearchFilterDTO,
} from "../schemas/tradesManSchema";
import { MediaType, Priority, Prisma } from "@prisma/client";
import { create } from "domain";

type TradesmanQuestionnaireFilter = "ALL" | "INCOMPLETE" | "COMPLETED";

export class tradesManServices {
 


async getAllQuestionnairesForTradesmanServices(
  tradesmanId: bigint,
  filter: TradesmanQuestionnaireFilter = "ALL",
  page: number = 1,
  limit: number = 10,
  search?: string,
) {
  try {
    page = Number(page);
    limit = Number(limit);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      throw new CustomError(
        "Invalid pagination",
        400,
        "Page must be >= 1 and limit must be between 1 and 100",
      );
    }

    if (!["ALL", "INCOMPLETE", "COMPLETED"].includes(filter)) {
      throw new CustomError(
        "Invalid filter",
        400,
        "Filter must be ALL, INCOMPLETE, or COMPLETED",
      );
    }

    // 1. Fetch ALL ACTIVE questionnaires
    // Enrollment filtering is done below for this Tradesman.
    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        status: "ACTIVE",
      },

      select: {
        id: true,
        uuid: true,
        testName: true,
        description: true,
        videoUrl: true,
        certificateTemplateUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            questions: true,
          },
        },

        attempts: {
          where: {
            tradesmanId,
          },
          orderBy: [
            { startedAt: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
          select: {
            id: true,
            uuid: true,
            status: true,
            totalQuestions: true,
            correctAnswers: true,
            wrongAnswerCount: true,
            score: true,
            currentQuestion: true,
            startedAt: true,
            completedAt: true,
            updatedAt: true,
          },
        },

        enrollments: {
          where: {
            tradesmanId,
          },
          select: {
            id: true,
            isEnrolled: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Map questionnaires with enrollment status
    const mappedQuestionnaires = await Promise.all(
      questionnaires.map(async (quiz) => {
        const latestAttempt = quiz.attempts[0] ?? null;

        const isEnrolled = quiz.enrollments.some(
          (enrollment) => enrollment.isEnrolled,
        );

        const isCompleted =
          latestAttempt?.status === "PASSED" ||
          latestAttempt?.status === "FAILED";

        const questionnaireProgress = isCompleted
          ? "COMPLETED"
          : isEnrolled
            ? "INCOMPLETE"
            : "NOT_STARTED";

        const videoUrl = quiz.videoUrl
          ? await generateReadUrl(quiz.videoUrl)
          : null;

        return {
          id: quiz.id.toString(),
          uuid: quiz.uuid,
          testName: quiz.testName,
          description: quiz.description,

          videoKey: quiz.videoUrl,
          videoUrl,

          certificateTemplateUrl:
            quiz.certificateTemplateUrl,

          status: quiz.status,

          totalQuestions: quiz._count.questions,

          isEnrolled,

          questionnaireProgress,

          attempt: latestAttempt
            ? {
                id: latestAttempt.id.toString(),
                uuid: latestAttempt.uuid,
                status: latestAttempt.status,
                totalQuestions: latestAttempt.totalQuestions,
                correctAnswers: latestAttempt.correctAnswers,
                wrongAnswerCount:
                  latestAttempt.wrongAnswerCount,
                score: latestAttempt.score,
                currentQuestion:
                  latestAttempt.currentQuestion,
                startedAt: latestAttempt.startedAt,
                completedAt: latestAttempt.completedAt,
                updatedAt: latestAttempt.updatedAt,
              }
            : null,

          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
        };
      }),
    );

    // 3. Apply ALL / INCOMPLETE / COMPLETED filters
    const searchTerm = search?.trim().toLowerCase();

    const filteredQuestionnaires = mappedQuestionnaires.filter(
      (quiz) => {
        let matchesFilter = false;

        switch (filter) {
          case "ALL":
            // Only questionnaires never enrolled by this
            // Tradesman or not currently enrolled.
            matchesFilter = !quiz.isEnrolled;
            break;

          case "INCOMPLETE":
            matchesFilter =
              quiz.isEnrolled &&
              quiz.questionnaireProgress !== "COMPLETED";
            break;

          case "COMPLETED":
            matchesFilter =
              quiz.questionnaireProgress === "COMPLETED";
            break;
        }

        const matchesSearch =
          !searchTerm ||
          quiz.testName.toLowerCase().includes(searchTerm);

        return matchesFilter && matchesSearch;
      },
    );

    // 4. RECENT:
    // Always the latest 3 INCOMPLETE questionnaires,
    // regardless of selected filter.
    const recent = mappedQuestionnaires
      .filter(
        (quiz) =>
          quiz.isEnrolled &&
          quiz.questionnaireProgress === "INCOMPLETE",
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      )
      .slice(0, 3);

    // 5. Pagination
    const total = filteredQuestionnaires.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const data = filteredQuestionnaires.slice(
      skip,
      skip + limit,
    );

    // 6. Debug: identify why ALL may be empty
    console.log("FILTER:", filter);
    console.log("TRADESMAN ID:", tradesmanId.toString());
    console.log("ACTIVE QUESTIONNAIRES:", questionnaires.length);
    console.log("FILTERED RECORDS:", total);
    console.log("RECENT RECORDS:", recent.length);
    console.log("PAGE:", page);

    console.log(
      "QUESTIONNAIRE ENROLLMENT DEBUG:",
      mappedQuestionnaires.map((quiz) => ({
        id: quiz.id,
        testName: quiz.testName,
        isEnrolled: quiz.isEnrolled,
        progress: quiz.questionnaireProgress,
      })),
    );

    // 7. Final response
    return {
      success: true,
      message: "Questionnaires fetched successfully",
      data,
      recent,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    throw new CustomError(
      "Failed to fetch questionnaires",
      500,
      error instanceof Error
        ? error.message
        : "Unknown error",
    );
  }
}


  async getQuestionnaireByIdForTradesmanServices(id: bigint) {
    try {
      const questionnaire = await prisma.questionnaire.findUnique({
        where: { id },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });

      if (!questionnaire) {
        throw new CustomError(
          "Questionnaire not found",
          404,
          "No questionnaire found with this ID",
        );
      }

      // Check whether this questionnaire has been enrolled
      const enrollmentCount = await prisma.questionnaireEnrollment.count({
        where: {
          questionnaireId: id,
        },
      });

      const videoUrl = questionnaire.videoUrl
        ? await generateReadUrl(questionnaire.videoUrl)
        : null;

      return {
        message: "Questionnaire fetched successfully",
        data: {
          ...questionnaire,
          id: questionnaire.id.toString(),
          videoKey: questionnaire.videoUrl,
          videoUrl,
          questionsCount: questionnaire._count.questions,
          isEnrolled: enrollmentCount > 0,
          enrollmentStatus: enrollmentCount > 0 ? "ENROLLED" : "NOT_ENROLLED",
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to fetch questionnaire",
        500,
        error.message,
      );
    }
  }

  async startQuizService(questionnaireId: bigint, tradesmanId: bigint) {
    try {
      // 1. Get actual Tradesman profile ID
      // tradesmanId parameter is authenticated User ID
      const tradesman = await prisma.tradesMan.findUnique({
        where: {
          userId: tradesmanId,
        },
        select: {
          id: true,
        },
      });

      if (!tradesman) {
        throw new CustomError(
          "Tradesman not found",
          404,
          "Tradesman profile does not exist",
        );
      }

      const actualTradesmanId = tradesman.id;

      // 2. Validate questionnaire
      const questionnaire = await prisma.questionnaire.findFirst({
        where: {
          id: questionnaireId,
          status: "ACTIVE",
        },
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });

      if (!questionnaire) {
        throw new CustomError(
          "Questionnaire not found",
          404,
          "Questionnaire does not exist or is not active",
        );
      }

      if (questionnaire._count.questions === 0) {
        throw new CustomError(
          "No questions available",
          400,
          "Quiz has no questions",
        );
      }

      // 3. Check enrollment
      const enrollment = await prisma.questionnaireEnrollment.findUnique({
        where: {
          tradesmanId_questionnaireId: {
            tradesmanId: actualTradesmanId,
            questionnaireId,
          },
        },
      });

      if (!enrollment) {
        throw new CustomError(
          "Questionnaire not enrolled",
          400,
          "Please enroll in the questionnaire before starting the quiz",
        );
      }

      // 4. Get previous attempt
      const previousAttempt = await prisma.quizAttempt.findFirst({
        where: {
          questionnaireId,
          tradesmanId: actualTradesmanId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // 5. Resume existing attempt
      if (previousAttempt?.status === "IN_PROGRESS") {
        return {
          message: "Existing quiz attempt resumed",
          data: {
            attemptId: previousAttempt.id.toString(),
            currentQuestion: previousAttempt.currentQuestion + 1,
            totalQuestions: previousAttempt.totalQuestions,
            status: previousAttempt.status,
          },
        };
      }

      // 6. Allow retry after REWATCH_REQUIRED
      // VideoProgress table has been removed,
      // so video rewatch completion cannot be verified here.

      // 7. Prevent restarting completed quiz
      if (
        previousAttempt?.status === "PASSED" ||
        previousAttempt?.status === "FAILED"
      ) {
        throw new CustomError(
          "Quiz already completed",
          400,
          "This questionnaire already has a completed attempt",
        );
      }

      // 8. Fetch first question
      const firstQuestion = await prisma.question.findFirst({
        where: {
          questionnaireId,
        },
        orderBy: {
          sortOrder: "asc",
        },
      });

      if (!firstQuestion) {
        throw new CustomError(
          "No questions available",
          400,
          "Quiz has no questions",
        );
      }

      // 9. Create new attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          uuid: uuidv4(),
          questionnaireId,
          tradesmanId: actualTradesmanId,
          status: "IN_PROGRESS",
          totalQuestions: questionnaire._count.questions,
          currentQuestion: firstQuestion.sortOrder,
          currentQuestionStartedAt: new Date(),
        },
      });

      // 10. Return response
      return {
        message: "Quiz started successfully",
        data: {
          attemptId: attempt.id.toString(),
          currentQuestion: 1,
          totalQuestions: attempt.totalQuestions,
          status: attempt.status,
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError("Failed to start quiz", 500, error.message);
    }
  }

async getCurrentQuestionService(
  attemptId: bigint,
  tradesmanId: bigint
) {
  try {
    // attemptId parameter now contains Enrollment ID
 const enrollment = await prisma.questionnaireEnrollment.findFirst({
  where: {
    questionnaireId: attemptId,
    tradesmanId,
    isEnrolled: true,
  },
  select: {
    questionnaireId: true,
  },
});
    if (!enrollment) {
      throw new CustomError(
        "Quiz attempt not found",
        404,
        "Invalid attempt ID"
      );
    }

    // Fetch questionnaire details
    const questionnaire = await prisma.questionnaire.findUnique({
      where: {
        id: enrollment.questionnaireId,
      },
      select: {
        id: true,
        testName: true,
        description: true,
      },
    });

    if (!questionnaire) {
      throw new CustomError(
        "Questionnaire not found",
        404,
        "Questionnaire does not exist"
      );
    }

    // Fetch ALL questions with their options
    const questions = await prisma.question.findMany({
      where: {
        questionnaireId: enrollment.questionnaireId,
      },
      include: {
        options: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    if (questions.length === 0) {
      throw new CustomError(
        "Questions not found",
        404,
        "No questions available for this questionnaire"
      );
    }

    // Get latest quiz attempt if available
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        questionnaireId: enrollment.questionnaireId,
        tradesmanId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const currentQuestion = attempt
      ? questions.find(
          (question) =>
            question.sortOrder === attempt.currentQuestion
        )
      : questions[0];

    const startedAt = attempt
      ? attempt.currentQuestionStartedAt ?? attempt.startedAt
      : null;

    const elapsedSeconds = startedAt
      ? Math.floor(
          (Date.now() - startedAt.getTime()) / 1000
        )
      : 0;

    return {
      message: "Current question fetched successfully",
      data: {
        attemptId: attemptId.toString(),

        questionnaire: {
          ...questionnaire,
          id: questionnaire.id.toString(),
        },

        // Return ALL questions in a single array
        questions: questions.map((question) => ({
          id: question.id.toString(),
          questionnaireId: question.questionnaireId.toString(),
          questionText: question.questionText,
          sortOrder: question.sortOrder,
          timeLimitSeconds: question.timeLimitSeconds,
          createdAt: question.createdAt.toISOString(),
          updatedAt: question.updatedAt.toISOString(),

          options: question.options.map((option) => ({
            id: option.id.toString(),
            questionId: option.questionId.toString(),
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            createdAt: option.createdAt.toISOString(),
          })),
        })),

        currentQuestion: attempt
          ? attempt.currentQuestion + 1
          : 1,

        totalQuestions: questions.length,

        remainingSeconds: currentQuestion
          ? Math.max(
              0,
              currentQuestion.timeLimitSeconds - elapsedSeconds
            )
          : 0,
      },
    };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;

    throw new CustomError(
      "Failed to fetch current questions",
      500,
      error.message
    );
  }
}



async submitAllAnswersService(
  attemptId: bigint,
  userId: bigint,
  answers: {
    questionId: bigint;
    selectedOptionId: bigint;
  }[],
) {
  try {
    // Bearer token contains User table ID
    const tradesman = await prisma.tradesMan.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!tradesman) {
      throw new CustomError(
        "Tradesman not found",
        404,
        "Tradesman profile does not exist",
      );
    }

    const tradesmanId = tradesman.id;

    // Same as getCurrentQuestionService:
    // attemptId parameter now contains Questionnaire ID
    const questionnaireId = attemptId;

    return await prisma.$transaction(
      async (tx) => {
        // 1. Verify enrollment
        const enrollment =
          await tx.questionnaireEnrollment.findFirst({
            where: {
              questionnaireId,
              tradesmanId,
              isEnrolled: true,
            },
            select: {
              id: true,
              questionnaireId: true,
            },
          });

        if (!enrollment) {
          throw new CustomError(
            "Quiz attempt not found",
            404,
            "Invalid attempt ID",
          );
        }

        // 2. Fetch all questions
        const questions = await tx.question.findMany({
          where: {
            questionnaireId: enrollment.questionnaireId,
          },
          include: {
            options: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        });

        if (questions.length === 0) {
          throw new CustomError(
            "Questions not found",
            404,
            "No questions available",
          );
        }

        // 3. All questions must be answered
        if (!Array.isArray(answers) ||
            answers.length !== questions.length) {
          throw new CustomError(
            "Incomplete answers",
            400,
            `All ${questions.length} questions must be answered`,
          );
        }

        const answerMap = new Map(
          answers.map((answer) => [
            answer.questionId.toString(),
            answer.selectedOptionId,
          ]),
        );

        if (answerMap.size !== answers.length) {
          throw new CustomError(
            "Duplicate questions",
            400,
            "Each question must be answered only once",
          );
        }

        // 4. Fetch latest attempt for this questionnaire
        const latestAttempt = await tx.quizAttempt.findFirst({
          where: {
            questionnaireId,
            tradesmanId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Preserve completed/re-watch states
        if (
          latestAttempt &&
          latestAttempt.status !== "IN_PROGRESS" &&
          latestAttempt.status !== "REWATCH_REQUIRED"
        ) {
          throw new CustomError(
            "Quiz is not in progress",
            400,
            latestAttempt.status,
          );
        }

        if (latestAttempt?.status === "REWATCH_REQUIRED") {
          throw new CustomError(
            "Video rewatch required",
            400,
            "Rewatch the video before retrying the quiz",
          );
        }

        // 5. StartQuiz API removed:
        // Create attempt automatically if none exists
        const attempt = latestAttempt ??
          await tx.quizAttempt.create({
            data: {
              uuid: uuidv4(),
              questionnaireId,
              tradesmanId,
              status: "IN_PROGRESS",
              totalQuestions: questions.length,
              correctAnswers: 0,
              wrongAnswerCount: 0,
              score: 0,
              currentQuestion: questions[0].sortOrder,
              currentQuestionStartedAt: new Date(),
            },
          });

        if (attempt.status !== "IN_PROGRESS") {
          throw new CustomError(
            "Quiz is not in progress",
            400,
            attempt.status,
          );
        }

        // 6. Check previously submitted answers
        const existingAnswers = await tx.quizAnswer.count({
          where: {
            attemptId: attempt.id,
          },
        });

        if (existingAnswers > 0) {
          throw new CustomError(
            "Answers already submitted",
            409,
            "This attempt already has submitted answers",
          );
        }

        let wrongAnswerCount = attempt.wrongAnswerCount;
        let correctAnswers = attempt.correctAnswers;

        const answerResults: {
          questionId: string;
          selectedOptionId: string;
          isCorrect: boolean;
        }[] = [];

        // 7. Validate and save all answers
        for (const question of questions) {
          const selectedOptionId = answerMap.get(
            question.id.toString(),
          );

          if (selectedOptionId === undefined) {
            throw new CustomError(
              "Missing answer",
              400,
              `Answer missing for question ${question.id}`,
            );
          }

          const selectedOption = question.options.find(
            (option) => option.id === selectedOptionId,
          );

          if (!selectedOption) {
            throw new CustomError(
              "Invalid option",
              400,
              `Invalid option for question ${question.id}`,
            );
          }

          // Backend determines correctness
          const isCorrect = selectedOption.isCorrect === true;

          if (isCorrect) {
            correctAnswers++;
          } else {
            wrongAnswerCount++;
          }

          await tx.quizAnswer.create({
            data: {
              attemptId: attempt.id,
              questionId: question.id,
              selectedOptionId,
              isCorrect,
              wasTimedOut: false,
            },
          });

          answerResults.push({
            questionId: question.id.toString(),
            selectedOptionId: selectedOptionId.toString(),
            isCorrect,
          });
        }

        // 8. Two wrong answers require video rewatch
        if (wrongAnswerCount >= 2) {
          await tx.quizAttempt.update({
            where: {
              id: attempt.id,
            },
            data: {
              wrongAnswerCount,
              correctAnswers,
              status: "REWATCH_REQUIRED",
            },
          });

          return {
            message:
              "Two wrong answers recorded. Rewatch the video to retry.",
            data: {
              status: "REWATCH_REQUIRED",
              correctAnswers,
              wrongAnswerCount,
              totalQuestions: attempt.totalQuestions,
              answers: answerResults,
            },
          };
        }

        // 9. Calculate score
        const totalQuestions = attempt.totalQuestions;

        const score =
          totalQuestions > 0
            ? Number(
                (
                  (correctAnswers / totalQuestions) *
                  100
                ).toFixed(2),
              )
            : 0;

        const passingScore = 70;

        const status =
          score >= passingScore ? "PASSED" : "FAILED";

        // 10. Complete attempt
        const completedAttempt = await tx.quizAttempt.update({
          where: {
            id: attempt.id,
          },
          data: {
            wrongAnswerCount,
            correctAnswers,
            currentQuestion:
              questions[questions.length - 1].sortOrder,
            score,
            status,
            completedAt: new Date(),
          },
        });

        // 11. Generate certificate record if passed
        let certificate = null;

        if (status === "PASSED") {
          certificate = await tx.certificate.create({
            data: {
              uuid: uuidv4(),
              certificateNo: `CERT-${uuidv4()}`,
              attemptId: attempt.id,
              questionnaireId: attempt.questionnaireId,
              tradesmanId,
            },
          });
        }

        // 12. Existing response unchanged
        return {
          message:
            status === "PASSED"
              ? "Quiz passed and certificate record created"
              : "Quiz completed but failed",
          data: {
            status: completedAttempt.status,
            score: completedAttempt.score,
            correctAnswers,
            wrongAnswerCount,
            totalQuestions,
            answers: answerResults,
            certificate: certificate
              ? {
                  id: certificate.id.toString(),
                  certificateNo: certificate.certificateNo,
                  certificateUrl: certificate.certificateUrl,
                  issuedAt: certificate.issuedAt,
                }
              : null,
          },
        };
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );
  } catch (error: any) {
    if (error instanceof CustomError) throw error;

    if (error.code === "P2002") {
      throw new CustomError(
        "Question already answered",
        409,
        "An answer has already been submitted",
      );
    }

    throw new CustomError(
      "Failed to submit answers",
      500,
      error.message,
    );
  }
}



  async getCertificatesService(tradesmanId: bigint) {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { tradesmanId },
        include: {
          questionnaire: {
            select: {
              id: true,
              testName: true,
              certificateTemplateUrl: true,
            },
          },
          attempt: {
            select: {
              score: true,
              correctAnswers: true,
              totalQuestions: true,
              completedAt: true,
              status: true,
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      });

      return {
        message: "Certificates fetched successfully",
        data: certificates.map((certificate) => ({
          id: certificate.id.toString(),
          uuid: certificate.uuid,
          certificateNo: certificate.certificateNo,
          certificateUrl: certificate.certificateUrl,
          issuedAt: certificate.issuedAt,
          questionnaire: {
            ...certificate.questionnaire,
            id: certificate.questionnaire.id.toString(),
          },
          quizResult: certificate.attempt,
        })),
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to fetch certificates", 500, error.message);
    }
  }

  async enrollQuestionnaireService(
    questionnaireId: bigint,
    tradesmanId: bigint,
  ) {
    try {
      // 1. Validate questionnaire and tradesman
      const [questionnaire, tradesman] = await Promise.all([
        prisma.questionnaire.findFirst({
          where: {
            id: questionnaireId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            uuid: true,
            testName: true,
          },
        }),

        prisma.tradesMan.findUnique({
          where: {
            id: tradesmanId,
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!questionnaire) {
        throw new CustomError(
          "Questionnaire not found",
          404,
          "Questionnaire does not exist or is not active",
        );
      }

      if (!tradesman) {
        throw new CustomError(
          "Tradesman not found",
          404,
          "Tradesman does not exist",
        );
      }

      // 2. Create or update enrollment
      const enrollment = await prisma.questionnaireEnrollment.upsert({
        where: {
          tradesmanId_questionnaireId: {
            tradesmanId,
            questionnaireId,
          },
        },

        create: {
          uuid: uuidv4(),
          tradesmanId,
          questionnaireId,
          isEnrolled: true,
        },

        update: {
          isEnrolled: true,
        },

        select: {
          id: true,
          uuid: true,
          questionnaireId: true,
          tradesmanId: true,
          isEnrolled: true,
          enrolledAt: true,
        },
      });

      // 3. Fetch complete questionnaire details
      const fullQuestionnaire = await prisma.questionnaire.findUnique({
        where: {
          id: questionnaireId,
        },

        include: {
          questions: {
            orderBy: {
              sortOrder: "asc",
            },

            include: {
              options: true,
            },
          },

          _count: {
            select: {
              questions: true,
            },
          },

          attempts: {
            where: {
              tradesmanId,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              uuid: true,
              status: true,
              score: true,
              totalQuestions: true,
              correctAnswers: true,
              currentQuestion: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!fullQuestionnaire) {
        throw new CustomError(
          "Questionnaire not found",
          404,
          "Questionnaire could not be fetched",
        );
      }

      // 4. Generate video URL from stored S3 key
      const videoKey = fullQuestionnaire.videoUrl;

      const videoUrl = videoKey ? await generateReadUrl(videoKey) : null;

      // 5. Get latest attempt
      const latestAttempt = fullQuestionnaire.attempts[0] ?? null;

      // 6. Remove internal fields
      const {
        attempts,
        questions,
        _count,
        videoUrl: storedVideoUrl,
        ...questionnaireData
      } = fullQuestionnaire;

      // 7. Return complete response
      return {
        success: true,
        message: "Questionnaire enrolled successfully",

        data: {
          ...questionnaireData,

          id: fullQuestionnaire.id.toString(),

          videoKey,
          videoUrl,

          questionsCount: _count.questions,

          questions: questions.map((question: any) => ({
            ...question,

            id: question.id.toString(),
            questionnaireId: question.questionnaireId.toString(),

            options: question.options.map((option: any) => ({
              ...option,

              id: option.id.toString(),
              questionId: option.questionId.toString(),
            })),
          })),

          // Enrollment details
          enrollment: {
            id: enrollment.id.toString(),
            uuid: enrollment.uuid,
            questionnaireId: enrollment.questionnaireId.toString(),
            tradesmanId: enrollment.tradesmanId.toString(),
            isEnrolled: enrollment.isEnrolled,
            enrolledAt: enrollment.enrolledAt,
          },

          isEnrolled: enrollment.isEnrolled,

          // Latest quiz attempt
          latestAttempt: latestAttempt
            ? {
                ...latestAttempt,
                id: latestAttempt.id.toString(),
              }
            : null,
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to enroll questionnaire",
        500,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  async getCertificateByIdService(certificateId: bigint, tradesmanId: bigint) {
    try {
      const certificate = await prisma.certificate.findFirst({
        where: {
          id: certificateId,
          tradesmanId,
          attempt: {
            status: "PASSED",
          },
        },
        include: {
          questionnaire: {
            select: {
              id: true,
              testName: true,
              certificateTemplateUrl: true,
            },
          },
          attempt: {
            select: {
              score: true,
              correctAnswers: true,
              totalQuestions: true,
              completedAt: true,
              status: true,
            },
          },
        },
      });

      if (!certificate) {
        throw new CustomError(
          "Certificate not found",
          404,
          "Certificate does not exist or does not belong to this tradesman",
        );
      }

      return {
        message: "Certificate fetched successfully",
        data: {
          id: certificate.id.toString(),
          uuid: certificate.uuid,
          certificateNo: certificate.certificateNo,
          certificateUrl: certificate.certificateUrl,
          issuedAt: certificate.issuedAt,
          questionnaire: {
            ...certificate.questionnaire,
            id: certificate.questionnaire.id.toString(),
          },
          quizResult: certificate.attempt,
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to fetch certificate", 500, error.message);
    }
  }

  async dashboard(userId: number) {
    try {
      const tradesman = await prisma.tradesMan.findUnique({
        where: { userId },
      });

      if (!tradesman) {
        throw new CustomError(
          RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND,
          404,
          "Tradesman not found",
        );
      }
      const [joinedScaffCount, requestCount] = await Promise.all([
        prisma.tradesManOnProject.count({
          where: { tradesManId: tradesman.id },
        }),
        prisma.projectScaffholdRequest.count({
          where: { createdById: tradesman.id },
        }),
      ]);
      return {
        message: RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_SUCCESS,
        data: {
          tradesmanId: tradesman.id,
          totalJoinedScaffholds: joinedScaffCount,
          totalRequestsMade: requestCount,
        },
      };
    } catch (error: any) {
      console.error("❗ Error in dashboard:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_FAILED,
            500,
            error.message,
          );
    }
  }

  async registerTradesManServices(data: RegisterTradesManDTO) {
    try {
      const existingTradesMan = await prisma.user.findFirst({
        where: { email: data.email, isDeleted: false, status: "ACTIVE" },
      });
      if (existingTradesMan) {
        throw new CustomError(
          RESPONSE_MESSAGES.TRADESMAN.ALREADY_EXISTS,
          500,
          "TradesMan with this email already exists",
        );
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const createtradesMan = await prisma.user.create({
        data: {
          uuid: uuidv4(),
          name: data.name,
          email: data.email,
          mobileNumber: data.mobileNumber,
          countryCode: data.countryCode,
          password: hashedPassword,
          user_type: "TRADESMAN",
          status: "ACTIVE",
          isDeleted: false,
        },
      });
      const craftData = await prisma.craft.findFirst({
        where: {
          name: data.craft,
        },
      });
      const tradeData = await prisma.tradesMan.create({
        data: {
          uuid: createtradesMan.uuid,
          userId: createtradesMan.id,
          craftId: craftData ? craftData.id : null,
          craft: data.craft,
          experience: data.experience,
          address: data.address,
          longitude: data.longitude,
          latitude: data.latitude,
        },
      });
      if (data.idProofImage) {
        await prisma.userMedia.create({
          data: {
            userId: createtradesMan.id,
            mediaType: "ID_PROOF_IMAGE",
            url: data.idProofImage,
          },
        });
      }
      const tradesManData = {
        name: createtradesMan.name,
        email: createtradesMan.email,
        mobileNumber: createtradesMan.mobileNumber,
        craft: tradeData.craft,
        experience: tradeData.experience,
        user_type: createtradesMan.user_type,
        status: createtradesMan.status,
        isDeleted: createtradesMan.isDeleted,
        address: tradeData.address,
        countryCode: createtradesMan.countryCode,
        idProofImage: data.idProofImage,
        longitude: tradeData.longitude,
        latitude: tradeData.latitude,
      };

      return {
        message: RESPONSE_MESSAGES.TRADESMAN.REGISTER_SUCCESS,
        data: tradesManData,
      };
    } catch (error: any) {
      console.error("❌ Register error:", error);

      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.TRADESMAN.REGISTER_FAILED,
            500,
            error.message,
          );
    }
  }

  async tradesmanloginServices(data: LoginTradesManDTO) {
    try {
      // ✅ STEP 1: USER FIND
      const user = await prisma.user.findFirst({
        where: {
          email: data.email,
          isDeleted: false,
          status: "ACTIVE",
          isVerified: true,
        },
        include: {
          tradesman: true,
        },
      });

      if (!user) {
        throw new CustomError("Tradesman not found", 404);
      }

      // ✅ STEP 2: PASSWORD CHECK
      const isPasswordValid =
        user.password && (await bcrypt.compare(data.password, user.password));

      if (!isPasswordValid) {
        throw new CustomError("Invalid password", 400);
      }

      // ✅ STEP 3: ROLE CHECK
      if (user.user_type !== "TRADESMAN") {
        throw new CustomError("Unauthorized", 403);
      }

      // ✅ STEP 4: TRADESMAN CHECK
      if (!user.tradesman) {
        throw new CustomError("Tradesman profile not found", 404);
      }

      const tradesman = user.tradesman;

      // ✅ STEP 5: PROJECT FIND
      const project = await prisma.project.findFirst({
        where: {
          PJT: data.PJT,
          isDeleted: false,
        },
        include: {
          projectManagers: true,
        },
      });

      if (!project) {
        throw new CustomError(
          "You dont have project to login or ProjectId is invalid",
          404,
        );
      }

      // ✅ STEP 6: EMPLOYER NAME VALIDATION
      if (!data.employerName) {
        throw new CustomError("Employer name is required", 400);
      }

      // ✅ CHECK IF TRADESMAN ALREADY JOINED THIS PROJECT
      const existingContext = await prisma.tradesmanProjectContext.findUnique({
        where: {
          tradesmanId_projectId: {
            tradesmanId: tradesman.id,
            projectId: project.id,
          },
        },
      });

      const isFirstTimeJoin = !existingContext;

      // ✅ STEP 7: UPSERT CONTEXT
      await prisma.tradesmanProjectContext.upsert({
        where: {
          tradesmanId_projectId: {
            tradesmanId: tradesman.id,
            projectId: project.id,
          },
        },
        update: {
          employerName: data.employerName,
        },
        create: {
          tradesmanId: tradesman.id,
          projectId: project.id,
          employerName: data.employerName,
        },
      });

      // ✅ SEND NOTIFICATION ONLY ON FIRST JOIN
      if (isFirstTimeJoin) {
        const projectManagerIds = project.projectManagers.map((pm) => pm.id);

        const message = `Tradesman ${user.name} (${tradesman.craft}) joined project ${project.projectName}`;

        for (const pmId of projectManagerIds) {
          await prisma.notification.create({
            data: {
              uuid: uuidv4(),
              title: "TRADESMAN JOINED PROJECT",
              message,
              type: "TRADESMAN_JOINED_PROJECT",
              role: "PROJECT_MANAGER",
              receiverId: BigInt(pmId),
              senderId: user.id.toString(),
              isRead: false,
              notificationImage:
                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/join.png",
              tradesmanCraft: tradesman.craft,
            },
          });
        }

        // ✅ PUSH NOTIFICATION
        const devices = await prisma.device.findMany({
          where: {
            userId: { in: projectManagerIds },
            user_type: "PROJECT_MANAGER",
            deviceToken: { not: null },
          },
        });

        await Promise.all(
          devices.map((d) =>
            d.deviceToken
              ? pushNotificationDelhi(
                  d.deviceToken,
                  "TRADESMAN JOINED PROJECT",
                  message,
                )
              : null,
          ),
        );
      }

      // ✅ STEP 8: TOKEN
      const jwtPayload = {
        login_id: user.email,
        id: user.id.toString(),
        uuid: user.uuid,
        user_type: user.user_type,
        userId: user.id,
        PJT: data.PJT,
      };

      const token = generateToken(jwtPayload);

      // ✅ STEP 9: UPDATE LAST LOGIN
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const userRes = {
        id: user.id.toString(),
        uuid: user.uuid,
        projectId: project.id,
        projectCode: project.PJT,
        employerName: data.employerName,
        user_type: user.user_type,
        craft: tradesman.craft,
      };

      // ✅ STEP 10: RESPONSE
      return {
        message: "Login successful",
        token,
        data: userRes,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError("Login failed", 500, error.message);
    }
  }
  async getTradesManDetails(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
        include: {
          userMedias: true,
          tradesman: {
            include: {
              craftInfo: true, // ✅ correct relation
              projectContexts: {
                include: {
                  project: {
                    select: {
                      id: true,
                      PJT: true,
                      projectName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new CustomError("USER_NOT_FOUND", 404, "User not found");
      }

      if (user.user_type !== "TRADESMAN") {
        throw new CustomError("INVALID_ROLE", 400, "User is not a tradesman");
      }

      const tradesman = user.tradesman;

      if (!tradesman) {
        throw new CustomError(
          "TRADESMAN_NOT_FOUND",
          404,
          "Tradesman profile not found",
        );
      }

      // ✅ Media extraction
      const idProofImage =
        user.userMedias.find((m) => m.mediaType === "ID_PROOF_IMAGE")?.url ||
        null;

      const photoImage =
        user.userMedias.find((m) => m.mediaType === "PHOTO_IMAGE")?.url || null;

      // ✅ Project + Employer Mapping
      const projectDetails = tradesman.projectContexts.map((ctx) => ({
        projectId: ctx.project.id,
        projectCode: ctx.project.PJT,
        projectName: ctx.project.projectName,
        employerName: ctx.employerName,
      }));

      return {
        message: "Tradesman details fetched successfully",
        data: {
          // 🔹 USER INFO
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          countryCode: user.countryCode,
          user_type: user.user_type,
          status: user.status,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,

          // 🔹 TRADESMAN INFO
          address: tradesman.address || null,
          craftId: tradesman.craftId || null,
          craftName: tradesman.craftInfo?.name || null,
          craftImage: tradesman.craftInfo?.craftImage || null,
          experience: tradesman.experience || null,
          latitude: tradesman.latitude || null,
          longitude: tradesman.longitude || null,

          // 🔹 MEDIA
          idProofImage,
          photoImage,

          // 🔥 NEW (IMPORTANT)
          projects: projectDetails, // employer per project
        },
      };
    } catch (error: any) {
      console.error("❌ Get tradesman details error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "FETCH_FAILED",
        500,
        error.message || "Something went wrong",
      );
    }
  }
  async getCraftListServices() {
    try {
      const craftData = await prisma.craft.findMany({
        select: {
          id: true,
          name: true,
          craftImage: true,
        },
      });

      return {
        message: RESPONSE_MESSAGES.TRADESMAN.FETCH_ALL_SUCCESS,
        data: craftData,
      };
    } catch (error: any) {
      console.error("❌ Fetch error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.TRADESMAN.FETCH_FAILED,
            500,
            error.message,
          );
    }
  }

  async getTradesManCraftListServices(
    data: TradesManCraftDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const searchTerm = data?.search?.trim() || "";

      // ✅ STEP 1: GET CRAFT
      const craftData = await prisma.craft.findFirst({
        where: { name: data.name },
        select: {
          id: true,
          name: true,
          craftImage: true,
        },
      });

      if (!craftData) {
        throw new CustomError("Craft not found", 404);
      }

      // ✅ STEP 2: GET TRADESMAN IDS FROM PROJECT
      const assigned = await prisma.tradesManOnProject.findMany({
        where: {
          projectId: data.scaffHoldId, // 🔥 use projectId instead
          project: {
            isDeleted: false,
          },
        },
        select: {
          tradesManId: true,
        },
      });

      const assignedIds = assigned.map((a) => a.tradesManId);

      if (assignedIds.length === 0) {
        return {
          message: "No tradesman found",
          craft: craftData,
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        };
      }

      // ✅ STEP 3: FILTER CONDITION
      const whereCondition: any = {
        id: { in: assignedIds },
        craft: craftData.name,
      };

      if (searchTerm) {
        whereCondition.user = {
          name: {
            contains: searchTerm,
          },
        };
      }

      // ✅ STEP 4: FETCH DATA
      const [tradeManData, totalCount] = await Promise.all([
        prisma.tradesMan.findMany({
          where: whereCondition,
          select: {
            id: true,
            uuid: true,
            userId: true,
            address: true,
            experience: true,
            latitude: true,
            longitude: true,
            craft: true,
            user: {
              select: {
                uuid: true,
                name: true,
                email: true,
                mobileNumber: true,
                countryCode: true,
                user_type: true,
                userMedias: {
                  select: {
                    id: true,
                    url: true,
                    mediaType: true,
                  },
                  take: 1,
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { id: "desc" },
        }),

        prisma.tradesMan.count({
          where: whereCondition,
        }),
      ]);

      // ✅ STEP 5: FORMAT
      const formattedTradesmen = tradeManData.map((tm) => ({
        id: tm.id,
        uuid: tm.uuid,
        userId: tm.userId,
        craft: tm.craft,
        address: tm.address,
        experience: tm.experience,
        latitude: tm.latitude,
        longitude: tm.longitude,
        name: tm.user?.name || null,
        email: tm.user?.email || null,
        mobileNumber: tm.user?.mobileNumber || null,
        countryCode: tm.user?.countryCode || null,
        user_type: tm.user?.user_type || null,
        image:
          tm.user?.userMedias?.length > 0 ? tm.user.userMedias[0].url : null,
      }));

      return {
        message: "Tradesman fetched successfully",
        craft: craftData,
        data: formattedTradesmen,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error: any) {
      console.error("❌ Fetch error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to fetch tradesman", 500, error.message);
    }
  }

  async updateTradesManProfile(data: UpadateProfileDTO) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: data.id,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });

      if (!user) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_FOUND,
          404,
          "User not found",
        );
      }
      const updatedUser = await prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          mobileNumber: data.mobileNumber,
          countryCode: data.countryCode,
        },
      });
      const existingTrade = await prisma.tradesMan.findUnique({
        where: { userId: data.id },
      });

      if (!existingTrade) {
        throw new CustomError(
          RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND,
          404,
          "TradesMan profile not found",
        );
      }
      const craftData = await prisma.craft.findFirst({
        where: {
          name: data.craft,
        },
      });
      const updatedTrade = await prisma.tradesMan.update({
        where: { userId: data.id },
        data: {
          craft: data.craft ?? existingTrade.craft,
          craftId: craftData ? craftData.id : null,
          experience: data.experience ?? existingTrade.experience,
          address: data.address ?? existingTrade.address,
          longitude: data.longitude ?? existingTrade.longitude,
          latitude: data.latitude ?? existingTrade.latitude,
        },
      });

      if (data.photoImage) {
        const existingMedia = await prisma.userMedia.findFirst({
          where: {
            userId: updatedUser.id,
            mediaType: "PHOTO_IMAGE",
          },
        });

        if (existingMedia) {
          await prisma.userMedia.update({
            where: { id: existingMedia.id },
            data: { url: data.photoImage },
          });
        } else {
          await prisma.userMedia.create({
            data: {
              userId: updatedUser.id,
              mediaType: "PHOTO_IMAGE",
              url: data.photoImage,
            },
          });
        }
      }

      // Prepare response
      const responseData = {
        id: updatedUser.id,
        uuid: updatedUser.uuid,
        name: updatedUser.name,
        email: user.email,
        mobileNumber: updatedUser.mobileNumber,
        craftId: updatedTrade.craftId,
        craft: updatedTrade.craft,
        experience: updatedTrade.experience,
        user_type: updatedUser.user_type,
        status: updatedUser.status,
        isDeleted: updatedUser.isDeleted,
        address: updatedTrade.address,
        countryCode: updatedUser.countryCode,
        longitude: updatedTrade.longitude,
        latitude: updatedTrade.latitude,
        photoImage: data.photoImage || null,
      };

      return {
        message: RESPONSE_MESSAGES.USER.PROFILE_UPDATED,
        data: responseData,
      };
    } catch (error: any) {
      console.error("❌ Update profile error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.TRADESMAN.UPDATE_FAILED,
            500,
            error.message,
          );
    }
  }

  async requestProjectScaffHoldServices(
    userId: number,
    data: requestScaffOldDTO,
  ) {
    try {
      // ✅ 1. AUTH CHECK
      const tradesManData = await prisma.user.findUnique({
        where: {
          id: userId,
          status: "ACTIVE",
          isDeleted: false,
          user_type: "TRADESMAN",
          isVerified: true,
        },
      });

      if (!tradesManData) {
        throw new CustomError("Unauthorized", 401);
      }

      // ✅ 2. GET PROJECT
      const projectData = await prisma.project.findUnique({
        where: {
          id: data.projectId,
          isDeleted: false,
        },
        include: {
          projectManagers: {
            select: { id: true },
          },
        },
      });

      if (!projectData) {
        throw new CustomError("Project not found", 404);
      }

      // ✅ 3. GET TRADESMAN PROFILE
      const existingTradesman = await prisma.tradesMan.findUnique({
        where: {
          userId: tradesManData.id,
        },
      });

      if (!existingTradesman) {
        throw new CustomError("Tradesman profile not found", 404);
      }

      // ✅ 4. GENERATE IDS
      const REQID = reqscaffHoldIdGenerator();
      const SCAFFID = scaffHoldIdGenerator();

      // ✅ 5. CREATE PROJECT REQUEST
      const newRequest = await prisma.projectScaffholdRequest.create({
        data: {
          uuid: uuidv4(),
          projectId: projectData.id,
          craft: existingTradesman.craft,
          length: data.length,
          width: data.width,
          height: data.height,
          priority: data.priority,
          REQID: REQID,
          SCAFFID: SCAFFID,
          expectedEndDate: data.expectedEndDate,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
          createdById: existingTradesman.id,
          status: "PENDING",
          fallProtection: false,
          handRail: false,
          midRail: false,
          toeBoard: false,
          platform: false,
          ladder: false,
        },
      });
      await prisma.tradesManOnProject.upsert({
        where: {
          projectId_tradesManId: {
            projectId: projectData.id,
            tradesManId: existingTradesman.id,
          },
        },
        update: {},
        create: {
          projectId: projectData.id,
          tradesManId: existingTradesman.id,
        },
      });
      await prisma.project.update({
        where: {
          id: projectData.id,
        },
        data: {
          status: "ONGOING",
        },
      });

      // ✅ 6. RESPONSE FORMAT
      const requestData = {
        id: newRequest.id,
        uuid: newRequest.uuid,
        projectId: newRequest.projectId,
        projectName: projectData.projectName,
        PJT: projectData.PJT,
        craft: existingTradesman.craft,
        length: newRequest.length,
        width: newRequest.width,
        height: newRequest.height,
        priority: newRequest.priority,
        SCAFFID: newRequest.SCAFFID,
        REQID: newRequest.REQID,
        expectedEndDate: newRequest.expectedEndDate,
        notes: newRequest.notes,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
        updatedAt: newRequest.updatedAt,
      };

      // ✅ 7. SEND NOTIFICATION TO PROJECT MANAGERS
      const pmUserIds = projectData.projectManagers.map((pm) => pm.id);

      const notificationMessage = `New  Scaffold request ${newRequest.REQID} has been received from  ${tradesManData.name} for ${requestData.SCAFFID}.`;

      if (pmUserIds.length > 0) {
        for (const pmId of pmUserIds) {
          await prisma.notification.create({
            data: {
              uuid: uuidv4(),
              title: "New  Scaffold Request",
              message: notificationMessage,
              type: "SCAFFHOLD_REQUEST",
              scaffoldRequestId: newRequest.id.toString(),
              role: "PROJECT_MANAGER",
              receiverId: pmId,
              senderId: userId.toString(),
              isRead: false,
              notificationImage:
                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestReg.png",
            },
          });
        }
      }

      // ✅ 8. PUSH NOTIFICATION (OPTIONAL)
      const devices = await prisma.device.findMany({
        where: {
          userId: { in: pmUserIds },
          deviceToken: { not: null },
        },
      });

      for (const d of devices) {
        if (!d.deviceToken) continue;

        await pushNotificationDelhi(
          d.deviceToken,
          "New Project Scaffold Request",
          notificationMessage,
        );
      }

      // ✅ FINAL RESPONSE
      return {
        message: "Project scaffold request created successfully",
        data: requestData,
      };
    } catch (error: any) {
      console.error("❗ Error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Project scaffold request failed",
        500,
        error.message,
      );
    }
  }

  async updateProjectScaffHoldRequest(
    userId: number,
    data: updateScaffOldSRequestchemaDTO,
  ) {
    try {
      // ✅ 1. Validate Tradesman
      const tradesManData = await prisma.tradesMan.findUnique({
        where: { userId: userId },
        include: {
          user: {
            select: {
              name: true,
              status: true,
              isDeleted: true,
              user_type: true,
            },
          },
        },
      });

      if (!tradesManData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_FOUND,
          404,
          "User not found",
        );
      }

      if (
        tradesManData.user.isDeleted ||
        tradesManData.user.status !== "ACTIVE"
      ) {
        throw new CustomError(
          RESPONSE_MESSAGES.TRADESMAN.INACTIVE_ACCOUNT,
          403,
          "You are not allowed to perform this action",
        );
      }

      // ✅ 2. Find Request
      const request = await prisma.projectScaffholdRequest.findUnique({
        where: {
          id: data.requestId,
        },
      });

      if (!request) {
        throw new CustomError(
          RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND,
          404,
          "Request not found",
        );
      }

      // ❗ IMPORTANT (as per your requirement):
      // ANY tradesman can update (remove ownership check)
      // 👉 if you want restriction, uncomment below:
      /*
            if (request.createdById !== tradesManData.id) {
              throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.INVALID_STATUS,
                403,
                "You are not authorized"
              );
            }
            */

      // ✅ 3. Update Request (versioning style)
      const updatedRequest = await prisma.projectScaffholdRequest.update({
        where: { id: request.id },
        data: {
          uuid: uuidv4(),
          projectId: request.projectId,
          craft: request.craft,
          REQID: request.REQID,
          createdById: request.createdById,
          status: "PENDING",
          length: data.length,
          width: data.width,
          height: data.height,
          priority: data.priority,
          expectedEndDate: data.expectedEndDate,
          startDate: data.startDate,
          endDate: data.endDate,
          description: data.description,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
          parentId: request.id, // versioning
        },
      });
      await prisma.tradesManOnProject.upsert({
        where: {
          projectId_tradesManId: {
            projectId: request.projectId,
            tradesManId: tradesManData.id,
          },
        },
        update: {},
        create: {
          projectId: request.projectId,
          tradesManId: tradesManData.id,
        },
      });
      // ✅ 4. Update Project (optional like scaffhold)
      await prisma.project.update({
        where: { id: request.projectId },
        data: {
          // optional: keep priority if needed
        },
      });

      // ✅ 5. Create HISTORY
      await prisma.updateProjectScaffHoldRequest.create({
        data: {
          requestId: updatedRequest.id,
          projectId: updatedRequest.projectId,
          length: updatedRequest.length,
          width: updatedRequest.width,
          height: updatedRequest.height,
          priority: data.priority as Priority | null,
          expectedEndDate: updatedRequest.expectedEndDate,
          notes: updatedRequest.notes,
        },
      });

      // ✅ 6. Get Project + PMs
      const projectData = await prisma.project.findUnique({
        where: { id: updatedRequest.projectId },
        include: {
          projectManagers: {
            select: { id: true },
          },
        },
      });

      // ✅ 7. Response
      const responseData = {
        id: updatedRequest.id,
        uuid: updatedRequest.uuid,
        projectId: updatedRequest.projectId,
        projectName: projectData?.projectName || null,
        PJT: projectData?.PJT || null,
        REQID: updatedRequest.REQID,
        craft: updatedRequest.craft,
        length: updatedRequest.length,
        width: updatedRequest.width,
        height: updatedRequest.height,
        priority: updatedRequest.priority,
        expectedEndDate: updatedRequest.expectedEndDate,
        notes: updatedRequest.notes,
        status: updatedRequest.status,
        createdAt: updatedRequest.createdAt,
        updatedAt: updatedRequest.updatedAt,
        parentId: updatedRequest.parentId,
      };

      // ✅ 8. Notifications (PM)
      const pmUserIds = projectData?.projectManagers?.map((pm) => pm.id) || [];

      const notificationMessage = `A modified  request ${updatedRequest.REQID} has been submited from  ${tradesManData.user.name}for ${request.SCAFFID}.`;

      if (pmUserIds.length > 0) {
        for (const pmId of pmUserIds) {
          const scaffoldIdToSend = updatedRequest.parentId
            ? updatedRequest.parentId
            : updatedRequest.id;

          await prisma.notification.create({
            data: {
              uuid: uuidv4(),
              title: "Modification Request",
              message: notificationMessage,
              type: "MODIFICATION_REQUEST",
              role: "PROJECT_MANAGER",
              scaffoldRequestId: String(scaffoldIdToSend),
              receiverId: pmId,
              senderId: userId.toString(),
              isRead: false,
              notificationImage:
                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/modifictaionReq.png",
            },
          });
        }
      }

      // ✅ 9. Push Notification
      const devices = await prisma.device.findMany({
        where: {
          userId: { in: pmUserIds },
          deviceToken: { not: null },
        },
      });
      console.log("devices=================>>>>", devices);

      for (const d of devices) {
        if (!d.deviceToken) continue;

        await pushNotificationDelhi(
          d.deviceToken,
          "Modified Scaffold Request",
          notificationMessage,
        );
      }

      return {
        message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
        data: responseData,
      };
    } catch (error: any) {
      console.error("❗ Error in updateProjectScaffHoldRequest:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_FAILED,
        500,
        error.message,
      );
    }
  }

  async getTrademanRequestListServices(
    userId: number,
    data: SearchScaffHoldDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // ✅ STEP 1: FIND TRADESMAN (FIXED)
      const tradesman = await prisma.tradesMan.findFirst({
        where: {
          userId: userId,
          user: {
            isDeleted: false,
            status: "ACTIVE",
            isVerified: true,
          },
        },
      });

      if (!tradesman) {
        throw new CustomError("Tradesman not found for this user", 404);
      }

      // ✅ STEP 2: WHERE CONDITION
      const whereCondition: any = {
        createdById: tradesman.id,
        parentId: null,
      };

      // ✅ STEP 3: SEARCH
      const searchTerm = data?.search?.trim();
      if (searchTerm) {
        if (!isNaN(Number(searchTerm))) {
          whereCondition.id = Number(searchTerm);
        } else {
          whereCondition.OR = [
            { REQID: { contains: searchTerm } },
            {
              project: {
                projectName: { contains: searchTerm },
              },
            },
            {
              project: {
                clientAddress: { contains: searchTerm },
              },
            },
            {
              createdBy: {
                user: {
                  name: { contains: searchTerm },
                },
              },
            },
          ];
        }
      }

      // ✅ STEP 4: FETCH DATA
      const [requests, totalCount] = await Promise.all([
        prisma.projectScaffholdRequest.findMany({
          where: {
            ...whereCondition,
            project: {
              isDeleted: false,
            },
          },
          include: {
            project: true,
            createdBy: {
              include: {
                user: {
                  select: {
                    name: true,
                    userMedias: {
                      take: 1,
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),

        prisma.projectScaffholdRequest.count({
          where: whereCondition,
        }),
      ]);

      // ✅ STEP 5: FORMAT
      const formattedData = requests.map((req) => ({
        id: req.id,
        uuid: req.uuid,
        projectId: req.projectId,
        SCAFFID: req.SCAFFID || null,
        projectName: req.project?.projectName || null,
        craft: req.createdBy?.craft || null,
        REQID: req.REQID,
        address: req.address || null,
        longitude: req.longitude || null,
        latitude: req.latitude || null,
        length: req.length,
        width: req.width,
        height: req.height,
        priority: req.priority,
        expectedEndDate: req.expectedEndDate,
        notes: req.notes,
        status: req.status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        createdById: req.createdById,
        createdByName: req.createdBy?.user?.name || null,
        createdByImage: req.createdBy?.user?.userMedias?.[0]?.url || null,
      }));

      return {
        message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
        data: formattedData,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error: any) {
      console.error("❗ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError(
        RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
        500,
        error.message,
      );
    }
  }

  async joinProjectServices(tradesManUserId: number, data: jobApplicationDTO) {
    try {
      // ✅ STEP 1: USER + TRADESMAN
      const user = await prisma.user.findFirst({
        where: {
          id: tradesManUserId,
          status: "ACTIVE",
          isDeleted: false,
          user_type: "TRADESMAN",
          isVerified: true,
        },
        include: {
          tradesman: true,
        },
      });

      if (!user || !user.tradesman) {
        throw new CustomError("Unauthorized", 401);
      }

      const tradesman = user.tradesman;

      if (!tradesman.craft) {
        throw new CustomError("Tradesman craft not specified", 400);
      }

      // ✅ STEP 2: PROJECT FETCH
      const project = await prisma.project.findFirst({
        where: {
          id: data.scaffHoldId,
          isDeleted: false,
        },
        include: {
          jobCrafts: {
            include: {
              craft: true,
            },
          },
          projectManagers: true,
        },
      });

      if (!project) {
        throw new CustomError("Project not found", 404);
      }

      // ✅ STEP 3: MATCH CRAFT
      const craftMatch = project.jobCrafts.find(
        (jc) =>
          jc.craft?.name?.toLowerCase() === tradesman.craft!.toLowerCase(),
      );

      if (!craftMatch) {
        throw new CustomError("Craft mismatch", 400);
      }

      if (craftMatch.joinedCount >= craftMatch.counts) {
        throw new CustomError("Vacancy full", 400);
      }

      // ✅ STEP 4: CHECK ALREADY JOINED
      const alreadyJoined = await prisma.tradesManOnProject.findUnique({
        where: {
          projectId_tradesManId: {
            projectId: project.id,
            tradesManId: tradesman.id,
          },
        },
      });

      if (alreadyJoined) {
        throw new CustomError("Already joined this project", 400);
      }

      // ✅ STEP 5: TRANSACTION
      await prisma.$transaction([
        prisma.tradesManOnProject.create({
          data: {
            projectId: project.id,
            tradesManId: tradesman.id,
          },
        }),

        prisma.jobCraftTradesman.create({
          data: {
            jobCraftId: craftMatch.id,
            tradesmanId: tradesman.id,
            projectJobCraftId: craftMatch.id,
          },
        }),

        prisma.projectJobCraft.update({
          where: { id: craftMatch.id },
          data: {
            joinedCount: { increment: 1 },
          },
        }),
      ]);

      // ✅ STEP 6: NOTIFICATION
      const projectManagerIds = project.projectManagers.map((pm) => pm.id);

      const message = `Tradesman ${user.name} (${tradesman.craft}) joined project ${project.projectName}`;

      for (const pmId of projectManagerIds) {
        await prisma.notification.create({
          data: {
            uuid: uuidv4(),
            title: "TRADESMAN JOINED PROJECT",
            message,
            type: "TRADESMAN_JOINED_PROJECT",
            role: "PROJECT_MANAGER",
            receiverId: BigInt(pmId),
            senderId: user.id.toString(),
            isRead: false,
            notificationImage:
              "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/join.png",
            tradesmanCraft: tradesman.craft,
          },
        });
      }

      // ✅ STEP 7: PUSH NOTIFICATION
      const devices = await prisma.device.findMany({
        where: {
          userId: { in: projectManagerIds },
          deviceToken: { not: null },
        },
      });

      await Promise.all(
        devices.map((d) =>
          d.deviceToken
            ? pushNotificationDelhi(
                d.deviceToken,
                "TRADESMAN JOINED PROJECT",
                message,
              )
            : null,
        ),
      );

      return {
        message: "Joined project successfully",
      };
    } catch (error: any) {
      console.error("❗ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError("Join project failed", 500, error.message);
    }
  }

  async getJoinedProjects(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // ✅ STEP 1: FIND TRADESMAN
      const tradesman = await prisma.tradesMan.findFirst({
        where: {
          userId: userId,
          user: {
            isDeleted: false,
            status: "ACTIVE",
            isVerified: true,
            user_type: "TRADESMAN",
          },
        },
      });

      if (!tradesman) {
        throw new CustomError("Tradesman not found", 404);
      }

      // ✅ STEP 2: TOTAL COUNT
      const totalCount = await prisma.tradesManOnProject.count({
        where: {
          tradesManId: tradesman.id,
          project: {
            isDeleted: false,
          },
        },
      });

      // ✅ STEP 3: FETCH PROJECTS
      const joinedProjects = await prisma.tradesManOnProject.findMany({
        where: {
          tradesManId: tradesman.id,
          project: {
            isDeleted: false,
          },
        },
        include: {
          project: {
            include: {
              jobCrafts: {
                include: {
                  craft: true,
                },
              },
              tradesmanContexts: {
                where: { tradesmanId: tradesman.id },
                select: { employerName: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      // ✅ STEP 4: FORMAT RESPONSE
      const responseData = joinedProjects.map((jp) => ({
        projectId: jp.project.id,
        uuid: jp.project.uuid,
        projectName: jp.project.projectName,
        clientName: jp.project.clientName,
        clientMobile: jp.project.clientMobile,
        address: jp.project.clientAddress,
        startDate: jp.project.startDate,
        endDate: jp.project.endDate,
        latitude: jp.project.latitude,
        longitude: jp.project.longitude,
        status: jp.project.status,
        employerName: jp.project.tradesmanContexts?.[0]?.employerName || null,

        jobCrafts: jp.project.jobCrafts.map((jc) => ({
          id: jc.id,
          craftId: jc.craftId,
          name: jc.craft?.name,
          total: jc.counts,
          joined: jc.joinedCount,
        })),
      }));

      return {
        message: "Joined projects fetched successfully",
        data: responseData,
        pagination: {
          totalRecords: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit,
        },
      };
    } catch (error: any) {
      console.error("❗ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError(
        "Failed to fetch joined projects",
        500,
        error.message,
      );
    }
  }
  async filterProjects(
    data: SearchScaffHoldDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition: any = {
        isDeleted: false,
      };

      const searchTerm = data?.search?.trim();

      if (searchTerm) {
        if (!isNaN(Number(searchTerm))) {
          whereCondition.id = Number(searchTerm);
        } else {
          whereCondition.OR = [
            { projectName: { contains: searchTerm } },
            { clientName: { contains: searchTerm } },
            { clientAddress: { contains: searchTerm } },
          ];
        }
      }

      const [projects, totalCount] = await Promise.all([
        prisma.project.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                CMPId: true,
              },
            },
            jobCrafts: {
              include: {
                craft: true,
              },
            },
          },
        }),

        prisma.project.count({ where: whereCondition }),
      ]);

      const formattedData = projects.map((p) => ({
        projectId: p.id,
        uuid: p.uuid,
        projectName: p.projectName,
        clientName: p.clientName,
        clientMobile: p.clientMobile,
        clientAddress: p.clientAddress,
        startDate: p.startDate,
        endDate: p.endDate,
        latitude: p.latitude,
        longitude: p.longitude,
        status: p.status,
        createdAt: p.createdAt,

        companyName: p.createdBy?.name || null,
        CMPId: p.createdBy?.CMPId || null,

        jobCrafts: p.jobCrafts.map((jc) => ({
          id: jc.id,
          craftId: jc.craftId,
          name: jc.craft?.name,
          craftImage: jc.craft?.craftImage,
          total: jc.counts,
          joined: jc.joinedCount,
        })),
      }));

      return {
        message: "Projects fetched successfully",
        data: formattedData,
        pagination: {
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError("Failed to fetch projects", 500, error.message);
    }
  }

  async deleteProjectScaffHoldRequest(requestId: scaffHoldIdDTO) {
    try {
      // ✅ 1. Find existing request
      const existingRequest = await prisma.projectScaffholdRequest.findUnique({
        where: { id: requestId.scaffHoldId },
        include: {
          project: {
            include: {
              projectManagers: true, // get PMs
            },
          },
        },
      });

      if (!existingRequest) {
        throw new CustomError(
          RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND,
          404,
          "Project scaffhold request not found",
        );
      }

      // ✅ 2. Only PENDING allowed

      // ✅ 3. Delete history
      await prisma.updateProjectScaffHoldRequest.deleteMany({
        where: {
          requestId: requestId.scaffHoldId,
        },
      });
      await prisma.notification.deleteMany({
        where: {
          scaffoldRequestId: requestId.scaffHoldId.toString(),
        },
      });

      // ✅ 4. Get PM IDs
      const pmUserIds =
        existingRequest.project?.projectManagers?.map((pm) => pm.id) || [];

      // ✅ 5. Delete notifications for those PMs
      if (pmUserIds.length > 0) {
        await prisma.notification.deleteMany({
          where: {
            receiverId: { in: pmUserIds },
          },
        });
      }

      // ✅ 6. Delete main request
      await prisma.projectScaffholdRequest.delete({
        where: {
          id: requestId.scaffHoldId,
        },
      });

      return {
        message: RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_SUCCESS,
      };
    } catch (error: any) {
      console.error("❗ Error in deleteProjectScaffHoldRequest:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.SCAFFHOLD.DELETE_FAILED,
        500,
        error.message,
      );
    }
  }

  async getRequestScaffHoldById(requestId: requestSacffHoldDTO) {
    try {
      const request = await prisma.projectScaffholdRequest.findUnique({
        where: { id: requestId.scaffHoldId },

        include: {
          project: {
            select: {
              id: true,
              projectName: true,
              clientAddress: true,
              latitude: true,
              longitude: true,
            },
          },

          createdBy: {
            include: {
              user: {
                select: {
                  name: true,
                  userMedias: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!request) {
        throw new CustomError("Scaffhold request not found", 404);
      }

      const responseData = {
        id: request.id,
        uuid: request.uuid,
        REQID: request.REQID,
        status: request.status,
        SCAFFID: request.SCAFFID || null,

        craft: request.craft,
        priority: request.priority,
        length: request.length,
        width: request.width,
        height: request.height,
        expectedEndDate: request.expectedEndDate,
        notes: request.notes,

        address: request.address,
        latitude: request.latitude,
        longitude: request.longitude,

        createdAt: request.createdAt,
        updatedAt: request.updatedAt,

        // ✅ PROJECT INFO
        projectId: request.projectId,
        projectName: request.project?.projectName || null,
        projectAddress: request.project?.clientAddress || null,

        // ✅ CREATED BY
        createdById: request.createdBy?.id || null,
        createdByName: request.createdBy?.user?.name || null,
        createdByImage: request.createdBy?.user?.userMedias?.[0]?.url || null,
      };

      return {
        message: "Request details fetched successfully",
        data: responseData,
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to fetch request details",
        500,
        error.message,
      );
    }
  }

  async getModifiedRequestsByParentId(data: getparentSacffHoldDTO) {
    try {
      const mainRequest = await prisma.projectScaffholdRequest.findUnique({
        where: {
          id: BigInt(data.parentId),
        },

        include: {
          project: {
            select: {
              id: true,
              projectName: true,
              clientAddress: true,
              latitude: true,
              longitude: true,
            },
          },

          createdBy: {
            include: {
              user: {
                select: {
                  name: true,
                  userMedias: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },

          // ✅ VERSION HISTORY
          children: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!mainRequest) {
        throw new CustomError("Scaffhold request not found", 404);
      }

      // ✅ MAP CHILDREN AS UPDATES
      const mappedUpdates = mainRequest.children.map((u) => ({
        id: u.id,
        uuid: u.uuid,
        length: u.length,
        width: u.width,
        height: u.height,
        priority: u.priority,
        expectedEndDate: u.expectedEndDate,
        notes: u.notes,
        status: u.status,
        createdAt: u.createdAt,
      }));

      const responseData = {
        id: mainRequest.id,
        uuid: mainRequest.uuid,
        REQID: mainRequest.REQID,
        status: mainRequest.status,
        SCAFFID: mainRequest.SCAFFID || null,

        craft: mainRequest.craft,
        priority: mainRequest.priority,
        length: mainRequest.length,
        width: mainRequest.width,
        height: mainRequest.height,
        expectedEndDate: mainRequest.expectedEndDate,
        notes: mainRequest.notes,

        address: mainRequest.address,
        latitude: mainRequest.latitude,
        longitude: mainRequest.longitude,

        createdAt: mainRequest.createdAt,
        updatedAt: mainRequest.updatedAt,

        // ✅ PROJECT
        projectId: mainRequest.projectId,
        projectName: mainRequest.project?.projectName || null,
        projectAddress: mainRequest.project?.clientAddress || null,

        // ✅ PARENT
        parentId: mainRequest.parentId,

        // ✅ USER
        createdById: mainRequest.createdBy?.id || null,
        createdByName: mainRequest.createdBy?.user?.name || null,
        createdByImage:
          mainRequest.createdBy?.user?.userMedias?.[0]?.url || null,

        // ✅ HISTORY
        updates: mappedUpdates,
      };

      return {
        message: "Request details with history fetched successfully",
        data: responseData,
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to fetch request history",
        500,
        error.message,
      );
    }
  }

  async getAllModifiedRequestsByParentId(
    userId: number,
    data: SearchScaffHoldDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const tradesman = await prisma.tradesMan.findUnique({
        where: { userId: userId },
      });

      if (!tradesman) {
        throw new CustomError("Tradesman not found", 404);
      }

      const skip = (page - 1) * limit;

      const whereCondition: any = {
        parentId: { not: null },
        createdById: tradesman.id,
      };

      const searchTerm = data?.search?.trim();

      if (searchTerm) {
        if (!isNaN(Number(searchTerm))) {
          whereCondition.OR = [
            { id: Number(searchTerm) },
            { REQID: { contains: searchTerm } },
          ];
        } else {
          whereCondition.OR = [
            { REQID: { contains: searchTerm } },
            { address: { contains: searchTerm } },
            {
              project: {
                projectName: { contains: searchTerm },
              },
            },
            {
              createdBy: {
                user: {
                  name: { contains: searchTerm },
                },
              },
            },
          ];
        }
      }

      const [requests, totalCount] = await Promise.all([
        prisma.projectScaffholdRequest.findMany({
          where: whereCondition,
          include: {
            project: {
              select: {
                id: true,
                projectName: true,
                clientAddress: true,
                latitude: true,
                longitude: true,
              },
            },
            createdBy: {
              include: {
                user: {
                  select: {
                    name: true,
                    userMedias: {
                      take: 1,
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),

        prisma.projectScaffholdRequest.count({
          where: whereCondition,
        }),
      ]);

      const responseData = requests.map((req) => ({
        id: req.id,
        uuid: req.uuid,
        REQID: req.REQID,
        status: req.status,

        craft: req.craft,
        priority: req.priority,
        length: req.length,
        width: req.width,
        height: req.height,
        expectedEndDate: req.expectedEndDate,
        notes: req.notes,

        address: req.address,
        latitude: req.latitude,
        longitude: req.longitude,

        createdAt: req.createdAt,
        updatedAt: req.updatedAt,

        parentId: req.parentId,

        // ✅ PROJECT
        projectId: req.projectId,
        projectName: req.project?.projectName || null,
        projectAddress: req.project?.clientAddress || null,

        // ✅ USER
        createdByName: req.createdBy?.user?.name || null,
        createdByImage: req.createdBy?.user?.userMedias?.[0]?.url || null,
      }));

      return {
        message: "Modified requests fetched successfully",
        data: responseData,
        pagination: {
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to fetch modified requests",
        500,
        error.message,
      );
    }
  }

  async getTradesManScaffHoldDetailsById(
    id: number,
    data: ScaffHoldDetailsDTO,
  ) {
    try {
      // ✅ USER VALIDATION
      const userData = await prisma.user.findUnique({
        where: {
          id: id,
          status: "ACTIVE",
          isDeleted: false,
          user_type: "TRADESMAN",
        },
        select: {
          id: true,
          tradesman: {
            select: {
              id: true,
              craft: true,
              jobCraftsJoined: {
                select: {
                  projectJobCraft: {
                    select: {
                      id: true,
                      craft: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userData || !userData.tradesman) {
        throw new CustomError("Unauthorized", 401);
      }

      // ✅ PROJECT FETCH (instead of scaffhold)
      const project = await prisma.project.findFirst({
        where: {
          id: data.id,
          isDeleted: false,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              CMPId: true,
            },
          },
          jobCrafts: {
            include: {
              craft: true,
            },
          },
        },
      });

      if (!project) {
        throw new CustomError("Project not found", 404);
      }

      // ✅ CRAFT RESOLVE
      const craftName =
        userData.tradesman.jobCraftsJoined?.[0]?.projectJobCraft?.craft?.name ||
        userData.tradesman.craft ||
        null;

      const craftId =
        userData.tradesman.jobCraftsJoined?.[0]?.projectJobCraft?.id || null;

      // ✅ RESPONSE
      const formattedResponse = {
        projectId: project.id,
        uuid: project.uuid,
        projectName: project.projectName,

        startDate: project.startDate,
        endDate: project.endDate,

        latitude: project.latitude,
        longitude: project.longitude,

        status: project.status,

        clientName: project.clientName,
        clientMobile: project.clientMobile,
        clientAddress: project.clientAddress,

        companyId: project.createdById,
        companyName: project.createdBy?.name || null,
        CMPId: project.createdBy?.CMPId || null,

        createdAt: project.createdAt,
        updatedAt: project.updatedAt,

        // ✅ JOB CRAFTS
        jobCrafts: project.jobCrafts.map((jc) => ({
          id: jc.id,
          craftId: jc.craftId,
          craftName: jc.craft?.name,
          total: jc.counts,
          joined: jc.joinedCount,
        })),

        // ✅ USER CRAFT CONTEXT
        userCraftName: craftName,
        userCraftId: craftId,
      };

      return {
        message: "Project details fetched successfully",
        data: formattedResponse,
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError(
        "Failed to fetch project details",
        500,
        error.message,
      );
    }
  }

  async getProjectRequestFilterData(
    data: SearchFilterDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition: any = {};

      const { priority, status, sort } = data;

      if (priority) {
        whereCondition.priority = Array.isArray(priority)
          ? { in: priority.map((p) => p.toUpperCase()) }
          : priority.toUpperCase();
      }

      if (status) {
        whereCondition.status = Array.isArray(status)
          ? { in: status.map((s) => s.toUpperCase()) }
          : status.toUpperCase();
      }

      const totalCount = await prisma.projectScaffholdRequest.count({
        where: whereCondition,
      });

      const totalPages = Math.ceil(totalCount / limit);

      const requests = await prisma.projectScaffholdRequest.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: sort?.toLowerCase() === "asc" ? "asc" : "desc",
        },
        include: {
          project: {
            select: {
              projectName: true,
              clientName: true,
              PJT: true,
            },
          },
        },
      });

      const formatted = requests.map((r) => ({
        id: r.id,
        uuid: r.uuid,
        REQID: r.REQID,
        SCAFFID: r.SCAFFID,

        projectId: r.projectId,
        projectName: r.project?.projectName,
        PJT: r.project?.PJT,

        craft: r.craft,
        length: r.length,
        width: r.width,
        height: r.height,
        priority: r.priority,
        status: r.status,

        createdAt: r.createdAt,
      }));

      return {
        success: true,
        message: "Project request fetched successfully",
        data: formatted,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error: any) {
      console.error("❌ Error:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("Fetch failed", 500, error.message);
    }
  }

  async getFilteredProjectRequestsByProjectId(
    projectId: number,
    data: SearchFilterDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereCondition: any = {
        projectId: projectId,
      };

      const { search, priority, status, sort } = data || {};
      const searchTerm = search?.trim();

      // ✅ Search
      if (searchTerm && searchTerm !== "") {
        if (!isNaN(Number(searchTerm))) {
          whereCondition.id = Number(searchTerm);
        } else {
          whereCondition.OR = [
            { REQID: { contains: searchTerm } },
            { SCAFFID: { contains: searchTerm } },
            { notes: { contains: searchTerm } },
          ];
        }
      }

      // ✅ Priority
      if (priority) {
        whereCondition.priority = Array.isArray(priority)
          ? { in: priority.map((p) => p.toUpperCase()) }
          : priority.toUpperCase();
      }

      // ✅ Status
      if (status) {
        whereCondition.status = Array.isArray(status)
          ? { in: status.map((s) => s.toUpperCase()) }
          : status.toUpperCase();
      }

      // ✅ Count
      const totalCount = await prisma.projectScaffholdRequest.count({
        where: whereCondition,
      });

      const totalPages = Math.ceil(totalCount / limit);

      // ✅ Fetch
      const requests = await prisma.projectScaffholdRequest.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: sort?.toLowerCase() === "asc" ? "asc" : "desc",
        },
        include: {
          project: {
            select: {
              projectName: true,
              PJT: true,
            },
          },
          createdBy: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          updatesRequest: true,
        },
      });

      // ✅ Format like scaffhold API
      const formattedData = requests.map((r) => ({
        id: r.id,
        uuid: r.uuid,
        REQID: r.REQID,
        SCAFFID: r.SCAFFID,

        projectId: r.projectId,
        projectName: r.project?.projectName || null,
        PJT: r.project?.PJT || null,

        craft: r.craft,
        length: r.length,
        width: r.width,
        height: r.height,

        priority: r.priority,
        status: r.status,

        createdById: r.createdById,
        createdByName: r.createdBy?.user?.name || null,
        createdByEmail: r.createdBy?.user?.email || null,

        history:
          r.updatesRequest?.map((h) => ({
            id: h.id,
            length: h.length,
            width: h.width,
            height: h.height,
            priority: h.priority,
            expectedEndDate: h.expectedEndDate,
            notes: h.notes,
            createdAt: h.createdAt,
          })) || [],

        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      return {
        success: true,
        message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS, // ✅ same style
        data: formattedData,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      if (error instanceof CustomError) throw error;

      throw new CustomError(
        RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
        500,
        error.message,
      );
    }
  }

  async deleteTradesman(id: number) {
    try {
      const existingTradesman = await prisma.user.findUnique({
        where: {
          id: id,
          status: "ACTIVE",
          isDeleted: false,
        },
      });

      if (!existingTradesman) {
        throw new CustomError(
          RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND,
          404,
          "Tradesman not found",
        );
      }

      await prisma.user.update({
        where: { id: existingTradesman.id },
        data: { isDeleted: true, status: "DELETED" },
      });

      return {
        message: RESPONSE_MESSAGES.TRADESMAN.DELETE_SUCCESS,
      };
    } catch (error: any) {
      console.error("❗ Error in deleteTradesman:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        RESPONSE_MESSAGES.TRADESMAN.DELETE_FAILED,
        500,
        error.message,
      );
    }
  }
}
