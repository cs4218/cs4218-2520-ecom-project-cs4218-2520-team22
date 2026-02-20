import React from 'react';
import axios from 'axios';

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

describe('Auth Context Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});

