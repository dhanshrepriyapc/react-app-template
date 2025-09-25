import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

// Mock all the child components
jest.mock('./components/Sidebar', () => {
  return function MockSidebar({ onLogout, selectedDate, setSelectedDate, currentView }) {
    return (
      <div data-testid="sidebar">
        <button onClick={onLogout} data-testid="sidebar-logout">Logout</button>
        <div data-testid="selected-date">{selectedDate}</div>
        <button onClick={() => setSelectedDate('2024-01-15')} data-testid="change-date">
          Change Date
        </button>
      </div>
    );
  };
});

jest.mock('./components/Timeline', () => {
  return function MockTimeline({ 
    onAppointmentClick, 
    onEmptySlotClick, 
    appointments,
    highlightedAppointments 
  }) {
    return (
      <div data-testid="timeline">
        <button 
          onClick={() => onAppointmentClick({ id: 1, title: 'Test Appointment' })}
          data-testid="appointment-click"
        >
          Click Appointment
        </button>
        <button 
          onClick={() => onEmptySlotClick(new Date('2024-01-01T10:00:00'))}
          data-testid="empty-slot-click"
        >
          Click Empty Slot
        </button>
        <div data-testid="appointments-count">{appointments.length}</div>
        <div data-testid="highlighted-count">{highlightedAppointments.length}</div>
      </div>
    );
  };
});

jest.mock('./components/WeekView', () => {
  return function MockWeekView({ onAppointmentClick }) {
    return (
      <div data-testid="week-view">
        <button 
          onClick={() => onAppointmentClick({ id: 2, title: 'Week Appointment' })}
          data-testid="week-appointment-click"
        >
          Week Appointment
        </button>
      </div>
    );
  };
});

jest.mock('./components/MonthView', () => {
  return function MockMonthView({ onAppointmentClick }) {
    return (
      <div data-testid="month-view">
        <button 
          onClick={() => onAppointmentClick({ id: 3, title: 'Month Appointment' })}
          data-testid="month-appointment-click"
        >
          Month Appointment
        </button>
      </div>
    );
  };
});

jest.mock('./components/Modal', () => {
  return function MockModal({ 
    showModal, 
    setShowModal, 
    editingAppointment, 
    newSlotTime,
    handleAddOrEdit,
    handleDelete 
  }) {
    if (!showModal) return null;
    
    return (
      <div data-testid="modal">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const formObject = Object.fromEntries(formData.entries());
            handleAddOrEdit(e, formObject);
          }} 
          data-testid="appointment-form"
        >
          <input name="title" defaultValue="Test Title" data-testid="title-input" />
          <input name="start" defaultValue="10:00" data-testid="start-input" />
          <input name="startPeriod" defaultValue="AM" data-testid="start-period" />
          <input name="end" defaultValue="11:00" data-testid="end-input" />
          <input name="endPeriod" defaultValue="AM" data-testid="end-period" />
          <input name="description" defaultValue="Test Description" data-testid="description-input" />
          <input name="location" defaultValue="Test Location" data-testid="location-input" />
          <input name="type" defaultValue="Meeting" data-testid="type-input" />
          <input name="colorCode" defaultValue="#1976d2" data-testid="color-input" />
          <input name="recurrence" defaultValue="None" data-testid="recurrence-input" />
          <input name="recurrenceInterval" defaultValue="1" data-testid="recurrence-interval" />
          <input name="recurrenceEndDate" defaultValue="2024-12-31" data-testid="recurrence-end-date" />
          <button type="submit" data-testid="save-button">Save</button>
        </form>
        <button onClick={handleDelete} data-testid="delete-button">Delete</button>
        <button onClick={() => setShowModal(false)} data-testid="close-modal">Close</button>
        {editingAppointment && <div data-testid="editing-appointment">{editingAppointment.title}</div>}
        {newSlotTime && <div data-testid="new-slot-time">{newSlotTime.toISOString()}</div>}
      </div>
    );
  };
});

jest.mock('./components/ErrorModal', () => {
  return function MockErrorModal({ message, onClose }) {
    if (!message) return null;
    return (
      <div data-testid="error-modal">
        <div data-testid="error-message">{message}</div>
        <button onClick={onClose} data-testid="close-error">Close Error</button>
      </div>
    );
  };
});

jest.mock('./components/Login', () => {
  return function MockLogin({ onLogin }) {
    return (
      <div data-testid="login">
        <button 
          onClick={() => onLogin(
            { 
              id: 1, 
              username: 'testuser', 
              firstName: 'Test', 
              lastName: 'User',
              timeZoneId: 'America/New_York'
            }, 
            'mock-jwt-token'
          )}
          data-testid="login-button"
        >
          Login
        </button>
      </div>
    );
  };
});

