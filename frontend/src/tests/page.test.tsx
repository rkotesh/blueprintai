import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LandingPage from "../app/page";

describe("LandingPage", () => {
  it("renders the main heading and call to action", () => {
    render(<LandingPage />);
    expect(screen.getByText(/We help you understand what you built/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start Building Your Project/i })).toBeInTheDocument();
  });
});
