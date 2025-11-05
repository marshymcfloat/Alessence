import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import EnrolledSubjectContent from "./EnrolledSubjectContent";

const EnrolledSubjectDataContainer = async () => {
  const enrolledSubjects = await getEnrolledSubject();

  return (
    <>
      <EnrolledSubjectContent data={enrolledSubjects.data?.subjects} />
    </>
  );
};

export default EnrolledSubjectDataContainer;
