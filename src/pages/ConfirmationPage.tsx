import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceRequest } from "@/types/serviceRequest";
import { getServiceRequestById } from "@/utils/storage";
import { CheckCircle, FileText, ArrowLeft, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "@/hooks/use-toast";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const foundRequest = getServiceRequestById(id);
      setRequest(foundRequest || null);
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your PDF.",
      });

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`service-request-${request?.id}.pdf`);

      toast({
        title: "PDF Downloaded!",
        description: "Your service request has been exported as PDF.",
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">Request Not Found</h2>
          <p className="text-muted-foreground mb-6">The service request could not be found.</p>
          <Button onClick={() => navigate("/")}>Create New Request</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-4 print:hidden">
          <Button onClick={() => navigate("/requests")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
        
        <Card className="p-8" ref={printRef}>
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary mb-2">Service Request Created!</h1>
            <p className="text-muted-foreground">Your service request has been successfully submitted.</p>
          </div>

          <div className="bg-accent p-6 rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Request ID: {request.id}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{request.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{request.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Device</p>
                <p className="font-medium">{request.device_model} - {request.device_brand}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{request.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-4 text-primary">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge:</span>
                <span className="font-medium">${request.service_charge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Cost:</span>
                <span className="font-medium">${request.parts_cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total Cost:</span>
                <span className="font-bold text-primary">${request.total_cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Paid:</span>
                <span className="font-medium">${request.deposit_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Balance Due:</span>
                <span className="font-bold text-destructive">${request.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className={`font-medium ${request.payment_completed ? 'text-green-600' : 'text-orange-600'}`}>
                  {request.payment_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={() => navigate("/requests")} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View All Requests
            </Button>
            <Button onClick={() => navigate("/")} className="flex-1">
              Create New Request
            </Button>
          </div>
          <div className="print:hidden"></div>
        </Card>
      </div>
    </div>
  );
}
