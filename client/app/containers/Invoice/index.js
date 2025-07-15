import React from 'react';
import { connect } from 'react-redux';
import { API_URL, ROLES } from '../../constants';
import actions from '../../actions'; // Import global actions
import axios from 'axios'; // Import axios for API calls
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';

// Invoice Container Component
class Invoice extends React.PureComponent {
  state = {
    invoiceItems: Array(100).fill({
      product: null,
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
    invoiceId: null // Store the invoice ID for updating
  };

  // Fetch products once component mounts
  componentDidMount() {
    // Fetch products
    this.props.fetchProducts();

    // Set createdBy to user.firstName
    if (this.props.user && this.props.user.firstName) {
      this.setState(prevState => ({
        invoiceInfo: {
          ...prevState.invoiceInfo,
          createdBy: this.props.user.firstName
        }
      }));
    }
  }

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

    this.setState({ invoiceItems, searchTerm: '', focusedRowIndex: null });
  };

  /**
   * Handles quantity input change and triggers real-time updates.
   */
  handleQuantityChange = (index, value) => {
    const invoiceItems = [...this.state.invoiceItems];
    const quantity = Math.max(1, parseFloat(value) || 1); // Ensure minimum quantity is 1

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
    invoiceItems[index] = {
      ...invoiceItems[index],
      unitPrice: parseFloat(value) || 0,
      totalPrice: invoiceItems[index].quantity * (parseFloat(value) || 0)
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
        productName: item.product.name,
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
        isWholesale,
        isSearchInvoice
      } = this.state;

      let customer = this.state.customer; // Declare the customer variable

      if (isSearchInvoice) {
        // If searching for an invoice, fetch customer with the customerInfo.phone
        const response = await axios.get(
          `${API_URL}/customer/search/phone/${customerInfo.phone}`
        );
        if (response.data.customers && response.data.customers.length > 0) {
          customer = response.data.customers[0]._id; // Use the first matching customer
        } else {
          customer = null; // No customer found
        }
      }

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

      if (this.state.isSearchInvoice) {
        // Update an existing invoice
        response = await this.props.updateInvoice(
          this.state.invoiceId,
          invoiceData
        );
      } else {
        // Create a new invoice
        response = await this.props.createInvoice(invoiceData);
      }

      // Update the invoice number in the state with the one from the server
      if (response && response.invoice) {
        this.setState({
          invoiceInfo: {
            ...this.state.invoiceInfo,
            number: response.invoice.invoiceNumber
          }
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
      printWindow.close();
    };
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
                <td class="product-name-cell">${
                  item.product ? item.product.name : ''
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
                      <strong>Created by:</strong> ${
                        invoiceInfo.createdBy || 'Admin'
                      }<br>
                      <strong>Date:</strong> ${invoiceInfo.date}<br>
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
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${
                        this.state.notes
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

  handleFocusAndClearRow = index => {
    const invoiceItems = [...this.state.invoiceItems];

    // Clear the product data for the focused row
    invoiceItems[index] = {
      ...invoiceItems[index],
      product: null,
      unitPrice: 0,
      totalPrice: 0
    };

    this.setState({
      invoiceItems,
      searchTerm: '', // Clear the search term
      focusedRowIndex: index // Set the focused row index
    });
  };

  handleBlurRow = () => {
    // Use setTimeout to allow click events to process before hiding dropdown
    setTimeout(() => {
      this.setState({ focusedRowIndex: null });
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
    this.setState({
      invoiceInfo: {
        ...this.state.invoiceInfo,
        [field]: value
      }
    });

    // Check if the field is 'number' and the value is 13 digits
    if (field === 'number' && value.length === 13) {
      try {
        const invoiceNumber = value.toString();
        // Fetch the invoice data from the server
        const response = await axios.get(
          `${API_URL}/invoice/invoice/${invoiceNumber}`
        );

        if (response.data.success && response.data.invoice) {
          const invoice = response.data.invoice;

          // Populate the invoice data into the state
          this.setState({
            invoiceItems: [
              ...invoice.items.map(item => {
                const selectedProduct = this.props.products.find(
                  product => product.name === item.productName
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
                quantity: 0,
                unitPrice: 0,
                totalPrice: 0
              })
            ],
            customerInfo: {
              name: invoice.customerName || '',
              phone: invoice.customerPhone || ''
            },
            invoiceInfo: {
              number: invoice.number,
              date: new Date(invoice.created).toISOString().split('T')[0],
              createdBy: invoice.createdBy || 'Admin'
            },
            previousDue: invoice.previousDue || 0,
            discount: invoice.discount || 0,
            paid: invoice.paid || 0,
            due: invoice.due || 0,
            notes: invoice.notes || '',
            paymentMethod: invoice.paymentMethod || 'cash',
            isSearchInvoice: true, // Set the flag to true
            isWholesale: invoice.isWholesale || true,
            invoiceId: invoice._id // Store the invoice ID for updating
          });
        } else {
          alert('Invoice not found.');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        alert('Failed to fetch invoice. Please try again.');
      }
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
            quantity: 0,
            unitPrice: 0,
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
      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedProduct =
          filteredProducts[this.state.selectedProductIndex];

        if (selectedProduct) {
          this.handleProductChange(index, selectedProduct.sku);
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
    // Update the phone number in the state
    this.setState({
      customerInfo: {
        ...this.state.customerInfo,
        phone: value
      },
      isSearchingCustomer: value.length === 11 // Start searching only if length is 11
    });

    // Perform search only if the phone number length is exactly 11
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

  handleCustomerNameChange = value => {
    this.setState({
      customerInfo: {
        ...this.state.customerInfo,
        name: value
      }
    });
  };

  handleNewInvoice = () => {
    // Reset the state to create a new invoice
    this.setState({
      invoiceItems: Array(100).fill({
        product: null,
        quantity: 0,
        unitPrice: 0,
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
      invoiceId: null // Store the invoice ID for updating
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
      isSearchingCustomer
    } = this.state;

    // Calculate filtered products based on search term
    const filteredProducts =
      searchTerm.length > 0 && Array.isArray(products)
        ? products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                                  ? item.product.name
                                  : ''
                              }
                              onChange={this.handleSearchTermChange}
                              onFocus={() => this.handleFocusAndClearRow(index)}
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
                                      {product.name}
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
                                      {product.name}
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
                {hasMoreItems && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '10px',
                      gap: '15px'
                    }}
                  >
                    <button
                      style={showMoreButtonStyle}
                      onClick={this.showMoreItems}
                    >
                      Show More ({visibleItems} of {invoiceItems.length})
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
                )}
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
                  <div>
                    <label>Name:</label>
                    <input
                      type='text'
                      style={inputStyle}
                      value={this.state.customerInfo.name} // Tied to state
                      onChange={e =>
                        this.handleCustomerNameChange(e.target.value)
                      } // Updates state on change
                      placeholder='Customer Name'
                    />
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
                        disabled={this.state.previousDue > 0} // Disable if there is previous due
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
                    gap: '10px', // Add spacing between the buttons
                    marginBottom: '20px' // Add spacing below the buttons
                  }}
                >
                  <button
                    style={newInvoiceButtonStyle}
                    onClick={this.handleNewInvoice}
                  >
                    New Invoice
                  </button>
                  <button
                    style={printButtonStyle}
                    onClick={this.handlePrintInvoice}
                  >
                    Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NotFound message='No products found.' />
        )}
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
