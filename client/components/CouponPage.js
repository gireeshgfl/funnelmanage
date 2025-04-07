import React, { useState } from 'react';
import { Input, Button, Card, Modal } from '@components/ui/components';
import { Plus, Edit2, Trash2, Send, X } from 'lucide-react';

const CouponPage = ({ pushCouponsToChat }) => {
  const [coupons, setCoupons] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
  };

  const handleEditCoupon = (index) => {
    setCouponData({ ...coupons[index] });
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = (index) => {
    setCoupons(coupons.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const { originalPrice, offerPrice, points } = couponData;
    if (!/^\d+$/.test(originalPrice) || !/^\d+$/.test(offerPrice) || !/^\d+$/.test(points)) {
      alert('Prices and points must be numeric values');
      return;
    }

    const newCoupon = {
      id: editIndex !== null ? coupons[editIndex].id : Math.floor(Math.random() * 1000),
      ...couponData
    };

    if (editIndex !== null) {
      setCoupons(coupons.map((c, i) => i === editIndex ? newCoupon : c));
    } else {
      setCoupons([...coupons, newCoupon]);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setCouponData({
      name: '',
      institution: '',
      course: '',
      originalPrice: '',
      offerPrice: '',
      points: ''
    });
    setEditIndex(null);
  };

  const handlePushCoupon = (coupon) => {
    if (pushCouponsToChat) {
      pushCouponsToChat([coupon]);
    } else {
      console.log('Coupon pushed to chat:', coupon);
    }
  };

  const handlePushAllCoupons = () => {
    if (coupons.length === 0) return;
    if (pushCouponsToChat) {
      pushCouponsToChat(coupons);
    } else {
      console.log('All coupons pushed to chat:', coupons);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Coupon Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} created
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleCreateCoupon}
            variant="primary"
            icon={<Plus size={18} />}
          >
            Create Coupon
          </Button>
          <Button
            onClick={handlePushAllCoupons}
            variant="outline"
            disabled={coupons.length === 0}
            icon={<Send size={18} />}
          >
            Push All
          </Button>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.length === 0 ? (
          <Card className="col-span-full py-12 text-center">
            <div className="text-gray-400 dark:text-gray-500">
              <p className="text-lg mb-2">No coupons created yet</p>
              <p>Click "Create Coupon" to get started</p>
            </div>
          </Card>
        ) : (
          coupons.map((coupon, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg truncate">{coupon.name}</h3>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleEditCoupon(index)}
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={16} />}
                  />
                  <Button
                    onClick={() => handleDeleteCoupon(index)}
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    className="text-red-500 hover:text-red-600"
                  />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Institution:</span>
                  <span>{coupon.institution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Course:</span>
                  <span>{coupon.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Original Price:</span>
                  <span>${coupon.originalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Offer Price:</span>
                  <span className="text-green-600 dark:text-green-400">${coupon.offerPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Points:</span>
                  <span>{coupon.points}</span>
                </div>
              </div>
              
              <Button
                onClick={() => handlePushCoupon(coupon)}
                variant="primary"
                size="sm"
                className="w-full mt-4"
                icon={<Send size={16} />}
              >
                Push Coupon
              </Button>
            </Card>
          ))
        )}
      </div>

      {/* Coupon Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        resetForm();
      }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editIndex !== null ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <Input
            label="Coupon Name"
            value={couponData.name}
            onChange={(e) => setCouponData({...couponData, name: e.target.value})}
            placeholder="Summer Special"
          />
          <Input
            label="Institution Name"
            value={couponData.institution}
            onChange={(e) => setCouponData({...couponData, institution: e.target.value})}
            placeholder="ABC University"
          />
          <Input
            label="Course Name"
            value={couponData.course}
            onChange={(e) => setCouponData({...couponData, course: e.target.value})}
            placeholder="Web Development"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Original Price ($)"
              type="number"
              value={couponData.originalPrice}
              onChange={(e) => setCouponData({...couponData, originalPrice: e.target.value})}
              placeholder="100"
            />
            <Input
              label="Offer Price ($)"
              type="number"
              value={couponData.offerPrice}
              onChange={(e) => setCouponData({...couponData, offerPrice: e.target.value})}
              placeholder="75"
            />
          </div>
          <Input
            label="Points Required"
            type="number"
            value={couponData.points}
            onChange={(e) => setCouponData({...couponData, points: e.target.value})}
            placeholder="500"
          />
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
          >
            {editIndex !== null ? 'Update' : 'Create'} Coupon
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CouponPage;