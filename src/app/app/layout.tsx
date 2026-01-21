import DashboardClientLayout from "@/components/layout/DashboardClientLayout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  );
}
