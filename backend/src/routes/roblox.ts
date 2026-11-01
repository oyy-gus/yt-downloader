import { Router } from 'express';
import { validateRobloxCredentials } from '../services/robloxService.js';

const router = Router();

router.post('/validate', async (req, res) => {
  try {
    const { apiKey, creatorId, creatorType = 'user' } = req.body;
    const result = await validateRobloxCredentials({ apiKey, creatorId, creatorType });
    return res.json({
      success: result.isValid,
      message: result.reason
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Terjadi kesalahan saat memeriksa akun Roblox: ${err.message}`
    });
  }
});

export default router;
