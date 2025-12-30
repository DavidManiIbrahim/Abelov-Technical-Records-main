import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePersistentFormState } from '@/hooks/usePersistentState';
import { persistentState } from '@/utils/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestAPI } from '@/lib/api';
import { ServiceRequest, RepairTimelineStep } from '@/types/database';
import { Plus, Trash2, Loader2, LogOut, Home } from 'lucide-react';
import { FaStore, FaUser, FaLaptop, FaExclamationTriangle, FaTools, FaMoneyBill, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import abelovLogo from '@/assets/abelov-logo.png';



const FORM_STEPS = [
  { id: 'shop', title: 'Shop Information', icon: FaStore },
  { id: 'customer', title: 'Customer Information', icon: FaUser },
  { id: 'device', title: 'Device Information', icon: FaLaptop },
  { id: 'problem', title: 'Problem Description', icon: FaExclamationTriangle },
  { id: 'diagnosis', title: 'Diagnosis & Repair', icon: FaTools },
  { id: 'costs', title: 'Cost Summary', icon: FaMoneyBill },
  { id: 'confirmation', title: 'Confirmation', icon: FaCheckCircle },
];

export default function ServiceRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Persistent state for form progress (only for new forms, not edits)
  const [currentStep, setCurrentStep] = usePersistentFormState(
    isEditMode ? `edit_step_${id}` : 'new_request_step',
    0
  );

  // Default form data
  const getDefaultFormData = (): Partial<ServiceRequest> => ({
    technician_name: '',
    request_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    device_model: 'Laptop',
    device_brand: '',
    serial_number: '',
    operating_system: '',
    accessories_received: '',
    problem_description: '',
    diagnosis_date: '',
    diagnosis_technician: '',
    fault_found: '',
    parts_used: '',
    repair_action: '',
    status: 'Pending',
    service_charge: 0,
    parts_cost: 0,
    total_cost: 0,
    deposit_paid: 0,
    balance: 0,
    payment_completed: false,
    repair_timeline: [],
    customer_confirmation: {
      customer_collected: false,
      technician: '',
    },
  });

  // Persistent state for form data (only for new forms)
  const [formData, setFormData] = usePersistentFormState(
    isEditMode ? `edit_form_${id}` : 'new_request_form',
    getDefaultFormData()
  );

  // Persistent state for timeline steps
  const [timelineSteps, setTimelineSteps] = usePersistentFormState(
    isEditMode ? `edit_timeline_${id}` : 'new_request_timeline',
    [{ step: '', date: '', note: '', status: '' }]
  );

  useEffect(() => {
    if (isEditMode && id && user?.id) {
      loadRequest(id);
    } else {
      setLoading(false);
    }
  }, [id, user?.id, isEditMode]);

  const loadRequest = useCallback(async (requestId: string) => {
    try {
      const request = await serviceRequestAPI.getById(requestId);
      setFormData(request);
      setTimelineSteps(
        request.repair_timeline && request.repair_timeline.length > 0
          ? request.repair_timeline
          : [{ step: '', date: '', note: '', status: '' }]
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const updateField = (field: keyof ServiceRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateCosts = (service: number, parts: number, deposit: number) => {
    const total = service + parts;
    const balance = total - deposit;
    setFormData((prev) => ({
      ...prev,
      service_charge: service,
      parts_cost: parts,
      total_cost: total,
      deposit_paid: deposit,
      balance: balance,
    }));
  };

  const addTimelineStep = () => {
    setTimelineSteps([...timelineSteps, { step: '', date: '', note: '', status: '' }]);
  };

  const removeTimelineStep = (index: number) => {
    setTimelineSteps(timelineSteps.filter((_, i) => i !== index));
  };

  const updateTimelineStep = (index: number, field: keyof RepairTimelineStep, value: string) => {
    const updated = [...timelineSteps];
    updated[index] = { ...updated[index], [field]: value };
    setTimelineSteps(updated);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const filteredTimeline = timelineSteps.filter((step) => step.step.trim() !== '');

      if (isEditMode && id) {
        const updateData: Partial<ServiceRequest> = {
          ...formData,
          repair_timeline: filteredTimeline,
          updated_at: new Date().toISOString(),
        };
        await serviceRequestAPI.update(id, updateData);
        toast({
          title: 'Success!',
          description: `Service request ${id} has been updated.`,
        });
      } else {
        // For new requests we only submit the core fields (stop at Problem Description).
        const newRequest = {
          user_id: user.id,
          technician_name: formData.technician_name || '',
          request_date: formData.request_date || new Date().toISOString().split('T')[0],
          customer_name: formData.customer_name || '',
          customer_phone: formData.customer_phone || '',
          customer_email: formData.customer_email || '',
          customer_address: formData.customer_address || '',
          device_model: formData.device_model || 'Laptop',
          device_brand: formData.device_brand || '',
          serial_number: formData.serial_number || '',
          operating_system: formData.operating_system || '',
          accessories_received: formData.accessories_received || '',
          problem_description: formData.problem_description || '',
          status: (formData.status as string) || 'Pending',
          service_charge: formData.service_charge || 0,
          parts_cost: formData.parts_cost || 0,
          total_cost: formData.total_cost || 0,
          deposit_paid: formData.deposit_paid || 0,
          balance: formData.balance || 0,
          payment_completed: formData.payment_completed || false,
        };
        await serviceRequestAPI.create(newRequest as unknown as Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>);
        toast({
          title: 'Success!',
          description: `Service request ${newRequest.id} has been created.`,
        });
      }

      // Clear persistent form state on successful submission
      if (!isEditMode) {
        persistentState.clearFormState('new_request_form');
        persistentState.clearFormState('new_request_step');
        persistentState.clearFormState('new_request_timeline');
      }

      navigate('/dashboard');
    } catch (error: Error | unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleNext = () => {
    // For new requests, stop at Problem Description (index 3) and submit.
    if (!isEditMode && currentStep === 3) {
      handleSubmit();
      return;
    }

    // All fields are optional - just proceed to next step
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Shop Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <Label htmlFor="technician_name">Technician Name</Label>
                <Input
                  id="technician_name"
                  value={formData.technician_name}
                  onChange={(e) => updateField('technician_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="request_date">Request Date</Label>
                <Input
                  id="request_date"
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => updateField('request_date', e.target.value)}
                />
              </div>
            </div>
          </Card>
        );
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => updateField('customer_phone', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customer_address">Customer Address</Label>
                <Input
                  id="customer_address"
                  value={formData.customer_address}
                  onChange={(e) => updateField('customer_address', e.target.value)}
                />
              </div>
            </div>
          </Card>
        );
      case 2:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Device Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="device_model">Device Model</Label>
                <Select
                  value={formData.device_model}
                  onValueChange={(value) => updateField('device_model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="device_brand">Device Brand</Label>
                <Input
                  id="device_brand"
                  value={formData.device_brand}
                  onChange={(e) => updateField('device_brand', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => updateField('serial_number', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="operating_system">Operating System</Label>
                <Input
                  id="operating_system"
                  value={formData.operating_system}
                  onChange={(e) => updateField('operating_system', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="accessories_received">Accessories Received</Label>
                <Textarea
                  id="accessories_received"
                  value={formData.accessories_received}
                  onChange={(e) => updateField('accessories_received', e.target.value)}
                  placeholder="Charger, bag, mouse, etc."
                  className="min-h-20"
                />
              </div>
            </div>
          </Card>
        );
      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Problem Description</h2>
            <Label htmlFor="problem_description">Problem Description</Label>
            <Textarea
              id="problem_description"
              value={formData.problem_description}
              onChange={(e) => updateField('problem_description', e.target.value)}
              className="min-h-32"
            />
          </Card>
        );
      case 4:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Diagnosis & Repair Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diagnosis_date">Diagnosis Date</Label>
                <Input
                  id="diagnosis_date"
                  type="date"
                  value={formData.diagnosis_date}
                  onChange={(e) => updateField('diagnosis_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="diagnosis_technician">Diagnosis Technician</Label>
                <Input
                  id="diagnosis_technician"
                  value={formData.diagnosis_technician}
                  onChange={(e) => updateField('diagnosis_technician', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="fault_found">Fault Found</Label>
                <Textarea
                  id="fault_found"
                  value={formData.fault_found}
                  onChange={(e) => updateField('fault_found', e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="parts_used">Parts Used</Label>
                <Textarea
                  id="parts_used"
                  value={formData.parts_used}
                  onChange={(e) => updateField('parts_used', e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="repair_action">Repair Action</Label>
                <Textarea
                  id="repair_action"
                  value={formData.repair_action}
                  onChange={(e) => updateField('repair_action', e.target.value)}
                  className="min-h-20"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In-Progress">In-Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On-Hold">On-Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        );
      case 5:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Cost Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="service_charge">Service Charge</Label>
                <Input
                  id="service_charge"
                  type="number"
                  step="0.01"
                  value={formData.service_charge}
                  onChange={(e) =>
                    calculateCosts(
                      parseFloat(e.target.value) || 0,
                      formData.parts_cost || 0,
                      formData.deposit_paid || 0
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="parts_cost">Parts Cost</Label>
                <Input
                  id="parts_cost"
                  type="number"
                  step="0.01"
                  value={formData.parts_cost}
                  onChange={(e) =>
                    calculateCosts(
                      formData.service_charge || 0,
                      parseFloat(e.target.value) || 0,
                      formData.deposit_paid || 0
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="deposit_paid">Deposit Paid</Label>
                <Input
                  id="deposit_paid"
                  type="number"
                  step="0.01"
                  value={formData.deposit_paid}
                  onChange={(e) =>
                    calculateCosts(
                      formData.service_charge || 0,
                      formData.parts_cost || 0,
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-accent rounded-md">
                <Label>Total Cost</Label>
                <p className="text-2xl font-bold text-primary">₦{formData.total_cost?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="p-4 bg-accent rounded-md">
                <Label>Balance</Label>
                <p className={`text-2xl font-bold ${formData.balance! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₦{formData.balance?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="payment_completed"
                checked={formData.payment_completed}
                onCheckedChange={(checked) => updateField('payment_completed', checked)}
              />
              <Label htmlFor="payment_completed">Payment Completed</Label>
            </div>
          </Card>
        );
      case 6:
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Customer Confirmation</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer_collected"
                  checked={formData.customer_confirmation?.customer_collected}
                  onCheckedChange={(checked) =>
                    updateField('customer_confirmation', {
                      ...formData.customer_confirmation,
                      customer_collected: checked,
                    })
                  }
                />
                <Label htmlFor="customer_collected">Customer Collected Device</Label>
              </div>
              <div>
                <Label htmlFor="confirmation_technician">Technician</Label>
                <Input
                  id="confirmation_technician"
                  value={formData.customer_confirmation?.technician}
                  onChange={(e) =>
                    updateField('customer_confirmation', {
                      ...formData.customer_confirmation,
                      technician: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with User Info and Logout */}
      <div className="border-b bg-card p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">

            <img src={abelovLogo} alt="Abelov Logo" className="w-12 rounded-3xl h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Abelov Technical Records</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="md:flex hidden">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="md:hidden">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="md:flex hidden">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" onClick={handleLogout} className="md:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {FORM_STEPS[currentStep].icon({ className: 'w-5 h-5' })}
                {FORM_STEPS[currentStep].title}
              </h2>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {FORM_STEPS.length}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Steps */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  ← Back
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (!isEditMode && currentStep === 3) {
                    handleSubmit();
                  } else if (currentStep === FORM_STEPS.length - 1) {
                    handleSubmit();
                  } else {
                    handleNext();
                  }
                }}
                size="lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : !isEditMode && currentStep === 3 ? (
                  'Submit Request'
                ) : currentStep === FORM_STEPS.length - 1 ? (
                  isEditMode ? 'Update & Submit' : 'Submit'
                ) : (
                  'Next →'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
