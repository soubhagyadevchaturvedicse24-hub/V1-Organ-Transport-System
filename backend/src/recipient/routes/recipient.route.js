import { Router } from 'express';
import * as recipientController from '../controllers/recipient.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post('/', recipientController.createRecipient);
router.get('/', recipientController.listRecipients);

export default router;
