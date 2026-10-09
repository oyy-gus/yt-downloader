import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Maxistrong Music Processing Backend',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime())
  });
});

export default router;
