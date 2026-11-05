import React from 'react';
import {
  Clock,
  CheckCircle2,
  PackageCheck,
  Bike,
  CheckCheck,
  XCircle,
  Sparkles,
} from 'lucide-react';

const statusConfig = {
  pending: {
    label: 'Order Placed',
    colorClass: 'status-pending',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    colorClass: 'status-confirmed',
    icon: CheckCircle2,
  },
  preparing: {
    label: 'Preparing & Packing',
    colorClass: 'status-preparing',
    icon: Sparkles,
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    colorClass: 'status-ready',
    icon: PackageCheck,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    colorClass: 'status-transit',
    icon: Bike,
  },
  delivered: {
    label: 'Delivered',
    colorClass: 'status-delivered',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'Cancelled',
    colorClass: 'status-cancelled',
    icon: XCircle,
  },
};

const OrderStatusBadge = ({ status = 'pending' }) => {
  const normalizedStatus = (status || 'pending').toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <span className={`order-status-badge ${config.colorClass}`}>
      <IconComponent size={14} className="status-icon" />
      <span>{config.label}</span>
    </span>
  );
};

export default OrderStatusBadge;

