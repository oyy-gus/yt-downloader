import { Router } from 'express';
import { downloadTrackHandler, downloadZipHandler } from '../controllers/filesController.js';

const router = Router();

router.get('/:jobId/track/:trackId', downloadTrackHandler);
router.get('/:jobId/zip', downloadZipHandler);

export default router;
