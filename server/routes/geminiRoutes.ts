import { Router } from 'express';
import { GeminiController } from '../controllers/geminiController.ts';

const router = Router();

// Multi-turn chat with Google Maps grounding
router.post('/chat', GeminiController.handleChat);

// Instant localized category queries (carpool pickup points, PG rents, roommate areas)
router.post('/locate-nearby', GeminiController.getNearbyAssistance);

// Get Google Maps verified locations for a user's college
router.get('/verified-locations', GeminiController.getVerifiedLocations);

export default router;
