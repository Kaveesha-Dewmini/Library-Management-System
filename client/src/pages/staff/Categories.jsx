import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
export const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [error, setError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCategories();
    }, []);
    const handleOpenAdd = () => {
        setEditingCat(null);
        setName('');
        setSlug('');
        setColor('#3B82F6');
        setError('');
        setModalOpen(true);
    };
    const handleOpenEdit = (cat) => {
        setEditingCat(cat);
        setName(cat.name);
        setSlug(cat.slug);
        setColor(cat.color || '#3B82F6');
        setError('');
        setModalOpen(true);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        try {
            if (editingCat) {
                await api.patch(`/categories/${editingCat.id}`, { name, slug, color });
            }
            else {
                await api.post('/categories', { name, slug, color });
            }
            setModalOpen(false);
            fetchCategories();
        }
        catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to save category');
        }
        finally {
            setFormLoading(false);
        }
    };
    const handleDelete = async (cat) => {
        if (!confirm(`Are you sure you want to delete category "${cat.name}"?`))
            return;
        try {
            await api.delete(`/categories/${cat.id}`);
            fetchCategories();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to delete category');
        }
    };
    return (<div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize the library catalogue into genres and subjects
          </p>
        </div>

        <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-semibold rounded-xl transition shadow-sm">
          <Plus className="w-4 h-4"/>
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Color</th>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Books Assigned</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (<tr key={cat.id} className="hover:bg-gray-50/50">
                <td className="py-3 px-4">
                  <div style={{ backgroundColor: cat.color }} className="w-6 h-6 rounded-lg shadow-xs border border-black/10"></div>
                </td>
                <td className="py-3 px-4 font-semibold text-gray-800">{cat.name}</td>
                <td className="py-3 px-4 font-mono text-gray-500">{cat.slug}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium text-gray-700">
                    {cat.bookCount || 0} books
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenEdit(cat)} className="p-1 text-gray-400 hover:text-[#1E3A5F] transition">
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-1 text-gray-400 hover:text-rose-600 transition">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCat ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {error && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
            <input type="text" required value={name} onChange={(e) => {
            setName(e.target.value);
            if (!editingCat) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            }
        }} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Slug *</label>
            <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().trim())} className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Badge Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"/>
              <span className="font-mono text-gray-600">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {formLoading ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>);
};
