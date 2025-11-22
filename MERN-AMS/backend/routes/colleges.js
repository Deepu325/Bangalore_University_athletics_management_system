import express from 'express';
import * as ctrl from '../controllers/collegeController.js';

const router = express.Router();

router.get('/', ctrl.listColleges);
router.post('/', ctrl.createCollege);
router.put('/:id', ctrl.updateCollege);
router.delete('/:id', ctrl.deleteCollege);

export default router;
