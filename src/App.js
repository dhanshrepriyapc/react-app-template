import React, { useState, useEffect } from 'react';
import './App.css';
import Calendar from './components/Calendar';
import AppointmentForm from './components/AppointmentForm';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    // Fetch appointments for the selected date
    fetchAppointments(selectedDate);
  }, [selectedDate]);
  
  const fetchAppointments = async (date) => {
    try {
      // Format date as YYYY-MM-DD for API
      const formattedDate = date.toISOString().split('T')[0];
      // This will be replaced with actual API call
      // const response = await fetch(`/api/appointments?date=${formattedDate}`);
      // const data = await response.json();
      
      // For now, using mock data
      const mockData = [
        { id: 1, title: 'Meeting with Team', startTime: '09:00', endTime: '10:00' },
        { id: 2, title: 'Lunch with Client', startTime: '12:30', endTime: '13:30' },
        { id: 3, title: 'Project Review', startTime: '15:00', endTime: '16:00' }
      ];
      
      setAppointments(mockData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  const handlePreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  const handleAddAppointment = () => {
    setShowForm(true);
  };
  
  const handleFormClose = () => {
    setShowForm(false);
  };
  
  const handleFormSubmit = async (appointmentData) => {
    try {
      // This will be replaced with actual API call
      // const response = await fetch('/api/appointments', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...appointmentData,
      //     date: selectedDate.toISOString().split('T')[0]
      //   }),
      // });
      
      // if (response.status === 201) {
      //   fetchAppointments(selectedDate);
      //   setShowForm(false);
      // } else if (response.status === 409) {
      //   alert('There is a scheduling conflict. Please choose a different time.');
      // }
      
      // For now, just add to the list
      const newAppointment = {
        id: appointments.length + 1,
        ...appointmentData
      };
      
      setAppointments([...appointments, newAppointment]);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };
  
  const handleDeleteAppointment = async (id) => {
    try {
      // This will be replaced with actual API call
      // await fetch(`/api/appointments/${id}`, {
      //   method: 'DELETE',
      // });
      
      // For now, just filter the list
      setAppointments(appointments.filter(appointment => appointment.id !== id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Appointment Calendar</h1>
      </header>
      <main className="App-main">
        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={handlePreviousDay}>&lt;</button>
            <h2>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
            <button onClick={handleNextDay}>&gt;</button>
          </div>
          <Calendar 
            appointments={appointments} 
            onDelete={handleDeleteAppointment} 
          />
          <button className="add-appointment-button" onClick={handleAddAppointment}>+</button>
        </div>
        
        {showForm && (
          <AppointmentForm 
            onClose={handleFormClose} 
            onSubmit={handleFormSubmit} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
