import Modal from "@/components/Modal";
import { render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";

describe("Modal", () => {
  it("renders description text and triggers actions", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <Modal
        open
        title="Dialog title"
        description="Dialog description"
        actions={[{ label: "Confirm", onClick: onConfirm }]}
        onClose={onClose}
      >
        <p>Child content</p>
      </Modal>,
    );

    expect(screen.getByText("Dialog title")).toBeInTheDocument();
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows loader when action is pending", () => {
    render(
      <Modal
        open
        title="Loader"
        actions={[{ label: "Saving", onClick: vi.fn(), loading: true }]}
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders custom node descriptions without wrapping", () => {
    const description = <span data-testid="custom-desc">Custom description</span>;
    render(
      <Modal open title="Node desc" description={description}>
        <div>Body</div>
      </Modal>,
    );

    expect(screen.getByTestId("custom-desc")).toHaveTextContent("Custom description");
  });

  it("renders content when description absent", () => {
    render(
      <Modal open title="Only content">
        <p>Body only</p>
      </Modal>,
    );

    expect(screen.getByText("Body only")).toBeInTheDocument();
  });
});
