import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './auth';

jest.mock('axios');

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

const TestComponent = () => {
  const [auth, setAuth] = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user?.name || 'No User'}</span>
      <span data-testid="token">{auth.token || 'No Token'}</span>
      <button
        data-testid="clear-auth"
        onClick={() => setAuth({ user: null, token: "" })}
      >
        Clear Auth
      </button>
    </div>
  );
};

describe('Auth Context Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  

  it('auth and headers should not be set if localStorage is empty', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent></TestComponent>
      </AuthProvider>
    );

    expect(getByTestId('user')).toHaveTextContent('No User');
    expect(getByTestId('token')).toHaveTextContent('No Token');
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it('auth and headers should be set if localStorage has valid data', () => {
    const mockAuthData = {
      user: { name: "Test User" },
      token: "test-token"
    };
    localStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent></TestComponent>
      </AuthProvider>
    );

    expect(getByTestId('user')).toHaveTextContent('Test User');
    expect(getByTestId('token')).toHaveTextContent('test-token');
    expect(axios.defaults.headers.common["Authorization"]).toBe("test-token");
  });

  it('auth and headers should not be set if localStorage has null data', () => {
    localStorage.getItem.mockReturnValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent></TestComponent>
      </AuthProvider>
    );

    expect(getByTestId('user')).toHaveTextContent('No User');
    expect(getByTestId('token')).toHaveTextContent('No Token');
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it('auth and headers should not be set if localStorage has undefined data', () => {
    localStorage.getItem.mockReturnValue(undefined);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent></TestComponent>
      </AuthProvider>
    );

    expect(getByTestId('user')).toHaveTextContent('No User');
    expect(getByTestId('token')).toHaveTextContent('No Token');
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  it('auth and headers should not be set or throw uncaught errors if localStorage has invalid data', () => {
    localStorage.getItem.mockReturnValue("invalid-json");
    jest.spyOn(console, 'log').mockImplementation(() => { });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent></TestComponent>
      </AuthProvider>
    );

    expect(getByTestId('user')).toHaveTextContent('No User');
    expect(getByTestId('token')).toHaveTextContent('No Token');
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
    expect(console.log).toHaveBeenCalled();
  });
});
