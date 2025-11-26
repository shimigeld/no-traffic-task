import Loader from "@/components/Loader";
import { render, screen } from "../test-utils";

describe("Loader", () => {
  it("shows spinner text", () => {
    render(<Loader />);
    expect(screen.getByText(/loading polygons/i)).toBeVisible();
  });
});
