import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import AdminRoute from "./AdminRoute";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

describe("AdminRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows spinner when user is not authenticated", () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(() => {
      getByText("Admin Content")
    }).toThrow();
    expect(getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("shows spinnner if user is logged in but not admin", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(() => {
      getByText("Admin Content")
    }).toThrow();
    expect(getByText(/redirecting to you in/i)).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
  });


  it("renders protected content when admin auth check passes", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(getByText("Admin Content")).toBeInTheDocument();
    });
  });
});