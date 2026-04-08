import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { RequestStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { Suspense } from "react";
import Loader from "@/components/ui/Loader";

// Create a component for the actual content
async function DashboardContent() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Get authenticated user from auth server
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Get user department
  const { data: userData } = await supabase
    .from("users")
    .select("department")
    .eq("id", authUser.id)
    .single();

  const department = userData?.department || "";

  // Count permission requests by status
  const { data: pendingCount } = await supabase
    .from("permission_requests")
    .select("id", { count: "exact", head: true })
    .eq("department_id", department)
    .eq("status", RequestStatus.PENDING);

  const { data: approvedCount } = await supabase
    .from("permission_requests")
    .select("id", { count: "exact", head: true })
    .eq("department_id", department)
    .eq("status", RequestStatus.APPROVED);

  const { data: rejectedCount } = await supabase
    .from("permission_requests")
    .select("id", { count: "exact", head: true })
    .eq("department_id", department)
    .eq("status", RequestStatus.REJECTED);

  // Count unique students who have submitted requests
  const { data: requests } = await supabase
    .from("permission_requests")
    .select("student_id")
    .eq("department_id", department);

  const uniqueStudentIds = new Set(requests?.map((r) => r.student_id) || []);
  const studentCount = uniqueStudentIds.size;

  // Get recent pending requests
  const { data: recentPendingRequests } = await supabase
    .from("permission_requests")
    .select("*")
    .eq("department_id", department)
    .eq("status", RequestStatus.PENDING)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faculty overview</h1>
        <p className="text-muted-foreground">
          A clear view of requests for the {department} department.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Requests
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvedCount?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Requests
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rejectedCount?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Pending requests</h2>
          <Link href="/faculty/requests">
            <Button>View all</Button>
          </Link>
        </div>

        {recentPendingRequests?.length ? (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <div className="p-4">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">Student</th>
                      <th className="py-2 text-left font-medium">Event</th>
                      <th className="py-2 text-left font-medium">Date</th>
                      <th className="py-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPendingRequests.map((request) => (
                      <tr key={request.id} className="border-b last:border-0">
                        <td className="py-2">
                          <div>
                            <div className="font-medium">
                              {request.student_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.student_roll_number}
                            </div>
                          </div>
                        </td>
                        <td className="py-2">{request.event_name}</td>
                        <td className="py-2">
                          {new Date(request.event_date).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <Link href={`/faculty/requests/${request.id}`}>
                            <Button variant="outline" size="sm">
                              View details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No pending requests</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              All caught up. New requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
