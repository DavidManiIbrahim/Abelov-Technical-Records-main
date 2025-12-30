import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestAPI, adminAPI } from '@/lib/api';
import { ServiceRequest } from '@/types/database';
import { Plus, Search, Edit, Eye, Trash2, BarChart3, Shield } from 'lucide-react';
import ProfileMenu from '@/components/ProfileMenu';
import abelovLogo from '@/assets/abelov-logo.png';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const getUsername = () => {
    // @ts-ignore
    return user?.username || localStorage.getItem('userUsername') || '';
  };
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = usePersistentState('dashboard_search', '');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    onHold: 0,
    totalRevenue: 0,
  });

  const loadRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        adminAPI.getAllServiceRequests(100, 0), // Get all requests instead of just user's
        adminAPI.getGlobalStats(),
      ]);
      setRequests(data.requests || []);
      setFilteredRequests(data.requests || []);

      // Map global stats to expected format
      setStats({
        total: statsData.totalTickets || 0,
        completed: statsData.completedTickets || 0,
        pending: statsData.pendingTickets || 0,
        inProgress: statsData.inProgressTickets || 0,
        onHold: statsData.onHoldTickets || 0,
        totalRevenue: statsData.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Error loading requests:', error);
      // Fallback: try to load just requests if stats fail
      try {
        const data = await adminAPI.getAllServiceRequests(100, 0);
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);

        // Try to get global stats as fallback
        try {
          const globalStats = await adminAPI.getGlobalStats();
          setStats({
            total: globalStats.totalTickets || 0,
            completed: globalStats.completedTickets || 0,
            pending: globalStats.pendingTickets || 0,
            inProgress: globalStats.inProgressTickets || 0,
            onHold: globalStats.onHoldTickets || 0,
            totalRevenue: globalStats.totalRevenue || 0,
          });
        } catch {
          // Calculate stats locally from loaded requests as last resort
          const loadedRequests = data.requests || [];
          const calculatedStats = loadedRequests.reduce(
            (acc, request) => {
              acc.total++;
              acc.totalRevenue += request.total_cost || 0;

              switch (request.status) {
                case 'Completed':
                  acc.completed++;
                  break;
                case 'Pending':
                  acc.pending++;
                  break;
                case 'In-Progress':
                  acc.inProgress++;
                  break;
                case 'On-Hold':
                  acc.onHold++;
                  break;
              }

              return acc;
            },
            {
              total: 0,
              completed: 0,
              pending: 0,
              inProgress: 0,
              onHold: 0,
              totalRevenue: 0,
            }
          );

          setStats(calculatedStats);
        }
      } catch (fallbackError) {
        console.error('Fallback request loading also failed:', fallbackError);
        setRequests([]);
        setFilteredRequests([]);
        setStats({
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          onHold: 0,
          totalRevenue: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!user?.id) return;

    if (query.trim() === '') {
      setFilteredRequests(requests);
    } else {
      try {
        const results = await adminAPI.searchRequests(query, 100, 0);
        setFilteredRequests(results.requests || []);
      } catch (error) {
        console.error('Error searching:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service request?')) return;
    try {
      await serviceRequestAPI.delete(id);
      setRequests(requests.filter(r => r.id !== id));
      setFilteredRequests(filteredRequests.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'On-Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, trend }: { title: string; value: string | number; trend?: string }) => (
    <Card className="p-6">
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
      {trend && <p className="text-xs text-green-600 mt-2">{trend}</p>}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Abelov Technical Records</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => navigate('/analytics')} variant="outline" className="md:flex hidden">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => navigate('/analytics')} variant="outline" className="md:hidden">
              <BarChart3 className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <>
                <Button onClick={() => navigate('/admin')} variant="outline" className="md:flex hidden">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
                <Button onClick={() => navigate('/admin')} variant="outline" className="md:hidden">
                  <Shield className="w-4 h-4" />
                </Button>
              </>
            )}
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back{getUsername() ? `, ${getUsername()}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your service requests and business metrics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Requests" value={stats.total} />
          <StatCard title="Completed" value={stats.completed} />
          <StatCard title="Pending" value={stats.pending} />
          <StatCard title="In Progress" value={stats.inProgress} />
          <StatCard title="On Hold" value={stats.onHold} />
          <StatCard title="Total Revenue" value={`₦${(stats.totalRevenue || 0).toLocaleString()}`} />
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, device, ID, or status..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate('/')} size="lg" className="md:flex hidden">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
          <Button onClick={() => navigate('/')} size="lg" className="md:hidden">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No Results Found' : 'No Service Requests Yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Try adjusting your search query.' : 'Create your first service request to get started.'}
            </p>
            <Button onClick={() => navigate('/')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Service Request
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Request ID</p>
                    <p className="font-mono font-semibold text-primary text-sm">{request.id}</p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p><span className="font-medium">Customer:</span> {request.customer_name}</p>
                  <p><span className="font-medium">Phone:</span> {request.customer_phone}</p>
                  <p><span className="font-medium">Device:</span> {request.device_brand} {request.device_model}</p>
                  <p><span className="font-medium">Date:</span> {new Date(request.request_date).toLocaleDateString()}</p>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="font-bold text-primary">₦{request.total_cost.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className={`font-bold ${request.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₦{request.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/view/${request.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex hidden"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => navigate(`/view/${request.id}`)}
                    variant="outline"
                    size="sm"
                    className="md:hidden"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => navigate(`/edit/${request.id}`)}
                    variant="default"
                    size="sm"
                    className="flex-1 md:flex hidden"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => navigate(`/edit/${request.id}`)}
                    variant="default"
                    size="sm"
                    className="md:hidden"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(request.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
