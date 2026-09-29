import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Ride } from '../../types.ts';
import {
  Car,
  Bike,
  Plus,
  Search,
  Users,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calculator,
  RefreshCw,
  Phone
} from '../icons.tsx';
import { Compass, ExternalLink, Navigation, Trash2 } from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge.tsx';

export const CarpoolView: React.FC = () => {
  const { user, openChat, showAlert, openAIAssistant, socket } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: All Rides, My Posted Rides (Driver), My Requested Rides (Passenger)
  const [viewTab, setViewTab] = useState<'all' | 'my_posted' | 'my_booked'>('all');

  // Filters
  const [filterSource, setFilterSource] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterCampus, setFilterCampus] = useState('all');

  // Modal States
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  // New Ride Form
  const [newSource, setNewSource] = useState('');
  const [newPickupMapsUrl, setNewPickupMapsUrl] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newDestinationMapsUrl, setNewDestinationMapsUrl] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('08:30 AM');
  const [newVehicleType, setNewVehicleType] = useState<'Car' | 'Scooty' | 'Bike'>('Car');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newSeats, setNewSeats] = useState(3);
  const [newPrice, setNewPrice] = useState(50);
  const [newRecurring, setNewRecurring] = useState(false);
  const [newRecurrencePattern, setNewRecurrencePattern] = useState('Weekdays (Mon-Fri)');
  const [newNotes, setNewNotes] = useState('');

  // Cost Split Calculator State
  const [calcDist, setCalcDist] = useState(25);
  const [calcFuelPrice, setCalcFuelPrice] = useState(1.3);
  const [calcMileage, setCalcMileage] = useState(14);
  const [calcPassengers, setCalcPassengers] = useState(3);
  const [calcToll, setCalcToll] = useState(0);
  const [splitResult, setSplitResult] = useState<any>(null);

  const fetchRides = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: Record<string, string> = {};
      if (filterCampus !== 'all') params.campusId = filterCampus;
      if (filterSource) params.source = filterSource;
      if (filterDestination) params.destination = filterDestination;
      if (filterVehicle !== 'all') params.vehicleType = filterVehicle;

      const res = await api.getRides(params);
      if (res.success) {
        setRides(res.rides);
      }
    } catch (err: any) {
      console.warn('Rides fetch notice:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [filterCampus, filterVehicle]);

  // Real-time synchronization: Listen to socket ride updates & requests
  useEffect(() => {
    if (!socket) return;

    const handleRideEvent = (data: any) => {
      fetchRides(true);
      if (data?.passengerRecord) {
        showAlert(`⚡ Incoming seat request from ${data.passengerRecord.passengerName}!`, 'info');
      }
    };

    socket.on('ride_updated', handleRideEvent);
    socket.on('ride_request_received', handleRideEvent);
    socket.on('ride_request_withdrawn', handleRideEvent);
    socket.on('ride_status_updated', handleRideEvent);

    return () => {
      socket.off('ride_updated', handleRideEvent);
      socket.off('ride_request_received', handleRideEvent);
      socket.off('ride_request_withdrawn', handleRideEvent);
      socket.off('ride_status_updated', handleRideEvent);
    };
  }, [socket]);

  // Fallback 4-second auto-poll to ensure near-instant request delivery in sandbox
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchRides(true);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [filterCampus, filterSource, filterDestination, filterVehicle]);

  // Helpers for identifying user relations to rides
  const checkIsMyRide = (ride: Ride) => {
    if (!user) return false;
    const uId = String(user.id || (user as any).userId || '').trim().toLowerCase();
    const rId = String(ride.driverId || '').trim().toLowerCase();
    if (uId && rId && uId === rId) return true;
    if (user.email && ride.driverEmail && user.email.toLowerCase() === ride.driverEmail.toLowerCase()) return true;
    if (user.name && ride.driverName && user.name.trim().toLowerCase() === ride.driverName.trim().toLowerCase() && ride.collegeName === user.collegeName) return true;
    return false;
  };

  const checkHasRequested = (ride: Ride) => {
    if (!user) return false;
    const uId = String(user.id || (user as any).userId || '').trim().toLowerCase();
    const uName = String(user.name || '').trim().toLowerCase();
    return (ride.passengers || []).some(p => {
      const pId = String(p.passengerId || '').trim().toLowerCase();
      const pName = String(p.passengerName || '').trim().toLowerCase();
      return (uId && pId && uId === pId) || (uName && pName && uName === pName);
    });
  };

  const getMyPassengerRecord = (ride: Ride) => {
    if (!user) return undefined;
    const uId = String(user.id || (user as any).userId || '').trim().toLowerCase();
    const uName = String(user.name || '').trim().toLowerCase();
    return (ride.passengers || []).find(p => {
      const pId = String(p.passengerId || '').trim().toLowerCase();
      const pName = String(p.passengerName || '').trim().toLowerCase();
      return (uId && pId && uId === pId) || (uName && pName && uName === pName);
    });
  };

  // Compute segmented lists
  const myPostedRides = rides.filter(checkIsMyRide);
  const myRequestedRides = rides.filter(checkHasRequested);

  // Incoming pending requests for the current driver across all their rides
  const incomingPendingRequests = myPostedRides.flatMap(r =>
    (r.passengers || []).filter(p => p.status === 'pending').map(p => ({ ride: r, passenger: p }))
  );

  const displayedRides = viewTab === 'my_posted'
    ? myPostedRides
    : viewTab === 'my_booked'
    ? myRequestedRides
    : rides;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createRide({
        source: newSource,
        pickupMapsUrl: newPickupMapsUrl.trim() || undefined,
        destination: newDestination,
        destinationMapsUrl: newDestinationMapsUrl.trim() || undefined,
        date: newDate,
        time: newTime,
        vehicleType: newVehicleType,
        vehicleModel: newVehicleModel || `${newVehicleType} Commute`,
        seatsTotal: newSeats,
        pricePerSeat: newPrice,
        recurring: newRecurring,
        recurrencePattern: newRecurring ? newRecurrencePattern : undefined,
        notes: newNotes
      });

      if (res.success) {
        showAlert('Carpool ride published! Fellow students can now request to join.', 'success');
        setShowPostModal(false);
        fetchRides();
        // reset
        setNewSource('');
        setNewPickupMapsUrl('');
        setNewDestination('');
        setNewDestinationMapsUrl('');
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to post ride', 'error');
    }
  };

  const handleRequestSeat = async (rideId: string) => {
    try {
      const res = await api.requestSeat(rideId);
      if (res.success) {
        showAlert('Join request sent to the driver!', 'success');
        fetchRides();
      }
    } catch (err: any) {
      showAlert(err.message || 'Request failed', 'error');
    }
  };

  const handleWithdrawSeatRequest = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to withdraw your ride join request?')) {
      return;
    }
    try {
      const res = await api.withdrawSeatRequest(rideId);
      if (res.success) {
        showAlert('Your ride request has been withdrawn.', 'info');
        fetchRides();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to withdraw request', 'error');
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to cancel and delete this ride listing?')) {
      return;
    }
    try {
      const res = await api.deleteRide(rideId);
      if (res.success) {
        showAlert('Ride listing deleted successfully.', 'success');
        fetchRides();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete ride', 'error');
    }
  };

  const handleManagePassenger = async (rideId: string, passengerId: string, action: 'accept' | 'reject') => {
    try {
      const res = await api.managePassenger(rideId, passengerId, action);
      if (res.success) {
        showAlert(`Passenger request ${action}ed!`, 'success');
        fetchRides();
      }
    } catch (err: any) {
      showAlert(err.message || 'Action failed', 'error');
    }
  };

  const runCostCalculation = async () => {
    try {
      const res = await api.calcCostSplit({
        distanceKm: calcDist,
        fuelPricePerLitre: calcFuelPrice,
        mileageKmPerLitre: calcMileage,
        passengersCount: calcPassengers,
        tollCharges: calcToll
      });
      if (res.success) {
        setSplitResult(res.calculation);
      }
    } catch (err) {
      console.warn('Cost calc notice:', err);
    }
  };

  useEffect(() => {
    if (showCalcModal) {
      runCostCalculation();
    }
  }, [showCalcModal, calcDist, calcFuelPrice, calcMileage, calcPassengers, calcToll]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <span>🚗 Car & Scooty Pooling</span>
              <span>•</span>
              <span>Campus Verified Students Only</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Share Rides, Cut Fuel Costs, Commute Together
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Connect with fellow students traveling the same route from dorms, off-campus flats, or metro stations. Built-in cost split calculator and chat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCalcModal(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              Cost Split Calculator
            </button>
            <button
              onClick={() => setShowPostModal(true)}
              className="bg-white hover:bg-emerald-50 text-emerald-800 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Post a Ride
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              University
            </label>
            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="all">🌐 All Partner Universities</option>
              <option value="campus_stanford">Stanford University</option>
              <option value="campus_berkeley">UC Berkeley</option>
              <option value="campus_mit">MIT</option>
              <option value="campus_iitd">IIT Delhi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pickup / Source
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                placeholder="e.g. Tresidder Union / Gate"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Destination
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filterDestination}
                onChange={(e) => setFilterDestination(e.target.value)}
                placeholder="e.g. Caltrain / SDA Market"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Vehicle Type
            </label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Vehicles (Car, Scooty, Bike)</option>
              <option value="Car">🚗 Carpool Only</option>
              <option value="Scooty">🛵 Scooty / Moped</option>
              <option value="Bike">🏍️ Motorcycle / Bike</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Filter Rides
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterCampus('all');
                setFilterSource('');
                setFilterDestination('');
                setFilterVehicle('all');
                fetchRides();
              }}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Google Maps Nearby Carpool & Pickup Point Tracker */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-4 rounded-xl shadow-sm border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Navigation className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white">Google Maps Carpooling & Pickup Point Tracker</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                  Live Grounding
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Track safe campus meeting hubs, student loading zones, and estimate transit times around <span className="text-emerald-300 font-semibold">{user?.collegeName || 'your university'}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${user?.collegeName || 'Campus'} transit bus loop carpool pickup`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Transit Map ↗</span>
            </a>
            <button
              onClick={() =>
                openAIAssistant(
                  'carpool',
                  `Find nearby carpool pickup points and safe rideshare loading zones around ${user?.collegeName || 'campus'}`
                )
              }
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>AI Commute Advisor</span>
            </button>
          </div>
        </div>

        {/* Quick Designated Pickup Spot Chips with direct Google Maps URLs */}
        <div className="mt-3 pt-3 border-t border-emerald-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-emerald-300/80 font-medium shrink-0">Popular Pickup Hubs:</span>
          {[
            { name: 'Student Union Bus Circle', query: `${user?.collegeName || 'University'} Student Union Loop` },
            { name: 'North Gate Rideshare Turnaround', query: `${user?.collegeName || 'University'} North Gate` },
            { name: 'Downtown Caltrain / Metro Interchange', query: `${user?.collegeName || 'University'} Transit Station` },
            { name: 'Engineering Quad Circle', query: `${user?.collegeName || 'University'} Engineering Quad` }
          ].map((hub, idx) => (
            <a
              key={idx}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hub.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-emerald-200 px-2.5 py-1 rounded-md border border-emerald-500/20 whitespace-nowrap flex items-center gap-1 transition shrink-0"
            >
              <MapPin className="w-2.5 h-2.5 text-emerald-400" />
              <span>{hub.name}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          ))}
        </div>
      </div>

      {/* Driver Priority Alert: Incoming Pending Seat Requests (Direct High-Visibility Callout) */}
      {incomingPendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border-2 border-amber-500 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-amber-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
              </span>
              <h3 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                ⚡ Action Required: {incomingPendingRequests.length} Incoming Seat Request(s)
              </h3>
            </div>
            <span className="text-xs bg-amber-200 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Review & Approve Below
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {incomingPendingRequests.map(({ ride, passenger }) => (
              <div key={`${ride.id}_${passenger.passengerId}`} className="bg-white rounded-xl border border-amber-300 p-3.5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={passenger.passengerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        <span>{passenger.passengerName}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-300">
                          1 Seat
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        🏛️ {passenger.passengerCollege || 'Verified Student'}
                      </div>
                      <div className="text-xs text-emerald-800 font-medium mt-0.5 truncate">
                        Route: {ride.source} → {ride.destination}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleManagePassenger(ride.id, passenger.passengerId, 'accept')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>
                  <button
                    onClick={() => handleManagePassenger(ride.id, passenger.passengerId, 'reject')}
                    className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-300 font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rides List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{viewTab === 'my_posted' ? 'My Posted Rides' : viewTab === 'my_booked' ? 'My Requested Rides' : 'Available Campus Rides'}</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
                {displayedRides.length}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setViewTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Rides ({rides.length})
            </button>
            <button
              onClick={() => setViewTab('my_posted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'my_posted'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>My Rides ({myPostedRides.length})</span>
              {incomingPendingRequests.length > 0 && (
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                  {incomingPendingRequests.length} Req!
                </span>
              )}
            </button>
            <button
              onClick={() => setViewTab('my_booked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === 'my_booked'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              My Requests ({myRequestedRides.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            Loading campus rides...
          </div>
        ) : displayedRides.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="font-bold text-slate-700 text-base">
              {viewTab === 'my_posted'
                ? "You haven't posted any rides yet"
                : viewTab === 'my_booked'
                ? "You haven't requested any rides yet"
                : 'No rides posted matching this route'}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {viewTab === 'my_posted'
                ? 'Offer empty seats on your daily commute or weekend trips to help campus peers!'
                : viewTab === 'my_booked'
                ? 'Browse available campus rides and request a seat with verified peers.'
                : 'Be the first student to post a car or scooty ride from campus and split fuel costs!'}
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Post a Ride
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedRides.map((ride) => {
              const isMyRide = checkIsMyRide(ride);
              const myRecord = getMyPassengerRecord(ride);
              const hasRequested = Boolean(myRecord);
              const myStatus = myRecord?.status;

              return (
                <div
                  key={ride.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Driver info & Vehicle badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={ride.driverAvatar}
                          alt={ride.driverName}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{ride.driverName}</span>
                            <VerifiedBadge isVerified={true} showLabel={false} size="xs" />
                            {isMyRide && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                  Your Ride
                                </span>
                                <button
                                  onClick={() => handleDeleteRide(ride.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Delete Ride Listing"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>{ride.vehicleModel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                              🏛️ {ride.collegeName || 'Verified University'}
                            </span>
                            {ride.collegeName && user?.collegeName && ride.collegeName !== user.collegeName && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                                🌐 Cross-Campus Ride
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                            ride.vehicleType === 'Car'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ride.vehicleType === 'Car' ? <Car className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                          {ride.vehicleType}
                        </span>
                        {ride.recurring && (
                          <span className="text-[10px] text-emerald-700 font-semibold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {ride.recurrencePattern}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Route Details with optional Pickup & Destination Google Maps Links */}
                    <div className="mt-4 bg-slate-50 rounded-xl p-3 space-y-2 text-xs border border-slate-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-2 ring-emerald-100"></div>
                          <div className="truncate">
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">PICKUP LOCATION</span>
                            <span className="font-semibold text-slate-800 text-xs block truncate">{ride.source}</span>
                          </div>
                        </div>
                        {ride.pickupMapsUrl && (
                          <a
                            href={ride.pickupMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[10px] text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 font-bold px-2 py-0.5 rounded-md border border-emerald-300 transition flex items-center gap-1"
                            title="Open Pickup Location on Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>Pickup Map ↗</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0 ring-2 ring-indigo-100"></div>
                          <div className="truncate">
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">FINAL DESTINATION</span>
                            <span className="font-semibold text-slate-800 text-xs block truncate">{ride.destination}</span>
                          </div>
                        </div>
                        {ride.destinationMapsUrl && (
                          <a
                            href={ride.destinationMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[10px] text-indigo-700 bg-indigo-100/70 hover:bg-indigo-200 font-bold px-2 py-0.5 rounded-md border border-indigo-300 transition flex items-center gap-1"
                            title="Open Destination on Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-indigo-600" />
                            <span>Dest Map ↗</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Timing & Seats */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">DATE</span>
                        <span className="font-bold text-slate-700">{ride.date}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">DEPARTURE</span>
                        <span className="font-bold text-slate-700">{ride.time}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 block font-semibold">PRICE / SEAT</span>
                        <span className="font-extrabold text-emerald-800 text-sm">
                          {ride.pricePerSeat === 0 ? 'FREE' : `₹${ride.pricePerSeat}`}
                        </span>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {ride.notes && (
                      <p className="mt-2.5 text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                        "{ride.notes}"
                      </p>
                    )}

                    {/* Passenger Request Status Callout for current user */}
                    {!isMyRide && hasRequested && myStatus === 'pending' && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                            <Clock className="w-4 h-4 text-amber-700" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-amber-950 block text-xs">Your Seat Request is Pending</span>
                            <span className="text-[11px] text-amber-800">Awaiting driver response. You can withdraw anytime before acceptance.</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleWithdrawSeatRequest(ride.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                          title="Withdraw request before driver accepts"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Withdraw</span>
                        </button>
                      </div>
                    )}

                    {!isMyRide && hasRequested && myStatus === 'accepted' && (
                      <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl flex items-center gap-2.5 text-xs text-emerald-950">
                        <div className="w-8 h-8 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <span className="font-extrabold text-emerald-950 block text-xs">✓ You're Confirmed for this Ride!</span>
                          <span className="text-[11px] text-emerald-800">The driver accepted your seat. Coordinate via Ride Chat.</span>
                        </div>
                      </div>
                    )}

                    {/* Driver Passenger Management Section (Direct in Listing Box with High-Visibility Colors) */}
                    {isMyRide && (
                      <div className="mt-3.5 space-y-2">
                        {ride.passengers.some(p => p.status === 'pending') ? (
                          /* Pending Requests: High-visibility vibrant Amber/Orange Box */
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-3 shadow-xs space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                              <span className="flex items-center gap-2 font-black text-xs text-amber-900 uppercase tracking-wide">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <span>Action Required: {ride.passengers.filter(p => p.status === 'pending').length} Pending Seat Request(s)</span>
                              </span>
                              <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-md">
                                Respond Now
                              </span>
                            </div>

                            <div className="space-y-2">
                              {ride.passengers.filter(p => p.status === 'pending').map((p) => (
                                <div
                                  key={p.passengerId}
                                  className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-amber-300 shadow-2xs gap-2"
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <img
                                      src={p.passengerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                        <span className="truncate">{p.passengerName}</span>
                                        <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                                          1 Seat
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                        <span>🏛️ {p.passengerCollege || 'Verified Student'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    <button
                                      onClick={() => handleManagePassenger(ride.id, p.passengerId, 'accept')}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Accept passenger"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      onClick={() => handleManagePassenger(ride.id, p.passengerId, 'reject')}
                                      className="px-2 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-300 font-semibold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                                      title="Decline request"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Decline</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Confirmed Passengers / Roster */}
                        {ride.passengers.some(p => p.status === 'accepted' || p.status === 'rejected') && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs space-y-1.5">
                            <div className="font-bold text-[11px] text-slate-600 uppercase tracking-wider flex items-center justify-between">
                              <span>Ride Passenger Roster</span>
                              <span className="text-[10px] text-slate-400">{ride.passengers.length} Total</span>
                            </div>
                            <div className="space-y-1">
                              {ride.passengers.filter(p => p.status !== 'pending').map((p) => (
                                <div
                                  key={p.passengerId}
                                  className="flex items-center justify-between py-1 px-1.5 rounded bg-white border border-slate-100"
                                >
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={p.passengerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                    <span className="font-semibold text-slate-800 text-[11px]">{p.passengerName}</span>
                                    {p.passengerCollege && (
                                      <span className="text-[9px] text-slate-400">({p.passengerCollege})</span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${
                                      p.status === 'accepted'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {p.status === 'accepted' ? '✓ Confirmed' : 'Declined'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {ride.passengers.length === 0 && (
                          <div className="bg-emerald-50/40 border border-dashed border-emerald-200 rounded-xl p-2.5 text-center text-xs text-emerald-800">
                            <span className="font-medium">No seat requests yet.</span> Classmates' requests appear directly in this box with instant Accept/Decline approval.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{ride.seatsAvailable}</strong> of {ride.seatsTotal} seats free
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.source)}&destination=${encodeURIComponent(ride.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        title="Open Google Maps Directions"
                      >
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Maps</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>

                      <button
                        onClick={() => openChat(`ride_${ride.id}`, `Ride Chat: ${ride.source} → ${ride.destination}`, `${ride.driverName}'s Ride`)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Ride Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </button>

                      {!isMyRide && (
                        <div className="flex items-center gap-2">
                          {hasRequested ? (
                            myStatus === 'pending' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending</span>
                                </span>
                                <button
                                  onClick={() => handleWithdrawSeatRequest(ride.id)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Withdraw your request before driver accepts"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Withdraw</span>
                                </button>
                              </div>
                            ) : myStatus === 'accepted' ? (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Confirmed ✓</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                                Declined
                              </span>
                            )
                          ) : (
                            <button
                              disabled={ride.seatsAvailable <= 0}
                              onClick={() => handleRequestSeat(ride.id)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                ride.seatsAvailable <= 0
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              {ride.seatsAvailable <= 0 ? 'Full' : 'Request Seat'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Ride Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Post a Campus Ride</h3>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-2.5 text-xs mt-3 flex items-center justify-between">
              <div>
                <span className="font-bold">Driver Campus:</span> {user?.collegeName || 'Verified University'}
              </div>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-bold px-2 py-0.5 rounded">
                🌐 Cross-College Commute
              </span>
            </div>

            <form onSubmit={handleCreateRide} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Car">🚗 Car (Carpool)</option>
                    <option value="Scooty">🛵 Scooty (Pillion)</option>
                    <option value="Bike">🏍️ Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Details</label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="e.g. Honda Civic Silver / Activa"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Pickup Location & Optional Google Maps Link */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pickup Location / Landmark <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. Campus North Gate / Hostel 4 Loop"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 text-[11px] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ExternalLink className="w-3 h-3" />
                      <span>Pickup Point Google Maps Link (Optional)</span>
                    </span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                      Optional
                    </span>
                  </label>
                  <input
                    type="url"
                    value={newPickupMapsUrl}
                    onChange={(e) => setNewPickupMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Paste Google Maps URL for exact navigation to the campus pickup gate or bus stop.
                  </p>
                </div>
              </div>

              {/* Destination & Google Maps Link */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Final Destination <span className="text-rose-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Required
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="e.g. Metro Station Gate 3 / Connaught Place / Airport"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 text-[11px] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-indigo-700">
                      <ExternalLink className="w-3 h-3" />
                      <span>Destination Google Maps Link (Optional)</span>
                    </span>
                    <span className="text-[10px] bg-slate-200/70 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                      Optional
                    </span>
                  </label>
                  <input
                    type="url"
                    value={newDestinationMapsUrl}
                    onChange={(e) => setNewDestinationMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=... or https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Paste Google Maps URL for precise final destination drop-off point.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seats Available</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={newSeats}
                    onChange={(e) => setNewSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Per Seat (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              {/* Recurring Commute Toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRecurring}
                    onChange={(e) => setNewRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Recurring Daily/Weekly Commute</span>
                </label>
                {newRecurring && (
                  <input
                    type="text"
                    value={newRecurrencePattern}
                    onChange={(e) => setNewRecurrencePattern(e.target.value)}
                    placeholder="e.g. Mon-Fri 8:30 AM or Weekends"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Preferences</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. AC on, quiet ride, spare helmet provided for scooty"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                >
                  Publish Ride
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Split Calculator Modal */}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Cost Split Calculator</h3>
              </div>
              <button
                onClick={() => setShowCalcModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500">
                Auto-calculate fair per-passenger fuel split based on trip distance, mileage, and tolls.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trip Distance (km): <span className="font-bold text-emerald-700">{calcDist} km</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={calcDist}
                  onChange={(e) => setCalcDist(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Price (₹/L)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcFuelPrice}
                    onChange={(e) => setCalcFuelPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Mileage (km/L)</label>
                  <input
                    type="number"
                    value={calcMileage}
                    onChange={(e) => setCalcMileage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passengers to Split</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={calcPassengers}
                    onChange={(e) => setCalcPassengers(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tolls / Parking (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={calcToll}
                    onChange={(e) => setCalcToll(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Live Calculation Output */}
              {splitResult && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 space-y-2 mt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Fuel & Toll Cost:</span>
                    <span className="font-bold text-slate-900">${splitResult.totalTripCost}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Split Between:</span>
                    <span className="font-medium text-slate-800">
                      1 Driver + {splitResult.passengersCount} Passengers
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                    <span className="font-bold text-emerald-900 text-sm">Cost Per Person:</span>
                    <span className="font-black text-emerald-700 text-lg">
                      ${splitResult.costPerPerson}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-800 text-right">
                    Suggested listing price per seat: <strong>${splitResult.suggestedSeatPrice}</strong>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setNewPrice(splitResult?.suggestedSeatPrice || 5);
                    setShowCalcModal(false);
                    setShowPostModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Use ${splitResult?.suggestedSeatPrice || 5} to Post Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
