import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Book as BookIcon, Search, Plus, LayoutGrid, List, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { GeneratedCover } from '../../components/common/GeneratedCover';
import { Modal } from '../../components/common/Modal';
export const Books = () => {
    const { user } = useAuth();
    const isStaff = user && ['admin', 'librarian'].includes(user.role);
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    // Filters & Search
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [availableOnly, setAvailableOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    // Add / Edit Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        authors: '',
        isbn: '',
        publisher: '',
        publishedYear: '',
        categories: [],
        language: 'English',
        pages: '',
        shelfLocation: 'A-01',
        totalCopies: 1,
        coverUrl: '',
        description: ''
    });
    const fetchBooks = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search)
                params.append('q', search);
            if (selectedCat)
                params.append('category', selectedCat);
            if (availableOnly)
                params.append('available', 'true');
            if (sortBy)
                params.append('sort', sortBy);
            const res = await api.get(`/books?${params.toString()}`);
            if (res.data.success) {
                setBooks(res.data.data);
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        }
        catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        fetchBooks();
    }, [search, selectedCat, availableOnly, sortBy]);
    useEffect(() => {
        fetchCategories();
    }, []);
    const handleOpenAdd = () => {
        setEditingBook(null);
        setFormData({
            title: '',
            subtitle: '',
            authors: '',
            isbn: '',
            publisher: '',
            publishedYear: '',
            categories: categories.length > 0 ? [categories[0].id] : [],
            language: 'English',
            pages: '',
            shelfLocation: 'A-01',
            totalCopies: 2,
            coverUrl: '',
            description: ''
        });
        setFormError('');
        setModalOpen(true);
    };
    const handleOpenEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            subtitle: book.subtitle || '',
            authors: Array.isArray(book.authors) ? book.authors.join(', ') : '',
            isbn: book.isbn,
            publisher: book.publisher || '',
            publishedYear: book.publishedYear ? String(book.publishedYear) : '',
            categories: Array.isArray(book.categories) ? book.categories.map((c) => (typeof c === 'object' && c !== null ? (c.id || c._id?.toString() || c._id) : c)).filter(Boolean) : [],
            language: book.language || 'English',
            pages: book.pages ? String(book.pages) : '',
            shelfLocation: book.shelfLocation || 'A-01',
            totalCopies: book.totalCopies,
            coverUrl: book.coverUrl || '',
            description: book.description || ''
        });
        setFormError('');
        setModalOpen(true);
    };
    const handleSaveBook = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        const catIds = Array.isArray(formData.categories)
            ? formData.categories.map((c) => (typeof c === 'object' && c !== null ? (c.id || c._id?.toString() || c._id) : c)).filter(Boolean)
            : [];
        const payload = {
            title: formData.title,
            subtitle: formData.subtitle || '',
            authors: formData.authors.split(',').map((a) => a.trim()).filter(Boolean),
            isbn: formData.isbn,
            publisher: formData.publisher || '',
            publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
            categories: catIds,
            language: formData.language || 'English',
            pages: formData.pages ? parseInt(formData.pages) : 0,
            shelfLocation: formData.shelfLocation,
            totalCopies: Number(formData.totalCopies),
            coverUrl: formData.coverUrl || '',
            description: formData.description || ''
        };
        try {
            if (editingBook) {
                await api.patch(`/books/${editingBook.id}`, payload);
            }
            else {
                await api.post('/books', payload);
            }
            setModalOpen(false);
            fetchBooks();
        }
        catch (err) {
            const errData = err.response?.data?.error;
            if (errData?.details && errData.details.length > 0) {
                setFormError(`${errData.message}: ${errData.details.map((d) => `${d.field} (${d.message})`).join(', ')}`);
            } else {
                setFormError(errData?.message || 'Failed to save book.');
            }
        }
        finally {
            setFormLoading(false);
        }
    };
    const handleDeleteBook = async (id, title) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`))
            return;
        try {
            await api.delete(`/books/${id}`);
            fetchBooks();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to delete book');
        }
    };
    return (<div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Book Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse, search, and manage books in the library system
          </p>
        </div>

        <div>
          {isStaff && (<button onClick={handleOpenAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-semibold rounded-xl transition shadow-sm">
              <Plus className="w-4 h-4"/>
              Add Book
            </button>)}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, or ISBN..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          {/* Category Filter */}
          <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
            <option value="">All Categories</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>
                {c.name}
              </option>))}
          </select>

          {/* Sort By */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
            <option value="newest">Newest First</option>
            <option value="title">Title (A-Z)</option>
            <option value="-title">Title (Z-A)</option>
            <option value="most-borrowed">Most Borrowed</option>
          </select>

          {/* Available Checkbox */}
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"/>
            Available copies only
          </label>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-gray-100 rounded-xl shrink-0">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-[#1E3A5F] shadow-xs' : 'text-gray-500'}`} title="Grid View">
            <LayoutGrid className="w-4 h-4"/>
          </button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-[#1E3A5F] shadow-xs' : 'text-gray-500'}`} title="Table View">
            <List className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Book Grid or Table */}
      {loading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[...Array(12)].map((_, i) => (<div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>))}
        </div>) : books.length === 0 ? (<div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <BookIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
          <h3 className="font-serif font-bold text-lg text-gray-700">No books found</h3>
          <p className="text-xs text-gray-500 mt-1">Try clearing your search terms or filters</p>
        </div>) : viewMode === 'grid' ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {books.map((b) => (<div key={b.id} className="bg-white p-3 rounded-2xl border border-gray-100 book-card-shadow flex flex-col justify-between group relative">
              <div>
                <GeneratedCover title={b.title} authors={b.authors} coverUrl={b.coverUrl} color={b.categories?.[0]?.color || '#1E3A5F'} className="w-full h-48 mb-3"/>

                <h4 className="font-serif font-bold text-sm text-[#1A2238] line-clamp-1 leading-tight group-hover:text-[#1E3A5F]">
                  {b.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {b.authors?.join(', ')}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${b.availableCopies > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {b.availableCopies > 0 ? `${b.availableCopies}/${b.totalCopies} avail` : 'All out'}
                </span>

                {isStaff && (<div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(b)} className="p-1 text-gray-400 hover:text-[#1E3A5F] transition" title="Edit Book">
                      <Edit2 className="w-3.5 h-3.5"/>
                    </button>
                    {user?.role === 'admin' && (<button onClick={() => handleDeleteBook(b.id, b.title)} className="p-1 text-gray-400 hover:text-rose-600 transition" title="Delete Book">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>)}
                  </div>)}
              </div>
            </div>))}
        </div>) : (<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Title & Author</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Shelf</th>
                <th className="py-3 px-4">Copies</th>
                <th className="py-3 px-4">Borrowed</th>
                {isStaff && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((b) => (<tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {b.title}
                    <div className="text-[11px] font-normal text-gray-400">{b.authors?.join(', ')}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">{b.isbn}</td>
                  <td className="py-3 px-4">
                    {b.categories?.[0] ? (<span style={{ backgroundColor: `${b.categories[0].color}20`, color: b.categories[0].color }} className="px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {b.categories[0].name}
                      </span>) : ('—')}
                  </td>
                  <td className="py-3 px-4 font-mono">{b.shelfLocation}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${b.availableCopies > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {b.availableCopies} / {b.totalCopies}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{b.timesBorrowed} times</td>
                  {isStaff && (<td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(b)} className="p-1 text-gray-400 hover:text-[#1E3A5F] transition">
                          <Edit2 className="w-4 h-4"/>
                        </button>
                        {user?.role === 'admin' && (<button onClick={() => handleDeleteBook(b.id, b.title)} className="p-1 text-gray-400 hover:text-rose-600 transition">
                            <Trash2 className="w-4 h-4"/>
                          </button>)}
                      </div>
                    </td>)}
                </tr>))}
            </tbody>
          </table>
        </div>)}

      {/* Add / Edit Book Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBook ? 'Edit Book' : 'Add New Book to Catalogue'} maxWidth="max-w-2xl">
        <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
          {formError && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{formError}</span>
            </div>)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Dune" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">ISBN *</label>
              <input type="text" required value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="e.g. 9780441172719" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Subtitle</label>
              <input type="text" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Optional subtitle" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Publisher</label>
              <input type="text" value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} placeholder="e.g. Chilton Books" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Authors (comma-separated) *</label>
              <input type="text" required value={formData.authors} onChange={(e) => setFormData({ ...formData, authors: e.target.value })} placeholder="e.g. Frank Herbert" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Category *</label>
              <select value={formData.categories[0] || ''} onChange={(e) => setFormData({ ...formData, categories: [e.target.value] })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                {categories.map((c) => (<option key={c.id} value={c.id}>
                    {c.name}
                  </option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Total Copies *</label>
              <input type="number" min={1} required value={formData.totalCopies} onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Shelf Location *</label>
              <input type="text" required value={formData.shelfLocation} onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })} placeholder="e.g. F-10" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Language</label>
              <input type="text" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Published Year</label>
              <input type="number" value={formData.publishedYear} onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })} placeholder="e.g. 1965" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Page Count</label>
              <input type="number" value={formData.pages} onChange={(e) => setFormData({ ...formData, pages: e.target.value })} placeholder="e.g. 412" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Cover Image URL (optional)</label>
            <input type="url" value={formData.coverUrl} onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Book summary or description..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50">
              {formLoading ? 'Saving...' : editingBook ? 'Save Changes' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>);
};
