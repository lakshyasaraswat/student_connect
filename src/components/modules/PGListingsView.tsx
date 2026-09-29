import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { PGListing } from '../../types.ts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Star,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Home,
  Wifi,
  Wind,
  Coffee,
  Tv,
  Car,
  MessageSquare
} from '../icons.tsx';
import { Compass, ExternalLink, Navigation, Trash2, Upload, Check, Image as ImageIcon } from 'lucide-react';

const DEFAULT_FLAT_PHOTOS = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
];

const PRESET_FLAT_PHOTOS = [
  { label: 'Furnished Bedroom', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80' },
  { label: 'Living Room', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { label: 'Modern Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  { label: 'Study Setup', url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80' },
  { label: 'Clean Washroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' }
];

export const PGListingsView: React.FC = () => {
  const { user, openChat, showAlert, openAIAssistant } = useAuth();
  const [listings, setListings] = useState<PGListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters (default to high rent threshold for INR so all listings show)
  const [maxRent, setMaxRent] = useState(60000);
  const [maxDistance, setMaxDistance] = useState(15);
  const [selectedType, setSelectedType] = useState('All');
  const [genderPref, setGenderPref] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<PGListing | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Post Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'PG' | 'Flat' | 'Hostel' | 'Studio'>('Flat');
  const [rent, setRent] = useState(8500);
  const [deposit, setDeposit] = useState(12000);
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(1.5);
  const [genderPreference, setGenderPreference] = useState<'Boys' | 'Girls' | 'Any'>('Any');
  const [amenitiesStr, setAmenitiesStr] = useState('High-Speed WiFi, AC, Furnished, Kitchen, Washer');
  const [rulesStr, setRulesStr] = useState('Quiet study hours after 10 PM, Students preferred');
  const [ownerContact, setOwnerContact] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  // Photos state for flat listing
  const [photos, setPhotos] = useState<string[]>(DEFAULT_FLAT_PHOTOS);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // Leaflet Map Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        maxRent: maxRent.toString(),
        maxDistance: maxDistance.toString()
      };
      if (user?.campusId) params.campusId = user.campusId;
      if (selectedType !== 'All') params.type = selectedType;
      if (genderPref !== 'All') params.genderPreference = genderPref;
      if (searchTerm) params.search = searchTerm;

      const res = await api.getListings(params);
      if (res.success) {
        setListings(res.listings);
      }
    } catch (err) {
      console.warn('Listings fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user?.campusId, selectedType, genderPref]);

  // Handle uploading photos from device
  const handlePhotoFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          setPhotos((prev) => [...prev, url]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle adding photo via URL
  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    setPhotos((prev) => [...prev, photoUrlInput.trim()]);
    setPhotoUrlInput('');
  };

  // Delete listing (restricted to owner or admin)
  const handleDeleteListing = async (listingId: string, listingTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the listing "${listingTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.deleteListing(listingId);
      if (res.success) {
        showAlert('Housing listing deleted successfully.', 'success');
        if (selectedListing?.id === listingId) {
          setSelectedListing(null);
        }
        fetchListings();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete listing', 'error');
    }
  };

  // Leaflet Map Initialization & Markers Update
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    // Fix leaflet default marker icon
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    if (!mapInstanceRef.current) {
      const center = listings[0]?.location || { lat: 37.4275, lng: -122.1697 };
      const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add listing markers
    listings.forEach((listing) => {
      const marker = L.marker([listing.location.lat, listing.location.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 180px;">
            <strong style="font-size: 13px; color: #0f172a;">${listing.title}</strong>
            <div style="color: #059669; font-weight: bold; margin-top: 2px;">₹${listing.rent.toLocaleString()}/mo</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${listing.location.distanceToCampusKm} km from campus</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">${listing.location.address}</div>
          </div>
        `);
      markersRef.current.push(marker);
    });

    if (listings.length > 0 && mapInstanceRef.current) {
      const group = L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Keep map alive unless destroyed
    };
  }, [viewMode, listings]);

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validPhotos = photos.filter(Boolean).length > 0 ? photos.filter(Boolean) : DEFAULT_FLAT_PHOTOS;
      const res = await api.createListing({
        title,
        type,
        rent: Number(rent),
        deposit: Number(deposit),
        address,
        distanceToCampusKm: Number(distanceKm),
        genderPreference,
        amenities: amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean),
        rules: rulesStr.split(',').map((s) => s.trim()).filter(Boolean),
        photos: validPhotos,
        ownerContact,
        mapsUrl: mapsUrl.trim() || undefined
      });

      if (res.success) {
        showAlert('PG / Flat listing posted and marked on campus interactive map!', 'success');
        setShowPostModal(false);
        // Ensure maxRent allows the newly posted listing to be immediately visible
        if (Number(rent) > maxRent) {
          setMaxRent(Number(rent) + 5000);
        }
        fetchListings();
        // reset form
        setTitle('');
        setAddress('');
        setMapsUrl('');
        setPhotos(DEFAULT_FLAT_PHOTOS);
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to post listing', 'error');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    try {
      const res = await api.addListingReview(selectedListing.id, reviewRating, reviewComment);
      if (res.success) {
        showAlert('Review submitted for PG/Flat listing!', 'success');
        setReviewComment('');
        setSelectedListing(res.listing);
        fetchListings();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to post review', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <span>🏘️ PG & Flat Listings</span>
              <span>•</span>
              <span>Verified Campus Housing & Map View</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Student Housing, Shared Flats & PG Accommodations
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Discover student-friendly accommodations near {user?.collegeName}. View exact distances, verified amenities, landlord reviews, and interactive map pins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-emerald-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-emerald-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Map View
              </button>
            </div>

            <button
              onClick={() => setShowPostModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Post PG / Flat
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">
              Search Neighborhood or Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                placeholder="e.g. Menlo Park, Furnished, Balcony..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">
              Property Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">All Housing (Flat, PG, Studio)</option>
              <option value="Flat">Flat / Apartment</option>
              <option value="PG">Paying Guest (PG)</option>
              <option value="Studio">Studio Apartment</option>
              <option value="Hostel">Off-Campus Hostel</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1 text-[10px]">
              Gender Preference
            </label>
            <select
              value={genderPref}
              onChange={(e) => setGenderPref(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">Any Gender / Mixed</option>
              <option value="Boys">Boys Only</option>
              <option value="Girls">Girls Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchListings}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg transition cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Sliders for Rent & Distance */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-slate-600 font-semibold mb-1">
              <span>Max Rent:</span>
              <span className="font-bold text-emerald-700">₹{maxRent.toLocaleString()}/mo</span>
            </div>
            <input
              type="range"
              min="2000"
              max="100000"
              step="1000"
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-600 font-semibold mb-1">
              <span>Max Distance from Campus:</span>
              <span className="font-bold text-emerald-700">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Google Maps PG Rents & Student Housing Grounding Hub */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-sm border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white">Google Maps PG Rents & Housing Advisor</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  Maps Grounded
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Check real-time student PG rents, shared flat costs, and safe walking corridors around <span className="text-blue-300 font-semibold">{user?.collegeName || 'campus'}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Student PG accommodations flats hostels near ${user?.collegeName || 'campus'}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Search on Google Maps ↗</span>
            </a>
            <button
              onClick={() =>
                openAIAssistant(
                  'pg',
                  `Find verified student PG rents, shared flat benchmarks, and safe neighborhoods within 2 miles of ${user?.collegeName || 'campus'}`
                )
              }
              className="bg-blue-500 hover:bg-blue-600 text-slate-950 text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>AI Rent Advisor</span>
            </button>
          </div>
        </div>

        {/* Quick Neighborhood Rent Queries */}
        <div className="mt-3 pt-3 border-t border-blue-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-blue-300/80 font-medium shrink-0">Top Student Housing Areas:</span>
          {[
            { name: 'College Terrace PGs', query: `Student Housing PG near College Terrace ${user?.collegeName || 'University'}` },
            { name: 'Downtown Student Studios', query: `Apartments studios near ${user?.collegeName || 'University'}` },
            { name: 'Hostels & Shared Flats', query: `Student Hostels co-living near ${user?.collegeName || 'University'}` }
          ].map((area, idx) => (
            <a
              key={idx}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-blue-200 px-2.5 py-1 rounded-md border border-blue-500/20 whitespace-nowrap flex items-center gap-1 transition shrink-0"
            >
              <MapPin className="w-2.5 h-2.5 text-blue-400" />
              <span>{area.name}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          ))}
        </div>
      </div>

      {/* View Mode: Map vs Grid */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Interactive Campus Vicinity Housing Map ({listings.length} Properties)
            </div>
            <span className="text-[11px] text-slate-500">
              Click any pin to inspect rent and distance
            </span>
          </div>
          <div
            ref={mapContainerRef}
            className="w-full h-[500px] rounded-xl overflow-hidden z-10 border border-slate-200"
          ></div>
        </div>
      ) : (
        /* Cards Grid */
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Loading housing listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-700 text-base">No listings found matching these criteria</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Got a flat or PG room available near campus? Post it for incoming or current students!
              </p>
              <button
                onClick={() => setShowPostModal(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Post Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Photo Carousel Thumbnail */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {listing.type}
                        </span>
                        {listing.verified && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
                        ₹{listing.rent.toLocaleString()}<span className="text-[10px] font-normal text-slate-300">/mo</span>
                      </div>

                      <div className="absolute bottom-2 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {listing.location.distanceToCampusKm} km to Campus
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="text-slate-600 font-medium truncate max-w-[180px]">
                          {listing.location.address}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {listing.rating} ({listing.reviewsCount})
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mt-1">
                        {listing.title}
                      </h3>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {listing.amenities.slice(0, 4).map((a, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            {a}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Deposit: <strong>₹{listing.deposit.toLocaleString()}</strong></span>
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.2 rounded font-semibold">
                          Prefers: {listing.genderPreference}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedListing(listing)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                    >
                      View Details
                    </button>
                    <a
                      href={listing.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.title} ${listing.location.address}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition"
                      title={listing.mapsUrl ? "Open Flat's Google Maps Location" : "Locate on Google Maps"}
                    >
                      <Navigation className="w-4 h-4 text-blue-600" />
                    </a>
                    <button
                      onClick={() => openChat(`listing_${listing.id}`, `Housing Chat: ${listing.title}`, `Owner: ${listing.ownerName} (${listing.ownerContact})`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition cursor-pointer shadow-xs"
                      title="Direct Chat with Host"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    {/* Delete listing (restricted to listing owner or admin) */}
                    {user && (listing.ownerId === user.id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteListing(listing.id, listing.title)}
                        className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete this listing (Owner only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Details & Reviews Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {selectedListing.type} • {selectedListing.location.distanceToCampusKm} km to Campus
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{selectedListing.title}</h3>
              </div>
              <button onClick={() => setSelectedListing(null)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-2 my-4">
              {selectedListing.photos.map((p, idx) => (
                <img
                  key={idx}
                  src={p}
                  alt=""
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                />
              ))}
            </div>

            {/* Specs & Rules */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">RENT & DEPOSIT</span>
                <span className="font-bold text-slate-900 text-sm">₹{selectedListing.rent.toLocaleString()} / month</span>
                <span className="text-slate-500 block">Security Deposit: ₹{selectedListing.deposit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">HOST / OWNER</span>
                <span className="font-bold text-slate-900">{selectedListing.ownerName}</span>
                <span className="text-slate-500 block">Contact: {selectedListing.ownerContact}</span>
              </div>
            </div>

            {/* Google Maps & Chat Actions */}
            <div className="mt-3 flex items-center gap-2">
              <a
                href={selectedListing.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedListing.title} ${selectedListing.location.address}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>{selectedListing.mapsUrl ? 'Open Google Maps Link ↗' : 'Open Location in Google Maps ↗'}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedListing(null);
                  openChat(`listing_${selectedListing.id}`, `Housing Chat: ${selectedListing.title}`, `Owner: ${selectedListing.ownerName} (${selectedListing.ownerContact})`);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Host</span>
              </button>
            </div>

            {/* Delete Option for Owner */}
            {user && (selectedListing.ownerId === user.id || user.role === 'admin') && (
              <button
                type="button"
                onClick={() => handleDeleteListing(selectedListing.id, selectedListing.title)}
                className="w-full mt-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete My Housing Listing</span>
              </button>
            )}

            {/* Rules */}
            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-700 uppercase mb-1">House Rules</div>
              <div className="space-y-1">
                {selectedListing.rules.map((r, idx) => (
                  <div key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  Student Reviews ({selectedListing.reviewsCount})
                </h4>
                <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {selectedListing.rating} / 5.0
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedListing.reviews.length === 0 ? (
                  <p className="text-xs text-slate-400">No reviews yet. Be the first to review!</p>
                ) : (
                  selectedListing.reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50 p-2.5 rounded-lg text-xs">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{rev.userName}</span>
                        <span className="text-amber-600">★ {rev.rating}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleAddReview} className="mt-3 space-y-2 text-xs bg-slate-50 p-3 rounded-xl">
                <div className="font-bold text-slate-800">Add a Review</div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share feedback on wifi speed, landlord, noise levels..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Post Review
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Post PG Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">List a PG or Flat</h3>
              </div>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handlePostListing} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 2BHK Shared Flat with Balcony"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Flat">Flat / Apartment</option>
                    <option value="PG">Paying Guest (PG)</option>
                    <option value="Studio">Studio</option>
                    <option value="Hostel">Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender Preference</label>
                  <select
                    value={genderPreference}
                    onChange={(e) => setGenderPreference(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Any">Any Gender</option>
                    <option value="Boys">Boys Only</option>
                    <option value="Girls">Girls Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={rent}
                    onChange={(e) => setRent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    placeholder="e.g. 8500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deposit (₹)</label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    placeholder="e.g. 15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address / Street</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 450 Serra Mall, Palo Alto"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Distance to Campus (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google Maps Location Link of Flat / PG (Optional)
                </label>
                <input
                  type="url"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
                <span className="text-[10px] text-slate-400">Add the exact Google Maps location link of the flat or building</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amenities (Comma-separated)</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={(e) => setAmenitiesStr(e.target.value)}
                  placeholder="e.g. WiFi, AC, Food Included, Washer, Power Backup"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              {/* Flat & Room Photos Upload Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Flat Photos ({photos.length}) <span className="text-emerald-600 font-semibold">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Upload images or select presets</span>
                </div>

                {/* Previews Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-2xs">
                        <img src={url} alt={`Flat photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            Cover Photo
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] transition cursor-pointer"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload & URL input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl cursor-pointer transition text-emerald-800 font-semibold text-xs text-center">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Upload from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoFilesUpload}
                    />
                  </label>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste image link..."
                      className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Preset Flat Photos */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quick Sample Photos of the Flat:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FLAT_PHOTOS.map((preset, idx) => {
                      const isAdded = photos.includes(preset.url);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setPhotos(photos.filter((p) => p !== preset.url));
                            } else {
                              setPhotos([...photos, preset.url]);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {isAdded ? <Check className="w-3 h-3 text-emerald-700" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Details (Phone / Email)</label>
                <input
                  type="text"
                  value={ownerContact}
                  onChange={(e) => setOwnerContact(e.target.value)}
                  placeholder="e.g. In-app chat or +1 (555) 234-5678"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Publish Housing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
