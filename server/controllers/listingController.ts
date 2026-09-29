import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { PGListing } from '../models/types.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';

export const ListingController = {
  getListings(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = (req.query.campusId as string) || (req.user?.role === 'admin' ? (req.query.campusId as string) : undefined);
    const { maxRent, maxDistance, type, genderPreference, amenity, search } = req.query;

    let listings = [...db.listings];

    if (requestedCampus && requestedCampus !== 'all') {
      listings = listings.filter(l => l.campusId === requestedCampus);
    } else if (req.user?.campusId) {
      const campusSpecific = listings.filter(l => l.campusId === req.user?.campusId);
      if (campusSpecific.length > 0) {
        listings = campusSpecific;
      }
    }

    if (maxRent && Number(maxRent) > 0) {
      listings = listings.filter(l => l.rent <= Number(maxRent));
    }
    if (maxDistance && Number(maxDistance) > 0) {
      listings = listings.filter(l => l.location.distanceToCampusKm <= Number(maxDistance));
    }
    if (type && type !== 'All') {
      listings = listings.filter(l => l.type.toLowerCase() === (type as string).toLowerCase());
    }
    if (genderPreference && genderPreference !== 'All') {
      listings = listings.filter(l => l.genderPreference.toLowerCase() === (genderPreference as string).toLowerCase() || l.genderPreference === 'Any');
    }
    if (amenity) {
      listings = listings.filter(l => l.amenities.some(a => a.toLowerCase().includes((amenity as string).toLowerCase())));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.location.address.toLowerCase().includes(q) ||
        l.amenities.some(a => a.toLowerCase().includes(q))
      );
    }

    const effectiveCampusId = requestedCampus || req.user?.campusId || 'campus_stanford';
    const campus = SUPPORTED_CAMPUSES.find(c => c.id === effectiveCampusId) || SUPPORTED_CAMPUSES[0];

    res.json({
      success: true,
      listings,
      campusCenter: campus.centerCoordinates
    });
  },

  getListingById(req: AuthenticatedRequest, res: Response) {
    const listing = db.listings.find(l => l.id === req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    res.json({ success: true, listing });
  },

  createListing(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const {
      title,
      type = 'Flat',
      rent,
      deposit,
      address,
      distanceToCampusKm = 1.5,
      amenities,
      rules,
      genderPreference = 'Any',
      photos,
      ownerContact,
      mapsUrl
    } = req.body;

    if (!title?.trim() || !rent) {
      return res.status(400).json({ success: false, message: 'Title and rent are required.' });
    }

    const campus = SUPPORTED_CAMPUSES.find(c => c.id === user.campusId) || SUPPORTED_CAMPUSES[0];

    // Jitter coordinates slightly around campus for map demonstration
    const jitterLat = (Math.random() - 0.5) * 0.02;
    const jitterLng = (Math.random() - 0.5) * 0.02;

    const validatedPhotos = Array.isArray(photos) && photos.filter(Boolean).length > 0
      ? photos.filter(Boolean)
      : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
        ];

    const newListing: PGListing = {
      id: `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      ownerId: user.id,
      ownerName: user.name,
      ownerType: user.role === 'admin' ? 'verified_landlord' : 'student',
      ownerContact: ownerContact || user.email,
      title: title.trim(),
      type: (type || 'Flat') as any,
      photos: validatedPhotos,
      rent: Number(rent),
      deposit: Number(deposit) || Number(rent),
      amenities: Array.isArray(amenities) ? amenities : ['WiFi', 'Furnished', 'Washer'],
      mapsUrl: mapsUrl ? mapsUrl.trim() : undefined,
      location: {
        address: address || `${user.collegeName} Neighborhood`,
        distanceToCampusKm: Number(distanceToCampusKm) || 1.5,
        lat: campus.centerCoordinates.lat + jitterLat,
        lng: campus.centerCoordinates.lng + jitterLng
      },
      rules: Array.isArray(rules) ? rules : ['Quiet hours after 11 PM', 'Students preferred'],
      genderPreference: genderPreference || 'Any',
      verified: true,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      status: 'available',
      createdAt: new Date().toISOString()
    };

    db.listings.unshift(newListing);

    res.status(201).json({
      success: true,
      message: 'PG / Flat listing posted and marked on campus interactive map!',
      listing: newListing
    });
  },

  deleteListing(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const listingIndex = db.listings.findIndex(l => l.id === req.params.id);
    if (listingIndex === -1) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const listing = db.listings[listingIndex];
    if (listing.ownerId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });
    }

    db.listings.splice(listingIndex, 1);
    res.json({ success: true, message: 'Listing deleted successfully.' });
  },

  addReview(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rating, comment } = req.body;
    const listing = db.listings.find(l => l.id === req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    const user = db.users.find(u => u.id === req.user?.userId);
    const review = {
      id: `rev_${Date.now()}`,
      userName: user?.name || req.user.name,
      rating: Number(rating) || 5,
      comment: comment || 'Clean, great location close to campus transport.',
      date: new Date().toISOString().split('T')[0]
    };

    listing.reviews.unshift(review);
    listing.reviewsCount = listing.reviews.length;
    const totalRating = listing.reviews.reduce((acc, r) => acc + r.rating, 0);
    listing.rating = Number((totalRating / listing.reviewsCount).toFixed(1));

    res.json({ success: true, message: 'Review added to listing.', listing });
  }
};
