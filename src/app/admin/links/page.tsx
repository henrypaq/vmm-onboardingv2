'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog components
import { LinkGeneratorDialog } from '@/components/admin/link-generator-dialog'; // Import new dialog component
import { Copy, ExternalLink, Trash2, RefreshCw, Link as LinkIcon, Plus, Check, Globe, Search, Filter, MoreHorizontal, Edit, Eye, Share2, Settings, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

interface OnboardingLink {
  id: string;
  admin_id: string;
  client_id?: string;
  link_name?: string;
  token: string;
  platforms: string[];
  requested_permissions: Record<string, string[]>;
  expires_at: string;
  status: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function for date formatting
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

function LinksPageContent() {
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<OnboardingLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Check for openDialog query parameter and open dialog
  useEffect(() => {
    const shouldOpenDialog = searchParams.get('openDialog');
    if (shouldOpenDialog === 'true') {
      setIsDialogOpen(true);
      // Remove the query parameter from URL without reload
      window.history.replaceState({}, '', '/admin/links');
    }
  }, [searchParams]);

  // Fetch links from API
  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/links');
      const data = await response.json();
      
      if (response.ok) {
        setLinks(data.links || []);
      } else {
        console.error('Error fetching links:', data.error);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch links on component mount
  useEffect(() => {
    fetchLinks();
  }, []);

  const handleLinkGenerated = () => {
    // Refresh the links list to include the newly generated link
    fetchLinks();
    setIsDialogOpen(false); // Close the dialog after link is generated
  };

  const handleDeleteLink = async (linkId: string) => {
    // Find the link to check if it's permanent
    const link = links.find(l => l.id === linkId);
    if (link && isPermanentLink(link.token)) {
      alert('This is a permanent link and cannot be deleted.');
      return;
    }

    if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(linkId);
      const response = await fetch(`/api/admin/links?id=${linkId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the deleted link from the local state
        setLinks(prev => prev.filter(link => link.id !== linkId));
      } else {
        const data = await response.json();
        console.error('Error deleting link:', data.error);
        alert('Failed to delete link. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const copyToClipboard = async (text: string, event: React.MouseEvent, token?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
      const element = event?.currentTarget as HTMLElement;
      if (element && element.innerHTML !== undefined) {
        const originalContent = element.innerHTML;
        element.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        element.classList.add('text-green-600');
      if (token) {
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 1500);
      }
      setTimeout(() => {
          if (element && element.innerHTML !== undefined) {
            element.innerHTML = originalContent;
            element.classList.remove('text-green-600');
          }
      }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copied to clipboard!');
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        alert('Failed to copy link. Please copy manually: ' + text);
      }
      document.body.removeChild(textArea);
    }
  };

  const getStatusVariant = (status: string, expiresAt: string, isUsed: boolean): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'expired' || new Date(expiresAt) < new Date()) return 'destructive';
    if (isUsed) return 'secondary'; // Used but still active
    if (status === 'in_progress') return 'default';
    if (status === 'active') return 'outline'; // Active will be styled green with custom class
    return 'default'; // pending
  };

  const getStatusText = (status: string, expiresAt: string, isUsed: boolean) => {
    if (status === 'expired' || new Date(expiresAt) < new Date()) return 'Expired';
    if (isUsed) return 'Used'; // Used but still active
    if (status === 'in_progress') return 'In Progress';
    return 'Active'; // pending
  };

  const getOnboardingUrl = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
    return `${baseUrl}/onboarding/${token}`;
  };

  // Helper function to get manage URL
  const getManageUrl = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vast-onboarding.netlify.app';
    return `${baseUrl}/admin/links/manage/${token}`;
  };

  // Helper function to check if link is permanent (non-deletable)
  const isPermanentLink = (token: string) => {
    return token === 'manage-permanent-link' || token === 'view-permanent-link';
  };

  // Helper function to get the manage link (permanent or first available)
  const getManageLinkData = () => {
    return links.find(l => l.token === 'manage-permanent-link') || links[0];
  };

  // Helper function to get the view link (static permanent link)
  const getViewLinkData = () => {
    // Return a static view link that's not connected to generated links
    return {
      token: 'view-permanent-link',
      status: 'active' as const,
      expires_at: null as string | null,
      is_used: false,
      platforms: ['google', 'meta', 'tiktok', 'shopify']
    };
  };

  // Helper function to get platform logo
  const getPlatformLogo = (platformId: string) => {
    const logoMap: { [key: string]: string } = {
      'meta': '/logos/meta.png',
      'facebook': '/logos/meta.png',
      'google': '/logos/google.png',
      'google analytics': '/logos/google.png',
      'google ads': '/logos/google.png',
      'google-analytics': '/logos/google.png', // Added for robustness
      'google-ads': '/logos/google.png',     // Added for robustness
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
          width={20} // Slightly smaller size
          height={20} // Slightly smaller size
          className={isShopify ? "object-contain scale-200" : "object-contain"}
          style={isShopify ? { objectPosition: 'center' } : undefined}
        />
      );
    }
    
    return <Globe className="h-5 w-5" />;
  };

  const handleFilter = () => {
    // TODO: Implement filter functionality for links
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.link_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.platforms.some(platform => platform.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !link.is_used && link.status !== 'expired') ||
      (statusFilter === 'used' && link.is_used) ||
      (statusFilter === 'expired' && (link.status === 'expired' || new Date(link.expires_at) < new Date()));
    
    const matchesPlatform = platformFilter === 'all' || 
      link.platforms.includes(platformFilter);
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Get unique platforms for filter dropdown
  const availablePlatforms = Array.from(new Set(
    links.flatMap(link => link.platforms)
  ));

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-white">
      {/* Fixed Header Section */}
      <div className="flex-none p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="default" className="h-10 gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Generate Link
              </Button>
            </DialogTrigger>
            <LinkGeneratorDialog onLinkGenerated={handleLinkGenerated} onClose={() => setIsDialogOpen(false)} />
          </Dialog>
        </div>
      </div>
      
      {/* Manage and View Link Boxes */}
        {(() => {
          const manageLinkData = getManageLinkData();
          const viewLinkData = getViewLinkData();
          const isManageLinkDisabled = manageLinkData?.token === 'manage-permanent-link';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
              {/* View Link Box - Now on the left */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">View Link</p>
                        <p className="text-xs text-gray-500">Client onboarding</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Link Display */}
                  <div className="mt-4">
                    <div className="relative group">
                      <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-3 pr-20">
                        <p className="text-sm font-mono text-gray-700 truncate">
                          {viewLinkData ? getOnboardingUrl(viewLinkData.token) : ''}
                        </p>
                      </div>
                      {viewLinkData && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            onClick={(e) => copyToClipboard(getOnboardingUrl(viewLinkData.token), e, viewLinkData.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            onClick={() => window.open(getOnboardingUrl(viewLinkData.token), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Link Info */}
                  {viewLinkData && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Status:</span>
                        <Badge 
                          variant={getStatusVariant(viewLinkData.status, viewLinkData.expires_at || '', viewLinkData.is_used)}
                          className={getStatusText(viewLinkData.status, viewLinkData.expires_at || '', viewLinkData.is_used) === 'Active' ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : ''}
                        >
                          {getStatusText(viewLinkData.status, viewLinkData.expires_at || '', viewLinkData.is_used)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {viewLinkData.platforms.map((platform, index) => (
                          <div key={index} className="w-4 h-4 flex items-center justify-center">
                            {getPlatformLogo(platform)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>

              {/* Manage Link Box - Now on the right */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="relative bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-500">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
              <div>
                        <p className="text-sm font-medium text-gray-900">Manage Link</p>
                        <p className="text-xs text-gray-500">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Link Display */}
                  <div className="mt-4">
                    <div className="relative group">
                      <div className="bg-gray-100 border border-gray-400 rounded-lg px-4 py-3 pr-20 cursor-not-allowed opacity-70">
                        <p className="text-sm font-mono text-gray-500 truncate">
                          {manageLinkData ? getManageUrl(manageLinkData.token) : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
              </motion.div>
            </div>
          );
        })()}

        {/* Custom Links Title */}
        <motion.div 
          className="mb-4 mt-16 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Custom Links</h2>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              size="default" 
              className="h-10 gradient-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Link
            </Button>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          className="border-t border-b border-border/50 py-3 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search custom links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchLinks} 
                variant="outline"
                size="sm"
                className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                  <DropdownMenuItem onClick={() => setStatusFilter('used')}>
                    Used
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('expired')}>
                    Expired
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
        </motion.div>

      {/* Column Headers */}
      <motion.div 
        className="flex-none px-6 pb-4 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-6">
          <div className="flex-[2.5]">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Link Name</p>
          </div>
          <div className="flex-[3.5]">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">URL</p>
          </div>
          <div className="flex-[1.5] flex justify-center">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Platforms</p>
          </div>
          <div className="flex-[1] flex justify-center">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
          </div>
          <div className="flex-[1] flex justify-center">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expires</p>
          </div>
          <div className="flex-[0.5] flex justify-center">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Actions</p>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Link List */}
      <motion.div 
        className="flex-1 px-6 pb-6 pt-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="space-y-2">
            {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-500 mb-4" />
              <span className="ml-3 text-gray-500">Loading links...</span>
              </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-500 mb-2">No links generated yet</p>
              <p className="text-sm text-gray-500">
                Click \"Generate Link\" to create your first onboarding link.
              </p>
              </div>
            ) : (
            filteredLinks.map((link) => (
              <Card 
                key={link.id} 
                className={`group bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  link.token === 'manage-permanent-link' ? 'opacity-50' : ''
                }`}
              >
                <CardContent className="py-0 px-0">
                  <div className="flex items-center justify-between gap-6">
                    {/* Link Name */}
                    <div className="min-w-0 flex-[2.5]">
                      <h3 className="font-medium text-sm leading-none text-foreground truncate">
                            {link.link_name || 'Unnamed Link'}
                          </h3>
                    </div>

                    {/* URL Display */}
                    <div className="min-w-0 flex-[3.5]">
                      <div className="relative group max-w-2xl">
                        <div 
                          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-20 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getOnboardingUrl(link.token), '_blank');
                          }}
                          title="Click to open link"
                        >
                          <p className="text-sm font-mono text-gray-700 truncate">
                            {getOnboardingUrl(link.token)}
                          </p>
                        </div>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                                <Button
                            size="sm"
                                variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(getOnboardingUrl(link.token), e, link.token);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                                size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getOnboardingUrl(link.token), '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                                </Button>
                        </div>
                              </div>
                            </div>

                    {/* Platforms */}
                    <div className="min-w-0 flex-[1.5]">
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        {link.platforms.map((platform) => (
                          <div key={platform} className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {getPlatformLogo(platform)}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="min-w-0 flex-[1] flex justify-start">
                      <Badge 
                        variant={getStatusVariant(link.status, link.expires_at, link.is_used)}
                        className={getStatusText(link.status, link.expires_at, link.is_used) === 'Active' ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : ''}
                      >
                        {getStatusText(link.status, link.expires_at, link.is_used)}
                      </Badge>
                    </div>

                    {/* Expires At */}
                    <div className="min-w-0 flex-[1] text-right text-sm text-foreground">
                      {formatDate(link.expires_at)}
                      </div>

                    {/* Actions Menu */}
                    <div className="min-w-0 flex-[0.5] flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(getOnboardingUrl(link.token), '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(getOnboardingUrl(link.token), e, link.token);
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          {!isPermanentLink(link.token) && (
                            <DropdownMenuItem 
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={isDeleting === link.id}
                              className="text-destructive focus:text-destructive"
                        >
                          {isDeleting === link.id ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete Link
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
          </CardContent>
        </Card>
            ))
          )}
      </div>
      </motion.div>
    </div>
  );
}

export default function LinksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LinksPageContent />
    </Suspense>
  );
}