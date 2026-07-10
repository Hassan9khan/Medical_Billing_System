// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ title, value, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
    <div className={`w-14 h-14 rounded-full ${colorClass} flex-shrink-0 flex items-center justify-center shadow-inner`}></div>
    <div className="ml-5">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-extrabold text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBills, setRecentBills] = useState([]); // New state for the table
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch both the top-level stats AND the bill history simultaneously
        const [statsRes, billsRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reports/bills')
        ]);
        
        setStats(statsRes.data);
        // Grab only the first 5 bills for the "Recent Activity" widget
        setRecentBills(billsRes.data.slice(0, 5)); 
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-gray-500 font-medium animate-pulse">Loading dashboard data...</div>;
  if (error) return <div className="text-red-500 font-medium">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Today's Revenue" value={`$${stats.today_revenue.toFixed(2)}`} colorClass="bg-green-100" />
        <StatCard title="Bills Generated" value={stats.bills_generated_today} colorClass="bg-blue-100" />
        <StatCard title="Active Doctors" value={stats.active_doctors} colorClass="bg-purple-100" />
        <StatCard title="Total Patients" value={stats.total_patients} colorClass="bg-orange-100" />
      </div>
      
      {/* NEW: Recent Invoices Table replacing the empty chart area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Recent Invoices</h3>
          <Link to="/reports" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            View All Reports &rarr;
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">No recent invoices found.</td>
                </tr>
              ) : (
                recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800 text-sm">
                      {new Date(bill.date_issued).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-500 text-sm font-mono">
                      {bill.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 font-bold text-gray-800 text-sm">
                      ${bill.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bill.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {bill.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;