import { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import ownerApi from '../../api/ownerApi';

export default function OwnerVerification() {
  const [verification, setVerification] = useState({
    nicPassport: '',
    addressProof: '',
    businessReg: '',
    status: 'pending',
  });
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    try {
      const { data } = await ownerApi.get('/owner/me');
      if (data.verification) {
        setVerification(data.verification);
      }
    } catch (error) {
      console.error('Failed to fetch verification:', error);
    }
  };

  const handleFileChange = (field, file) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setFiles({ ...files, [field]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!verification.nicPassport || verification.nicPassport.length < 5) {
      alert('Please enter a valid NIC/Passport number');
      setLoading(false);
      return;
    }

    if (!verification.addressProof || verification.addressProof.length < 10) {
      alert('Please enter a valid address');
      setLoading(false);
      return;
    }

    if (!files.nicDoc) {
      alert('Please upload NIC/Passport document');
      setLoading(false);
      return;
    }

    if (!files.addressDoc) {
      alert('Please upload address proof document');
      setLoading(false);
      return;
    }

    try {
      // Upload documents
      const formData = new FormData();
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      if (Object.keys(files).length > 0) {
        await ownerApi.post('/owner/verification/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Update verification info
      await ownerApi.put('/owner/verification', verification);
      
      alert('Verification submitted successfully!');
      fetchVerification();
    } catch (error) {
      console.error('Failed to submit verification:', error);
      alert('Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (verification.status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle size={20} />
            <span className="font-semibold">Verified</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
            <XCircle size={20} />
            <span className="font-semibold">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
            <Clock size={20} />
            <span className="font-semibold">Pending Review</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile Verification</h1>
        {getStatusBadge()}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900 font-semibold mb-2">Why verify your profile?</p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Build trust with potential tenants</li>
          <li>• Get priority in search results</li>
          <li>• Access premium features</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            NIC / Passport Number *
          </label>
          <input
            type="text"
            required
            value={verification.nicPassport}
            onChange={(e) => setVerification({ ...verification, nicPassport: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Upload NIC/Passport Copy *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('nicDoc', e.target.files[0])}
              className="hidden"
              id="nic-upload"
            />
            <label htmlFor="nic-upload" className="flex flex-col items-center cursor-pointer">
              <Upload size={32} className="text-slate-400 mb-2" />
              <p className="text-slate-600 text-sm">
                {files.nicDoc ? files.nicDoc.name : 'Click to upload'}
              </p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Address Proof (Utility Bill) *
          </label>
          <input
            type="text"
            required
            value={verification.addressProof}
            onChange={(e) => setVerification({ ...verification, addressProof: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter address"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Upload Address Proof *
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('addressDoc', e.target.files[0])}
              className="hidden"
              id="address-upload"
            />
            <label htmlFor="address-upload" className="flex flex-col items-center cursor-pointer">
              <Upload size={32} className="text-slate-400 mb-2" />
              <p className="text-slate-600 text-sm">
                {files.addressDoc ? files.addressDoc.name : 'Click to upload'}
              </p>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Business Registration (Optional)
          </label>
          <input
            type="text"
            value={verification.businessReg}
            onChange={(e) => setVerification({ ...verification, businessReg: e.target.value })}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Registration number"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Upload Business Registration (Optional)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('businessDoc', e.target.files[0])}
              className="hidden"
              id="business-upload"
            />
            <label htmlFor="business-upload" className="flex flex-col items-center cursor-pointer">
              <Upload size={32} className="text-slate-400 mb-2" />
              <p className="text-slate-600 text-sm">
                {files.businessDoc ? files.businessDoc.name : 'Click to upload'}
              </p>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || verification.status === 'approved'}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
