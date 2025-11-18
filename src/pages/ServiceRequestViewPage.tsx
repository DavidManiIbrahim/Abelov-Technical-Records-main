import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serviceRequestAPI } from '@/lib/api';
import { ServiceRequest } from '@/types/database';
import { ArrowLeft, Loader2, Printer, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ServiceRequestViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
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
      case 'Successful':
        return 'bg-green-100 text-green-800';
      case 'Unsuccessful':
        return 'bg-red-100 text-red-800';
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: string | number | boolean }) => (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
      </p>
    </div>
  );

  const handlePrint = () => {
    if (!printRef.current) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <style>{`
        @media print {
          @page {
            size: 8.5in 11in;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-hide {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          .print-content {
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid;
          }
          .print-section-break {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        {/* Header - Hide on Print */}
        <div className="print-hide mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Service Request Details</h1>
            <p className="text-muted-foreground">Request ID: {request.id}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="md:flex hidden">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handlePrint} variant="outline" className="md:hidden">
              <Printer className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate(`/edit/${request.id}`)} variant="outline" className="md:flex hidden">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={() => navigate(`/edit/${request.id}`)} variant="outline" className="md:hidden">
              <Edit className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="md:flex hidden">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="md:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print-content">
          {/* Print Header */}
          <div className="print-show mb-6 text-center hidden">
            <h1 className="text-2xl font-bold mb-1">Abelov Technical Records</h1>
            <p className="text-sm text-muted-foreground">Service Request Report</p>
            <hr className="my-4" />
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
          </div>

          {/* Unified Form - All Sections in One */}
          <Card className="p-6">
            {/* Request Header */}
            <div className="mb-6 pb-6 border-b">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <DetailRow label="Request ID" value={request.id} />
                </div>
                <div>
                  <DetailRow label="Request Date" value={new Date(request.request_date).toLocaleDateString()} />
                </div>
                <div>
                  <DetailRow label="Status" value={request.status} />
                </div>
                <div>
                  <DetailRow label="Technician" value={request.technician_name} />
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Customer</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <DetailRow label="Name" value={request.customer_name} />
                </div>
                <div>
                  <DetailRow label="Phone" value={request.customer_phone} />
                </div>
                <div>
                  <DetailRow label="Address" value={request.customer_address} />
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div className="mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Device</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <DetailRow label="Brand" value={request.device_brand} />
                </div>
                <div>
                  <DetailRow label="Model" value={request.device_model} />
                </div>
                <div>
                  <DetailRow label="Serial" value={request.serial_number} />
                </div>
                <div>
                  <DetailRow label="OS" value={request.operating_system} />
                </div>
                {request.accessories_received && (
                  <div className="md:col-span-2">
                    <DetailRow label="Accessories" value={request.accessories_received} />
                  </div>
                )}
              </div>
            </div>

            {/* Problem Description */}
            <div className="mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Problem</h3>
              <p className="text-sm whitespace-pre-wrap">{request.problem_description}</p>
            </div>

            {/* Diagnosis & Repair */}
            {(request.fault_found || request.parts_used || request.repair_action) && (
              <div className="print-hide mb-6 pb-6 border-b print-section-break">
                <h3 className="text-lg font-semibold mb-3 text-primary">Diagnosis & Repair</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {request.diagnosis_date && (
                    <div>
                      <DetailRow label="Diagnosis Date" value={new Date(request.diagnosis_date).toLocaleDateString()} />
                    </div>
                  )}
                  {request.diagnosis_technician && (
                    <div>
                      <DetailRow label="Technician" value={request.diagnosis_technician} />
                    </div>
                  )}
                </div>
                {request.fault_found && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Fault Found</p>
                    <p className="text-sm whitespace-pre-wrap">{request.fault_found}</p>
                  </div>
                )}
                {request.parts_used && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Parts Used</p>
                    <p className="text-sm whitespace-pre-wrap">{request.parts_used}</p>
                  </div>
                )}
                {request.repair_action && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Repair Action</p>
                    <p className="text-sm whitespace-pre-wrap">{request.repair_action}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cost Summary */}
            <div className="print-hide mb-6 pb-6 border-b print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Costs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <DetailRow label="Service" value={`₦${request.service_charge.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Parts" value={`₦${request.parts_cost.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Total" value={`₦${request.total_cost.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Deposit" value={`₦${request.deposit_paid.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Balance" value={`₦${request.balance.toFixed(2)}`} />
                </div>
                <div>
                  <DetailRow label="Payment" value={request.payment_completed ? 'Completed' : 'Pending'} />
                </div>
              </div>
            </div>

            {/* Timeline */}
            {request.repair_timeline.length > 0 && (
              <div className="print-hide mb-6 pb-6 border-b print-section-break">
                <h3 className="text-lg font-semibold mb-3 text-primary">Timeline</h3>
                <div className="space-y-3">
                  {request.repair_timeline.map((step, index) => (
                    <div key={index} className="p-3 border rounded text-sm">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Step</p>
                          <p className="font-semibold">{step.step}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Date</p>
                          <p className="font-semibold">{new Date(step.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Status</p>
                          <p className="font-semibold">{step.status}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Note</p>
                          <p className="font-semibold">{step.note || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Confirmation */}
            <div className="print-hide pb-6 print-section-break">
              <h3 className="text-lg font-semibold mb-3 text-primary">Confirmation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <DetailRow label="Device Collected" value={request.customer_confirmation.customer_collected} />
                </div>
                <div>
                  <DetailRow label="Technician" value={request.customer_confirmation.technician} />
                </div>
              </div>
            </div>

            {/* Timestamps - Hide on Print */}
            <div className="print-hide text-xs text-muted-foreground mt-6 pt-4 border-t">
              <p>Created: {new Date(request.created_at).toLocaleString()}</p>
              <p>Last Updated: {new Date(request.updated_at).toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* Action Buttons - Hide on Print */}
        <div className="print-hide flex gap-4 mt-8">
          <Button onClick={() => navigate(`/edit/${request.id}`)} className="flex-1 md:flex hidden">
            <Edit className="w-4 h-4 mr-2" />
            Edit Request
          </Button>
          <Button onClick={() => navigate(`/edit/${request.id}`)} className="md:hidden">
            <Edit className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 md:flex hidden">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="md:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
