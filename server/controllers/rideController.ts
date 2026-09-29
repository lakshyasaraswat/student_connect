import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateRideInput } from '../validators/validators.ts';
import { Ride } from '../models/types.ts';
import {
  sendRealTimeNotification,
  broadcastRideUpdate,
  broadcastRideWithdrawal,
  broadcastRideDecision
} from '../sockets/chatSocket.ts';

function enrichRide(r: Ride): Ride {
  const driver = db.users.find(u => u.id === r.driverId);
  return {
    ...r,
    collegeName: r.collegeName || driver?.collegeName || 'Verified University',
    driverEmail: r.driverEmail || driver?.email,
    passengers: (r.passengers || []).map(p => {
      const passUser = db.users.find(u => u.id === p.passengerId);
      return {
        ...p,
        passengerCollege: p.passengerCollege || passUser?.collegeName || 'Verified Student'
      };
    })
  };
}

export const RideController = {
  getRides(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId as string;
    const { source, destination, vehicleType, date } = req.query;

    let rides = db.rides.filter(r => r.status === 'active');

    if (requestedCampus && requestedCampus !== 'all') {
      rides = rides.filter(r => r.campusId === requestedCampus);
    }

    if (source) {
      rides = rides.filter(r => r.source.toLowerCase().includes((source as string).toLowerCase()));
    }
    if (destination) {
      rides = rides.filter(r => r.destination.toLowerCase().includes((destination as string).toLowerCase()));
    }
    if (vehicleType && vehicleType !== 'all') {
      rides = rides.filter(r => r.vehicleType.toLowerCase() === (vehicleType as string).toLowerCase());
    }
    if (date) {
      rides = rides.filter(r => r.date === date);
    }

    // Attach driver's and passengers' college info
    const enrichedRides = rides.map(enrichRide);

    res.json({ success: true, rides: enrichedRides });
  },

  getRideById(req: AuthenticatedRequest, res: Response) {
    const ride = db.rides.find(r => r.id === req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    res.json({ success: true, ride: enrichRide(ride) });
  },

  createRide(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateRideInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newRide: Ride = {
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
      createdAt: new Date().toISOString()
    };

    db.rides.unshift(newRide);
    const enriched = enrichRide(newRide);
    broadcastRideUpdate(enriched);

    res.status(201).json({
      success: true,
      message: 'Carpool ride published! Students from across all campuses can now view and request seats.',
      ride: enriched
    });
  },

  requestSeat(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const ride = db.rides.find(r => r.id === req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (ride.driverId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot book a seat on your own ride.' });
    }

    if (ride.seatsAvailable <= 0) {
      return res.status(400).json({ success: false, message: 'No seats available for this ride.' });
    }

    const existingIndex = ride.passengers.findIndex(p => p.passengerId === req.user?.userId);
    if (existingIndex !== -1) {
      const existing = ride.passengers[existingIndex];
      if (existing.status === 'pending' || existing.status === 'accepted') {
        return res.status(400).json({ success: false, message: `You have already requested a seat (Status: ${existing.status}).` });
      }
      // If was rejected or withdrawn, clear prior record and proceed with new request
      ride.passengers.splice(existingIndex, 1);
    }

    const user = db.users.find(u => u.id === req.user?.userId);
    const passengerRecord = {
      passengerId: req.user.userId,
      passengerName: user?.name || req.user.name,
      passengerAvatar: user?.avatar || '',
      passengerCollege: user?.collegeName || req.user.collegeName || 'Verified University',
      seatsBooked: 1,
      status: 'pending' as const,
      requestedAt: new Date().toISOString()
    };

    ride.passengers.push(passengerRecord);

    const isCrossCollege = Boolean(user?.collegeName && ride.collegeName && user.collegeName !== ride.collegeName);

    // Notify driver
    const notif = {
      id: `notif_${Date.now()}`,
      campusId: ride.campusId,
      userId: ride.driverId,
      type: 'ride' as const,
      title: isCrossCollege ? 'Cross-College Ride Request' : 'New Ride Request',
      message: `${user?.name} (${user?.collegeName || 'Student'}) requested to join your ride from ${ride.source} to ${ride.destination}.`,
      read: false,
      link: '/carpool',
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(notif);
    sendRealTimeNotification(ride.driverId, notif);

    const enriched = enrichRide(ride);
    broadcastRideUpdate(enriched, ride.driverId, passengerRecord);

    res.json({
      success: true,
      message: 'Join request sent to the driver! You will be notified once accepted.',
      ride: enriched
    });
  },

  handleSeatRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { passengerId, action } = req.body; // action: 'accept' | 'reject'
    const ride = db.rides.find(r => r.id === req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (ride.driverId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the driver can manage seat requests.' });
    }

    const passenger = ride.passengers.find(p => p.passengerId === passengerId);
    if (!passenger) return res.status(404).json({ success: false, message: 'Passenger request not found.' });

    if (action === 'accept') {
      if (ride.seatsAvailable <= 0) {
        return res.status(400).json({ success: false, message: 'No seats left to accept this passenger.' });
      }
      passenger.status = 'accepted';
      ride.seatsAvailable -= passenger.seatsBooked;

      // Notify passenger
      const notif = {
        id: `notif_${Date.now()}`,
        campusId: ride.campusId,
        userId: passengerId,
        type: 'ride' as const,
        title: 'Ride Request Accepted!',
        message: `${ride.driverName} accepted your carpool request for ${ride.source} → ${ride.destination}.`,
        read: false,
        link: '/carpool',
        createdAt: new Date().toISOString()
      };
      db.notifications.unshift(notif);
      sendRealTimeNotification(passengerId, notif);
    } else {
      passenger.status = 'rejected';
    }

    const enriched = enrichRide(ride);
    broadcastRideDecision(enriched, passengerId, action === 'accept' ? 'accepted' : 'rejected');

    res.json({ success: true, message: `Passenger request ${action}ed successfully.`, ride: enriched });
  },

  withdrawRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const ride = db.rides.find(r => r.id === req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    const passengerIndex = ride.passengers.findIndex(p => p.passengerId === req.user?.userId);
    if (passengerIndex === -1) {
      return res.status(404).json({ success: false, message: 'No request found for this ride.' });
    }

    const passenger = ride.passengers[passengerIndex];
    if (passenger.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw request after it has already been accepted by the driver.'
      });
    }

    // Remove the passenger request
    ride.passengers.splice(passengerIndex, 1);

    const user = db.users.find(u => u.id === req.user?.userId);

    // Notify driver that the request was withdrawn
    const notif = {
      id: `notif_${Date.now()}`,
      campusId: ride.campusId,
      userId: ride.driverId,
      type: 'ride' as const,
      title: 'Ride Request Withdrawn',
      message: `${user?.name || req.user.name} withdrew their carpool seat request for ${ride.source} → ${ride.destination}.`,
      read: false,
      link: '/carpool',
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(notif);
    sendRealTimeNotification(ride.driverId, notif);

    const enriched = enrichRide(ride);
    broadcastRideWithdrawal(enriched, ride.driverId, req.user.userId);

    res.json({
      success: true,
      message: 'Your seat request has been withdrawn.',
      ride: enriched
    });
  },

  deleteRide(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const rideIndex = db.rides.findIndex(r => r.id === req.params.id);
    if (rideIndex === -1) return res.status(404).json({ success: false, message: 'Ride not found.' });

    const ride = db.rides[rideIndex];
    if (ride.driverId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the driver can delete this ride listing.' });
    }

    db.rides.splice(rideIndex, 1);
    broadcastRideUpdate({ id: ride.id, status: 'cancelled' });

    res.json({ success: true, message: 'Ride listing deleted successfully.' });
  },

  calculateCostSplit(req: AuthenticatedRequest, res: Response) {
    const { distanceKm, fuelPricePerLitre = 1.2, mileageKmPerLitre = 15, passengersCount = 3, tollCharges = 0 } = req.body;
    const dist = Number(distanceKm) || 20;
    const passengers = Math.max(1, Number(passengersCount) || 1);
    const fuelLitreNeeded = dist / Number(mileageKmPerLitre);
    const fuelCost = fuelLitreNeeded * Number(fuelPricePerLitre);
    const totalTripCost = fuelCost + Number(tollCharges);
    const costPerPerson = totalTripCost / (passengers + 1); // driver + passengers

    res.json({
      success: true,
      calculation: {
        distanceKm: dist,
        fuelCost: Number(fuelCost.toFixed(2)),
        tollCharges: Number(tollCharges),
        totalTripCost: Number(totalTripCost.toFixed(2)),
        passengersCount: passengers,
        costPerPerson: Number(costPerPerson.toFixed(2)),
        suggestedSeatPrice: Math.ceil(costPerPerson)
      }
    });
  }
};

