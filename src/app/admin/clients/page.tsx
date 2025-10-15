'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, 
  User,
  Search,
  Filter,
  Copy,
  Globe,
  Grid3X3,
  List,
  ChevronDown
} from 'lucide-react';
import { ClientDetailsPanel } from '@/components/admin/client-details';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_onboarding_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ExtendedClientData extends Omit<Client, 'status'> {
  phone?: string;
  caseRef?: string;
  openedAt?: string;
  doa?: string;
  source?: string;
  serviceProvider?: string;
  services?: string[];
  amount?: string;
  linkId?: string;
  linkName?: string;
  linkUrl?: string;
  platforms?: string[];
  connectedDate?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  onboardingRequest?: any;
}

// Mock data removed - using real backend data only

// Helper function for service badge colors
const getServiceBadgeColor = (service: string): string => {
  switch (service.toLowerCase()) {
    case 'salvage':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 's&r':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'hire':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'vd':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-white text-gray-700 border-gray-200';
  }
};

// Helper function for date formatting
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to get platform logo
const getPlatformLogo = (platformId: string) => {
  const logoMap: { [key: string]: string } = {
    'meta': '/logos/meta.png',
    'facebook': '/logos/meta.png',
    'google': '/logos/google.png',
    'google analytics': '/logos/google.png',
    'google ads': '/logos/google.png',
    'tiktok': '/logos/tiktok.webp',
    'shopify': '/logos/shopify.png',
  };

  const logoPath = logoMap[platformId.toLowerCase()];
  
  if (logoPath) {
    // Special styling for Shopify to crop white space
    const isShopify = platformId.toLowerCase() === 'shopify';
    return (
      <Image 
        src={logoPath} 
        alt={platformId} 
        width={24} // Smaller size
        height={24} // Smaller size
        className={isShopify ? "object-contain scale-200" : "object-contain"}
        style={isShopify ? { objectPosition: 'center' } : undefined}
      />
    );
  }
  
  return <Globe className="h-6 w-6" />;
};

// Client Grid Item Component
interface ClientGridItemProps {
  client: ExtendedClientData;
  onView: () => void;
}