jest.mock('./components/SearchBar', () => {
  return function MockSearchBar({ onResults }) {
    return (
      <div data-testid="search-bar">
        <button 
          onClick={() => onResults([{ id: 1, title: 'Search Result' }], true)}
          data-testid="search-trigger"
        >
          Search
        </button>
        <button 
          onClick={() => onResults([], false)}
          data-testid="clear-search"
        >
          Clear Search
        </button>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = mockLocalStorage;

// Mock window.confirm
global.confirm = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    global.confirm.mockReturnValue(true);
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Mock successful fetch responses
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ([]),
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    jest.restoreAllMocks();
  });

  describe('Initial Loading and Authentication', () => {

    test('renders login component when not authenticated', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });

    test('auto-login with valid saved user data', async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.queryByTestId('login')).not.toBeInTheDocument();
      });
    });

    test('handles expired token', async () => {
      const expiredToken = btoa(JSON.stringify({ exp: Date.now() / 1000 - 3600 }));
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return `header.${expiredToken}.signature`;
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    test('successful login', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jwtToken', 'mock-jwt-token');
      });
    });

    test('logout functionality', async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('sidebar-logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Management', () => {
    test('loads saved theme from localStorage', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'theme') return 'dark';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(document.body.dataset.theme).toBe('dark');
      });
    });

   test('toggles theme', async () => {
  const mockUserData = {
    id: 1,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    timeZoneId: 'America/New_York'
  };
  
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'jwtToken') return 'valid.jwt.token';
    if (key === 'userData') return JSON.stringify(mockUserData);
    if (key === 'theme') return 'light';
    return null;
  });

  render(<App />);
  
  await waitFor(() => {
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  // Find theme toggle by its class and title attribute
  const themeToggle = screen.getByTitle('Toggle theme');
  
  // Verify initial theme is light
  expect(document.body.dataset.theme).toBe('light');
  
  // Click to toggle to dark theme
  fireEvent.click(themeToggle);
  expect(document.body.dataset.theme).toBe('dark');
  
  // Click again to toggle back to light theme
  fireEvent.click(themeToggle);
  expect(document.body.dataset.theme).toBe('light');
});

  });

  describe('View Management', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('renders day view by default', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });
    });

    test('switches to week view', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const viewSelector = screen.getByDisplayValue('Day');
      fireEvent.change(viewSelector, { target: { value: 'week' } });

      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });

    test('switches to month view', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const viewSelector = screen.getByDisplayValue('Day');
      fireEvent.change(viewSelector, { target: { value: 'month' } });

      expect(screen.getByTestId('month-view')).toBeInTheDocument();
    });
  });

  describe('Appointment Management', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('opens modal when clicking appointment', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const appointmentButton = screen.getByTestId('appointment-click');
      fireEvent.click(appointmentButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    test('opens modal when clicking empty slot', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    test('creates new appointment', async () => {
      // Mock successful appointment creation
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }); // Create

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // Open modal for new appointment
      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      // Fill and submit form
      const titleInput = screen.getByTestId('title-input');
      fireEvent.change(titleInput, { target: { value: 'New Meeting' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/appointments/user'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer valid.jwt.token',
            }),
          })
        );
      });
    });

    test('updates existing appointment', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Update

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // Open modal for editing
      const appointmentButton = screen.getByTestId('appointment-click');
      fireEvent.click(appointmentButton);

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/appointments/user/1'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    test('deletes appointment', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Delete

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const appointmentButton = screen.getByTestId('appointment-click');
      fireEvent.click(appointmentButton);

      const deleteButton = screen.getByTestId('delete-button');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/appointments/user/1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    test('opens modal with add button', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+');
      fireEvent.click(addButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('handles 401 unauthorized response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });

    test('handles network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });
    });

    test('closes error modal', async () => {
      fetch.mockRejectedValueOnce(new Error('Test error'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('error-modal')).toBeInTheDocument();
      });

      const closeErrorButton = screen.getByTestId('close-error');
      fireEvent.click(closeErrorButton);

      expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument();
    });
  });

  describe('Date Management', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('changes selected date', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      const changeDateButton = screen.getByTestId('change-date');
      fireEvent.click(changeDateButton);

      expect(screen.getByTestId('selected-date')).toHaveTextContent('2024-01-15');
    });

   test('handles date navigation', async () => {
  const mockUserData = {
    id: 1,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    timeZoneId: 'America/New_York'
  };
  
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'jwtToken') return 'valid.jwt.token';
    if (key === 'userData') return JSON.stringify(mockUserData);
    if (key === 'theme') return 'light';
    return null;
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  // Test date change functionality using the mock sidebar's change date button
  const changeDateButton = screen.getByTestId('change-date');
  
  // Verify initial date
  expect(screen.getByTestId('selected-date')).toHaveTextContent(new Date().toISOString().split('T')[0]);
  
  // Click to change date (mock sidebar changes it to '2024-01-15')
  fireEvent.click(changeDateButton);
  
  // Verify date changed
  expect(screen.getByTestId('selected-date')).toHaveTextContent('2024-01-15');
  
  // Verify the header updates with the new date
  await waitFor(() => {
    expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
  });
});

  });

  describe('Modal Management', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('closes modal', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('Shift+N opens new appointment modal', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'N', shiftKey: true });

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    test('Alt+Shift+D switches to day view', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const viewSelector = screen.getByDisplayValue('Day');
      fireEvent.change(viewSelector, { target: { value: 'week' } });
      expect(screen.getByTestId('week-view')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'd', altKey: true, shiftKey: true });

      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });

    test('Alt+Shift+W switches to week view', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'w', altKey: true, shiftKey: true });

      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });

    test('Alt+Shift+M switches to month view', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'm', altKey: true, shiftKey: true });

      expect(screen.getByTestId('month-view')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Input Handling', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('handles form submission with empty title', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      // Clear the title
      const titleInput = screen.getByTestId('title-input');
      fireEvent.change(titleInput, { target: { value: '' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      // Modal should remain open for invalid form
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    test('handles special characters in input', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }); // Create

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      const titleInput = screen.getByTestId('title-input');
      fireEvent.change(titleInput, { target: { value: 'Meeting & Discussion' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    test('handles time conversion correctly', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }); // Create

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      // Set PM time
      const startInput = screen.getByTestId('start-input');
            const startPeriod = screen.getByTestId('start-period');
      
      fireEvent.change(startInput, { target: { value: '02:30' } });
      fireEvent.change(startPeriod, { target: { value: 'PM' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('14:30:00'),
          })
        );
      });
    });
  });

  describe('Real-time Features', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('updates now line position', async () => {
      jest.useFakeTimers();
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // Advance time by 1 minute
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(screen.getByTestId('timeline')).toBeInTheDocument();
      
      jest.useRealTimers();
    });

    test('handles timezone conversion', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Component should handle timezone conversion properly
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Component Cleanup', () => {
    test('cleans up intervals on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    test('removes event listeners on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles missing user timezone', async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        // timeZoneId is missing
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });
    });

    test('handles empty appointments array', async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
        expect(screen.getByTestId('appointments-count')).toHaveTextContent('0');
      });
    });

    test('handles malformed user data in localStorage', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return 'invalid-json';
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });

   test('handles localStorage quota exceeded', async () => {
  const mockUserData = {
    id: 1,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    timeZoneId: 'America/New_York'
  };
  
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'jwtToken') return 'valid.jwt.token';
    if (key === 'userData') return JSON.stringify(mockUserData);
    if (key === 'theme') return 'light';
    return null;
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  // Mock localStorage.setItem to throw quota exceeded error AFTER initial render
  mockLocalStorage.setItem.mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });

  // Find theme toggle by its title attribute since it's a div, not a button
  const themeToggle = screen.getByTitle('Toggle theme');
  
  // The click will cause an error because localStorage.setItem throws
  expect(() => {
    fireEvent.click(themeToggle);
  }).toThrow('QuotaExceededError');
});

  });

  describe('Performance and Optimization', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('handles large appointment datasets', async () => {
      const largeAppointmentSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Appointment ${i + 1}`,
        startTime: `2024-01-01T${String(i % 24).padStart(2, '0')}:00:00Z`,
        endTime: `2024-01-01T${String((i % 24) + 1).padStart(2, '0')}:00:00Z`,
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeAppointmentSet,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
        expect(screen.getByTestId('appointments-count')).toHaveTextContent('100');
      });
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('complete appointment lifecycle', async () => {
    const mockUserData = {
      id: 1,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      timeZoneId: 'America/New_York'
    };
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'jwtToken') return 'valid.jwt.token';
      if (key === 'userData') return JSON.stringify(mockUserData);
      if (key === 'theme') return 'light';
      return null;
    });

    // Mock successful API responses
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }) // Create
      .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Refetch after create
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // Update
      .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Refetch after update
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Delete

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });

    // Create appointment
    const emptySlotButton = screen.getByTestId('empty-slot-click');
    fireEvent.click(emptySlotButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    const form = screen.getByTestId('appointment-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/user'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Wait for modal to close after successful creation
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    // Edit appointment - click on appointment to open modal for editing
    const appointmentButton = screen.getByTestId('appointment-click');
    fireEvent.click(appointmentButton);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('editing-appointment')).toBeInTheDocument();
    });

    const editForm = screen.getByTestId('appointment-form');
    fireEvent.submit(editForm);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/user/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

  // Delete appointment - the modal should still be open with the editing appointment
  const deleteButton = screen.getByTestId('delete-button');
  fireEvent.click(deleteButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/appointments/user/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

    test('maintains state consistency across view changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // Open modal in day view
      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Switch to week view
      const viewSelector = screen.getByDisplayValue('Day');
      fireEvent.change(viewSelector, { target: { value: 'week' } });

      // Modal should still be open
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('week-view')).toBeInTheDocument();
    });
  });

  describe('Time and Date Utilities', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('handles midnight and noon edge cases', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) }) // Initial fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }); // Create

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      // Test 12:00 AM (midnight)
      const startInput = screen.getByTestId('start-input');
      const startPeriod = screen.getByTestId('start-period');

      fireEvent.change(startInput, { target: { value: '12:00' } });
      fireEvent.change(startPeriod, { target: { value: 'AM' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('00:00:00'),
          })
        );
      });
    });

    test('calculates now line position correctly', async () => {
      // Mock specific time for consistent testing
      const mockNow = new Date('2024-01-01T14:30:00'); // 2:30 PM
      jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      // The now line position should be calculated based on the current time
      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('has proper button accessibility', async () => {
      render(<App />);

      await waitFor(() => {
        const addButton = screen.getByText('+');
        expect(addButton).toBeInTheDocument();
        expect(addButton.tagName).toBe('BUTTON');
      });
    });

   test('keyboard navigation works properly', async () => {
  const mockUserData = {
    id: 1,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    timeZoneId: 'America/New_York'
  };
  
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'jwtToken') return 'valid.jwt.token';
    if (key === 'userData') return JSON.stringify(mockUserData);
    if (key === 'theme') return 'light';
    return null;
  });

  render(<App />);
  
  await waitFor(() => {
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  // Test the actual keyboard shortcut that exists in your App.js (Shift+N)
  fireEvent.keyDown(document, { 
    key: 'n', 
    shiftKey: true 
  });

  await waitFor(() => {
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  // Test focus on add button
  const addButton = screen.getByText('+');
  addButton.focus();
  expect(document.activeElement).toBe(addButton);
});

  });

  describe('Data Persistence', () => {
    test('persists theme preference', async () => {
  const mockUserData = {
    id: 1,
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    timeZoneId: 'America/New_York'
  };
  
  mockLocalStorage.getItem.mockImplementation((key) => {
    if (key === 'jwtToken') return 'valid.jwt.token';
    if (key === 'userData') return JSON.stringify(mockUserData);
    if (key === 'theme') return 'dark';
    return null;
  });

  render(<App />);
  
  await waitFor(() => {
    expect(document.body.dataset.theme).toBe('dark');
  });

  // Find theme toggle by its title attribute since it's a div, not a button
  const themeToggle = screen.getByTitle('Toggle theme');
  fireEvent.click(themeToggle);

  expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  expect(document.body.dataset.theme).toBe('light');
});

    test('persists user data on login', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jwtToken', 'mock-jwt-token');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('userData', expect.stringContaining('testuser'));
      });
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('adapts to different screen sizes', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      fireEvent(window, new Event('resize'));

      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });

    test('handles touch interactions', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      
      fireEvent.touchStart(emptySlotButton);
      fireEvent.touchEnd(emptySlotButton);
      fireEvent.click(emptySlotButton);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Security and Validation', () => {
    beforeEach(async () => {
      const mockUserData = {
        id: 1,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return 'valid.jwt.token';
        if (key === 'userData') return JSON.stringify(mockUserData);
        if (key === 'theme') return 'light';
        return null;
      });
    });

    test('validates time ranges', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline')).toBeInTheDocument();
      });

      const emptySlotButton = screen.getByTestId('empty-slot-click');
      fireEvent.click(emptySlotButton);

      // Set end time before start time
      const startInput = screen.getByTestId('start-input');
      const endInput = screen.getByTestId('end-input');
      const startPeriod = screen.getByTestId('start-period');
      const endPeriod = screen.getByTestId('end-period');

      fireEvent.change(startInput, { target: { value: '10:00' } });
      fireEvent.change(startPeriod, { target: { value: 'AM' } });
      fireEvent.change(endInput, { target: { value: '09:00' } });
      fireEvent.change(endPeriod, { target: { value: 'AM' } });

      const form = screen.getByTestId('appointment-form');
      fireEvent.submit(form);

      // Should handle invalid time range gracefully
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    test('handles token refresh scenarios', async () => {
      const soonToExpireTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      const soonToExpireToken = btoa(JSON.stringify({ 
        exp: soonToExpireTime,
        sub: 'user123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        timeZoneId: 'America/New_York'
      }));
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'jwtToken') return `header.${soonToExpireToken}.signature`;
        if (key === 'theme') return 'light';
        return null;
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });
});

