import { Router } from 'express';
import { analyzeUrlHandler } from '../controllers/analyzeController.js';

const router = Router();

router.post('/', analyzeUrlHandler);

export default router;
