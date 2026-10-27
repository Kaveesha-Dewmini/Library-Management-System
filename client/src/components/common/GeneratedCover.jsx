import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';
export const GeneratedCover = ({ title, authors = [], coverUrl, color = '#1E3A5F', className = 'w-full h-56' }) => {
    const [imageFailed, setImageFailed] = useState(false);
    if (coverUrl && !imageFailed) {
        return (<img src={coverUrl} alt={title} onError={() => setImageFailed(true)} className={`${className} object-cover rounded-xl shadow-sm`} loading="lazy"/>);
    }
    return (<div style={{
            background: `linear-gradient(135deg, ${color} 0%, #1A2238 100%)`
        }} className={`${className} rounded-xl shadow-md p-4 text-white flex flex-col justify-between relative overflow-hidden border border-white/10`}>
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <BookIcon className="w-16 h-16 text-white"/>
      </div>

      <div className="z-10">
        <div className="text-xs uppercase tracking-wider text-white/70 font-mono mb-1">
          Shelfwise
        </div>
        <h4 className="font-serif font-bold text-base leading-snug line-clamp-3 text-white">
          {title}
        </h4>
      </div>

      <div className="z-10 border-t border-white/20 pt-2">
        <p className="text-xs text-white/80 line-clamp-1 italic font-sans">
          {authors.join(', ') || 'Unknown Author'}
        </p>
      </div>
    </div>);
};
