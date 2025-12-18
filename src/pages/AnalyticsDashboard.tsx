import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestAPI } from '@/lib/api';
import { ServiceRequest } from '@/types/database';
import { ArrowLeft, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import abelovLogo from '@/assets/abelov-logo.png';

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await serviceRequestAPI.getByUserId(user.id);
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Revenue over time
  const revenueOverTime = requests.reduce((acc, req) => {
    const month = new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.revenue += req.payment_completed ? (req.total_cost || 0) : (req.deposit_paid || 0);
      existing.count += 1;
    } else {
      acc.push({ month, revenue: req.payment_completed ? (req.total_cost || 0) : (req.deposit_paid || 0), count: 1 });
    }
    return acc;
  }, [] as { month: string; revenue: number; count: number }[]);

  // Device breakdown
  const deviceBreakdown = requests.reduce((acc, req) => {
    const device = req.device_model || 'Unknown';
    const existing = acc.find(item => item.device === device);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ device, count: 1 });
    }
    return acc;
  }, [] as { device: string; count: number }[]);

  // Status trends
  const statusTrends = [
    { status: 'Completed', count: requests.filter(r => r.status === 'Completed').length },
    { status: 'In-Progress', count: requests.filter(r => r.status === 'In-Progress').length },
    { status: 'Pending', count: requests.filter(r => r.status === 'Pending').length },
    { status: 'On-Hold', count: requests.filter(r => r.status === 'On-Hold').length },
  ].filter(item => item.count > 0);

  // Technician work histogram
  const technicianWork = requests.reduce((acc, req) => {
    const tech = req.technician_name || 'Unassigned';
    const existing = acc.find(item => item.technician === tech);
    if (existing) {
      existing.completed += req.status === 'Completed' ? 1 : 0;
      existing.inProgress += req.status === 'In-Progress' ? 1 : 0;
      existing.pending += req.status === 'Pending' ? 1 : 0;
      existing.onHold += req.status === 'On-Hold' ? 1 : 0;
      existing.total += 1;
    } else {
      acc.push({
        technician: tech,
        completed: req.status === 'Completed' ? 1 : 0,
        inProgress: req.status === 'In-Progress' ? 1 : 0,
        pending: req.status === 'Pending' ? 1 : 0,
        onHold: req.status === 'On-Hold' ? 1 : 0,
        total: 1,
      });
    }
    return acc;
    // }, [] as { technician: string; completed: number; inProgress: number; pending: number; total: number }[]);
  }, [] as { technician: string; completed: number; inProgress: number; pending: number; onHold: number; total: number }[]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const totalRevenue = requests.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0)), 0);
  const avgServiceTime = requests.length > 0 ? Math.round(requests.reduce((sum, r) => {
    const created = new Date(r.created_at);
    // Use updated_at if status is completed, otherwise use current time for duration calculation
    const end = r.status === 'Completed' ? new Date(r.updated_at) : new Date();
    // Ensure we don't get negative time if dates are weird
    const diff = Math.abs(end.getTime() - created.getTime());
    return sum + diff / (1000 * 60 * 60 * 24);
  }, 0) / requests.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4 mb-2">
            <img src={abelovLogo} alt="Abelov Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-primary">Analytics Dashboard</h1>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">₦{totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-primary">{requests.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Service Time</p>
                <p className="text-2xl font-bold text-primary">{avgServiceTime} days</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-primary">
                  {requests.filter(r => r.status === 'Completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Revenue Over Time */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-primary">Revenue Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Type Breakdown */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">Device Type Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Service Status Trends */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">Service Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Technician Work Histogram */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-bold mb-4 text-primary">Technician Work Distribution</h2>
          {technicianWork.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={technicianWork} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="technician" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" stackId="a" />
                <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" stackId="a" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" stackId="a" />
                <Bar dataKey="onHold" fill="#ff0000" name="On Hold" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No technician data available</p>
          )}
        </Card>
      </div>
    </div>
  );
}
