
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Loader2, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface RescheduleRequest {
  id: string;
  jobId: string;
  requestedBy: string;
  originalDate: string;
  requestedDate: string;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  job: {
    jobNumber: string;
    lead: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export default function RescheduleRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(
    null
  );
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "pending"
  );

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const url = `/api/admin/reschedule-requests${
        filter !== "all" ? `?status=${filter.toUpperCase()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching reschedule requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/reschedule-requests/${selectedRequest.id}/${actionType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewNotes: reviewNotes.trim() || undefined,
          }),
        }
      );

      if (response.ok) {
        setSelectedRequest(null);
        setActionType(null);
        setReviewNotes("");
        fetchRequests();
      } else {
        alert("Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (request: RescheduleRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setReviewNotes("");
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setReviewNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reschedule Requests</h1>
        <p className="text-muted-foreground">
          Manage customer installation reschedule requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
        >
          Approved
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          onClick={() => setFilter("rejected")}
        >
          Rejected
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No {filter !== "all" ? filter : ""} reschedule requests found
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Original Date</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.job.jobNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.job.lead.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{request.job.lead.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.job.lead.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.originalDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(request.requestedDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {request.reason || (
                          <span className="text-muted-foreground italic">
                            No reason provided
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(request.status) as any}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openDialog(request, "approve")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(request, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {request.reviewedBy && (
                            <div>
                              By: {request.reviewedBy}
                              <br />
                              {request.reviewedAt &&
                                format(
                                  new Date(request.reviewedAt),
                                  "MMM d, yyyy"
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Reschedule Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will update the job's scheduled date and notify the customer."
                : "This will reject the request and notify the customer."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Job:</span>
                  <span className="ml-2 font-medium">
                    {selectedRequest.job.jobNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="ml-2">{selectedRequest.job.lead.name}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Original Date:
                  </span>
                  <span className="ml-2">
                    {format(new Date(selectedRequest.originalDate), "MMMM d, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Requested Date:
                  </span>
                  <span className="ml-2 font-medium">
                    {format(new Date(selectedRequest.requestedDate), "MMMM d, yyyy")}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div>
                    <span className="text-sm text-muted-foreground">Reason:</span>
                    <div className="mt-1 text-sm">{selectedRequest.reason}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">
                  Notes {actionType === "reject" && "(Optional)"}
                </Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Add any notes about this approval..."
                      : "Explain why this request is being rejected..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "approve" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Request
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Request
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
