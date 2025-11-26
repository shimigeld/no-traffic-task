import EmptyStateList from "@/components/EmptyStateList";
import { render, screen } from "../test-utils";

describe("EmptyStateList", () => {
  it("renders the default empty state message", () => {
    render(<EmptyStateList />);
    expect(screen.getByText(/no polygons yet/i)).toBeInTheDocument();
  });
});
