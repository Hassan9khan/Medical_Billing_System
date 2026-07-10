// src/pages/Reports.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
// Let's reuse our PDF generator so they can download past invoices!
import { generateInvoice } from '../utils/pdfGenerator'; 

const Reports = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // 1. Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [patientsRes, doctorsRes, billsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors'),
          api.get('/reports/bills') // Fetches all bills by default
        ]);
        setPatients(patientsRes.data);
        setDoctors(doctorsRes.data);
        setBills(billsRes.data);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Handle Search Filter
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Axios automatically formats these into query parameters!
      const response = await api.get('/reports/bills', {
        params: {
          patient_id: selectedPatient || undefined,
          doctor_id: selectedDoctor || undefined
        }
      });
      setBills(response.data);
    } catch (error) {
      console.error("Error filtering bills:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle PDF Download for historical bills
  const downloadHistoricalPDF = (bill) => {
    const patient = patients.find(p => p.id === bill.patient_id);
    const doctor = doctors.find(d => d.id === bill.doctor_id);
    
    if (patient && doctor) {
      generateInvoice(bill, patient, doctor);
    } else {
      alert("Cannot generate PDF: Missing patient or doctor data.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Invoice History & Reports</h2>
        <p className="text-gray-500 mt-1">Filter and view past billing records.</p>
      </div>

      {/* Filter Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Patient</label>
            <select 
              value={selectedPatient} 
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Patients</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Doctor</label>
            <select 
              value={selectedDoctor} 
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 h-10 transition-colors"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading records...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-medium">Date Issued</th>
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No invoices found matching your criteria.</td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">{new Date(bill.date_issued).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-500 text-sm font-mono">{bill.id.slice(-6).toUpperCase()}</td>
                    <td className="p-4 font-bold text-gray-800">${bill.total_amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bill.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {bill.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => downloadHistoricalPDF(bill)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;