const axios = require('axios');
const SteadfastOrder = require('../models/steadfastOrder');

const STEADFAST_API_KEY = 'bqjf912zvykd2mzyc4r4hljmcqeriaiw';
const STEADFAST_SECRET_KEY = 'g98ufuanmspwgqfnk7ah7fgd';
const BASE_URL = 'https://portal.packzy.com/api/v1';

const syncToSteadfast = async (orderData) => {
    try {
        const headers = {
            'Api-Key': STEADFAST_API_KEY,
            'Secret-Key': STEADFAST_SECRET_KEY,
            'Content-Type': 'application/json'
        };

        const payload = {
            invoice: orderData.invoice,
            recipient_name: orderData.name,
            recipient_phone: orderData.phoneNumber,
            recipient_address: orderData.address,
            cod_amount: orderData.price,
            note: orderData.note || '',
            item_description: orderData.productName
        };

        const response = await axios.post(`${BASE_URL}/create_order`, payload, { headers });

        if (response.data.status === 200) {
            const consignment = response.data.consignment;
            const newCourierOrder = new SteadfastOrder({
                invoice: consignment.invoice,
                consignmentId: consignment.consignment_id,
                trackingCode: consignment.tracking_code,
                recipientName: consignment.recipient_name,
                recipientPhone: consignment.recipient_phone,
                recipientAddress: consignment.recipient_address,
                codAmount: consignment.cod_amount,
                status: consignment.status,
                note: consignment.note,
                itemDescription: orderData.productName
            });

            await newCourierOrder.save();
            return { success: true, trackingCode: consignment.tracking_code };
        }
        return { success: false, error: response.data.message };
    } catch (error) {
        console.error('Steadfast Sync Error:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { syncToSteadfast };
