import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { PGListingModel, UserModel } from '../models/schemas.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';

export const ListingController = {
  async getListings(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const maxRent = req.query.maxRent ? Number(req.query.maxRent) : undefined;
    const maxDistance = req.query.maxDistance
      ? Number(req.query.maxDistance)
      : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;
    const genderPreference = req.query.genderPreference
      ? String(req.query.genderPreference)
      : undefined;
    const amenity = req.query.amenity ? String(req.query.amenity) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const filter: any = {};

    if (requestedCampus && requestedCampus !== 'all') {
      filter.campusId = requestedCampus;
    } else if (req.user?.campusId) {
      filter.campusId = req.user.campusId;
    }

    if (maxRent && maxRent > 0) filter.rent = { $lte: maxRent };
    if (maxDistance && maxDistance > 0)
      filter['location.distanceToCampusKm'] = { $lte: maxDistance };

    if (type && type !== 'All') {
      filter.type = new RegExp(`^${type}$`, 'i');
    }

    if (genderPreference && genderPreference !== 'All') {
      filter.$or = [
        { genderPreference: new RegExp(`^${genderPreference}$`, 'i') },
        { genderPreference: 'Any' },
      ];
    }

    if (amenity) {
      filter.amenities = { $regex: amenity, $options: 'i' };
    }

    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { title: rx },
        { 'location.address': rx },
        { amenities: rx },
      ];
    }

    let listings = await PGListingModel.find(filter).sort({ createdAt: -1 }).lean();

    // If campus filter returned nothing, fall back to all listings
    if (
      listings.length === 0 &&
      !requestedCampus &&
      req.user?.campusId
    ) {
      listings = await PGListingModel.find({})
        .sort({ createdAt: -1 })
        .lean();
    }

    const effectiveCampusId =
      requestedCampus || req.user?.campusId || 'campus_stanford';
    const campus =
      SUPPORTED_CAMPUSES.find((c) => c.id === effectiveCampusId) ||
      SUPPORTED_CAMPUSES[0];

    res.json({
      success: true,
      listings,
      campusCenter: campus.centerCoordinates,
    });
  },

  async getListingById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const listing = await PGListingModel.findOne({ id }).lean();
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: 'Listing not found.' });
    res.json({ success: true, listing });
  },

  async createListing(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

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
      mapsUrl,
    } = req.body;

    if (!title?.trim() || !rent) {
      return res
        .status(400)
        .json({ success: false, message: 'Title and rent are required.' });
    }

    const campus =
      SUPPORTED_CAMPUSES.find((c) => c.id === user.campusId) ||
      SUPPORTED_CAMPUSES[0];

    const jitterLat = (Math.random() - 0.5) * 0.02;
    const jitterLng = (Math.random() - 0.5) * 0.02;

    const validatedPhotos =
      Array.isArray(photos) && photos.filter(Boolean).length > 0
        ? photos.filter(Boolean)
        : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ];

    const newListing = await PGListingModel.create({
      id: `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      ownerId: user.id,
      ownerName: user.name,
      ownerType: user.role === 'admin' ? 'verified_landlord' : 'student',
      ownerContact: ownerContact || user.email,
      title: title.trim(),
      type: type || 'Flat',
      photos: validatedPhotos,
      rent: Number(rent),
      deposit: Number(deposit) || Number(rent),
      amenities: Array.isArray(amenities)
        ? amenities
        : ['WiFi', 'Furnished', 'Washer'],
      mapsUrl: mapsUrl ? mapsUrl.trim() : undefined,
      location: {
        address: address || `${user.collegeName} Neighborhood`,
        distanceToCampusKm: Number(distanceToCampusKm) || 1.5,
        lat: campus.centerCoordinates.lat + jitterLat,
        lng: campus.centerCoordinates.lng + jitterLng,
      },
      rules: Array.isArray(rules)
        ? rules
        : ['Quiet hours after 11 PM', 'Students preferred'],
      genderPreference: genderPreference || 'Any',
      verified: true,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      status: 'available',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'PG / Flat listing posted and marked on campus interactive map!',
      listing: newListing.toObject(),
    });
  },

  async deleteListing(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const listing = await PGListingModel.findOne({ id }).lean();
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: 'Listing not found.' });

    if (listing.ownerId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own listings.',
      });
    }

    await PGListingModel.deleteOne({ id });
    res.json({ success: true, message: 'Listing deleted successfully.' });
  },

  async addReview(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rating, comment } = req.body;
    const id = String(req.params.id);

    const listing = await PGListingModel.findOne({ id });
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: 'Listing not found.' });

    const user = await UserModel.findOne({ id: req.user.userId }).lean();

    const review = {
      id: `rev_${Date.now()}`,
      userName: user?.name || req.user.name,
      rating: Number(rating) || 5,
      comment: comment || 'Clean, great location close to campus transport.',
      date: new Date().toISOString().split('T')[0],
    };

    listing.reviews.unshift(review);
    listing.reviewsCount = listing.reviews.length;
    const totalRating = listing.reviews.reduce(
      (acc: number, r: any) => acc + r.rating,
      0
    );
    listing.rating = Number((totalRating / listing.reviewsCount).toFixed(1));
    await listing.save();

    res.json({
      success: true,
      message: 'Review added to listing.',
      listing: listing.toObject(),
    });
  },
};