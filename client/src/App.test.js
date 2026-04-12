import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import App from "./App";

// Note: These tests are meant to protect against unintended regressions and not much more!

jest.mock("axios");

const mockUseAuth = jest.fn();
jest.mock("./context/auth", () => ({
	useAuth: () => mockUseAuth(),
}));

jest.mock("./components/Spinner", () => () => <div>SPINNER</div>);

jest.mock("./pages/HomePage", () => () => <div>HOME_PAGE</div>);
jest.mock("./pages/About", () => () => <div>ABOUT_PAGE</div>);
jest.mock("./pages/Contact", () => () => <div>CONTACT_PAGE</div>);
jest.mock("./pages/Policy", () => () => <div>POLICY_PAGE</div>);
jest.mock("./pages/Pagenotfound", () => () => <div>NOT_FOUND_PAGE</div>);
jest.mock("./pages/Auth/Register", () => () => <div>REGISTER_PAGE</div>);
jest.mock("./pages/Auth/Login", () => () => <div>LOGIN_PAGE</div>);
jest.mock("./pages/Auth/ForgotPassword", () => () => <div>FORGOT_PASSWORD_PAGE</div>);
jest.mock("./pages/Search", () => () => <div>SEARCH_PAGE</div>);
jest.mock("./pages/ProductDetails", () => () => <div>PRODUCT_DETAILS_PAGE</div>);
jest.mock("./pages/Categories", () => () => <div>CATEGORIES_PAGE</div>);
jest.mock("./pages/CategoryProduct", () => () => <div>CATEGORY_PRODUCT_PAGE</div>);
jest.mock("./pages/CartPage", () => () => <div>CART_PAGE</div>);

jest.mock("./pages/user/Dashboard", () => () => <div>USER_DASHBOARD_PAGE</div>);
jest.mock("./pages/user/Orders", () => () => <div>USER_ORDERS_PAGE</div>);
jest.mock("./pages/user/Profile", () => () => <div>USER_PROFILE_PAGE</div>);

jest.mock("./pages/admin/AdminDashboard", () => () => <div>ADMIN_DASHBOARD_PAGE</div>);
jest.mock("./pages/admin/CreateCategory", () => () => <div>ADMIN_CREATE_CATEGORY_PAGE</div>);
jest.mock("./pages/admin/CreateProduct", () => () => <div>ADMIN_CREATE_PRODUCT_PAGE</div>);
jest.mock("./pages/admin/Users", () => () => <div>ADMIN_USERS_PAGE</div>);
jest.mock("./pages/admin/Products", () => () => <div>ADMIN_PRODUCTS_PAGE</div>);
jest.mock("./pages/admin/UpdateProduct", () => () => <div>ADMIN_UPDATE_PRODUCT_PAGE</div>);
jest.mock("./pages/admin/AdminOrders", () => () => <div>ADMIN_ORDERS_PAGE</div>);

const renderAt = (path) =>
	render(
		<MemoryRouter initialEntries={[path]}>
			<App />
		</MemoryRouter>
	);

const userProtectedRoutes = [
	["/dashboard/user", "USER_DASHBOARD_PAGE"],
	["/dashboard/user/orders", "USER_ORDERS_PAGE"],
	["/dashboard/user/profile", "USER_PROFILE_PAGE"],
];

const adminProtectedRoutes = [
	["/dashboard/admin", "ADMIN_DASHBOARD_PAGE"],
	["/dashboard/admin/create-category", "ADMIN_CREATE_CATEGORY_PAGE"],
	["/dashboard/admin/create-product", "ADMIN_CREATE_PRODUCT_PAGE"],
	["/dashboard/admin/product/test-slug", "ADMIN_UPDATE_PRODUCT_PAGE"],
	["/dashboard/admin/products", "ADMIN_PRODUCTS_PAGE"],
	["/dashboard/admin/users", "ADMIN_USERS_PAGE"],
	["/dashboard/admin/orders", "ADMIN_ORDERS_PAGE"],
];

describe("App protected routing", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test.each(userProtectedRoutes)(
		"denies logged-out access to %s",
		async (path, pageMarker) => {
			mockUseAuth.mockReturnValue([{ token: "", user: null }, jest.fn()]);

			renderAt(path);

			expect(screen.getByText("SPINNER")).toBeInTheDocument();
			expect(screen.queryByText(pageMarker)).not.toBeInTheDocument();
			expect(axios.get).not.toHaveBeenCalled();
		}
	);

	test.each(userProtectedRoutes)(
		"allows logged-in user access to %s",
		async (path, pageMarker) => {
			mockUseAuth.mockReturnValue([{ token: "user-token", user: { role: 0 } }, jest.fn()]);
			axios.get.mockImplementation((url) => {
				if (url === "/api/v1/auth/user-auth") {
					return Promise.resolve({ data: { ok: true } });
				}
				return Promise.resolve({ data: { ok: false } });
			});

			renderAt(path);

			await waitFor(() => {
				expect(screen.getByText(pageMarker)).toBeInTheDocument();
			});
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
		}
	);

	test.each(adminProtectedRoutes)(
		"denies non-admin access to %s",
		async (path, pageMarker) => {
			mockUseAuth.mockReturnValue([{ token: "user-token", user: { role: 0 } }, jest.fn()]);
			axios.get.mockImplementation((url) => {
				if (url === "/api/v1/auth/admin-auth") {
					return Promise.resolve({ data: { ok: false } });
				}
				return Promise.resolve({ data: { ok: false } });
			});

			renderAt(path);

			await waitFor(() => {
				expect(screen.getByText("SPINNER")).toBeInTheDocument();
			});
			expect(screen.queryByText(pageMarker)).not.toBeInTheDocument();
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
		}
	);

	test.each(adminProtectedRoutes)(
		"allows admin access to %s",
		async (path, pageMarker) => {
			mockUseAuth.mockReturnValue([{ token: "admin-token", user: { role: 1 } }, jest.fn()]);
			axios.get.mockImplementation((url) => {
				if (url === "/api/v1/auth/admin-auth") {
					return Promise.resolve({ data: { ok: true } });
				}
				return Promise.resolve({ data: { ok: false } });
			});

			renderAt(path);

			await waitFor(() => {
				expect(screen.getByText(pageMarker)).toBeInTheDocument();
			});
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
		}
	);
});
