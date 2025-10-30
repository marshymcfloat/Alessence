import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import EnrolledSubjectsCard from "./EnrolledSubjectsCard";

const EnrolledSubjectsDataContainer = async () => {
  const data = await getEnrolledSubject();

  return (
    <>
      <EnrolledSubjectsCard enrolledSubjects={data ? data.data : undefined} />
    </>
  );
};

export default EnrolledSubjectsDataContainer;
