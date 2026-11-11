import { createFileRoute } from "@tanstack/react-router";
import { CourseEditor } from "@/admin/components/CourseEditor";
import { canAccess, useSession } from "@/admin/session";
import { useAdmin } from "@/admin/store";
import { EmptyState, Loading, NoAccess, PageHeader } from "@/admin/components/kit";

export const Route = createFileRoute("/admin/courses/$slug")({ component: EditCourse });

function EditCourse() {
  const { slug } = Route.useParams(); const { user } = useSession(); const data = useAdmin();
  if (!data || !user) return <Loading />;
  if (!canAccess(user.role, "courses")) return <NoAccess what="Courses" />;
  const course = data.courses.find((c) => c.id === slug);
  if (!course) return <><PageHeader title="Course not found" back={{ to: "/admin/courses", label: "All courses" }} /><EmptyState title="We can’t find that course">It may have been deleted.</EmptyState></>;
  return <CourseEditor key={course.id} initial={course} isNew={false} user={user} />;
}
