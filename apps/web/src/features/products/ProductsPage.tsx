import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Modal } from "../../components/ui/Modal";
import { productsApi } from "../../lib/api";
import type { Product } from "@ecom-erp/shared";
import { Pencil, Plus } from "lucide-react";

interface ProductForm {
  name: string;
  buyingPriceTND: string;
  sellingPriceTND: string;
  matchKeywords: string;
  active: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  buyingPriceTND: "",
  sellingPriceTND: "",
  matchKeywords: "",
  active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.list();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      buyingPriceTND: String(product.buyingPriceTND),
      sellingPriceTND: String(product.sellingPriceTND),
      matchKeywords: product.matchKeywords.join(", "),
      active: product.active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        buyingPriceTND: parseFloat(form.buyingPriceTND),
        sellingPriceTND: parseFloat(form.sellingPriceTND),
        matchKeywords: form.matchKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        active: form.active,
      };

      if (editing) {
        await productsApi.update(editing.id, payload);
      } else {
        await productsApi.create(payload);
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    await productsApi.update(product.id, { active: !product.active });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Créez vos produits et définissez les mots-clés pour matcher l'Excel X-Delivery"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Nom",
                  "Prix achat",
                  "Prix vente",
                  "Mots-clés matching",
                  "Statut",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    Aucun produit. Ajoutez votre premier produit.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.buyingPriceTND} DT
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.sellingPriceTND} DT
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-500">
                      {p.matchKeywords.join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1 text-sm text-accent-blue hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Modifier le produit" : "Nouveau produit"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Compresseur Portable"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix achat (DT)
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.buyingPriceTND}
                onChange={(e) =>
                  setForm({ ...form, buyingPriceTND: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix vente (DT)
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.sellingPriceTND}
                onChange={(e) =>
                  setForm({ ...form, sellingPriceTND: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mots-clés matching (Excel Marchandise)
            </label>
            <input
              value={form.matchKeywords}
              onChange={(e) =>
                setForm({ ...form, matchKeywords: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Compresseur Portable, منفاخ"
            />
            <p className="mt-1 text-xs text-gray-400">
              Mots courts recommandés — ex: <code>Compresseur Portable</code> (texte
              entre parenthèses dans Marchandise Excel)
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Produit actif
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
