// src/pages/Patients.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // NEW: State to track if we are editing an existing patient
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // UPDATED: Now handles both Create (POST) and Update (PUT)
  const onSubmit = async (data) => {
    try {
      if (editingId) {
        // If we have an ID, we are updating
        await api.put(`/patients/${editingId}`, data);
      } else {
        // If no ID, we are creating
        await api.post('/patients', data);
      }
      
      closeModal();
      fetchPatients();
    } catch (error) {
      console.error("Error saving patient:", error);
      alert("Failed to save patient.");
    }
  };

  // NEW: Populates the form with existing data when "Edit" is clicked
  const handleEdit = (patient) => {
    setEditingId(patient.id);
    // React Hook Form's reset() can be used to inject default values!
    reset({
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      address: patient.address || ''
    });
    setShowModal(true);
  };

  // NEW: Handles deletion with a safety prompt
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this patient? This cannot be undone.")) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients(); // Refresh the table
      } catch (error) {
        console.error("Error deleting patient:", error);
        alert("Failed to delete patient.");
      }
    }
  };

  // NEW: Helper to securely close the modal and wipe the form clean
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset({ first_name: '', last_name: '', phone: '', date_of_birth: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Patient Directory</h2>
        <button 
          onClick={() => { setEditingId(null); reset(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Add New Patient
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading patients...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">DOB</th>
                <th className="p-4 font-medium">Address</th>
                {/* NEW: Actions Column Header */}
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No patients found.</td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{patient.first_name} {patient.last_name}</td>
                    <td className="p-4 text-gray-600">{patient.phone}</td>
                    <td className="p-4 text-gray-600">{patient.date_of_birth}</td>
                    <td className="p-4 text-gray-600 truncate max-w-xs">{patient.address || 'N/A'}</td>
                    
                    {/* NEW: Actions Buttons */}
                    <td className="p-4 text-right space-x-3">
                      <button 
                        onClick={() => handleEdit(patient)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(patient.id)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            {/* UPDATED: Dynamic Title */}
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              {editingId ? 'Edit Patient' : 'Register New Patient'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* ... KEEP YOUR EXISTING FORM INPUTS EXACTLY AS THEY WERE ... */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input {...register('first_name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  {errors.first_name && <span className="text-red-500 text-xs">Required</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input {...register('last_name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  {errors.last_name && <span className="text-red-500 text-xs">Required</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input {...register('phone', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" {...register('date_of_birth', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea {...register('address')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal} // UPDATED
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {/* UPDATED: Dynamic Button Text */}
                  {editingId ? 'Update Patient' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;