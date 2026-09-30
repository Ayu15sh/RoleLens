import { Router } from 'express';
import multer from 'multer';
import { matchHandler } from '../controllers/matchController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Match endpoint accepts formData (fields and files)
router.post('/match', upload.fields([
  { name: 'resumeFile', maxCount: 1 },
  { name: 'jobDescriptionFile', maxCount: 1 }
]), matchHandler);

export default router;
