import { PageShell } from "@/components/layout/PageShell";
import { SubmissionWizard } from "@/components/submit/SubmissionWizard";

export const metadata = { title: "Submit a Scenario" };

export default function SubmitPage() {
  return (
    <PageShell
      title="Submit a Scenario"
      subtitle="Describe a hybrid intelligence scenario using the guided form. Submissions are reviewed before appearing in the knowledge graph."
    >
      <SubmissionWizard />
    </PageShell>
  );
}
