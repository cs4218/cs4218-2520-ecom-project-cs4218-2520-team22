import React from "react";
import { render, screen, act } from "@testing-library/react";
import Spinner from "./Spinner";
import { useNavigate, useLocation } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner component", () => {
  let mockNavigate;
  let mockLocation;
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate = jest.fn();
    mockLocation = { pathname: "/current" };
    require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);
    require("react-router-dom").useLocation.mockReturnValue(mockLocation);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders spinner and initial countdown", () => {
    render(<Spinner />);
    expect(
      screen.getByText(/redirecting to you in 3 second/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("counts down every second and navigates after reaching 0", () => {
    render(<Spinner />);
    // 3 -> 2
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 2 second/i),
    ).toBeInTheDocument();
    // 2 -> 1
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText(/redirecting to you in 1 second/i),
    ).toBeInTheDocument();
    // 1 -> 0, triggers navigation
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/current" });
  });

  it("navigates to custom path if provided", () => {
    render(<Spinner path="register" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/register", {
      state: "/current",
    });
  });

  it("cleans up interval on unmount", () => {
    const { unmount } = render(<Spinner />);
    const clearSpy = jest.spyOn(global, "clearInterval");
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("does not navigate before countdown reaches 0", () => {
    render(<Spinner />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders with correct styles and classes", () => {
    render(<Spinner />);
    const container = screen.getByText(/redirecting to you/i).parentElement;
    expect(container).toHaveClass(
      "d-flex",
      "flex-column",
      "justify-content-center",
      "align-items-center",
    );
    expect(container).toHaveStyle({ height: "100vh" });
    expect(screen.getByRole("status")).toHaveClass("spinner-border");
  });
});
