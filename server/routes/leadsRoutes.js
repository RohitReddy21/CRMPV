import express from 'express';
import { addLead, getLeads, updateLead, deleteLead } from '../controllers/leadsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, addLead);
router.get('/', authMiddleware, getLeads);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);

export default router; 