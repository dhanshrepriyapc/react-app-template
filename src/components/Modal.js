import React from "react";

// helper to extract "hh:mm" (12-hour) from ISO timestamp
const isoTo12HourTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}`;
};

const derivePeriod = (iso) => {
  if (!iso) return "AM";
  const h = new Date(iso).getHours();
  return h >= 12 ? "PM" : "AM";
};

function Modal({
  showModal,
  setShowModal,
  editingAppointment,
  newSlotTime,
  handleAddOrEdit,
  handleDelete,
}) {
  if (!showModal) return null;

  const isEdit = !!editingAppointment;
  const startIso = isEdit
    ? editingAppointment.startTime
    : newSlotTime?.toISOString();
  const endIso = isEdit
    ? editingAppointment.endTime
    : newSlotTime
    ? new Date(newSlotTime.getTime() + 30 * 60000).toISOString()
    : null;

  return (
    <div className="modal">
      <div className="modal-content" role="dialog" aria-modal="true">
        <h3>{isEdit ? "Edit Appointment" : "New Appointment"}</h3>
        <form onSubmit={handleAddOrEdit}>
          <input
            type="text"
            name="name"
            placeholder="Title"
            defaultValue={isEdit ? editingAppointment?.title : ""}
            required
          />

          {/* Start and End time inputs */}
          {["start", "end"].map((timeType) => {
            const isoField = timeType === "start" ? startIso : endIso;
            const timeValue = isoTo12HourTime(isoField);
            const periodValue = derivePeriod(isoField);

            return (
              <div className="time-row" key={timeType}>
                <input
                  type="time"
                  name={timeType}
                  step="1800"
                  defaultValue={timeValue}
                  required
                />
                <select name={`${timeType}Period`} defaultValue={periodValue}>
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            );
          })}

          <div className="modal-actions">
            {isEdit && (
              <button
                type="button"
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button type="button" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit">{isEdit ? "Update" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal;
