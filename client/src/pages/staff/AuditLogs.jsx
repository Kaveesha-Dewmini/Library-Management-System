import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
export const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/audit-logs');
            if (res.data.success) {
                setLogs(res.data.data);
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
        fetchLogs();
    }, []);
    return (<div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#1A2238]">System Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">
          Immutable log of administrative operations, checkouts, returns, and parameter updates
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Details / Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (<tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Loading audit logs...
                </td>
              </tr>) : logs.length === 0 ? (<tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No audit logs recorded yet.
                </td>
              </tr>) : (logs.map((log) => (<tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {log.actor?.name || 'System'}
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {log.actor?.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-blue-50 text-[#1E3A5F] border border-blue-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-600">{log.entity}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-[11px] max-w-md truncate">
                    {JSON.stringify(log.meta)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
