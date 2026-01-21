import JournalEntryDetail from "@/app/app/accounting/journal/_components/JournalEntryDetail";

type PageProps = {
  params: { id: string };
};

export default function JournalEntryPage({ params }: PageProps) {
  return <JournalEntryDetail entryId={params.id} />;
}
