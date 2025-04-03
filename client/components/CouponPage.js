import React, { useState } from 'react';
import { Input, Button } from '@components/ui/components';

const CouponPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [couponData, setCouponData] = useState({
    name: '',
    institution: '',
    course: '',
    originalPrice: '',
    offerPrice: '',
    points: ''
  });
  const [editIndex, setEditIndex] = useState(null);

  const handleCreateCoupon = () => {
    setOpenModal(true);
  };

  const handleEditCoupon = (index) => {
    const selectedCoupon = coupons[index];
    setCouponData({ ...selectedCoupon });
    setEditIndex(index);
    setOpenModal(true);
  };

  const handleDeleteCoupon = (index) => {
    const updatedCoupons = [...coupons];
    updatedCoupons.splice(index, 1);
    setCoupons(updatedCoupons);
  };

  const handleSubmit = () => {
    if (!isNumeric(couponData.originalPrice) || !isNumeric(couponData.offerPrice) || !isNumeric(couponData.points)) {
      alert('Original Price, Offer Price, and Points must be numeric.');
      return;
    }

    const couponId = Math.floor(Math.random() * 1000);
    const coupon = {
      id: couponId,
      ...couponData
    };

    if (editIndex !== null) {
      const updatedCoupons = [...coupons];
      updatedCoupons[editIndex] = coupon;
      setCoupons(updatedCoupons);
      setEditIndex(null);
    } else {
      setCoupons([...coupons, coupon]);
    }

    setOpenModal(false);
    setCouponData({
      name: '',
      institution: '',
      course: '',
      originalPrice: '',
      offerPrice: '',
      points: ''
    });
  };

  const isNumeric = (value) => {
    return /^\d+$/.test(value);
  };

  const handlePushCoupon = (coupon) => {
    console.log('Coupon pushed to chat box:', coupon);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Coupon Management</h1>

      <Button 
        onClick={handleCreateCoupon} 
        variant="primary"
        className="mb-6"
      >
        Create Coupon
      </Button>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Generated Coupons</h2>
        {coupons.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No coupons created yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 mb-2">{coupon.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Institution: {coupon.institution}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Course: {coupon.course}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Original Price: {coupon.originalPrice}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Offer Price: {coupon.offerPrice}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Points: {coupon.points}</p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handlePushCoupon(coupon)} 
                    variant="primary"
                    size="small"
                  >
                    Push Coupon
                  </Button>
                  <Button 
                    onClick={() => handleEditCoupon(index)} 
                    variant="outline"
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteCoupon(index)} 
                    variant="danger"
                    size="small"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {editIndex !== null ? 'Edit' : 'Create'} Coupon
            </h2>
            
            <div className="space-y-4">
              <Input
                label="Name"
                value={couponData.name}
                onChange={(e) => setCouponData({ ...couponData, name: e.target.value })}
                placeholder="Enter name"
              />
              <Input
                label="Institution Name"
                value={couponData.institution}
                onChange={(e) => setCouponData({ ...couponData, institution: e.target.value })}
                placeholder="Enter institution name"
              />
              <Input
                label="Course Name"
                value={couponData.course}
                onChange={(e) => setCouponData({ ...couponData, course: e.target.value })}
                placeholder="Enter course name"
              />
              <Input
                label="Original Price"
                type="number"
                value={couponData.originalPrice}
                onChange={(e) => setCouponData({ ...couponData, originalPrice: e.target.value })}
                placeholder="Enter original price"
              />
              <Input
                label="Offer Price"
                type="number"
                value={couponData.offerPrice}
                onChange={(e) => setCouponData({ ...couponData, offerPrice: e.target.value })}
                placeholder="Enter offer price"
              />
              <Input
                label="Points"
                type="number"
                value={couponData.points}
                onChange={(e) => setCouponData({ ...couponData, points: e.target.value })}
                placeholder="Enter points"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                onClick={() => setOpenModal(false)} 
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                variant="primary"
              >
                {editIndex !== null ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponPage;