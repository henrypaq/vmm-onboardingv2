import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components 2/ui/card';
import { Badge } from '@/components 2/ui/badge';
import { Button } from '@/components 2/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';

export default function ClientsPage() {
  // TODO: Replace with real data from API
  const clients = [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      company: 'Acme Corp',
      status: 'active',
      created_at: '2024-01-15',
      updated_at: '2024-01-20',
    },
    {
      id: '2',
      name: 'TechStart Inc',
      email: 'hello@techstart.com',
      company: 'TechStart',
      status: 'pending',
      created_at: '2024-01-18',
      updated_at: '2024-01-19',
    },
    {
      id: '3',
      name: 'Global Solutions',
      email: 'info@global.com',
      company: 'Global Solutions Ltd',
      status: 'active',
      created_at: '2024-01-10',
      updated_at: '2024-01-21',
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600 mt-2">Manage your client accounts and onboarding status</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">All Clients</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>
            View and manage all client accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{client.name}</h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                      {client.company && (
                        <p className="text-xs text-gray-400">{client.company}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={getStatusVariant(client.status)}>
                    {client.status}
                  </Badge>
                  <div className="text-right text-sm text-gray-500">
                    <p>Created: {client.created_at}</p>
                    <p>Updated: {client.updated_at}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}