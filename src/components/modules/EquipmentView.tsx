import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Equipment } from '../../types.ts';
import {
  Wrench,
  Plus,
  Search,
  Clock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Tag,
  DollarSign,
  Layers,
  ArrowRight
} from '../icons.tsx';
import { ShoppingBag, Trash2, Upload, Sparkles, Image, Check, X, MessageSquare } from 'lucide-react';

const PRESET_EQUIPMENT_PHOTOS = [
  { label: 'Multimeter', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
  { label: 'Calculator', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80' },
  { label: 'DSLR Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80' },
  { label: 'Arduino / Kit', url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80' },
  { label: 'Drafting Tools', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80' },
  { label: 'Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
];

export const EquipmentView: React.FC = () => {
  const { user, showAlert, openChat } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [campusFilter, setCampusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_rentals'>('catalog');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [rentingItem, setRentingItem] = useState<Equipment | null>(null);
  const [rentDays, setRentDays] = useState(3);
  const [purchasingItem, setPurchasingItem] = useState<Equipment | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // New Equipment Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Engineering Tools');
  const [condition, setCondition] = useState<any>('Good');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [lateFeePerDay, setLateFeePerDay] = useState(0);
  const [allowBuy, setAllowBuy] = useState(false);
  const [buyPrice, setBuyPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState(PRESET_EQUIPMENT_PHOTOS[0].url);
  const [availabilityDays, setAvailabilityDays] = useState('Mon - Fri (Campus Lab)');

  const categories = [
    'All',
    'Engineering Tools',
    'Lab Kits',
    'Calculators',
    'Electronics',
    'Cameras',
    'Sports',
    'Books'
  ];

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (campusFilter !== 'all') params.campusId = campusFilter;
      if (selectedCategory !== 'All' && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) params.search = searchTerm;

      const res = await api.getEquipment(params);
      if (res.success) {
        setEquipmentList(res.equipment);
      }
    } catch (err) {
      console.warn('Equipment fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [campusFilter, selectedCategory]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        showAlert('Selected photo is too large. Please select an image under 4MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          showAlert('Equipment photo uploaded successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEquipment({
        name: name.trim(),
        category,
        condition,
        description: description.trim(),
        pricePerDay: Number(pricePerDay) >= 0 ? Number(pricePerDay) : 0,
        deposit: Number(deposit) >= 0 ? Number(deposit) : 0,
        lateFeePerDay: Number(lateFeePerDay) >= 0 ? Number(lateFeePerDay) : 0,
        allowBuy: Boolean(allowBuy),
        buyPrice: allowBuy ? (Number(buyPrice) >= 0 ? Number(buyPrice) : 0) : undefined,
        imageUrl: imageUrl || PRESET_EQUIPMENT_PHOTOS[0].url,
        availabilityDays
      });

      if (res.success) {
        showAlert('Equipment listed successfully!', 'success');
        setShowAddModal(false);
        fetchEquipment();
        // reset
        setName('');
        setDescription('');
        setPricePerDay(0);
        setDeposit(0);
        setLateFeePerDay(0);
        setAllowBuy(false);
        setBuyPrice(0);
        setImageUrl(PRESET_EQUIPMENT_PHOTOS[0].url);
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to list equipment', 'error');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!purchasingItem) return;
    try {
      setIsPurchasing(true);
      const res = await api.purchaseEquipment(purchasingItem.id);
      if (res.success) {
        showAlert(res.message || 'Equipment purchased permanently!', 'success');
        setPurchasingItem(null);
        fetchEquipment();
      }
    } catch (err: any) {
      showAlert(err.message || 'Purchase failed', 'error');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDeleteEquipment = async (id: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete your listing for "${itemName}"?`)) return;
    try {
      const res = await api.deleteEquipment(id);
      if (res.success) {
        showAlert('Equipment listing removed.', 'success');
        fetchEquipment();
      }
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete listing', 'error');
    }
  };

  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentingItem) return;
    try {
      const res = await api.rentEquipment(rentingItem.id, rentDays);
      if (res.success) {
        showAlert(
          `Rental confirmed for ${rentDays} days! Deposit ($${rentingItem.deposit}) is safely held in campus escrow.`,
          'success'
        );
        setRentingItem(null);
        fetchEquipment();
      }
    } catch (err: any) {
      showAlert(err.message || 'Rental request failed', 'error');
    }
  };

  const handleReturnEquipment = async (item: Equipment) => {
    try {
      const res = await api.returnEquipment(item.id);
      if (res.success) {
        showAlert(
          `Item marked as returned! Escrow security deposit ($${res.depositRefunded}) returned to renter.`,
          'success'
        );
        fetchEquipment();
      }
    } catch (err: any) {
      showAlert(err.message || 'Return processing failed', 'error');
    }
  };

  const myRentedItems = equipmentList.filter(
    (e) => e.activeRental?.renterId === user?.id || e.ownerId === user?.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <span>🔧 Equipment & Tool Sharing</span>
              <span>•</span>
              <span>Deposit Escrow & Due-Date Tracking</span>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight">
              Rent & Lend Lab Equipment, Engineering Kits, and Cameras
            </h1>
            <p className="text-amber-100 text-sm mt-1 max-w-xl">
              Borrow expensive multimeters, graphing calculators, drafting sets, or soldering stations for lab projects without buying new. Security deposits are safely locked in escrow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/20">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'catalog' ? 'bg-white text-amber-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Available Gear
              </button>
              <button
                onClick={() => setActiveTab('my_rentals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'my_rentals' ? 'bg-white text-amber-900 shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Active Rentals & Due Dates ({myRentedItems.length})
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white hover:bg-amber-50 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              List Equipment
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Category Chips & Search */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    (cat === 'All' && selectedCategory === 'all') || selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full flex items-center">
                <Search className="w-4 h-4 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchEquipment()}
                  placeholder="Search tools, calculators, lab gear across campuses (e.g. TI-84, Arduino, Multimeter)..."
                  className="w-full px-2 py-1 text-xs focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="all">🌐 All Universities</option>
                  <option value="campus_stanford">Stanford University</option>
                  <option value="campus_berkeley">UC Berkeley</option>
                  <option value="campus_mit">MIT</option>
                  <option value="campus_iitd">IIT Delhi</option>
                </select>
                <button
                  onClick={fetchEquipment}
                  className="bg-slate-900 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                >
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-200">
              Loading campus equipment...
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-700 text-base">No equipment available in this category</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Got a spare calculator, camera, or lab sensor? List it to earn rent from campus peers!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                List Equipment Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {equipmentList.map((item) => {
                const isOwner = item.ownerId === user?.id;
                const isRented = item.status === 'rented';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.condition === 'Brand New'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            {item.condition}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm ${
                              item.status === 'sold'
                                ? 'bg-purple-600 text-white'
                                : isRented
                                ? 'bg-rose-500 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            {item.status === 'sold' ? 'Sold Permanently' : isRented ? 'Currently In Use' : 'Available'}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-3 right-3 bg-slate-900/85 backdrop-blur-sm text-white p-2 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-300 block font-semibold">DAILY RENT</span>
                            <span className="font-extrabold text-amber-300">
                              {item.pricePerDay === 0 ? 'Free Borrow' : `₹${item.pricePerDay.toLocaleString()}/day`}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-300 block font-semibold">
                              {item.allowBuy || item.buyPrice !== undefined ? 'PERMANENT BUY' : 'ESCROW DEPOSIT'}
                            </span>
                            <span className="font-bold text-white">
                              {item.allowBuy || item.buyPrice !== undefined
                                ? (item.buyPrice === 0 ? '🎁 Free' : `₹${item.buyPrice?.toLocaleString()}`)
                                : (item.deposit === 0 ? 'No Deposit' : `₹${item.deposit.toLocaleString()} (Refundable)`)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.name}</h3>
                          {(item.allowBuy || item.buyPrice !== undefined) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              {item.buyPrice === 0 ? '🎁 Free' : `Buy: ₹${item.buyPrice?.toLocaleString()}`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                            🏛️ {item.collegeName || 'Verified University'}
                          </span>
                          {item.collegeName && user?.collegeName && item.collegeName !== user.collegeName && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                              🌐 Cross-Campus
                            </span>
                          )}
                        </div>

                        <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{item.description}</p>

                        <div className="mt-3 bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Owner:</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <img
                                src={item.ownerAvatar}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              {item.ownerName} {isOwner && '(You)'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Pickup window:</span>
                            <span className="font-medium text-slate-700">{item.availabilityDays}</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-600">
                            <span className="text-[11px]">Late return fee:</span>
                            <span className="font-bold">
                              {item.lateFeePerDay === 0 ? 'None' : `₹${item.lateFeePerDay.toLocaleString()}/day`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 space-y-2">
                      {item.status === 'sold' ? (
                        <div className="bg-purple-50 border border-purple-200 text-purple-800 text-center py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                          <span>Sold Permanently {item.purchasedBy ? `to ${item.purchasedBy.buyerName}` : ''}</span>
                        </div>
                      ) : isOwner ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              openChat(
                                `equipment_${item.id}`,
                                `Equipment Inquiries: ${item.name}`,
                                'Your Equipment Listing • Inquiries & Chat'
                              )
                            }
                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-center py-2 rounded-lg font-bold text-xs border border-amber-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                            title="Open Inquiries Chat Room"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Inquiries & Chat</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(item.id, item.name)}
                            className="p-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete your listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isRented ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 text-slate-500 text-center py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due back on {item.activeRental?.dueDate}
                          </div>
                          <button
                            onClick={() =>
                              openChat(
                                `equipment_${item.id}`,
                                `Equipment: ${item.name}`,
                                `Owner: ${item.ownerName}`
                              )
                            }
                            className="p-2 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Chat with Owner"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setRentingItem(item)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Rent{item.pricePerDay === 0 ? ' (Free)' : ''}</span>
                          </button>
                          {(item.allowBuy || item.buyPrice !== undefined) && (
                            <button
                              onClick={() => setPurchasingItem(item)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Buy{item.buyPrice === 0 ? ' (Free)' : ` ₹${item.buyPrice?.toLocaleString()}`}</span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              openChat(
                                `equipment_${item.id}`,
                                `Equipment: ${item.name}`,
                                `Owner: ${item.ownerName}`
                              )
                            }
                            className="p-2 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-lg transition cursor-pointer"
                            title="Chat with Owner"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Active Rentals & Due Dates */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Active Due-Date Tracking</h2>
            <p className="text-xs text-slate-500">
              Manage equipment you have rented or lent to peers. Automated escrow releases security deposit once return is verified.
            </p>
          </div>

          {myRentedItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active equipment rentals at this time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRentedItems.map((item) => {
                const rental = item.activeRental;
                const isRenter = rental?.renterId === user?.id;

                return (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="text-slate-500">
                          {isRenter ? `Rented from ${item.ownerName}` : `Lent to ${rental?.renterName}`}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Escrow Deposit Held: ${rental?.depositHeld}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Due Date: {rental?.dueDate}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {rental?.totalDays} Days • Total Rental: ${rental?.rentalFee}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReturnEquipment(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-xs"
                      >
                        Confirm Return & Release Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rent Item Modal */}
      {rentingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Rent {rentingItem.name}</h3>
              <button onClick={() => setRentingItem(null)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRentSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={rentDays}
                  onChange={(e) => setRentDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              {/* Escrow Breakdown */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                <div className="font-bold text-amber-900 text-xs">Payment & Escrow Breakdown:</div>
                <div className="flex justify-between text-slate-700">
                  <span>Rental Fee ({rentDays} days @ {rentingItem.pricePerDay === 0 ? 'Free' : `₹${rentingItem.pricePerDay}/day`}):</span>
                  <span className="font-bold">{rentingItem.pricePerDay === 0 ? 'Free' : `₹${rentDays * rentingItem.pricePerDay}`}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Refundable Security Deposit (Escrow):</span>
                  <span className="font-bold text-emerald-700">{rentingItem.deposit === 0 ? '₹0 (No Deposit)' : `₹${rentingItem.deposit}`}</span>
                </div>
                <div className="pt-2 border-t border-amber-200 flex justify-between font-black text-slate-900 text-sm">
                  <span>Total Escrow Authorization:</span>
                  <span className="text-amber-800">
                    ₹{rentDays * rentingItem.pricePerDay + rentingItem.deposit}
                  </span>
                </div>
                <p className="text-[10px] text-amber-800/80 pt-1">
                  🛡️ Deposits are held securely in Student_Connect escrow and released back to your wallet the moment you return the gear.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRentingItem(null)}
                  className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm & Rent Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Purchase Modal */}
      {purchasingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Purchase Equipment Permanently</h3>
              </div>
              <button onClick={() => setPurchasingItem(null)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={purchasingItem.imageUrl}
                  alt={purchasingItem.name}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{purchasingItem.name}</div>
                  <div className="text-slate-500 text-[11px]">{purchasingItem.category} • {purchasingItem.condition}</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">Listed by: {purchasingItem.ownerName}</div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-emerald-950 font-semibold">
                  <span>Purchase Price:</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {(purchasingItem.buyPrice ?? 0) === 0 ? 'FREE Giveaway (₹0)' : `₹${purchasingItem.buyPrice?.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[11px] pt-1 border-t border-emerald-200">
                  <span>Your Current Wallet Balance:</span>
                  <span className="font-bold text-slate-900">₹{(user?.walletBalance || 0).toLocaleString()}</span>
                </div>
              </div>

              {(purchasingItem.buyPrice ?? 0) > (user?.walletBalance || 0) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Your wallet balance is low. Please add funds to your wallet to complete this purchase.</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                ℹ️ Once purchased permanently, full ownership is transferred to you. This item will not require a return or security deposit.
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPurchasingItem(null)}
                  className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPurchasing || ((purchasingItem.buyPrice ?? 0) > (user?.walletBalance || 0))}
                  onClick={handleConfirmPurchase}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isPurchasing ? 'Processing...' : (purchasingItem.buyPrice ?? 0) === 0 ? 'Claim Free Item' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base">List Equipment or Lab Gear</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateEquipment} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. TI-84 Plus CE Graphing Calculator"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Engineering Tools">Engineering Tools</option>
                    <option value="Lab Kits">Lab Kits</option>
                    <option value="Calculators">Calculators</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include accessories included (cables, manual, battery, case)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-800">
                  Equipment Photo (Upload Current Photo or Select Preset)
                </label>

                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-white text-slate-400 shrink-0">
                      <Image className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer transition shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Current Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload from phone/computer or paste an image link below.
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                    Or choose a preset photo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_EQUIPMENT_PHOTOS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                          imageUrl === preset.url
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing - No minimum value required, can be 0 (free) */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Rental Rates & Security Deposit</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Set 0 for free lending / no deposit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rent / Day (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={pricePerDay}
                      onChange={(e) => setPricePerDay(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      placeholder="0 for free"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deposit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={deposit}
                      onChange={(e) => setDeposit(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      placeholder="0 for none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Late Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={lateFeePerDay}
                      onChange={(e) => setLateFeePerDay(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      placeholder="0 for none"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Purchase Option */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={allowBuy}
                      onChange={(e) => setAllowBuy(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Option to Purchase Permanently (Buy Now)</span>
                  </label>
                  <span className="text-[10px] text-emerald-800 font-semibold">
                    {allowBuy ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {allowBuy && (
                  <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                    <label className="block font-bold text-slate-700">
                      Permanent Selling Price (₹)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                        placeholder="Enter 0 to give it away for FREE, or set price"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-800">
                      💡 Enter <strong>0</strong> to list this item as a <strong>Free Giveaway</strong>, or enter any price for permanent sale to classmates.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Availability / Pickup Location</label>
                <input
                  type="text"
                  value={availabilityDays}
                  onChange={(e) => setAvailabilityDays(e.target.value)}
                  placeholder="e.g. Campus Engineering Lab 3 / Packard Building"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  List Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
