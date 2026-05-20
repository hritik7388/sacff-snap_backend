// src/controllers/subAdminController.ts
import { Response } from "express";
import { Request } from "express";
import { subAdminServices } from "../services/subAdminServices";
import { subAdminLoginSchema, addTeamMemberSchema, addNewProjectSchema, updateTeamMemberSchema, searchTeamMemberSchema, TeamMemberSchema, scaffHoldRequest, TimelineImageFilter, updateProjectSchema, } from "../schemas/subAdminSchema";
import { AuthenticatedRequest } from "../types/index";
import { searchFilter } from "../schemas/tradesManSchema";
import { logout } from "../schemas/superAdminSchema";
import { CustomError } from "../types/customError";
const subAdmin = new subAdminServices();
export class subAdminController {
    async subAdminLogin(req: Request, res: Response, next: Function) {
        try {
            const data = subAdminLoginSchema.parse(req.body);
            const user = await subAdmin.loginSubAdminServices(data);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }

    }

    async addTeamMember(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = addTeamMemberSchema.parse(req.body);
            const teamMember = await subAdmin.addTeamMemberServices(id, data);
            res.status(201).json(teamMember);
        } catch (err) {
            next(err);
        }

    }
    async updateTeamMember(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = updateTeamMemberSchema.parse(req.body);
            const teamMember = await subAdmin.editTeamMemberServices(data);
            res.status(201).json(teamMember);
        } catch (err) {
            next(err);
        }

    }

    async getProjectManagersList(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const id = req.user!.id;

            const result = await subAdmin.getProjectManagersListServices(id, page, limit);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getCompetentPersonList(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const data = searchFilter.parse(req.query);
            const id = req.user!.id;
            const result = await subAdmin.getCompetentPersonListServices(id, data, page, limit);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getCompanyCompetentPerson(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const id = req.user!.id;

            const result = await subAdmin.getCompanyCompetentPersonList(id, page, limit);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getTradesManList(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const result = await subAdmin.getTradesManListServices(page, limit);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async createNewProject(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = addNewProjectSchema.parse(req.body);
            const project = await subAdmin.createNewProject(id, data);
            res.status(201).json(project);
        } catch (err) {
            next(err);
        }
    }

    async upadteProject(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = updateProjectSchema.parse(req.body);
            const project = await subAdmin.updateProject(id, data);
            res.status(201).json(project);
        } catch (err) {
            next(err);
        }
    }

    async dashboardData(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = await subAdmin.teamMemberDashboard(id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async scaffholdDashboard(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = await subAdmin.scaffholdDashboard(id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async projectDashboard(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = await subAdmin.projectDashboard(id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async scaffStatusDashboard(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = req.user!.id;
            const data = await subAdmin.scaffholdStatusDashboard(id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }


    async searchTeamMemberController(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = searchTeamMemberSchema.parse(req.body);
            const userData = await subAdmin.searchTeamMember(data);
            res.status(200).json(userData);
        } catch (err) {
            next(err);
        }


    }
    async getTeamMemberByScaffHoldIdController(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = TeamMemberSchema.parse(req.query);
            const userData = await subAdmin.searchTeamMemberByScaffhold(data);
            res.status(200).json(userData);
        } catch (err) {
            next(err);
        }
    }

    async getScaffHoldRequests(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const data = scaffHoldRequest.parse(req.query);
            const result = await subAdmin.getRequestByScaffHoldId(data, page, limit);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getTimelineImagesByStatus(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const data = TimelineImageFilter.parse(req.query);
            const result = await subAdmin.getTimelineImagesByStatus(data, page, limit);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getProjectList(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const id = Number(req.user?.id!);

            const result = await subAdmin.getProjectListServices(id, page, limit);

            res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    async getProjectScaffHold(
        req: AuthenticatedRequest,
        res: Response,
    ) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const id = Number(req.query.id);
            console.log("projectId======>>>",id)
            const result =
                await subAdmin.getProjectScaffHold( page, limit,id

                );
            return res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }
    async getAllScaffHold(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const id = Number(req.user?.id!);
            const scaffHoldData = await subAdmin.getAllScaffHolds(id, page, limit,);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }


    async getUserData(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const scaffHoldData = await subAdmin.getUserDetails(id);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }


    async deleteUserBySubAdmin(
        req: AuthenticatedRequest,
        res: Response,
        next: Function
    ) {
        try {
            const userId = Number(req.query.userId);
            const subAdminId = Number(req.user?.id);


            const result = await subAdmin.deleteUserBySubAdminServices(subAdminId, userId);

            res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }



    async logOutCompany(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = logout.parse(req.body);
            const result = await subAdmin.logoutCompany(id, data);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }
}

function next(err: unknown) {
    throw new Error("Function not implemented.");
}
