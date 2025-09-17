import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components 2/ui/card';
import { Badge } from '@/components 2/ui/badge';
import { Button } from '@/components 2/ui/button';
import { CheckCircle, Clock, AlertCircle, Eye, Download } from 'lucide-react';

export default function RequestsPage() {
  // TODO: Replace with real data from API
  const requests = [
    {
      id: '1',
      title: 'Integration Access Request',
      status: 'approved',
      submitted_at: '2024-01-20T10:30:00Z',
      reviewed_at: '2024-01-20T14:45:00Z',
      permissions: [
        { id: 'read_profile', name: 'Read Profile Information', granted: true },
        { id: 'read_contacts', name: 'Read Contacts', granted: true },
      ],
      notes: 'Approved for basic integration access.',
    },
    {
      id: '2',
      title: 'Calendar Sync Request',
      status: 'pending',
      submitted_at: '2024-01-21T09:15:00Z',
      permissions: [
        { id: 'read_calendar', name: 'Read Calendar', granted: false },
        { id: 'write_calendar', name: 'Write Calendar', granted: false },
      ],
      notes: 'Under review by admin team.',
    },
    {
      id: '3',
      title: 'Admin Access Request',
      status: 'approved',
      submitted_at: '2024-01-18T16:20:00Z',
      reviewed_at: '2024-01-19T11:30:00Z',
      permissions: [
        { id: 'admin_access', name: 'Admin Access', granted: true },
      ],
      notes: 'Full administrative access granted.',
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-600 mt-2">View and manage your onboarding requests</p>
      </div>
      
      <div className="space-y-6">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription>
                      Submitted on {formatDate(request.submitted_at)}
                      {request.reviewed_at && (
                        <span> • Reviewed on {formatDate(request.reviewed_at)}</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Requested Permissions:</h4>
                <div className="space-y-2">
                  {request.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{permission.name}</span>
                      <Badge variant={permission.granted ? 'default' : 'secondary'}>
                        {permission.granted ? 'Granted' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {request.notes && (
                <div>
                  <h4 className="font-medium mb-2">Admin Notes:</h4>
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    {request.notes}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {request.status === 'approved' && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Credentials
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}