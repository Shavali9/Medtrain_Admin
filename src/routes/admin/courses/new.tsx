import { createFileRoute } from "@tanstack/react-router";
import { blankCourse, CourseEditor } from "@/admin/components/CourseEditor";
import { canAccess, useSession } from "@/admin/session";
import { Loading, NoAccess } from "@/admin/components/kit";

export const Route = createFileRoute("/admin/courses/new")({ component: NewCourse });

function NewCourse() {
  const { user } = useSession();
  if (!user) return <Loading />;
  if (!canAccess(user.role, "courses")) return <NoAccess what="Courses" />;
  return <CourseEditor initial={blankCourse()} isNew user={user} />;
}
