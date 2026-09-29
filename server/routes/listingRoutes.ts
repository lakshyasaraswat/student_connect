import { Router } from 'express';
import { ListingController } from '../controllers/listingController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, ListingController.getListings);
router.get('/:id', optionalAuth, ListingController.getListingById);
router.post('/', requireAuth, enforceCampusIsolation, ListingController.createListing);
router.delete('/:id', requireAuth, ListingController.deleteListing);
router.post('/:id/reviews', requireAuth, ListingController.addReview);

export default router;
