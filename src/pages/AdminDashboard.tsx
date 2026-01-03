import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, LogOut, Home, Users, Ticket, Activity, TrendingUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import abelovLogo from '@/assets/abelov-logo.png';


interface GlobalStats {
  totalUsers: number;
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  onHoldTickets: number;
  totalRevenue: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  // Whether the account is currently active
  is_active: boolean;
  created_at: string;
  // Aggregate stats
  ticketCount: number;
  totalRevenue: number;
  pendingTickets: number;
  completedTickets: number;
  lastActivityDate: string | null;
  // Optional roles array coming from backend (`roles` on user document)
  roles?: string[];
}

interface RequestData {
  id: string;
  customer_name: string;
  device_brand: string;
  device_model: string;
  status: string;
  total_cost: number | null;
  technician_name: string;
  created_at: string;
  user_id: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, usersData, requestsData] = await Promise.all([
        adminAPI.getGlobalStats(true), // Force refresh
        adminAPI.getAllUsersWithStats(),
        adminAPI.getAllServiceRequests(20, 0, true), // Force refresh
      ]);

      setGlobalStats(stats as GlobalStats);
      setUsers((usersData as unknown[]).map((u) => ({ ...u } as UserData)));
      setRequests((requestsData.requests || []) as RequestData[]);
      setTotalRequests(requestsData.total || 0);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const results = await adminAPI.searchRequests(searchQuery, 50, 0);
      setRequests(results.requests);
      setTotalRequests(results.total);
      setCurrentPage(0);
    } catch {
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = async () => {
    if (statusFilter === 'all') {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const results = await adminAPI.getRequestsByStatus(statusFilter, 50, 0);
      setRequests(results.requests);
      setTotalRequests(results.total);
      setCurrentPage(0);
    } catch {
      toast({
        title: 'Error',
        description: 'Filter failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Deactivate this user? (This will disable their account)')) return;
    setLoading(true);
    try {
      await adminAPI.toggleUserStatus(id, false);
      await loadData();
      toast({ title: 'Success', description: 'User account has been deactivated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to deactivate user', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In-Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'On-Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !globalStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className='flex items-center gap-4'>
            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="md:flex hidden">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="md:hidden">
              <Home className="w-4 h-4" />
            </Button>
            <Button onClick={handleLogout} variant="outline" className="md:flex hidden">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button onClick={handleLogout} variant="outline" className="md:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Global Stats */}
          {globalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Users */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-50 border-blue-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{globalStats.totalUsers}</p>
                  <p className="text-xs text-gray-500">Active user accounts in system</p>
                </div>
              </Card>

              {/* Total Tickets */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-50 border-purple-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <Ticket className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{globalStats.totalTickets}</p>
                  <p className="text-xs text-gray-500">Total service requests</p>
                </div>
              </Card>

              {/* Completed */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-50 border-green-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-700">{globalStats.completedTickets}</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-gray-500">Finished requests</p>
                    <span className="text-xs font-semibold text-green-600">
                      {globalStats.totalTickets > 0 ? Math.round((globalStats.completedTickets / globalStats.totalTickets) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </Card>

              {/* Pending */}
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <Activity className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-700">{globalStats.pendingTickets}</p>
                  <p className="text-xs text-gray-500">Awaiting start</p>
                </div>
              </Card>

              {/* In Progress */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-cyan-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <Loader2 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <p className="text-3xl font-bold text-cyan-700">{globalStats.inProgressTickets}</p>
                  <p className="text-xs text-gray-500">Currently being worked on</p>
                </div>
              </Card>

              {/* On Hold */}
              <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">On Hold</p>
                    <Activity className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-700">{globalStats.onHoldTickets}</p>
                  <p className="text-xs text-gray-500">Temporarily paused</p>
                </div>
              </Card>

              {/* Total Revenue */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-50 border-emerald-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-700">₦{(globalStats.totalRevenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total earnings</p>

                </div>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="requests" className="w-full">
            <TabsList>
              <TabsTrigger value="requests">All Tickets</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <Card className="p-6">
                <div className="mb-4 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="Search by request ID, customer, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 min-w-64"
                    />
                    <Button onClick={handleSearch} variant="outline">
                      Search
                    </Button>
                  </div>

                  <div>
                    <Select value={statusFilter} onValueChange={(val) => {
                      setStatusFilter(val);
                      // Trigger filter when changed
                      setTimeout(() => handleStatusFilter(), 0);
                    }}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In-Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On-Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold">Request ID</TableHead>
                            <TableHead className="text-xs font-semibold">Customer</TableHead>
                            <TableHead className="text-xs font-semibold">Device</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-xs font-semibold">Cost</TableHead>
                            <TableHead className="text-xs font-semibold">Technician</TableHead>
                            <TableHead className="text-xs font-semibold">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {requests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No requests found
                              </TableCell>
                            </TableRow>
                          ) : (
                            requests.map((req: RequestData) => (
                              <TableRow
                                key={req.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate(`/view/${req.id}`)}
                              >
                                <TableCell className="font-mono text-sm font-semibold">{req.id}</TableCell>
                                <TableCell className="text-sm">{req.customer_name}</TableCell>
                                <TableCell className="text-sm">{req.device_brand} {req.device_model}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                                </TableCell>
                                <TableCell className="text-sm font-semibold">₦{req.total_cost?.toLocaleString() || '0.00'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{req.technician_name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(req.created_at).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {requests.length} of {totalRequests} tickets
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={requests.length < 20}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-semibold">Email</TableHead>
                          <TableHead className="text-xs font-semibold">Username</TableHead>
                          <TableHead className="text-xs font-semibold">Role</TableHead>
                          <TableHead className="text-xs font-semibold">Tickets</TableHead>
                          <TableHead className="text-xs font-semibold">Revenue</TableHead>
                          <TableHead className="text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-xs font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((u: UserData) => {
                            const nameFromEmail = u.email.split('@')[0];
                            const primaryRole = (u.roles && u.roles.length > 0 ? u.roles[0] : 'user') || 'user';
                            return (
                              <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="text-sm">{u.email}</TableCell>
                                <TableCell className="text-sm font-medium">{nameFromEmail}</TableCell>
                                <TableCell className="text-sm capitalize">
                                  {primaryRole}
                                </TableCell>
                                <TableCell className="text-sm font-semibold">{u.ticketCount}</TableCell>
                                <TableCell className="text-sm font-semibold">₦{u.totalRevenue?.toFixed(0) || '0'}</TableCell>
                                <TableCell>
                                  <Badge variant={u.is_active ? 'default' : 'secondary'}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button onClick={() => handleDeleteUser(u.id)} variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
