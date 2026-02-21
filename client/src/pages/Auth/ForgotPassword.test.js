import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import ForgotPassword from './ForgotPassword';

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

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
}));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should render the forgot password form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('RESET PASSWORD')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toHaveAttribute('type', 'email');
    expect(getByPlaceholderText('Enter Your Favorite Sports')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your New Password')).toHaveAttribute('type', 'password');
    expect(getByText('RESET')).toBeInTheDocument();
    expect(getByText('RESET')).toHaveAttribute('type', 'submit');
    expect(getByText('Back to Login')).toBeInTheDocument();
    expect(getByText('Back to Login')).toHaveAttribute('type', 'button');
  });

  // added the test case, Daniel Lai, A0192327A
  it('inputs should be initially empty', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Enter Your Email')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your Favorite Sports')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your New Password')).toHaveValue('');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without email', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(getByText('RESET'));

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without security answer', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(getByText('RESET'));

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without new password', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('RESET'));

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should allow typing the various form fields', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    expect(getByPlaceholderText('Enter Your Email')).toHaveValue('test@example.com');
    expect(getByPlaceholderText('Enter Your Favorite Sports')).toHaveValue('Football');
    expect(getByPlaceholderText('Enter Your New Password')).toHaveValue('newpassword123');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should navigate back to login when clicking back button', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(getByText('Back to Login'));

    expect(mockedUseNavigate).toHaveBeenCalledWith('/login');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should reset password successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(getByText('RESET')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Password Reset Successfully', {
      duration: 5000,
      icon: '🔑',
      style: {
        background: 'green',
        color: 'white'
      }
    });
    expect(mockedUseNavigate).toHaveBeenCalledWith('/login');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should display error message on failed password reset', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Wrong Email Or Answer"
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(getByText('RESET')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Wrong Email Or Answer");
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
    jest.spyOn(console, 'log').mockImplementation(() => { });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Favorite Sports'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });

    fireEvent.click(getByText('RESET')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(console.log).toHaveBeenCalledWith(error);
  });

});