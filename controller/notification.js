const Notification = require('../models/notification');
const SalesOrder = require('../models/salesOrder'); 
const Request = require('../models/request'); 
//  update delivery status and create notification
exports.updateDeliveryStatus = async (req, res) => {
    const { orderId } = req.params;
    const { deliveryStatus, deliveryDate,adminName } = req.body;

    try {
        const order = await SalesOrder.findById(orderId); 
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.deliveryStatus = deliveryStatus;
        order.deliveryDate = deliveryDate;
        order.adminName = adminName;
        await order.save();

        // Save the notification
        const notificationMessage = `Order ${order.orderId} Product has been Delivered`;
        const newNotification = new Notification({
            message: notificationMessage,
        });
        await newNotification.save();

        res.json({ success: true, message: 'Delivery status updated and notification created' });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Function to get all notifications
exports.getAll = async (req, res) => {
    try {
        const notifications = await Notification.find({});
        // Ensure it returns an array
        res.status(200).json(notifications || []);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};
//delete by id notifications

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification' });
    }
  };




// Save return request to the database
exports.saveReturnRequest = async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ error: " Product ID is required" });
    }

    const message = `Return requested for Product ID: ${productId}`;

    try {
        const request = new Request({ productId, message });
        await request.save();
        res.status(201).json({ success: true, message: 'Return request send successfully' });
    } catch (error) {
        console.error('Error saving return request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 }); // Sort by latest
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.deleteRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const request = await Request.findByIdAndDelete(id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.status(200).json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};