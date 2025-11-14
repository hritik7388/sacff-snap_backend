import { Router } from 'express';
import superAdminRoutes from './superAdminRoutes'; 
import companyRoutes from './companyRoutes';
import deviceRoutes from './deviceRoutes';
import  awsRoutes  from './awsRoutes';
import subAdmin from './subAdminRoutes';
import tradesMan from './tradesManRoutes';
import projectManager from './projectManagerRoutes';
import password from './passwordRoutes';
import scaffhold from './scaffHoldRoutes';
import job from './jobRoutes'
import competentPerson from './competentPersonRoutes';

const router = Router(); 
router.use('/v1/company', companyRoutes);
router.use('/v1/device', deviceRoutes);
router.use('/v1/superAdmin', superAdminRoutes); 
router.use('/v1/aws', awsRoutes);
router.use('/v1/subAdmin', subAdmin);
router.use('/v1/tradesMan', tradesMan);
router.use('/v1/projectManager', projectManager);
router.use('/v1/password', password);
router.use('/v1/scaffHold', scaffhold);
router.use('/v1/job',job)
router.use('/v1/competentPerson',competentPerson)
export default router;