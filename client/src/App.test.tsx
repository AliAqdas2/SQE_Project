import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderAppAt } from "@/test/render-app-at";

describe("main app UI (AppRouter + providers)", () => {
  it("shows the landing hero on /", () => {
    renderAppAt("/");
    expect(screen.getByTestId("text-hero-title")).toHaveTextContent(
      "Your All-in-One Platform for Charity & Faith",
    );
  });

  it("shows the primary landing CTA (hero)", () => {
    renderAppAt("/");
    const ctas = screen.getAllByTestId("button-start-free-hero");
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    expect(ctas[0]).toHaveAccessibleName(/start free today/i);
  });

  it("renders the organization login screen on /login", () => {
    renderAppAt("/login");
    expect(screen.getByTestId("text-login-title")).toHaveTextContent(
      "Sign in to Plegit",
    );
  });

  it("renders the Eco Admin login screen on /eco-admin/login", () => {
    renderAppAt("/eco-admin/login");
    expect(screen.getByTestId("text-ecoadmin-login-title")).toHaveTextContent(
      "Eco Admin Portal",
    );
  });

  it("renders the not-found page for unknown routes", () => {
    renderAppAt("/this-route-should-not-exist-xyz");
    expect(
      screen.getByRole("heading", { name: /404 page not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/did you forget to add the page/i)).toBeInTheDocument();
  });
});
