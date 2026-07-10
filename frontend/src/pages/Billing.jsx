// src/pages/Billing.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { generateInvoice } from '../utils/pdfGenerator';
import api from '../services/api';

const Billing = () => {
  // State for our dropdowns and lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to show the generated bill after successful submission
  const [generatedBill, setGeneratedBill] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // 1. Fetch all necessary data on page load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Promise.all lets us fetch all three at the exact same time for maximum speed
        const [patientsRes, doctorsRes, servicesRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors'),
          api.get('/services')
        ]);
        
        setPatients(patientsRes.data);
        // Only show active doctors in the billing dropdown
        setDoctors(doctorsRes.data.filter(d => d.is_active)); 
        setServices(servicesRes.data);
      } catch (error) {
        console.error("Error fetching data for billing:", error);
        alert("Failed to load necessary data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // 2. Handle Form Submission
  const onSubmit = async (data) => {
    try {
      // React Hook Form captures checkboxes as an array if multiple are selected, 
      // or a single string if only one is selected. We ensure it's always an array.
      const serviceIds = Array.isArray(data.service_ids) 
        ? data.service_ids 
        : [data.service_ids];

      const payload = {
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        service_ids: serviceIds,
        discount: data.discount || 0
      };

      const response = await api.post('/bills', payload);
      setGeneratedBill(response.data);
      reset(); // Clear form for the next patient
    } catch (error) {
      console.error("Error creating bill:", error);
      alert(error.response?.data?.detail || "Failed to create bill.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading billing module...</div>;
  }

  // Helper to trigger the PDF download
  const handleDownloadPDF = () => {
    // We need to look up the full patient and doctor objects based on the IDs saved in the bill
    const selectedPatient = patients.find(p => p.id === generatedBill.patient_id);
    const selectedDoctor = doctors.find(d => d.id === generatedBill.doctor_id);
    
    generateInvoice(generatedBill, selectedPatient, selectedDoctor);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Generate New Invoice</h2>
        <p className="text-gray-500 mt-1">Select the patient, attending doctor, and applied services.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* FORM SECTION */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Patient Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
              <select {...register('patient_id', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">-- Choose a Patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.phone})</option>
                ))}
              </select>
              {errors.patient_id && <span className="text-red-500 text-xs">Patient is required</span>}
            </div>

            {/* Doctor Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attending Doctor</label>
              <select {...register('doctor_id', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">-- Choose a Doctor --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name} (${d.consultation_fee})</option>
                ))}
              </select>
              {errors.doctor_id && <span className="text-red-500 text-xs">Doctor is required</span>}
            </div>

            {/* Services Checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services Rendered</label>
              <div className="space-y-2 border border-gray-200 p-4 rounded-md max-h-48 overflow-y-auto bg-gray-50">
                {services.map(s => (
                  <label key={s.id} className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={s.id} 
                      {...register('service_ids', { required: true })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">{s.name}</span>
                    <span className="text-gray-400 text-sm">(${s.cost})</span>
                  </label>
                ))}
              </div>
              {errors.service_ids && <span className="text-red-500 text-xs mt-1 block">At least one service is required</span>}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount ($)</label>
              <input 
                type="number" 
                step="0.01" 
                defaultValue={0}
                {...register('discount', { valueAsNumber: true })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>

            <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold text-lg shadow-sm transition-colors">
              Calculate & Generate Bill
            </button>
          </form>
        </div>

        {/* RESULTS SECTION */}
        <div className="flex-1">
          {generatedBill ? (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800">Invoice Summary</h3>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                  {generatedBill.payment_status}
                </span>
              </div>
              
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Consultation Fee:</span>
                  <span className="font-medium">${generatedBill.consultation_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Services Subtotal:</span>
                  <span className="font-medium">${(generatedBill.subtotal - generatedBill.consultation_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span className="font-medium">${generatedBill.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount:</span>
                  <span className="font-medium">-${generatedBill.discount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-black text-green-600">${generatedBill.total_amount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-black text-green-600">${generatedBill.total_amount.toFixed(2)}</span>
                </div>
                
                {/* ADD THIS BUTTON BLOCK */}
                <div className="mt-8 pt-4">
                  <button 
                    onClick={handleDownloadPDF}
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold text-md shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Download PDF Invoice</span>
                  </button>
                </div>
                {/* END BUTTON BLOCK */}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>Fill out the form to calculate the invoice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;