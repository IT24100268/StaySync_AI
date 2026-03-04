import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rent: '',
    deposit: '',
    facilities: [],
    genderAllowed: 'any',
    latitude: '',
    longitude: '',
    address: '',
  });
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  const facilityOptions = ['WiFi', 'AC', 'Parking', 'Kitchen', 'Laundry', 'Security', 'Water 24/7'];

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await ownerApi.get(`/owner/listings/${id}`);
      setFormData(data);
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    if (!formData.rent || formData.rent < 1000) {
      setError('Rent must be at least LKR 1,000');
      return;
    }

    if (!formData.deposit || formData.deposit < 0) {
      setError('Deposit cannot be negative');
      return;
    }

    if (!formData.address || formData.address.length < 10) {
      setError('Please provide a complete address');
      return;
    }

    if (formData.facilities.length === 0) {
      setError('Please select at least one facility');
      return;
    }

    if (!id && photos.length === 0) {
      setError('Please upload at least one photo');
      return;
    }

    setLoading(true);

    try {
      if (id) {
        await ownerApi.put(`/owner/listings/${id}`, formData);
      } else {
        const { data } = await ownerApi.post('/owner/listings', formData);
        if (photos.length > 0) {
          await uploadPhotos(data.id);
        }
      }
      navigate('/owner/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotos = async (listingId) => {
    const formData = new FormData();
    photos.forEach((photo) => {
      if (photo instanceof File) {
        formData.append('photos', photo);
      }
    });
    await ownerApi.post(`/owner/listings/${listingId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleFacility = (facility) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.includes(facility)
        ? formData.facilities.filter((f) => f !== facility)
        : [...formData.facilities, facility],
    });
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {id ? 'Edit Listing' : 'Create New Listing'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Rent (LKR)</label>
            <input
              type="number"
              required
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Deposit (LKR)</label>
            <input
              type="number"
              required
              value={formData.deposit}
              onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Facilities</label>
          <div className="flex flex-wrap gap-2">
            {facilityOptions.map((facility) => (
              <button
                key={facility}
                type="button"
                onClick={() => toggleFacility(facility)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  formData.facilities.includes(facility)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {facility}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Gender Allowed</label>
          <select
            value={formData.genderAllowed}
            onChange={(e) => setFormData({ ...formData, genderAllowed: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="any">Any</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Latitude</label>
            <input
              type="text"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Longitude</label>
            <input
              type="text"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photos</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload size={48} className="text-slate-400 mb-2" />
              <p className="text-slate-600 font-semibold">Click to upload photos</p>
            </label>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo instanceof File ? URL.createObjectURL(photo) : photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Listing' : 'Create Listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/owner/listings')}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
