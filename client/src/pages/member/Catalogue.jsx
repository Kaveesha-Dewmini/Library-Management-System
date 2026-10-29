import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Search, Book as BookIcon, BookmarkPlus } from 'lucide-react';
import { GeneratedCover } from '../../components/common/GeneratedCover';
export const Catalogue = () => {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [availableOnly, setAvailableOnly] = useState(false);
    const [reservingId, setReservingId] = useState(null);
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
    }, [search, selectedCat, availableOnly]);
    useEffect(() => {
        fetchCategories();
    }, []);
    const handleReserve = async (bookId, title) => {
        setReservingId(bookId);
        try {
            await api.post('/reservations', { bookId });
            alert(`Reserved "${title}"! You have been added to the queue.`);
            fetchBooks();
        }
        catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to place reservation.');
        }
        finally {
            setReservingId(null);
        }
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">Library Catalogue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore books, Discover New Arrivals, and Place Reservations for Borrowed Titles
        </p>
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author, subject, or ISBN..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        </div>

        <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] w-full sm:w-auto">
          <option value="">All Categories</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>
              {c.name}
            </option>))}
        </select>

        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer shrink-0">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"/>
          Available Now
        </label>
      </div>

      {/* Books Grid */}
      {loading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {[...Array(12)].map((_, i) => (<div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>))}
        </div>) : books.length === 0 ? (<div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
          <BookIcon className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
          <h3 className="font-serif font-bold text-lg text-gray-700">No books found</h3>
          <p className="text-xs text-gray-500 mt-1">Try searching another title or category.</p>
        </div>) : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {books.map((b) => (<div key={b.id} className="bg-white p-3 rounded-2xl border border-gray-100 book-card-shadow flex flex-col justify-between group">
              <div>
                <GeneratedCover title={b.title} authors={b.authors} coverUrl={b.coverUrl} color={b.categories?.[0]?.color || '#1E3A5F'} className="w-full h-48 mb-3"/>

                <h4 className="font-serif font-bold text-sm text-[#1A2238] line-clamp-1 group-hover:text-[#1E3A5F]">
                  {b.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {b.authors?.join(', ')}
                </p>
                <div className="text-[11px] font-mono text-gray-400 mt-1">
                  Shelf: {b.shelfLocation}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${b.availableCopies > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {b.availableCopies > 0
                    ? `${b.availableCopies} available`
                    : 'All copies out'}
                  </span>
                </div>

                {b.availableCopies === 0 ? (<button disabled={reservingId === b.id} onClick={() => handleReserve(b.id, b.title)} className="w-full py-1.5 bg-[#E09F3E] hover:bg-[#C88B32] text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <BookmarkPlus className="w-3.5 h-3.5"/>
                    Reserve Copy
                  </button>) : (<span className="text-[11px] text-gray-400 text-center py-1">
                    Available on shelf
                  </span>)}
              </div>
            </div>))}
        </div>)}
    </div>);
};
