import React from "react";

function Modal({ showModal, setShowModal, editingAppointment, handleAddOrEdit, handleDelete }) {
  if (!showModal) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{editingAppointment ? "Edit Appointment" : "New Appointment"}</h3>
        <form onSubmit={handleAddOrEdit}>
          <input
            type="text"
            name="name"
            placeholder="Title"
            defaultValue={editingAppointment?.title || ""}
            required
          />

          {/* Start and End time inputs */}
          {["start", "end"].map((timeType) => (
            <div className="time-row" key={timeType}>
              <input
                type="time"
                name={timeType}
                step="1800"
                defaultValue={
                  editingAppointment
                    ? new Date(editingAppointment[timeType]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                    : ""
                }
                required
              />
              <select name={`${timeType}Period`} defaultValue="AM">
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
          ))}

          <div className="modal-actions">
            {editingAppointment && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            )}
            <button type="button" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit">{editingAppointment ? "Update" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal;
