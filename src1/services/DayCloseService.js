import axios from 'axios';
import { getHeaders } from '../utility/getHeader';


export const DayCloseService = {
  
  // Get day close summary for a specific date
  getDayCloseSummary: async (date) => {
    try {
      const response = await axios.get(
        `/fetchdata/day_close_summary/close_date/close_date=${date}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching day close summary:', error);
      throw error;
    }
  },

  // Calculate live day summary from final_bill and order_items
  calculateLiveDaySummary: async (date) => {
    try {
      // Get all bills for the date
      const billsResponse = await axios.get(
        `/fetchdata/final_bill/id/`,
        getHeaders()
      );

      const bills = billsResponse.data.data || [];
      const todayBills = bills.filter(bill => 
        bill.setup_date && bill.setup_date.startsWith(date)
      );

      // Get all order items for the date
      const itemsResponse = await axios.get(
        `/fetchdata/order_items/id/`,
        getHeaders()
      );

      const items = itemsResponse.data.data || [];
      const todayItems = items.filter(item => 
        item.setup_date && item.setup_date.startsWith(date)
      );

      // Calculate summary
      const summary = {
        close_date: date,
        total_sales: 0,
        cash_sales: 0,
        upi_sales: 0,
        card_sales: 0,
        qr_sales: 0,
        bank_transfer_sales: 0,
        online_sales: 0,
        other_sales: 0,
        total_orders: todayBills.length,
        total_items_sold: 0,
        discount_amount: 0,
        tax_amount: 0,
        net_sales: 0,
        status: 'open'
      };

      // Calculate payment method totals
      todayBills.forEach(bill => {
        const amount = parseFloat(bill.paid_amount || 0);
        summary.total_sales += amount;
        summary.net_sales += amount;

        // Group by payment method
        const paymentMethod = bill.payment_method || 'cash';
        switch (paymentMethod) {
          case 'cash':
            summary.cash_sales += amount;
            break;
          case 'upi':
            summary.upi_sales += amount;
            break;
          case 'card':
            summary.card_sales += amount;
            break;
          case 'qr':
            summary.qr_sales += amount;
            break;
          case 'bank_transfer':
            summary.bank_transfer_sales += amount;
            break;
          case 'online':
            summary.online_sales += amount;
            break;
          default:
            summary.other_sales += amount;
        }

        // Add discount and tax if available
        summary.discount_amount += parseFloat(bill.discount_amount || 0);
        summary.tax_amount += parseFloat(bill.tax_amount || 0);
      });

      // Calculate total items sold
      todayItems.forEach(item => {
        summary.total_items_sold += parseInt(item.quantity || 0);
      });

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error calculating live day summary:', error);
      throw error;
    }
  },

  // Get detailed sales breakdown by items
  getDetailedSalesBreakdown: async (date) => {
    try {
      const itemsResponse = await axios.get(
        `/fetchdata/order_items/id/`,
        getHeaders()
      );

      const items = itemsResponse.data.data || [];
      const todayItems = items.filter(item => 
        item.created_at && item.created_at.startsWith(date)
      );

      // Group by item name
      const breakdown = {};
      todayItems.forEach(item => {
        const itemName = item.item_name;
        if (!breakdown[itemName]) {
          breakdown[itemName] = {
            item_name: itemName,
            total_quantity: 0,
            total_amount: 0,
            orders: 0
          };
        }
        breakdown[itemName].total_quantity += parseInt(item.quantity || 0);
        breakdown[itemName].total_amount += parseFloat(item.total_price || 0);
        breakdown[itemName].orders += 1;
      });

      return { success: true, data: Object.values(breakdown) };
    } catch (error) {
      console.error('Error fetching detailed breakdown:', error);
      throw error;
    }
  },

  // Save day close summary
  saveDayCloseSummary: async (dayCloseData) => {
    try {
      const response = await axios.post(
        `/insertdata/day_close_summary`,
        dayCloseData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error saving day close summary:', error);
      throw error;
    }
  },

  // Update day close summary
  updateDayCloseSummary: async (id, dayCloseData) => {
    try {
      const response = await axios.put(
        `/updatedata/day_close_summary/${id}`,
        dayCloseData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating day close summary:', error);
      throw error;
    }
  },

  // Get cash drawer information
  getCashDrawer: async (date) => {
    try {
      const response = await axios.get(
        `/fetchdata/cash_drawer/open_date/open_date=${date}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching cash drawer:', error);
      throw error;
    }
  },

  // Save cash drawer information
  saveCashDrawer: async (cashDrawerData) => {
    try {
      const response = await axios.post(
        `/insertdata/cash_drawer`,
        cashDrawerData,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error saving cash drawer:', error);
      throw error;
    }
  },

  // Get daily sales view (if the view exists in database)
  getDailySalesView: async (date) => {
    try {
      const response = await axios.get(
        `/api/reports/daily-sales-view/${date}`,
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching daily sales view:', error);
      throw error;
    }
  },

  // Export day close data to PDF/Excel
  exportDayCloseData: async (date, format = 'pdf') => {
    try {
      const response = await axios.get(
        `/api/reports/day-close-export/${date}?format=${format}`,
        {
          ...getHeaders(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting day close data:', error);
      throw error;
    }
  },

  // Reopen day (if needed for corrections)
  reopenDay: async (date, reason) => {
    try {
      const response = await axios.post(
        `/api/day-close/reopen`,
        { date, reason },
        getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error reopening day:', error);
      throw error;
    }
  }
};

export default DayCloseService;
