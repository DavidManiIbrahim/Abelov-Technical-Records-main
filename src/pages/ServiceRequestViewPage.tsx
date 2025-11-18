import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serviceRequestAPI } from '@/lib/api';
import { ServiceRequest } from '@/types/database';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ServiceRequestViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRequest(id);
    }
  }, [id]);

  const loadRequest = async (requestId: string) => {
    try {
      const data = await serviceRequestAPI.getById(requestId);
      setRequest(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load request',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Go Back</Button>
        </Card>
      </div>
    );
  }

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

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
    <div className="py-3 border-b last:border-b-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-primary mt-1">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Service Request Details</h1>
            <p className="text-muted-foreground">Request ID: {request.id}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
        </div>

        {/* Shop Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Shop Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <DetailRow label="Shop Name" value={request.shop_name} />
            </div>
            <div>
              <DetailRow label="Technician Name" value={request.technician_name} />
            </div>
            <div>
              <DetailRow label="Request Date" value={new Date(request.request_date).toLocaleDateString()} />
            </div>
          </div>
        </Card>

        {/* Customer Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DetailRow label="Customer Name" value={request.customer_name} />
            </div>
            <div>
              <DetailRow label="Customer Phone" value={request.customer_phone} />
            </div>
            <div>
              <DetailRow label="Customer Email" value={request.customer_email || 'N/A'} />
            </div>
            <div>
              <DetailRow label="Customer Address" value={request.customer_address} />
            </div>
          </div>
        </Card>

        {/* Device Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Device Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DetailRow label="Device Model" value={request.device_model} />
            </div>
            <div>
              <DetailRow label="Device Brand" value={request.device_brand} />
            </div>
            <div>
              <DetailRow label="Serial Number" value={request.serial_number} />
            </div>
            <div>
              <DetailRow label="Operating System" value={request.operating_system} />
            </div>
            <div className="md:col-span-2">
              <DetailRow label="Accessories Received" value={request.accessories_received} />
            </div>
          </div>
        </Card>

        {/* Problem Description */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Problem Description</h2>
          <p className="whitespace-pre-wrap text-base">{request.problem_description}</p>
        </Card>

        {/* Diagnosis & Repair */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Diagnosis & Repair Report</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <DetailRow label="Diagnosis Date" value={request.diagnosis_date ? new Date(request.diagnosis_date).toLocaleDateString() : 'N/A'} />
              </div>
              <div>
                <DetailRow label="Diagnosis Technician" value={request.diagnosis_technician} />
              </div>
            </div>
            {request.fault_found && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Fault Found</p>
                <p className="text-base font-semibold text-primary mt-1 whitespace-pre-wrap">{request.fault_found}</p>
              </div>
            )}
            {request.parts_used && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Parts Used</p>
                <p className="text-base font-semibold text-primary mt-1 whitespace-pre-wrap">{request.parts_used}</p>
              </div>
            )}
            {request.repair_action && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Repair Action</p>
                <p className="text-base font-semibold text-primary mt-1 whitespace-pre-wrap">{request.repair_action}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Cost Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Cost Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service Charge</p>
              <p className="text-2xl font-bold text-primary mt-1">${request.service_charge.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parts Cost</p>
              <p className="text-2xl font-bold text-primary mt-1">${request.parts_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-accent rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold text-primary mt-1">${request.total_cost.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-accent rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Deposit Paid</p>
              <p className="text-2xl font-bold text-primary mt-1">${request.deposit_paid.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-accent rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold mt-1 ${request.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${request.balance.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-accent rounded-md">
              <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
              <p className="text-2xl font-bold text-primary mt-1">{request.payment_completed ? 'Completed' : 'Pending'}</p>
            </div>
          </div>
        </Card>

        {/* Repair Timeline */}
        {request.repair_timeline.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Repair Timeline</h2>
            <div className="space-y-4">
              {request.repair_timeline.map((step, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Step</p>
                      <p className="font-semibold text-primary">{step.step}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="font-semibold text-primary">{new Date(step.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="font-semibold text-primary">{step.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Note</p>
                      <p className="font-semibold text-primary">{step.note || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Customer Confirmation */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Customer Confirmation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <DetailRow label="Signature" value={request.customer_confirmation.signature} />
            </div>
            <div>
              <DetailRow label="Device Collected" value={request.customer_confirmation.customer_collected} />
            </div>
            <div>
              <DetailRow label="Technician" value={request.customer_confirmation.technician} />
            </div>
          </div>
        </Card>

        {/* Timestamps */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Timestamps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DetailRow label="Created" value={new Date(request.created_at).toLocaleString()} />
            </div>
            <div>
              <DetailRow label="Last Updated" value={new Date(request.updated_at).toLocaleString()} />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={() => navigate(`/edit/${request.id}`)} className="flex-1">
            Edit Request
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
