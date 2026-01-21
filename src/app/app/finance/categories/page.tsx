import { getOrCreateDbUser } from "@/lib/auth";
import CrudPage from "@/app/app/finance/_components/CrudPage";

const categoryTypes = [
  { label: "Receita", value: "INCOME" },
  { label: "Despesa", value: "EXPENSE" },
];

export default async function CategoriesPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <CrudPage
      title="Categorias financeiras"
      endpoint="/api/finance/categories"
      canEdit={canEdit}
      fields={[
        { name: "name", label: "Nome", type: "text" },
        {
          name: "type",
          label: "Tipo",
          type: "select",
          options: categoryTypes,
        },
      ]}
    />
  );
}
