import React from 'react';
import { connect } from 'react-redux';
import { API_URL, ROLES } from '../../constants';
import actions from '../../actions'; // Import global actions
import axios from 'axios'; // Import axios for API calls
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import NotFound from '../../components/Common/NotFound';
import StockModal from '../../components/Manager/StockModal';
import InvoiceListModal from '../../components/Manager/InvoiceListModal';
import './styles.css'; // Import Minimal Light theme styles

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
      created: new Date().toISOString(), // Initialize with current time
      createdBy: 'Admin' // Default created by
    },
    visibleItems: 10,
    previousDue: 0,
    discount: 0,
    paid: '', // Default paid amount is empty
    paymentMethod: 'cash', // Default payment method
    isSearchingCustomer: false, // To track customer search status
    isWholesale: true, // Default to wholesale price
    isPaidChanged: false, // Track if paid amount has been changed
    notes: '', // Default value for notes
    selectedProductIndex: 0, // Tracks the currently highlighted product
    isSearchInvoice: false, // Flag to indicate if searching for an invoice
    invoiceId: null, // Store the invoice ID for updating
    isSaved: false, // Track if the invoice is saved
    // NEW STATE FOR CUSTOMER SEARCH BY NAME
    customerSearchTerm: '',
    focusedCustomerSearch: false,
    filteredCustomers: [],
    selectedCustomerIndex: 0,
    isStockModalOpen: false, // State for Stock Modal
    isInvoiceListModalOpen: false, // State for Invoice List Modal
    isLoadingProducts: false, // Track if products are being loaded
    searchResults: [], // Store server-side search results
    cachedProducts: [], // Products loaded from localStorage
    productCacheTime: null, // When products were last cached
    accounts: [], // Available accounts
    payments: [], // [{ account: '', amount: '' }]
    selectedAccount: '' // Default single payment account
  };

  // LocalStorage keys for caching
  PRODUCT_CACHE_KEY = 'invoice_products_cache';
  PRODUCT_CACHE_TIME_KEY = 'invoice_products_cache_time';

  // Load cached products from localStorage
  loadCachedProducts = () => {
    try {
      const cached = localStorage.getItem(this.PRODUCT_CACHE_KEY);
      const cacheTime = localStorage.getItem(this.PRODUCT_CACHE_TIME_KEY);

      if (cached) {
        const products = JSON.parse(cached);
        this.setState({
          cachedProducts: products,
          productCacheTime: cacheTime ? new Date(cacheTime) : null
        });
        return products;
      }
    } catch (error) {
      console.error('Error loading cached products:', error);
    }
    return null;
  };

  // Save products to localStorage
  saveProductsToCache = (products) => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(this.PRODUCT_CACHE_KEY, JSON.stringify(products));
      localStorage.setItem(this.PRODUCT_CACHE_TIME_KEY, now);
      this.setState({
        cachedProducts: products,
        productCacheTime: new Date(now)
      });
    } catch (error) {
      console.error('Error saving products to cache:', error);
    }
  };

  // Refresh products from server and update cache
  refreshProductCache = async () => {
    this.setState({ isLoadingProducts: true });
    try {
      await this.props.fetchProducts(0);
      // The products will be saved to cache in componentDidUpdate when props.products changes
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
    this.setState({ isLoadingProducts: false });
  };

  // Fetch products once component mounts
  async componentDidMount() {
    this._isMounted = true;

    // Try to load cached products first
    const cachedProducts = this.loadCachedProducts();

    // If no cache exists, fetch from API
    if (!cachedProducts || cachedProducts.length === 0) {
      this.setState({ isLoadingProducts: true });
      await this.props.fetchProducts(0);
      this.setState({ isLoadingProducts: false });
    }

    if (this._isMounted && this.props.user && this.props.user.firstName) {
      this.setState(prevState => ({
        invoiceInfo: {
          ...prevState.invoiceInfo,
          createdBy: this.props.user.firstName
        }
      }));
    }

    // Check for invoice number in URL
    if (this._isMounted) {
      this.loadInvoiceFromURL();
      this.fetchAccounts();
    }
  }

  fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/account`);
      if (this._isMounted) {
        const accounts = response.data.accounts;
        // Find default cash account
        const defaultCash = accounts.find(a => a.type === 'cash' || a.name.toLowerCase().includes('cash'));

        this.setState({
          accounts: accounts,
          selectedAccount: defaultCash ? defaultCash._id : (accounts.length > 0 ? accounts[0]._id : '')
        });
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  componentDidUpdate(prevProps, prevState) {
    // Save products to cache when they're fetched from API
    if (this.props.products &&
      this.props.products.length > 0 &&
      prevProps.products !== this.props.products) {
      this.saveProductsToCache(this.props.products);
    }

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

    // Removed auto-update of paid logic

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
              return {
                product: item.product || null,
                productName: item.productName || (item.product ? item.product.shortName || item.product.name : ''),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                buyingPrice: item.buyingPrice || (item.product ? item.product.buyingPrice : 0)
              };
            }),
            ...Array(100 - invoice.items.length).fill({
              product: null,
              quantity: '',
              unitPrice: '',
              totalPrice: 0
            })
          ],
          visibleItems: Math.max(10, invoice.items.length),
          customerInfo: {
            // Prioritize customer object data, fallback to customerName/customerPhone fields
            name: (invoice.customer && invoice.customer.name) || invoice.customerName || '',
            phone: (invoice.customer && invoice.customer.phoneNumber) || invoice.customerPhone || ''
          },
          customer: invoice.customer || null,
          invoiceInfo: {
            number: invoice.invoiceNumber,
            date: new Date(invoice.created).toISOString().split('T')[0],
            created: invoice.created, // Store full timestamp
            createdBy: invoice.createdBy || 'Admin'
          },
          previousDue: invoice.previousDue || 0,
          discount: invoice.discount || 0,
          paid: invoice.paid || 0,
          due: invoice.due || 0,
          notes: invoice.notes || '',
          paymentMethod: invoice.paymentMethod || 'cash',
          payments: invoice.payments && invoice.payments.length > 0
            ? invoice.payments.map(p => ({ account: p.account ? p.account._id : '', amount: p.amount }))
            : [],
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
    // Removed auto-set of paid to finalTotal to keep it empty by default
    return finalTotal;
  }

  /**
   * Handles product selection from the dropdown.
   * Updates item, unit price, and triggers recalculation of totals.
   */
  handleProductChange = (index, productSKU) => {
    const { products } = this.props;
    const { searchResults, cachedProducts } = this.state;

    // Look in cachedProducts first, then searchResults, then props.products
    const selectedProduct =
      cachedProducts.find(p => p.sku === productSKU) ||
      searchResults.find(p => p.sku === productSKU) ||
      products.find(p => p.sku === productSKU);

    const invoiceItems = [...this.state.invoiceItems];

    // Update relevant row data
    invoiceItems[index] = {
      ...invoiceItems[index],
      product: selectedProduct || null,
      productName: selectedProduct ? (selectedProduct.shortName || selectedProduct.name) : '',
      buyingPrice: selectedProduct ? selectedProduct.buyingPrice : 0,
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
      notes: updatedNotes,
      isSaved: false // Mark as unsaved
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

    const quantity = parseFloat(value) || 0;

    invoiceItems[index] = {
      ...invoiceItems[index],
      quantity,
      totalPrice: quantity * invoiceItems[index].unitPrice
    };
    this.setState({ invoiceItems, isSaved: false });
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
    this.setState({ invoiceItems, isSaved: false });
  };

  /**
   * Toggles the quantity between positive and negative to mark as return.
   */
  handleToggleReturn = (index) => {
    const invoiceItems = [...this.state.invoiceItems];
    const currentQty = parseFloat(invoiceItems[index].quantity) || 0;
    if (currentQty === 0) return;

    const newQty = currentQty * -1;
    invoiceItems[index] = {
      ...invoiceItems[index],
      quantity: newQty,
      totalPrice: newQty * invoiceItems[index].unitPrice
    };
    this.setState({ invoiceItems, isSaved: false });
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
    // Removed auto-set of paid to finalTotal to keep it empty by default
    return finalTotal;
  };

  /**
   * Calculates the remaining due amount.
   */
  calculateRemainingDue = () => {
    // If payments exist, use them. Else use 'paid' state (legacy/fallback)
    const paidAmount = this.state.payments.length > 0
      ? this.state.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      : (this.state.paid || 0);

    const grandTotal = this.calculateFinalTotal();
    return grandTotal - paidAmount;
  };

  /**
 * Saves the invoice to the database before printing
 * Checks if invoice exists by invoice number and updates it, otherwise creates new
 */
  saveInvoiceToDatabase = async () => {
    try {
      // Validate paid amount
      if (this.state.paid === '' || this.state.paid < 0) {
        alert('Please enter a valid paid amount. Enter 0 for full due.');
        return false;
      }

      // Filter out empty rows (must have product OR productName AND a valid quantity)
      const filledInvoiceItems = this.state.invoiceItems.filter(
        item => (item.product || (item.productName && item.productName.trim() !== '')) &&
          (item.quantity !== '' && item.quantity !== 0 && item.quantity !== null && item.quantity !== undefined)
      );

      if (filledInvoiceItems.length === 0) {
        alert('Please add at least one product to the invoice');
        return false;
      }

      // Format items for the API
      const items = filledInvoiceItems.map(item => ({
        product: item.product ? (item.product._id || item.product) : null,
        productName: item.productName || (item.product ? item.product.shortName || item.product.name : ''),
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        buyingPrice: item.buyingPrice || (item.product ? item.product.buyingPrice : 0) || 0,
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

      // Calculate paid from payments array if used
      const currentPaid = this.state.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // Determine payment method
      let finalPaymentMethod = paymentMethod;
      if (this.state.payments.length > 0) {
        finalPaymentMethod = 'split';
      } else if (currentPaid > 0) {
        // If paid manual amount but no split payments? 
        // But for backward compatibility, if payments is empty, treat as 'cash' or current selection.
      }

      // If payments array is empty but paid > 0, create a single payment entry
      let finalPayments = this.state.payments;
      if (finalPayments.length === 0 && (paid || 0) > 0) {
        if (this.state.selectedAccount) {
          finalPayments = [{
            account: this.state.selectedAccount,
            amount: paid
          }];
        } else {
          // Fallback if no account selected? Maybe alert user?
          // alert('Please select a payment account');
          // return false;
          // But let's be lenient and assume they might fix it later or legacy behavior.
          // Actually, the backend needs an account for the new system.
          if (this.state.accounts.length > 0) {
            finalPayments = [{
              account: this.state.accounts[0]._id, // Default to first account
              amount: paid
            }];
          }
        }
      }

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
        paid: this.state.payments.length > 0 ? currentPaid : (paid || 0),
        due: this.calculateRemainingDue(),
        paymentMethod: finalPaymentMethod || 'cash',
        grandTotal: this.calculateFinalTotal(),
        paid: finalPayments.length > 0 ? finalPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) : (paid || 0),
        due: this.calculateRemainingDue(),
        paymentMethod: finalPayments.length > 1 ? 'split' : (paymentMethod || 'cash'),
        payments: finalPayments,
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
          isSearchInvoice: true,
          isSaved: true // Mark as saved
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
      printWindow.focus();

      // Close window after print dialog is dismissed (print or cancel)
      printWindow.onafterprint = function () {
        printWindow.close();
      };

      printWindow.print();
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

    // Helper for date formatting
    const formatDateForPrint = (dateString, createdString) => {
      // Fallback to just date
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    };

    const grandTotal = this.calculateGrandTotal();
    const due = this.calculateRemainingDue();

    // Filter out rows without products
    const filledInvoiceItems = invoiceItems.filter(
      item => item.product || (item.productName && item.productName.trim() !== '')
    );



    // Create rows HTML
    const rowsHtml = filledInvoiceItems
      .map(
        item => `
              <tr>
                <td class="product-name-cell">${item.productName || (item.product ? item.product.shortName || item.product.name : '')
          }</td>
                <td class="small-cell">${item.quantity}</td>
                <td class="small-cell">${item.unitPrice}</td>
                <td class="small-cell">${item.totalPrice}</td>
              </tr>
            `
      )
      .join('');





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
                  border: 1px solid #000; /* Darker border */
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
                  text-align: right; /* Changed back to right */
                  border: none;
                }
                .notes-cell {
                  text-align: left !important;
                  color: red;
                }
                .total-cell {
                  text-align: right; /* Changed back to right */
                  border: 1px solid #000; /* Darker border */
                }
                .totals-section {
                  page-break-inside: avoid;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 0;
                  }
                  button {
                    display: none;
                  }
                  @page {
                    size: auto;
                    margin: 10mm; /* Reduced margin */
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
                      <strong>Date:</strong> ${formatDateForPrint(invoiceInfo.date, invoiceInfo.created)}<br>
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

                    <!-- Totals section - will only appear at the end of the table -->
                    <tr class="totals-section totals-row">
                      <td class="notes-cell" style={{ textAlign: 'left', fontWeight: 'bold' }}>${this.state.notes
      }</td>
                      <td colSpan="2">Total</td>
                      <td class="total-cell">${grandTotal}</td>
                    </tr>
                    ${previousDue > 0 ? `
                      <tr class="totals-section totals-row">
                        <td colSpan="3">Previous Due</td>
                        <td class="total-cell">${previousDue}</td>
                      </tr>
                    ` : ''}
                    ${discount > 0 ? `
                      <tr class="totals-section totals-row">
                        <td colSpan="3">Discount</td>
                        <td class="total-cell">${discount}</td>
                      </tr>
                    ` : ''}
                    ${(previousDue > 0 || discount > 0) ? `
                      <tr class="totals-section totals-row">
                        <td colSpan="3">Grand Total</td>
                        <td class="total-cell">${grandTotal + previousDue - discount}</td>
                      </tr>
                    ` : ''}
                    <tr class="totals-section totals-row">
                      <td colSpan="3">Paid</td>
                      <td class="total-cell">${paid || 0}</td>
                    </tr>
                    ${due > 0 ? `
                      <tr class="totals-section totals-row">
                        <td colSpan="3">Remaining Due</td>
                        <td class="total-cell">${due}</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </body>
            </html>
          `;
  };

  searchProducts = async (term) => {
    if (!term || term.length < 2) {
      this.setState({ searchResults: [] });
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/product/list/search/${term}`);
      if (response.data.products) {
        this.setState({ searchResults: response.data.products });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      this.setState({ searchResults: [] });
    }
  };

  handlePaidChange = (e) => {
    const value = e.target.value;
    this.setState({
      paid: value === '' ? '' : parseFloat(value),
      isPaidChanged: true,
      isSaved: false // Mark as unsaved
    });
  };

  handleSearchTermChange = e => {
    const term = e.target.value;
    this.setState({
      searchTerm: term,
      selectedProductIndex: 0 // Reset the selected product index
    });

    // Debounce the search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchProducts(term);
    }, 300);
  };

  handleFocusProduct = index => {
    console.log('handle focus product: index:', index)
    if ((index + 1) % 10 === 0) {
      this.showMoreItems();
    }

    const item = this.state.invoiceItems[index];

    // If the item has data but no product object (e.g. legacy item), preserve it for editing
    // This prevents wiping the row when clicking on it
    if (!item.product && (item.productName || item.quantity || item.unitPrice)) {
      this.setState({
        focusedRowIndex: index,
        searchTerm: item.productName || ''
      });
      return;
    }

    const invoiceItems = [...this.state.invoiceItems];

    // Clear the product data for the focused row
    invoiceItems[index] = {
      ...invoiceItems[index],
      product: null,
      productName: null, // Clear productName as well
      quantity: '', // Clear quantity
      unitPrice: '', // Clear unitPrice
      totalPrice: 0, // Reset totalPrice
      buyingPrice: 0 // Reset buyingPrice
    };
    // The original line below is redundant after the above block
    // invoiceItems[index] = {
    //   ...invoiceItems[index],
    //   product: null
    // };

    this.setState({
      invoiceItems,
      searchTerm: '', // Clear the search term
      focusedRowIndex: index // Set the focused row index
    });
  };

  handleEditProduct = index => {
    const item = this.state.invoiceItems[index];
    if (item && item.product) {
      this.setState({
        focusedRowIndex: index,
        searchTerm: item.productName || item.product.shortName || item.product.name || '',
        selectedProductIndex: 0
      });
    }
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
            productName: '', // Clear productName as well
            quantity: '',
            unitPrice: '',
            totalPrice: 0,
            buyingPrice: 0
          };
          this.setState({
            invoiceItems: newInvoiceItems,
            focusedRowIndex: null,
            selectedProductIndex: 0, // Reset selected index
            searchTerm: '', // Ensure search term is cleared
            isSaved: false // Mark as unsaved
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
   * Helper: Gets the customer's current due (ledger balance)
   * This returns the customer's total outstanding due which accounts for all invoices and payments
   */
  fetchCustomerDue = async (customerId) => {
    if (!customerId) return 0;
    try {
      // Fetch the customer to get their current due (which is synced with ledger balance)
      const response = await axios.get(`${API_URL}/customer/${customerId}`);
      if (response.data.customer) {
        return response.data.customer.due || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching customer due:', error);
      return 0;
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
          // Fetch last invoice due for this customer
          const customerDue = await this.fetchCustomerDue(customer._id);
          this.setState({
            customer: customer,
            customerInfo: {
              ...this.state.customerInfo,
              name: customer.name,
              phone: customer.phoneNumber
            },
            previousDue: customerDue,
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
  handleCustomerSelect = async (customer) => {
    // Fetch last invoice due for this customer
    const customerDue = await this.fetchCustomerDue(customer._id);
    this.setState({
      customer: customer,
      customerInfo: {
        name: customer.name,
        phone: customer.phoneNumber
      },
      previousDue: customerDue,
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
    // Clear cache and fetch fresh products
    this.setState({ isLoadingProducts: true });
    try {
      await this.props.fetchProducts(0);
      // Products will be saved to cache in componentDidUpdate
      alert('Products refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing products:', error);
      alert('Failed to refresh products.');
    }
    this.setState({ isLoadingProducts: false });
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

  /**
   * Resets the invoice form to create a new invoice.
   */
  handleNewInvoice = async () => {
    if (!this.state.isSaved) {
      const confirmNew = window.confirm(
        'Current invoice is not saved. Do you want to save it before creating a new one?\n\nClick OK to Save & New.\nClick Cancel to Discard & New.'
      );

      if (confirmNew) {
        const saved = await this.saveInvoiceToDatabase();
        if (!saved) return; // If save failed, don't proceed
      }
    }

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
        number: `${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        created: new Date().toISOString(),
        createdBy: this.props.user ? this.props.user.firstName : 'Admin'
      },
      visibleItems: 10,
      previousDue: 0,
      discount: 0,
      paid: '', // Reset paid to empty
      paymentMethod: 'cash',
      isSearchingCustomer: false,
      isWholesale: true,
      isPaidChanged: false,
      notes: '',
      selectedProductIndex: 0,
      isSearchInvoice: false,
      invoiceId: null,
      // RESET NEW CUSTOMER SEARCH STATE
      customerSearchTerm: '',
      focusedCustomerSearch: false,
      filteredCustomers: [],
      selectedCustomerIndex: 0,
      isStockModalOpen: false, // Reset stock modal state
      isInvoiceListModalOpen: false, // Reset invoice list modal state
      payments: []
    });
  };

  // Payment Handlers
  handleAddPayment = () => {
    this.setState(prevState => ({
      payments: [...prevState.payments, { account: '', amount: '' }]
    }));
  };

  handleRemovePayment = (index) => {
    this.setState(prevState => {
      const newPayments = [...prevState.payments];
      newPayments.splice(index, 1);
      return { payments: newPayments };
    });
  };

  handlePaymentChange = (index, field, value) => {
    this.setState(prevState => {
      const newPayments = [...prevState.payments];
      newPayments[index] = { ...newPayments[index], [field]: value };
      // If amount changed, we might want to update 'paid' state for display immediately or just use calculated
      return { payments: newPayments, isPaidChanged: true };
    });
  };

  // Invoice List Modal Handlers
  handleOpenInvoiceListModal = () => {
    this.setState({ isInvoiceListModalOpen: true });
  };

  handleCloseInvoiceListModal = () => {
    this.setState({ isInvoiceListModalOpen: false });
  };

  handleSelectInvoiceFromList = (invoiceNumber) => {
    this.setState({ isInvoiceListModalOpen: false });
    this.fetchAndLoadInvoice(invoiceNumber);
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

  handleSaveInvoice = async () => {
    const success = await this.saveInvoiceToDatabase();
    if (success) {
      alert('Invoice saved successfully!');
    }
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
      selectedCustomerIndex,
      searchResults,
      cachedProducts,
      productCacheTime,
      isLoadingProducts
    } = this.state;

    // Use cachedProducts if available, otherwise use props.products
    const allProducts = cachedProducts.length > 0 ? cachedProducts : (Array.isArray(products) ? products : []);

    // Calculate filtered products based on search term
    // Filter locally from cached products
    const filteredProducts = searchTerm.length > 0
      ? allProducts.filter(product => {
        const term = searchTerm.toLowerCase();
        const name = (product.name || '').toLowerCase();
        const shortName = (product.shortName || '').toLowerCase();
        return name.includes(term) || shortName.includes(term);
      }).slice(0, 50) // Limit to 50 results
      : allProducts;

    // Styles - Minimal Light Compact Theme
    const tableStyle = {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      tableLayout: 'fixed',
      fontSize: '13px'
    };

    const cellStyle = {
      padding: '6px 10px',
      borderBottom: '1px solid #f1f5f9',
      textAlign: 'left',
      color: '#334155'
    };

    const productNameCellStyle = {
      ...cellStyle,
      width: '45%'
    };

    const smallCellStyle = {
      padding: '6px 10px',
      borderBottom: '1px solid #f1f5f9',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '18%',
      color: '#334155'
    };

    const headerCellStyle = {
      padding: '12px 10px',
      textAlign: 'left',
      fontWeight: 600,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: '#64748b',
      borderBottom: '2px solid #e2e8f0',
      background: '#f1f5f9'
    };

    const headerSmallCellStyle = {
      ...headerCellStyle,
      textAlign: 'center',
      width: '18%'
    };

    const dropdownStyle = {
      position: 'relative'
    };

    const searchBoxStyle = {
      width: '100%',
      padding: '8px 10px',
      boxSizing: 'border-box',
      border: '1.5px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#1e293b',
      transition: 'all 0.2s ease'
    };

    const resultsContainerStyle = {
      position: 'absolute',
      zIndex: 100,
      width: '100%',
      maxHeight: '180px',
      overflowY: 'auto',
      border: '1.5px solid #e2e8f0',
      borderRadius: '10px',
      backgroundColor: 'white',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      marginTop: '2px'
    };

    const resultItemStyle = {
      padding: '10px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '13px',
      transition: 'all 0.15s ease'
    };

    const highlightedResultStyle = {
      ...resultItemStyle,
      backgroundColor: '#f1f5f9',
      color: '#3b82f6'
    };

    const infoBoxStyle = {
      padding: '12px 14px',
      border: '1.5px solid #f1f5f9',
      borderRadius: '12px',
      background: '#ffffff'
    };

    const infoGridStyle = {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    };

    const inputStyle = {
      width: '100%',
      padding: '8px 10px',
      boxSizing: 'border-box',
      border: '1.5px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#1e293b',
      transition: 'all 0.2s ease'
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

    // Layout styles moved to CSS class names
    // const invoiceLayout = { ... }
    // const invoiceTableContainer = { ... }
    // const invoiceInfoContainer = { ... }

    // Display only the visible items
    const visibleInvoiceItems = invoiceItems.slice(0, visibleItems);
    const hasMoreItems = visibleItems < invoiceItems.length;

    return (
      <>
        {isLoading ? (
          <LoadingIndicator inline />
        ) : (
          <div className='invoice-container'>
            {/* Invoice Layout */}
            <div className="invoice-layout">
              {/* Left: Invoice Table */}
              <div className="invoice-table-container">
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
                                  : item.productName || (item.product ? item.product.shortName || item.product.name : '')
                              }
                              onChange={this.handleSearchTermChange}
                              onFocus={() => {
                                if (!item.product) {
                                  this.handleFocusProduct(index);
                                }
                              }}
                              onDoubleClick={() => {
                                if (item.product) {
                                  this.handleEditProduct(index);
                                }
                              }}
                              readOnly={!!item.product && focusedRowIndex !== index}
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
                                {this.state.isLoadingProducts ? (
                                  <div style={resultItemStyle}>
                                    Loading products...
                                  </div>
                                ) : filteredProducts.length > 0 ? (
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
                                    {products.length === 0
                                      ? 'Type to search products...'
                                      : 'No products found'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Quantity input */}
                        <td style={smallCellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              type='number'
                              className='invoice-row-input'
                              style={inputStyle}
                              value={item.quantity}
                              onChange={e =>
                                this.handleQuantityChange(index, e.target.value)
                              }
                              onKeyDown={e => this.handleKeyDown(e, index)}
                            />
                          </div>
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
                    gap: '8px'
                  }}
                >
                  {hasMoreItems && (
                    <button
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#22c55e',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
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
                      background: isLoadingProducts ? '#dbeafe' : '#f1f5f9',
                      border: 'none',
                      cursor: isLoadingProducts ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      color: isLoadingProducts ? '#3b82f6' : '#64748b',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={this.handleRefreshProducts}
                    disabled={isLoadingProducts}
                    title={`Refresh products (${allProducts.length} cached)`}
                  >
                    <i className={`fa fa-refresh ${isLoadingProducts ? 'fa-spin' : ''}`} aria-hidden="true"></i>
                    <span style={{ fontSize: '11px' }}>{allProducts.length}</span>
                  </button>

                  {/* Stock Button */}
                  <button
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      color: '#64748b',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
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
              <div className="invoice-info-container">
                <div style={infoBoxStyle}>
                  {/* Invoice Number and Payment Configuration */}
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Invoice Number:</label>
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
                    </div>

                    {/* Payments Section */}
                    {this.state.payments.length > 0 ? (
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Payments
                          <button
                            onClick={this.handleAddPayment}
                            style={{
                              border: 'none', background: 'none', color: '#3b82f6',
                              cursor: 'pointer', float: 'right', fontSize: '11px', fontWeight: 600
                            }}
                          >
                            + Add
                          </button>
                        </label>
                        {this.state.payments.map((payment, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                            <select
                              style={{ ...inputStyle, flex: 2 }}
                              value={payment.account}
                              onChange={(e) => this.handlePaymentChange(idx, 'account', e.target.value)}
                            >
                              <option value="">Select Account</option>
                              {this.state.accounts.map(acc => (
                                <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              style={{ ...inputStyle, flex: 1 }}
                              placeholder="Amount"
                              value={payment.amount}
                              onChange={(e) => this.handlePaymentChange(idx, 'amount', e.target.value)}
                            />
                            <button
                              onClick={() => this.handleRemovePayment(idx)}
                              style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '0 8px' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Payment Account:
                          <span
                            onClick={this.handleAddPayment}
                            style={{ float: 'right', color: '#3b82f6', cursor: 'pointer', fontSize: '10px' }}
                          >
                            Multi-Pay
                          </span>
                        </label>
                        <select
                          style={inputStyle}
                          value={this.state.selectedAccount}
                          onChange={e => this.setState({ selectedAccount: e.target.value })}
                        >
                          <option value="">Select Account</option>
                          {this.state.accounts.map(acc => (
                            <option key={acc._id} value={acc._id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Date and Created By */}
                  <div
                    style={{ display: 'flex', gap: '10px', marginTop: '8px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Date:</label>
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
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Created By:</label>
                      <input
                        type='text'
                        style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', borderColor: '#f1f5f9' }}
                        value={invoiceInfo.createdBy}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                {/* Customer Details */}
                <div style={infoBoxStyle}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px'
                    }}
                  >
                    <input
                      type='checkbox'
                      style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                      checked={this.state.isWholesale}
                      onChange={this.handleWholesaleToggle}
                    />
                    <label style={{ margin: 0, fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                      Wholesale Customer
                    </label>
                  </div>
                  {/* NEW CUSTOMER NAME INPUT WITH SEARCH DROPDOWN */}
                  <div style={dropdownStyle}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Name:</label>
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
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Phone:</label>
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
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Subtotal:</label>
                      <input
                        type='text'
                        style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', borderColor: '#f1f5f9' }}
                        value={this.calculateGrandTotal()}
                        readOnly
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Previous Due:</label>
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
                    style={{ display: 'flex', gap: '10px', marginTop: '8px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Grand Total:</label>
                      <input
                        type='text'
                        style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', borderColor: '#f1f5f9' }}
                        value={this.calculateFinalTotal()}
                        readOnly
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Discount:</label>
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
                    style={{ display: 'flex', gap: '10px', marginTop: '8px' }}
                  >
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Paid:</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        style={this.state.payments.length > 0 ? { ...inputStyle, background: '#f8fafc' } : inputStyle}
                        value={this.state.payments.length > 0 ? this.state.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) : (this.state.paid)}
                        onChange={e => {
                          if (this.state.payments.length === 0) {
                            this.setState({
                              isPaidChanged: true,
                              paid: e.target.value // Keep as string to allow empty
                            })
                          }
                        }}
                        readOnly={this.state.payments.length > 0}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Due:</label>
                      <input
                        type='text'
                        style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', borderColor: '#f1f5f9' }}
                        value={this.calculateRemainingDue()}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '6px'
                  }}
                >
                  {this.state.invoiceItems.some(item => item.product || (item.productName && item.productName.trim() !== '')) && (
                    <div style={{
                      marginRight: '15px',
                      padding: '5px 10px',
                      color: this.state.isSaved ? '#16a34a' : '#dc2626',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <i className={`fa ${this.state.isSaved ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                      {this.state.isSaved ? 'Saved' : 'Unsaved'}
                    </div>
                  )}
                  <button
                    style={{
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      color: '#64748b',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={this.handleOpenInvoiceListModal}
                    title="Show Invoices"
                  >
                    <i className="fa fa-list" aria-hidden="true"></i>
                    List
                  </button>
                  <button
                    style={{
                      backgroundColor: '#dcfce7',
                      border: 'none',
                      color: '#16a34a',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={this.handleSaveInvoice}
                  >
                    <i className="fa fa-save" aria-hidden="true"></i>
                    Save
                  </button>

                  <button
                    style={{
                      backgroundColor: '#e0f2fe',
                      border: 'none',
                      color: '#0284c7',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={this.handleNewInvoice}
                  >
                    <i className="fa fa-plus" aria-hidden="true"></i>
                    New
                  </button>
                  <button
                    style={{
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      color: 'white',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={this.handlePrintInvoice}
                  >
                    <i className="fa fa-print" aria-hidden="true"></i>
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div >
        )}
        {/* Stock Management Modal */}
        <StockModal
          isOpen={this.state.isStockModalOpen}
          onRequestClose={this.handleCloseStockModal}
          products={cachedProducts.length > 0 ? cachedProducts : products}
          handleUpdateStock={this.handleStockUpdate}
          handleAddStock={this.handleStockAdd}
        />
        {/* Invoice List Modal */}
        <InvoiceListModal
          isOpen={this.state.isInvoiceListModalOpen}
          onRequestClose={this.handleCloseInvoiceListModal}
          onSelectInvoice={this.handleSelectInvoiceFromList}
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