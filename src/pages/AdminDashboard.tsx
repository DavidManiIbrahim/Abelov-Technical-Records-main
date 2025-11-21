import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, LogOut, Home, Users, Ticket, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface GlobalStats {
  totalUsers: number;
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  totalRevenue: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  ticketCount: number;
  totalRevenue: number;
  pendingTickets: number;
  completedTickets: number;
  lastActivityDate: string | null;
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
        adminAPI.getGlobalStats(),
        adminAPI.getAllUsersWithStats(),
        adminAPI.getAllServiceRequests(20, 0),
      ]);

      setGlobalStats(stats);
      setUsers(usersData);
      setRequests(requestsData.requests);
      setTotalRequests(requestsData.total);
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Filter failed',
        variant: 'destructive',
      });
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
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-primary mt-2">{globalStats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Tickets</p>
                    <p className="text-3xl font-bold text-primary mt-2">{globalStats.totalTickets}</p>
                  </div>
                  <Ticket className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{globalStats.pendingTickets}</p>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{globalStats.completedTickets}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold text-primary mt-2">₦{globalStats.totalRevenue.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground opacity-50" />
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
                                <TableCell className="text-sm font-semibold">₦{req.total_cost?.toFixed(2) || '0.00'}</TableCell>
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
                          <TableHead className="text-xs font-semibold">Name</TableHead>
                          <TableHead className="text-xs font-semibold">Company</TableHead>
                          <TableHead className="text-xs font-semibold">Tickets</TableHead>
                          <TableHead className="text-xs font-semibold">Revenue</TableHead>
                          <TableHead className="text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-xs font-semibold">Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((u: UserData) => (
                            <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="text-sm">{u.email}</TableCell>
                              <TableCell className="text-sm">{u.full_name || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{u.company_name || '-'}</TableCell>
                              <TableCell className="text-sm font-semibold">{u.ticketCount}</TableCell>
                              <TableCell className="text-sm font-semibold">₦{u.totalRevenue?.toFixed(0) || '0'}</TableCell>
                              <TableCell>
                                <Badge variant={u.is_active ? 'default' : 'secondary'}>
                                  {u.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(u.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
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
