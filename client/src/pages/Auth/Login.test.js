import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../hooks/useCategory');

// copied from https://stackoverflow.com/questions/66284286/react-jest-mock-usenavigate
const mockedUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUseNavigate,
}));

// Create a persistent mock for setAuth that can be accessed in tests
const mockedSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, mockedSetAuth]) // Mock useAuth hook to return null state and the persistent mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
  };
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // edited the test case, Daniel Lai, A0192327A
  it('renders login form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    // Fields
    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toHaveAttribute('type', 'email');
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');

    // Buttons
    expect(getByText('Forgot Password')).toBeInTheDocument();
    expect(getByText('Forgot Password')).toHaveAttribute('type', 'button');
    expect(getByText('LOGIN')).toBeInTheDocument();
    expect(getByText('LOGIN')).toHaveAttribute('type', 'submit');
  });

  it('inputs should be initially empty', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without email', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(getByText('LOGIN'));

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without password', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });

    fireEvent.click(getByText('LOGIN')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should allow typing email and password', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
  });

  // added the test case, Daniel Lai, A0192327A
  // end-to-end testing reveals missing component (forgot password page)
  // can't make the test fail due to simulate useNavigate though
  // the problem is at App.js together with a missing page component
  it('should navigate to forgot password page on clicking link', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<div>Mock Forgot Password Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(getByText('Forgot Password'));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  // edited the test case, Daniel Lai, A0192327A
  it('should login the user successfully and stay on same page if no relevant previous pages', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    fireEvent.click(getByText('LOGIN')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });
    expect(mockedSetAuth).toHaveBeenCalledWith({
      user: { id: 1, name: 'John Doe', email: 'test@example.com' },
      token: 'mockToken'
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'auth',
      JSON.stringify({
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      })
    );
    expect(mockedUseNavigate).toHaveBeenCalledWith("/")
  });

  // added the test case, Daniel Lai, A0192327A
  it('on successful login, should navigate to previous page if present', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={[
        {
          pathname: '/login',
          state: '/cart'
        }
      ]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<div>Mock Cart Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    fireEvent.click(getByText('LOGIN')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(undefined, {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white'
      }
    });
    expect(mockedSetAuth).toHaveBeenCalledWith({
      user: { id: 1, name: 'John Doe', email: 'test@example.com' },
      token: 'mockToken'
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'auth',
      JSON.stringify({
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken'
      })
    );
    expect(mockedUseNavigate).toHaveBeenCalledWith("/cart")
  });

  it('should display error message on invalid email or password', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Invalid email or password'
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    fireEvent.click(getByText('LOGIN')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should display error message on axios error', async () => {
    const error = new Error('Request failed with status code 500');
    error.response = {
      status: 500,
      statusText: 'Internal Server Error',
      data: { message: 'Server error' }
    };
    axios.post.mockRejectedValueOnce(error);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    fireEvent.click(getByText('LOGIN')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(console.log).toHaveBeenCalled();
  });
});
