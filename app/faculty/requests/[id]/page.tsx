"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RequestStatus } from "@/types";
import type { Database } from "@/types/supabase";
import supabase from "@/lib/supabase";
import { ExternalLink, FileText, Calendar, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface RequestDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RequestDetail({ params }: RequestDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<
    Database["public"]["Tables"]["permission_requests"]["Row"] | null
  >(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }

      setUser(sessionData.session.user);

      const { data, error } = await supabase
        .from("permission_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching request:", error);
        setError("Failed to load the request details");
        return;
      }

      // Check if the faculty/HOD is from the same department
      const { data: userData } = await supabase
        .from("users")
        .select("department, role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (userData?.department !== data.department_id) {
        setError("You do not have permission to view this request");
      }

      // Check if the user is HOD (only HODs can approve/reject)
      if (userData?.role !== "hod" && data.status === RequestStatus.PENDING) {
        setError("Only HODs can approve or reject requests");
      }

      setRequest(data);
    };

    fetchRequestDetails();
  }, [id, router]);

  const handleResponse = async (status: RequestStatus) => {
    setLoadingAction(status === RequestStatus.APPROVED ? "approve" : "reject");
    setError(null);

    try {
      if (!user) {
        throw new Error("User session not available");
      }
      const { error } = await supabase
        .from("permission_requests")
        .update({
          status,
          response_message: responseMessage,
          responded_at: new Date().toISOString(),
          responded_by: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      // Refresh the page data
      const { data } = await supabase
        .from("permission_requests")
        .select("*")
        .eq("id", id)
        .single();

      setRequest(data);

      // Navigate back to the requests list
      router.push("/faculty/requests");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to respond to the request"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-semibold text-red-600">{error}</h3>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/faculty/requests")}
        >
          Back to requests
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-semibold">Loading...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request details</h1>
          <p className="text-muted-foreground">
            Review the request and leave a clear response.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/faculty/requests")}
        >
          Back to requests
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{request.event_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Event Date</p>
                <p>{new Date(request.event_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Event Location</p>
                <p>{request.event_location}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">Reason for Attending</p>
              <p>{request.reason}</p>
            </div>

            <div>
              <p className="font-medium mb-1">Detailed Description</p>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>

            <div className="pt-4 border-t">
              <p className="font-medium mb-2">Supporting Documents</p>
              <div className="flex flex-wrap gap-4">
                {request.proof_url && (
                  <a
                    href={request.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-muted px-3 py-2 text-sm hover:bg-muted/80"
                  >
                    <FileText size={16} className="mr-2" />
                    <span>View Proof</span>
                    <ExternalLink size={14} className="ml-2" />
                  </a>
                )}
                {request.letter_url && (
                  <a
                    href={request.letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-muted px-3 py-2 text-sm hover:bg-muted/80"
                  >
                    <FileText size={16} className="mr-2" />
                    <span>View Letter</span>
                    <ExternalLink size={14} className="ml-2" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{request.student_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roll Number</p>
                <p className="font-medium">{request.student_roll_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Request Date</p>
                <p className="font-medium">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {request.status === RequestStatus.PENDING && (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add a short note for the student (optional)."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  disabled={loadingAction !== null}
                />
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  className="w-1/2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                  onClick={() => handleResponse(RequestStatus.REJECTED)}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "reject" ? "Submitting..." : "Decline"}
                </Button>
                <Button
                  className="w-1/2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleResponse(RequestStatus.APPROVED)}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "approve" ? "Submitting..." : "Approve"}
                </Button>
              </CardFooter>
            </Card>
          )}

          {request.status !== RequestStatus.PENDING && (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p
                    className={`font-medium ${
                      request.status === RequestStatus.APPROVED
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() +
                      request.status.slice(1)}
                  </p>
                </div>
                {request.response_message && (
                  <div>
                    <p className="text-sm text-muted-foreground">Message</p>
                    <p>{request.response_message}</p>
                  </div>
                )}
                {request.responded_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Responded On
                    </p>
                    <p>{new Date(request.responded_at).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
