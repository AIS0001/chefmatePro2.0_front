import React, { useEffect, useState } from "react";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";

import { SubmitButton } from "../../components/Buttons/Textfield";

export default function MenuPermissions() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [menuSections, setMenuSections] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    fetchMenuStructure();
  }, []);

  // Fetch permissions when role is selected
  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}api/menu-permissions/roles`,
        {
          headers: getHeaders(),
        }
      );
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Error fetching user roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuStructure = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}api/menu-permissions/menu-structure`,
        {
          headers: getHeaders(),
        }
      );
      setMenuSections(response.data);
    } catch (error) {
      console.error("Error fetching menu structure:", error);
      toast.error("Error fetching menu structure");
    }
  };

  const fetchPermissions = async (roleId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}api/menu-permissions/permissions/${roleId}`,
        {
          headers: getHeaders(),
        }
      );
      
      // Convert array of permissions to object for easier handling
      const permissionsObj = {};
      response.data.forEach(permission => {
        permissionsObj[permission.menu_item_id] = permission.is_enabled;
      });
      setPermissions(permissionsObj);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Error fetching permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (menuItemId, isEnabled) => {
    setPermissions(prev => ({
      ...prev,
      [menuItemId]: isEnabled
    }));
  };

  const handleSectionToggle = (sectionItems, isEnabled) => {
    const updatedPermissions = { ...permissions };
    sectionItems.forEach(item => {
      updatedPermissions[item.id] = isEnabled;
    });
    setPermissions(updatedPermissions);
  };

  const savePermissions = async () => {
    if (!selectedRole) {
      toast.error("Please select a user role");
      return;
    }

    try {
      setSaving(true);
      await axios.put(
        `${process.env.REACT_APP_BASE_URL}api/menu-permissions/permissions/${selectedRole}`,
        { permissions },
        {
          headers: getHeaders(),
        }
      );
      toast.success("Menu permissions updated successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Error saving permissions");
    } finally {
      setSaving(false);
    }
  };

  const resetPermissions = () => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
      toast.info("Permissions reset to last saved state");
    }
  };

  return (
    <Layout>
      <div className="d-flex">
        <div className="w-100">
          <Header />
          <div className="px-4 py-3">
            <ToastContainer />
            
            <div className="row">
              <div className="col-12">
                <CardComponent
                  title="Menu Permissions Management"
                  icon="fa-key"
                  content={
                    <div>
                      {loading && (
                        <div className="text-center py-3">
                          <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* Role Selection */}
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <label htmlFor="roleSelect" className="form-label">
                            <strong>Select User Role:</strong>
                          </label>
                          <select
                            id="roleSelect"
                            className="form-control"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                          >
                            <option value="">-- Select Role --</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.role_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Menu Permissions Grid */}
                      {selectedRole && (
                        <div className="menu-permissions-container">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>
                              Menu Permissions for{" "}
                              {roles.find(r => r.id == selectedRole)?.role_name}
                            </h5>
                            <div>
                              <button
                                type="button"
                                className="btn btn-secondary me-2"
                                onClick={resetPermissions}
                              >
                                <i className="fas fa-undo"></i> Reset
                              </button>
                              <SubmitButton
                                loading={saving}
                                text="Save Permissions"
                                icon="fa-save"
                                onClick={savePermissions}
                              />
                            </div>
                          </div>

                          {menuSections.map((section) => {
                            const sectionPermissions = section.items.filter(
                              item => permissions[item.id] === true
                            );
                            const allEnabled = sectionPermissions.length === section.items.length;
                            const someEnabled = sectionPermissions.length > 0 && sectionPermissions.length < section.items.length;

                            return (
                              <div key={section.id} className="card mb-3">
                                <div className="card-header">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                      <input
                                        type="checkbox"
                                        className="form-check-input me-2"
                                        checked={allEnabled}
                                        ref={input => {
                                          if (input) input.indeterminate = someEnabled;
                                        }}
                                        onChange={(e) =>
                                          handleSectionToggle(section.items, e.target.checked)
                                        }
                                      />
                                      <i className={`fas ${section.icon_class} me-2`}></i>
                                      <strong>{section.section_name}</strong>
                                    </div>
                                    <small className="text-muted">
                                      {sectionPermissions.length}/{section.items.length} enabled
                                    </small>
                                  </div>
                                </div>
                                <div className="card-body">
                                  <div className="row">
                                    {section.items.map((item) => (
                                      <div key={item.id} className="col-md-6 col-lg-4 mb-2">
                                        <div className="form-check">
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`item-${item.id}`}
                                            checked={permissions[item.id] || false}
                                            onChange={(e) =>
                                              handlePermissionChange(item.id, e.target.checked)
                                            }
                                          />
                                          <label
                                            className="form-check-label"
                                            htmlFor={`item-${item.id}`}
                                          >
                                            <i className={`fas ${item.icon_class} me-1`}></i>
                                            {item.item_name}
                                          </label>
                                        </div>
                                        <small className="text-muted d-block ms-4">
                                          {item.route_path}
                                        </small>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Instructions */}
                      {!selectedRole && (
                        <div className="alert alert-info">
                          <h5>
                            <i className="fas fa-info-circle me-2"></i>
                            Menu Permissions Management
                          </h5>
                          <p className="mb-0">
                            Select a user role above to manage menu permissions. You can enable or disable 
                            specific menu items for different user roles (Admin, Cashier, etc.).
                          </p>
                          <ul className="mt-2 mb-0">
                            <li>Use section checkboxes to enable/disable all items in a section</li>
                            <li>Use individual checkboxes to control specific menu items</li>
                            <li>Changes are saved to the database when you click "Save Permissions"</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .menu-permissions-container {
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .card-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .form-check {
          padding-left: 1.5rem;
        }
        
        .form-check-input:indeterminate {
          background-color: #6c757d;
          border-color: #6c757d;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10h8'/%3e%3c/svg%3e");
        }
        
        .text-muted {
          font-size: 0.875em;
        }
        
        .card {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .alert {
          border: 1px solid transparent;
          border-radius: 0.375rem;
        }
      `}</style>
    </Layout>
  );
}
