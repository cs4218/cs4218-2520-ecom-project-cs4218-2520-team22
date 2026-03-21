// Song Yichao, A0255686M

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Private from "../components/Routes/Private";
import { AuthProvider } from "../context/auth";

jest.mock("axios");

// lightweight spinner mock so we can detect it
jest.mock("../components/Spinner", () => {
  return function SpinnerMock() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

describe("PrivateRoute integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // Song Yichao, A0255686M
  it("allows access to protected route when token exists and backend returns ok", async () => {
    // seed auth in localStorage
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: { name: "Song" },
      })
    );

    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/dashboard" element={<Private />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // wait for auth check
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    expect(await screen.findByText("Protected Content")).toBeInTheDocument();
  });

  // Song Yichao, A0255686M
  it("blocks access when backend auth check fails", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: { name: "Song" },
      })
    );

    axios.get.mockRejectedValueOnce(new Error("Auth failed"));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/dashboard" element={<Private />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    // should NOT see protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // should show spinner (fallback)
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  // Song Yichao, A0255686M
  it("does not call backend when token is missing and blocks access", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/dashboard" element={<Private />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // axios should not be called
    expect(axios.get).not.toHaveBeenCalled();

    // no protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // fallback UI
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });
});
