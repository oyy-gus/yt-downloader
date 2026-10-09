import { Router } from 'express';
import {
  createJobHandler,
  getJobHandler,
  cancelJobHandler,
  sseJobEventsHandler
} from '../controllers/jobsController.js';

const router = Router();

router.post('/', createJobHandler);
router.get('/:jobId', getJobHandler);
router.get('/:jobId/events', sseJobEventsHandler);
router.post('/:jobId/cancel', cancelJobHandler);

export default router;
