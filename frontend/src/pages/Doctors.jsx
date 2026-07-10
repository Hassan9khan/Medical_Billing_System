// src/pages/Doctors.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, data);
      } else {
        await api.post('/doctors', data);
      }
      closeModal();
      fetchDoctors();
    } catch (error) {
      console.error("Error saving doctor:", error);
      alert("Failed to save doctor.");
    }
  };

  const handleEdit = (doctor) => {
    setEditingId(doctor.id);
    reset({
      name: doctor.name,
      specialization: doctor.specialization,
      consultation_fee: doctor.consultation_fee,
      is_active: doctor.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor? This cannot be undone.")) {
      try {
        await api.delete(`/doctors/${id}`);
        fetchDoctors();
      } catch (error) {
        console.error("Error deleting doctor:", error);
        alert("Failed to delete doctor.");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset({ name: '', specialization: '', consultation_fee: '', is_active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Doctor Directory</h2>
        <button 
          onClick={() => { setEditingId(null); reset(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Add New Doctor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading doctors...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Specialization</th>
                <th className="p-4 font-medium">Consultation Fee</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No doctors found.</td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">Dr. {doctor.name}</td>
                    <td className="p-4 text-gray-600">{doctor.specialization}</td>
                    <td className="p-4 text-gray-600">${doctor.consultation_fee.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doctor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {doctor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleEdit(doctor)} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Edit</button>
                      <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:text-red-900 font-medium text-sm">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              {editingId ? 'Edit Doctor' : 'Register New Doctor'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input {...register('name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input {...register('specialization', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation Fee ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('consultation_fee', { required: true, valueAsNumber: true })} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              {editingId && (
                <div className="flex items-center space-x-2 mt-4">
                  <input type="checkbox" {...register('is_active')} className="h-4 w-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">Doctor is Active</label>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingId ? 'Update Doctor' : 'Save Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;