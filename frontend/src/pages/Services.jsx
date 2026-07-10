// src/pages/Services.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, data);
      } else {
        await api.post('/services', data);
      }
      closeModal();
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service.");
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    reset({
      name: service.name,
      description: service.description,
      cost: service.cost
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service? This cannot be undone.")) {
      try {
        await api.delete(`/services/${id}`);
        fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("Failed to delete service.");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    reset({ name: '', description: '', cost: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Services Catalog</h2>
        <button 
          onClick={() => { setEditingId(null); reset(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          + Add New Service
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading services...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-medium">Service Name</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Cost</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No services found.</td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{service.name}</td>
                    <td className="p-4 text-gray-600">{service.description}</td>
                    <td className="p-4 text-gray-600 font-semibold">${service.cost.toFixed(2)}</td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleEdit(service)} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Edit</button>
                      <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900 font-medium text-sm">Delete</button>
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
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Name</label>
                <input {...register('name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea {...register('description', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" rows="3"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('cost', { required: true, valueAsNumber: true })} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingId ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;