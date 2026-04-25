import express from 'express';
import { getAllMatches, getMatchById, getStandsByCity, getStandsByMatchId } from '../controllers/matchController.js';

const router = express.Router();

router.get('/', getAllMatches);
router.get('/stands/:cityKey', getStandsByCity);
router.get('/:id/stands', getStandsByMatchId);
router.get('/:id', getMatchById);

export default router;
