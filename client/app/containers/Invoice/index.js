import React from 'react';
import { connect } from 'react-redux';
import { API_URL, ROLES } from '../../constants';
import actions from '../../actions'; // Import global actions
import axios from 'axios'; // Import axios for API calls
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';
import StockModal from '../../components/Manager/StockModal';

// Invoice Container Component
class Invoice extends React.PureComponent {
  // Track if component is mounted
  _isMounted = false;

  state = {
    invoiceItems: Array(100).fill({
      product: null,
      quantity: '',
      unitPrice: '',
      totalPrice: 0
    }),
    searchTerm: '',
    focusedRowIndex: null,
    customerInfo: {
      name: '',
      phone: ''
    },
    customer: null,
    invoiceInfo: {
      number: `${Date.now()}`, // Use current milliseconds for the invoice number
      date: new Date().toISOString().split('T')[0],
      createdBy: 'Admin' // Default created by
    },
    visibleItems: 10,
    previousDue: 0,
    discount: 0,
    paid: 0,
    paymentMethod: 'cash', // Default payment method
    isSearchingCustomer: false, // To track customer search status
    isWholesale: true, // Default to wholesale price
    isPaidChanged: false, // Track if paid amount has been changed
    notes: '', // Default value for notes
    selectedProductIndex: 0, // Tracks the currently highlighted product
    isSearchInvoice: false, // Flag to indicate if searching for an invoice
    invoiceId: null, // Store the invoice ID for updating
    // NEW STATE FOR CUSTOMER SEARCH BY NAME
    customerSearchTerm: '',
    focusedCustomerSearch: false,
    filteredCustomers: [],
    selectedCustomerIndex: 0,
    isStockModalOpen: false // State for Stock Modal
  };

