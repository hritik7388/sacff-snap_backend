import { Response } from "express";
import { Request } from "express";
import { superAdminServices } from "../services/superAdminServices";
import { superAdminSchema, approveCompanyRequestSchema, rejectCompanyRequestSchema, companyStatus,  addNewCompanySchema, notifictaion } from "../schemas/superAdminSchema";
import { AuthenticatedRequest } from "../types/index";
const superAdmin = new superAdminServices();
export class superAdminController {
    async superAdminLogin(req: Request, res: Response, next: Function) {
        try {
            const data = superAdminSchema.parse(req.body); 
            const user = await superAdmin.loginSuperAdminServices(data,  );
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }
    async dashboardData(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = await superAdmin.adminDashboard(  );
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
    async approveCompanyrequest(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = approveCompanyRequestSchema.parse(req.body); 
            const company = await superAdmin.approveCompanyRequest( data,  );

            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

    async rejectCompanyrequest(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = rejectCompanyRequestSchema.parse(req.body); 
            const company = await superAdmin.rejectCompanyRequest( data,  );

            res.status(200).json(company);
        } catch (err) {
            next(err);
        }
    }

 

 


    async addNewCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = addNewCompanySchema.parse(req.body);  
            const company = await superAdmin.addNewCompanyBySuperAdmin( data, );
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async blockCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = companyStatus.parse(req.body); 
            const company = await superAdmin.blockCompany( data, );
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async unblockCompanyBySuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
        try { 
            const data = companyStatus.parse(req.body); 
            const company = await superAdmin.unblockCompany( data, );
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
            const company = await superAdmin.deleteCompany( data, );
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    async superAdminNotifictaion(req: AuthenticatedRequest, res: Response, next: Function){
         try {  
            const company = await superAdmin.getSuperAdminNotifications(  );
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

        async markedNotifictaion(req: AuthenticatedRequest, res: Response, next: Function){
         try {  
            const data= notifictaion.parse(req.body)
            const company = await superAdmin.markNotificationAsRead(data  );
            res.status(201).json(company);
        } catch (err) {
            next(err);
        }
    }

    }


