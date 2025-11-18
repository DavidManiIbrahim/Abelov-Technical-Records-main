import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceRequest } from "@/types/serviceRequest";
import { getServiceRequests } from "@/utils/storage";
import { Plus, FileText, Calendar, User, Phone, Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setRequests(getServiceRequests().reverse());
  }, []);

  const filteredRequests = requests.filter(request => {
    const query = searchQuery.toLowerCase();
    return (
      request.customer_name.toLowerCase().includes(query) ||
      request.customer_phone.toLowerCase().includes(query) ||
      request.device_model.toLowerCase().includes(query) ||
      request.device_brand.toLowerCase().includes(query) ||
      request.id.toLowerCase().includes(query) ||
      request.status.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Awaiting":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Service Requests</h1>
              <p className="text-muted-foreground">View and manage all service requests</p>
            </div>
            <Button onClick={() => navigate("/")}>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, phone, device, ID, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredRequests.length === 0 && searchQuery ? (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search query.</p>
            <Button onClick={() => setSearchQuery("")} variant="outline">
              Clear Search
            </Button>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Service Requests Yet</h3>
            <p className="text-muted-foreground mb-6">Create your first service request to get started.</p>
            <Button onClick={() => navigate("/")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Service Request
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <Card
                key={request.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Request ID</p>
                    <p className="font-mono font-semibold text-primary">{request.id}</p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{request.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{request.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span>{request.device_model} - {request.device_brand}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(request.request_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="font-bold text-primary">₦{request.total_cost.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-bold text-destructive">₦{request.balance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/edit/${request.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => navigate(`/confirmation/${request.id}`)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
