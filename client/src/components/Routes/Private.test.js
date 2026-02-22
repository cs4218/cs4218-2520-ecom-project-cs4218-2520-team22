// Song Yichao, A0255686M

import React from "react";
import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import PrivateRoute from "./Private";
import { renderWithOutlet } from "../../__tests__/testUtils";

// Mock axios
jest.mock("axios");

// Mock Spinner for stable assertions
jest.mock("../Spinner", () => {
  return function SpinnerMock() {
    return <div data-testid="spinner">spinner</div>;
  };
});

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // add test case, Song Yichao, A0255686M
  it("renders Spinner and does not call authCheck when token is missing", async () => {
    mockUseAuth.mockReturnValue([{ token: null }, jest.fn()]);

    renderWithOutlet(<PrivateRoute />, <div data-testid="protected">protected</div>);

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  // add test case, Song Yichao, A0255686M
  it("renders Outlet when token exists and /user-auth returns ok=true", async () => {
    mockUseAuth.mockReturnValue([{ token: "mockToken" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    renderWithOutlet(<PrivateRoute />, <div data-testid="protected">protected</div>);

    expect(await screen.findByTestId("protected")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
  });

  // add test case, Song Yichao, A0255686M
  it("renders Spinner when token exists but /user-auth returns ok=false", async () => {
    mockUseAuth.mockReturnValue([{ token: "mockToken" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    renderWithOutlet(<PrivateRoute />, <div data-testid="protected">protected</div>);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  // add test case, Song Yichao, A0255686M
  it("renders Spinner when token exists but /user-auth request throws", async () => {
    mockUseAuth.mockReturnValue([{ token: "mockToken" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("network"));

    renderWithOutlet(<PrivateRoute />, <div data-testid="protected">protected</div>);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    // Component should fail closed: still spinner
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });
});
