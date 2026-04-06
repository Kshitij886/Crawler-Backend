import { Router } from 'express';
import domain from '../controllers/domain.controller.js';
import subdomain from '../controllers/subdomain.controller.js';

const router = Router();

router.post('/domain', domain)
router.post('/subdomain', subdomain)

export default  router 