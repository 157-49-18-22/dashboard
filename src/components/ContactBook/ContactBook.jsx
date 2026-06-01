import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Search, Phone } from "lucide-react";
import "./ContactBook.css";

const ContactBook = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/contacts");
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
        setFilteredContacts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    const lowered = search.toLowerCase();
    const filtered = contacts.filter(c => 
      c.name.toLowerCase().includes(lowered) || String(c.mobileNo).includes(lowered)
    );
    setFilteredContacts(filtered);
  }, [search, contacts]);

  const openModalForAdd = () => {
    setEditingContact(null);
    setNewName("");
    setNewMobile("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openModalForEdit = (contact) => {
    setEditingContact(contact);
    setNewName(contact.name);
    setNewMobile(contact.mobileNo);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleSyncExcel = async () => {
    if (!window.confirm("This will read the 'PARENT MOBILE NO.xlsx' file from public folder and import new contacts. Continue?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch("http://localhost:5000/api/contacts/import", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchContacts();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(data.error || "Failed to sync excel");
      }
    } catch (err) {
      setError("Server error during sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newMobile) {
      setError("Please fill in both fields");
      return;
    }
    
    try {
      if (editingContact) {
        // Handle Edit
        const res = await fetch(`http://localhost:5000/api/contacts/${editingContact.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, mobileNo: newMobile })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess("Contact updated successfully!");
          fetchContacts();
          setTimeout(() => closeModal(), 1000);
        } else {
          setError(data.error || "Failed to update contact");
        }
      } else {
        // Handle Add
        const res = await fetch("http://localhost:5000/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, mobileNo: newMobile })
        });
        const data = await res.json();
        if (data.success) {
          setSuccess("Contact added successfully!");
          fetchContacts();
          setTimeout(() => closeModal(), 1000);
        } else {
          setError(data.error || "Failed to add contact");
        }
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/contacts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchContacts();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="contact-book-container fade-in">
      <div className="contact-book-header">
        <div className="header-text">
          <h2>Contact Directory</h2>
          <p>Manage customer contacts. Names here seamlessly integrate and override default WhatsApp numbers.</p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={handleSyncExcel} disabled={isSyncing}>
            {isSyncing ? "Syncing..." : "Sync from Excel"}
          </button>
          <button className="add-contact-btn" onClick={openModalForAdd}>
            <Plus size={18} />
            <span>Add New Contact</span>
          </button>
        </div>
      </div>

      <div className="contact-list-card">
        <div className="card-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="contact-count">
            Total Valid Contacts: <strong>{filteredContacts.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="contact-loading">
            <div className="spin-loader"></div>
            <p>Loading directory...</p>
          </div>
        ) : (
          <div className="contact-table-wrapper">
            <table className="stylish-table">
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <th>Mobile Number</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-state">
                      <Phone size={32} />
                      <p>No contacts found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map(c => (
                    <tr key={c.id}>
                      <td className="name-cell">
                        <div className="avatar-initial">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="contact-name">{c.name}</span>
                      </td>
                      <td className="mobile-cell">{c.mobileNo}</td>
                      <td className="actions-cell">
                        <button className="action-btn edit-btn" title="Edit Contact" onClick={() => openModalForEdit(c)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn del-btn" title="Delete Contact" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingContact ? "Edit Contact" : "Add New Contact"}</h3>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="toast-msg toast-error">{error}</div>}
              {success && <div className="toast-msg toast-success">{success}</div>}
              <form onSubmit={handleFormSubmit} className="contact-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9876543210" 
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                  />
                  <small>Enter number exactly as it appears in Excel (without country code)</small>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editingContact ? "Update Contact" : "Save Contact"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactBook;
