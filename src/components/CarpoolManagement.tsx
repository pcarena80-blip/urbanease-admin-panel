import { useState, useEffect } from 'react';
import { Car, MapPin, Calendar, Phone, Trash2, Search, AlertCircle, ShieldAlert } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { toast } from 'sonner';

interface CarpoolListing {
    _id: string;
    provider: string;
    name: string;
    contactNumber: string;
    vehicleType: string;
    vehicleName: string;
    vehicleNumber: string;
    seatingCapacity: number;
    seatsAvailable: number;
    pickupLocation: string;
    destination: string;
    tripType: 'one-way' | 'two-way';
    reports: Array<{
        reason: string;
        timestamp: string;
        reportedBy: {
            _id: string;
            name: string;
            email: string;
        };
    }>;
    schedule: Array<{
        day: string;
        goingTime: string;
        goingPeriod: string;
        returnTime?: string;
        returnPeriod?: string;
    }>;
    createdAt: string;
}

export function CarpoolManagement() {
    const { theme } = useTheme();
    const [listings, setListings] = useState<CarpoolListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchListings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/carpool');
            setListings(response.data);
        } catch (error) {
            console.error('Failed to fetch carpools:', error);
            toast.error('Failed to load carpool listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleBlock = async (id: string, providerName: string) => {
        if (!confirm(`Are you sure you want to block/remove the carpool listing by ${providerName}?`)) return;

        try {
            await api.delete(`/carpool/${id}/block`);
            toast.success('Carpool listing blocked successfully');
            setListings(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            console.error('Block error:', error);
            toast.error('Failed to block listing');
        }
    };

    const filteredListings = listings.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Carpool Management
                    </h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                        Manage and moderate resident carpool listings
                    </p>
                </div>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark'
                            ? 'bg-[#1A1A1A] border-[#333333] text-white placeholder-gray-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-[#00c878]`}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c878]"></div>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border rounded-2xl p-12 text-center`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}>
                        <Car className="w-8 h-8 text-[#00c878]" />
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        No Listings Found
                    </h3>
                    <p className={`max-w-md mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        There are currently no active carpool listings matching your search.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => (
                        <div key={listing._id} className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                            <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#333333] bg-[#222]' : 'border-gray-100 bg-gray-50'} flex justify-between items-start`}>
                                <div>
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{listing.name}</h3>
                                    <p className="text-sm text-[#00c878] font-medium flex items-center gap-1">
                                        <Car className="w-3 h-3" /> {listing.vehicleName} ({listing.vehicleNumber})
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${listing.tripType === 'two-way'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    }`}>
                                    {listing.tripType === 'two-way' ? 'Round Trip' : 'One Way'}
                                </span>
                            </div>

                            {/* Reports Warning */}
                            {listing.reports && listing.reports.length > 0 && (
                                <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Reported by {listing.reports.length} user(s)
                                    </div>
                                    <ul className="list-disc list-inside text-xs text-red-600/80 dark:text-red-400/80 space-y-1">
                                        {listing.reports.map((r, i) => (
                                            <li key={i}>
                                                <span className="font-semibold">{r.reportedBy?.name || 'Unknown'}:</span> {r.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="p-4 space-y-4">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <MapPin className={`w-4 h-4 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                        <div>
                                            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                                <span className="font-medium">To:</span> {listing.destination}
                                            </p>
                                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>From: {listing.pickupLocation}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{listing.contactNumber}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Car className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                            {listing.seatsAvailable} / {listing.seatingCapacity} seats available
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-50'}`}>
                                    <h4 className={`text-xs font-medium uppercase mb-2 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Calendar className="w-3 h-3" /> Schedule
                                    </h4>
                                    <div className="space-y-1">
                                        {listing.schedule.map((slot, idx) => (
                                            <div key={idx} className="flex justify-between text-xs">
                                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{slot.day}</span>
                                                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
                                                    {slot.goingTime} {slot.goingPeriod}
                                                    {slot.returnTime && ` - ${slot.returnTime} ${slot.returnPeriod}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBlock(listing._id, listing.name)}
                                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Block Listing
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