function ClientGridItem({ client, onView }: ClientGridItemProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card 
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      onClick={onView}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Logo, Name, and Status */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
              <span className="text-white font-bold text-lg">Ω</span>
            </div>
            <div className="flex-1 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900">
                {client.full_name || 'Unnamed Client'}
              </h3>
              {/* Status Badge */}
              <Badge 
                className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : client.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : client.status === 'suspended'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Link Box */}
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            {client.linkUrl ? (
              <div className="relative group">
                <div 
                  className="flex items-center justify-between gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(client.linkUrl!);
                  }}
                  title="Click to copy"
                >
                  <span className="text-xs text-gray-600 truncate font-mono">
                    {client.linkUrl}
                  </span>
                  <Copy className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No link available</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-9 border-gray-300 bg-white hover:bg-primary/10 hover:border-primary/30 text-gray-700 text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              See Details
            </Button>
            {/* Platform Connection Logos */}
            <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-gray-200 rounded-md">
              {client.platforms && client.platforms.length > 0 ? (
                client.platforms.map((platform, index) => (
                  <div key={index} className="w-5 h-5 flex items-center justify-center">
                    {getPlatformLogo(platform)}
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-400">No platforms</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Client List Item Component
interface ClientListItemProps {
  client: ExtendedClientData;
  onView: () => void;
}

function ClientListItem({ client, onView }: ClientListItemProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <Card 
      className="cursor-pointer bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      onClick={onView}
    >
      <CardContent className="py-2 px-6">
        <div className="flex items-center gap-6">
          {/* Client */}
          <div className="flex items-center gap-3 min-w-0 flex-[2]">
            <Avatar className="h-7 w-7">
              <AvatarImage src="" alt={client.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {client.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">
                {client.full_name || 'Unnamed Client'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {client.email}
              </p>
            </div>
          </div>

          {/* Link */}
          <div className="min-w-0 flex-[4]">
            {client.linkUrl ? (
              <div className="relative group max-w-md">
                <div 
                  className="bg-white text-gray-700 text-xs px-3 py-2.5 pr-10 rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(client.linkUrl!);
                  }}
                  title="Click to copy"
                >
                  {client.linkUrl}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(client.linkUrl!);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-sm text-foreground">—</span>
            )}
          </div>

          {/* Status */}
          <div className="min-w-0 flex-[1.5]">
            <Badge 
              variant={client.status === 'active' ? 'default' : 'secondary'}
              className={`text-xs ${
                client.status === 'active' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-orange-100 text-orange-800 border-orange-200'
              }`}
            >
              {client.status === 'active' ? 'Active' : 'Pending'}
            </Badge>
          </div>

          {/* Platforms */}
          <div className="min-w-0 flex-[2]">
            <div className="flex flex-wrap gap-1.5">
              {(client.platforms || []).length > 0 ? (
                client.platforms?.map((platform, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-6 h-6 flex-shrink-0" // Smaller size of container
                  >
                    {getPlatformLogo(platform)}
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="min-w-0 flex-[1] text-right">
            <p className="text-sm text-foreground">
              {client.connectedDate ? formatDate(client.connectedDate) : formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <RefreshCw className="h-10 w-10 animate-spin text-gray-500 mb-4" />
      <p className="text-gray-500 font-medium">Loading clients...</p>
      <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

function EmptyState({ searchTerm, onClearSearch }: EmptyStateProps) {
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No clients found</h3>
        <p className="text-sm text-gray-500 max-w-sm text-center mb-4">
          No clients match your search for "{searchTerm}". Try adjusting your search terms.
        </p>
        {onClearSearch && (
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <User className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
      <p className="text-sm text-gray-500 max-w-sm text-center mb-4">
        Clients will appear here when they complete onboarding through your links.
      </p>
    </div>
  );
}

// Error State Component
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <RefreshCw className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2 inline" />
        Try Again
      </button>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ExtendedClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'pending'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Admin Clients] Fetching detailed clients...');
      const response = await fetch('/api/clients/detailed');
      console.log('[Admin Clients] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Admin Clients] Error response:', errorText);
        throw new Error(`Failed to fetch clients: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Admin Clients] Received data:', data);
      
      // Use the detailed client data directly from the API
      const detailedClients: ExtendedClientData[] = (data.clients || []).map((c: any) => ({
        ...c,
        phone: c.phone || null,
        caseRef: null,
        openedAt: null,
        doa: null,
        source: 'Onboarding Link',
        serviceProvider: null,
        services: [],
        amount: null,
        linkId: c.linkId,
        linkName: c.linkName,
        linkUrl: c.linkUrl,
        platforms: c.platforms || [],
        connectedDate: c.connectedDate,
        status: c.status || 'pending',
        onboardingRequest: c.onboardingRequest
      }));
      
      setClients(detailedClients);
    } catch (err) {
      console.error('[Admin Clients] Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      // Set empty array on error instead of mock data
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    return () => {};
  }, []);

  // Filter clients based on search term and filters
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.linkName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    const matchesPlatform = platformFilter === 'all' || 
      (client.platforms && client.platforms.includes(platformFilter));
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Get unique platforms for filter dropdown
  const availablePlatforms = Array.from(new Set(
    clients.flatMap(client => client.platforms || [])
  ));

  const handleFilter = () => {
    // TODO: Implement filter functionality
    console.log('Filter clicked');
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-white">
      {/* Fixed Header Section */}
      <div className="flex-none p-4 md:p-6 space-y-4">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          className="border-t border-b border-border/50 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-colors duration-200"
                  />
                </div>
      </div>
              <div className="flex items-center gap-2">
              <Button 
                onClick={fetchClients} 
                variant="outline" 
                size="sm" 
                className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                disabled={isLoading}
              >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
              </Button>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 rounded-md ${viewMode === 'list' ? 'gradient-primary shadow-sm' : 'hover:bg-white/60'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                    <Button 
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 rounded-md ${viewMode === 'grid' ? 'gradient-primary shadow-sm' : 'hover:bg-white/60'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                    </Button>
            </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/30 transition-colors">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
                    Suspended
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pending
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPlatformFilter('all')}>
                    All Platforms
                  </DropdownMenuItem>
                  {availablePlatforms.map(platform => (
                    <DropdownMenuItem key={platform} onClick={() => setPlatformFilter(platform)}>
                      {platform}
                        </DropdownMenuItem>
                  ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
          </div>
        </motion.div>
      </div>
                  
      {/* Column Headers - Only show for list view */}
      {viewMode === 'list' && (
        <motion.div 
          className="flex-none px-6 pb-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-6">
            <div className="flex-[2]">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Client</p>
            </div>
            <div className="flex-[4]">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Link</p>
            </div>
            <div className="flex-[1.5] flex justify-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
            </div>
            <div className="flex-[2] flex justify-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Platforms</p>
            </div>
            <div className="flex-[1] flex justify-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scrollable Client List */}
      <motion.div 
        className="flex-1 overflow-y-auto px-6 pb-6 pt-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchClients} />
            ) : filteredClients.length === 0 ? (
              <EmptyState 
                searchTerm={searchTerm} 
                onClearSearch={() => setSearchTerm('')} 
              />
            ) : (
              filteredClients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  onView={() => setSelectedClientId(client.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full">
                <LoadingState />
              </div>
            ) : error ? (
              <div className="col-span-full">
                <ErrorState message={error} onRetry={fetchClients} />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  searchTerm={searchTerm} 
                  onClearSearch={() => setSearchTerm('')} 
                />
              </div>
            ) : (
              filteredClients.map((client) => (
                <ClientGridItem
                  key={client.id}
                  client={client}
                  onView={() => setSelectedClientId(client.id)}
                />
              ))
            )}
            </div>
          )}
      </motion.div>

      {/* Client Details Panel */}
      {selectedClientId && (
        <ClientDetailsPanel
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}
    </div>
  );
}
