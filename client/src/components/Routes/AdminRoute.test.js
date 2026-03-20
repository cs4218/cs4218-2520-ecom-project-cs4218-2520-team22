import React from "react";
import { act, render, fireEvent, waitFor, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminRoute from "./AdminRoute";
import { AuthProvider, useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

const AdminPage = () => <div>Admin Content</div>;

describe("AdminRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // added the test case, Daniel Lai, A0192327A
  it("shows spinner when user is not authenticated", async () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/dashboard/admin']}>
        <Routes>
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(() => {
        getByText("Admin Content")
      }).toThrow()
      expect(getByText(/redirecting to you in/i)).toBeInTheDocument();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // added the test case, Daniel Lai, A0192327A
  it("shows spinner if user is logged in but not admin", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/dashboard/admin']}>
        <Routes>
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(() => {
        getByText("Admin Content")
      }).toThrow()
      expect(getByText(/redirecting to you in/i)).toBeInTheDocument();
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  // added the test case, Daniel Lai, A0192327As
  it("renders protected content when admin auth check passes", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/dashboard/admin']}>
        <Routes>
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText("Admin Content")).toBeInTheDocument();
      expect(() => {
        getByText(/redirecting to you in/i)
      }).toThrow();
    });
  });
});