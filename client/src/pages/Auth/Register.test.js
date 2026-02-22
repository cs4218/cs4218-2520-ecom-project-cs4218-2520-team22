import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

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

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { category: [] } });
  });

  // added the test case, Daniel Lai, A0192327A
  it('should render the registration form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('REGISTRATION FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toHaveAttribute('type', 'email');
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toHaveAttribute('type', 'password');
    expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your DOB')).toHaveAttribute('type', 'date');
    expect(getByPlaceholderText('What is Your Favorite Sports?')).toBeInTheDocument();
    expect(getByText('REGISTER')).toBeInTheDocument();
    expect(getByText('REGISTER')).toHaveAttribute('type', 'submit');
  });

  // added the test case, Daniel Lai, A0192327A
  it('inputs should be initially empty', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Enter Your Name')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your Email')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your Password')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your Phone')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your Address')).toHaveValue('');
    expect(getByPlaceholderText('Enter Your DOB')).toHaveValue('');
    expect(getByPlaceholderText('What is Your Favorite Sports?')).toHaveValue('');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without name', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without email', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without password', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without phone', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without address', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without DOB', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should not allow submitting without security answer', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });

    fireEvent.click(getByText('REGISTER')); // Act

    expect(axios.post).not.toHaveBeenCalled();
  });

  // added the test case, Daniel Lai, A0192327A
  it('should allow typing the various form fields', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText(
      'What is Your Favorite Sports?'),
      { target: { value: 'Football' } });

    expect(getByPlaceholderText('Enter Your Name')).toHaveValue('John Doe');
    expect(getByPlaceholderText('Enter Your Email')).toHaveValue('test@example.com');
    expect(getByPlaceholderText('Enter Your Password')).toHaveValue('password123');
    expect(getByPlaceholderText('Enter Your Phone')).toHaveValue('1234567890');
    expect(getByPlaceholderText('Enter Your Address')).toHaveValue('123 Street');
    expect(getByPlaceholderText('Enter Your DOB')).toHaveValue('2000-01-01');
    expect(getByPlaceholderText('What is Your Favorite Sports?'))
      .toHaveValue('Football');
  });

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Registered Successfully, please login');
    expect(mockedUseNavigate).toHaveBeenCalledWith("/login");
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: 'Error in Registration'
      }
    });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Error in Registration');
  });

  // added the test case, Daniel Lai, A0192327A
  it('should display error message on axios error', async () => {
    const error = new Error('Request failed with status code 500');
    error.response = {
      status: 500,
      statusText: 'Internal Server Error',
      data: { message: 'Server error' }
    };
    axios.post.mockResolvedValueOnce(error);
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite Sports?'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER')); // Act

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(console.log).toHaveBeenCalled();
  });
});