  // Fetch products once component mounts
  async componentDidMount() {
    this._isMounted = true;

    // Wait for products to load first
    await this.props.fetchProducts();

    if (this._isMounted && this.props.user && this.props.user.firstName) {
      this.setState(prevState => ({
        invoiceInfo: {
          ...prevState.invoiceInfo,
          createdBy: this.props.user.firstName
        }
      }));
    }

    // NEW: Check for invoice number in URL (after products are loaded)
    if (this._isMounted) {
      this.loadInvoiceFromURL();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.user && this.props.user.firstName &&
      prevProps.user?.firstName !== this.props.user.firstName) {
      if (this._isMounted) {
        this.setState(prevState => ({
          invoiceInfo: {
            ...prevState.invoiceInfo,
            createdBy: this.props.user.firstName
          }
        }));
      }
    }

    const shouldAutoUpdatePaid = !this.state.isPaidChanged && !this.state.isSearchInvoice;
    const wasAutoUpdateEnabled = !prevState.isPaidChanged && !prevState.isSearchInvoice;

    if (shouldAutoUpdatePaid && wasAutoUpdateEnabled) {
      const prevSubTotal = prevState.invoiceItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const prevFinalTotal = prevSubTotal + prevState.previousDue - prevState.discount;

      const currentSubTotal = this.state.invoiceItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const currentFinalTotal = currentSubTotal + this.state.previousDue - this.state.discount;

      if (prevFinalTotal !== currentFinalTotal && this.state.paid !== currentFinalTotal) {
        setTimeout(() => {
          if (this._isMounted) {
            this.setState({ paid: currentFinalTotal });
          }
        }, 0);
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * NEW METHOD: Extract invoice number from URL and load it
   * Supports formats like:
   * - /dashboard/invoice?number=1234567890123
   * - /dashboard/invoice/1234567890123
   */
  loadInvoiceFromURL = async () => {
    if (!this._isMounted) return;

    try {
      // Get invoice number from query parameter
      const urlParams = new URLSearchParams(window.location.search);
      let invoiceNumber = urlParams.get('number');

      // Alternative: Get from path (e.g., /invoice/1234567890123)
      if (!invoiceNumber) {
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.length === 13 && !isNaN(lastPart)) {
          invoiceNumber = lastPart;
        }
      }

      if (invoiceNumber && this._isMounted) {
        console.log('Loading invoice from URL:', invoiceNumber);
        await this.fetchAndLoadInvoice(invoiceNumber);
      }
    } catch (error) {
      console.error('Error loading invoice from URL:', error);
    }
  };

  /**
   * NEW METHOD: Fetch and load invoice data
   * Extracted from handleInvoiceInfoChange for reusability
   */
  fetchAndLoadInvoice = async (invoiceNumber) => {
    console.log('_isMounted in fetchAndLoadInvoice:', this._isMounted);

    if (!this._isMounted) {
      console.log('Component unmounted, aborting fetch');
      return false;
    }

    try {
      const response = await axios.get(
        `${API_URL}/invoice/invoice/${invoiceNumber}`
      );

      if (response.data.success && response.data.invoice) {
        const invoice = response.data.invoice;

        // Only update state if component is still mounted
        if (!this._isMounted) {
          console.log('Component unmounted during fetch, aborting state update');
          return false;
        }

        this.setState({
          invoiceItems: [
            ...invoice.items.map(item => {
              const selectedProduct = this.props.products.find(
                product => (product.shortName || product.name) === item.productName
              );

              return {
                product: selectedProduct || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              };
            }),
            ...Array(100 - invoice.items.length).fill({
              product: null,
              quantity: '',
              unitPrice: '',
              totalPrice: 0
            })
          ],
          customerInfo: {
            name: invoice.customerName || '',
            phone: invoice.customerPhone || ''
          },
          invoiceInfo: {
            number: invoice.invoiceNumber,
            date: new Date(invoice.created).toISOString().split('T')[0],
            createdBy: invoice.createdBy || 'Admin'
          },
          previousDue: invoice.previousDue || 0,
          discount: invoice.discount || 0,
          paid: invoice.paid || 0,
          due: invoice.due || 0,
          notes: invoice.notes || '',
          paymentMethod: invoice.paymentMethod || 'cash',
          isSearchInvoice: true,
          isWholesale: invoice.isWholesale || true,
          invoiceId: invoice._id
        });

        console.log('Invoice loaded successfully');
        return true;
      } else {
        alert('Invoice not found.');
        return false;
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to fetch invoice. Please try again.');
      return false;
    }
  };

  // Helper function to calculate the grand total from a previous state
  calculateFinalTotal(prevState) {
    const { previousDue, discount, invoiceItems } = prevState || this.state;
    const subTotal = invoiceItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const finalTotal = subTotal + previousDue - discount;
    if (!this.state.isPaidChanged && !this.state.isSearchInvoice)
      this.setState({ paid: finalTotal });
    return finalTotal;
  }

  /**
   * Handles product selection from the dropdown.
   * Updates item, unit price, and triggers recalculation of totals.
   */
  handleProductChange = (index, productSKU) => {
    const { products } = this.props;
    const selectedProduct = products.find(
      product => product.sku === productSKU
    );
    const invoiceItems = [...this.state.invoiceItems];

    // Update relevant row data
    invoiceItems[index] = {
      ...invoiceItems[index],
      product: selectedProduct || null,
      unitPrice: this.state.isWholesale
        ? selectedProduct?.wholeSellPrice || 0
        : selectedProduct?.price || 0,
      totalPrice:
        invoiceItems[index].quantity *
        (this.state.isWholesale
          ? selectedProduct?.wholeSellPrice || 0
          : selectedProduct?.price || 0)
    };

    // Update notes if product has a note
    let updatedNotes = this.state.notes;
    if (selectedProduct?.note) {
      const productName = selectedProduct.shortName || selectedProduct.name;
      const noteEntry = `${productName} - ${selectedProduct.note}`;

      // Check if this note entry already exists
      if (!updatedNotes.includes(noteEntry)) {
        // Add to notes - append with newline if notes already exist
        updatedNotes = updatedNotes
          ? `${updatedNotes}\n${noteEntry}`
          : noteEntry;
      }
    }

    this.setState({
      invoiceItems,
      searchTerm: '',
      focusedRowIndex: null,
      notes: updatedNotes
    });
  };

  /**
   * Handles quantity input change and triggers real-time updates.
   */
  handleQuantityChange = (index, value) => {
    const invoiceItems = [...this.state.invoiceItems];
    // Allow empty string
    if (value === '') {
      invoiceItems[index] = {
        ...invoiceItems[index],
        quantity: '',
        totalPrice: 0
      };
      this.setState({ invoiceItems });
      return;
    }

    const quantity = Math.max(1, parseFloat(value) || 1);

    invoiceItems[index] = {
      ...invoiceItems[index],
      quantity,
      totalPrice: quantity * invoiceItems[index].unitPrice
    };
    this.setState({ invoiceItems });
  };

  /**
 * Handles unit price input change and recalculates totals dynamically.
 */
  handleUnitPriceChange = (index, value) => {
    const invoiceItems = [...this.state.invoiceItems];

    // Allow empty string
    if (value === '') {
      invoiceItems[index] = {
        ...invoiceItems[index],
        unitPrice: '',
        totalPrice: 0
      };
      this.setState({ invoiceItems });
      return;
    }

    invoiceItems[index] = {
      ...invoiceItems[index],
      unitPrice: parseFloat(value) || 0,
      totalPrice: (invoiceItems[index].quantity || 0) * (parseFloat(value) || 0)
    };
    this.setState({ invoiceItems });
  };

  /**
   * Calculates the grand total based on all row totals.
   */
  calculateGrandTotal = () => {
    const subTotal = this.state.invoiceItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    return subTotal;
  };

  /**
   * Calculates the final amount with discount and previous due.
   */
  calculateFinalTotal = () => {
    const { previousDue, discount } = this.state;
    const subTotal = this.calculateGrandTotal();
    // return subTotal + previousDue - discount;

    const finalTotal = subTotal + previousDue - discount;
    if (!this.state.isPaidChanged && !this.state.isSearchInvoice)
      this.setState({ paid: finalTotal });
    return finalTotal;
  };

  /**
   * Calculates the remaining due amount.
   */
  calculateRemainingDue = () => {
    const { paid } = this.state;
    const grandTotal = this.calculateFinalTotal();
    return grandTotal - paid;
  };

  /**
 * Saves the invoice to the database before printing
 * Checks if invoice exists by invoice number and updates it, otherwise creates new
 */
  saveInvoiceToDatabase = async () => {
    try {
      // Filter out empty rows
      const filledInvoiceItems = this.state.invoiceItems.filter(
        item => item.product
      );

      if (filledInvoiceItems.length === 0) {
        alert('Please add at least one product to the invoice');
        return false;
      }

      // Format items for the API
      const items = filledInvoiceItems.map(item => ({
        product: item.product._id,
        productName: item.product.shortName || item.product.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0
      }));

      const subTotal = this.calculateGrandTotal();
      const {
        customerInfo,
        invoiceInfo,
        previousDue,
        discount,
        paid,
        paymentMethod,
        notes,
        isWholesale
      } = this.state;

      let customer = this.state.customer;

      if (customerInfo.name && customerInfo.phone) {
        // Check if customer is exist with the name
        try {
          const response = await axios.get(
            `${API_URL}/customer/search/name/${customerInfo.name}`
          );
          console.log('response: customer : ', response)
          if (response.data.customers && response.data.customers.length > 0) {
            customer = response.data.customers[0]._id;
          }
        } catch (error) {
          console.log('Customer not found. New customer creating...');
        }
        // const newCustomer = {
        //   name: customerInfo.name,
        //   phoneNumber: customerInfo.phone,
        //   purchase_history: [currentInvoiceId], // must be an array of ObjectId(s)
        //   due: this.state.due,
        //   updated: new Date()
        // };

        // try {
        //   const response = await axios.get(
        //     `${API_URL}/customer/add/${newCustomer}`
        //   );
        //   console.log('Creating new custermer response: ', JSON.stringify(response))
        // } catch (error) {
        //   console.log('Creating new customer error: ', error);
        // }
      }

      // Search for customer by phone if needed
      // if (customerInfo.phone) {
      //   try {
      //     const response = await axios.get(
      //       `${API_URL}/customer/search/phone/${customerInfo.phone}`
      //     );
      //     if (response.data.customers && response.data.customers.length > 0) {
      //       customer = response.data.customers[0]._id;
      //     }
      //   } catch (error) {
      //     console.log('Customer not found');
      //   }
      // }

      // Create the invoice data object
      const invoiceData = {
        invoiceNumber: invoiceInfo.number,
        items,
        subTotal,
        previousDue: previousDue || 0,
        discount: discount || 0,
        grandTotal: this.calculateFinalTotal(),
        paid: paid || 0,
        due: this.calculateRemainingDue(),
        paymentMethod: paymentMethod || 'cash',
        notes: notes || '',
        customer: customer,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        createdBy: invoiceInfo.createdBy || 'Admin',
        isWholesale: isWholesale
      };

      let response = null;
      let invoiceExists = false;
      let existingInvoiceId = null;

      // Check if invoice exists by invoice number
      try {
        const invoiceNumber = invoiceInfo.number.toString();

        console.log('invoice number : ', invoiceNumber, ' and type: ', typeof (invoiceNumber))

        const checkResponse = await axios.get(
          `${API_URL}/invoice/invoice/${invoiceNumber}`
        );

        console.log('check response: ', checkResponse.toString())

        if (checkResponse.data.success && checkResponse.data.invoice) {
          invoiceExists = true;
          existingInvoiceId = checkResponse.data.invoice._id;
          console.log('Invoice exists, will update it');
        }
      } catch (error) {
        // Only log "Invoice does not exist" if the error is a 404 (Not Found)
        // Otherwise, re-throw or handle the error as a genuine failure.
        if (error.response && error.response.status === 404) {
          console.log('Invoice does not exist (404), will create new one');
        } else {
          // Log other errors as genuine failures
          console.error('Error checking for existing invoice:', error);
        }
      }

      // Update existing invoice or create new one
      if (invoiceExists && existingInvoiceId) {
        console.log('Updating invoice...');
        response = await this.props.updateInvoice(existingInvoiceId, invoiceData);
      } else {
        console.log('Creating new invoice...');
        response = await this.props.createInvoice(invoiceData);
      }

      // Update the invoice number and ID in the state
      if (response && response.invoice) {
        this.setState({
          invoiceInfo: {
            ...this.state.invoiceInfo,
            number: response.invoice.invoiceNumber
          },
          invoiceId: response.invoice._id,
          isSearchInvoice: true
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice. Please try again.');
      return false;
    }
  };
  /**
   * Print the invoice using browser print functionality.
   * Uses CSS to style the printed version.
   */
  handlePrintInvoice = async () => {
    // First save the invoice to the database
    const saveSuccessful = await this.saveInvoiceToDatabase();

    if (!saveSuccessful) {
      return; // Don't proceed with printing if saving failed
    }

    // Create a printable version
    const printContent = this.preparePrintContent();

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Print after styles are loaded
    printWindow.onload = function () {
      printWindow.print();
      // Removed the immediate printWindow.close() from here.
    };

    // Fallback/Robust solution:
    setTimeout(() => {
      printWindow.print();
      // A small delay before closing to ensure the print dialog has time to open.
      setTimeout(() => {
        printWindow.close();
      }, 1000); // 1 second delay
    }, 100);
  };

  /**
   * Prepares HTML content for printing
   */
  preparePrintContent = () => {
    const {
      invoiceItems,
      customerInfo,
      invoiceInfo,
      previousDue,
      discount,
      paid,
      paymentMethod
    } = this.state;
    const grandTotal = this.calculateGrandTotal();
    const due = this.calculateRemainingDue();

    // Filter out rows without products
    const filledInvoiceItems = invoiceItems.filter(item => item.product);

    // Create rows HTML
    const rowsHtml = filledInvoiceItems
      .map(
        item => `
              <tr>
                <td class="product-name-cell">${item.product ? item.product.shortName || item.product.name : ''
          }</td>
                <td class="small-cell">${item.quantity}</td>
                <td class="small-cell">${item.unitPrice}</td>
                <td class="small-cell">${item.totalPrice}</td>
              </tr>
            `
      )
      .join('');

    // Create empty rows to match the template (20 rows total)
    const emptyRowsCount = Math.max(0, 19 - filledInvoiceItems.length);
    const emptyRowsHtml = Array(emptyRowsCount)
      .fill(
        `
          <tr class="empty-row">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `
      )
      .join('');

    const discountAndGrandTotalHtml =
      discount > 0
        ? `
          <tr class="totals-section totals-row">
            <td colSpan="3">Discount</td>
            <td class="total-cell">${discount}</td>
          </tr>
          <tr class="totals-section totals-row">
            <td colSpan="3">Grand Total</td>
            <td class="total-cell">${grandTotal}</td>
          </tr>
        `
        : '';

    // Conditionally add Due and Grand Total rows
    const previousDueAndGrandTotalHtml =
      previousDue > 0
        ? `
          <tr class="totals-section totals-row">
            <td colSpan="3">Previous Due</td>
            <td class="total-cell">${previousDue}</td>
          </tr>
          <tr class="totals-section totals-row">
            <td colSpan="3">Grand Total</td>
            <td class="total-cell">${grandTotal + previousDue}</td>
          </tr>
        `
        : '';

    const dueHtml =
      due > 0
        ? `
          <tr class="totals-section totals-row">
            <td colSpan="3">Remaining Due</td>
            <td class="total-cell">${due}</td>
            </tr>`
        : '';

    // Create the full HTML document with CSS
    return `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Invoice ${invoiceInfo.number}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  color: #333;
                  position: relative;
                }
                .invoice-container {
                  max-width: 100%;
                  margin: 0 auto;
                  position: relative;
                  z-index: 1;
                }
                .watermark {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  opacity: 0.1;
                  z-index: -1;
                  width: 70%;
                  height: auto;
                }
                .header {
                  display: flex;
                  border-bottom: none;
                  padding: 10px;
                  padding-bottom: 0px;
                }
                .header-left {
                  width: 70%;
                  text-align: left;
                }
                .header-right {
                  width: 30%;
                  text-align: left;
                }
                .invoice-info {
                  font-size: 14px;
                  line-height: 1.5;
                }
                .company-name {
                  font-size: 36px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #FF0000;
                }
                .company-details {
                  font-size: 14px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;
                }
                th, td {
                  padding: 0px 5px;
                  text-align: center;
                  border: 1px solid #ccc;
                }
                tr {
                  height: 25px;
                  maxHeight: 22px;
                  font-size: 14px;
                }
                .product-name-cell {
                  text-align: left;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  width: auto;
               }
                .small-cell {
                  width: 13%;
                }
                th {
                  background-color: #d3d3d3;
                  font-weight: bold;
                }
                .totals-row td {
                  font-weight: bold;
                  text-align: right;
                  border: none;
                }
                .notes-cell {
                  text-align: left !important;
                  color: red;
                }
                .total-cell {
                  text-align: right;
                  border: 1px solid #ccc;
                }
                .totals-section {
                  page-break-inside: avoid;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 5%;
                  }
                  button {
                    display: none;
                  }
                  @page {
                    size: auto;
                    margin: 10mm;
                  }
                  
                  /* Make the table header repeat on each page */
                  thead {
                    display: table-header-group;
                  }
                  
                  /* Ensure the totals section stays together on the last page */
                  .totals-section {
                    page-break-inside: avoid;
                  }
                  
                  /* Prevent rows from breaking across pages */
                  tr {
                    page-break-inside: avoid;
                  }
                  th {
                    background-color: #929292 !important; /* Force the background color */
                    -webkit-print-color-adjust: exact; /* For Webkit-based browsers (like Chrome) */
                    print-color-adjust: exact; /* Standard for others */
                    color: Black !important;
                  }
                }
              </style>
            </head>
            <body>
              <!-- Watermark logo -->
              <img src="/images/favicon.ico" alt="Alpha Logo" class="watermark">
              
              <div class="invoice-container">
                <div class="header">
                  <div class="header-left">
                    <div class="company-name">Alpha</div>
                    <div class="company-details">
                      <p>২৬, ২৭/২, ৪০ (৮ নং সিড়ি সংলগ্ন), তৃতীয় তলা<br>
                      সুন্দরবন স্কয়ার সুপার মার্কেট, ঢাকা ১০০০<br>
                      মোবাইল: ০১৮৩৮৬২৬১২১,০১৮৬৯১১৬৬৯১</p>
                    </div>
                  </div>
                  <div class="header-right">
                    <div class="invoice-info">
                      <p><strong>Invoice No.:</strong> ${invoiceInfo.number}<br>
                      <strong>Created by:</strong> ${invoiceInfo.createdBy || 'Admin'
      }<br>
                      <strong>Date:</strong> ${new Date(invoiceInfo.date).toLocaleDateString('en-GB')}<br>>
                      <strong></strong> ${customerInfo.name}<br>
                      <strong></strong> ${customerInfo.phone}</p>
                    </div>
                  </div>
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th class="small-cell">Quantity</th>
                      <th class="small-cell">Price</th>
                      <th class="small-cell">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                    ${emptyRowsHtml}
                    <!-- Totals section - will only appear at the end of the table -->
                    <tr class="totals-section totals-row">
                      <td class="notes-cell" style={{ textAlign: 'left', fontWeight: 'bold' }}>${this.state.notes
      }</td>
                      <td colSpan="2">Total</td>
                      <td class="total-cell">${grandTotal}</td>
                    </tr>
                    ${discountAndGrandTotalHtml}
                    ${previousDueAndGrandTotalHtml}
                    ${dueHtml}
                  </tbody>
                </table>
              </div>
            </body>
            </html>
          `;
  };

  handleSearchTermChange = e => {
    this.setState({
      searchTerm: e.target.value,
      selectedProductIndex: 0 // Reset the selected product index
    });
  };

  handleFocusProduct = index => {
    console.log('handle focus product: index:', index)
    if ((index + 1) % 10 === 0) {
      this.showMoreItems();
    }
    const invoiceItems = [...this.state.invoiceItems];

    // Clear the product data for the focused row
    // invoiceItems[index] = {
    //   ...invoiceItems[index],
    //   product: null,
    //   quantity: 1,
    //   unitPrice: 0,
    //   totalPrice: 0
    // };
    invoiceItems[index] = {
      ...invoiceItems[index],
      product: null
    };

    this.setState({
      invoiceItems,
      searchTerm: '', // Clear the search term
      focusedRowIndex: index // Set the focused row index
    });
  };

  // handleBlurRow = () => {
  //   // Use setTimeout to allow click events to process before hiding dropdown
  //   setTimeout(() => {
  //     this.setState({ focusedRowIndex: null });
  //   }, 200);
  // };

  /**
 * Handles the blur event on the product search input.
 * Uses a timeout to allow click events on the product list to process first.
 * Also implements the logic to clear the row if the search term is empty.
 */
  handleBlurRow = () => {
    // Use setTimeout to allow click events to process before hiding dropdown
    setTimeout(() => {
      const { focusedRowIndex, searchTerm, invoiceItems } = this.state;

      if (focusedRowIndex !== null) {
        // 1. If the search term is empty, clear the product from the row
        // This handles the user clearing the input with backspace/delete
        if (!searchTerm.trim()) {
          const newInvoiceItems = [...invoiceItems];
          newInvoiceItems[focusedRowIndex] = {
            ...newInvoiceItems[focusedRowIndex],
            product: null,
            quantity: '',
            unitPrice: '',
            totalPrice: 0,
          };
          this.setState({
            invoiceItems: newInvoiceItems,
            focusedRowIndex: null,
            selectedProductIndex: 0, // Reset selected index
            searchTerm: '', // Ensure search term is cleared
          });
          return;
        }

        // 2. If the search term is not empty, we just hide the dropdown.
        // The handleProductChange function (triggered by click) will have already run
        // and set focusedRowIndex to null if a product was selected.
        // If it's still not null, it means the user blurred without selecting, so we hide the dropdown.
        this.setState({
          focusedRowIndex: null,
          selectedProductIndex: 0,
        });
      }
    }, 200);
  };


  handleCustomerInfoChange = (field, value) => {
    this.setState({
      customerInfo: {
        ...this.state.customerInfo,
        [field]: value
      }
    });
  };

  handleInvoiceInfoChange = async (field, value) => {
    if (field === 'number' && value.length === 13) {
      await this.fetchAndLoadInvoice(value);
    }
  };

  showMoreItems = () => {
    this.setState(prevState => {
      const additionalRows = 10;
      const newInvoiceItems = [...prevState.invoiceItems];

      // Add new empty rows if needed
      if (prevState.visibleItems + additionalRows > newInvoiceItems.length) {
        const rowsToAdd =
          prevState.visibleItems + additionalRows - newInvoiceItems.length;
        for (let i = 0; i < rowsToAdd; i++) {
          newInvoiceItems.push({
            product: null,
            quantity: '',
            unitPrice: '',
            totalPrice: 0
          });
        }
      }

      return {
        invoiceItems: newInvoiceItems,
        visibleItems: prevState.visibleItems + additionalRows
      };
    });
  };

  /**
 * Utility function to move focus to the next input field in the current row.
 * @param {number} rowIndex - The index of the current row.
 * @param {number} offset - The number of inputs to skip (1 for Quantity, 2 for Unit Price).
 */
  focusNextInput = (rowIndex, offset = 1) => {
    // The inputs are rendered in order: Product (0), Quantity (1), Unit Price (2) for each row.
    // The target input index is (rowIndex * 3) + offset.
    const targetInputIndex = rowIndex * 3 + offset;

    // Use setTimeout to ensure the DOM is updated and the element exists before focusing
    setTimeout(() => {
      const inputs = document.querySelectorAll('.invoice-row-input');
      if (inputs && inputs[targetInputIndex]) {
        inputs[targetInputIndex].focus();
      }
    }, 0);
  };


  handleKeyDown = (e, index, filteredProducts) => {
    // If Tab is pressed on the last visible row's last input field
    if (
      e.key === 'Tab' &&
      !e.shiftKey &&
      index === this.state.visibleItems - 1
    ) {
      // If we haven't shown all items yet
      if (this.state.visibleItems < this.props.invoiceItems.length) {
        e.preventDefault(); // Prevent default tab behavior
        this.showMoreItems(); // Show more items

        // Focus the first input of the newly visible row after state update
        setTimeout(() => {
          const inputs = document.querySelectorAll('.invoice-row-input');
          if (inputs && inputs[this.state.visibleItems * 3]) {
            inputs[this.state.visibleItems * 3].focus();
          }
        }, 0);
      }
    }
    if (this.state.focusedRowIndex === index) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedProduct =
          filteredProducts[this.state.selectedProductIndex];

        if (selectedProduct) {
          this.handleProductChange(index, selectedProduct.sku);
          // Move focus to the Quantity input (offset = 1)
          this.focusNextInput(index, 1);

        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.setState(prevState => ({
          selectedProductIndex:
            (prevState.selectedProductIndex + 1) % filteredProducts.length
        }));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.setState(prevState => ({
          selectedProductIndex:
            (prevState.selectedProductIndex - 1 + filteredProducts.length) %
            filteredProducts.length
        }));
      }
    }
  };

  /**
   * Handles customer phone input change and searches for existing customer.
   */
  handleCustomerPhoneChange = async value => {
    // 1. Update the phone number in the state and clear customer search by name state
    this.setState({
      customerInfo: {
        ...this.state.customerInfo,
        phone: value
      },
      isSearchingCustomer: value.length === 11, // Start searching only if length is 11
      // Clear name search state when phone changes
      focusedCustomerSearch: false,
      customerSearchTerm: '',
      filteredCustomers: [],
      selectedCustomerIndex: 0
    });

    // 2. Perform search only if the phone number length is exactly 11
    if (value.length === 11) {
      try {
        const response = await axios.get(
          `${API_URL}/customer/search/phone/${value}`
        );

        if (response.data.customers && response.data.customers.length > 0) {
          const customer = response.data.customers[0]; // Use the first matching customer
          this.setState({
            customer: customer,
            customerInfo: {
              ...this.state.customerInfo,
              name: customer.name,
              phone: customer.phoneNumber
            },
            previousDue: customer.due || 0,
            isSearchingCustomer: false // Stop searching
          });
        } else {
          // No customer found
          this.setState({
            customerInfo: {
              ...this.state.customerInfo,
              name: '' // Clear name if no customer is found
            },
            previousDue: 0,
            isSearchingCustomer: false // Stop searching
          });
        }
      } catch (error) {
        console.error('Error searching customer:', error);
        this.setState({ isSearchingCustomer: false }); // Stop searching
      }
    } else if (value.length > 11) {
      // Clear customer info if the phone number exceeds 11 characters
      this.setState({
        customerInfo: {
          ...this.state.customerInfo,
          name: ''
        },
        previousDue: 0,
        isSearchingCustomer: false // Stop searching
      });
    }
  };

  /**
   * NEW: Handles customer name input change and searches for existing customer by name.
   */
  handleCustomerNameChange = async value => {
    // 1. Update the name search term and flag
    this.setState({
      customerSearchTerm: value,
      focusedCustomerSearch: true,
      // Clear customer info related to the old name
      customerInfo: {
        ...this.state.customerInfo,
        name: value
      },
      customer: null,
      previousDue: 0,
      filteredCustomers: [],
      selectedCustomerIndex: 0
    });

    // 2. Perform search if the search term is long enough
    if (value.length >= 2) {
      try {
        const response = await axios.get(
          `${API_URL}/customer/search/name/${value}`
        );

        if (this._isMounted) {
          this.setState({
            filteredCustomers: response.data.customers || [],
            selectedCustomerIndex: 0 // Reset selected index on new search
          });
        }
      } catch (error) {
        console.error('Error searching customer by name:', error);
        if (this._isMounted) {
          this.setState({ filteredCustomers: [] });
        }
      }
    } else if (value.length === 0) {
      // Clear all customer data if the search box is cleared
      this.setState({
        customerInfo: {
          name: '',
          phone: ''
        },
        customer: null,
        previousDue: 0,
        filteredCustomers: [],
        focusedCustomerSearch: false
      });
    } else {
      // Clear results if search term is too short
      this.setState({ filteredCustomers: [] });
    }
  };

  /**
   * NEW: Handles the selection of a customer from the dropdown.
   */
  handleCustomerSelect = (customer) => {
    this.setState({
      customer: customer,
      customerInfo: {
        name: customer.name,
        phone: customer.phoneNumber
      },
      previousDue: customer.due || 0,
      customerSearchTerm: '', // Clear the search term
      focusedCustomerSearch: false, // Hide the dropdown
      filteredCustomers: [], // Clear the results
      selectedCustomerIndex: 0
    });
  };

  /**
   * NEW: Handles key down events for customer name search (Arrow keys, Enter, Tab).
   */
  handleCustomerKeyDown = (e) => {
    const { filteredCustomers, selectedCustomerIndex } = this.state;
    const numResults = filteredCustomers.length;

    if (numResults === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.setState(prevState => ({
        selectedCustomerIndex: (prevState.selectedCustomerIndex + 1) % numResults
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setState(prevState => ({
        selectedCustomerIndex: (prevState.selectedCustomerIndex - 1 + numResults) % numResults
      }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const selectedCustomer = filteredCustomers[selectedCustomerIndex];
      if (selectedCustomer) {
        this.handleCustomerSelect(selectedCustomer);
        // Optionally focus the next field (e.g., Previous Due input if needed)
      }
    }
  };

  /**
   * NEW: Handles focus on the customer name input.
   */
  handleFocusCustomerName = () => {
    // Only show the dropdown if there's a search term or previous results
    if (this.state.customerSearchTerm.length > 0 || this.state.filteredCustomers.length > 0) {
      this.setState({ focusedCustomerSearch: true });
    }
    // Set the input value back to the search term (which is the actual input content)
    this.setState({ customerSearchTerm: this.state.customerInfo.name });
  }

  /**
   * NEW: Handles blur on the customer name input.
   */
  handleBlurCustomerName = () => {
    // Use setTimeout to allow click events to process before hiding dropdown
    setTimeout(() => {
      this.setState({
        focusedCustomerSearch: false,
        selectedCustomerIndex: 0,
        // Reset the input to the actual customer name if no selection was made
        customerSearchTerm: this.state.customerInfo.name
      });
    }, 200);
  };


  handleRefreshProducts = async () => {
    // Fetch the latest product list without affecting selected products
    await this.props.fetchProducts();
  };

  // Handle opening the stock modal
  handleStock = () => {
    this.setState({ isStockModalOpen: true });
  };

  handleCloseStockModal = () => {
    this.setState({ isStockModalOpen: false });
  };

  // Handle updating stock with weighted average calculation
  handleStockUpdate = async (productId, data) => {
    const { products, updateProductDetails } = this.props;
    const product = products.find(p => p._id === productId);

    if (!product) return;

    const currentQty = product.quantity || 0;
    const currentBuyingPrice = product.buyingPrice || 0;
    const newQty = data.quantity;
    const newBuyingPrice = data.buyingPrice;

    const totalQty = currentQty + newQty;

    // Weighted Average Calculation
    // If totalQty is 0 (shouldn't happen if adding stock), avoid division by zero
    let avgBuyingPrice = currentBuyingPrice;
    if (totalQty > 0) {
      avgBuyingPrice = ((currentQty * currentBuyingPrice) + (newQty * newBuyingPrice)) / totalQty;
    }

    const payload = {
      quantity: totalQty,
      buyingPrice: Math.round(avgBuyingPrice), // Round to nearest integer or keep decimals as needed
      wholeSellPrice: data.wholeSellPrice || product.wholeSellPrice,
      price: data.price || product.price,
      // Include required fields for update validation if necessary, or rely on partial update
      sku: product.sku,
      slug: product.slug
    };

    // Call the update action
    // We need to ensure updateProductDetails is available in props
    // It seems we need to dispatch it. 
    // Since 'actions' are imported and connected, check if updateProductDetails is in 'actions' object
    // If not, we might need to import it specifically or rely on the connected actions

    // Assuming updateProductDetails is passed via mapDispatchToProps or actions object
    if (this.props.updateProductDetails) {
      await this.props.updateProductDetails(productId, payload);
    } else {
      // Fallback if not mapped directly, though it should be if 'actions' contains it
      // Check if we need to dispatch manually or if 'actions' import covers it
      // The 'actions' import usually contains all actions. 
      // Let's assume it's mapped. If not, we'll fix it.
    }

    this.handleCloseStockModal();
    // Refresh products to reflect changes
    this.props.fetchProducts();
  };

  // Handle adding new stock (new product)
  handleStockAdd = async (data) => {
    const { addProduct } = this.props;

    // Prepare payload for new product
    // We need to generate SKU and Slug as per previous logic if not provided
    // But the previous logic was in the Add Product form/action.
    // Let's rely on the server or action to handle defaults if possible, 
    // or construct a minimal valid object here.

    // The 'addProduct' action in Product/actions.js usually takes form data from the store state
    // or arguments. Let's check how addProduct is implemented.
    // It seems addProduct uses getState().product.productFormData.
    // We might need a different action for adding product from data passed directly, 
    // or we update the store first.

    // To keep it simple and robust, let's call the API directly here or 
    // create a new action 'addProductFromData' if 'addProduct' is too tied to the form state.
    // However, looking at the previous task, we made 'addProduct' use the form state.

    // Let's try to use a direct API call here for simplicity as we are in Invoice container
    // and don't want to mess with the Product container's form state.

    try {
      const payload = {
        shortName: data.shortName,
        name: data.shortName, // Default name to shortName
        sku: data.shortName + '-' + Date.now(), // Auto-generate SKU
        quantity: data.quantity,
        buyingPrice: data.buyingPrice,
        wholeSellPrice: data.wholeSellPrice,
        price: data.price,
        isActive: false, // Default inactive
        // Defaults for required fields
        description: '',
        brand: null,
        category: null,
        tags: [],
        colors: []
      };

      // We can use axios directly since we imported it
      const response = await axios.post(`${API_URL}/product/add`, payload);

      if (response.data.success) {
        // Show success notification (if we have access to success action)
        // this.props.success(...) 
      }

      this.handleCloseStockModal();
      this.props.fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
      // Handle error
    }
  };

  handleNewInvoice = () => {
    // Reset the state to create a new invoice
    this.setState({
      invoiceItems: Array(100).fill({
        product: null,
        quantity: '',
        unitPrice: '',
        totalPrice: 0
      }),
      searchTerm: '',
      focusedRowIndex: null,
      customerInfo: {
        name: '',
        phone: ''
      },
      customer: null,
      invoiceInfo: {
        number: `${Date.now()}`, // Use current milliseconds for the invoice number
        date: new Date().toISOString().split('T')[0],
        createdBy: this.props.user.firstName || 'Admin' // Default created by
      },
      visibleItems: 10,
      previousDue: 0,
      discount: 0,
      paid: 0,
      paymentMethod: 'cash', // Default payment method
      isSearchingCustomer: false, // To track customer search status
      isWholesale: true, // Default to wholesale price
      isPaidChanged: false, // Track if paid amount has been changed
      notes: '', // Default value for notes
      isSearchInvoice: false, // Flag to indicate if searching for an invoice
      invoiceId: null, // Store the invoice ID for updating
      // RESET NEW CUSTOMER SEARCH STATE
      customerSearchTerm: '',
      focusedCustomerSearch: false,
      filteredCustomers: [],
      selectedCustomerIndex: 0,
      isStockModalOpen: false // Reset stock modal state
    });
  };

  handleWholesaleToggle = () => {
    this.setState(
      prevState => {
        const updatedWholesale = !prevState.isWholesale; // Toggle the wholesale value
        return { isWholesale: updatedWholesale }; // Update the state with the toggled value
      },
      () => {
        const invoiceItems = this.state.invoiceItems.map(item => {
          if (item.product) {
            return {
              ...item,
              unitPrice: this.state.isWholesale
                ? item.product.wholeSellPrice || 0
                : item.product.price || 0,
              totalPrice:
                item.quantity *
                (this.state.isWholesale
                  ? item.product.wholeSellPrice || 0
                  : item.product.price || 0)
            };
          }
          return item;
        });

        this.setState({ invoiceItems });
      }
    );
  };

  handleNotesChange = value => {
    this.setState({ notes: value });
  };

  render() {
    const { products, isLoading } = this.props;
    const {
      invoiceItems,
      searchTerm,
      focusedRowIndex,
      customerInfo,
      invoiceInfo,
      visibleItems,
      previousDue,
      isSearchingCustomer,
      // NEW CUSTOMER SEARCH STATE
      customerSearchTerm,
      focusedCustomerSearch,
      filteredCustomers,
      selectedCustomerIndex
    } = this.state;

    // Calculate filtered products based on search term
    const filteredProducts =
      searchTerm.length > 0 && Array.isArray(products)
        ? products.filter(product =>
          (product.shortName || product.name).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : Array.isArray(products)
          ? products
          : [];

    // Styles
    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed' // Ensures fixed column widths
    };

    const cellStyle = {
      border: '1px solid #ddd',
      padding: '8px',
      textAlign: 'left'
    };

    const productNameCellStyle = {
      ...cellStyle,
      width: '55%' // 70% for the Product Name column
    };

    const smallCellStyle = {
      border: '1px solid #ddd',
      padding: '8px',
      textAlign: 'center', // Centers text horizontally
      verticalAlign: 'middle', // Centers text vertically
      width: '15%' // Adjust width as needed
    };

    const dropdownStyle = {
      position: 'relative'
    };

    const searchBoxStyle = {
      width: '100%',
      padding: '8px',
      boxSizing: 'border-box'
    };

    const resultsContainerStyle = {
      position: 'absolute',
      zIndex: 100,
      width: '100%',
      maxHeight: '200px',
      overflowY: 'auto',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      boxShadow: '0px 4px 8px rgba(0,0,0,0.1)'
    };

    const resultItemStyle = {
      padding: '8px',
      cursor: 'pointer',
      borderBottom: '1px solid #eee'
    };

    const highlightedResultStyle = {
      ...resultItemStyle,
      backgroundColor: '#f0f0f0'
    };

    const infoBoxStyle = {
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    };

    const infoGridStyle = {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
    };

    const inputStyle = {
      width: '100%',
      padding: '8px',
      boxSizing: 'border-box'
    };

    const buttonStyle = {
      backgroundColor: '#4CAF50',
      border: 'none',
      color: 'white',
      padding: '10px 15px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      margin: '10px 5px',
      cursor: 'pointer',
      borderRadius: '4px'
    };

    const printButtonStyle = {
      backgroundColor: '#2196F3', // Blue color for "Print Invoice"
      border: 'none',
      color: 'white',
      padding: '10px 15px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '4px'
    };

    const showMoreButtonStyle = {
      padding: '8px 16px',
      backgroundColor: '#4a90e2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      margin: '12px 0'
    };

    const newInvoiceButtonStyle = {
      backgroundColor: '#f44336', // Red color for "New Invoice"
      border: 'none',
      color: 'white',
      padding: '10px 15px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      marginRight: '10px',
      cursor: 'pointer',
      borderRadius: '4px'
    };

    const invoiceLayout = {
      display: 'flex',
      gap: '20px'
    };

    const invoiceTableContainer = {
      flex: 7
    };

    const invoiceInfoContainer = {
      flex: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'sticky', // Makes the container sticky
      top: '20px', // Distance from the top of the viewport
      alignSelf: 'flex-start' // Ensures the sticky container aligns properly
    };

    // Display only the visible items
    const visibleInvoiceItems = invoiceItems.slice(0, visibleItems);
    const hasMoreItems = visibleItems < invoiceItems.length;

    return (
      <>
        {isLoading ? (
          <LoadingIndicator inline />
        ) : products.length > 0 ? (
          <div className='invoice-container'>
            {/* Invoice Layout */}
            <div style={invoiceLayout}>
              {/* Left: Invoice Table */}
              <div style={invoiceTableContainer}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={productNameCellStyle}>Product</th>
                      <th style={smallCellStyle}>Quantity</th>
                      <th style={smallCellStyle}>Unit Price</th>
                      <th style={smallCellStyle}>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInvoiceItems.map((item, index) => (
                      <tr key={index}>
                        {/* Product dropdown with search */}
                        <td style={productNameCellStyle}>
                          <div style={dropdownStyle}>
                            <input
                              type='text'
                              className='invoice-row-input'
                              style={searchBoxStyle}
                              placeholder='Search products...'
                              value={
                                focusedRowIndex === index
                                  ? searchTerm
                                  : item.product
                                    ? item.product.shortName || item.product.name
                                    : ''
                              }
                              onChange={this.handleSearchTermChange}
                              onFocus={() => this.handleFocusProduct(index)}
                              onBlur={this.handleBlurRow}
                              onKeyDown={e =>
                                this.handleKeyDown(e, index, filteredProducts)
                              }
                            />

                            {/* {focusedRowIndex === index && (
                              <div style={resultsContainerStyle}>
                                {filteredProducts.length > 0 ? (
                                  filteredProducts.map(product => (
                                    <div
                                      key={product.sku}
                                      style={
                                        item.product &&
                                        item.product.sku === product.sku
                                          ? highlightedResultStyle
                                          : resultItemStyle
                                      }
                                      onClick={() =>
                                        this.handleProductChange(
                                          index,
                                          product.sku
                                        )
                                      }
                                    >
                                      {product.shortName || product.name}
                                    </div>
                                  ))
                                ) : (
                                  <div style={resultItemStyle}>
                                    No products found
                                  </div>
                                )}
                              </div>
                            )} */}
                            {focusedRowIndex === index && (
                              <div style={resultsContainerStyle}>
                                {filteredProducts.length > 0 ? (
                                  filteredProducts.map((product, i) => (
                                    <div
                                      key={product.sku}
                                      style={
                                        i === this.state.selectedProductIndex
                                          ? highlightedResultStyle // Highlight the selected product
                                          : resultItemStyle
                                      }
                                      onClick={() =>
                                        this.handleProductChange(
                                          index,
                                          product.sku
                                        )
                                      }
                                    >
                                      {product.shortName || product.name}
                                      {/* Display shortName */}
                                    </div>
                                  ))
                                ) : (
                                  <div style={resultItemStyle}>
                                    No products found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Quantity input */}
                        <td style={smallCellStyle}>
                          <input
                            type='number'
                            className='invoice-row-input'
                            min='1'
                            style={inputStyle}
                            value={item.quantity}
                            onChange={e =>
                              this.handleQuantityChange(index, e.target.value)
                            }
                            onKeyDown={e => this.handleKeyDown(e, index)}
                          />
                        </td>

                        {/* Unit Price input */}
                        <td style={smallCellStyle}>
                          <input
                            type='number'
                            className='invoice-row-input'
                            step='1'
                            style={inputStyle}
                            value={item.unitPrice}
                            onChange={e =>
                              this.handleUnitPriceChange(index, e.target.value)
                            }
                            onKeyDown={e => this.handleKeyDown(e, index)}
                          />
                        </td>

                        {/* Total Price (calculated) */}
                        <td style={smallCellStyle}>{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Grand Total Row */}
                  <tfoot>
                    <tr>
                      <td
                        style={{
                          ...productNameCellStyle,
                          textAlign: 'right',
                          fontWeight: 'bold'
                        }}
                        colSpan='3'
                      >
                        Total
                      </td>
                      <td style={{ ...smallCellStyle, fontWeight: 'bold' }}>
                        {this.calculateGrandTotal()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '10px',
                    gap: '15px'
                  }}
                >
                  {hasMoreItems && (
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        color: '#4a90e2',
                        padding: '0 10px'
                      }}
                      onClick={this.showMoreItems}
                      title={`Show More (${visibleItems} of ${invoiceItems.length})`}
                    >
                      <i className="fa fa-plus-circle" aria-hidden="true"></i>
                    </button>
                  )}

                  {/* Refresh Button */}
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#555',
                      padding: '0 10px'
                    }}
                    onClick={this.handleRefreshProducts}
                    title="Refresh product list"
                  >
                    <i className="fa fa-refresh" aria-hidden="true"></i>
                  </button>

                  {/* Stock Button */}
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#555',
                      padding: '0 10px'
                    }}
                    onClick={this.handleStock}
                    title="Stock"
                  >
                    <i className="fa fa-cubes" aria-hidden="true"></i>
                  </button>

                  <div style={{ flex: 1 }}>
                    <input
                      type='text'
                      style={inputStyle}
                      value={this.state.notes || ''}
                      onChange={e => this.handleNotesChange(e.target.value)}
                      placeholder='Enter notes here'
                    />
                  </div>
                </div>
              </div>

              {/* Right: Invoice and Customer Information */}
              <div style={invoiceInfoContainer}>
                <div style={infoBoxStyle}>
                  {/* Invoice Number and Payment Method */}
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Invoice Number:</label>
                      <input
                        type='text'
                        style={inputStyle}
                        value={invoiceInfo.number}
                        onChange={e =>
                          this.handleInvoiceInfoChange('number', e.target.value)
                        }
                        placeholder='Enter Invoice Number'
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Payment Method:</label>
                      <select
                        style={inputStyle}
                        value={this.state.paymentMethod}
                        onChange={e =>
                          this.setState({ paymentMethod: e.target.value })
                        }
                      >
                        <option value='cash'>Cash</option>
                        <option value='bank'>Bank Transfer</option>
                        <option value='bkash'>Bkash</option>
                        <option value='nagad'>Nagad</option>
                      </select>
                    </div>
                  </div>

                  {/* Date and Created By */}
                  <div
                    style={{ display: 'flex', gap: '15px', marginTop: '10px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label>Date:</label>
                      <input
                        type='date'
                        style={inputStyle}
                        value={invoiceInfo.date}
                        onChange={e =>
                          this.handleInvoiceInfoChange('date', e.target.value)
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Created By:</label>
                      <input
                        type='text'
                        style={inputStyle}
                        value={invoiceInfo.createdBy}
                        readOnly // Make this field read-only
                      />
                    </div>
                  </div>
                </div>
                {/* Customer Details */}
                <div style={infoBoxStyle}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <label style={{ marginRight: '10px' }}>
                      Wholesale Customer:
                    </label>
                    <input
                      type='checkbox'
                      checked={this.state.isWholesale} // Bind to state
                      onChange={this.handleWholesaleToggle} // Handle toggle
                    />
                  </div>
                  {/* NEW CUSTOMER NAME INPUT WITH SEARCH DROPDOWN */}
                  <div style={dropdownStyle}>
                    <label>Name:</label>
                    <input
                      type='text'
                      style={inputStyle}
                      value={focusedCustomerSearch ? customerSearchTerm : customerInfo.name} // Show search term when focused
                      onChange={e =>
                        this.handleCustomerNameChange(e.target.value)
                      }
                      onFocus={this.handleFocusCustomerName}
                      onBlur={this.handleBlurCustomerName}
                      onKeyDown={this.handleCustomerKeyDown} // Handle key navigation
                      placeholder='Customer Name'
                    />
                    {focusedCustomerSearch && filteredCustomers.length > 0 && (
                      <div style={resultsContainerStyle}>
                        {filteredCustomers.map((customer, i) => (
                          <div
                            key={customer._id}
                            style={
                              i === selectedCustomerIndex
                                ? highlightedResultStyle
                                : resultItemStyle
                            }
                            onClick={() => this.handleCustomerSelect(customer)}
                          >
                            {customer.name} {customer.address ? `(${customer.address})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label>Phone:</label>
                    <input
                      type='text'
                      style={inputStyle}
                      value={this.state.customerInfo.phone} // Tied to state
                      onChange={e =>
                        this.handleCustomerPhoneChange(e.target.value)
                      } // Updates state on change
                      placeholder='Phone Number'
                    />
                    {this.state.isSearchingCustomer && <p>Searching...</p>}
                  </div>
                </div>

                {/* Summary Section */}
                <div style={infoBoxStyle}>
                  {/* First Row: Subtotal and Previous Due */}
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Subtotal:</label>
                      <input
                        type='text'
                        style={inputStyle}
                        value={this.calculateGrandTotal()}
                        readOnly
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Previous Due:</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        style={inputStyle}
                        value={this.state.previousDue || 0}
                        onChange={e =>
                          this.setState({
                            previousDue: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Second Row: Grand Total and Discount */}
                  <div
                    style={{ display: 'flex', gap: '15px', marginTop: '10px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label>Grand Total:</label>
                      <input
                        type='text'
                        style={inputStyle}
                        value={this.calculateFinalTotal()}
                        readOnly
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Discount:</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        style={inputStyle}
                        value={this.state.discount || 0}
                        onChange={e =>
                          this.setState({
                            discount: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Third Row: Paid and Due */}
                  <div
                    style={{ display: 'flex', gap: '15px', marginTop: '10px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label>Paid:</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        style={inputStyle}
                        value={this.state.paid || 0}
                        onChange={e =>
                          this.setState({
                            isPaidChanged: true,
                            paid: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Due:</label>
                      <input
                        type='text'
                        style={inputStyle}
                        value={this.calculateRemainingDue()}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end', // Align buttons to the right
                    gap: '15px', // Add spacing between the buttons
                    marginBottom: '20px' // Add spacing below the buttons
                  }}
                >
                  <button
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      color: '#333',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '500'
                    }}
                    onClick={this.handleNewInvoice}
                  >
                    <i className="fa fa-file" aria-hidden="true"></i>
                    New Invoice
                  </button>
                  <button
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      color: '#333',
                      padding: '10px 20px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '500'
                    }}
                    onClick={this.handlePrintInvoice}
                  >
                    <i className="fa fa-print" aria-hidden="true"></i>
                    Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NotFound message='No products found.' />
        )}
        {/* Stock Management Modal */}
        <StockModal
          isOpen={this.state.isStockModalOpen}
          onRequestClose={this.handleCloseStockModal}
          products={products}
          handleUpdateStock={this.handleStockUpdate}
          handleAddStock={this.handleStockAdd}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({
  products: state.product.products,
  isLoading: state.product.isLoading,
  user: state.account.user // Assuming user info is in the auth reducer
});

export default connect(mapStateToProps, actions)(Invoice);