import express from 'express';
import { addLead, getLeads, updateLead, deleteLead, bulkImportLeads } from '../controllers/leadsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // memory storage

router.post('/', authMiddleware, addLead);
router.get('/', authMiddleware, getLeads);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);
router.post('/import', authMiddleware, upload.single('file'), bulkImportLeads);

export default router; 