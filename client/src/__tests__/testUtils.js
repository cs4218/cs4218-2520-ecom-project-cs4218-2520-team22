// Song Yichao, A0255686M

import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

/**
 * Render a UI inside MemoryRouter and optionally wrap it in Routes/Route.
 * Useful for unit-testing components that require router context.
 */
export function renderWithRouter(ui, { route = "/", path = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * For testing PrivateRoute which uses Outlet:
 * You pass element={<PrivateRoute />} and a child element to assert.
 */
export function renderWithOutlet(wrapperElement, outletElement, { route = "/", outletPath = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={wrapperElement}>
          <Route path={outletPath} element={outletElement} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}
