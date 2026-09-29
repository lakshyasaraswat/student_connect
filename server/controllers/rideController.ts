import { Response } from 'express';
import { RideModel, UserModel, AppNotificationModel } from '../models/schemas.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateRideInput } from '../validators/validators.ts';
import {
  sendRealTimeNotification,
  broadcastRideUpdate,
  broadcastRideWithdrawal,
  broadcastRideDecision,
} from '../sockets/chatSocket.ts';

async function enrichRide(r: any): Promise<any> {
  if (!r) return r;
  const doc = r.toObject ? r.toObject() : r;

  const driver = await UserModel.findOne({ id: doc.driverId }).lean();

  const passengerIds = (doc.passengers || []).map((p: any) => p.passengerId);
  const passengers = passengerIds.length
    ? await UserModel.find({ id: { $in: passengerIds } }).lean()
    : [];
  const passengerMap = new Map<string, any>(
    passengers.map((u: any) => [u.id, u])
  );

  return {
    ...doc,
    collegeName: doc.collegeName || driver?.collegeName || 'Verified University',
    driverEmail: doc.driverEmail || driver?.email,
    passengers: (doc.passengers || []).map((p: any) => ({
      ...p,
      passengerCollege:
        p.passengerCollege ||
        passengerMap.get(p.passengerId)?.collegeName ||
        'Verified Student',
    })),
  };
}

