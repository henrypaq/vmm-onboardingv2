'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, RefreshCw, Eye, Trash2, Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientDetailsPanel } from '@/components/admin/client-details';

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isFixingAssets, setIsFixingAssets] = useState(false);

  const fixAssets = async () => {
    try {
      setIsFixingAssets(true);
      console.log('[Admin Clients] Fixing assets...');
      
      const response = await fetch('/api/admin/fix-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fix assets: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Admin Clients] Fix assets result:', result);
      
      // Refresh clients after fixing assets
      await fetchClients();
      
      alert(`Successfully fixed assets for ${result.fixedCount} requests!`);
    } catch (error) {
      console.error('[Admin Clients] Error fixing assets:', error);
      alert(`Error fixing assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFixingAssets(false);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[Admin Clients] Fetching clients...');
      const response = await fetch('/api/clients');
      console.log('[Admin Clients] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Admin Clients] Error response:', errorText);
        throw new Error(`Failed to fetch clients: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Admin Clients] Received data:', data);
      setClients(data.clients || []);
    } catch (err) {
      console.error('[Admin Clients] Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // Removed auto-refresh; rely on explicit actions for updates
    return () => {};
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTestClientCreation = async () => {
    try {
      console.log('[Admin Clients] Testing direct client creation...');
      const response = await fetch('/api/test-client-creation-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Direct Client',
          email: 'test-direct@example.com',
          company: 'Test Direct Company'
        })
      });
      
      const data = await response.json();
      console.log('[Admin Clients] Test client creation result:', data);
      
      if (data.success) {
        // Refresh the clients list
        fetchClients();
        alert('Test client created successfully! Check console for details.');
      } else {
        alert('Test client creation failed: ' + data.error);
      }
    } catch (error) {
      console.error('[Admin Clients] Test client creation error:', error);
      alert('Test client creation failed: ' + error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600 mt-2">Manage your client accounts and onboarding status</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">All Clients ({clients.length})</h2>
        <div className="flex space-x-2">
          <Button onClick={fetchClients} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={fixAssets} variant="outline" disabled={isFixingAssets}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFixingAssets ? 'animate-spin' : ''}`} />
            Fix Assets
          </Button>
          <Button onClick={handleTestClientCreation} variant="outline">
            Test Client Creation
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            View and manage all client accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading clients...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchClients} variant="outline">
                Try Again
              </Button>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No clients found</p>
              <p className="text-sm text-gray-400">
                Clients will appear here when they complete onboarding through your links
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{client.full_name || 'Unnamed Client'}</h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                        {client.company_name && (
                          <p className="text-xs text-gray-400">{client.company_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant={getStatusVariant(client.status)}>
                      {client.status}
                    </Badge>
                    <div className="text-right text-sm text-gray-500">
                      <p>Created: {formatDate(client.created_at)}</p>
                      {client.last_onboarding_at && (
                        <p>Last Onboarding: {formatDate(client.last_onboarding_at)}</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientId(client.id);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e)=>e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e)=>e.stopPropagation()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={async () => {
                          const newName = prompt('Enter new client name', client.full_name || '');
                          if (newName === null) return;
                          try {
                            const res = await fetch(`/api/clients/${client.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ full_name: newName })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            await fetchClients();
                          } catch (err) {
                            console.error('Rename failed', err);
                            alert('Failed to rename client');
                          }
                        }}>
                          <Edit3 className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={async () => {
                          if (!confirm('Delete this client? This will remove their platform connections.')) return;
                          try {
                            // Optimistic UI: remove locally first
                            setClients((prev) => prev.filter((c) => c.id !== client.id));
                            const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
                            if (!res.ok) throw new Error(await res.text());
                            // No need to refetch; keep optimistic state
                          } catch (err) {
                            console.error('Delete failed', err);
                            alert('Failed to delete client');
                            // Revert if server failed
                            await fetchClients();
                          }
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
