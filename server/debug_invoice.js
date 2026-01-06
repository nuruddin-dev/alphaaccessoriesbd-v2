
require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/invoice');

const debugInvoice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const invoiceNumber = '1767087814502';
        const invoice = await Invoice.findOne({ invoiceNumber })
            .populate('customer', 'name phoneNumber');

        if (!invoice) {
            console.log('Invoice not found');
            process.exit();
        }

        console.log('Invoice Details:');
        console.log(JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            grandTotal: invoice.grandTotal,
            subTotal: invoice.subTotal,
            paid: invoice.paid,
            due: invoice.due,
            totalFee: invoice.totalFee,
            payments: invoice.payments,
            created: invoice.created
        }, null, 2));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debugInvoice();