export const RideController = {
  async getRides(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const source = req.query.source ? String(req.query.source) : undefined;
    const destination = req.query.destination
      ? String(req.query.destination)
      : undefined;
    const vehicleType = req.query.vehicleType
      ? String(req.query.vehicleType)
      : undefined;
    const date = req.query.date ? String(req.query.date) : undefined;

    const filter: any = { status: 'active' };
    if (requestedCampus && requestedCampus !== 'all')
      filter.campusId = requestedCampus;
    if (source) filter.source = { $regex: source, $options: 'i' };
    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (vehicleType && vehicleType !== 'all')
      filter.vehicleType = new RegExp(`^${vehicleType}$`, 'i');
    if (date) filter.date = date;

    const rides = await RideModel.find(filter).sort({ createdAt: -1 });
    const enrichedRides = await Promise.all(rides.map((r) => enrichRide(r)));

    res.json({ success: true, rides: enrichedRides });
  },

  async getRideById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const ride = await RideModel.findOne({ id });
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: 'Ride not found.' });
    res.json({ success: true, ride: await enrichRide(ride) });
  },

  async createRide(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateRideInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = await UserModel.findOne({ id: req.user.userId });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const newRide = await RideModel.create({
      id: `ride_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      collegeName: user.collegeName,
      driverId: user.id,
      driverName: user.name,
      driverAvatar: user.avatar,
      driverPhone: req.body.driverPhone || '+1 (555) 019-2831',
      driverEmail: user.email,
      vehicleType: req.body.vehicleType || 'Car',
      vehicleModel: req.body.vehicleModel || 'Vehicle',
      source: req.body.source.trim(),
      pickupMapsUrl: req.body.pickupMapsUrl?.trim() || undefined,
      destination: req.body.destination.trim(),
      destinationMapsUrl: req.body.destinationMapsUrl?.trim() || undefined,
      date: req.body.date,
      time: req.body.time,
      seatsTotal: Number(req.body.seatsTotal) || 3,
      seatsAvailable: Number(req.body.seatsTotal) || 3,
      pricePerSeat: Number(req.body.pricePerSeat) || 0,
      passengers: [],
      status: 'active',
      recurring: Boolean(req.body.recurring),
      recurrencePattern: req.body.recurrencePattern || 'None',
      notes: req.body.notes || '',
      createdAt: new Date().toISOString(),
    });

    const enriched = await enrichRide(newRide);
    broadcastRideUpdate(enriched);

    res.status(201).json({
      success: true,
      message:
        'Carpool ride published! Students from across all campuses can now view and request seats.',
      ride: enriched,
    });
  },

  async requestSeat(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const ride: any = await RideModel.findOne({ id });
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: 'Ride not found.' });

    if (ride.driverId === req.user.userId)
      return res.status(400).json({
        success: false,
        message: 'You cannot book a seat on your own ride.',
      });

    if ((ride.seatsAvailable ?? 0) <= 0)
      return res.status(400).json({
        success: false,
        message: 'No seats available for this ride.',
      });

    const existing = ride.passengers.find(
      (p: any) => p.passengerId === req.user!.userId
    );
    if (existing) {
      if (existing.status === 'pending' || existing.status === 'accepted')
        return res.status(400).json({
          success: false,
          message: `You have already requested a seat (Status: ${existing.status}).`,
        });
      ride.passengers = ride.passengers.filter(
        (p: any) => p.passengerId !== req.user!.userId
      );
    }

    const user = await UserModel.findOne({ id: req.user.userId });

    ride.passengers.push({
      passengerId: req.user.userId,
      passengerName: user?.name || req.user.name,
      passengerAvatar: user?.avatar || '',
      passengerCollege: user?.collegeName || 'Verified University',
      seatsBooked: 1,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });
    await ride.save();

    const isCrossCollege = Boolean(
      user?.collegeName && ride.collegeName && user.collegeName !== ride.collegeName
    );

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}`,
      campusId: ride.campusId,
      userId: ride.driverId,
      type: 'ride',
      title: isCrossCollege ? 'Cross-College Ride Request' : 'New Ride Request',
      message: `${user?.name} (${user?.collegeName || 'Student'}) requested to join your ride from ${ride.source} to ${ride.destination}.`,
      read: false,
      link: '/carpool',
      createdAt: new Date().toISOString(),
    });

    sendRealTimeNotification(ride.driverId, notif.toObject());

    const enriched = await enrichRide(ride);
    broadcastRideUpdate(enriched, ride.driverId, {
      passengerId: req.user.userId,
      passengerName: user?.name || req.user.name,
      passengerAvatar: user?.avatar || '',
      passengerCollege: user?.collegeName || 'Verified University',
      seatsBooked: 1,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message:
        'Join request sent to the driver! You will be notified once accepted.',
      ride: enriched,
    });
  },

  async handleSeatRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { passengerId, action } = req.body;
    const id = String(req.params.id);
    const ride: any = await RideModel.findOne({ id });
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: 'Ride not found.' });

    if (ride.driverId !== req.user.userId && req.user.role !== 'admin')
      return res.status(403).json({
        success: false,
        message: 'Only the driver can manage seat requests.',
      });

    const passenger = ride.passengers.find(
      (p: any) => p.passengerId === passengerId
    );
    if (!passenger)
      return res
        .status(404)
        .json({ success: false, message: 'Passenger request not found.' });

    if (action === 'accept') {
      if ((ride.seatsAvailable ?? 0) <= 0)
        return res.status(400).json({
          success: false,
          message: 'No seats left to accept this passenger.',
        });
      passenger.status = 'accepted';
      ride.seatsAvailable =
        (ride.seatsAvailable ?? 0) - (passenger.seatsBooked || 1);
      await ride.save();

      const notif = await AppNotificationModel.create({
        id: `notif_${Date.now()}`,
        campusId: ride.campusId,
        userId: passengerId,
        type: 'ride',
        title: 'Ride Request Accepted!',
        message: `${ride.driverName} accepted your carpool request for ${ride.source} → ${ride.destination}.`,
        read: false,
        link: '/carpool',
        createdAt: new Date().toISOString(),
      });
      sendRealTimeNotification(passengerId, notif.toObject());
    } else {
      passenger.status = 'rejected';
      await ride.save();
    }

    const enriched = await enrichRide(ride);
    broadcastRideDecision(
      enriched,
      passengerId,
      action === 'accept' ? 'accepted' : 'rejected'
    );

    res.json({
      success: true,
      message: `Passenger request ${action}ed successfully.`,
      ride: enriched,
    });
  },

  async withdrawRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const ride: any = await RideModel.findOne({ id });
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: 'Ride not found.' });

    const passengerIndex = ride.passengers.findIndex(
      (p: any) => p.passengerId === req.user!.userId
    );
    if (passengerIndex === -1)
      return res.status(404).json({
        success: false,
        message: 'No request found for this ride.',
      });

    const passenger = ride.passengers[passengerIndex];
    if (passenger.status === 'accepted')
      return res.status(400).json({
        success: false,
        message:
          'Cannot withdraw request after it has already been accepted by the driver.',
      });

    ride.passengers.splice(passengerIndex, 1);
    await ride.save();

    const user = await UserModel.findOne({ id: req.user.userId });

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}`,
      campusId: ride.campusId,
      userId: ride.driverId,
      type: 'ride',
      title: 'Ride Request Withdrawn',
      message: `${user?.name || req.user.name} withdrew their carpool seat request for ${ride.source} → ${ride.destination}.`,
      read: false,
      link: '/carpool',
      createdAt: new Date().toISOString(),
    });
    sendRealTimeNotification(ride.driverId, notif.toObject());

    const enriched = await enrichRide(ride);
    broadcastRideWithdrawal(enriched, ride.driverId, req.user.userId);

    res.json({
      success: true,
      message: 'Your seat request has been withdrawn.',
      ride: enriched,
    });
  },

  async deleteRide(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const ride = await RideModel.findOne({ id });
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: 'Ride not found.' });

    if (ride.driverId !== req.user.userId && req.user.role !== 'admin')
      return res.status(403).json({
        success: false,
        message: 'Only the driver can delete this ride listing.',
      });

    await RideModel.deleteOne({ id: ride.id });
    broadcastRideUpdate({ id: ride.id, status: 'cancelled' });

    res.json({ success: true, message: 'Ride listing deleted successfully.' });
  },

  async calculateCostSplit(req: AuthenticatedRequest, res: Response) {
    const {
      distanceKm,
      fuelPricePerLitre = 1.2,
      mileageKmPerLitre = 15,
      passengersCount = 3,
      tollCharges = 0,
    } = req.body;

    const dist = Number(distanceKm) || 20;
    const passengers = Math.max(1, Number(passengersCount) || 1);
    const fuelLitreNeeded = dist / Number(mileageKmPerLitre);
    const fuelCost = fuelLitreNeeded * Number(fuelPricePerLitre);
    const totalTripCost = fuelCost + Number(tollCharges);
    const costPerPerson = totalTripCost / (passengers + 1);

    res.json({
      success: true,
      calculation: {
        distanceKm: dist,
        fuelCost: Number(fuelCost.toFixed(2)),
        tollCharges: Number(tollCharges),
        totalTripCost: Number(totalTripCost.toFixed(2)),
        passengersCount: passengers,
        costPerPerson: Number(costPerPerson.toFixed(2)),
        suggestedSeatPrice: Math.ceil(costPerPerson),
      },
    });
  },
};