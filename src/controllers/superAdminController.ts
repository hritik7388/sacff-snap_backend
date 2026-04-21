// src/controllers/superAdminController.ts
import { Response } from "express";
import { Request } from "express";
import { superAdminServices } from "../services/superAdminServices";
import { superAdminSchema, approveCompanyRequestSchema, rejectCompanyRequestSchema, companyStatus, addNewCompanySchema, notifictaion, blogSchema, publishblogSchema, deleteblogSchema, contact, deleteContact, Contactinfo, blogByIdSchema, updateProfileImageSchema, logout } from "../schemas/superAdminSchema";
import { AuthenticatedRequest } from "../types/index";
const superAdmin = new superAdminServices();
export class superAdminController {
    async superAdminLogin(req: Request, res: Response, next: Function) {
        try {
            const data = superAdminSchema.parse(req.body);
            const user = await superAdmin.loginSuperAdminServices(data,);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }
    async dashboardData(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = await superAdmin.adminDashboard();
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
    async approveCompanyrequest(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = approveCompanyRequestSchema.parse(req.body);
            const company = await superAdmin.approveCompanyRequest(data,);

            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

    async rejectCompanyrequest(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = rejectCompanyRequestSchema.parse(req.body);
            const company = await superAdmin.rejectCompanyRequest(data,);

            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }






    async addNewCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = addNewCompanySchema.parse(req.body);
            const company = await superAdmin.addNewCompanyBySuperAdmin(data,);
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async blockCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = companyStatus.parse(req.body);
            const company = await superAdmin.blockCompany(data,);
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async unblockCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = companyStatus.parse(req.body);
            const company = await superAdmin.unblockCompany(data,);
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async getAllActiveCompanies(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const companies = await superAdmin.getAllActiveCompanies(page, limit);
            res.status(200).json(companies);
        } catch (err) {
            next(err);
        }
    }

    async getAllBlockedCompanies(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const companies = await superAdmin.getAllBlockedCompanies(page, limit);
            res.status(200).json(companies);
        } catch (err) {
            next(err);
        }
    }


    async deleteCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = companyStatus.parse(req.body);
            const company = await superAdmin.deleteCompany(data,);
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async superAdminNotifictaion(req: AuthenticatedRequest, res: Response, next: Function) {
        try {

            const id = Number(req.user?.id!);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const company = await superAdmin.getSuperAdminNotifications(id, page, limit);
            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

    async markedNotifictaion(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = notifictaion.parse(req.body)
            const company = await superAdmin.markNotificationAsRead(data);
            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }
    async getUserData(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const scaffHoldData = await superAdmin.getUserDetails(id);
            res.status(200).json(scaffHoldData);
        } catch (err) {
            next(err);
        }
    }

    async blog(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = blogSchema.parse(req.body)
            const blogData = await superAdmin.blogCreationBySuperAdmin(id, data)
            res.status(200).json(blogData)
        } catch (err) {
            next(err);
        }
    }

    async publishblog(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = publishblogSchema.parse(req.body)
            const blogData = await superAdmin.publishBlog(id, data)
            res.status(200).json(blogData)
        } catch (err) {
            next(err);
        }
    }
    async deleteblog(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = deleteblogSchema.parse(req.query)
            const blogData = await superAdmin.delteBlog(id, data)
            res.status(200).json(blogData)
        } catch (err) {
            next(err);
        }
    }

    async deletecontactInfo(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = deleteContact.parse(req.query)
            const blogData = await superAdmin.delteContact(id, data)
            res.status(200).json(blogData)
        } catch (err) {
            next(err);
        }
    }

    async getPublishblog(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const search = req.query.search ? String(req.query.search) : undefined;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 10;
            const status = req.query.status ? String(req.query.status) : undefined;
            const result = await superAdmin.getpublishBlog(status, search, page, limit);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }

    async contact(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const data = contact.parse(req.body)
            const result = await superAdmin.contactInfo(data);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }
    async getcontactInfo(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const search = req.query.search ? String(req.query.search) : undefined;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 10;
            const result = await superAdmin.getContactInfo(search, page, limit);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }

    async getContactById(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Contactinfo.parse(req.query)
            const result = await superAdmin.getContactById(id);

            return res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }
    
    async getBlogById(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            
            const id = blogByIdSchema.parse(req.query)
            const result = await superAdmin.getBlogbyId(id);

            return res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }

    async updateProfileImage(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = updateProfileImageSchema.parse(req.body);
            const result = await superAdmin.updateUserProfileImage(id, data);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }

        async logOut(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const id = Number(req.user?.id!);
            const data = logout.parse(req.body);
            const result = await superAdmin.logoutUser(id, data);
            res.status(200).json(result)
        } catch (err) {
            next(err);
        }
    }

}


