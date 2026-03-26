import React, { useEffect, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";

import { TextfieldwithLabel } from "../../components/Buttons/Textfield";
import fetchData from "../../functions/fetchData";

export default function PrintSetting() {
  const [loading, setLoading] = useState(false);
  const [formdata, setFormData] = useState({
    id: null,
    cashier_printer_ip: "",
    kitchen_printer_ip: "",
    kiosk_printer_ip: "",
    printer_port: "9100",
    print_width: "80",
    status: "active",
  });

  // Fetch the printer settings on mount
  useEffect(() => {
    const fetchPrinterSettings = async () => {
      try {
        setLoading(true);
        const res = await fetchData("printersetting", null, "id", {});
        if (res && res.length > 0) {
          const record = res[0];
          setFormData({
            id: record.id,
            cashier_printer_ip: record.cashier_printer_ip || "",
            kitchen_printer_ip: record.kitchen_printer_ip || "",
            kiosk_printer_ip: record.kiosk_printer_ip || "",
            printer_port: record.printer_port || "9100",
            print_width: record.print_width || "80",
            status: record.status || "active",
          });
        } else {
          console.log("No existing printer settings found");
        }
      } catch (error) {
        console.error("Error fetching printer settings:", error);
        toast.error("Error loading printer settings");
      } finally {
        setLoading(false);
      }
    };
    fetchPrinterSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateIPAddress = (ip) => {
    if (!ip) return true; // Allow empty values
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) return false;
    const parts = ip.split(".");
    return parts.every((part) => parseInt(part) <= 255);
  };

  const validateForm = () => {
    if (!validateIPAddress(formdata.cashier_printer_ip)) {
      toast.error("Invalid Cashier Printer IP address");
      return false;
    }
    if (!validateIPAddress(formdata.kitchen_printer_ip)) {
      toast.error("Invalid Kitchen Printer IP address");
      return false;
    }
    if (!validateIPAddress(formdata.kiosk_printer_ip)) {
      toast.error("Invalid Kiosk Printer IP address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formdata) return;

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (formdata.id) {
        // Update existing settings
        await axios.put(
          `updatesubscription/printersetting/${formdata.id}`,
          {
            cashier_printer_ip: formdata.cashier_printer_ip,
            kitchen_printer_ip: formdata.kitchen_printer_ip,
            kiosk_printer_ip: formdata.kiosk_printer_ip,
            printer_port: formdata.printer_port,
            print_width: formdata.print_width,
            status: formdata.status,
          },
          getHeaders()
        );
        toast.success("Printer settings updated successfully!");
      } else {
        // Check if any record already exists
        const existingData = await fetchData("printersetting", null, "id", {});

        if (existingData && existingData.length > 0) {
          toast.error(
            "Printer settings already exist! You can only update the existing settings."
          );
          setLoading(false);
          return;
        }

        // Create new settings
        await axios.post(
          `createsubscription/printersetting`,
          {
            cashier_printer_ip: formdata.cashier_printer_ip,
            kitchen_printer_ip: formdata.kitchen_printer_ip,
            kiosk_printer_ip: formdata.kiosk_printer_ip,
            printer_port: formdata.printer_port,
            print_width: formdata.print_width,
            status: formdata.status,
          },
          getHeaders()
        );
        toast.success("Printer settings created successfully!");
        // Refetch to get the ID
        const newData = await fetchData("printersetting", null, "id", {});
        if (newData && newData.length > 0) {
          const record = newData[0];
          setFormData((prev) => ({
            ...prev,
            id: record.id,
          }));
        }
      }
    } catch (error) {
      console.error("Error saving printer settings:", error);
      toast.error(
        error.response?.data?.message ||
          "Error saving printer settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const testPrinterConnection = async (printerType) => {
    let ipAddress = "";
    if (printerType === "cashier") {
      ipAddress = formdata.cashier_printer_ip;
    } else if (printerType === "kitchen") {
      ipAddress = formdata.kitchen_printer_ip;
    } else if (printerType === "kiosk") {
      ipAddress = formdata.kiosk_printer_ip;
    }

    if (!ipAddress) {
      toast.error(`Please enter ${printerType} printer IP address first`);
      return;
    }

    if (!validateIPAddress(ipAddress)) {
      toast.error("Invalid IP address");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `testprinterconnection`,
        {
          ip_address: ipAddress,
          port: formdata.printer_port,
        },
        getHeaders()
      );
      toast.success(`${printerType} printer connection successful!`);
    } catch (error) {
      console.error("Error testing printer connection:", error);
      toast.error(
        error.response?.data?.message ||
          `Failed to connect to ${printerType} printer`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <div className="container-fluid p-4">
          <CardComponent title="Print Settings - ESCpos Thermal Printer">
            <div className="row">
              <div className="col-lg-8 col-md-10 col-sm-12">
                <form onSubmit={handleSubmit}>
                  <div className="form-section mb-4">
                    <h5 className="mb-3 text-secondary">
                      <i className="fas fa-print mr-2"></i>Printer IP Addresses
                    </h5>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <TextfieldwithLabel
                          label="Cashier Printer IP Address"
                          name="cashier_printer_ip"
                          value={formdata.cashier_printer_ip}
                          onChange={handleInputChange}
                          type="text"
                          placeholder="192.168.1.100"
                        />
                        <small className="text-muted d-block mt-2">
                          e.g., 192.168.1.100
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm mt-3 px-3"
                          onClick={() => testPrinterConnection("cashier")}
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 4px 8px rgba(102, 126, 234, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
                            }
                          }}
                        >
                          <i className="fas fa-plug mr-2"></i>
                          {loading ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>

                      <div className="col-md-6">
                        <TextfieldwithLabel
                          label="Kitchen Printer IP Address"
                          name="kitchen_printer_ip"
                          value={formdata.kitchen_printer_ip}
                          onChange={handleInputChange}
                          type="text"
                          placeholder="192.168.1.101"
                        />
                        <small className="text-muted d-block mt-2">
                          e.g., 192.168.1.101
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm mt-3 px-3"
                          onClick={() => testPrinterConnection("kitchen")}
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 4px 8px rgba(245, 87, 108, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 6px 12px rgba(245, 87, 108, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px rgba(245, 87, 108, 0.3)';
                            }
                          }}
                        >
                          <i className="fas fa-plug mr-2"></i>
                          {loading ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <TextfieldwithLabel
                          label="Kiosk Printer IP Address"
                          name="kiosk_printer_ip"
                          value={formdata.kiosk_printer_ip}
                          onChange={handleInputChange}
                          type="text"
                          placeholder="192.168.1.102"
                        />
                        <small className="text-muted d-block mt-2">
                          e.g., 192.168.1.102
                        </small>
                        <button
                          type="button"
                          className="btn btn-sm mt-3 px-3"
                          onClick={() => testPrinterConnection("kiosk")}
                          disabled={loading}
                          style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 4px 8px rgba(79, 172, 254, 0.3)',
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 6px 12px rgba(79, 172, 254, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading) {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 4px 8px rgba(79, 172, 254, 0.3)';
                            }
                          }}
                        >
                          <i className="fas fa-plug mr-2"></i>
                          {loading ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>

                      <div className="col-md-6">
                        <TextfieldwithLabel
                          label="Printer Port"
                          name="printer_port"
                          value={formdata.printer_port}
                          onChange={handleInputChange}
                          type="text"
                          placeholder="9100"
                        />
                        <small className="text-muted d-block mt-2">
                          Default ESCpos port is 9100
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="form-section mb-4">
                    <h5 className="mb-3 text-secondary">
                      <i className="fas fa-cog mr-2"></i>Print Configuration
                    </h5>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <TextfieldwithLabel
                          label="Print Width (mm)"
                          name="print_width"
                          value={formdata.print_width}
                          onChange={handleInputChange}
                          type="number"
                          placeholder="80"
                        />
                        <small className="text-muted d-block mt-2">
                          Typical values: 58mm or 80mm
                        </small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                          name="status"
                          value={formdata.status}
                          onChange={handleInputChange}
                          className="form-control"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-section mb-4">
                    <div className="alert alert-info" role="alert">
                      <i className="fas fa-info-circle mr-2"></i>
                      <strong>ESCpos Setup Instructions:</strong>
                      <ul className="mb-0 mt-2">
                        <li>
                          Ensure your thermal printers are connected to the
                          network
                        </li>
                        <li>
                          Configure each printer with the IP addresses provided
                        </li>
                        <li>
                          Default port for ESCpos thermal printers is 9100
                        </li>
                        <li>
                          Use the "Test Connection" button to verify printer
                          connectivity
                        </li>
                        <li>
                          Print width should match your physical printer specs
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-group mt-5 pt-3 border-top">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-lg w-100"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        padding: '12px 30px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        opacity: loading ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                    >
                      <i className="fas fa-save mr-2"></i>
                      {loading ? 'Saving Settings...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="fas fa-lightbulb mr-2"></i>Tips
                    </h6>
                    <ul className="small">
                      <li>
                        <strong>Cashier Printer:</strong> For bills and
                        receipts
                      </li>
                      <li>
                        <strong>Kitchen Printer:</strong> For order tickets
                      </li>
                      <li>
                        <strong>Kiosk Printer:</strong> For self-service
                        stations
                      </li>
                      <li>
                        Check printer network configuration if test fails
                      </li>
                      <li>
                        Printers should be on the same network as the POS
                        system
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardComponent>
        </div>
      </Layout>
    </>
  );
}
